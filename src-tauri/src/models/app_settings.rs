use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub library_path: String,
    pub default_quality: String,
    pub sync_interval_seconds: i64,
    pub theme: String,
    pub first_run_completed: bool,
    pub notifications_enabled: bool,
    pub bass_boost_preset: String,
    pub bass_boost_custom_gain: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAppSettingsRequest {
    pub library_path: Option<String>,
    pub default_quality: Option<String>,
    pub sync_interval_seconds: Option<i64>,
    pub theme: Option<String>,
    pub first_run_completed: Option<bool>,
    pub notifications_enabled: Option<bool>,
    pub bass_boost_preset: Option<String>,
    pub bass_boost_custom_gain: Option<i64>,
}
