pub mod migrations;

use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, rusqlite::Error> {
        fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");

        let db_path = app_data_dir.join("n3ms_media_library.db");
        let conn = Connection::open(&db_path)?;

        // Enable WAL mode for better concurrency
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn run_migrations(&self) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        migrations::run_all(&conn)
    }
}
