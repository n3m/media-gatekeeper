use crate::db::Database;
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

    /// Update source last_synced_at timestamp
    fn update_source_last_synced(app_handle: &AppHandle, source_id: &str) {
        let db = app_handle.state::<Database>();
        let conn = match db.conn.lock() {
            Ok(c) => c,
            Err(_) => return,
        };
        let now = chrono::Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE sources SET last_synced_at = ?, status = 'validated' WHERE id = ?",
            (&now, source_id),
        );
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

        // TODO: In Task 5.3, this will call the actual YouTube/Patreon fetcher
        // For now, we just emit a completed event after a short delay
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Update source last_synced_at (synchronous database operation)
        Self::update_source_last_synced(app_handle, source_id);

        // Emit sync completed event
        let _ = app_handle.emit(
            "sync_completed",
            SyncEvent {
                source_id: source_id.to_string(),
                status: "completed".to_string(),
                message: Some("Sync completed".to_string()),
                new_items: Some(0), // Will be updated when actual fetching is implemented
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
