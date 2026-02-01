use crate::db::Database;
use crate::models::app_settings::{AppSettings, UpdateAppSettingsRequest};
use rusqlite::OptionalExtension;
use std::path::PathBuf;
use tauri::State;

/// Initialize default settings if they don't exist
pub fn initialize_settings(db: &Database, library_path: PathBuf) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Check if settings already exist
    let exists: Option<i64> = conn
        .query_row("SELECT id FROM app_settings WHERE id = 1", [], |row| {
            row.get(0)
        })
        .optional()
        .map_err(|e| e.to_string())?;

    if exists.is_none() {
        // Insert default settings
        let library_path_str = library_path.to_string_lossy().to_string();
        conn.execute(
            "INSERT INTO app_settings (id, library_path, default_quality, sync_interval_seconds, theme, first_run_completed, notifications_enabled, bass_boost_preset, bass_boost_custom_gain) VALUES (1, ?, 'best', 300, 'dark', 0, 1, 'Default', 5)",
            [&library_path_str],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_app_settings(db: State<Database>) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT library_path, default_quality, sync_interval_seconds, theme, first_run_completed, notifications_enabled, bass_boost_preset, bass_boost_custom_gain FROM app_settings WHERE id = 1",
        [],
        |row| {
            Ok(AppSettings {
                library_path: row.get(0)?,
                default_quality: row.get(1)?,
                sync_interval_seconds: row.get(2)?,
                theme: row.get(3)?,
                first_run_completed: row.get::<_, i64>(4)? != 0,
                notifications_enabled: row.get::<_, i64>(5)? != 0,
                bass_boost_preset: row.get(6)?,
                bass_boost_custom_gain: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_app_settings(
    db: State<Database>,
    request: UpdateAppSettingsRequest,
) -> Result<AppSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    // Get current settings
    let mut settings = conn
        .query_row(
            "SELECT library_path, default_quality, sync_interval_seconds, theme, first_run_completed, notifications_enabled, bass_boost_preset, bass_boost_custom_gain FROM app_settings WHERE id = 1",
            [],
            |row| {
                Ok(AppSettings {
                    library_path: row.get(0)?,
                    default_quality: row.get(1)?,
                    sync_interval_seconds: row.get(2)?,
                    theme: row.get(3)?,
                    first_run_completed: row.get::<_, i64>(4)? != 0,
                    notifications_enabled: row.get::<_, i64>(5)? != 0,
                    bass_boost_preset: row.get(6)?,
                    bass_boost_custom_gain: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    // Update fields if provided
    if let Some(library_path) = request.library_path {
        settings.library_path = library_path;
    }
    if let Some(default_quality) = request.default_quality {
        settings.default_quality = default_quality;
    }
    if let Some(sync_interval_seconds) = request.sync_interval_seconds {
        settings.sync_interval_seconds = sync_interval_seconds;
    }
    if let Some(theme) = request.theme {
        settings.theme = theme;
    }
    if let Some(first_run_completed) = request.first_run_completed {
        settings.first_run_completed = first_run_completed;
    }
    if let Some(notifications_enabled) = request.notifications_enabled {
        settings.notifications_enabled = notifications_enabled;
    }
    if let Some(bass_boost_preset) = request.bass_boost_preset {
        settings.bass_boost_preset = bass_boost_preset;
    }
    if let Some(bass_boost_custom_gain) = request.bass_boost_custom_gain {
        settings.bass_boost_custom_gain = bass_boost_custom_gain;
    }

    // Save to database
    conn.execute(
        "UPDATE app_settings SET library_path = ?, default_quality = ?, sync_interval_seconds = ?, theme = ?, first_run_completed = ?, notifications_enabled = ?, bass_boost_preset = ?, bass_boost_custom_gain = ? WHERE id = 1",
        (
            &settings.library_path,
            &settings.default_quality,
            &settings.sync_interval_seconds,
            &settings.theme,
            if settings.first_run_completed { 1 } else { 0 },
            if settings.notifications_enabled { 1 } else { 0 },
            &settings.bass_boost_preset,
            &settings.bass_boost_custom_gain,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(settings)
}
