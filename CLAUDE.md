# N3Ms Media Library

A cross-platform desktop app (Windows, macOS, Linux) for managing personal media libraries organized by creator.

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Rust** 1.85+ (required by Tauri 2.x dependencies)
- **yt-dlp** - Must be installed and in PATH for YouTube sync to work
  ```bash
  # Install yt-dlp
  pip install yt-dlp
  # or on macOS
  brew install yt-dlp
  ```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode (frontend + Tauri)
pnpm tauri dev

# Build for production
pnpm tauri build

# Frontend only (for UI development without Tauri)
pnpm dev

# Type check
pnpm run build
```

## Current Status

**Phase 1-7 Complete** (Foundation + Source CRUD + Background Sync + Feed View + Download Manager)

### What's Working
- Creator management (create, view, delete)
- Source management (add YouTube/Patreon channels)
- Background sync worker (5-minute interval)
- YouTube feed fetching via yt-dlp
- Dashboard with stats (total videos, downloaded count, sources, last sync)
- Toast notifications for sync/download events
- Feed view with filters - Filter by source, status, search; multi-select
- **Download Manager** - Queue-based downloads via yt-dlp with progress streaming
- Real-time download progress in Feed table
- WarehouseItem created on download completion

### Not Yet Implemented
- Warehouse view and manual import (Phase 8)
- Video player with bass boost (Phase 9)
- Global settings and first-time wizard (Phase 10)
- Search with MeiliSearch (Phase 11)
- Patreon sync (stubbed, needs cookie auth implementation)

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
│   │   │   ├── warehouse.rs        # WarehouseItem CRUD
│   │   │   └── settings.rs         # AppSettings get/update
│   │   ├── workers/
│   │   │   ├── mod.rs
│   │   │   ├── sync_manager.rs     # Background sync with Tauri events
│   │   │   └── download_manager.rs # Download queue with progress
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
│   │   └── feed/
│   │       ├── FeedTable.tsx       # Feed items table with selection
│   │       ├── FeedFilters.tsx     # Source, status, search filters
│   │       └── FeedActions.tsx     # Download Selected, Sync Now
│   ├── pages/
│   │   ├── CreatorList.tsx         # Home page - creator grid
│   │   ├── CreatorView.tsx         # Individual creator with tabs
│   │   ├── Settings.tsx            # Global settings (placeholder)
│   │   └── creator/
│   │       ├── Dashboard.tsx       # Stats cards
│   │       ├── CreatorSettings.tsx # Source management
│   │       ├── Feed.tsx            # Feed view with filters and selection
│   │       └── Warehouse.tsx       # Downloaded media (placeholder)
│   ├── hooks/
│   │   ├── useCreators.ts          # Creator CRUD hook
│   │   ├── useSources.ts           # Source CRUD hook
│   │   ├── useFeedItems.ts         # Feed items + counts hook
│   │   ├── useSyncEvents.ts        # Tauri event listeners + sync triggers
│   │   └── useDownloadEvents.ts    # Download event listeners + triggers
│   ├── types/
│   │   ├── creator.ts
│   │   ├── source.ts
│   │   ├── feed-item.ts
│   │   └── download.ts             # Download event types
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

### Settings
- `get_app_settings()` → `AppSettings`
- `update_app_settings(request)` → `AppSettings`

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

Listen with `useSyncEvents`, `useDownloadEvents` hooks or `@tauri-apps/api/event`.

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

## API Wrapper

All Tauri commands are wrapped in `src/lib/tauri.ts`:

```typescript
import { api } from "@/lib/tauri";

// Examples
const creators = await api.creators.getAll();
const source = await api.sources.create({ creator_id, platform: "youtube", channel_url });
await api.sync.source(sourceId);
```

## Background Sync

The sync worker (`src-tauri/src/workers/sync_manager.rs`):
- Starts automatically on app launch
- Runs every 5 minutes (300 seconds)
- Uses `tokio::select!` to handle both periodic and manual syncs
- Emits Tauri events for UI updates
- YouTube sync uses yt-dlp with `--flat-playlist --dump-json` (fetches up to 50 videos)

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
