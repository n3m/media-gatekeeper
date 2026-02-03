use crate::commands::notifications::{notify_download_completed, notify_download_failed};
use crate::db::Database;
use crate::services::get_ytdlp_path;
use std::collections::HashSet;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::{mpsc, Semaphore};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Clone, serde::Serialize)]
pub struct DownloadStartedEvent {
    pub feed_item_id: String,
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgressEvent {
    pub feed_item_id: String,
    pub percent: f32,
    pub speed: String,
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadCompletedEvent {
    pub feed_item_id: String,
    pub warehouse_item_id: String,
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadErrorEvent {
    pub feed_item_id: String,
    pub error: String,
}

pub enum DownloadCommand {
    Download { feed_item_ids: Vec<String> },
    Cancel { feed_item_id: String },
}

struct DownloadInfo {
    external_id: String,
    title: String,
    platform: String,
    creator_id: String,
    creator_name: String,
    published_at: Option<String>,
    duration: Option<i64>,
}

pub struct DownloadManager {
    sender: mpsc::Sender<DownloadCommand>,
    #[allow(dead_code)]
    cancelled: Arc<Mutex<HashSet<String>>>,
}

impl DownloadManager {
    pub fn new(app_handle: AppHandle) -> Self {
        let (sender, rx) = mpsc::channel::<DownloadCommand>(100);
        let cancelled: Arc<Mutex<HashSet<String>>> = Arc::new(Mutex::new(HashSet::new()));

        let manager = Self {
            sender,
            cancelled: cancelled.clone(),
        };

        // Start the background worker
        manager.start_worker(app_handle, rx, cancelled);

        manager
    }

    fn start_worker(
        &self,
        app_handle: AppHandle,
        mut rx: mpsc::Receiver<DownloadCommand>,
        cancelled: Arc<Mutex<HashSet<String>>>,
    ) {
        tauri::async_runtime::spawn(async move {
            // Limit concurrent downloads to 2
            let semaphore = Arc::new(Semaphore::new(2));

            loop {
                match rx.recv().await {
                    Some(DownloadCommand::Download { feed_item_ids }) => {
                        for feed_item_id in feed_item_ids {
                            let app_handle = app_handle.clone();
                            let semaphore = semaphore.clone();
                            let cancelled = cancelled.clone();

                            tauri::async_runtime::spawn(async move {
                                // Acquire semaphore permit
                                let _permit = semaphore.acquire().await.unwrap();

                                // Check if cancelled before starting
                                {
                                    let cancelled_set = cancelled.lock().unwrap();
                                    if cancelled_set.contains(&feed_item_id) {
                                        return;
                                    }
                                }

                                Self::process_download(&app_handle, &feed_item_id, &cancelled)
                                    .await;
                            });
                        }
                    }
                    Some(DownloadCommand::Cancel { feed_item_id }) => {
                        let mut cancelled_set = cancelled.lock().unwrap();
                        cancelled_set.insert(feed_item_id);
                    }
                    None => {
                        // Channel closed, exit worker
                        break;
                    }
                }
            }
        });
    }

    async fn process_download(
        app_handle: &AppHandle,
        feed_item_id: &str,
        cancelled: &Arc<Mutex<HashSet<String>>>,
    ) {
        // Emit download started event
        let _ = app_handle.emit(
            "download_started",
            DownloadStartedEvent {
                feed_item_id: feed_item_id.to_string(),
            },
        );

        // Get feed item and related info
        let download_info = Self::get_download_info(app_handle, feed_item_id);

        let info = match download_info {
            Ok(info) => info,
            Err(e) => {
                Self::emit_error(app_handle, feed_item_id, &e);
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
                return;
            }
        };

        // Build output path
        let output_path = match Self::build_output_path(app_handle, &info) {
            Ok(path) => path,
            Err(e) => {
                Self::emit_error(app_handle, feed_item_id, &e);
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
                return;
            }
        };

        // Create directory if needed
        if let Some(parent) = std::path::Path::new(&output_path).parent() {
            if let Err(e) = std::fs::create_dir_all(parent) {
                Self::emit_error(app_handle, feed_item_id, &format!("Failed to create directory: {}", e));
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
                return;
            }
        }

        // Update status to downloading
        Self::update_feed_item_status(app_handle, feed_item_id, "downloading");

        // Build video URL
        let video_url = match info.platform.as_str() {
            "youtube" => format!("https://www.youtube.com/watch?v={}", info.external_id),
            _ => {
                Self::emit_error(app_handle, feed_item_id, &format!("Unsupported platform: {}", info.platform));
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
                return;
            }
        };

        // Get yt-dlp path
        let ytdlp_path = match get_ytdlp_path(app_handle) {
            Ok(path) => path,
            Err(e) => {
                Self::emit_error(app_handle, feed_item_id, &e);
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
                return;
            }
        };

        // Run yt-dlp download
        let output_path_for_download = output_path.clone();
        let result = tokio::task::spawn_blocking({
            let app_handle = app_handle.clone();
            let feed_item_id = feed_item_id.to_string();
            let cancelled = cancelled.clone();
            move || {
                Self::run_ytdlp_download(&app_handle, &feed_item_id, &video_url, &output_path_for_download, &cancelled, &ytdlp_path)
            }
        })
        .await;

        match result {
            Ok(Ok(())) => {
                // Get file size
                let file_size = std::fs::metadata(&output_path)
                    .map(|m| m.len() as i64)
                    .unwrap_or(0);

                // Create warehouse item
                match Self::create_warehouse_item(app_handle, &info, &output_path, file_size) {
                    Ok(warehouse_item_id) => {
                        // Update feed item with warehouse_item_id and status
                        Self::update_feed_item_completed(app_handle, feed_item_id, &warehouse_item_id);

                        // Send OS notification
                        notify_download_completed(app_handle, &info.title);

                        let _ = app_handle.emit(
                            "download_completed",
                            DownloadCompletedEvent {
                                feed_item_id: feed_item_id.to_string(),
                                warehouse_item_id,
                            },
                        );
                    }
                    Err(e) => {
                        // Send OS notification for failure
                        notify_download_failed(app_handle, &info.title, &e);

                        Self::emit_error(app_handle, feed_item_id, &e);
                        Self::update_feed_item_status(app_handle, feed_item_id, "error");
                    }
                }
            }
            Ok(Err(e)) => {
                // Send OS notification for failure
                notify_download_failed(app_handle, &info.title, &e);

                Self::emit_error(app_handle, feed_item_id, &e);
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
            }
            Err(e) => {
                let err_msg = format!("Task panicked: {}", e);
                // Send OS notification for failure
                notify_download_failed(app_handle, &info.title, &err_msg);

                Self::emit_error(app_handle, feed_item_id, &err_msg);
                Self::update_feed_item_status(app_handle, feed_item_id, "error");
            }
        }

        // Remove from cancelled set if present
        {
            let mut cancelled_set = cancelled.lock().unwrap();
            cancelled_set.remove(feed_item_id);
        }
    }

    fn run_ytdlp_download(
        app_handle: &AppHandle,
        feed_item_id: &str,
        video_url: &str,
        output_path: &str,
        cancelled: &Arc<Mutex<HashSet<String>>>,
        ytdlp_path: &PathBuf,
    ) -> Result<(), String> {
        let mut cmd = Command::new(ytdlp_path);
        cmd.args([
            "-f",
            "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "-o",
            output_path,
            "--newline",
            "--no-warnings",
            video_url,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let mut child = cmd.spawn()
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

        let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
        let reader = BufReader::new(stdout);

        for line in reader.lines() {
            // Check if cancelled
            {
                let cancelled_set = cancelled.lock().unwrap();
                if cancelled_set.contains(feed_item_id) {
                    let _ = child.kill();
                    return Err("Download cancelled".to_string());
                }
            }

            if let Ok(line) = line {
                // Parse progress from yt-dlp output
                // Lines look like: "[download]  50.0% of 100.00MiB at 5.00MiB/s ETA 00:10"
                if line.contains("[download]") && line.contains('%') {
                    if let Some((percent, speed)) = Self::parse_progress_line(&line) {
                        let _ = app_handle.emit(
                            "download_progress",
                            DownloadProgressEvent {
                                feed_item_id: feed_item_id.to_string(),
                                percent,
                                speed,
                            },
                        );
                    }
                }
            }
        }

        let status = child.wait().map_err(|e| format!("Failed to wait for yt-dlp: {}", e))?;

        if !status.success() {
            return Err("yt-dlp download failed".to_string());
        }

        Ok(())
    }

    fn parse_progress_line(line: &str) -> Option<(f32, String)> {
        // Parse lines like: "[download]  50.0% of 100.00MiB at 5.00MiB/s ETA 00:10"
        // Or: "[download]  50.0% of ~100.00MiB at 5.00MiB/s ETA 00:10"
        let percent_start = line.find(']')?.checked_add(1)?;
        let percent_end = line.find('%')?;

        let percent_str = line[percent_start..percent_end].trim();
        let percent: f32 = percent_str.parse().ok()?;

        // Extract speed
        let speed = if let Some(at_idx) = line.find(" at ") {
            let after_at = &line[at_idx + 4..];
            if let Some(space_idx) = after_at.find(' ') {
                after_at[..space_idx].to_string()
            } else {
                after_at.to_string()
            }
        } else {
            "Unknown".to_string()
        };

        Some((percent, speed))
    }

    fn get_download_info(app_handle: &AppHandle, feed_item_id: &str) -> Result<DownloadInfo, String> {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock().map_err(|e| e.to_string())?;

        // Get feed_item, source, and creator info in one query
        let result = conn.query_row(
            "SELECT
                fi.external_id,
                fi.title,
                fi.published_at,
                fi.duration,
                s.platform,
                s.creator_id,
                c.name
             FROM feed_items fi
             JOIN sources s ON fi.source_id = s.id
             JOIN creators c ON s.creator_id = c.id
             WHERE fi.id = ?",
            [feed_item_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, Option<i64>>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                ))
            },
        );

        match result {
            Ok((external_id, title, published_at, duration, platform, creator_id, creator_name)) => {
                Ok(DownloadInfo {
                    external_id,
                    title,
                    platform,
                    creator_id,
                    creator_name,
                    published_at,
                    duration,
                })
            }
            Err(e) => Err(format!("Feed item not found: {}", e)),
        }
    }

    fn get_library_path(app_handle: &AppHandle) -> Result<String, String> {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock().map_err(|e| e.to_string())?;

        conn.query_row(
            "SELECT library_path FROM app_settings WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to get library_path: {}", e))
    }

    fn sanitize_filename(name: &str) -> String {
        // Remove or replace special characters
        let sanitized: String = name
            .chars()
            .map(|c| match c {
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
                _ if c.is_control() => '_',
                _ => c,
            })
            .collect();

        // Limit length to 100 characters
        let truncated: String = sanitized.chars().take(100).collect();

        // Trim whitespace and trailing dots/spaces (Windows doesn't like them)
        truncated.trim().trim_end_matches(|c| c == '.' || c == ' ').to_string()
    }

    fn sanitize_path_component(name: &str) -> String {
        Self::sanitize_filename(name)
    }

    fn build_output_path(app_handle: &AppHandle, info: &DownloadInfo) -> Result<String, String> {
        let library_path = Self::get_library_path(app_handle)?;
        let creator_folder = Self::sanitize_path_component(&info.creator_name);
        let platform_folder = Self::sanitize_path_component(&info.platform);
        let sanitized_title = Self::sanitize_filename(&info.title);

        // Build filename: {external_id}__{sanitized_title}.mp4
        let filename = format!("{}__{}.mp4", info.external_id, sanitized_title);

        // Build full path: {library_path}/{creator_name}/{platform}/{filename}
        let path = std::path::Path::new(&library_path)
            .join(creator_folder)
            .join(platform_folder)
            .join(filename);

        path.to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "Failed to build output path".to_string())
    }

    fn create_warehouse_item(
        app_handle: &AppHandle,
        info: &DownloadInfo,
        file_path: &str,
        file_size: i64,
    ) -> Result<String, String> {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock().map_err(|e| e.to_string())?;

        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let original_url = match info.platform.as_str() {
            "youtube" => Some(format!("https://www.youtube.com/watch?v={}", info.external_id)),
            _ => None,
        };

        conn.execute(
            "INSERT INTO warehouse_items (
                id, creator_id, feed_item_id, title, file_path, thumbnail_path,
                platform, original_url, published_at, duration, file_size,
                imported_at, is_manual_import
            ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 0)",
            rusqlite::params![
                id,
                info.creator_id,
                Option::<String>::None, // feed_item_id will be set via update
                info.title,
                file_path,
                info.platform,
                original_url,
                info.published_at,
                info.duration,
                file_size,
                now,
            ],
        )
        .map_err(|e| format!("Failed to create warehouse item: {}", e))?;

        Ok(id)
    }

