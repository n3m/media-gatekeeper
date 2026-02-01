use crate::db::Database;
use crate::models::source::{CreateSourceRequest, Source, UpdateSourceRequest};
use chrono::Utc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_sources_by_creator(db: State<Database>, creator_id: String) -> Result<Vec<Source>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, creator_id, platform, channel_url, channel_name, credential_id, status, last_synced_at, created_at
             FROM sources WHERE creator_id = ? ORDER BY created_at DESC"
        )
        .map_err(|e| e.to_string())?;

    let sources = stmt
        .query_map([&creator_id], |row| {
            Ok(Source {
                id: row.get(0)?,
                creator_id: row.get(1)?,
                platform: row.get(2)?,
                channel_url: row.get(3)?,
                channel_name: row.get(4)?,
                credential_id: row.get(5)?,
                status: row.get(6)?,
                last_synced_at: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sources)
}

#[tauri::command]
pub fn create_source(db: State<Database>, request: CreateSourceRequest) -> Result<Source, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO sources (id, creator_id, platform, channel_url, credential_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)",
        (&id, &request.creator_id, &request.platform, &request.channel_url, &request.credential_id, &now),
    )
    .map_err(|e| e.to_string())?;

    Ok(Source {
        id,
        creator_id: request.creator_id,
        platform: request.platform,
        channel_url: request.channel_url,
        channel_name: None,
        credential_id: request.credential_id,
        status: "pending".to_string(),
        last_synced_at: None,
        created_at: now,
    })
}

#[tauri::command]
pub fn update_source(db: State<Database>, id: String, request: UpdateSourceRequest) -> Result<Source, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get current source
    let mut source = conn
        .query_row(
            "SELECT id, creator_id, platform, channel_url, channel_name, credential_id, status, last_synced_at, created_at
             FROM sources WHERE id = ?",
            [&id],
            |row| {
                Ok(Source {
                    id: row.get(0)?,
                    creator_id: row.get(1)?,
                    platform: row.get(2)?,
                    channel_url: row.get(3)?,
                    channel_name: row.get(4)?,
                    credential_id: row.get(5)?,
                    status: row.get(6)?,
                    last_synced_at: row.get(7)?,
                    created_at: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Update fields
    if let Some(channel_url) = request.channel_url {
        source.channel_url = channel_url;
    }
    if let Some(credential_id) = request.credential_id {
        source.credential_id = Some(credential_id);
    }
    if let Some(status) = request.status {
        source.status = status;
    }
    if let Some(channel_name) = request.channel_name {
        source.channel_name = Some(channel_name);
    }

    conn.execute(
        "UPDATE sources SET channel_url = ?, credential_id = ?, status = ?, channel_name = ? WHERE id = ?",
        (&source.channel_url, &source.credential_id, &source.status, &source.channel_name, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(source)
}

#[tauri::command]
pub fn delete_source(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM sources WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
