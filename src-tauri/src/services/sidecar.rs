use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the path to a sidecar binary by name.
/// In development, falls back to system binary if sidecar not found.
/// In production, uses the bundled sidecar.
fn get_sidecar_path(app_handle: &AppHandle, binary_name: &str) -> Result<PathBuf, String> {
    // Try to get the sidecar path from Tauri's resource directory
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;

    // Construct the sidecar path based on platform
    let sidecar_name = if cfg!(target_os = "windows") {
        format!("{}.exe", binary_name)
    } else {
        binary_name.to_string()
    };

    let sidecar_path = resource_path.join("binaries").join(&sidecar_name);

    // Check if sidecar exists
    if sidecar_path.exists() {
        return Ok(sidecar_path);
    }

    // In development, the sidecar might be in a different location
    // Try the source binaries directory
    let dev_path = std::env::current_dir()
        .ok()
        .map(|p| p.join("binaries").join(&sidecar_name));

    if let Some(path) = dev_path {
        if path.exists() {
            return Ok(path);
        }
    }

    // Fall back to system binary (useful for development)
    // Check if binary is in PATH
    let system_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    let mut cmd = std::process::Command::new(system_cmd);
    cmd.arg(binary_name);

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
            let path = PathBuf::from(path_str.lines().next().unwrap_or("").trim());
            if path.exists() {
                return Ok(path);
            }
            // On some systems, which just returns the name
            Ok(PathBuf::from(binary_name))
        }
        _ => Err(format!(
            "{} not found. Please ensure {} is bundled with the app or installed on your system.",
            binary_name, binary_name
        )),
    }
}

/// Get the path to the yt-dlp sidecar binary.
/// In development, falls back to system yt-dlp if sidecar not found.
/// In production, uses the bundled sidecar.
pub fn get_ytdlp_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    get_sidecar_path(app_handle, "yt-dlp")
}

/// Get the path to the ffmpeg sidecar binary.
/// In development, falls back to system ffmpeg if sidecar not found.
/// In production, uses the bundled sidecar.
pub fn get_ffmpeg_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    get_sidecar_path(app_handle, "ffmpeg")
}

/// Check if ffmpeg is available (bundled or system)
pub fn is_ffmpeg_available(app_handle: &AppHandle) -> bool {
    get_ffmpeg_path(app_handle).is_ok()
}
