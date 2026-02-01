use rusqlite::Connection;

pub fn run_all(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS app_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            library_path TEXT NOT NULL,
            default_quality TEXT NOT NULL DEFAULT 'best',
            sync_interval_seconds INTEGER NOT NULL DEFAULT 300,
            theme TEXT NOT NULL DEFAULT 'dark',
            first_run_completed INTEGER NOT NULL DEFAULT 0,
            notifications_enabled INTEGER NOT NULL DEFAULT 1,
            bass_boost_preset TEXT NOT NULL DEFAULT 'Default',
            bass_boost_custom_gain INTEGER NOT NULL DEFAULT 5
        );

        CREATE TABLE IF NOT EXISTS credentials (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            platform TEXT NOT NULL,
            cookie_path TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS creators (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            photo_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY,
            creator_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            channel_url TEXT NOT NULL,
            channel_name TEXT,
            credential_id TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            last_synced_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
            FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS feed_items (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            external_id TEXT NOT NULL,
            title TEXT NOT NULL,
            thumbnail_url TEXT,
            published_at TEXT,
            duration INTEGER,
            download_status TEXT NOT NULL DEFAULT 'not_downloaded',
            warehouse_item_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_item_id) REFERENCES warehouse_items(id) ON DELETE SET NULL,
            UNIQUE(source_id, external_id)
        );

        CREATE TABLE IF NOT EXISTS warehouse_items (
            id TEXT PRIMARY KEY,
            creator_id TEXT NOT NULL,
            feed_item_id TEXT,
            title TEXT NOT NULL,
            file_path TEXT NOT NULL,
            thumbnail_path TEXT,
            platform TEXT,
            original_url TEXT,
            published_at TEXT,
            duration INTEGER,
            file_size INTEGER NOT NULL,
            imported_at TEXT NOT NULL,
            is_manual_import INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
            FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sources_creator ON sources(creator_id);
        CREATE INDEX IF NOT EXISTS idx_feed_items_source ON feed_items(source_id);
        CREATE INDEX IF NOT EXISTS idx_feed_items_download_status ON feed_items(download_status);
        CREATE INDEX IF NOT EXISTS idx_warehouse_items_creator ON warehouse_items(creator_id);
        "
    )?;

    Ok(())
}
