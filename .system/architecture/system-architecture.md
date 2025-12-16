# AIDA System Architecture

> **Document Type:** System Architecture Specification
> **Version:** 2.0
> **Date:** 2025-12-14
> **Scope:** Complete Database Layer - Aligned with Implementation
> **Status:** Production - Reflects Actual Implementation

---

## 1. Executive Summary

This document defines the internal system architecture for AIDA (AI Digital Assistant), a cognitive augmentation system built on Claude Code. The architecture uses SQLite via Bun's native `bun:sqlite` module with a comprehensive TypeScript query layer.

### 1.1 Design Goals

| Goal | Description |
|------|-------------|
| **Simplicity** | Minimal schema covering core needs without over-engineering |
| **Safety** | All database access through TypeScript scripts - NEVER direct SQL |
| **Extensibility** | Easy to add tables and relationships as system grows |
| **Performance** | Optimized for common queries using indexes, views, and WAL mode |
| **Neurotype Support** | Schema designed to support cognitive augmentation patterns |
| **Temporal Awareness** | Built-in support for time-based queries and staleness detection |

### 1.2 Implemented Components

The complete data layer includes:
- **Roles** - Professional and personal roles with responsibilities tracking
- **Projects** - Grouped tasks with finish criteria and progress tracking
- **Tasks** - Core entity with full lifecycle management and subtask support
- **Journal Entries** - Structured activity logging with flexible categorization
- **Views** - Pre-computed queries for common access patterns
- **36 Query Functions** - Complete CRUD operations across all entities

---

## 2. File Conventions and Directory Structure

### 2.1 Directory Structure

```
.system/
├── architecture/                   # Architecture documentation
│   ├── solution-architecture.md    # Solution architecture (integration patterns)
│   ├── system-architecture.md      # This document
│   └── agent-architecture.md       # AI agent specifications
├── context/                        # User context
│   ├── personal-profile.json       # User profile
│   └── personal-profile-schema.json
├── data/                           # Structured data (SQLite)
│   ├── aida.db                     # Primary SQLite database
│   ├── aida.db-wal                 # WAL file (auto-generated)
│   ├── aida.db-shm                 # Shared memory file (auto-generated)
│   └── schema/
│       └── db_schema.sql           # Schema definition
├── tools/                          # Scripts and utilities
│   ├── database/                   # Database layer
│   │   ├── __tests__/              # Test files
│   │   │   ├── setup.ts            # Test setup and lifecycle
│   │   │   ├── demo-data.ts        # Demo data seeding
│   │   │   ├── tasks.test.ts       # Task query tests
│   │   │   ├── roles.test.ts       # Role query tests
│   │   │   ├── projects.test.ts    # Project query tests
│   │   │   └── journal.test.ts     # Journal query tests
│   │   ├── queries/                # Query functions
│   │   │   ├── index.ts            # Re-exports all queries
│   │   │   ├── tasks.ts            # Task CRUD (12 functions)
│   │   │   ├── roles.ts            # Role CRUD (7 functions)
│   │   │   ├── projects.ts         # Project CRUD (10 functions)
│   │   │   └── journal.ts          # Journal CRUD (7 functions)
│   │   ├── connection.ts           # Database connection singleton
│   │   ├── helpers.ts              # Utility functions
│   │   ├── manage-db.ts            # CLI tool (init/delete/reset)
│   │   └── types.ts                # TypeScript interfaces
│   └── utilities/
│       └── symbols.ts              # Status enums and emoji mappings
└── architecture/                   # Design specs and coding standards
    └── commenting-style.md         # Code documentation standards
```

**Note:** Daily journals are stored as **markdown files** in `0-JOURNAL/`, NOT in the database. Journal entries in the database log discrete events for pattern analysis. See solution-architecture.md Section 4 for details.

### 2.2 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `tasks`, `journal_entries` |
| Columns | snake_case | `created_at`, `role_id` |
| Indexes | `idx_{table}_{column(s)}` | `idx_tasks_role_status` |
| Views | `v_{name}` | `v_tasks_full` |
| TypeScript files | kebab-case | `task-operations.ts` |
| Interfaces | PascalCase | `Task`, `TaskInput` |
| Functions | camelCase | `getTaskById`, `createTask` |

---

## 3. Database Schema Design

### 3.1 Entity Relationship Diagram

```
+------------------+
|      roles       |
+------------------+
| id (PK)          |
| name             |
| type             |
| description      |
| responsibilities |  ← JSON array
| status           |
| balance_target   |
| created_at       |
| updated_at       |
+--------+---------+
         |
         | 1
         |
         | *
+--------+---------+        +------------------+
|     projects     |        |  journal_entries |
+------------------+        +------------------+
| id (PK)          |        | id (PK)          |
| name             |        | timestamp        |
| role_id (FK)     |        | entry_type       |
| status           |        | content          |
| description      |        | related_task_id  |------+
| finish_criteria  |  ← JSON| related_project_id|----+|
| created_at       |        | related_role_id  |--+ | |
+--------+---------+        +------------------+  | | |
         |                                        | | |
         | 1                                      | | |
         |                                        | | |
         | *                                      | | |
+--------+---------+                              | | |
|      tasks       |                              | | |
+------------------+                              | | |
| id (PK)          |<-----------------------------+ | |
| title            |                                | |
| notes            |                                | |
| status           |                                | |
| priority         |                                | |
| energy_requirement|                               | |
| time_estimate    |                                | |
| project_id (FK)  |<-------------------------------+ |
| role_id (FK)     |<---------------------------------+
| parent_task_id   |-----+
| start_date       |     |
| deadline         |     |
| remind_date      |     |
| created_at       |     |
+--------+---------+     |
         |               |
         | 1             |
         |               |
         | * (subtasks)  |
         +---------------+
```

