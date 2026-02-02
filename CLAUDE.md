# N3Ms Media Library

A cross-platform desktop app (Windows, macOS, Linux) for managing personal media libraries organized by creator.

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Rust** 1.85+ (required by Tauri 2.x dependencies)

## Development

```bash
# Install dependencies
pnpm install

# Download yt-dlp binaries (bundled with the app)
./scripts/download-ytdlp.sh

# Run in development mode (frontend + Tauri)
pnpm tauri dev

# Build for production
pnpm tauri build

# Frontend only (for UI development without Tauri)
pnpm dev

# Type check
pnpm run build
```

**Note:** yt-dlp is bundled with the app as a sidecar binary. Run `./scripts/download-ytdlp.sh` to download binaries for all platforms, or manually download for your platform to `src-tauri/binaries/`.

## Current Status

**v1.0 Feature Complete** - All planned features implemented

### What's Working
- Creator management (create, view, delete)
- Source management (add YouTube/Patreon channels)
- Background sync worker (configurable interval)
- YouTube feed fetching via bundled yt-dlp
- **Patreon feed fetching** with cookie authentication
- Dashboard with stats (total videos, downloaded count, sources, last sync)
- Toast notifications for sync/download events
- **OS notifications** for sync completion and downloads
- Feed view with filters - Filter by source, status, search; multi-select
  - **Virtualized table** - Handles 4.5k+ items efficiently via @tanstack/react-virtual
  - **Progressive metadata loading** - Fetches metadata on-demand for visible items
- Download Manager - Queue-based downloads via yt-dlp with progress streaming
- Real-time download progress in Feed table
- Warehouse view - View downloaded videos with filters, sorting, search
- Manual import - Import local video files via file picker
- Multi-select and bulk delete in Warehouse
- Video Player - Built-in player with HTML5 video element
- Bass Boost - Web Audio API with lowshelf filter @ 800Hz, presets + custom slider
- Open in Player / Show in Folder - Cross-platform shell commands
- **Global Settings** - Library path, quality, sync interval, theme, notifications, bass boost defaults
- **First-Time Setup Wizard** - Guided setup on first run
- **Full-Text Search (FTS5)** - SQLite FTS5 for fast search across titles
  - Global search in sidebar with Ctrl+K shortcut
  - FTS-powered search in Feed and Warehouse views
  - Automatic FTS index updates via triggers
- **OS Notifications** - Cross-platform system notifications via tauri-plugin-notification
  - Sync completed notifications (with new item count)
  - Download completed/failed notifications
  - Test notification button in Settings
  - Respects notifications_enabled setting

- **Theme Switching** - Dark, Light, and System (follows OS preference)
- **Patreon Sync** - Full Patreon support with cookie authentication
  - Credential management in Settings (add/delete cookie files)
  - Automatic credential selection when adding Patreon sources
  - Uses bundled yt-dlp for fetching

## Project Structure (Actual)

