# N3Ms Media Library — Design Document

**Date:** 2026-01-31
**Status:** Approved

## Overview

A cross-platform desktop app (Windows, macOS, Linux) for managing personal media libraries organized by creator. It automates fetching video feeds from YouTube and Patreon, tracks download status, and provides a built-in player with bass boost.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Tauri 2.x |
| Backend | Rust |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (rusqlite, WAL mode) |
| Search | MeiliSearch (embedded) |
| Downloader | yt-dlp (bundled) |
| Video Player | HTML5 + Web Audio API |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 React Frontend                   │
│  (Views, Components, State Management)           │
└──────────────────────┬──────────────────────────┘
                       │ Tauri IPC (invoke/events)
┌──────────────────────▼──────────────────────────┐
│                 Rust Backend                     │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Feed Sync   │ │ Download    │ │ Search     │ │
│  │ Workers     │ │ Manager     │ │ Engine     │ │
│  └─────────────┘ └─────────────┘ └────────────┘ │
│  ┌─────────────┐ ┌─────────────┐                │
│  │ SQLite DB   │ │ yt-dlp      │                │
│  │             │ │ (bundled)   │                │
│  └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────┘
```

## Data Models

### Creator
```
id: UUID
name: String
photo_path: Option<String>
created_at: DateTime
updated_at: DateTime
```

### Source
```
id: UUID
creator_id: UUID (FK)
platform: Enum (YouTube, Patreon)
channel_url: String
channel_name: String (fetched)
credential_id: Option<UUID> (FK, for Patreon)
status: Enum (Pending, Validated, Error)
last_synced_at: Option<DateTime>
created_at: DateTime
```

### FeedItem
```
id: UUID
source_id: UUID (FK)
external_id: String (YouTube video ID, Patreon post ID)
title: String
thumbnail_url: String
published_at: DateTime
duration: Option<i64> (seconds)
download_status: Enum (NotDownloaded, Downloading, Done)
warehouse_item_id: Option<UUID> (FK, if downloaded)
created_at: DateTime
```

### WarehouseItem
```
id: UUID
creator_id: UUID (FK)
feed_item_id: Option<UUID> (FK, null if manual import)
title: String
file_path: String (relative to library root)
thumbnail_path: Option<String>
platform: Option<String> (YouTube, Patreon, Other, custom)
original_url: Option<String>
published_at: Option<DateTime>
duration: Option<i64> (seconds)
file_size: i64 (bytes)
imported_at: DateTime
is_manual_import: bool
```

### Credential
```
id: UUID
label: String (e.g., "Main Account", "Secret Account Y")
platform: Enum (Patreon)
cookie_path: String (path to cookies.txt file)
is_default: bool
created_at: DateTime
updated_at: DateTime
```

### AppSettings
```
library_path: String
default_quality: String (e.g., "best", "1080p", "720p")
sync_interval_seconds: i64 (default: 300)
theme: Enum (Dark, Light, System)
first_run_completed: bool
notifications_enabled: bool
bass_boost_preset: String (default: "Default")
bass_boost_custom_gain: i64 (default: 5)
```

### Relationships
```
Creator 1──N Source 1──N FeedItem
    │                        │
    │                        │ (optional link when downloaded)
    │                        ▼
    └────────1──N──── WarehouseItem

Credential 1──N Source (for Patreon sources)
```

## File Storage Structure

```
{LibraryPath}/
  └── {CreatorName}/
        └── {Platform}/
              └── {videoId}__{title}.mp4