### 3.2 Complete Schema Definition

The schema is defined in `.system/data/schema/db_schema.sql`. Key points:

**PRAGMA Settings:**
```sql
PRAGMA journal_mode = WAL;      -- Write-ahead logging
PRAGMA synchronous = NORMAL;    -- Balance safety and performance
PRAGMA foreign_keys = ON;       -- Enforce referential integrity
PRAGMA busy_timeout = 5000;     -- 5 second lock timeout
```

**Tables:**

#### 3.2.1 roles

```sql
CREATE TABLE IF NOT EXISTS roles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN (
                        'meta', 'work', 'personal', 'private',
                        'civic', 'side_business', 'hobby'
                    )),
    description     TEXT,
    responsibilities TEXT,  -- JSON array: ["responsibility 1", "responsibility 2", ...]
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'inactive', 'historical'
                    )),
    balance_target  REAL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Purpose:** Represents professional and personal roles with responsibilities tracking and workload balance targets.

**Key Fields:**
- `name` - Role name (e.g., "Senior Fullstack Developer")
- `type` - Category for grouping (work, personal, etc.)
- `responsibilities` - JSON array of responsibility descriptions
- `status` - active (in use), inactive (paused), historical (archived)
- `balance_target` - Target percentage for weekly time distribution (0.0-1.0)

#### 3.2.2 projects

```sql
CREATE TABLE IF NOT EXISTS projects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    role_id         INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'on_hold', 'completed', 'cancelled'
                    )),
    description     TEXT NOT NULL,
    finish_criteria TEXT,  -- JSON array: [{"criterion": "...", "done": false}, ...]
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);
```

**Purpose:** Groups related tasks under projects with measurable completion criteria.

**Key Fields:**
- `finish_criteria` - JSON array of completion criteria with done flags
- `status` - active (ongoing), on_hold (paused), completed (finished), cancelled (abandoned)

#### 3.2.3 tasks

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               TEXT NOT NULL,
    notes               TEXT,
    status              TEXT NOT NULL DEFAULT 'captured' CHECK (status IN (
                            'captured',     -- Just captured, needs processing
                            'clarified',    -- Processed, but not yet actionable
                            'ready',        -- Actionable, waiting to be started
                            'planned',      -- Planned and waiting
                            'done',         -- Completed successfully
                            'cancelled'     -- Deliberately decided not to do
                        )),
    priority            INTEGER DEFAULT 1 CHECK (priority BETWEEN 0 AND 3),
    energy_requirement  TEXT CHECK (energy_requirement IN ('low', 'medium', 'high')),
    time_estimate       INTEGER,
    project_id          INTEGER,
    role_id             INTEGER NOT NULL,
    parent_task_id      INTEGER,
    start_date          TEXT,
    deadline            TEXT,
    remind_date         TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
```

**Purpose:** Core task entity with full lifecycle management and subtask hierarchy support.

**Key Fields:**
- `parent_task_id` - Self-referencing FK for subtasks
- `priority` - Integer 0-3 for sorting (higher = more important)
- `energy_requirement` - Match tasks to user's energy levels
- `time_estimate` - Estimated completion time in minutes

**Status Lifecycle:**
```
captured → clarified → ready → planned → done
                                      ↘
                                    cancelled
```

#### 3.2.4 journal_entries

```sql
CREATE TABLE IF NOT EXISTS journal_entries (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp           TEXT NOT NULL DEFAULT (datetime('now')),
    entry_type          TEXT NOT NULL DEFAULT 'check-in' CHECK (entry_type IN (
                        'checkin', 'reflection', 'task', 'event', 'note', 'idea'
                    )),
    content             TEXT NOT NULL,
    related_task_id     INTEGER,
    related_project_id  INTEGER,
    related_role_id     INTEGER,
    FOREIGN KEY (related_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (related_role_id) REFERENCES roles(id) ON DELETE SET NULL
);
```

**Purpose:** Structured activity logging with flexible categorization for pattern analysis.

**Entry Types:**
- `checkin` - Daily check-ins (morning/midday/evening)
- `reflection` - Reflections and learnings
- `task` - Task completion logs
- `event` - Meeting and event logs
- `note` - General notes
- `idea` - Captured ideas

**Design:** Immutable append-only log. No UPDATE or DELETE operations.

### 3.3 Indexes

Optimized for common query patterns:

