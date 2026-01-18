/**
 * Todoist Sync State Queries
 */

import { getDatabase } from '../connection';

// ============================================================================
// TYPES
// ============================================================================

export interface TodoistSyncState {
  last_sync: string;
  last_completed_check: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_SYNC_STATE: TodoistSyncState = {
  last_sync: '1970-01-01T00:00:00.000Z',
  last_completed_check: '1970-01-01T00:00:00.000Z',
};

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export function getTodoistSyncState(): TodoistSyncState {
  const db = getDatabase();

  const rows = db
    .query('SELECT key, value FROM todoist_sync_state WHERE key IN (?, ?)')
    .all('last_sync', 'last_completed_check') as { key: string; value: string }[];

  const state = { ...DEFAULT_SYNC_STATE };

  for (const row of rows) {
    if (row.key === 'last_sync') state.last_sync = row.value;
    if (row.key === 'last_completed_check') state.last_completed_check = row.value;
  }

  return state;
}

export function saveTodoistSyncState(state: TodoistSyncState): void {
  const db = getDatabase();

  const stmt = db.query(
    `INSERT INTO todoist_sync_state (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now', 'localtime')`
  );

  stmt.run('last_sync', state.last_sync);
  stmt.run('last_completed_check', state.last_completed_check);
}

export function updateTodoistSyncState(partial: Partial<TodoistSyncState>): TodoistSyncState {
  const current = getTodoistSyncState();
  const updated = { ...current, ...partial };

  saveTodoistSyncState(updated);
  return updated;
}
