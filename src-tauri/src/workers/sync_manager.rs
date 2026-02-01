use crate::db::Database;
use crate::services::YouTubeFetcher;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;
use tokio::time::interval;

#[derive(Clone, serde::Serialize)]
pub struct SyncEvent {
    pub source_id: String,
    pub status: String,
    pub message: Option<String>,
    pub new_items: Option<i32>,
}

pub struct SyncManager {
    tx: mpsc::Sender<SyncCommand>,
}

#[allow(dead_code)]
pub enum SyncCommand {
    SyncSource(String),
    SyncAllForCreator(String),
    SyncAll,
    Stop,
}

impl SyncManager {
    pub fn new(app_handle: AppHandle) -> Self {
        let (tx, rx) = mpsc::channel::<SyncCommand>(100);

        let manager = Self { tx };

        // Start the background worker
        manager.start_worker(app_handle, rx);

        manager
    }

    fn start_worker(&self, app_handle: AppHandle, mut rx: mpsc::Receiver<SyncCommand>) {
        tauri::async_runtime::spawn(async move {
            // Sync interval (5 minutes = 300 seconds)
            let mut sync_interval = interval(Duration::from_secs(300));

            loop {
                tokio::select! {
                    _ = sync_interval.tick() => {
                        // Periodic sync - sync all sources
                        Self::do_sync_all_sources(&app_handle).await;
                    }
                    Some(cmd) = rx.recv() => {
                        match cmd {
                            SyncCommand::SyncSource(source_id) => {
                                Self::do_sync_source(&app_handle, &source_id).await;
                            }
                            SyncCommand::SyncAllForCreator(creator_id) => {
                                Self::do_sync_creator_sources(&app_handle, &creator_id).await;
                            }
                            SyncCommand::SyncAll => {
                                Self::do_sync_all_sources(&app_handle).await;
                            }
                            SyncCommand::Stop => {
                                break;
                            }
                        }
                    }
                }
            }
        });
    }

    /// Get all source IDs that are not in error state
    fn get_all_source_ids(app_handle: &AppHandle) -> Vec<String> {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let mut stmt = match conn.prepare("SELECT id FROM sources WHERE status != 'error'") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        stmt.query_map([], |row| row.get(0))
            .ok()
            .map(|rows| rows.filter_map(|r| r.ok()).collect())
            .unwrap_or_default()
    }

    /// Get all source IDs for a specific creator
    fn get_creator_source_ids(app_handle: &AppHandle, creator_id: &str) -> Vec<String> {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let mut stmt = match conn.prepare("SELECT id FROM sources WHERE creator_id = ?") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        stmt.query_map([creator_id], |row| row.get(0))
            .ok()
            .map(|rows| rows.filter_map(|r| r.ok()).collect())
            .unwrap_or_default()
    }

    async fn do_sync_all_sources(app_handle: &AppHandle) {
        // Collect source IDs first (synchronous, releases lock before await)
        let source_ids = Self::get_all_source_ids(app_handle);

        for source_id in source_ids {
            Self::do_sync_source(app_handle, &source_id).await;
        }
    }

    async fn do_sync_creator_sources(app_handle: &AppHandle, creator_id: &str) {
        // Collect source IDs first (synchronous, releases lock before await)
        let source_ids = Self::get_creator_source_ids(app_handle, creator_id);

        for source_id in source_ids {
            Self::do_sync_source(app_handle, &source_id).await;
        }
    }

