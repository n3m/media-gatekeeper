use crate::db::Database;
use crate::services::{get_ytdlp_path, PatreonFetcher, YouTubeFetcher};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;
use tokio::time::{interval, sleep};

#[derive(Clone, serde::Serialize)]
pub struct MetadataEvent {
    pub feed_item_id: String,
    pub status: String,
    pub message: Option<String>,
}

pub enum MetadataCommand {
    FetchImmediate(Vec<String>),
    Pause,
    Resume,
}

struct FeedItemInfo {
    id: String,
    external_id: String,
    platform: String,
    credential_id: Option<String>,
}

pub struct MetadataWorker {
    sender: mpsc::Sender<MetadataCommand>,
}

impl MetadataWorker {
    pub fn new(app_handle: AppHandle) -> Self {
        let (sender, rx) = mpsc::channel::<MetadataCommand>(100);

        let worker = Self { sender };

        // Start the background worker
        worker.start_worker(app_handle, rx);

        worker
    }

    fn start_worker(&self, app_handle: AppHandle, mut rx: mpsc::Receiver<MetadataCommand>) {
        tauri::async_runtime::spawn(async move {
            // Background processing interval (5 seconds)
            let mut background_interval = interval(Duration::from_secs(5));
            let paused = Arc::new(AtomicBool::new(false));

            loop {
                tokio::select! {
                    _ = background_interval.tick() => {
                        // Only process background items if not paused
                        if !paused.load(Ordering::SeqCst) {
                            Self::process_background_batch(&app_handle).await;
                        }
                    }
                    Some(cmd) = rx.recv() => {
                        match cmd {
                            MetadataCommand::FetchImmediate(feed_item_ids) => {
                                // Pause background processing during immediate fetch
                                paused.store(true, Ordering::SeqCst);

                                // Process immediate requests with 500ms delay between items
                                for feed_item_id in feed_item_ids {
                                    Self::fetch_single_item_metadata(&app_handle, &feed_item_id).await;
                                    sleep(Duration::from_millis(500)).await;
                                }

                                // Resume background processing
                                paused.store(false, Ordering::SeqCst);
                            }
                            MetadataCommand::Pause => {
                                paused.store(true, Ordering::SeqCst);
                            }
                            MetadataCommand::Resume => {
                                paused.store(false, Ordering::SeqCst);
                            }
                        }
                    }
                }
            }
        });
    }

    /// Process a batch of incomplete items in the background
    async fn process_background_batch(app_handle: &AppHandle) {
        // Get up to 5 items with incomplete metadata
        let items = Self::get_incomplete_items(app_handle, 5);

        for item in items {
            Self::fetch_single_item_metadata(app_handle, &item.id).await;
            // 1 second delay between background items (rate limiting)
            sleep(Duration::from_secs(1)).await;
        }
    }

