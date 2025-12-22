# AIDA Database Schema

> SQLite database schema with TypeScript types.

## Database Location

```
<pkm>/.aida/data/aida.db
```

## PRAGMA Settings

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

---

## Entity Relationship Diagram

```
+------------------+
|      roles       |
+------------------+
| id (PK)          |
| name             |
| type             |
| description      |
| responsibilities |  <- JSON array
| status           |
| balance_target   |
+--------+---------+
         |
         | 1:*
         v
+------------------+        +------------------+
|     projects     |        |  journal_entries |
+------------------+        +------------------+
| id (PK)          |        | id (PK)          |
| name             |        | timestamp        |
| role_id (FK)     |        | entry_type       |
| status           |        | content          |
| description      |        | related_task_id  |---+
| finish_criteria  |  <- JSON| related_project_id|--+|
+--------+---------+        | related_role_id  |-+||
         |                  +------------------+ |||
         | 1:*                                   |||
         v                                       |||
+------------------+                             |||
|      tasks       |<----------------------------+||
+------------------+                              ||
| id (PK)          |<-----------------------------+|
| title            |                               |
| notes            |<------------------------------+
| status           |
| priority         |
| energy_requirement|
| time_estimate    |
| project_id (FK)  |
| role_id (FK)     |
| parent_task_id   |---> self-reference (subtasks)
| start_date       |
| deadline         |
| remind_date      |
| created_at       |
+------------------+
```

---

## Table Definitions

### roles

```sql
CREATE TABLE IF NOT EXISTS roles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN (
                        'meta', 'work', 'personal', 'private',
                        'civic', 'side_business', 'hobby'
                    )),
    description     TEXT,
    responsibilities TEXT,  -- JSON array: ["resp 1", "resp 2"]
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'inactive', 'historical'
                    )),
    balance_target  REAL,  -- 0.0-1.0
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

### projects

```sql
CREATE TABLE IF NOT EXISTS projects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    role_id         INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'on_hold', 'completed', 'cancelled'
                    )),
    description     TEXT NOT NULL,
    finish_criteria TEXT,  -- JSON: [{"criterion": "...", "done": false}]
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);
```

### tasks

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               TEXT NOT NULL,
    notes               TEXT,
    status              TEXT NOT NULL DEFAULT 'captured' CHECK (status IN (
                            'captured',     -- Just captured, needs processing
                            'clarified',    -- Processed, not yet actionable
                            'ready',        -- Actionable, waiting to start
                            'planned',      -- Scheduled
                            'done',         -- Completed
                            'cancelled'     -- Deliberately decided not to do
                        )),
    priority            INTEGER DEFAULT 1 CHECK (priority BETWEEN 0 AND 3),
    energy_requirement  TEXT CHECK (energy_requirement IN ('low', 'medium', 'high')),
    time_estimate       INTEGER,  -- minutes
    project_id          INTEGER,
    role_id             INTEGER NOT NULL,
    parent_task_id      INTEGER,  -- for subtasks
    start_date          TEXT,
    deadline            TEXT,
    remind_date         TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
```

**Status Lifecycle:**
```
captured -> clarified -> ready -> planned -> done
                                          \-> cancelled
```

### journal_entries

```sql
CREATE TABLE IF NOT EXISTS journal_entries (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp           TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    entry_type          TEXT NOT NULL DEFAULT 'checkin' CHECK (entry_type IN (
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

**Entry Types:**
- `checkin` - Daily check-ins (morning/midday/evening)
- `reflection` - Reflections and learnings
- `task` - Task completion logs
- `event` - Meeting and event logs
- `note` - General notes
- `idea` - Captured ideas

**Note:** Journal entries are immutable (append-only). No UPDATE or DELETE.

---

## Indexes

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

-- Journal
CREATE INDEX idx_journal_timestamp ON journal_entries(timestamp);
CREATE INDEX idx_journal_task ON journal_entries(related_task_id);
CREATE INDEX idx_journal_project ON journal_entries(related_project_id);
CREATE INDEX idx_journal_role ON journal_entries(related_role_id);
```

---

## Triggers

```sql
CREATE TRIGGER trg_roles_updated_at
AFTER UPDATE ON roles
BEGIN
    UPDATE roles SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

---

## Views

### v_tasks_full

Complete task context with calculated fields:

```sql
CREATE VIEW v_tasks_full AS
SELECT
    t.*,
    r.name AS role_name,
    r.type AS role_type,
    p.name AS project_name,
    p.status AS project_status,
    pt.title AS parent_title,
    (SELECT json_group_array(json_object(
        'id', st.id, 'title', st.title, 'status', st.status
    )) FROM tasks st WHERE st.parent_task_id = t.id) AS subtasks_json,
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

### v_today_tasks

Tasks relevant for today:

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

### v_overdue_tasks

```sql
CREATE VIEW v_overdue_tasks AS
SELECT * FROM v_tasks_full
WHERE days_overdue IS NOT NULL
ORDER BY days_overdue DESC;
```

### v_stale_tasks

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

### v_projects_full

