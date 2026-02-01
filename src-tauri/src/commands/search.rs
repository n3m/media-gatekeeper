use crate::db::Database;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedItemSearchResult {
    pub id: String,
    pub source_id: String,
    pub external_id: String,
    pub title: String,
    pub thumbnail_url: Option<String>,
    pub published_at: Option<String>,
    pub duration: Option<i64>,
    pub download_status: String,
    pub rank: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WarehouseItemSearchResult {
    pub id: String,
    pub creator_id: String,
    pub title: String,
    pub file_path: String,
    pub thumbnail_path: Option<String>,
    pub platform: Option<String>,
    pub duration: Option<i64>,
    pub file_size: i64,
    pub rank: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatorSearchResult {
    pub id: String,
    pub name: String,
    pub photo_path: Option<String>,
    pub rank: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GlobalSearchResults {
    pub creators: Vec<CreatorSearchResult>,
    pub feed_items: Vec<FeedItemSearchResult>,
    pub warehouse_items: Vec<WarehouseItemSearchResult>,
}

/// Escape special FTS5 characters and convert to prefix search
fn escape_fts_query(query: &str) -> String {
    let escaped: String = query
        .chars()
        .map(|c| match c {
            '"' | '*' | '(' | ')' | ':' | '^' | '-' | '+' => ' ',
            _ => c,
        })
        .collect();

    escaped
        .split_whitespace()
        .filter(|s| !s.is_empty())
        .map(|word| format!("{}*", word))
        .collect::<Vec<_>>()
        .join(" ")
}

#[tauri::command]
pub fn search_feed_items(
    db: State<Database>,
    query: String,
    creator_id: Option<String>,
    limit: Option<i64>,
) -> Result<Vec<FeedItemSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let escaped_query = escape_fts_query(&query);
    let limit = limit.unwrap_or(50);

    let results = match creator_id {
        Some(cid) => {
            let mut stmt = conn
                .prepare(
                    "SELECT f.id, f.source_id, f.external_id, f.title, f.thumbnail_url,
                            f.published_at, f.duration, f.download_status, fts.rank
                     FROM feed_items_fts fts
                     JOIN feed_items f ON fts.id = f.id
                     JOIN sources s ON f.source_id = s.id
                     WHERE feed_items_fts MATCH ?1 AND s.creator_id = ?2
                     ORDER BY fts.rank
                     LIMIT ?3",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, &cid, limit], |row| {
                    Ok(FeedItemSearchResult {
                        id: row.get(0)?,
                        source_id: row.get(1)?,
                        external_id: row.get(2)?,
                        title: row.get(3)?,
                        thumbnail_url: row.get(4)?,
                        published_at: row.get(5)?,
                        duration: row.get(6)?,
                        download_status: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT f.id, f.source_id, f.external_id, f.title, f.thumbnail_url,
                            f.published_at, f.duration, f.download_status, fts.rank
                     FROM feed_items_fts fts
                     JOIN feed_items f ON fts.id = f.id
                     WHERE feed_items_fts MATCH ?1
                     ORDER BY fts.rank
                     LIMIT ?2",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, limit], |row| {
                    Ok(FeedItemSearchResult {
                        id: row.get(0)?,
                        source_id: row.get(1)?,
                        external_id: row.get(2)?,
                        title: row.get(3)?,
                        thumbnail_url: row.get(4)?,
                        published_at: row.get(5)?,
                        duration: row.get(6)?,
                        download_status: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?
        }
    };

    Ok(results)
}

#[tauri::command]
pub fn search_warehouse_items(
    db: State<Database>,
    query: String,
    creator_id: Option<String>,
    limit: Option<i64>,
) -> Result<Vec<WarehouseItemSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let escaped_query = escape_fts_query(&query);
    let limit = limit.unwrap_or(50);

    let results = match creator_id {
        Some(cid) => {
            let mut stmt = conn
                .prepare(
                    "SELECT w.id, w.creator_id, w.title, w.file_path, w.thumbnail_path,
                            w.platform, w.duration, w.file_size, fts.rank
                     FROM warehouse_items_fts fts
                     JOIN warehouse_items w ON fts.id = w.id
                     WHERE warehouse_items_fts MATCH ?1 AND w.creator_id = ?2
                     ORDER BY fts.rank
                     LIMIT ?3",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, &cid, limit], |row| {
                    Ok(WarehouseItemSearchResult {
                        id: row.get(0)?,
                        creator_id: row.get(1)?,
                        title: row.get(2)?,
                        file_path: row.get(3)?,
                        thumbnail_path: row.get(4)?,
                        platform: row.get(5)?,
                        duration: row.get(6)?,
                        file_size: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT w.id, w.creator_id, w.title, w.file_path, w.thumbnail_path,
                            w.platform, w.duration, w.file_size, fts.rank
                     FROM warehouse_items_fts fts
                     JOIN warehouse_items w ON fts.id = w.id
                     WHERE warehouse_items_fts MATCH ?1
                     ORDER BY fts.rank
                     LIMIT ?2",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, limit], |row| {
                    Ok(WarehouseItemSearchResult {
                        id: row.get(0)?,
                        creator_id: row.get(1)?,
                        title: row.get(2)?,
                        file_path: row.get(3)?,
                        thumbnail_path: row.get(4)?,
                        platform: row.get(5)?,
                        duration: row.get(6)?,
                        file_size: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?
        }
    };

    Ok(results)
}

#[tauri::command]
pub fn search_creators(
    db: State<Database>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<CreatorSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let escaped_query = escape_fts_query(&query);
    let limit = limit.unwrap_or(20);

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.name, c.photo_path, fts.rank
             FROM creators_fts fts
             JOIN creators c ON fts.id = c.id
             WHERE creators_fts MATCH ?1
             ORDER BY fts.rank
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![&escaped_query, limit], |row| {
            Ok(CreatorSearchResult {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                rank: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let results = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(results)
}

#[tauri::command]
pub fn global_search(
    db: State<Database>,
    query: String,
    limit: Option<i64>,
) -> Result<GlobalSearchResults, String> {
    if query.trim().is_empty() {
        return Ok(GlobalSearchResults {
            creators: vec![],
            feed_items: vec![],
            warehouse_items: vec![],
        });
    }

    // We need to call each search function separately since they each lock the db
    let creators = search_creators_internal(&db, &query, limit.unwrap_or(5))?;
    let feed_items = search_feed_items_internal(&db, &query, None, limit.unwrap_or(10))?;
    let warehouse_items = search_warehouse_items_internal(&db, &query, None, limit.unwrap_or(10))?;

    Ok(GlobalSearchResults {
        creators,
        feed_items,
        warehouse_items,
    })
}

// Internal functions that take Database reference instead of State
fn search_creators_internal(
    db: &Database,
    query: &str,
    limit: i64,
) -> Result<Vec<CreatorSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let escaped_query = escape_fts_query(query);

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.name, c.photo_path, fts.rank
             FROM creators_fts fts
             JOIN creators c ON fts.id = c.id
             WHERE creators_fts MATCH ?1
             ORDER BY fts.rank
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![&escaped_query, limit], |row| {
            Ok(CreatorSearchResult {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                rank: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn search_feed_items_internal(
    db: &Database,
    query: &str,
    creator_id: Option<&str>,
    limit: i64,
) -> Result<Vec<FeedItemSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let escaped_query = escape_fts_query(query);

    match creator_id {
        Some(cid) => {
            let mut stmt = conn
                .prepare(
                    "SELECT f.id, f.source_id, f.external_id, f.title, f.thumbnail_url,
                            f.published_at, f.duration, f.download_status, fts.rank
                     FROM feed_items_fts fts
                     JOIN feed_items f ON fts.id = f.id
                     JOIN sources s ON f.source_id = s.id
                     WHERE feed_items_fts MATCH ?1 AND s.creator_id = ?2
                     ORDER BY fts.rank
                     LIMIT ?3",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, cid, limit], |row| {
                    Ok(FeedItemSearchResult {
                        id: row.get(0)?,
                        source_id: row.get(1)?,
                        external_id: row.get(2)?,
                        title: row.get(3)?,
                        thumbnail_url: row.get(4)?,
                        published_at: row.get(5)?,
                        duration: row.get(6)?,
                        download_status: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT f.id, f.source_id, f.external_id, f.title, f.thumbnail_url,
                            f.published_at, f.duration, f.download_status, fts.rank
                     FROM feed_items_fts fts
                     JOIN feed_items f ON fts.id = f.id
                     WHERE feed_items_fts MATCH ?1
                     ORDER BY fts.rank
                     LIMIT ?2",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, limit], |row| {
                    Ok(FeedItemSearchResult {
                        id: row.get(0)?,
                        source_id: row.get(1)?,
                        external_id: row.get(2)?,
                        title: row.get(3)?,
                        thumbnail_url: row.get(4)?,
                        published_at: row.get(5)?,
                        duration: row.get(6)?,
                        download_status: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        }
    }
}

fn search_warehouse_items_internal(
    db: &Database,
    query: &str,
    creator_id: Option<&str>,
    limit: i64,
) -> Result<Vec<WarehouseItemSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let escaped_query = escape_fts_query(query);

    match creator_id {
        Some(cid) => {
            let mut stmt = conn
                .prepare(
                    "SELECT w.id, w.creator_id, w.title, w.file_path, w.thumbnail_path,
                            w.platform, w.duration, w.file_size, fts.rank
                     FROM warehouse_items_fts fts
                     JOIN warehouse_items w ON fts.id = w.id
                     WHERE warehouse_items_fts MATCH ?1 AND w.creator_id = ?2
                     ORDER BY fts.rank
                     LIMIT ?3",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, cid, limit], |row| {
                    Ok(WarehouseItemSearchResult {
                        id: row.get(0)?,
                        creator_id: row.get(1)?,
                        title: row.get(2)?,
                        file_path: row.get(3)?,
                        thumbnail_path: row.get(4)?,
                        platform: row.get(5)?,
                        duration: row.get(6)?,
                        file_size: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT w.id, w.creator_id, w.title, w.file_path, w.thumbnail_path,
                            w.platform, w.duration, w.file_size, fts.rank
                     FROM warehouse_items_fts fts
                     JOIN warehouse_items w ON fts.id = w.id
                     WHERE warehouse_items_fts MATCH ?1
                     ORDER BY fts.rank
                     LIMIT ?2",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(rusqlite::params![&escaped_query, limit], |row| {
                    Ok(WarehouseItemSearchResult {
                        id: row.get(0)?,
                        creator_id: row.get(1)?,
                        title: row.get(2)?,
                        file_path: row.get(3)?,
                        thumbnail_path: row.get(4)?,
                        platform: row.get(5)?,
                        duration: row.get(6)?,
                        file_size: row.get(7)?,
                        rank: row.get(8)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        }
    }
}
