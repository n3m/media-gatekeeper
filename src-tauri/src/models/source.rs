use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Source {
    pub id: String,
    pub creator_id: String,
    pub platform: String,
    pub channel_url: String,
    pub channel_name: Option<String>,
    pub credential_id: Option<String>,
    pub status: String,
    pub last_synced_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSourceRequest {
    pub creator_id: String,
    pub platform: String,
    pub channel_url: String,
    pub credential_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSourceRequest {
    pub channel_url: Option<String>,
    pub credential_id: Option<String>,
    pub status: Option<String>,
    pub channel_name: Option<String>,
}
