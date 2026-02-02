use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedItem {
    pub id: String,
    pub source_id: String,
    pub external_id: String,
    pub title: String,
    pub thumbnail_url: Option<String>,
    pub published_at: Option<String>,
    pub duration: Option<i64>,
    pub download_status: String,
    pub warehouse_item_id: Option<String>,
    pub metadata_complete: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeedItemRequest {
    pub source_id: String,
    pub external_id: String,
    pub title: String,
    pub thumbnail_url: Option<String>,
    pub published_at: Option<String>,
    pub duration: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFeedItemRequest {
    pub download_status: Option<String>,
    pub warehouse_item_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct FeedItemCounts {
    pub total: i32,
    pub downloaded: i32,
    pub not_downloaded: i32,
}
