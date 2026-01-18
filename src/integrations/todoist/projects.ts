/**
 * Todoist Project Operations
 */

import { TodoistClient } from './client';
import type { TodoistProject } from './types';
import { getDatabase } from '../../database/connection';

// ============================================================================
// API OPERATIONS
// ============================================================================

export async function getProjects(): Promise<TodoistProject[]> {
  const client = new TodoistClient();
  return client.request<TodoistProject[]>('/projects');
}

export async function createProject(name: string, parentId?: string): Promise<TodoistProject> {
  const client = new TodoistClient();
  return client.request<TodoistProject>('/projects', {
    method: 'POST',
    body: {
      name,
      parent_id: parentId ?? null,
    },
  });
}

export async function ensureProject(name: string, parentId?: string): Promise<TodoistProject> {
  const projects = await getProjects();
  const existing = projects.find((project) => project.name === name);

  if (existing) {
    return existing;
  }

  return createProject(name, parentId);
}

// ============================================================================
// AIDA SYNC
// ============================================================================

interface ProjectRow {
  id: number;
  name: string;
  todoist_project_id: string | null;
}

export async function syncProjectsToTodoist(): Promise<ProjectRow[]> {
  const db = getDatabase();
  const projects = db
    .query('SELECT id, name, todoist_project_id FROM projects WHERE status = "active" ORDER BY id')
    .all() as ProjectRow[];

  for (const project of projects) {
    const desiredName = formatTodoistProjectName(project.id, project.name);

    const todoistProject = project.todoist_project_id
      ? await getProjectById(project.todoist_project_id)
      : null;

    // If we already have a linked project, keep it but align naming.
    if (todoistProject) {
      if (todoistProject.name !== desiredName) {
        await updateProjectName(todoistProject.id, desiredName);
      }
      continue;
    }

    // If not linked yet (or the linked Todoist project was deleted),
    // ensure the project exists by *prefixed* name to avoid duplicates.
    const ensured = await ensureProject(desiredName);
    db.query('UPDATE projects SET todoist_project_id = ? WHERE id = ?').run(ensured.id, project.id);
    project.todoist_project_id = ensured.id;
  }

  return projects;
}

export function formatTodoistProjectName(projectId: number, projectName: string): string {
  const prefix = `P${String(projectId).padStart(3, '0')}`;
  return `${prefix}-${projectName}`;
}

async function updateProjectName(projectId: string, name: string): Promise<void> {
  const client = new TodoistClient();
  await client.request<void>(`/projects/${projectId}`, {
    method: 'POST',
    body: { name },
  });
}

async function getProjectById(projectId: string): Promise<TodoistProject | null> {
  const client = new TodoistClient();
  try {
    return await client.request<TodoistProject>(`/projects/${projectId}`);
  } catch (error) {
    return null;
  }
}
