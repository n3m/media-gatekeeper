# N3Ms Media Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-platform desktop app for managing personal media libraries organized by creator, with automated feed syncing and downloads.

**Architecture:** Tauri 2.x app with Rust backend handling database, sync workers, and yt-dlp integration. React frontend with Tailwind + shadcn/ui. SQLite for persistence, MeiliSearch for search.

**Tech Stack:** Tauri 2.x, Rust, React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, SQLite, MeiliSearch, yt-dlp

---

## Phase 1: Project Scaffolding

### Task 1.1: Initialize Tauri + React Project

**Files:**
- Create: `package.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Create Tauri project with React template**

Run:
```bash
npm create tauri-app@latest . -- --template react-ts --manager npm
```

When prompted:
- Package name: `n3ms-media-library`
- Identifier: `com.n3m.medialibrary`

**Step 2: Verify project structure exists**

Run:
```bash
ls -la src-tauri/src/ && ls -la src/
```

Expected: `main.rs` in src-tauri/src, `main.tsx` and `App.tsx` in src/

**Step 3: Install dependencies and verify build**

Run:
```bash
npm install
```

Expected: Dependencies installed successfully

**Step 4: Test development server starts**

Run:
```bash
npm run tauri dev &
sleep 10
pkill -f "tauri dev" || true
```

Expected: App window opens (or at least compiles without errors)

**Step 5: Commit initial scaffold**

```bash
git add -A
git commit -m "chore: initialize Tauri + React project"
```

---

### Task 1.2: Configure Tailwind CSS

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

**Step 1: Install Tailwind dependencies**

Run:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 2: Configure tailwind.config.js**

Replace contents of `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 3: Configure base CSS**

Replace contents of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 4: Update App.tsx to test Tailwind**

Replace contents of `src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">N3Ms Media Library</h1>
      </div>
    </div>
  );
}

export default App;
```

**Step 5: Verify Tailwind works**

Run:
```bash
npm run dev &
sleep 5
pkill -f "vite" || true
```

Expected: No build errors

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind CSS with dark mode"
```

---

### Task 1.3: Set Up shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`

**Step 1: Install shadcn/ui dependencies**

Run:
```bash
npm install clsx tailwind-merge class-variance-authority lucide-react
npm install -D @types/node
```

**Step 2: Create utils.ts**

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3: Create components.json**

Create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Step 4: Update vite.config.ts with path aliases**

Replace `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

**Step 5: Update tsconfig.json with path aliases**

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 6: Add first shadcn component (Button)**

Run:
```bash
npx shadcn@latest add button
```

**Step 7: Test button in App.tsx**

Update `src/App.tsx`:

```tsx
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-4xl font-bold">N3Ms Media Library</h1>
        <Button>Get Started</Button>
      </div>
    </div>
  );
}

export default App;
```

**Step 8: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: set up shadcn/ui with button component"
```

---

### Task 1.4: Set Up React Router

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`
- Create: `src/pages/CreatorList.tsx`
- Create: `src/pages/Settings.tsx`
- Modify: `src/App.tsx`

**Step 1: Install React Router**

Run:
```bash
npm install react-router-dom
```

**Step 2: Create placeholder pages**

Create `src/pages/CreatorList.tsx`:

```tsx
export function CreatorList() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Your Creators</h1>
      <p className="text-muted-foreground">No creators yet. Add your first one!</p>
    </div>
  );
}
```

Create `src/pages/Settings.tsx`:

```tsx
export function Settings() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Global Settings</h1>
      <p className="text-muted-foreground">Configure your preferences here.</p>
    </div>
  );
}
```

**Step 3: Set up router in App.tsx**

Replace `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreatorList } from "@/pages/CreatorList";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreatorList />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
```

**Step 4: Verify routing works**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: set up React Router with placeholder pages"
```

---

