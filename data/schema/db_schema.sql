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
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active', 'on_hold', 'completed', 'cancelled'
                    )),
    description     TEXT NOT NULL,
    finish_criteria TEXT,  -- JSON array: [{"criterion": "...", "done": false}, ...]
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- =============================================================================
-- TABLE: tasks
-- Purpose: Core task entity with full lifecycle management
-- =============================================================================
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
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

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
    related_task_id     INTEGER,
    related_project_id  INTEGER,
    related_role_id     INTEGER,
    FOREIGN KEY (related_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (related_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- =============================================================================
-- INDEXES
-- Optimized for common query patterns
-- =============================================================================

-- Roles: Quick lookup by status and type
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);
CREATE INDEX IF NOT EXISTS idx_roles_type ON roles(type);

-- Tasks: Primary query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_role_status ON tasks(role_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_role ON tasks(role_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_remind ON tasks(remind_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status_energy ON tasks(status, energy_requirement);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(deadline) WHERE deadline IS NOT NULL;

-- Journal entries
CREATE INDEX IF NOT EXISTS idx_journal_timestamp ON journal_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_journal_task ON journal_entries(related_task_id);
CREATE INDEX IF NOT EXISTS idx_journal_project ON journal_entries(related_project_id);
CREATE INDEX IF NOT EXISTS idx_journal_role ON journal_entries(related_role_id);

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
-- v_tasks_full: Base view with complete task context
-- Includes: role info, project info, parent task, subtasks JSON, calculated fields
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_tasks_full AS
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
    CAST((julianday('now', 'localtime') - julianday(t.created_at)) AS INTEGER) AS days_since_creation,
    CASE
        WHEN t.deadline IS NOT NULL AND DATE(t.deadline) < DATE('now', 'localtime')
             AND t.status NOT IN ('done', 'cancelled')
        THEN CAST((julianday('now', 'localtime') - julianday(t.deadline)) AS INTEGER)
        ELSE NULL
    END AS days_overdue,
    CAST(strftime('%W', COALESCE(t.deadline, t.start_date, t.created_at)) AS INTEGER) AS week_number
FROM tasks t
JOIN roles r ON t.role_id = r.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN tasks pt ON t.parent_task_id = pt.id;

-- -----------------------------------------------------------------------------
-- v_today_tasks: Today's relevant tasks
-- Tasks that should be considered for today's planning
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_today_tasks AS
SELECT * FROM v_tasks_full
WHERE status NOT IN ('done', 'cancelled')
  AND (
    DATE(start_date) <= DATE('now', 'localtime')
    OR DATE(deadline) <= DATE('now', 'localtime')
    OR (DATE(deadline) <= DATE('now', 'localtime', '+7 days') AND start_date IS NULL)
    OR DATE(remind_date) = DATE('now', 'localtime')
  )
ORDER BY
    CASE WHEN days_overdue IS NOT NULL THEN 0 ELSE 1 END,
    days_overdue DESC,
    priority DESC,
    deadline;

-- -----------------------------------------------------------------------------
-- v_overdue_tasks: Tasks past their deadline
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_overdue_tasks AS
SELECT * FROM v_tasks_full
WHERE days_overdue IS NOT NULL
ORDER BY days_overdue DESC;

-- -----------------------------------------------------------------------------
-- v_stale_tasks: Tasks that haven't progressed in a while
-- captured/clarified: 28+ days, ready: 14+ days
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_stale_tasks AS
SELECT * FROM v_tasks_full
WHERE status IN ('captured', 'clarified', 'ready')
  AND (
    (status IN ('captured', 'clarified') AND days_since_creation >= 28)
    OR (status = 'ready' AND days_since_creation >= 14)
  )
ORDER BY days_since_creation DESC;

-- -----------------------------------------------------------------------------
-- v_projects_full: Projects with context and statistics
-- Includes: role info, task counts, completion percentage, tasks JSON
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_projects_full AS
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

-- -----------------------------------------------------------------------------
-- v_roles_summary: Roles with project and task statistics
-- Provides overview of each role's workload
-- -----------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_roles_summary AS
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
     AND deadline IS NOT NULL AND DATE(deadline) < DATE('now', 'localtime')
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