```

- Library path set during first-time setup (or app-managed default)
- Default folder name: `N3MsMediaLibrary`

## Views & Navigation

### Route Structure
```
/                           → Creator List (home)
/settings                   → Global App Settings
/creators/:id               → Creator View (with tabs)
/creators/:id/dashboard     → Dashboard tab
/creators/:id/settings      → Creator Settings tab (sources)
/creators/:id/feed          → Creator Feed tab
/creators/:id/warehouse     → Warehouse tab
/setup                      → First-time wizard (shown once)
```

### Creator List View
- Grid of creator cards (photo, name, video count)
- Add Creator button
- Click card → Creator Individual View

### Creator Individual View
- Header: Photo, name, stats
- Tab navigation: Dashboard | Settings | Feed | Warehouse

### Dashboard Tab
- Stats: Videos downloaded, sources added, last sync, date added

### Creator Settings Tab
- Sources table with status indicators
- Add/Edit/Delete sources
- Patreon credential selection per source

### Creator Feed Tab
- Filters: Source, Status, Date Range, Search
- Actions: Download Selected, Select All, Sync Now
- Table: Checkbox, Status, Thumbnail+Title, Published Date, Platform
- Status icons: ✓ Downloaded, ○ Not Downloaded, ◐ Downloading

### Warehouse Tab
- Filters: Source, Date Range, Sort By, Search
- Actions: Import Video, Select All, Delete Selected
- Click video → Player Modal

### Player Modal
- HTML5 video player
- Bass boost controls (presets + custom slider)
- Metadata display
- Actions: Open in Default Player, Show in Folder

### Global App Settings
- Library path
- Default quality
- Sync interval
- Patreon credentials (multi-account)
- Theme selection
- Notification toggles

## Background Workers

### Sync Scheduler
- Runs on app startup
- Triggers every X seconds (global interval)
- Queues all active sources for sync

### Sync Queue
- Ordered list of sources to sync
- Prevents duplicate syncs
- Manual "Sync Now" inserts at front

### Sync Worker Pool
- N concurrent workers (default: 2)
- Fetches feed from platform
- Compares with existing FeedItems
- Inserts new items, updates search index
- Emits events to frontend

### Download Manager
- Separate queue for downloads
- N concurrent downloads (default: 2)
- Calls yt-dlp with appropriate args
- Streams progress to frontend
- Creates WarehouseItem on completion

## Tauri IPC Events

### Backend → Frontend
- `sync_started { source_id }`
- `sync_completed { source_id, new_count }`
- `sync_error { source_id, error }`
- `download_progress { feed_item_id, percent, speed }`
- `download_completed { feed_item_id, warehouse_item_id }`
- `download_error { feed_item_id, error }`

### Frontend → Backend
- `sync_now { source_id }`
- `sync_all { creator_id }`
- `download { feed_item_ids }`
- `cancel_download { feed_item_id }`
- `pause_all_downloads`
- `resume_all_downloads`

## Video Player & Bass Boost

### Bass Boost Implementation
- Web Audio API with lowshelf filter at 800Hz
- Presets: Default (5dB), High (10dB), Very High (20dB), Insane (30dB)
- Custom mode: 0-30dB slider
- Settings persisted in AppSettings

### Player Features
- Standard HTML5 controls
- Bass boost toggle and preset buttons
- Secondary action: Open in system default player

## First-Time Setup Wizard

### Steps
1. Welcome screen
2. Library path selection (or use default)
3. Patreon cookies import (optional)
4. Download quality selection

### Skip Behavior
- "Skip Setup" at any point → uses defaults
- Defaults: App-managed path, best quality, no Patreon cookies

## Error Handling

| Scenario | Handling |
|----------|----------|
| Source validation fails | Show error status, allow retry |
| Sync fails | Warning icon, log error, continue others |
| Download fails | Mark as error, allow retry |
| yt-dlp not working | Verify on startup, re-extract if needed |
| Patreon cookies expired | Detect auth errors, prompt re-import |
| Library path inaccessible | Prompt to select new path |
| File already exists | Skip, mark as downloaded |
| Disk full | Pause downloads, notify user |
| MeiliSearch corrupt | Rebuild index from SQLite |

### Offline Behavior
- Warehouse browsing/playback works offline
- Sync fails gracefully with message
- Downloads queue and retry on reconnection

### Data Integrity
- SQLite WAL mode for crash safety
- Transactions for multi-step operations
- Periodic orphan cleanup

## Notifications

All enabled by default (configurable in settings):
- New videos detected in feed
- Download completed
- Download failed
- Sync completed

## Project Structure

```
n3ms-media-library/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/             # Tauri IPC commands
│   │   ├── db/                   # SQLite models & migrations
│   │   ├── workers/              # Sync & download workers
│   │   ├── services/             # yt-dlp, MeiliSearch wrappers
│   │   └── utils/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React frontend
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── layout/               # App shell, navigation
│   │   ├── creators/             # Creator-specific components
│   │   ├── feed/                 # Feed list, filters
│   │   ├── warehouse/            # Warehouse list, import modal
│   │   ├── player/               # Video player, bass boost
│   │   └── settings/             # Settings views
│   ├── pages/                    # Route components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Tauri IPC bindings, utils
│   ├── stores/                   # State management
│   └── App.tsx
├── docs/
│   └── plans/
├── CLAUDE.md
├── package.json
└── README.md
```

## v1 Scope (MVP)

1. Creator CRUD
2. Source management (YouTube + Patreon)
3. Background sync with global interval
4. Creator Feed with filters & search
5. Download to Warehouse
6. Manual import
7. Built-in player with bass boost
8. Global settings
9. First-time wizard
10. Notifications

## Post-v1 (Nice-to-have)

- Full backup/restore
- Metadata-only export (JSON/CSV)
- Per-source sync intervals
- Background sync when app closed (OS tray)
- Additional platforms (Twitch, etc.)
