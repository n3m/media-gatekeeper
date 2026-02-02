use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the path to the yt-dlp sidecar binary.
/// In development, falls back to system yt-dlp if sidecar not found.
/// In production, uses the bundled sidecar.
pub fn get_ytdlp_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    // Try to get the sidecar path from Tauri's resource directory
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    // Construct the sidecar path based on platform
    let sidecar_name = if cfg!(target_os = "windows") {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    };

    let sidecar_path = resource_path.join("binaries").join(sidecar_name);

    // Check if sidecar exists
    if sidecar_path.exists() {
        return Ok(sidecar_path);
    }

    // In development, the sidecar might be in a different location
    // Try the source binaries directory
    let dev_path = std::env::current_dir()
        .ok()
        .map(|p| p.join("binaries").join(sidecar_name));

    if let Some(path) = dev_path {
        if path.exists() {
            return Ok(path);
        }
    }

    // Fall back to system yt-dlp (useful for development)
    // Check if yt-dlp is in PATH
    let system_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    let mut cmd = std::process::Command::new(system_cmd);
    cmd.arg("yt-dlp");

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd.output();

    match output {
        Ok(out) if out.status.success() => {
            let path_str = String::from_utf8_lossy(&out.stdout);
            let path = PathBuf::from(path_str.trim());
            if path.exists() {
                return Ok(path);
            }
            // On some systems, which just returns the name
            Ok(PathBuf::from("yt-dlp"))
        }
        _ => Err(
            "yt-dlp not found. Please ensure yt-dlp is bundled with the app or installed on your system."
                .to_string(),
        ),
    }
}
