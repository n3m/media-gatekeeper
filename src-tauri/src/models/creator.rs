use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Creator {
    pub id: String,
    pub name: String,
    pub photo_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCreatorRequest {
    pub name: String,
    pub photo_path: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCreatorRequest {
    pub name: Option<String>,
    pub photo_path: Option<String>,
}
