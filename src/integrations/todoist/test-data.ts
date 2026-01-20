/**
 * Todoist Test Data Helpers
 *
 * IMPORTANT: Todoist is always treated as production.
 * All helpers in this file must only touch data that is explicitly marked
 * as test data.
 */

import { TodoistClient } from './client';
import { ensureLabel } from './labels';
import { getProjects } from './projects';
import type { TodoistProject, TodoistTask } from './types';

export const TEST_DATA_LABEL_NAME = 'aida-test-data';
export const TEST_PROJECT_SUFFIX = '[aida-test-data]';

export interface ClearTestDataResult {
  deletedActiveTasks: number;
  deletedProjects: number;
  skippedProjects: number;
  errors: Array<{ stage: string; id?: string; message: string }>;
}

export function isTestProjectName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.endsWith(TEST_PROJECT_SUFFIX);
}

export function formatTestProjectName(baseName: string): string {
  const trimmed = baseName.trim();
  if (isTestProjectName(trimmed)) {
    return trimmed;
  }

  return `${trimmed} ${TEST_PROJECT_SUFFIX}`;
}

export async function ensureTestLabel(): Promise<void> {
  await ensureLabel(TEST_DATA_LABEL_NAME);
}

/**
 * Deletes only test data:
 * - active tasks with label `aida-test-data`
 * - projects whose name ends with `[aida-test-data]`
 *
 * The label itself is never deleted.
 */
export async function clearTestData(input: { deleteProjects?: boolean; deleteTasks?: boolean } = {}): Promise<ClearTestDataResult> {
  const deleteTasks = input.deleteTasks ?? true;
  const deleteProjects = input.deleteProjects ?? true;

  const result: ClearTestDataResult = {
    deletedActiveTasks: 0,
    deletedProjects: 0,
    skippedProjects: 0,
    errors: [],
  };

  await ensureTestLabel();

  if (deleteTasks) {
    await deleteActiveTasksByLabel(result);
  }

  if (deleteProjects) {
    await deleteProjectsBySuffix(result);
  }

  return result;
}

async function deleteActiveTasksByLabel(result: ClearTestDataResult): Promise<void> {
  const client = new TodoistClient();

  let tasks: TodoistTask[] = [];
  try {
    tasks = await client.request<TodoistTask[]>('/tasks', {
      params: {
        label: TEST_DATA_LABEL_NAME,
      },
    });
  } catch (error) {
    result.errors.push({ stage: 'list_active_tasks_by_label', message: String(error) });
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

async function deleteProjectsBySuffix(result: ClearTestDataResult): Promise<void> {
  const client = new TodoistClient();

  let projects: TodoistProject[] = [];
  try {
    projects = await getProjects();
  } catch (error) {
    result.errors.push({ stage: 'list_projects', message: String(error) });
    return;
  }

  for (const project of projects) {
    if (!isTestProjectName(project.name)) {
      continue;
    }

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
