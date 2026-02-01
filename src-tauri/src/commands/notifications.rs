use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::db::Database;

/// Check if notifications are enabled in app settings
fn notifications_enabled(db: &Database) -> bool {
    let conn = match db.conn.lock() {
        Ok(c) => c,
        Err(_) => return false,
    };

    conn.query_row(
        "SELECT notifications_enabled FROM app_settings WHERE id = 1",
        [],
        |row| row.get::<_, i32>(0),
    )
    .map(|v| v != 0)
    .unwrap_or(false)
}

/// Send a notification for sync completion
pub fn notify_sync_completed(app: &AppHandle, source_name: &str, new_items: i32) {
    let db = match app.try_state::<Database>() {
        Some(db) => db,
        None => return,
    };

    if !notifications_enabled(&db) {
        return;
    }

    let body = if new_items > 0 {
        format!("Found {} new video{}", new_items, if new_items == 1 { "" } else { "s" })
    } else {
        "No new videos found".to_string()
    };

    let _ = app
        .notification()
        .builder()
        .title(format!("Sync Complete: {}", source_name))
        .body(body)
        .show();
}

/// Send a notification for download completion
pub fn notify_download_completed(app: &AppHandle, video_title: &str) {
    let db = match app.try_state::<Database>() {
        Some(db) => db,
        None => return,
    };

    if !notifications_enabled(&db) {
        return;
    }

    let _ = app
        .notification()
        .builder()
        .title("Download Complete")
        .body(video_title)
        .show();
}

/// Send a notification for download failure
pub fn notify_download_failed(app: &AppHandle, video_title: &str, error: &str) {
    let db = match app.try_state::<Database>() {
        Some(db) => db,
        None => return,
    };

    if !notifications_enabled(&db) {
        return;
    }

    let _ = app
        .notification()
        .builder()
        .title("Download Failed")
        .body(format!("{}: {}", video_title, error))
        .show();
}

/// Tauri command to check if notification permissions are granted
#[tauri::command]
pub async fn check_notification_permission(app: AppHandle) -> Result<String, String> {
    match app.notification().permission_state() {
        Ok(state) => Ok(format!("{:?}", state)),
        Err(e) => Err(e.to_string()),
    }
}

/// Tauri command to request notification permissions
#[tauri::command]
pub async fn request_notification_permission(app: AppHandle) -> Result<String, String> {
    match app.notification().request_permission() {
        Ok(state) => Ok(format!("{:?}", state)),
        Err(e) => Err(e.to_string()),
    }
}

/// Tauri command to send a test notification
#[tauri::command]
pub async fn send_test_notification(app: AppHandle) -> Result<(), String> {
    app.notification()
        .builder()
        .title("N3Ms Media Library")
        .body("Notifications are working!")
        .show()
        .map_err(|e| e.to_string())
}
