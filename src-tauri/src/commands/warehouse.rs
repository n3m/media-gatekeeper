use crate::db::Database;
use crate::models::warehouse_item::{CreateWarehouseItemRequest, WarehouseItem};
use chrono::Utc;
use tauri::State;
use uuid::Uuid;

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
