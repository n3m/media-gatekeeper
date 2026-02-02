use serde::Deserialize;
use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Deserialize)]
pub struct PatreonPost {
    pub id: String,
    pub title: String,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    pub upload_date: Option<String>,
}

pub struct PatreonFetcher;

impl PatreonFetcher {
    /// Fetch posts from a Patreon creator URL using cookies for authentication
    /// Returns a list of post metadata
    pub fn fetch_creator(creator_url: &str, cookie_path: &str, ytdlp_path: &Path) -> Result<Vec<PatreonPost>, String> {
        // Ensure URL ends with /posts for proper playlist extraction
        let url = if creator_url.ends_with("/posts") {
            creator_url.to_string()
        } else {
            format!("{}/posts", creator_url.trim_end_matches('/'))
        };

        // Use yt-dlp to get post list in JSON format with cookie authentication
        // --flat-playlist: don't download, just list
        // --dump-json: output as JSON (one line per video)
        // --no-warnings: suppress warnings
        // --cookies: use Netscape-format cookie file for authentication
        // --playlist-end 50: limit to 50 most recent posts
        let mut cmd = Command::new(ytdlp_path);
        cmd.args([
            "--flat-playlist",
            "--dump-json",
            "--no-warnings",
            "--cookies",
            cookie_path,
            "--playlist-end",
            "50",
            &url,
        ]);

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd.output()
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Check for common auth errors
            if stderr.contains("Unable to download") || stderr.contains("HTTP Error 401") {
                return Err(
                    "Authentication failed. Please check your cookie file is valid and not expired."
                        .to_string(),
                );
            }
            return Err(format!("yt-dlp failed: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        // Log for debugging (this will show in sync error if needed)
        if stdout.trim().is_empty() {
            return Err(format!(
                "No content returned from Patreon. URL: {}. Stderr: {}",
                creator_url,
                if stderr.is_empty() { "none" } else { &stderr }
            ));
        }

        // Parse each line as a separate JSON object
        // Patreon format differs from YouTube - uses webpage_url_basename instead of title
        let posts: Vec<PatreonPost> = stdout
            .lines()
            .filter(|line| !line.trim().is_empty())
            .filter_map(|line| {
                serde_json::from_str::<serde_json::Value>(line)
                    .ok()
                    .and_then(|v| {
                        let id = v["id"].as_str().unwrap_or_default().to_string();
                        if id.is_empty() {
                            return None;
                        }

                        // Try to get title, fall back to webpage_url_basename
                        let title = v["title"]
                            .as_str()
                            .map(|s| s.to_string())
                            .or_else(|| {
                                // Extract title from webpage_url_basename (e.g., "lollipop-sucking-23710390")
                                v["webpage_url_basename"].as_str().map(|basename| {
                                    // Remove the trailing ID (last segment after final dash if it's numeric)
                                    let parts: Vec<&str> = basename.rsplitn(2, '-').collect();
                                    let title_slug = if parts.len() == 2 && parts[0].parse::<u64>().is_ok() {
                                        parts[1]
                                    } else {
                                        basename
                                    };
                                    // Convert dashes to spaces and capitalize
                                    title_slug
                                        .replace('-', " ")
                                        .split_whitespace()
                                        .map(|word| {
                                            let mut chars = word.chars();
                                            match chars.next() {
                                                None => String::new(),
                                                Some(first) => {
                                                    first.to_uppercase().chain(chars).collect()
                                                }
                                            }
                                        })
                                        .collect::<Vec<_>>()
                                        .join(" ")
                                })
                            })
                            .unwrap_or_default();

                        if title.is_empty() {
                            return None;
                        }

                        Some(PatreonPost {
                            id,
                            title,
                            thumbnail: v["thumbnail"]
                                .as_str()
                                .map(|s| s.to_string())
                                .or_else(|| {
                                    v["thumbnails"]
                                        .as_array()
                                        .and_then(|t| t.first())
                                        .and_then(|t| t["url"].as_str())
                                        .map(|s| s.to_string())
                                }),
                            duration: v["duration"].as_f64(),
                            upload_date: v["upload_date"].as_str().map(|s| s.to_string()),
                        })
                    })
            })
            .collect();

        Ok(posts)
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
