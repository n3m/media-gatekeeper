use crate::db::Database;
use crate::models::credential::{CreateCredentialRequest, Credential, UpdateCredentialRequest};
use chrono::Utc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_credentials(db: State<Database>) -> Result<Vec<Credential>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, label, platform, cookie_path, is_default, created_at, updated_at
             FROM credentials ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let credentials = stmt
        .query_map([], |row| {
            Ok(Credential {
                id: row.get(0)?,
                label: row.get(1)?,
                platform: row.get(2)?,
                cookie_path: row.get(3)?,
                is_default: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(credentials)
}

#[tauri::command]
pub fn get_credentials_by_platform(
    db: State<Database>,
    platform: String,
) -> Result<Vec<Credential>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, label, platform, cookie_path, is_default, created_at, updated_at
             FROM credentials WHERE platform = ? ORDER BY is_default DESC, created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let credentials = stmt
        .query_map([&platform], |row| {
            Ok(Credential {
                id: row.get(0)?,
                label: row.get(1)?,
                platform: row.get(2)?,
                cookie_path: row.get(3)?,
                is_default: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(credentials)
}

#[tauri::command]
pub fn get_credential(db: State<Database>, id: String) -> Result<Credential, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, label, platform, cookie_path, is_default, created_at, updated_at
         FROM credentials WHERE id = ?",
        [&id],
        |row| {
            Ok(Credential {
                id: row.get(0)?,
                label: row.get(1)?,
                platform: row.get(2)?,
                cookie_path: row.get(3)?,
                is_default: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_credential(
    db: State<Database>,
    request: CreateCredentialRequest,
) -> Result<Credential, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let is_default = request.is_default.unwrap_or(false);

    // If this is set as default, clear other defaults for the same platform
    if is_default {
        conn.execute(
            "UPDATE credentials SET is_default = 0 WHERE platform = ?",
            [&request.platform],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "INSERT INTO credentials (id, label, platform, cookie_path, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            &id,
            &request.label,
            &request.platform,
            &request.cookie_path,
            is_default as i32,
            &now,
            &now,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(Credential {
        id,
        label: request.label,
        platform: request.platform,
        cookie_path: request.cookie_path,
        is_default,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_credential(
    db: State<Database>,
    id: String,
    request: UpdateCredentialRequest,
) -> Result<Credential, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get current credential
    let mut credential = conn
        .query_row(
            "SELECT id, label, platform, cookie_path, is_default, created_at, updated_at
             FROM credentials WHERE id = ?",
            [&id],
            |row| {
                Ok(Credential {
                    id: row.get(0)?,
                    label: row.get(1)?,
                    platform: row.get(2)?,
                    cookie_path: row.get(3)?,
                    is_default: row.get::<_, i32>(4)? != 0,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Update fields
    if let Some(label) = request.label {
        credential.label = label;
    }
    if let Some(cookie_path) = request.cookie_path {
        credential.cookie_path = cookie_path;
    }
    if let Some(is_default) = request.is_default {
        // If setting as default, clear other defaults for the same platform
        if is_default {
            conn.execute(
                "UPDATE credentials SET is_default = 0 WHERE platform = ?",
                [&credential.platform],
            )
            .map_err(|e| e.to_string())?;
        }
        credential.is_default = is_default;
    }

    let now = Utc::now().to_rfc3339();
    credential.updated_at = now;

    conn.execute(
        "UPDATE credentials SET label = ?, cookie_path = ?, is_default = ?, updated_at = ? WHERE id = ?",
        (
            &credential.label,
            &credential.cookie_path,
            credential.is_default as i32,
            &credential.updated_at,
            &id,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(credential)
}

#[tauri::command]
pub fn delete_credential(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM credentials WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_default_credential(
    db: State<Database>,
    platform: String,
) -> Result<Option<Credential>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    match conn.query_row(
        "SELECT id, label, platform, cookie_path, is_default, created_at, updated_at
         FROM credentials WHERE platform = ? AND is_default = 1",
        [&platform],
        |row| {
            Ok(Credential {
                id: row.get(0)?,
                label: row.get(1)?,
                platform: row.get(2)?,
                cookie_path: row.get(3)?,
                is_default: row.get::<_, i32>(4)? != 0,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    ) {
        Ok(credential) => Ok(Some(credential)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}
