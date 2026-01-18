/**
 * Todoist Task Operations
 */

import { TodoistClient } from './client';
import type { AidaTask, CreateTaskInput, TaskFilter, TodoistTask } from './types';
import { mapLabelsForTask, mapToAidaTask } from './mappers';
import { buildRoleLabelName, ensureLabel } from './labels';
import { getDatabase } from '../../database/connection';
import { createEntry } from '../../database/queries/journal';

// ============================================================================
// TASK QUERIES
// ============================================================================

export async function getTasks(filter?: TaskFilter): Promise<AidaTask[]> {
  const client = new TodoistClient();
  const params: Record<string, string> = {};

  if (filter?.project_id) {
    const todoistProjectId = getTodoistProjectId(filter.project_id);
    if (todoistProjectId) {
      params.project_id = todoistProjectId;
    }
  }

  if (filter?.role_id) {
    const roleLabel = getRoleLabelName(filter.role_id);
    if (roleLabel) {
      params.label = roleLabel;
    }
  }

  if (filter?.due) {
    params.filter = getDueFilter(filter.due);
  }

  const tasks = await client.request<TodoistTask[]>('/tasks', { params });
  let mapped = tasks.map(mapToAidaTask);

  if (filter?.energy) {
    mapped = mapped.filter((task) => task.energy_requirement === filter.energy);
  }

  return mapped;
}

export async function getTaskById(taskId: string): Promise<AidaTask> {
  const client = new TodoistClient();
  const task = await client.request<TodoistTask>(`/tasks/${taskId}`);
  return mapToAidaTask(task);
}

export async function getTodayTasks(): Promise<Map<number, AidaTask[]>> {
  const tasks = await getTasks({ due: 'today' });
  const overdue = await getTasks({ due: 'overdue' });
  const combined = [...tasks, ...overdue];

  const grouped = new Map<number, AidaTask[]>();

  for (const task of combined) {
    const roleId = task.aida_role_id ?? 0;
    if (!grouped.has(roleId)) {
      grouped.set(roleId, []);
    }
    grouped.get(roleId)!.push(task);
  }

  return grouped;
}

export async function getTasksByEnergy(input: { energy: NonNullable<TaskFilter['energy']> }): Promise<AidaTask[]> {
  return getTasks({ energy: input.energy });
}

export async function getTasksByRole(input: { role_id: number }): Promise<AidaTask[]> {
  return getTasks({ role_id: input.role_id });
}

// ============================================================================
// TASK MUTATIONS
// ============================================================================

export async function createTask(input: CreateTaskInput): Promise<AidaTask> {
  const client = new TodoistClient();
  const labels = mapLabelsForTask(input);

  const body: Record<string, unknown> = {
    content: input.content,
    labels,
  };

  if (input.description) body.description = input.description;
  if (input.priority) body.priority = input.priority;
  if (input.due_string) body.due_string = input.due_string;
  if (input.due_date) body.due_date = input.due_date;

  if (input.project_id) {
    const todoistProjectId = getTodoistProjectId(input.project_id);
    if (todoistProjectId) {
      body.project_id = todoistProjectId;
    }
  }

  const task = await client.request<TodoistTask>('/tasks', {
    method: 'POST',
    body,
  });

  return mapToAidaTask(task);
}

export async function updateTask(input: { taskId: string | number } & Partial<CreateTaskInput>): Promise<void> {
  const client = new TodoistClient();
  const body: Record<string, unknown> = {};

  const taskId = String(input.taskId);

  if (input.content) body.content = input.content;
  if (input.description) body.description = input.description;
  if (input.priority) body.priority = input.priority;
  if (input.due_string) body.due_string = input.due_string;
  if (input.due_date) body.due_date = input.due_date;

  if (input.role_id || input.energy || input.contexts) {
    body.labels = mapLabelsForTask(input);
  }

  if (input.project_id) {
    const todoistProjectId = getTodoistProjectId(input.project_id);
    if (todoistProjectId) {
      body.project_id = todoistProjectId;
    }
  }

  await client.request<void>(`/tasks/${taskId}`, {
    method: 'POST',
    body,
  });
}

export async function completeTask(taskId: string | number): Promise<void> {
  const client = new TodoistClient();
  const id = String(taskId);
  const task = await getTaskById(id);

  await client.request<void>(`/tasks/${id}/close`, { method: 'POST' });

  createEntry({
    entry_type: 'task',
    content: `Slutfört: ${task.content}`,
    todoist_task_id: task.id,
    related_project_id: task.aida_project_id ?? undefined,
    related_role_id: task.aida_role_id ?? undefined,
  });
}

export async function deleteTask(taskId: string | number): Promise<void> {
  const client = new TodoistClient();
  await client.request<void>(`/tasks/${String(taskId)}`, { method: 'DELETE' });
}

export async function tagTask(input: { taskId: string | number; label: string }): Promise<AidaTask> {
  const client = new TodoistClient();
  const taskId = String(input.taskId);

  await ensureLabel(input.label);

  const task = await client.request<TodoistTask>(`/tasks/${taskId}`);
  const labels = new Set(task.labels);
  labels.add(input.label);

  const updated = await client.request<TodoistTask>(`/tasks/${taskId}`, {
    method: 'POST',
    body: {
      labels: [...labels],
    },
  });

  return mapToAidaTask(updated);
}

// ============================================================================
// HELPERS
// ============================================================================

function getTodoistProjectId(aidaProjectId: number): string | null {
  const db = getDatabase();
  const result = db
    .query('SELECT todoist_project_id FROM projects WHERE id = ?')
    .get(aidaProjectId) as { todoist_project_id: string | null } | null;

  return result?.todoist_project_id ?? null;
}

function getRoleLabelName(roleId: number): string | null {
  const db = getDatabase();
  const result = db
    .query('SELECT todoist_label_name, name FROM roles WHERE id = ?')
    .get(roleId) as { todoist_label_name: string | null; name: string } | null;

  if (!result) return null;
  if (result.todoist_label_name) return result.todoist_label_name;

  return buildRoleLabelName(result.name, roleId);
}

function getDueFilter(due: NonNullable<TaskFilter['due']>): string {
  switch (due) {
    case 'today':
      return 'today';
    case 'overdue':
      return 'overdue';
    case 'tomorrow':
      return 'tomorrow';
    case 'week':
      return '7 days';
    default:
      return 'today';
  }
}
