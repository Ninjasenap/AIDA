/**
 * Todoist Integration Test Data Seeder
 *
 * Todoist is always treated as production.
 * This harness only creates and removes data marked as test data.
 */

import { TodoistClient } from './client';
import { ensureProject } from './projects';
import { sync } from './sync';
import type { TodoistTask } from './types';
import { clearTestData, ensureTestLabel, formatTestProjectName, TEST_DATA_LABEL_NAME } from './test-data';

export interface SeedTestDataInput {
  /**
   * If true (default), clears existing test data first.
   * Only deletes tasks labeled `aida-test-data` and projects with suffix `[aida-test-data]`.
   */
  clearExisting?: boolean;

  /**
   * If true (default), creates a task and closes it, then runs `todoist sync`
   * so a journal entry is created.
   *
   * Note: completed tasks are not automatically removed.
   */
  createCompletion?: boolean;
}

export interface SeedTestDataResult {
  cleanup: {
    deletedActiveTasks: number;
    deletedProjects: number;
    skippedProjects: number;
    errors: Array<{ stage: string; id?: string; message: string }>;
  };
  todoist: {
    label: string;
    projectsCreatedOrEnsured: number;
    tasksCreated: number;
    tasksClosed: number;
    completionTaskId?: string;
  };
  sync?: {
    completed_synced: number;
    journal_entries_created: number;
    timestamp: string;
  };
}

export async function seedTestData(input: SeedTestDataInput = {}): Promise<SeedTestDataResult> {
  const clearExisting = input.clearExisting ?? true;
  const createCompletion = input.createCompletion ?? true;

  const cleanup = clearExisting ? await clearTestData() : {
    deletedActiveTasks: 0,
    deletedProjects: 0,
    skippedProjects: 0,
    errors: [],
  };

  await ensureTestLabel();

  const projectAida = await ensureProject(formatTestProjectName('AIDA testdata'));
  const projectHome = await ensureProject(formatTestProjectName('Hemma testdata'));

  let tasksCreated = 0;
  let tasksClosed = 0;
  let completionTaskId: string | undefined;

  await createLabeledTask({
    content: '[aida-test-data] Test: Fixa bug i sync',
    project_id: projectAida.id,
    priority: 4,
    due_string: 'today',
  });
  tasksCreated += 1;

  await createLabeledTask({
    content: '[aida-test-data] Test: Handla mjölk',
    project_id: projectHome.id,
    priority: 2,
    due_string: 'today',
  });
  tasksCreated += 1;

  if (createCompletion) {
    const completion = await createLabeledTask({
      content: '[aida-test-data] Test: Completion → journal',
      project_id: projectAida.id,
      priority: 3,
      due_string: 'today',
    });

    completionTaskId = completion.id;

    const client = new TodoistClient();
    await client.request<void>(`/tasks/${completion.id}/close`, { method: 'POST' });
    tasksClosed += 1;
  }

  const syncResult = createCompletion ? await sync({ quiet: true }) : undefined;

  return {
    cleanup,
    todoist: {
      label: TEST_DATA_LABEL_NAME,
      projectsCreatedOrEnsured: 2,
      tasksCreated,
      tasksClosed,
      completionTaskId,
    },
    sync: syncResult ? {
      completed_synced: syncResult.completed_synced,
      journal_entries_created: syncResult.journal_entries_created,
      timestamp: syncResult.timestamp,
    } : undefined,
  };
}

async function createLabeledTask(input: {
  content: string;
  project_id: string;
  due_string?: string;
  priority?: 1 | 2 | 3 | 4;
}): Promise<TodoistTask> {
  const client = new TodoistClient();

  const body: Record<string, unknown> = {
    content: input.content,
    project_id: input.project_id,
    labels: [TEST_DATA_LABEL_NAME],
  };

  if (input.due_string) body.due_string = input.due_string;
  if (input.priority) body.priority = input.priority;

  return client.request<TodoistTask>('/tasks', { method: 'POST', body });
}