### Task 1.5: Create App Shell Layout

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`

**Step 1: Add required shadcn components**

Run:
```bash
npx shadcn@latest add card separator scroll-area
```

**Step 2: Create Sidebar component**

Create `src/components/layout/Sidebar.tsx`:

```tsx
import { Link, useLocation } from "react-router-dom";
import { Home, Settings, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Creators", icon: Home },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6" />
          <span className="font-semibold text-lg">N3Ms Media Library</span>
        </div>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 3: Create AppShell component**

Create `src/components/layout/AppShell.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppShell() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Outlet />
        </ScrollArea>
      </main>
    </div>
  );
}
```

**Step 4: Update App.tsx to use AppShell**

Replace `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CreatorList } from "@/pages/CreatorList";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CreatorList />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
```

**Step 5: Verify layout works**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell layout with sidebar navigation"
```

---

## Phase 2: Rust Backend Foundation

### Task 2.1: Set Up SQLite with rusqlite

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/migrations.rs`
- Modify: `src-tauri/src/main.rs`

**Step 1: Add rusqlite dependency**

Add to `src-tauri/Cargo.toml` under `[dependencies]`:

```toml
rusqlite = { version = "0.31", features = ["bundled"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
```

**Step 2: Create db module**

Create `src-tauri/src/db/mod.rs`:

```rust
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
```

**Step 3: Create migrations**

Create `src-tauri/src/db/migrations.rs`:

```rust
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
```

**Step 4: Update main.rs to initialize database**

Replace `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use db::Database;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            let database = Database::new(app_data_dir)
                .expect("Failed to initialize database");

            database.run_migrations()
                .expect("Failed to run migrations");

            app.manage(database);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 5: Verify Rust compiles**

Run:
```bash
cd src-tauri && cargo build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: set up SQLite database with schema migrations"
```

---

### Task 2.2: Create Creator CRUD Commands

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/creators.rs`
- Create: `src-tauri/src/models/mod.rs`
- Create: `src-tauri/src/models/creator.rs`
- Modify: `src-tauri/src/main.rs`

**Step 1: Create models module**

Create `src-tauri/src/models/mod.rs`:

```rust
pub mod creator;

pub use creator::Creator;
```

Create `src-tauri/src/models/creator.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Creator {
    pub id: String,
    pub name: String,
    pub photo_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCreatorRequest {
    pub name: String,
    pub photo_path: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCreatorRequest {
    pub name: Option<String>,
    pub photo_path: Option<String>,
}
```

**Step 2: Create commands module**

Create `src-tauri/src/commands/mod.rs`:

```rust
pub mod creators;

pub use creators::*;
```

Create `src-tauri/src/commands/creators.rs`:

```rust
use crate::db::Database;
use crate::models::creator::{CreateCreatorRequest, Creator, UpdateCreatorRequest};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
pub fn get_creators(db: State<Database>) -> Result<Vec<Creator>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, photo_path, created_at, updated_at FROM creators ORDER BY name")
        .map_err(|e| e.to_string())?;

    let creators = stmt
        .query_map([], |row| {
            Ok(Creator {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(creators)
}

#[tauri::command]
pub fn get_creator(db: State<Database>, id: String) -> Result<Creator, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, name, photo_path, created_at, updated_at FROM creators WHERE id = ?",
        [&id],
        |row| {
            Ok(Creator {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_creator(db: State<Database>, request: CreateCreatorRequest) -> Result<Creator, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO creators (id, name, photo_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (&id, &request.name, &request.photo_path, &now, &now),
    )
    .map_err(|e| e.to_string())?;

    Ok(Creator {
        id,
        name: request.name,
        photo_path: request.photo_path,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_creator(db: State<Database>, id: String, request: UpdateCreatorRequest) -> Result<Creator, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    // Get current creator
    let mut creator = conn.query_row(
        "SELECT id, name, photo_path, created_at, updated_at FROM creators WHERE id = ?",
        [&id],
        |row| {
            Ok(Creator {
                id: row.get(0)?,
                name: row.get(1)?,
                photo_path: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    ).map_err(|e| e.to_string())?;

    // Update fields
    if let Some(name) = request.name {
        creator.name = name;
    }
    if let Some(photo_path) = request.photo_path {
        creator.photo_path = Some(photo_path);
    }
    creator.updated_at = now;

    conn.execute(
        "UPDATE creators SET name = ?, photo_path = ?, updated_at = ? WHERE id = ?",
        (&creator.name, &creator.photo_path, &creator.updated_at, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(creator)
}

#[tauri::command]
pub fn delete_creator(db: State<Database>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM creators WHERE id = ?", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
```

**Step 3: Register commands in main.rs**

Update `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

use db::Database;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            let database = Database::new(app_data_dir)
                .expect("Failed to initialize database");

            database.run_migrations()
                .expect("Failed to run migrations");

            app.manage(database);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_creators,
            commands::get_creator,
            commands::create_creator,
            commands::update_creator,
            commands::delete_creator,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Verify Rust compiles**

Run:
```bash
cd src-tauri && cargo build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Creator CRUD Tauri commands"
```

---

### Task 2.3: Create Frontend Hooks for Creators

**Files:**
- Create: `src/lib/tauri.ts`
- Create: `src/hooks/useCreators.ts`
- Create: `src/types/creator.ts`

**Step 1: Install Tauri API package**

Run:
```bash
npm install @tauri-apps/api
```

**Step 2: Create types**

Create `src/types/creator.ts`:

```typescript
export interface Creator {
  id: string;
  name: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCreatorRequest {
  name: string;
  photo_path?: string | null;
}

export interface UpdateCreatorRequest {
  name?: string;
  photo_path?: string | null;
}
```

**Step 3: Create Tauri invoke wrapper**

Create `src/lib/tauri.ts`:

```typescript
import { invoke } from "@tauri-apps/api/core";
import type { Creator, CreateCreatorRequest, UpdateCreatorRequest } from "@/types/creator";

export const api = {
  creators: {
    getAll: () => invoke<Creator[]>("get_creators"),
    get: (id: string) => invoke<Creator>("get_creator", { id }),
    create: (request: CreateCreatorRequest) => invoke<Creator>("create_creator", { request }),
    update: (id: string, request: UpdateCreatorRequest) => invoke<Creator>("update_creator", { id, request }),
    delete: (id: string) => invoke<void>("delete_creator", { id }),
  },
};
```

**Step 4: Create useCreators hook**

Create `src/hooks/useCreators.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/tauri";
import type { Creator, CreateCreatorRequest, UpdateCreatorRequest } from "@/types/creator";

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.creators.getAll();
      setCreators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const createCreator = async (request: CreateCreatorRequest) => {
    const creator = await api.creators.create(request);
    setCreators((prev) => [...prev, creator].sort((a, b) => a.name.localeCompare(b.name)));
    return creator;
  };

  const updateCreator = async (id: string, request: UpdateCreatorRequest) => {
    const creator = await api.creators.update(id, request);
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? creator : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    return creator;
  };

  const deleteCreator = async (id: string) => {
    await api.creators.delete(id);
    setCreators((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    creators,
    loading,
    error,
    refetch: fetchCreators,
    createCreator,
    updateCreator,
    deleteCreator,
  };
}
```

**Step 5: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add frontend hooks for Creator CRUD operations"
```

---

### Task 2.4: Build Creator List UI

**Files:**
- Create: `src/components/creators/CreatorCard.tsx`
- Create: `src/components/creators/CreateCreatorDialog.tsx`
- Modify: `src/pages/CreatorList.tsx`

**Step 1: Add required shadcn components**

Run:
```bash
npx shadcn@latest add dialog input label avatar
```

**Step 2: Create CreatorCard component**

Create `src/components/creators/CreatorCard.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Creator } from "@/types/creator";

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const initials = creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link to={`/creators/${creator.id}`}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center p-6 gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={creator.photo_path || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="font-semibold">{creator.name}</h3>
            <p className="text-sm text-muted-foreground">0 videos</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 3: Create CreateCreatorDialog component**

Create `src/components/creators/CreateCreatorDialog.tsx`:

```tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateCreatorDialogProps {
  onSubmit: (name: string) => Promise<void>;
}

export function CreateCreatorDialog({ onSubmit }: CreateCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSubmit(name.trim());
      setName("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to create creator:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Creator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Creator</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter creator name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Update CreatorList page**

Replace `src/pages/CreatorList.tsx`:

```tsx
import { useCreators } from "@/hooks/useCreators";
import { CreatorCard } from "@/components/creators/CreatorCard";
import { CreateCreatorDialog } from "@/components/creators/CreateCreatorDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function CreatorList() {
  const { creators, loading, error, createCreator } = useCreators();

  const handleCreateCreator = async (name: string) => {
    await createCreator({ name });
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Creators</h1>
        <CreateCreatorDialog onSubmit={handleCreateCreator} />
      </div>

      {creators.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No creators yet. Add your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 5: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: build Creator List UI with cards and create dialog"
```

---

## Phase 3: Creator Individual View

### Task 3.1: Create Creator View with Tabs

**Files:**
- Create: `src/pages/CreatorView.tsx`
- Create: `src/pages/creator/Dashboard.tsx`
- Create: `src/pages/creator/CreatorSettings.tsx`
- Create: `src/pages/creator/Feed.tsx`
- Create: `src/pages/creator/Warehouse.tsx`
- Modify: `src/App.tsx`

**Step 1: Add required shadcn components**

Run:
```bash
npx shadcn@latest add tabs
```

**Step 2: Create placeholder tab components**

Create `src/pages/creator/Dashboard.tsx`:

```tsx
export function Dashboard() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <p className="text-muted-foreground">Statistics will appear here.</p>
    </div>
  );
}
```

Create `src/pages/creator/CreatorSettings.tsx`:

```tsx
export function CreatorSettings() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <p className="text-muted-foreground">Manage sources here.</p>
    </div>
  );
}
```

Create `src/pages/creator/Feed.tsx`:

```tsx
export function Feed() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Creator Feed</h2>
      <p className="text-muted-foreground">Add sources to see the feed.</p>
    </div>
  );
}
```

Create `src/pages/creator/Warehouse.tsx`:

```tsx
export function Warehouse() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Warehouse</h2>
      <p className="text-muted-foreground">Downloaded videos will appear here.</p>
    </div>
  );
}
```

**Step 3: Create CreatorView page**

Create `src/pages/CreatorView.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/tauri";
import type { Creator } from "@/types/creator";
import { Dashboard } from "./creator/Dashboard";
import { CreatorSettings } from "./creator/CreatorSettings";
import { Feed } from "./creator/Feed";
import { Warehouse } from "./creator/Warehouse";

export function CreatorView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCreator = async () => {
      try {
        setLoading(true);
        const data = await api.creators.get(id);
        setCreator(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="p-8">
        <p className="text-destructive">Error: {error || "Creator not found"}</p>
        <Button variant="link" onClick={() => navigate("/")}>
          Go back
        </Button>
      </div>
    );
  }

  const initials = creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={creator.photo_path || undefined} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{creator.name}</h1>
          <p className="text-muted-foreground">0 sources · 0 videos</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>
        <TabsContent value="settings">
          <CreatorSettings />
        </TabsContent>
        <TabsContent value="feed">
          <Feed />
        </TabsContent>
        <TabsContent value="warehouse">
          <Warehouse />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 4: Add route in App.tsx**

Update `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CreatorList } from "@/pages/CreatorList";
import { CreatorView } from "@/pages/CreatorView";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CreatorList />} />
            <Route path="/creators/:id" element={<CreatorView />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
```

**Step 5: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Creator individual view with tab layout"
```

---

## Summary: Phases Covered

This plan covers the foundational phases:

1. **Phase 1: Project Scaffolding** (Tasks 1.1-1.5)
   - Tauri + React project initialization
   - Tailwind CSS configuration
   - shadcn/ui setup
   - React Router setup
   - App shell layout

2. **Phase 2: Rust Backend Foundation** (Tasks 2.1-2.4)
   - SQLite database setup with schema
   - Creator CRUD Tauri commands
   - Frontend hooks for Creator operations
   - Creator List UI

3. **Phase 3: Creator Individual View** (Task 3.1)
   - Tab-based creator view
   - Placeholder tabs for Dashboard, Settings, Feed, Warehouse

---

## Next Implementation Phases (Future Plans)

- **Phase 4:** Source CRUD (YouTube, Patreon channels)
- **Phase 5:** Background sync workers
- **Phase 6:** Feed view with filters
- **Phase 7:** Download manager with yt-dlp
- **Phase 8:** Warehouse view and manual import
- **Phase 9:** Video player with bass boost
- **Phase 10:** Global settings and first-time wizard
- **Phase 11:** MeiliSearch integration
- **Phase 12:** Notifications

---

**Plan complete and saved to `docs/plans/2026-01-31-n3ms-media-library-implementation.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