```sql
-- Roles
CREATE INDEX idx_roles_status ON roles(status);
CREATE INDEX idx_roles_type ON roles(type);

-- Tasks
CREATE INDEX idx_tasks_role_status ON tasks(role_id, status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_role ON tasks(role_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_remind ON tasks(remind_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_status_energy ON tasks(status, energy_requirement);
CREATE INDEX idx_tasks_due_date ON tasks(deadline) WHERE deadline IS NOT NULL;

-- Journal entries
CREATE INDEX idx_journal_timestamp ON journal_entries(timestamp);
CREATE INDEX idx_journal_task ON journal_entries(related_task_id);
CREATE INDEX idx_journal_project ON journal_entries(related_project_id);
CREATE INDEX idx_journal_role ON journal_entries(related_role_id);
```

### 3.4 Triggers

Automatic timestamp management:

```sql
-- Update timestamp trigger for roles
CREATE TRIGGER trg_roles_updated_at
AFTER UPDATE ON roles
BEGIN
    UPDATE roles SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

### 3.5 Views

Pre-computed queries for common access patterns:

#### v_tasks_full

Complete task context with role, project, subtasks, and calculated fields:

```sql
CREATE VIEW v_tasks_full AS
SELECT
    t.id,
    t.title,
    t.notes,
    t.status,
    t.priority,
    t.energy_requirement,
    t.time_estimate,
    t.start_date,
    t.deadline,
    t.remind_date,
    t.created_at,
    -- Role context
    t.role_id,
    r.name AS role_name,
    r.type AS role_type,
    -- Project context
    t.project_id,
    p.name AS project_name,
    p.status AS project_status,
    -- Parent task (if subtask)
    t.parent_task_id,
    pt.title AS parent_title,
    -- Subtasks as JSON array
    (SELECT json_group_array(json_object(
        'id', st.id,
        'title', st.title,
        'status', st.status
    ))
    FROM tasks st
    WHERE st.parent_task_id = t.id) AS subtasks_json,
    -- Calculated fields
    CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) AS days_since_creation,
    CASE
        WHEN t.deadline IS NOT NULL AND DATE(t.deadline) < DATE('now')
             AND t.status NOT IN ('done', 'cancelled')
        THEN CAST((julianday('now') - julianday(t.deadline)) AS INTEGER)
        ELSE NULL
    END AS days_overdue,
    CAST(strftime('%W', COALESCE(t.deadline, t.start_date, t.created_at)) AS INTEGER) AS week_number
FROM tasks t
JOIN roles r ON t.role_id = r.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN tasks pt ON t.parent_task_id = pt.id;
```

#### v_today_tasks

Tasks relevant for today's planning:

```sql
CREATE VIEW v_today_tasks AS
SELECT * FROM v_tasks_full
WHERE status NOT IN ('done', 'cancelled')
  AND (
    DATE(start_date) <= DATE('now')
    OR DATE(deadline) <= DATE('now')
    OR (DATE(deadline) <= DATE('now', '+7 days') AND start_date IS NULL)
    OR DATE(remind_date) = DATE('now')
  )
ORDER BY
    CASE WHEN days_overdue IS NOT NULL THEN 0 ELSE 1 END,
    days_overdue DESC,
    priority DESC,
    deadline;
```

#### v_overdue_tasks

Tasks past their deadline:

```sql
CREATE VIEW v_overdue_tasks AS
SELECT * FROM v_tasks_full
WHERE days_overdue IS NOT NULL
ORDER BY days_overdue DESC;
```

#### v_stale_tasks

Tasks that haven't progressed in a while:

```sql
CREATE VIEW v_stale_tasks AS
SELECT * FROM v_tasks_full
WHERE status IN ('captured', 'clarified', 'ready')
  AND (
    (status IN ('captured', 'clarified') AND days_since_creation >= 28)
    OR (status = 'ready' AND days_since_creation >= 14)
  )
ORDER BY days_since_creation DESC;
```

#### v_projects_full

Projects with task statistics and progress:

```sql
CREATE VIEW v_projects_full AS
SELECT
    p.id,
    p.name,
    p.status,
    p.description,
    p.finish_criteria,
    p.created_at,
    -- Role context
    p.role_id,
    r.name AS role_name,
    r.type AS role_type,
    -- Task statistics
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') AS done_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status NOT IN ('done', 'cancelled')) AS active_tasks,
    -- Percent complete
    CASE
        WHEN (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) > 0
        THEN ROUND(100.0 * (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done')
                   / (SELECT COUNT(*) FROM tasks WHERE project_id = p.id), 1)
        ELSE 0
    END AS percent_complete,
    -- Tasks as JSON
    (SELECT json_group_array(json_object(
        'id', t.id,
        'title', t.title,
        'status', t.status,
        'priority', t.priority,
        'deadline', t.deadline
    ))
    FROM tasks t
    WHERE t.project_id = p.id) AS tasks_json
FROM projects p
JOIN roles r ON p.role_id = r.id;
```

#### v_roles_summary

Roles with project and task aggregation:

```sql
CREATE VIEW v_roles_summary AS
SELECT
    r.id,
    r.name,
    r.type,
    r.description,
    r.responsibilities,
    r.status,
    r.balance_target,
    r.created_at,
    r.updated_at,
    -- Project statistics
    (SELECT COUNT(*) FROM projects WHERE role_id = r.id AND status = 'active') AS active_projects,
    (SELECT COUNT(*) FROM projects WHERE role_id = r.id AND status = 'on_hold') AS paused_projects,
    -- Task statistics
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status NOT IN ('done', 'cancelled')) AS active_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status = 'captured') AS captured_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status = 'ready') AS ready_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status = 'planned') AS planned_tasks,
    -- Overdue tasks
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id
     AND deadline IS NOT NULL AND DATE(deadline) < DATE('now')
     AND status NOT IN ('done', 'cancelled')) AS overdue_tasks,
    -- Projects as JSON
    (SELECT json_group_array(json_object(
        'id', p.id,
        'name', p.name,
        'status', p.status
    ))
    FROM projects p
    WHERE p.role_id = r.id AND p.status IN ('active', 'on_hold')) AS projects_json
