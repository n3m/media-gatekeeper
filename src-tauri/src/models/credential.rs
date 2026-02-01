use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Credential {
    pub id: String,
    pub label: String,
    pub platform: String,
    pub cookie_path: String,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCredentialRequest {
    pub label: String,
    pub platform: String,
    pub cookie_path: String,
    pub is_default: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCredentialRequest {
    pub label: Option<String>,
    pub cookie_path: Option<String>,
    pub is_default: Option<bool>,
}
