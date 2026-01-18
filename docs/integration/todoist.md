# AIDA-Todoist Integration Design

**Version:** 1.0  
**Date:** 2026-01-18  
**Status:** Ready for implementation

---

## 1. Overview

### 1.1 Goal

Use Todoist as the single source of truth for task management while keeping AIDA as the orchestration layer and Obsidian as the PKM layer.

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TODOIST                                 │
│                    (Task Source of Truth)                       │
│                                                                 │
│   ┌──────────────┐                    ┌──────────────┐         │
│   │  Todoist App │                    │   AIDA CLI   │         │
│   │ (Mobile/Web) │                    │ (Mac/Win)    │         │
│   └──────┬───────┘                    └──────┬───────┘         │
│          │                                   │                  │
│          │    REST API v2 + Sync API v9      │                  │
│          └───────────────┬───────────────────┘                  │
│                          │                                      │
│                          ▼                                      │
│                 ┌────────────────┐                              │
│                 │ Todoist Cloud  │                              │
│                 └────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                           │
                    sync() │ (pull completions)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AIDA                                   │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│   │   Roles     │  │  Projects   │  │       Journal         │  │
│   │  (SQLite)   │  │  (SQLite)   │  │      (SQLite)         │  │
│   │             │  │             │  │                       │  │
│   │ + todoist_  │  │ + todoist_  │  │ + todoist_task_id     │  │
│   │   label     │  │   project_id│  │ + task_completed      │  │
│   └─────────────┘  └─────────────┘  └───────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                   Todoist Sync Layer                     │  │
│   │                                                          │  │
│   │  ensureFresh() - Auto-sync if >5 minutes stale          │  │
│   │  sync()        - Manual full sync (always forced)       │  │
│   │  completeTask()- Call Todoist API + log locally          │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        OBSIDIAN                                 │
│                    (PKM - unchanged)                            │
│                                                                 │
│   /0-JOURNAL/YYYY-MM-DD.md  (generated from journal)           │
│   /Projects/*/               (project notes)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model

### 2.1 Todoist Label Conventions

```
# Roles (created by AIDA)
A01-Work  -> label: a01-work
A02-Family -> label: a02-family
A03-Health -> label: a03-health

# Energy
energy-high
energy-medium
energy-low

# Context (optional)
ctx-computer
ctx-phone
ctx-home
ctx-errands
```

### 2.2 AIDA Schema Updates

```sql
-- Add Todoist label mapping to roles
ALTER TABLE roles ADD COLUMN todoist_label_name TEXT UNIQUE;

-- Add Todoist project mapping to projects
ALTER TABLE projects ADD COLUMN todoist_project_id TEXT UNIQUE;

-- Add Todoist task reference to journal
ALTER TABLE journal_entries ADD COLUMN todoist_task_id TEXT;

-- Sync state table
CREATE TABLE IF NOT EXISTS todoist_sync_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

---

## 3. API Integration

### 3.1 Todoist REST API v2

- `GET /rest/v2/tasks` — list active tasks
- `POST /rest/v2/tasks` — create task
- `POST /rest/v2/tasks/:id` — update task
- `POST /rest/v2/tasks/:id/close` — complete task
- `DELETE /rest/v2/tasks/:id` — delete task
- `GET /rest/v2/projects` — list projects
- `POST /rest/v2/projects` — create project
- `GET /rest/v2/labels` — list labels
- `POST /rest/v2/labels` — create label

### 3.2 Todoist Sync API v9 (Completions)

- `POST /sync/v9/completed/get_all` — completed tasks since timestamp

---

## 4. Sync System

### 4.1 Hybrid Sync Strategy

- **Automatic:** `ensureFresh()` runs before AIDA commands if data is >5 minutes stale.
- **Manual:** `aida sync` forces a full sync regardless of freshness.

### 4.2 Sync Flow

```
AIDA command → ensureFresh()
  ├─ If last sync < 5 min → continue
  └─ Else → sync()
       ├─ fetch completed since last sync
       ├─ create journal entries for new completions
       └─ update sync_state
```

### 4.3 Completed Task Logging

- Completed tasks are **always logged** in `journal_entries`.
- When AIDA completes a task, it calls Todoist immediately and logs locally.
- When Todoist completes a task, the next sync logs it locally.

---

## 5. CLI Commands

### 5.1 Task Operations

```
# Create
bun run src/aida-cli.ts tasks createTask '{"content":"Buy milk","role_id":1}'

# Complete
bun run src/aida-cli.ts tasks completeTask "1234567890"

# List
bun run src/aida-cli.ts tasks getTodayTasks
bun run src/aida-cli.ts tasks getTasksByEnergy "high"
```

### 5.2 Sync

```
# Force sync
bun run src/aida-cli.ts todoist sync

# Status
bun run src/aida-cli.ts todoist syncStatus
```

---

## 6. File Structure

```
src/integrations/todoist/
├── index.ts
├── types.ts
├── config.ts
├── client.ts
├── tasks.ts
├── projects.ts
├── labels.ts
├── completed.ts
├── sync.ts
└── mappers.ts
```

---

## 7. Cross-Platform Notes

- Bun is supported on macOS, Windows (PowerShell), and Linux.
- All paths must be constructed via `path.join()` and `os.homedir()`.
- Manual sync works identically on Mac and Windows.
- Auto-sync runs when AIDA commands are invoked (no OS dependency).

---

## 8. Implementation Order

1. Config + HTTP Client
2. Types + Mappers
3. Labels + Projects sync
4. Task operations (CRUD)
5. Completed sync + ensureFresh()
6. CLI integration
7. Schema migration
8. Skills update
9. Tests + docs
