use crate::db::Database;
use crate::models::feed_item::{CreateFeedItemRequest, FeedItem, FeedItemCounts, UpdateFeedItemRequest};
use chrono::Utc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_feed_items_by_source(db: State<Database>, source_id: String) -> Result<Vec<FeedItem>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, source_id, external_id, title, thumbnail_url, published_at, duration, download_status, warehouse_item_id, metadata_complete, created_at
             FROM feed_items WHERE source_id = ? ORDER BY published_at DESC"
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([&source_id], |row| {
            Ok(FeedItem {
                id: row.get(0)?,
                source_id: row.get(1)?,
                external_id: row.get(2)?,
                title: row.get(3)?,
                thumbnail_url: row.get(4)?,
                published_at: row.get(5)?,
                duration: row.get(6)?,
                download_status: row.get(7)?,
                warehouse_item_id: row.get(8)?,
                metadata_complete: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub fn get_feed_items_by_creator(db: State<Database>, creator_id: String) -> Result<Vec<FeedItem>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT fi.id, fi.source_id, fi.external_id, fi.title, fi.thumbnail_url, fi.published_at, fi.duration, fi.download_status, fi.warehouse_item_id, fi.metadata_complete, fi.created_at
             FROM feed_items fi
             JOIN sources s ON fi.source_id = s.id
             WHERE s.creator_id = ?
             ORDER BY fi.published_at DESC"
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([&creator_id], |row| {
            Ok(FeedItem {
                id: row.get(0)?,
                source_id: row.get(1)?,
                external_id: row.get(2)?,
                title: row.get(3)?,
                thumbnail_url: row.get(4)?,
                published_at: row.get(5)?,
                duration: row.get(6)?,
                download_status: row.get(7)?,
                warehouse_item_id: row.get(8)?,
                metadata_complete: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub fn create_feed_item(db: State<Database>, request: CreateFeedItemRequest) -> Result<FeedItem, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO feed_items (id, source_id, external_id, title, thumbnail_url, published_at, duration, download_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'not_downloaded', ?)",
        (&id, &request.source_id, &request.external_id, &request.title, &request.thumbnail_url, &request.published_at, &request.duration, &now),
    )
    .map_err(|e| e.to_string())?;

    Ok(FeedItem {
        id,
        source_id: request.source_id,
        external_id: request.external_id,
        title: request.title,
        thumbnail_url: request.thumbnail_url,
        published_at: request.published_at,
        duration: request.duration,
        download_status: "not_downloaded".to_string(),
        warehouse_item_id: None,
        metadata_complete: false,
        created_at: now,
    })
}

#[tauri::command]
pub fn create_feed_items_batch(db: State<Database>, items: Vec<CreateFeedItemRequest>) -> Result<i32, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let mut inserted = 0;

    for request in items {
        let id = Uuid::new_v4().to_string();

        // Use INSERT OR IGNORE to skip duplicates (based on source_id + external_id unique constraint)
        let result = conn.execute(
            "INSERT OR IGNORE INTO feed_items (id, source_id, external_id, title, thumbnail_url, published_at, duration, download_status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'not_downloaded', ?)",
            (&id, &request.source_id, &request.external_id, &request.title, &request.thumbnail_url, &request.published_at, &request.duration, &now),
        );

        if let Ok(rows) = result {
            inserted += rows as i32;
        }
    }

    Ok(inserted)
}

#[tauri::command]
pub fn update_feed_item(db: State<Database>, id: String, request: UpdateFeedItemRequest) -> Result<FeedItem, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get current feed item
    let mut item = conn
        .query_row(
            "SELECT id, source_id, external_id, title, thumbnail_url, published_at, duration, download_status, warehouse_item_id, metadata_complete, created_at
             FROM feed_items WHERE id = ?",
            [&id],
            |row| {
                Ok(FeedItem {
                    id: row.get(0)?,
                    source_id: row.get(1)?,
                    external_id: row.get(2)?,
                    title: row.get(3)?,
                    thumbnail_url: row.get(4)?,
                    published_at: row.get(5)?,
                    duration: row.get(6)?,
                    download_status: row.get(7)?,
                    warehouse_item_id: row.get(8)?,
                    metadata_complete: row.get(9)?,
                    created_at: row.get(10)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Update fields
    if let Some(download_status) = request.download_status {
        item.download_status = download_status;
    }
    if let Some(warehouse_item_id) = request.warehouse_item_id {
        item.warehouse_item_id = Some(warehouse_item_id);
    }

    conn.execute(
        "UPDATE feed_items SET download_status = ?, warehouse_item_id = ? WHERE id = ?",
        (&item.download_status, &item.warehouse_item_id, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(item)
}

#[tauri::command]
pub fn get_feed_item_counts(db: State<Database>, creator_id: String) -> Result<FeedItemCounts, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let total: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM feed_items fi JOIN sources s ON fi.source_id = s.id WHERE s.creator_id = ?",
            [&creator_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let downloaded: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM feed_items fi JOIN sources s ON fi.source_id = s.id WHERE s.creator_id = ? AND fi.download_status = 'downloaded'",
            [&creator_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(FeedItemCounts {
        total: total as i32,
        downloaded: downloaded as i32,
        not_downloaded: (total - downloaded) as i32,
    })
}
