use serde::Deserialize;
use std::process::Command;

#[derive(Debug, Deserialize)]
pub struct YouTubeVideo {
    pub id: String,
    pub title: String,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    pub upload_date: Option<String>,
}

pub struct YouTubeFetcher;

impl YouTubeFetcher {
    /// Fetch videos from a YouTube channel URL
    /// Returns a list of video metadata
    pub fn fetch_channel(channel_url: &str) -> Result<Vec<YouTubeVideo>, String> {
        // Use yt-dlp to get video list in JSON format
        // --flat-playlist: don't download, just list
        // --dump-json: output as JSON (one line per video)
        // --no-warnings: suppress warnings
        // --playlist-end 50: limit to 50 most recent videos
        let output = Command::new("yt-dlp")
            .args([
                "--flat-playlist",
                "--dump-json",
                "--no-warnings",
                "--playlist-end", "50",
                channel_url,
            ])
            .output()
            .map_err(|e| format!("Failed to execute yt-dlp: {}. Is yt-dlp installed?", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("yt-dlp failed: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);

        // Parse each line as a separate JSON object
        let videos: Vec<YouTubeVideo> = stdout
            .lines()
            .filter(|line| !line.trim().is_empty())
            .filter_map(|line| {
                serde_json::from_str::<serde_json::Value>(line)
                    .ok()
                    .map(|v| YouTubeVideo {
                        id: v["id"].as_str().unwrap_or_default().to_string(),
                        title: v["title"].as_str().unwrap_or_default().to_string(),
                        thumbnail: v["thumbnail"].as_str().map(|s| s.to_string())
                            .or_else(|| v["thumbnails"].as_array()
                                .and_then(|t| t.first())
                                .and_then(|t| t["url"].as_str())
                                .map(|s| s.to_string())),
                        duration: v["duration"].as_f64(),
                        upload_date: v["upload_date"].as_str().map(|s| s.to_string()),
                    })
            })
            .filter(|v| !v.id.is_empty() && !v.title.is_empty())
            .collect();

        Ok(videos)
    }

    /// Convert upload_date (YYYYMMDD) to ISO 8601 format
    pub fn parse_upload_date(upload_date: &str) -> Option<String> {
        if upload_date.len() != 8 {
            return None;
        }

        let year = &upload_date[0..4];
        let month = &upload_date[4..6];
        let day = &upload_date[6..8];

        Some(format!("{}-{}-{}T00:00:00Z", year, month, day))
    }
}
