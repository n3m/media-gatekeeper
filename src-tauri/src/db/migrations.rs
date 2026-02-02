use rusqlite::Connection;

pub fn run_all(conn: &Connection) -> Result<(), rusqlite::Error> {
    run_schema(conn)?;
    run_migrations(conn)?;
    rebuild_fts_indexes(conn)?;
    Ok(())
}

/// Run incremental migrations for existing databases
fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Add metadata_complete column if it doesn't exist (for existing databases)
    // Use PRAGMA table_info directly and check results
    let mut has_metadata_complete = false;
    let mut stmt = conn.prepare("PRAGMA table_info(feed_items)")?;
    let column_iter = stmt.query_map([], |row| {
        row.get::<_, String>(1) // column name is at index 1
    })?;

    for column_result in column_iter {
        if let Ok(column_name) = column_result {
            if column_name == "metadata_complete" {
                has_metadata_complete = true;
                break;
            }
        }
    }
    drop(stmt);

    if !has_metadata_complete {
        conn.execute_batch(
            "ALTER TABLE feed_items ADD COLUMN metadata_complete INTEGER NOT NULL DEFAULT 0;
             CREATE INDEX IF NOT EXISTS idx_feed_items_metadata_complete ON feed_items(metadata_complete);
             CREATE INDEX IF NOT EXISTS idx_feed_items_source_metadata ON feed_items(source_id, metadata_complete);"
        )?;
    }

    Ok(())
}

fn run_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
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
            metadata_complete INTEGER NOT NULL DEFAULT 0,
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
        CREATE INDEX IF NOT EXISTS idx_feed_items_metadata_complete ON feed_items(metadata_complete);
        CREATE INDEX IF NOT EXISTS idx_feed_items_source_metadata ON feed_items(source_id, metadata_complete);
        CREATE INDEX IF NOT EXISTS idx_warehouse_items_creator ON warehouse_items(creator_id);

        -- FTS5 virtual tables for full-text search (standalone, not content-linked)
        CREATE VIRTUAL TABLE IF NOT EXISTS feed_items_fts USING fts5(
            id UNINDEXED,
            title
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS warehouse_items_fts USING fts5(
            id UNINDEXED,
            title
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS creators_fts USING fts5(
            id UNINDEXED,
            name
        );

        -- Triggers to keep feed_items_fts in sync
        CREATE TRIGGER IF NOT EXISTS feed_items_fts_ai AFTER INSERT ON feed_items BEGIN
            INSERT INTO feed_items_fts(id, title) VALUES (NEW.id, NEW.title);
        END;

        CREATE TRIGGER IF NOT EXISTS feed_items_fts_ad AFTER DELETE ON feed_items BEGIN
            DELETE FROM feed_items_fts WHERE id = OLD.id;
        END;

        CREATE TRIGGER IF NOT EXISTS feed_items_fts_au AFTER UPDATE ON feed_items BEGIN
            DELETE FROM feed_items_fts WHERE id = OLD.id;
            INSERT INTO feed_items_fts(id, title) VALUES (NEW.id, NEW.title);
        END;

        -- Triggers to keep warehouse_items_fts in sync
        CREATE TRIGGER IF NOT EXISTS warehouse_items_fts_ai AFTER INSERT ON warehouse_items BEGIN
            INSERT INTO warehouse_items_fts(id, title) VALUES (NEW.id, NEW.title);
        END;

        CREATE TRIGGER IF NOT EXISTS warehouse_items_fts_ad AFTER DELETE ON warehouse_items BEGIN
            DELETE FROM warehouse_items_fts WHERE id = OLD.id;
        END;

        CREATE TRIGGER IF NOT EXISTS warehouse_items_fts_au AFTER UPDATE ON warehouse_items BEGIN
            DELETE FROM warehouse_items_fts WHERE id = OLD.id;
            INSERT INTO warehouse_items_fts(id, title) VALUES (NEW.id, NEW.title);
        END;

        -- Triggers to keep creators_fts in sync
        CREATE TRIGGER IF NOT EXISTS creators_fts_ai AFTER INSERT ON creators BEGIN
            INSERT INTO creators_fts(id, name) VALUES (NEW.id, NEW.name);
        END;

        CREATE TRIGGER IF NOT EXISTS creators_fts_ad AFTER DELETE ON creators BEGIN
            DELETE FROM creators_fts WHERE id = OLD.id;
        END;

        CREATE TRIGGER IF NOT EXISTS creators_fts_au AFTER UPDATE ON creators BEGIN
            DELETE FROM creators_fts WHERE id = OLD.id;
            INSERT INTO creators_fts(id, name) VALUES (NEW.id, NEW.name);
        END;
        "
    )?;

    Ok(())
}

/// Rebuild FTS indexes from existing data.
/// This is safe to run multiple times - it only inserts missing entries.
fn rebuild_fts_indexes(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Populate feed_items_fts with any missing entries
    conn.execute(
        "INSERT INTO feed_items_fts(id, title)
         SELECT id, title FROM feed_items
         WHERE id NOT IN (SELECT id FROM feed_items_fts)",
        [],
    )?;

    // Populate warehouse_items_fts with any missing entries
    conn.execute(
        "INSERT INTO warehouse_items_fts(id, title)
         SELECT id, title FROM warehouse_items
         WHERE id NOT IN (SELECT id FROM warehouse_items_fts)",
        [],
    )?;

    // Populate creators_fts with any missing entries
    conn.execute(
        "INSERT INTO creators_fts(id, name)
         SELECT id, name FROM creators
         WHERE id NOT IN (SELECT id FROM creators_fts)",
        [],
    )?;

    Ok(())
}
