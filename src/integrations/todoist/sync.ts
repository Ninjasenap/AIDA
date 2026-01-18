/**
 * Todoist Sync Utilities
 */

import { getConfig } from './config';
import { getCompletedSince } from './completed';
import type { SyncResult } from './types';
import { createEntry } from '../../database/queries/journal';
import { getDatabase } from '../../database/connection';
import { getTodoistSyncState, updateTodoistSyncState } from '../../database/queries/sync-state';

// ============================================================================
// SYNC ENTRY POINTS
// ============================================================================

export async function ensureFresh(): Promise<void> {
  const { syncFreshnessMinutes } = getConfig();
  const state = getTodoistSyncState();

  const lastSync = new Date(state.last_sync).getTime();
  const now = Date.now();
  const maxAge = syncFreshnessMinutes * 60 * 1000;

  if (now - lastSync > maxAge) {
    await sync();
  }
}

export async function sync(options?: { quiet?: boolean }): Promise<SyncResult> {
  const state = getTodoistSyncState();
  const completed = await getCompletedSince(state.last_completed_check);

  let journalEntriesCreated = 0;

  for (const item of completed) {
    if (hasJournalEntry(item.task_id)) {
      continue;
    }

    createEntry({
      entry_type: 'task',
      content: `Slutfört: ${item.content}`,
      todoist_task_id: item.task_id,
    });

    journalEntriesCreated += 1;
  }

  const timestamp = new Date().toISOString();
  updateTodoistSyncState({
    last_sync: timestamp,
    last_completed_check: timestamp,
  });

  const result: SyncResult = {
    completed_synced: completed.length,
    journal_entries_created: journalEntriesCreated,
    timestamp,
  };

  if (!options?.quiet) {
    console.log(`✓ Synkad: ${journalEntriesCreated} nya completions loggade`);
  }

  return result;
}

// ============================================================================
// HELPERS
// ============================================================================

function hasJournalEntry(todoistTaskId: string): boolean {
  const db = getDatabase();
  const entry = db
    .query('SELECT id FROM journal_entries WHERE todoist_task_id = ? LIMIT 1')
    .get(todoistTaskId) as { id: number } | null;

  return Boolean(entry);
}
