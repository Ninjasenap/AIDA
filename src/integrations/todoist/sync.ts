/**
 * Todoist Sync Utilities
 */

import { getConfig } from './config';
import { getCompletedSince } from './completed';
import type { SyncAction, SyncResult, TodoistProject } from './types';
import { createEntry } from '../../database/queries/journal';
import { getDatabase } from '../../database/connection';
import { getTodoistSyncState, updateTodoistSyncState } from '../../database/queries/sync-state';
import { getProjects as getTodoistProjects, parseTodoistProjectName } from './projects';

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

  const actions_required = await reconcileProjects();

  const timestamp = new Date().toISOString();
  updateTodoistSyncState({
    last_sync: timestamp,
    last_completed_check: timestamp,
  });

  const result: SyncResult = {
    completed_synced: completed.length,
    journal_entries_created: journalEntriesCreated,
    timestamp,
    actions_required: actions_required.length > 0 ? actions_required : undefined,
  };

  if (!options?.quiet) {
    console.log(`✓ Synkad: ${journalEntriesCreated} nya completions loggade`);

    if (actions_required.length > 0) {
      console.log(`! Kräver input: ${actions_required.length} projektavvikelser`);
    }
  }

  return result;
}

// ============================================================================
// HELPERS
// ============================================================================

async function reconcileProjects(): Promise<SyncAction[]> {
  const db = getDatabase();
  const actions: SyncAction[] = [];

  let todoistProjects: TodoistProject[];
  try {
    todoistProjects = await getTodoistProjects();
  } catch {
    // If Todoist is unavailable, don't block completion sync.
    return actions;
  }

  const todoistById = new Map(todoistProjects.map((p) => [p.id, p]));

  for (const project of todoistProjects) {
    const parsed = parseTodoistProjectName(project.name);
    if (!parsed) continue;

    const local = db
      .query('SELECT id, name, todoist_project_id FROM projects WHERE id = ?')
      .get(parsed.projectId) as { id: number; name: string; todoist_project_id: string | null } | null;

    if (!local) {
      actions.push({
        type: 'todoist_project_missing_locally',
        todoist_project_id: project.id,
        todoist_project_name: project.name,
        local_project_id: parsed.projectId,
        local_project_name: parsed.projectName,
        required_fields: ['role_id', 'description'],
      });
      continue;
    }

    // Auto-link if local project exists but hasn't been connected yet.
    if (!local.todoist_project_id) {
      db.query('UPDATE projects SET todoist_project_id = ? WHERE id = ?').run(project.id, local.id);
      continue;
    }

    if (local.todoist_project_id !== project.id) {
      actions.push({
        type: 'project_link_conflict',
        project_id: local.id,
        project_name: local.name,
        local_todoist_project_id: local.todoist_project_id,
        todoist_project_id: project.id,
        todoist_project_name: project.name,
      });
    }
  }

  const localLinked = db
    .query(
      "SELECT id, name, todoist_project_id FROM projects WHERE todoist_project_id IS NOT NULL AND status IN ('active', 'on_hold')"
    )
    .all() as Array<{ id: number; name: string; todoist_project_id: string }>;

  for (const local of localLinked) {
    if (!todoistById.has(local.todoist_project_id)) {
      actions.push({
        type: 'local_project_missing_in_todoist',
        project_id: local.id,
        project_name: local.name,
        todoist_project_id: local.todoist_project_id,
        resolutions: ['completed', 'cancelled'],
      });
    }
  }

  return actions;
}

function hasJournalEntry(todoistTaskId: string): boolean {
  const db = getDatabase();
  const entry = db
    .query('SELECT id FROM journal_entries WHERE todoist_task_id = ? LIMIT 1')
    .get(todoistTaskId) as { id: number } | null;

  return Boolean(entry);
}
