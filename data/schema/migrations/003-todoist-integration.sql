-- Migration 003: Todoist integration support
-- Adds Todoist mapping columns and sync state table.

-- -----------------------------------------------------------------------------
-- Add Todoist label mapping to roles
-- -----------------------------------------------------------------------------
ALTER TABLE roles ADD COLUMN todoist_label_name TEXT UNIQUE;

-- -----------------------------------------------------------------------------
-- Add Todoist project mapping to projects
-- -----------------------------------------------------------------------------
ALTER TABLE projects ADD COLUMN todoist_project_id TEXT UNIQUE;

-- -----------------------------------------------------------------------------
-- Add Todoist task reference to journal entries
-- -----------------------------------------------------------------------------
ALTER TABLE journal_entries ADD COLUMN todoist_task_id TEXT;

-- -----------------------------------------------------------------------------
-- Add sync state table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS todoist_sync_state (
    key                 TEXT PRIMARY KEY,
    value               TEXT NOT NULL,
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- -----------------------------------------------------------------------------
-- Indexes for Todoist integration
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_roles_todoist_label ON roles(todoist_label_name);
CREATE INDEX IF NOT EXISTS idx_projects_todoist ON projects(todoist_project_id);
CREATE INDEX IF NOT EXISTS idx_journal_todoist_task ON journal_entries(todoist_task_id);
