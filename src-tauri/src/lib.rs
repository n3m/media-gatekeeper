mod commands;
mod db;
mod models;
mod services;
mod workers;

use db::Database;
use tauri::Manager;
use workers::{DownloadManager, SyncManager};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            let database = Database::new(app_data_dir.clone())
                .expect("Failed to initialize database");

            database.run_migrations()
                .expect("Failed to run migrations");

            // Initialize default app settings (library_path = app_data_dir/N3MsMediaLibrary)
            let library_path = app_data_dir.join("N3MsMediaLibrary");
            commands::settings::initialize_settings(&database, library_path)
                .expect("Failed to initialize app settings");

            app.manage(database);

            // Initialize sync manager
            let sync_manager = SyncManager::new(app.handle().clone());
            app.manage(sync_manager);

            // Initialize download manager
            let download_manager = DownloadManager::new(app.handle().clone());
            app.manage(download_manager);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::get_creators,
            commands::get_creator,
            commands::create_creator,
            commands::update_creator,
            commands::delete_creator,
            commands::get_sources_by_creator,
            commands::create_source,
            commands::update_source,
            commands::delete_source,
            commands::get_feed_items_by_source,
            commands::get_feed_items_by_creator,
            commands::create_feed_item,
            commands::create_feed_items_batch,
            commands::update_feed_item,
            commands::get_feed_item_counts,
            commands::sync_source,
            commands::sync_creator,
            commands::sync_all,
            commands::get_warehouse_items_by_creator,
            commands::create_warehouse_item,
            commands::delete_warehouse_item,
            commands::get_app_settings,
            commands::update_app_settings,
            commands::download_items,
            commands::cancel_download,
            commands::import_video,
            commands::open_file_in_default_app,
            commands::show_in_folder,
            commands::search_feed_items,
            commands::search_warehouse_items,
            commands::search_creators,
            commands::global_search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
