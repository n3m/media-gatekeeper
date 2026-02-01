use crate::workers::DownloadManager;
use tauri::State;

#[tauri::command]
pub fn download_items(
    download_manager: State<DownloadManager>,
    feed_item_ids: Vec<String>,
) -> Result<(), String> {
    download_manager.queue_downloads(feed_item_ids)
}

#[tauri::command]
pub fn cancel_download(
    download_manager: State<DownloadManager>,
    feed_item_id: String,
) -> Result<(), String> {
    download_manager.cancel_download(feed_item_id)
}