```sql
CREATE VIEW v_projects_full AS
SELECT
    p.*,
    r.name AS role_name,
    r.type AS role_type,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') AS done_tasks,
    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status NOT IN ('done', 'cancelled')) AS active_tasks,
    CASE
        WHEN (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) > 0
        THEN ROUND(100.0 * (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done')
                   / (SELECT COUNT(*) FROM tasks WHERE project_id = p.id), 1)
        ELSE 0
    END AS percent_complete,
    (SELECT json_group_array(json_object(
        'id', t.id, 'title', t.title, 'status', t.status, 'priority', t.priority, 'deadline', t.deadline
    )) FROM tasks t WHERE t.project_id = p.id) AS tasks_json
FROM projects p
JOIN roles r ON p.role_id = r.id;
```

### v_roles_summary

```sql
CREATE VIEW v_roles_summary AS
SELECT
    r.*,
    (SELECT COUNT(*) FROM projects WHERE role_id = r.id AND status = 'active') AS active_projects,
    (SELECT COUNT(*) FROM projects WHERE role_id = r.id AND status = 'on_hold') AS paused_projects,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status NOT IN ('done', 'cancelled')) AS active_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status = 'captured') AS captured_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status = 'ready') AS ready_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id AND status = 'planned') AS planned_tasks,
    (SELECT COUNT(*) FROM tasks WHERE role_id = r.id
     AND deadline IS NOT NULL AND DATE(deadline) < DATE('now')
     AND status NOT IN ('done', 'cancelled')) AS overdue_tasks,
    (SELECT json_group_array(json_object('id', p.id, 'name', p.name, 'status', p.status))
     FROM projects p WHERE p.role_id = r.id AND p.status IN ('active', 'on_hold')) AS projects_json
FROM roles r;
```

---

## TypeScript Types

### Status Enums

```typescript
type TaskStatus = 'captured' | 'clarified' | 'ready' | 'planned' | 'done' | 'cancelled';
type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';
type RoleStatus = 'active' | 'inactive' | 'historical';
type EntryType = 'checkin' | 'reflection' | 'task' | 'event' | 'note' | 'idea';
type RoleType = 'meta' | 'work' | 'personal' | 'private' | 'civic' | 'side_business' | 'hobby';
```

### Entity Interfaces

```typescript
interface Task {
  id: number;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: number;
  energy_requirement: 'low' | 'medium' | 'high' | null;
  time_estimate: number | null;
  project_id: number | null;
  role_id: number;
  parent_task_id: number | null;
  start_date: string | null;
  deadline: string | null;
  remind_date: string | null;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  type: RoleType;
  description: string | null;
  responsibilities: string | null;  // JSON array string
  status: RoleStatus;
  balance_target: number | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  name: string;
  role_id: number;
  status: ProjectStatus;
  description: string;
  finish_criteria: string | null;  // JSON array string
  created_at: string;
}

interface JournalEntry {
  id: number;
  timestamp: string;
  entry_type: EntryType;
  content: string;
  related_task_id: number | null;
  related_project_id: number | null;
  related_role_id: number | null;
}
```

### Extended View Types

```typescript
interface TaskFull extends Task {
  role_name: string;
  role_type: RoleType;
  project_name: string | null;
  project_status: ProjectStatus | null;
  parent_title: string | null;
  subtasks_json: string;
  days_since_creation: number;
  days_overdue: number | null;
  week_number: number;
}

interface ProjectFull extends Project {
  role_name: string;
  role_type: RoleType;
  total_tasks: number;
  done_tasks: number;
  active_tasks: number;
  percent_complete: number;
  tasks_json: string;
}

interface RoleSummary extends Role {
  active_projects: number;
  paused_projects: number;
  active_tasks: number;
  captured_tasks: number;
  ready_tasks: number;
  planned_tasks: number;
  overdue_tasks: number;
  projects_json: string;
}
```

### Input Types

```typescript
interface CreateTaskInput {
  title: string;
  role_id: number;
  notes?: string;
  status?: TaskStatus;
  priority?: number;
  energy_requirement?: 'low' | 'medium' | 'high';
  time_estimate?: number;
  project_id?: number;
  parent_task_id?: number;
  start_date?: string;
  deadline?: string;
  remind_date?: string;
}

interface CreateRoleInput {
  name: string;
  type: RoleType;
  description?: string;
  responsibilities?: string[];
  balance_target?: number;
}

interface CreateProjectInput {
  name: string;
  role_id: number;
  description: string;
  finish_criteria?: FinishCriterion[];
}

interface CreateEntryInput {
  entry_type: EntryType;
  content: string;
  timestamp?: string;
  related_task_id?: number;
  related_project_id?: number;
  related_role_id?: number;
}

interface FinishCriterion {
  criterion: string;
  done: boolean;
}
```

---

## Database Management

```bash
# Initialize database
bun run .system/tools/database/manage-db.ts init

# Reset database (delete + init)
bun run .system/tools/database/manage-db.ts reset

# Check integrity
sqlite3 <pkm>/.aida/data/aida.db "PRAGMA integrity_check"
```
