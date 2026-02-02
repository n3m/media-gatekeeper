use serde::Deserialize;
use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

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
    pub fn fetch_channel(channel_url: &str, ytdlp_path: &Path) -> Result<Vec<YouTubeVideo>, String> {
        // Use yt-dlp to get video list in JSON format
        // --flat-playlist: don't download, just list
        // --dump-json: output as JSON (one line per video)
        // --no-warnings: suppress warnings
        // No playlist limit - fetch all videos
        let mut cmd = Command::new(ytdlp_path);
        cmd.args([
            "--flat-playlist",
            "--dump-json",
            "--no-warnings",
            channel_url,
        ]);

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd.output()
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

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
                    .map(|v| {
                        // Try multiple date fields - flat-playlist may use timestamp instead of upload_date
                        let upload_date = v["upload_date"]
                            .as_str()
                            .map(|s| s.to_string())
                            .or_else(|| {
                                // Try timestamp (Unix seconds) and convert to YYYYMMDD
                                v["timestamp"]
                                    .as_i64()
                                    .or_else(|| v["release_timestamp"].as_i64())
                                    .map(|ts| {
                                        chrono::DateTime::from_timestamp(ts, 0)
                                            .map(|dt| dt.format("%Y%m%d").to_string())
                                            .unwrap_or_default()
                                    })
                                    .filter(|s| !s.is_empty())
                            });

                        YouTubeVideo {
                            id: v["id"].as_str().unwrap_or_default().to_string(),
                            title: v["title"].as_str().unwrap_or_default().to_string(),
                            thumbnail: v["thumbnail"].as_str().map(|s| s.to_string())
                                .or_else(|| v["thumbnails"].as_array()
                                    .and_then(|t| t.first())
                                    .and_then(|t| t["url"].as_str())
                                    .map(|s| s.to_string())),
                            duration: v["duration"].as_f64(),
                            upload_date,
                        }
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

    /// Fetch full metadata for a single video by its ID
    /// Returns metadata including accurate published_at date
    pub fn fetch_video_metadata(video_id: &str, ytdlp_path: &Path) -> Result<YouTubeVideo, String> {
        let url = format!("https://www.youtube.com/watch?v={}", video_id);

        let mut cmd = Command::new(ytdlp_path);
        cmd.args([
            "--dump-json",
            "--no-download",
            "--no-warnings",
            &url,
        ]);

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd.output()
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("yt-dlp failed: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);

        serde_json::from_str::<serde_json::Value>(&stdout)
            .map_err(|e| format!("Failed to parse JSON: {}", e))
            .map(|v| {
                // Try multiple date fields for better accuracy
                let upload_date = v["upload_date"]
                    .as_str()
                    .map(|s| s.to_string())
                    .or_else(|| {
                        // Try timestamp (Unix seconds) and convert to YYYYMMDD
                        v["timestamp"]
                            .as_i64()
                            .or_else(|| v["release_timestamp"].as_i64())
                            .map(|ts| {
                                chrono::DateTime::from_timestamp(ts, 0)
                                    .map(|dt| dt.format("%Y%m%d").to_string())
                                    .unwrap_or_default()
                            })
                            .filter(|s| !s.is_empty())
                    });

                YouTubeVideo {
                    id: v["id"].as_str().unwrap_or(video_id).to_string(),
                    title: v["title"].as_str().unwrap_or_default().to_string(),
                    thumbnail: v["thumbnail"].as_str().map(|s| s.to_string())
                        .or_else(|| v["thumbnails"].as_array()
                            .and_then(|t| t.first())
                            .and_then(|t| t["url"].as_str())
                            .map(|s| s.to_string())),
                    duration: v["duration"].as_f64(),
                    upload_date,
                }
            })
    }
}
