use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WarehouseItem {
    pub id: String,
    pub creator_id: String,
    pub feed_item_id: Option<String>,
    pub title: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub platform: Option<String>,
    pub original_url: Option<String>,
    pub published_at: Option<String>,
    pub duration: Option<i64>,
    pub file_size: i64,
    pub imported_at: String,
    pub is_manual_import: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateWarehouseItemRequest {
    pub creator_id: String,
    pub feed_item_id: Option<String>,
    pub title: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub platform: Option<String>,
    pub original_url: Option<String>,
    pub published_at: Option<String>,
    pub duration: Option<i64>,
    pub file_size: i64,
    pub is_manual_import: bool,
}
