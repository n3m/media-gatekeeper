use crate::db::Database;
use crate::models::warehouse_item::{CreateWarehouseItemRequest, WarehouseItem};
use chrono::Utc;
use serde::Deserialize;
use std::path::Path;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct ImportVideoRequest {
    pub source_path: String,      // Full path to source video file
    pub creator_id: String,
    pub title: String,
    pub platform: Option<String>, // "youtube", "patreon", "other"
}

#[tauri::command]
pub fn get_warehouse_items_by_creator(db: State<Database>, creator_id: String) -> Result<Vec<WarehouseItem>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, creator_id, feed_item_id, title, file_path, thumbnail_path, platform, original_url, published_at, duration, file_size, imported_at, is_manual_import
             FROM warehouse_items WHERE creator_id = ? ORDER BY imported_at DESC"
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([&creator_id], |row| {
            Ok(WarehouseItem {
                id: row.get(0)?,
                creator_id: row.get(1)?,
                feed_item_id: row.get(2)?,
                title: row.get(3)?,
                file_path: row.get(4)?,
                thumbnail_path: row.get(5)?,
                platform: row.get(6)?,
                original_url: row.get(7)?,
                published_at: row.get(8)?,
                duration: row.get(9)?,
                file_size: row.get(10)?,
                imported_at: row.get(11)?,
                is_manual_import: row.get::<_, i32>(12)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub fn create_warehouse_item(db: State<Database>, request: CreateWarehouseItemRequest) -> Result<WarehouseItem, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let is_manual_import_int: i32 = if request.is_manual_import { 1 } else { 0 };

    conn.execute(
        "INSERT INTO warehouse_items (id, creator_id, feed_item_id, title, file_path, thumbnail_path, platform, original_url, published_at, duration, file_size, imported_at, is_manual_import)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            &id,
            &request.creator_id,
            &request.feed_item_id,
            &request.title,
            &request.file_path,
            &request.thumbnail_path,
            &request.platform,
            &request.original_url,
            &request.published_at,
            &request.duration,
            &request.file_size,
            &now,
            &is_manual_import_int,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(WarehouseItem {
        id,
        creator_id: request.creator_id,
        feed_item_id: request.feed_item_id,
        title: request.title,
        file_path: request.file_path,
        thumbnail_path: request.thumbnail_path,
        platform: request.platform,
        original_url: request.original_url,
        published_at: request.published_at,
        duration: request.duration,
        file_size: request.file_size,
        imported_at: now,
        is_manual_import: request.is_manual_import,
    })
}

#[tauri::command]
pub fn delete_warehouse_item(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM warehouse_items WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get the library path from app_settings
fn get_library_path(db: &Database) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT value FROM app_settings WHERE key = 'library_path'",
        [],
        |row| row.get(0),
    )
    .map_err(|e| format!("Failed to get library_path: {}", e))
}

/// Get creator name by id
fn get_creator_name(db: &Database, creator_id: &str) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT name FROM creators WHERE id = ?",
        [creator_id],
        |row| row.get(0),
    )
    .map_err(|e| format!("Creator not found: {}", e))
}

/// Sanitize a string for use as a filename
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

#[tauri::command]
pub fn import_video(db: State<Database>, request: ImportVideoRequest) -> Result<WarehouseItem, String> {
    // 1. Get creator name for destination path
    let creator_name = get_creator_name(&db, &request.creator_id)?;

    // 2. Get library_path from app_settings
    let library_path = get_library_path(&db)?;

    // 3. Validate source file exists
    let source_path = Path::new(&request.source_path);
    if !source_path.exists() {
        return Err(format!("Source file does not exist: {}", request.source_path));
    }

    // 4. Get file extension from source
    let extension = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp4");

    // 5. Sanitize title for filename
    let sanitized_title = sanitize_filename(&request.title);

    // 6. Build destination: {library_path}/{creator_name}/{platform or "other"}/{sanitized_title}.{ext}
    let platform = request.platform.as_deref().unwrap_or("other");
    let sanitized_creator = sanitize_filename(&creator_name);
    let sanitized_platform = sanitize_filename(platform);
    let filename = format!("{}.{}", sanitized_title, extension);

    let dest_path = Path::new(&library_path)
        .join(&sanitized_creator)
        .join(&sanitized_platform)
        .join(&filename);

    // 7. Create directory if needed
    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // 8. Copy file from source_path to destination
    std::fs::copy(&request.source_path, &dest_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;

    // 9. Get file size from metadata
    let file_size = std::fs::metadata(&dest_path)
        .map(|m| m.len() as i64)
        .unwrap_or(0);

    // 10. Create WarehouseItem with is_manual_import = true
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let file_path_str = dest_path
        .to_str()
        .ok_or("Failed to convert path to string")?
        .to_string();

    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO warehouse_items (id, creator_id, feed_item_id, title, file_path, thumbnail_path, platform, original_url, published_at, duration, file_size, imported_at, is_manual_import)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            &id,
            &request.creator_id,
            &Option::<String>::None, // feed_item_id
            &request.title,
            &file_path_str,
            &Option::<String>::None, // thumbnail_path
            &Some(platform.to_string()),
            &Option::<String>::None, // original_url
            &Option::<String>::None, // published_at
            &Option::<i64>::None, // duration
            &file_size,
            &now,
            &1i32, // is_manual_import = true
        ),
    )
    .map_err(|e| e.to_string())?;

    // 11. Return the WarehouseItem
    Ok(WarehouseItem {
        id,
        creator_id: request.creator_id,
        feed_item_id: None,
        title: request.title,
        file_path: file_path_str,
        thumbnail_path: None,
        platform: Some(platform.to_string()),
        original_url: None,
        published_at: None,
        duration: None,
        file_size,
        imported_at: now,
        is_manual_import: true,
    })
}