FROM roles r;
```

---

## 4. TypeScript Type System

### 4.1 Type Definitions (`types.ts`)

All types are defined in `.system/tools/database/types.ts` and imported from `.system/tools/utilities/symbols.ts`.

#### Status Enums (from symbols.ts)

```typescript
export type TaskStatus = 'captured' | 'clarified' | 'ready' | 'planned' | 'done' | 'cancelled';
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';
export type RoleStatus = 'active' | 'inactive' | 'historical';
export type EntryType = 'checkin' | 'reflection' | 'task' | 'event' | 'note' | 'idea';
export type RoleType = 'meta' | 'work' | 'personal' | 'private' | 'civic' | 'side_business' | 'hobby';
```

#### Base Entity Interfaces

```typescript
// Task entity matching the tasks table
export interface Task {
  id: number;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: number; // 0-3
  energy_requirement: 'low' | 'medium' | 'high' | null;
  time_estimate: number | null; // minutes
  project_id: number | null;
  role_id: number;
  parent_task_id: number | null;
  start_date: string | null; // ISO date
  deadline: string | null; // ISO date
  remind_date: string | null; // ISO date
  created_at: string; // ISO datetime
}

// Role entity matching the roles table
export interface Role {
  id: number;
  name: string;
  type: RoleType;
  description: string | null;
  responsibilities: string | null; // JSON array as string
  status: RoleStatus;
  balance_target: number | null; // 0.0-1.0
  created_at: string;
  updated_at: string;
}

// Project entity matching the projects table
export interface Project {
  id: number;
  name: string;
  role_id: number;
  status: ProjectStatus;
  description: string;
  finish_criteria: string | null; // JSON array as string
  created_at: string;
}

// JournalEntry entity matching the journal_entries table
export interface JournalEntry {
  id: number;
  timestamp: string; // ISO datetime
  entry_type: EntryType;
  content: string;
  related_task_id: number | null;
  related_project_id: number | null;
  related_role_id: number | null;
}
```

#### View Types (Extended)

```typescript
// Subtask information object
export interface SubtaskInfo {
  id: number;
  title: string;
  status: TaskStatus;
}

// Extended task view from v_tasks_full
export interface TaskFull extends Task {
  // Role context
  role_name: string;
  role_type: RoleType;
  // Project context
  project_name: string | null;
  project_status: ProjectStatus | null;
  // Parent task
  parent_title: string | null;
  // Subtasks as JSON string (parse with parseSubtasks)
  subtasks_json: string;
  // Calculated fields
  days_since_creation: number;
  days_overdue: number | null;
  week_number: number;
}

// Extended project view from v_projects_full
export interface ProjectFull extends Project {
  role_name: string;
  role_type: RoleType;
  total_tasks: number;
  done_tasks: number;
  active_tasks: number;
  percent_complete: number;
  tasks_json: string;
}

// Extended role view from v_roles_summary
export interface RoleSummary extends Role {
  active_projects: number;
  paused_projects: number;
  active_tasks: number;
  captured_tasks: number;
  ready_tasks: number;
  planned_tasks: number;
  overdue_tasks: number;
  projects_json: string;
}

// Extended journal entry view
export interface JournalEntryFull extends JournalEntry {
  task_title?: string;
  project_name?: string;
  role_name?: string;
}
```

#### Input Types

```typescript
// Input for creating a new task
export interface CreateTaskInput {
  title: string;
  role_id: number;
  notes?: string;
  status?: TaskStatus; // default: 'captured'
  priority?: number;
  energy_requirement?: 'low' | 'medium' | 'high';
  time_estimate?: number;
  project_id?: number;
  parent_task_id?: number;
  start_date?: string;
  deadline?: string;
  remind_date?: string;
}

// Input for updating an existing task
export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  priority?: number;
  energy_requirement?: 'low' | 'medium' | 'high' | null;
  time_estimate?: number | null;
  project_id?: number | null;
  role_id?: number;
  parent_task_id?: number | null;
  start_date?: string | null;
  deadline?: string | null;
  remind_date?: string | null;
}

// Input for creating a new role
export interface CreateRoleInput {
  name: string;
  type: RoleType;
  description?: string;
  responsibilities?: string[]; // Converted to JSON
  balance_target?: number;
}

// Input for updating an existing role
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  responsibilities?: string[];
  balance_target?: number;
}

// Finish criterion for project completion
export interface FinishCriterion {
  criterion: string;
  done: boolean;
}

// Input for creating a new project
export interface CreateProjectInput {
  name: string;
  role_id: number;
  description: string;
  finish_criteria?: FinishCriterion[];
}

