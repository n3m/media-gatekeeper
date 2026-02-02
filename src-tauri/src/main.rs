// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use std::panic;

fn main() {
    // Set up panic handler to log crashes
    panic::set_hook(Box::new(|panic_info| {
        let payload = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic payload".to_string()
        };

        let location = if let Some(loc) = panic_info.location() {
            format!("{}:{}:{}", loc.file(), loc.line(), loc.column())
        } else {
            "Unknown location".to_string()
        };

        let backtrace = std::backtrace::Backtrace::capture();

        // Try to write to a crash log file
        let log_path = if let Some(data_dir) = dirs::data_dir() {
            let log_dir = data_dir.join("com.n3m.media-library");
            let _ = std::fs::create_dir_all(&log_dir);
            let log_file = log_dir.join("crash.log");

            if let Ok(mut file) = std::fs::OpenOptions::new()
                .create(true)
                .write(true)
                .truncate(true)
                .open(&log_file)
            {
                let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
                let _ = writeln!(file, "N3Ms Media Library Crash Report");
                let _ = writeln!(file, "================================");
                let _ = writeln!(file, "Timestamp: {}", timestamp);
                let _ = writeln!(file, "Error: {}", payload);
                let _ = writeln!(file, "Location: {}", location);
                let _ = writeln!(file, "");
                let _ = writeln!(file, "Backtrace:");
                let _ = writeln!(file, "{}", backtrace);
            }

            Some(log_file)
        } else {
            None
        };

        // Print to stderr as well
        eprintln!("N3Ms Media Library crashed!");
        eprintln!("Error: {}", payload);
        eprintln!("Location: {}", location);
        if let Some(path) = &log_path {
            eprintln!("Crash log written to: {}", path.display());
        }
        eprintln!("\nBacktrace:\n{}", backtrace);
    }));

    n3ms_media_library_lib::run()
}
