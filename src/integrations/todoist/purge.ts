/**
 * Todoist Purge Utilities (TEST ONLY)
 *
 * DANGER: Removes data from Todoist account.
 */

import { randomUUID } from 'crypto';
import { getConfig } from './config';
import { TodoistClient } from './client';
import type { TodoistLabel, TodoistProject, TodoistTask } from './types';

export interface PurgeResult {
  deletedActiveTasks: number;
  deletedCompletedTasksAttempted: number;
  deletedCompletedTasksSucceeded: number;
  deletedLabels: number;
  deletedProjects: number;
  skippedProjects: number;
  errors: Array<{ stage: string; id?: string; message: string }>;
}

export async function purgeTodoist(input?: { includeCompleted?: boolean }): Promise<PurgeResult> {
  const result: PurgeResult = {
    deletedActiveTasks: 0,
    deletedCompletedTasksAttempted: 0,
    deletedCompletedTasksSucceeded: 0,
    deletedLabels: 0,
    deletedProjects: 0,
    skippedProjects: 0,
    errors: [],
  };

  // 1) Active tasks
  await purgeActiveTasks(result);

  // 2) Completed tasks (best-effort)
  if (input?.includeCompleted) {
    await purgeCompletedTasksBestEffort(result);
  }

  // 3) Labels
  await purgeLabels(result);

  // 4) Projects
  await purgeProjects(result);

  return result;
}

async function purgeActiveTasks(result: PurgeResult): Promise<void> {
  const client = new TodoistClient();

  let tasks: TodoistTask[] = [];
  try {
    tasks = await client.request<TodoistTask[]>('/tasks');
  } catch (error) {
    result.errors.push({ stage: 'list_active_tasks', message: String(error) });
    return;
  }

  for (const task of tasks) {
    try {
      await client.request<void>(`/tasks/${task.id}`, { method: 'DELETE' });
      result.deletedActiveTasks += 1;
    } catch (error) {
      result.errors.push({ stage: 'delete_active_task', id: task.id, message: String(error) });
    }
  }
}

async function purgeLabels(result: PurgeResult): Promise<void> {
  const client = new TodoistClient();

  let labels: TodoistLabel[] = [];
  try {
    labels = await client.request<TodoistLabel[]>('/labels');
  } catch (error) {
    result.errors.push({ stage: 'list_labels', message: String(error) });
    return;
  }

  for (const label of labels) {
    try {
      await client.request<void>(`/labels/${label.id}`, { method: 'DELETE' });
      result.deletedLabels += 1;
    } catch (error) {
      result.errors.push({ stage: 'delete_label', id: label.id, message: String(error) });
    }
  }
}

async function purgeProjects(result: PurgeResult): Promise<void> {
  const client = new TodoistClient();

  let projects: TodoistProject[] = [];
  try {
    projects = await client.request<TodoistProject[]>('/projects');
  } catch (error) {
    result.errors.push({ stage: 'list_projects', message: String(error) });
    return;
  }

  for (const project of projects) {
    if (project.is_inbox_project) {
      result.skippedProjects += 1;
      continue;
    }

    try {
      await client.request<void>(`/projects/${project.id}`, { method: 'DELETE' });
      result.deletedProjects += 1;
    } catch (error) {
      result.errors.push({ stage: 'delete_project', id: project.id, message: String(error) });
    }
  }
}

// ============================================================================
// COMPLETED TASKS (BEST-EFFORT)
// ============================================================================

const COMPLETED_GET_ALL_URL = 'https://api.todoist.com/sync/v9/completed/get_all';
const SYNC_URL = 'https://api.todoist.com/sync/v9/sync';

async function purgeCompletedTasksBestEffort(result: PurgeResult): Promise<void> {
  const config = getConfig();
  if (!config.apiToken) {
    result.errors.push({ stage: 'completed', message: 'Todoist API token not configured' });
    return;
  }

  // Fetch completed items in pages (API response shape differs across versions).
  const completedTaskIds: string[] = [];
  let cursor: string | undefined;

  // Hard cap for safety.
  const maxItems = 5000;
  const pageLimit = 200;

  for (;;) {
    const body = new URLSearchParams({
      since: '1970-01-01T00:00:00.000Z',
      limit: String(pageLimit),
    });

    if (cursor) {
      body.set('cursor', cursor);
    }

    let json: any;
    try {
      const resp = await fetch(COMPLETED_GET_ALL_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      if (!resp.ok) {
        result.errors.push({ stage: 'list_completed', message: `HTTP ${resp.status}: ${await resp.text()}` });
        break;
      }

      json = await resp.json();
    } catch (error) {
      result.errors.push({ stage: 'list_completed', message: String(error) });
      break;
    }

    const items: any[] = Array.isArray(json?.items) ? json.items : [];
    for (const item of items) {
      const taskId = String(item?.task_id ?? item?.id ?? '');
      if (taskId) {
        completedTaskIds.push(taskId);
      }

      if (completedTaskIds.length >= maxItems) {
        break;
      }
    }

    if (completedTaskIds.length >= maxItems) {
      result.errors.push({
        stage: 'list_completed',
        message: `Hit safety cap (${maxItems}) while listing completed tasks`,
      });
      break;
    }

    // Cursor pagination if present.
    const nextCursor = typeof json?.next_cursor === 'string' ? json.next_cursor : undefined;
    const hasMore = Boolean(json?.has_more);

    if (nextCursor) {
      cursor = nextCursor;
      continue;
    }

    if (hasMore && typeof json?.cursor === 'string') {
      cursor = json.cursor;
      continue;
    }

    // No known pagination signals.
    break;
  }

  // Delete completed items via Sync API (best effort).
  if (completedTaskIds.length === 0) {
    return;
  }

  let syncToken = await getSyncToken(config.apiToken, result);
  if (!syncToken) {
    return;
  }

  const batchSize = 50;
  for (let i = 0; i < completedTaskIds.length; i += batchSize) {
    const batch = completedTaskIds.slice(i, i + batchSize);

    result.deletedCompletedTasksAttempted += batch.length;

    const commands = batch.map((id) => ({
      type: 'item_delete',
      uuid: randomUUID(),
      args: { id },
    }));

    try {
      const resp = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          sync_token: syncToken,
          resource_types: '[]',
          commands: JSON.stringify(commands),
        }),
      });

      const text = await resp.text();
      if (!resp.ok) {
        result.errors.push({ stage: 'delete_completed_batch', message: `HTTP ${resp.status}: ${text}` });
        continue;
      }

      const json = JSON.parse(text);
      if (typeof json?.sync_token === 'string') {
        syncToken = json.sync_token;
      }

      // We can't reliably know which deletes succeeded; count batch as succeeded
      // if sync endpoint accepted the commands.
      result.deletedCompletedTasksSucceeded += batch.length;
    } catch (error) {
      result.errors.push({ stage: 'delete_completed_batch', message: String(error) });
    }
  }
}

async function getSyncToken(apiToken: string, result: PurgeResult): Promise<string | null> {
  try {
    const resp = await fetch(SYNC_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sync_token: '*',
        resource_types: '[]',
      }),
    });

    if (!resp.ok) {
      result.errors.push({ stage: 'sync_token', message: `HTTP ${resp.status}: ${await resp.text()}` });
      return null;
    }

    const json = await resp.json();
    if (typeof json?.sync_token !== 'string') {
      result.errors.push({ stage: 'sync_token', message: 'Missing sync_token in response' });
      return null;
    }

    return json.sync_token;
  } catch (error) {
    result.errors.push({ stage: 'sync_token', message: String(error) });
    return null;
  }
}