// Input for updating an existing project
export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

// Input for creating a new journal entry
export interface CreateEntryInput {
  entry_type: EntryType;
  content: string;
  related_task_id?: number;
  related_project_id?: number;
  related_role_id?: number;
}
```

---

## 5. Database Connection Management

### 5.1 Connection Singleton (`connection.ts`)

**Pattern:** Singleton with lazy initialization

```typescript
import { Database } from 'bun:sqlite';
import { join } from 'path';

const DB_PATH = join(process.cwd(), '.system/data/aida.db');

let db: Database | null = null;

/**
 * Get database connection singleton.
 * Opens connection on first call, reuses on subsequent calls.
 */
export function getDatabase(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: false, readwrite: true });
  }
  return db;
}

/**
 * Close database connection.
 * Used for cleanup in tests or shutdown.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

**Key Points:**
- `create: false` - Requires existing database (prevents accidental creation)
- `readwrite: true` - Full read/write access
- WAL mode set by schema, not connection
- Single connection reused across all queries

---

## 6. Helper Functions (`helpers.ts`)

### 6.1 Utility Functions

```typescript
/**
 * Groups array items by a key function.
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  return groups;
}

/**
 * Parses JSON subtask array from database.
 */
export function parseSubtasks(json: string): SubtaskInfo[] {
  try {
    return JSON.parse(json || '[]');
  } catch {
    return [];
  }
}

/**
 * Parses JSON finish criteria from database.
 */
export function parseFinishCriteria(json: string | null): FinishCriterion[] {
  try {
    return JSON.parse(json || '[]');
  } catch {
    return [];
  }
}

/**
 * Gets current ISO week date range (Monday-Sunday).
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0]
  };
}
```

### 6.2 Status Ordering Constants

```typescript
export const TASK_STATUS_ORDER: Record<TaskStatus, number> = {
  planned: 1,
  ready: 2,
  clarified: 3,
  captured: 4,
  done: 5,
  cancelled: 6,
};

export const PROJECT_STATUS_ORDER: Record<ProjectStatus, number> = {
  active: 1,
  on_hold: 2,
  completed: 3,
  cancelled: 4,
};
```

---

## 7. Query Functions

All database operations go through TypeScript query functions. **Direct SQL is NEVER used** by agents, skills, commands, or hooks.

### 7.1 Task Queries (`queries/tasks.ts`)

**12 functions total:**

#### READ Operations (9 functions)

```typescript
/**
 * Get task by ID with full context.
 */
export function getTaskById(
  id: number,
  includeCompleted: boolean = false
): TaskFull | null

/**
 * Fuzzy search tasks by title.
 */
export function searchTasks(
  searchText: string,
  includeCompleted: boolean = false
): TaskFull[]

/**
 * Get today's actionable tasks grouped by role.
 */
export function getTodayTasks(): Map<number, TaskFull[]>

/**
 * Get week's tasks grouped by date.
 */
export function getWeekTasks(): Map<string, TaskFull[]>

/**
 * Get overdue tasks sorted by days overdue.
 */
export function getOverdueTasks(): TaskFull[]

/**
 * Get parent tasks with subtask information.
 */
export function getTasksWithSubtasks(
  roleId?: number,
  projectId?: number
): TaskFull[]

/**
 * Get tasks for a role grouped by status.
 */
export function getTasksByRole(
  roleId: number,
  includeCompleted: boolean = false
): Map<TaskStatus, TaskFull[]>

/**
 * Get tasks for a project with summary stats.
 */
export function getTasksByProject(projectId: number): {
  tasks: Map<TaskStatus, TaskFull[]>;
  summary: {
    total: number;
    done: number;
    active: number;
    percent: number;
  };
}

/**
 * Get stale tasks that need attention.
 */
export function getStaleTasks(
  capturedDays: number = 28,
  readyDays: number = 14
): TaskFull[]
```

#### WRITE Operations (3 functions)

```typescript
/**
 * Create a new task.
 */
export function createTask(input: CreateTaskInput): Task

/**
 * Update an existing task (partial update).
 */
export function updateTask(id: number, input: UpdateTaskInput): Task | null

/**
 * Set task status with automatic journal entry.
 * For 'done' or 'cancelled', creates a journal entry.
 */
export function setTaskStatus(
  id: number,
  status: TaskStatus,
  comment?: string
): Task | null
```

### 7.2 Role Queries (`queries/roles.ts`)

**7 functions total:**

#### READ Operations (4 functions)

```typescript
/**
 * Get role by ID with statistics.
 */
export function getRoleById(id: number): RoleSummary | null

/**
 * Get all active roles with stats.
 */
export function getActiveRoles(): RoleSummary[]

/**
 * Get all inactive/historical roles.
 */
export function getInactiveRoles(): RoleSummary[]

/**
 * Get roles by type.
 */
export function getRolesByType(
  type: RoleType,
  includeInactive: boolean = false
): RoleSummary[]
```

#### WRITE Operations (3 functions)

```typescript
/**
 * Create a new role.
 */
export function createRole(input: CreateRoleInput): Role

/**
 * Update an existing role (partial update).
 */
