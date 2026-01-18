/**
 * Todoist Schema Migration Helpers
 *
 * Ensures required columns/tables exist in the local AIDA database.
 * Designed to be safe to run multiple times.
 */

import { getDatabase } from '../../database/connection';

export interface EnsureTodoistSchemaResult {
  changed: boolean;
  actions: string[];
}

export function ensureTodoistSchema(): EnsureTodoistSchemaResult {
  const db = getDatabase();
  const actions: string[] = [];
  let changed = false;

  // roles.todoist_label_name
  if (!hasColumn(db, 'roles', 'todoist_label_name')) {
    db.exec('ALTER TABLE roles ADD COLUMN todoist_label_name TEXT');
    actions.push('Added roles.todoist_label_name');
    changed = true;
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_roles_todoist_label ON roles(todoist_label_name)');

  // projects.todoist_project_id
  if (!hasColumn(db, 'projects', 'todoist_project_id')) {
    db.exec('ALTER TABLE projects ADD COLUMN todoist_project_id TEXT');
    actions.push('Added projects.todoist_project_id');
    changed = true;
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_projects_todoist ON projects(todoist_project_id)');

  // journal_entries.todoist_task_id
  if (!hasColumn(db, 'journal_entries', 'todoist_task_id')) {
    db.exec('ALTER TABLE journal_entries ADD COLUMN todoist_task_id TEXT');
    actions.push('Added journal_entries.todoist_task_id');
    changed = true;
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_journal_todoist_task ON journal_entries(todoist_task_id)');

  // todoist_sync_state
  if (!hasTable(db, 'todoist_sync_state')) {
    db.exec(`CREATE TABLE IF NOT EXISTS todoist_sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )`);
    actions.push('Created todoist_sync_state table');
    changed = true;
  }

  return { changed, actions };
}

function hasTable(db: any, tableName: string): boolean {
  const row = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName) as { name: string } | null;
  return Boolean(row);
}

function hasColumn(db: any, tableName: string, columnName: string): boolean {
  const cols = db.query(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return cols.some((c) => c.name === columnName);
}