```
n3ms-media-gatekeeper/
├── src-tauri/                      # Rust backend
│   ├── src/
│   │   ├── main.rs                 # Entry point (calls lib::run)
│   │   ├── lib.rs                  # Tauri app setup, command registration
│   │   ├── db/
│   │   │   ├── mod.rs              # Database struct with Mutex<Connection>
│   │   │   └── migrations.rs       # SQLite schema (all tables)
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── creator.rs          # Creator struct + request types
│   │   │   ├── source.rs           # Source struct + request types
│   │   │   ├── feed_item.rs        # FeedItem struct + request types
│   │   │   ├── warehouse_item.rs   # WarehouseItem struct + request types
│   │   │   └── app_settings.rs     # AppSettings struct + request types
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── creators.rs         # Creator CRUD commands
│   │   │   ├── sources.rs          # Source CRUD commands
│   │   │   ├── feed_items.rs       # FeedItem CRUD + counts
│   │   │   ├── sync.rs             # Sync trigger commands
│   │   │   ├── download.rs         # Download trigger commands
│   │   │   ├── warehouse.rs        # WarehouseItem CRUD + import
│   │   │   ├── settings.rs         # AppSettings get/update
│   │   │   ├── shell.rs            # Open in player, show in folder
│   │   │   ├── search.rs           # FTS5 search commands
│   │   │   ├── notifications.rs    # OS notification commands
│   │   │   └── metadata.rs         # Metadata fetch commands
│   │   ├── workers/
│   │   │   ├── mod.rs
│   │   │   ├── sync_manager.rs     # Background sync with Tauri events (manual only)
│   │   │   ├── download_manager.rs # Download queue with progress
│   │   │   └── metadata_worker.rs  # Progressive metadata fetching
│   │   └── services/
│   │       ├── mod.rs
│   │       └── youtube.rs          # yt-dlp integration
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                            # React frontend
│   ├── components/
│   │   ├── ui/                     # shadcn components (button, card, dialog, etc.)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Main layout with sidebar
│   │   │   └── Sidebar.tsx         # Navigation sidebar
│   │   ├── creators/
│   │   │   ├── CreatorCard.tsx     # Creator grid card
│   │   │   └── CreateCreatorDialog.tsx
│   │   ├── sources/
│   │   │   ├── AddSourceDialog.tsx # Add YouTube/Patreon source
│   │   │   └── SourcesTable.tsx    # Sources list with sync controls
│   │   ├── feed/
│   │   │   ├── FeedTable.tsx       # Virtualized feed table (@tanstack/react-virtual)
│   │   │   ├── FeedFilters.tsx     # Source, status, search filters
│   │   │   └── FeedActions.tsx     # Download Selected, Sync Now
│   │   ├── warehouse/
│   │   │   ├── WarehouseTable.tsx  # Warehouse items table
│   │   │   ├── WarehouseFilters.tsx # Platform, sort, search filters
│   │   │   └── ImportVideoDialog.tsx # Manual video import
│   │   ├── player/
│   │   │   ├── VideoPlayerModal.tsx # Video player with bass boost
│   │   │   └── BassBoostPanel.tsx   # Bass boost UI controls
│   │   ├── search/
│   │   │   └── GlobalSearch.tsx     # Sidebar search with dropdown
│   │   └── setup/
│   │       └── SetupWizard.tsx      # First-time setup wizard
│   ├── pages/
│   │   ├── CreatorList.tsx         # Home page - creator grid
│   │   ├── CreatorView.tsx         # Individual creator with tabs
│   │   ├── Settings.tsx            # Global settings (placeholder)
│   │   └── creator/
│   │       ├── Dashboard.tsx       # Stats cards
│   │       ├── CreatorSettings.tsx # Source management
│   │       ├── Feed.tsx            # Feed view with filters and selection
│   │       └── Warehouse.tsx       # Warehouse with filters, import, delete
│   ├── hooks/
│   │   ├── useCreators.ts          # Creator CRUD hook
│   │   ├── useSources.ts           # Source CRUD hook
│   │   ├── useFeedItems.ts         # Feed items + counts hook
│   │   ├── useSyncEvents.ts        # Tauri event listeners + sync triggers
│   │   ├── useDownloadEvents.ts    # Download event listeners + triggers
│   │   ├── useWarehouseItems.ts    # Warehouse items CRUD hook
│   │   ├── useBassBoost.ts         # Web Audio API bass boost hook
│   │   ├── useAppSettings.ts       # App settings hook
│   │   └── useMetadataEvents.ts    # Metadata event listeners + fetch triggers
│   ├── types/
│   │   ├── creator.ts
│   │   ├── source.ts
│   │   ├── feed-item.ts            # FeedItem + MetadataEvent types
│   │   ├── download.ts             # Download event types
│   │   ├── warehouse-item.ts       # WarehouseItem type
│   │   ├── app-settings.ts         # AppSettings type
│   │   ├── credential.ts           # Credential type
│   │   └── search.ts               # Search result types
│   ├── lib/
│   │   ├── tauri.ts                # Tauri invoke wrapper (api object)
│   │   └── utils.ts                # cn() helper for Tailwind
│   ├── App.tsx                     # Router + Toaster setup
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Tailwind + CSS variables
├── docs/plans/                     # Design documents
├── CLAUDE.md                       # This file
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Tauri 2.x |
| Backend | Rust |
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite (rusqlite, WAL mode) |
| Virtualization | @tanstack/react-virtual |
| Package Manager | pnpm |
| Notifications | sonner |

## Database Schema

Tables in `src-tauri/src/db/migrations.rs`:

- **creators** - id, name, photo_path, created_at, updated_at
- **sources** - id, creator_id, platform, channel_url, channel_name, credential_id, status, last_synced_at, created_at
- **feed_items** - id, source_id, external_id, title, thumbnail_url, published_at, duration, download_status, warehouse_item_id, created_at
- **warehouse_items** - id, creator_id, feed_item_id, title, file_path, thumbnail_path, platform, original_url, published_at, duration, file_size, imported_at, is_manual_import
- **credentials** - id, label, platform, cookie_path, is_default, created_at, updated_at
- **app_settings** - Single row with library_path, default_quality, sync_interval_seconds, theme, etc.

FTS5 Virtual Tables (auto-synced via triggers):
- **feed_items_fts** - Full-text search on feed_items.title
- **warehouse_items_fts** - Full-text search on warehouse_items.title
- **creators_fts** - Full-text search on creators.name

## Tauri Commands (Implemented)

### Creators
- `get_creators` → `Creator[]`
- `get_creator(id)` → `Creator`
- `create_creator(request)` → `Creator`
- `update_creator(id, request)` → `Creator`
- `delete_creator(id)` → `void`

### Sources
- `get_sources_by_creator(creatorId)` → `Source[]`
- `create_source(request)` → `Source`
- `update_source(id, request)` → `Source`
- `delete_source(id)` → `void`

### Feed Items
- `get_feed_items_by_source(sourceId)` → `FeedItem[]`
- `get_feed_items_by_creator(creatorId)` → `FeedItem[]`
- `create_feed_item(request)` → `FeedItem`
- `create_feed_items_batch(items)` → `i32` (count inserted)
- `update_feed_item(id, request)` → `FeedItem`
- `get_feed_item_counts(creatorId)` → `FeedItemCounts`

### Sync
- `sync_source(sourceId)` → triggers background sync
- `sync_creator(creatorId)` → syncs all sources for creator
- `sync_all` → syncs all sources

### Download
- `download_items(feedItemIds: Vec<String>)` → queue items for download
- `cancel_download(feedItemId)` → cancel a download

### Warehouse
- `get_warehouse_items_by_creator(creatorId)` → `WarehouseItem[]`
- `create_warehouse_item(request)` → `WarehouseItem`
- `delete_warehouse_item(id)` → `void`
- `import_video(request)` → `WarehouseItem` (manual import)

### Settings
- `get_app_settings()` → `AppSettings`
- `update_app_settings(request)` → `AppSettings`

### Shell
- `open_file_in_default_app(filePath)` → opens in system default player
- `show_in_folder(filePath)` → reveals file in file manager

### Search (FTS5)
- `search_feed_items(query, creatorId?, limit?)` → `FeedItemSearchResult[]`
- `search_warehouse_items(query, creatorId?, limit?)` → `WarehouseItemSearchResult[]`
- `search_creators(query, limit?)` → `CreatorSearchResult[]`
- `global_search(query, limit?)` → `GlobalSearchResults`

### Notifications
- `check_notification_permission()` → `String` (permission state)
- `request_notification_permission()` → `String` (permission state)
- `send_test_notification()` → `void`

### Metadata
- `fetch_feed_items_metadata(feedItemIds: Vec<String>)` → triggers immediate metadata fetch
- `get_incomplete_metadata_items(creatorId, limit?)` → `String[]` (feed item IDs)
- `pause_metadata_worker()` → pauses background metadata processing
- `resume_metadata_worker()` → resumes background metadata processing

## Tauri Events (Backend → Frontend)

### Sync Events
- `sync_started` - `{ source_id, status: "started", message, new_items }`
- `sync_completed` - `{ source_id, status: "completed", message, new_items }`
- `sync_error` - `{ source_id, status: "error", message, new_items }`

### Download Events
- `download_started` - `{ feed_item_id }`
- `download_progress` - `{ feed_item_id, percent, speed }`
- `download_completed` - `{ feed_item_id, warehouse_item_id }`
- `download_error` - `{ feed_item_id, error }`

### Metadata Events
- `metadata_update` - `{ feed_item_id, status: "started" | "completed" | "error", message? }`

Listen with `useSyncEvents`, `useDownloadEvents`, `useMetadataEvents` hooks or `@tauri-apps/api/event`.

## React Hooks

| Hook | Purpose |
|------|---------|
| `useCreators()` | CRUD for creators, returns `{ creators, loading, error, createCreator, updateCreator, deleteCreator, refetch }` |
| `useSources(creatorId)` | CRUD for sources, returns `{ sources, loading, error, createSource, updateSource, deleteSource, refetch }` |
| `useFeedItems(creatorId)` | Feed items + counts, returns `{ feedItems, counts, loading, error, refetch }` |
| `useSyncEvents(options)` | Listen to sync events with callbacks `{ onSyncStarted, onSyncCompleted, onSyncError }` |
| `useSync()` | Trigger syncs, returns `{ syncSource, syncCreator, syncAll }` |
| `useDownloadEvents(options)` | Listen to download events with callbacks `{ onDownloadStarted, onDownloadProgress, onDownloadCompleted, onDownloadError }` |
| `useDownload()` | Trigger downloads, returns `{ downloadItems, cancelDownload }` |
| `useWarehouseItems(creatorId)` | Warehouse items CRUD, returns `{ warehouseItems, loading, error, refetch, deleteItem }` |
| `useBassBoost()` | Web Audio API bass boost, returns `{ enabled, preset, customGain, connectVideo, PRESETS }` |
| `useAppSettings()` | App settings CRUD, returns `{ settings, loading, error, refetch, updateSettings }` |
| `useSearch()` | Global FTS search, returns `{ query, setQuery, results, loading, error, clearResults }` |
| `useCreatorSearch(creatorId)` | Search within creator, returns `{ query, setQuery, feedItemResults, warehouseItemResults, loading, error }` |
| `useMetadataEvents(options)` | Listen to metadata events with callbacks `{ onMetadataStarted, onMetadataCompleted, onMetadataError }`, returns `{ fetchMetadata, getIncompleteItems, pauseWorker, resumeWorker }` |

## API Wrapper

All Tauri commands are wrapped in `src/lib/tauri.ts`:

```typescript
import { api } from "@/lib/tauri";