export function updateRole(id: number, input: UpdateRoleInput): Role | null

/**
 * Set role status.
 * Warns if role has linked tasks and status is inactive/historical.
 */
export function setRoleStatus(id: number, status: RoleStatus): Role | null
```

### 7.3 Project Queries (`queries/projects.ts`)

**10 functions total:**

#### READ Operations (6 functions)

```typescript
/**
 * Get project by ID with full context.
 */
export function getProjectById(id: number): ProjectFull | null

/**
 * Get all projects grouped by status.
 */
export function getAllProjects(includeCompleted: boolean = false): Map<ProjectStatus, ProjectFull[]>

/**
 * Fuzzy search projects by name.
 */
export function searchProjects(
  searchText: string,
  includeCompleted: boolean = false
): ProjectFull[]

/**
 * Get projects for a role grouped by status.
 */
export function getProjectsByRole(roleId: number): Map<ProjectStatus, ProjectFull[]>

/**
 * Get project progress metrics.
 */
export function getProjectProgress(projectId: number): {
  taskProgress: number;      // % based on tasks done
  criteriaProgress: number;  // % based on criteria done
  combined: number;          // average of both
}

/**
 * Get paused projects with idle time.
 */
export function getPausedProjects(): ProjectFull[]
```

#### WRITE Operations (4 functions)

```typescript
/**
 * Create a new project.
 */
export function createProject(input: CreateProjectInput): Project

/**
 * Update an existing project (partial update).
 */
export function updateProject(id: number, input: UpdateProjectInput): Project | null

/**
 * Set project status.
 */
export function setProjectStatus(id: number, status: ProjectStatus): Project | null

/**
 * Update finish criteria (replaces entire array).
 */
export function updateFinishCriteria(
  projectId: number,
  criteria: FinishCriterion[]
): Project | null
```

### 7.4 Journal Queries (`queries/journal.ts`)

**7 functions total (6 READ + 1 WRITE):**

#### READ Operations (6 functions)

```typescript
/**
 * Get today's journal entries with context.
 */
export function getTodayEntries(): JournalEntryFull[]

/**
 * Get all entries for a task (chronological).
 */
export function getEntriesByTask(taskId: number): JournalEntryFull[]

/**
 * Get all entries for a project (chronological).
 */
export function getEntriesByProject(projectId: number): JournalEntryFull[]

/**
 * Get all entries for a role (newest first).
 */
export function getEntriesByRole(roleId: number): JournalEntryFull[]

/**
 * Get entries by type with optional date range.
 */
export function getEntriesByType(
  type: EntryType,
  startDate?: string,
  endDate?: string
): JournalEntryFull[]

/**
 * Get entries within date range.
 */
export function getEntriesByDateRange(
  startDate: string,
  endDate: string
): JournalEntryFull[]
```

#### WRITE Operations (1 function)

```typescript
/**
 * Create a new journal entry.
 * Note: Journal entries are immutable - no update or delete.
 */
export function createEntry(input: CreateEntryInput): JournalEntry
```

---

## 8. Database Management CLI (`manage-db.ts`)

Command-line tool for database lifecycle management:

```bash
# Initialize database (create + apply schema)
bun run .system/tools/database/manage-db.ts init

# Delete database and WAL files
bun run .system/tools/database/manage-db.ts delete

# Reset database (delete + init)
bun run .system/tools/database/manage-db.ts reset
```

**Commands:**
- `init` - Creates database file and applies schema from `db_schema.sql`
- `delete` - Removes `aida.db`, `aida.db-wal`, `aida.db-shm`
- `reset` - Deletes and reinitializes (used in tests)

---

## 9. Testing Infrastructure

### 9.1 Test Setup (`__tests__/setup.ts`)

Uses `bun:test` lifecycle hooks:

```typescript
import { beforeEach } from 'bun:test';
import { seedDemoData } from './demo-data';

// Reset database and seed demo data before each test
beforeEach(async () => {
  await resetDatabase();
  await seedDemoData();
});
```

### 9.2 Demo Data (`__tests__/demo-data.ts`)

Realistic Swedish content for testing:
- 4 roles (work, personal, hobby)
- 3 projects with finish criteria
- 11+ tasks including subtasks
- 6 journal entries

### 9.3 Test Files

- `tasks.test.ts` - Tests all 12 task query functions
- `roles.test.ts` - Tests all 7 role query functions
- `projects.test.ts` - Tests all 10 project query functions
- `journal.test.ts` - Tests all 7 journal query functions

**Run tests:**
```bash
bun test
```

---

## 10. Query Pattern Examples

### 10.1 Common Task Queries

**Get today's tasks for planning:**
```typescript
import { getTodayTasks } from '.system/tools/database/queries/tasks';

const tasksByRole = getTodayTasks();
for (const [roleId, tasks] of tasksByRole) {
  console.log(`Role ${roleId}: ${tasks.length} tasks`);
}
```

**Find overdue tasks:**
```typescript
import { getOverdueTasks } from '.system/tools/database/queries/tasks';

const overdue = getOverdueTasks();
console.log(`${overdue.length} tasks are overdue`);
```

**Get tasks ready for current energy level:**
```typescript
import { getTasksByRole } from '.system/tools/database/queries/tasks';

