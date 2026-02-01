use crate::db::Database;
use crate::models::creator::{CreateCreatorRequest, Creator, UpdateCreatorRequest};
use chrono::Utc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_creators(db: State<Database>) -> Result<Vec<Creator>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, photo_path, created_at, updated_at FROM creators ORDER BY name")
        .map_err(|e| e.to_string())?;

    let creators = stmt
        .query_map([], |row| {
            Ok(Creator {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(creators)
}

#[tauri::command]
pub fn get_creator(db: State<Database>, id: String) -> Result<Creator, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, name, photo_path, created_at, updated_at FROM creators WHERE id = ?",
        [&id],
        |row| {
            Ok(Creator {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_creator(
    db: State<Database>,
    request: CreateCreatorRequest,
) -> Result<Creator, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO creators (id, name, photo_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (&id, &request.name, &request.photo_path, &now, &now),
    )
    .map_err(|e| e.to_string())?;

    Ok(Creator {
        id,
        name: request.name,
        photo_path: request.photo_path,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_creator(
    db: State<Database>,
    id: String,
    request: UpdateCreatorRequest,
) -> Result<Creator, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    // Get current creator
    let mut creator = conn
        .query_row(
            "SELECT id, name, photo_path, created_at, updated_at FROM creators WHERE id = ?",
            [&id],
            |row| {
                Ok(Creator {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    photo_path: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Update fields
    if let Some(name) = request.name {
        creator.name = name;
    }
    if let Some(photo_path) = request.photo_path {
        creator.photo_path = Some(photo_path);
    }
    creator.updated_at = now;

    conn.execute(
        "UPDATE creators SET name = ?, photo_path = ?, updated_at = ? WHERE id = ?",
        (&creator.name, &creator.photo_path, &creator.updated_at, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(creator)
}

#[tauri::command]
pub fn delete_creator(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM creators WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