    async fn do_sync_source(app_handle: &AppHandle, source_id: &str) {
        // Emit sync started event
        let _ = app_handle.emit(
            "sync_started",
            SyncEvent {
                source_id: source_id.to_string(),
                status: "started".to_string(),
                message: None,
                new_items: None,
            },
        );

        // Get source info
        let source_info = {
            let db = app_handle.state::<Database>();
            let conn = match db.conn.lock() {
                Ok(c) => c,
                Err(_) => {
                    Self::emit_error(app_handle, source_id, "Failed to lock database");
                    return;
                }
            };

            conn.query_row(
                "SELECT platform, channel_url FROM sources WHERE id = ?",
                [source_id],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
            )
            .ok()
        };

        let (platform, channel_url) = match source_info {
            Some(info) => info,
            None => {
                Self::emit_error(app_handle, source_id, "Source not found");
                return;
            }
        };

        // Fetch based on platform
        let result = match platform.as_str() {
            "youtube" => Self::fetch_youtube(app_handle, source_id, &channel_url).await,
            "patreon" => {
                // Patreon support will be added later
                Ok(0)
            }
            _ => Err("Unknown platform".to_string()),
        };

        match result {
            Ok(new_items) => {
                // Update source last_synced_at and status
                let db = app_handle.state::<Database>();
                if let Ok(conn) = db.conn.lock() {
                    let now = chrono::Utc::now().to_rfc3339();
                    let _ = conn.execute(
                        "UPDATE sources SET last_synced_at = ?, status = 'validated' WHERE id = ?",
                        (&now, source_id),
                    );
                }

                let _ = app_handle.emit(
                    "sync_completed",
                    SyncEvent {
                        source_id: source_id.to_string(),
                        status: "completed".to_string(),
                        message: Some(format!("Found {} new items", new_items)),
                        new_items: Some(new_items),
                    },
                );
            }
            Err(error) => {
                Self::emit_error(app_handle, source_id, &error);

                // Update source status to error
                Self::update_source_status_error(app_handle, source_id);
            }
        }
    }

    fn update_source_status_error(app_handle: &AppHandle, source_id: &str) {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return,
        };
        let _ = conn.execute(
            "UPDATE sources SET status = 'error' WHERE id = ?",
            [source_id],
        );
    }

    async fn fetch_youtube(
        app_handle: &AppHandle,
        source_id: &str,
        channel_url: &str,
    ) -> Result<i32, String> {
        // Run yt-dlp in a blocking task to not block the async runtime
        let channel_url = channel_url.to_string();
        let videos = tokio::task::spawn_blocking(move || YouTubeFetcher::fetch_channel(&channel_url))
            .await
            .map_err(|e| format!("Task panicked: {}", e))??;

        if videos.is_empty() {
            return Ok(0);
        }

        // Insert feed items into database
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock().map_err(|e| e.to_string())?;

        let now = chrono::Utc::now().to_rfc3339();
        let mut inserted = 0;

        for video in videos {
            let id = uuid::Uuid::new_v4().to_string();
            let published_at = video
                .upload_date
                .as_ref()
                .and_then(|d| YouTubeFetcher::parse_upload_date(d));
            let duration = video.duration.map(|d| d as i64);

            let result = conn.execute(
                "INSERT OR IGNORE INTO feed_items (id, source_id, external_id, title, thumbnail_url, published_at, duration, download_status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'not_downloaded', ?)",
                (&id, source_id, &video.id, &video.title, &video.thumbnail, &published_at, &duration, &now),
            );

            if let Ok(rows) = result {
                inserted += rows as i32;
            }
        }

        Ok(inserted)
    }

    fn emit_error(app_handle: &AppHandle, source_id: &str, message: &str) {
        let _ = app_handle.emit(
            "sync_error",
            SyncEvent {
                source_id: source_id.to_string(),
                status: "error".to_string(),
                message: Some(message.to_string()),
                new_items: None,
            },
        );
    }

    pub fn sync_source(&self, source_id: String) {
        let _ = self.tx.try_send(SyncCommand::SyncSource(source_id));
    }

    pub fn sync_creator(&self, creator_id: String) {
        let _ = self.tx.try_send(SyncCommand::SyncAllForCreator(creator_id));
    }

    pub fn sync_all(&self) {
        let _ = self.tx.try_send(SyncCommand::SyncAll);
    }
}