const tasksByStatus = getTasksByRole(roleId);
const readyTasks = tasksByStatus.get('ready') || [];
const lowEnergyTasks = readyTasks.filter(t => t.energy_requirement === 'low');
```

### 10.2 Common Project Queries

**Get active projects for a role:**
```typescript
import { getProjectsByRole } from '.system/tools/database/queries/projects';

const projectsByStatus = getProjectsByRole(roleId);
const activeProjects = projectsByStatus.get('active') || [];
```

**Check project progress:**
```typescript
import { getProjectProgress } from '.system/tools/database/queries/projects';

const progress = getProjectProgress(projectId);
console.log(`Task completion: ${progress.taskProgress}%`);
console.log(`Criteria completion: ${progress.criteriaProgress}%`);
```

### 10.3 Common Journal Queries

**Get today's check-ins:**
```typescript
import { getEntriesByType } from '.system/tools/database/queries/journal';

const checkins = getEntriesByType('checkin');
console.log(`${checkins.length} check-ins today`);
```

**Get task history:**
```typescript
import { getEntriesByTask } from '.system/tools/database/queries/journal';

const history = getEntriesByTask(taskId);
for (const entry of history) {
  console.log(`${entry.timestamp}: ${entry.content}`);
}
```

---

## 11. Performance Considerations

### 11.1 SQLite Configuration

```sql
PRAGMA journal_mode = WAL;      -- Write-ahead logging for concurrency
PRAGMA synchronous = NORMAL;    -- Balance between safety and speed
PRAGMA foreign_keys = ON;       -- Enforce referential integrity
PRAGMA busy_timeout = 5000;     -- Wait up to 5 seconds on locks
```

**WAL Mode Benefits:**
- Concurrent reads during writes
- Better performance for mixed workloads
- Crash recovery without journal rollback

### 11.2 Index Strategy

| Index | Purpose | Query Pattern |
|-------|---------|---------------|
| `idx_tasks_role_status` | Primary task lookup | Filter by role + status |
| `idx_tasks_status_energy` | Energy-aware selection | Match tasks to energy level |
| `idx_tasks_due_date` | Deadline queries | Find upcoming/overdue tasks |
| `idx_journal_timestamp` | Time-range queries | Get entries for date range |
| `idx_journal_task` | Task history | Get all entries for a task |

### 11.3 View Performance

Views are **computed at query time** (not materialized). For frequently-accessed data:
- Use views for complex joins (role/project context)
- Views include calculated fields (days_overdue, percent_complete)
- Views reduce query complexity in application code

### 11.4 Expected Performance

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Single task read | <1ms | Indexed lookup |
| Today's tasks query | <5ms | View query, indexed |
| Create task | <2ms | Single insert |
| Update task | <2ms | Indexed update |
| Journal entry insert | <1ms | Append-only |
| Project progress | <5ms | Aggregation query |

---

## 12. Architecture Decision Records

### ADR-001: SQLite with Bun Native Driver

**Status:** Accepted

**Context:** Need local-first database for single-user cognitive assistant.

**Decision:** Use SQLite via Bun's native `bun:sqlite` module.

**Rationale:**
- **Simplicity:** Single file, no server process
- **Performance:** Bun's driver is 3-6x faster than alternatives
- **Portability:** Easy backup, sync, migration
- **Local-first:** Complete data sovereignty
- **Sufficient scale:** Single user with <10K tasks well within capacity

**Consequences:**
- (+) Zero configuration, zero external dependencies
- (+) Fast development iteration
- (+) Easy backup and recovery
- (-) No built-in multi-device sync (acceptable for MVP)
- (-) Limited to single concurrent writer (acceptable for single user)

### ADR-002: Task Status Lifecycle

**Status:** Accepted

**Context:** Tasks need clear progression from capture to completion.

**Decision:** Six-status lifecycle: `captured → clarified → ready → planned → done/cancelled`

**Rationale:**
- **Cognitive support:** Distinguishes "captured but unclear" from "ready to work on"
- **Activation focus:** Enables queries for immediately actionable tasks
- **Planned status:** Supports explicit scheduling vs. just "ready"
- **Cancelled vs abandoned:** Deliberate decision to not do vs. failure

**Consequences:**
- (+) Clear progression model
- (+) Enables targeted queries ("show me what's ready")
- (+) Supports neurotype-specific workflows
- (-) More complex than simple todo/done
- (-) Requires lifecycle timestamp management

### ADR-003: JSON Fields for Flexible Metadata

**Status:** Accepted

**Context:** Some data structures are hierarchical and may evolve.

**Decision:** Use JSON text fields for `responsibilities`, `finish_criteria`, `subtasks_json`.

**Rationale:**
- **Extensibility:** Add new fields without schema migrations
- **Type safety:** TypeScript interfaces define expected structure
- **Query capability:** SQLite's JSON functions enable filtering when needed
- **Simplicity:** Easier than additional tables for simple arrays

**Consequences:**
- (+) Easy to add new fields
- (+) TypeScript provides compile-time safety
- (-) No database-level validation of JSON structure
- (-) JSON queries less efficient than native columns (mitigated by indexing)

### ADR-004: Immutable Journal Entries

**Status:** Accepted

**Context:** Need activity tracking for pattern detection and review.

**Decision:** Implement `journal_entries` as append-only (no UPDATE or DELETE).

**Rationale:**
- **Audit trail:** Complete history preserved for debugging
- **Pattern detection:** Historical data enables learning
- **Simplicity:** No update/delete logic needed
- **Performance:** Append-only is fastest for writes

**Consequences:**
- (+) Complete activity history
- (+) Enables time-series analysis
- (+) Simple insert-only logic
- (-) Table grows indefinitely (acceptable for single user scale)
- (-) May need periodic archiving for very active users (future consideration)

### ADR-005: Script-Only Database Access

**Status:** Accepted

**Context:** Need to ensure database safety, consistency, and maintainability.

**Decision:** **ALL database operations MUST go through TypeScript scripts.** Direct SQL is NEVER used by agents, skills, commands, or hooks.

**Rationale:**
- **Safety:** Prevents SQL injection, malformed queries
- **Consistency:** Single source of truth for query logic
- **Maintainability:** Schema changes only require updating scripts
- **Testing:** Query functions are unit tested
- **Type safety:** TypeScript ensures correct types

**Consequences:**
- (+) Database integrity guaranteed
- (+) Easier to refactor and optimize queries
- (+) Clear API for all database operations
- (+) Prevents debugging nightmares from ad-hoc SQL
- (-) Requires discipline to never write SQL in agent prompts
- (-) Must update scripts when adding new query patterns

### ADR-006: Projects Table for Task Grouping

**Status:** Accepted

**Context:** Tasks need to be grouped under larger initiatives with measurable outcomes.

**Decision:** Add `projects` table with `finish_criteria` JSON field.

**Rationale:**
- **Structure:** Natural grouping for related tasks
- **Progress tracking:** Combine task completion + criteria checkboxes
- **Clarity:** Explicit project lifecycle (active, on_hold, completed, cancelled)
- **Flexibility:** JSON criteria allow arbitrary completion conditions

**Consequences:**
- (+) Clear project-level progress metrics
- (+) Supports both task-based and criteria-based completion
- (+) Enables project-focused views and reporting
- (-) Additional table to maintain
- (-) Requires deciding when to use project vs. just tasks

---

## 13. Future Considerations

### 13.1 Potential Enhancements

| Enhancement | Complexity | Value | Notes |
|-------------|------------|-------|-------|
| Task dependencies | Medium | High | `depends_on` table for task graphs |
| Recurring tasks | Medium | Medium | `recurrence_rule` field with cron-like syntax |
| Time tracking | Low | High | Actual time spent per task |
| Tags system | Low | Medium | Many-to-many `task_tags` table |
| Attachments | Medium | Low | `attachments` table with file paths |

### 13.2 Scaling Considerations

For future growth:
- **Archiving:** Move old journal entries to yearly archive tables
- **Partitioning:** Partition journal by year if needed
- **Materialized views:** Consider for expensive aggregations

### 13.3 Multi-Device Sync

For future multi-device support:
- SQLite's serialize/deserialize enables snapshot sync
- Journal entries design supports event sourcing
- Consider CRDT-based sync or Automerge integration

---

## Appendix A: Quick Reference

### Database Commands

```bash
# Initialize database
bun run .system/tools/database/manage-db.ts init