    fn update_feed_item_status(app_handle: &AppHandle, feed_item_id: &str, status: &str) {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock();
        if let Ok(conn) = conn {
            let _ = conn.execute(
                "UPDATE feed_items SET download_status = ? WHERE id = ?",
                [status, feed_item_id],
            );
        }
    }

    fn update_feed_item_completed(app_handle: &AppHandle, feed_item_id: &str, warehouse_item_id: &str) {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock();
        if let Ok(conn) = conn {
            let _ = conn.execute(
                "UPDATE feed_items SET download_status = 'downloaded', warehouse_item_id = ? WHERE id = ?",
                [warehouse_item_id, feed_item_id],
            );
            // Also update the warehouse_item to link back to feed_item
            let _ = conn.execute(
                "UPDATE warehouse_items SET feed_item_id = ? WHERE id = ?",
                [feed_item_id, warehouse_item_id],
            );
        }
    }

    fn emit_error(app_handle: &AppHandle, feed_item_id: &str, error: &str) {
        let _ = app_handle.emit(
            "download_error",
            DownloadErrorEvent {
                feed_item_id: feed_item_id.to_string(),
                error: error.to_string(),
            },
        );
    }

    pub fn queue_downloads(&self, feed_item_ids: Vec<String>) -> Result<(), String> {
        self.sender
            .try_send(DownloadCommand::Download { feed_item_ids })
            .map_err(|e| format!("Failed to queue downloads: {}", e))
    }

    pub fn cancel_download(&self, feed_item_id: String) -> Result<(), String> {
        self.sender
            .try_send(DownloadCommand::Cancel { feed_item_id })
            .map_err(|e| format!("Failed to cancel download: {}", e))
    }
}