    /// Get feed items with incomplete metadata
    fn get_incomplete_items(app_handle: &AppHandle, limit: usize) -> Vec<FeedItemInfo> {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let mut stmt = match conn.prepare(
            "SELECT fi.id, fi.external_id, s.platform, s.credential_id
             FROM feed_items fi
             JOIN sources s ON fi.source_id = s.id
             WHERE fi.metadata_complete = 0
             ORDER BY fi.created_at DESC
             LIMIT ?"
        ) {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        stmt.query_map([limit as i64], |row| {
            Ok(FeedItemInfo {
                id: row.get(0)?,
                external_id: row.get(1)?,
                platform: row.get(2)?,
                credential_id: row.get(3)?,
            })
        })
        .ok()
        .map(|rows| rows.filter_map(|r| r.ok()).collect())
        .unwrap_or_default()
    }

    /// Get feed items with incomplete metadata for a specific creator
    pub fn get_incomplete_items_for_creator(
        app_handle: &AppHandle,
        creator_id: &str,
        limit: usize,
    ) -> Vec<String> {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return Vec::new(),
        };

        let mut stmt = match conn.prepare(
            "SELECT fi.id
             FROM feed_items fi
             JOIN sources s ON fi.source_id = s.id
             WHERE s.creator_id = ? AND fi.metadata_complete = 0
             ORDER BY fi.created_at DESC
             LIMIT ?"
        ) {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        stmt.query_map(rusqlite::params![creator_id, limit as i64], |row| row.get(0))
            .ok()
            .map(|rows| rows.filter_map(|r| r.ok()).collect())
            .unwrap_or_default()
    }

    /// Fetch metadata for a single feed item
    async fn fetch_single_item_metadata(app_handle: &AppHandle, feed_item_id: &str) {
        // Emit started event
        let _ = app_handle.emit(
            "metadata_update",
            MetadataEvent {
                feed_item_id: feed_item_id.to_string(),
                status: "started".to_string(),
                message: None,
            },
        );

        // Get feed item info
        let item_info = Self::get_feed_item_info(app_handle, feed_item_id);
        let info = match item_info {
            Some(info) => info,
            None => {
                Self::emit_error(app_handle, feed_item_id, "Feed item not found");
                return;
            }
        };

        // Get yt-dlp path
        let ytdlp_path = match get_ytdlp_path(app_handle) {
            Ok(path) => path,
            Err(e) => {
                Self::emit_error(app_handle, feed_item_id, &e);
                return;
            }
        };

        // Fetch metadata based on platform
        let result = match info.platform.as_str() {
            "youtube" => {
                let ytdlp = ytdlp_path.clone();
                let external_id = info.external_id.clone();
                tokio::task::spawn_blocking(move || {
                    YouTubeFetcher::fetch_video_metadata(&external_id, &ytdlp)
                        .map(|video| {
                            (
                                video.upload_date.and_then(|d| YouTubeFetcher::parse_upload_date(&d)),
                                video.duration.map(|d| d as i64),
                                video.thumbnail,
                            )
                        })
                })
                .await
                .map_err(|e| format!("Task panicked: {}", e))
                .and_then(|r| r)
            }
            "patreon" => {
                // Get cookie path from credential
                let cookie_path = match Self::get_cookie_path(app_handle, info.credential_id.as_deref()) {
                    Some(path) => path,
                    None => {
                        Self::emit_error(
                            app_handle,
                            feed_item_id,
                            "No credential configured for Patreon source",
                        );
                        return;
                    }
                };

                let ytdlp = ytdlp_path.clone();
                let external_id = info.external_id.clone();
                tokio::task::spawn_blocking(move || {
                    PatreonFetcher::fetch_post_metadata(&external_id, &cookie_path, &ytdlp)
                        .map(|post| {
                            (
                                post.upload_date.and_then(|d| PatreonFetcher::parse_upload_date(&d)),
                                post.duration.map(|d| d as i64),
                                post.thumbnail,
                            )
                        })
                })
                .await
                .map_err(|e| format!("Task panicked: {}", e))
                .and_then(|r| r)
            }
            _ => {
                Self::emit_error(app_handle, feed_item_id, &format!("Unknown platform: {}", info.platform));
                return;
            }
        };

        match result {
            Ok((published_at, duration, thumbnail)) => {
                // Update feed item with metadata
                Self::update_feed_item_metadata(app_handle, feed_item_id, published_at, duration, thumbnail);

                let _ = app_handle.emit(
                    "metadata_update",
                    MetadataEvent {
                        feed_item_id: feed_item_id.to_string(),
                        status: "completed".to_string(),
                        message: None,
                    },
                );
            }
            Err(e) => {
                Self::emit_error(app_handle, feed_item_id, &e);
            }
        }
    }

    fn get_feed_item_info(app_handle: &AppHandle, feed_item_id: &str) -> Option<FeedItemInfo> {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock().ok()?;

        conn.query_row(
            "SELECT fi.id, fi.external_id, s.platform, s.credential_id
             FROM feed_items fi
             JOIN sources s ON fi.source_id = s.id
             WHERE fi.id = ?",
            [feed_item_id],
            |row| {
                Ok(FeedItemInfo {
                    id: row.get(0)?,
                    external_id: row.get(1)?,
                    platform: row.get(2)?,
                    credential_id: row.get(3)?,
                })
            },
        )
        .ok()
    }

    fn get_cookie_path(app_handle: &AppHandle, credential_id: Option<&str>) -> Option<String> {
        let db = app_handle.state::<Database>();
        let conn = db.conn.lock().ok()?;

        match credential_id {
            Some(cred_id) => conn
                .query_row(
                    "SELECT cookie_path FROM credentials WHERE id = ?",
                    [cred_id],
                    |row| row.get(0),
                )
                .ok(),
            None => conn
                .query_row(
                    "SELECT cookie_path FROM credentials WHERE platform = 'patreon' AND is_default = 1",
                    [],
                    |row| row.get(0),
                )
                .ok(),
        }
    }

    fn update_feed_item_metadata(
        app_handle: &AppHandle,
        feed_item_id: &str,
        published_at: Option<String>,
        duration: Option<i64>,
        thumbnail: Option<String>,
    ) {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return,
        };
        // Update with new metadata and mark as complete
        let _ = conn.execute(
            "UPDATE feed_items SET
                published_at = COALESCE(?, published_at),
                duration = COALESCE(?, duration),
                thumbnail_url = COALESCE(?, thumbnail_url),
                metadata_complete = 1
             WHERE id = ?",
            rusqlite::params![published_at, duration, thumbnail, feed_item_id],
        );
    }

    fn emit_error(app_handle: &AppHandle, feed_item_id: &str, message: &str) {
        let _ = app_handle.emit(
            "metadata_update",
            MetadataEvent {
                feed_item_id: feed_item_id.to_string(),
                status: "error".to_string(),
                message: Some(message.to_string()),
            },
        );
    }

    pub fn fetch_immediate(&self, feed_item_ids: Vec<String>) -> Result<(), String> {
        self.sender
            .try_send(MetadataCommand::FetchImmediate(feed_item_ids))
            .map_err(|e| format!("Failed to queue metadata fetch: {}", e))
    }

    pub fn pause(&self) -> Result<(), String> {
        self.sender
            .try_send(MetadataCommand::Pause)
            .map_err(|e| format!("Failed to pause metadata worker: {}", e))
    }

    pub fn resume(&self) -> Result<(), String> {
        self.sender
            .try_send(MetadataCommand::Resume)
            .map_err(|e| format!("Failed to resume metadata worker: {}", e))
    }
}