# Reset database (for testing)
bun run .system/tools/database/manage-db.ts reset

# Run tests
bun test

# Check database integrity
sqlite3 .system/data/aida.db "PRAGMA integrity_check"
```

### Common TypeScript Imports

```typescript
// Query functions
import {
  getTaskById,
  getTodayTasks,
  createTask,
  setTaskStatus
} from './.system/tools/database/queries/tasks';

import {
  getActiveRoles,
  getRoleById
} from './.system/tools/database/queries/roles';

import {
  getAllProjects,
  getProjectProgress
} from './.system/tools/database/queries/projects';

import {
  getTodayEntries,
  createEntry
} from './.system/tools/database/queries/journal';

// Types
import type {
  Task,
  TaskFull,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus
} from './.system/tools/database/types';

// Helpers
import {
  groupBy,
  parseSubtasks,
  getCurrentWeekRange
} from './.system/tools/database/helpers';
```

### Useful Query Patterns

```typescript
// Today's ready tasks
const todayTasks = getTodayTasks();

// Overdue tasks
const overdue = getOverdueTasks();

// Stale tasks (customizable thresholds)
const stale = getStaleTasks(28, 14); // 28 days captured, 14 days ready

// Tasks by role and status
const taskMap = getTasksByRole(roleId);
const readyTasks = taskMap.get('ready') || [];

// Active projects
const projectMap = getAllProjects();
const activeProjects = projectMap.get('active') || [];

// Today's check-ins
const entries = getTodayEntries();
const checkins = entries.filter(e => e.entry_type === 'checkin');
```

---

## Document History

| Date | Version | Change |
|------|---------|--------|
| 2025-12-14 | 1.0 | Initial specification (outdated) |
| 2025-12-14 | 2.0 | Complete rewrite - aligned with actual implementation |

---

*End of System Architecture Document*

*This architecture reflects the implemented database layer. All schema changes must be documented via migrations and this document must be updated accordingly.*
