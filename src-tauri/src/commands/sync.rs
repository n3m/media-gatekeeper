use crate::workers::SyncManager;
use tauri::State;

#[tauri::command]
pub fn sync_source(sync_manager: State<SyncManager>, source_id: String) -> Result<(), String> {
    sync_manager.sync_source(source_id);
    Ok(())
}

#[tauri::command]
pub fn sync_creator(sync_manager: State<SyncManager>, creator_id: String) -> Result<(), String> {
    sync_manager.sync_creator(creator_id);
    Ok(())
}

#[tauri::command]
pub fn sync_all(sync_manager: State<SyncManager>) -> Result<(), String> {
    sync_manager.sync_all();
    Ok(())
}
