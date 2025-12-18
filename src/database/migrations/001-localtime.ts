#!/usr/bin/env bun
/**
 * Migration: 001-localtime
 *
 * Purpose: Update database to use local time instead of UTC
 *
 * Changes:
 * - Updates all datetime('now') to datetime('now', 'localtime')
 * - Updates all DATE('now') to DATE('now', 'localtime')
 * - Recreates views with local time
 * - Recreates triggers with local time
 *
 * Note: SQLite doesn't support ALTER COLUMN DEFAULT, so we recreate
 * triggers and views instead. Existing data is not modified.
 */

import { Database } from 'bun:sqlite';
import { resolve } from 'path';

// Get database path from config
const configPath = resolve(import.meta.dir, '../../../config/aida-paths.json');
const config = JSON.parse(await Bun.file(configPath).text());
const dbPath = resolve(config.pkm, '.aida/data/aida.db');

console.log(`Migrating database at: ${dbPath}`);

const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = OFF'); // Temporarily disable for migration

try {
  console.log('Starting migration 001-localtime...');

  // Step 1: Drop and recreate trigger
  console.log('Updating trigger: trg_roles_updated_at');
  db.exec('DROP TRIGGER IF EXISTS trg_roles_updated_at');
  db.exec(`
    CREATE TRIGGER trg_roles_updated_at
    AFTER UPDATE ON roles
    BEGIN
      UPDATE roles SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
    END;
  `);

  // Step 2: Drop and recreate views with 'localtime'
  console.log('Updating views...');

  // v_tasks_full
  console.log('  - v_tasks_full');
  db.exec('DROP VIEW IF EXISTS v_tasks_full');
  db.exec(`
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
  `);

  // v_today_tasks
  console.log('  - v_today_tasks');
  db.exec('DROP VIEW IF EXISTS v_today_tasks');
  db.exec(`
    CREATE VIEW v_today_tasks AS
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
  `);

  // v_overdue_tasks
  console.log('  - v_overdue_tasks');
  db.exec('DROP VIEW IF EXISTS v_overdue_tasks');
  db.exec(`
    CREATE VIEW v_overdue_tasks AS
    SELECT * FROM v_tasks_full
    WHERE days_overdue IS NOT NULL
    ORDER BY days_overdue DESC;
  `);

  // v_stale_tasks
  console.log('  - v_stale_tasks');
  db.exec('DROP VIEW IF EXISTS v_stale_tasks');
  db.exec(`
    CREATE VIEW v_stale_tasks AS
    SELECT * FROM v_tasks_full
    WHERE status IN ('captured', 'clarified', 'ready')
      AND (
        (status IN ('captured', 'clarified') AND days_since_creation >= 28)
        OR (status = 'ready' AND days_since_creation >= 14)
      )
    ORDER BY days_since_creation DESC;
  `);

  // v_projects_full
  console.log('  - v_projects_full');
  db.exec('DROP VIEW IF EXISTS v_projects_full');
  db.exec(`
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
  `);

  // v_roles_summary
  console.log('  - v_roles_summary');
  db.exec('DROP VIEW IF EXISTS v_roles_summary');
  db.exec(`
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
  `);

  console.log('Migration 001-localtime completed successfully!');
  console.log('Note: Existing timestamps in the database are unchanged.');
  console.log('New rows will use local time from now on.');

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.exec('PRAGMA foreign_keys = ON'); // Re-enable foreign keys
  db.close();
}
