-- =============================================================================
-- AIDA Database Schema - Version 1.0
-- =============================================================================
-- Enable recommended SQLite settings for performance and safety
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- =============================================================================
-- TABLE: roles
-- Purpose: User's life/work roles
-- Note: Roles are managed manually in the database
-- =============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK (type IN (
                        'meta', 'work', 'personal', 'private',
                        'civic', 'side_business', 'hobby'
                    )),
    description     TEXT,
    responsibilities TEXT,  -- JSON array: ["responsibility 1", "responsibility 2", ...]
    todoist_label_name TEXT UNIQUE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'inactive', 'historical'
                    )),
    balance_target  REAL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- =============================================================================
-- TABLE: projects
-- Purpose: Group related tasks under projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    role_id         INTEGER NOT NULL,
    todoist_project_id TEXT UNIQUE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'on_hold', 'completed', 'cancelled'
                    )),
    description     TEXT NOT NULL,
    finish_criteria TEXT,  -- JSON array: [{"criterion": "...", "done": false}, ...]
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- =============================================================================
-- TASKS
-- Tasks are stored in Todoist. There is no local tasks table.
-- =============================================================================

-- =============================================================================
-- TABLE: journal_entries
-- Purpose: Structured journal entries (also exported to markdown)
-- =============================================================================
CREATE TABLE IF NOT EXISTS journal_entries (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp           TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    entry_type          TEXT NOT NULL DEFAULT 'check-in' CHECK (entry_type IN (
                        'checkin', 'reflection', 'task', 'event', 'note', 'idea'
                    )),
    content             TEXT NOT NULL,
    todoist_task_id     TEXT,
    related_project_id  INTEGER,
    related_role_id     INTEGER,
    FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (related_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- =============================================================================
-- TABLE: todoist_sync_state
-- Purpose: Track last sync timestamps for Todoist integration
-- =============================================================================
CREATE TABLE IF NOT EXISTS todoist_sync_state (
    key                 TEXT PRIMARY KEY,
    value               TEXT NOT NULL,
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- =============================================================================
-- INDEXES
-- Optimized for common query patterns
-- =============================================================================

-- Roles: Quick lookup by status and type
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);
CREATE INDEX IF NOT EXISTS idx_roles_type ON roles(type);
CREATE INDEX IF NOT EXISTS idx_roles_todoist_label ON roles(todoist_label_name);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_todoist ON projects(todoist_project_id);

-- Journal entries
CREATE INDEX IF NOT EXISTS idx_journal_timestamp ON journal_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_journal_project ON journal_entries(related_project_id);
CREATE INDEX IF NOT EXISTS idx_journal_role ON journal_entries(related_role_id);
CREATE INDEX IF NOT EXISTS idx_journal_todoist_task ON journal_entries(todoist_task_id);

-- =============================================================================
-- TRIGGERS
-- Automatic timestamp updates
-- =============================================================================

-- Update timestamp trigger for roles
CREATE TRIGGER IF NOT EXISTS trg_roles_updated_at
AFTER UPDATE ON roles
BEGIN
    UPDATE roles SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
END;

-- =============================================================================
-- VIEWS
-- Common query patterns as reusable views
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tasks are stored in Todoist.
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- v_projects_full: Projects with role context
-- Note: Tasks live in Todoist and are not counted here.
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_projects_full AS
SELECT
    p.id,
    p.name,
    p.status,
    p.description,
    p.todoist_project_id,
    p.finish_criteria,
    p.created_at,
    -- Role context
    p.role_id,
    r.name AS role_name,
    r.type AS role_type
FROM projects p
JOIN roles r ON p.role_id = r.id;

-- -----------------------------------------------------------------------------
-- v_roles_summary: Roles with project statistics
-- Note: Tasks live in Todoist and are not counted here.
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_roles_summary AS
SELECT
    r.id,
    r.name,
    r.type,
    r.description,
    r.responsibilities,
    r.todoist_label_name,
    r.status,
    r.balance_target,
    r.created_at,
    r.updated_at,
    -- Project statistics
    (SELECT COUNT(*) FROM projects WHERE role_id = r.id AND status = 'active') AS active_projects,
    (SELECT COUNT(*) FROM projects WHERE role_id = r.id AND status = 'on_hold') AS paused_projects,
    -- Projects as JSON
    (SELECT json_group_array(json_object(
        'id', p.id,
        'name', p.name,
        'status', p.status
    ))
    FROM projects p
    WHERE p.role_id = r.id AND p.status IN ('active', 'on_hold')) AS projects_json
FROM roles r;
