use crate::workers::MetadataWorker;
use tauri::{AppHandle, State};

/// Fetch metadata for specific feed items immediately (high priority)
#[tauri::command]
pub fn fetch_feed_items_metadata(
    metadata_worker: State<MetadataWorker>,
    feed_item_ids: Vec<String>,
) -> Result<(), String> {
    metadata_worker.fetch_immediate(feed_item_ids)
}

/// Get feed items with incomplete metadata for a specific creator
#[tauri::command]
pub fn get_incomplete_metadata_items(
    app_handle: AppHandle,
    creator_id: String,
    limit: Option<usize>,
) -> Result<Vec<String>, String> {
    let limit = limit.unwrap_or(50);
    Ok(MetadataWorker::get_incomplete_items_for_creator(
        &app_handle,
        &creator_id,
        limit,
    ))
}

/// Pause the background metadata worker
#[tauri::command]
pub fn pause_metadata_worker(metadata_worker: State<MetadataWorker>) -> Result<(), String> {
    metadata_worker.pause()
}

/// Resume the background metadata worker
#[tauri::command]
pub fn resume_metadata_worker(metadata_worker: State<MetadataWorker>) -> Result<(), String> {
    metadata_worker.resume()
}
