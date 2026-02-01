# N3Ms Media Library

A cross-platform desktop app (Windows, macOS, Linux) for managing personal media libraries organized by creator.

## Current Status

**Phase 1-3 Complete** (Foundation laid)

Implemented:
- Tauri 2.x + React 19 + Vite + TypeScript project
- Tailwind CSS v4 with dark mode
- shadcn/ui components (button, card, dialog, tabs, avatar, etc.)
- React Router with app shell layout and sidebar
- SQLite database with full schema (creators, sources, feed_items, warehouse_items, credentials, app_settings)
- Creator CRUD (Rust backend commands + React frontend hooks + UI)
- Creator individual view with tab layout (Dashboard, Settings, Feed, Warehouse placeholders)

Next phases to implement:
- Phase 4: Source CRUD (YouTube, Patreon channels)
- Phase 5: Background sync workers
- Phase 6: Feed view with filters
- Phase 7: Download manager with yt-dlp
- Phase 8: Warehouse view and manual import
- Phase 9: Video player with bass boost
- Phase 10: Global settings and first-time wizard
- Phase 11: MeiliSearch integration
- Phase 12: Notifications

## Design Document

Full design specification: [docs/plans/2026-01-31-n3ms-media-library-design.md](docs/plans/2026-01-31-n3ms-media-library-design.md)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Framework | Tauri 2.x |
| Backend | Rust |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (rusqlite, WAL mode) |
| Search | MeiliSearch (embedded, typo-tolerant) |
| Downloads | yt-dlp (bundled with app) |
| Video Player | HTML5 video + Web Audio API |

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

## Core Entities

- **Creator**: Content creator (name + photo). Container for sources and media.
- **Source**: YouTube or Patreon channel linked to a creator. Syncs feed automatically.
- **FeedItem**: Video metadata from a source (title, thumbnail, publish date, platform, download status).
- **WarehouseItem**: Downloaded/imported media file with metadata.
- **Credential**: Patreon cookie credentials (supports multiple accounts).
- **AppSettings**: Global app configuration.

## File Storage Structure

```
{LibraryPath}/
  └── {CreatorName}/
        └── {Platform}/
              └── {videoId}__{title}.mp4
```

- Library path set during first-time setup (or app-managed default)
- Default folder name: `N3MsMediaLibrary`

## Routes

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

## Key Features

### Downloads
- Bundled yt-dlp (auto-managed by app)
- Default: Best quality available
- User-configurable quality override in Global Settings

### Patreon Authentication
- Multi-cookie manager (supports multiple accounts)
- Per-source credential selection: "Use default" or "Use specific credentials"
- Cookies imported via browser extension export (cookies.txt format)

### Background Sync
- Global sync interval (default: 300 seconds, min: 300)
- Only syncs while app is open (no background service in v1)
- Sync worker pool with concurrent workers

### Search
- MeiliSearch embedded for typo-tolerant full-text search
- Searches video titles, descriptions, creator names

### Video Player
- Built-in HTML5 player with Web Audio API bass boost
- Bass boost presets: Default (5dB), High (10dB), Very High (20dB), Insane (30dB), Custom (0-30dB)
- Lowshelf filter @ 800Hz
- Secondary action: Open in system default player

### Notifications
- New videos detected in feed
- Download completed
- Download failed
- Sync completed

### Theme
- Default: Dark mode
- Options: Dark, Light, Follow System

## Tauri IPC

### Backend → Frontend Events
- `sync_started`, `sync_completed`, `sync_error`
- `download_progress`, `download_completed`, `download_error`

### Frontend → Backend Commands
- `sync_now`, `sync_all`
- `download`, `cancel_download`, `pause_all_downloads`, `resume_all_downloads`

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