// Examples
const creators = await api.creators.getAll();
const source = await api.sources.create({ creator_id, platform: "youtube", channel_url });
await api.sync.source(sourceId);
```

## Background Workers

### Sync Manager (`src-tauri/src/workers/sync_manager.rs`)
- Starts automatically on app launch
- **Auto-sync disabled** - only processes manual sync commands
- Uses `tokio::select!` to handle sync commands
- Emits Tauri events for UI updates
- YouTube sync uses yt-dlp with `--flat-playlist --dump-json` (fetches up to 50 videos)

### Metadata Worker (`src-tauri/src/workers/metadata_worker.rs`)
- Fetches detailed metadata (published date, duration, thumbnail) for feed items
- Background processing every 5 seconds (5 items per batch)
- On-demand fetching triggered by visible items in Feed table
- Published column shows: "Pending" → "Loading..." → actual date
- Uses yt-dlp for both YouTube and Patreon metadata

## Design Document

Full specification: [docs/plans/2026-01-31-n3ms-media-library-design.md](docs/plans/2026-01-31-n3ms-media-library-design.md)

## File Storage Structure (Planned)

```
{LibraryPath}/
  └── {CreatorName}/
        └── {Platform}/
              └── {videoId}__{title}.mp4
```

Default library path: `N3MsMediaLibrary` in app data directory.
