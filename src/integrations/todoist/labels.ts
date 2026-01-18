/**
 * Todoist Label Operations
 */

import { TodoistClient } from './client';
import type { TodoistLabel } from './types';
import { getDatabase } from '../../database/connection';

// ============================================================================
// API OPERATIONS
// ============================================================================

export async function getLabels(): Promise<TodoistLabel[]> {
  const client = new TodoistClient();
  return client.request<TodoistLabel[]>('/labels');
}

export async function createLabel(name: string, color?: string): Promise<TodoistLabel> {
  const client = new TodoistClient();
  return client.request<TodoistLabel>('/labels', {
    method: 'POST',
    body: {
      name,
      color,
    },
  });
}

export async function ensureLabel(name: string, color?: string): Promise<TodoistLabel> {
  const labels = await getLabels();
  const existing = labels.find((label) => label.name === name);

  if (existing) {
    return existing;
  }

  return createLabel(name, color);
}

export async function updateLabelName(labelId: string, name: string): Promise<void> {
  const client = new TodoistClient();
  await client.request<void>(`/labels/${labelId}`, {
    method: 'POST',
    body: { name },
  });
}

// ============================================================================
// AIDA SYNC
// ============================================================================

interface RoleRow {
  id: number;
  name: string;
  todoist_label_name: string | null;
}

export async function syncRolesToLabels(): Promise<RoleRow[]> {
  const db = getDatabase();
  const roles = db
    .query('SELECT id, name, todoist_label_name FROM roles WHERE status = "active" ORDER BY id')
    .all() as RoleRow[];

  const labels = await getLabels();

  for (const role of roles) {
    const desired = buildRoleLabelName(role.name, role.id);

    // Rename existing label if possible (preserves label history on tasks)
    if (role.todoist_label_name && role.todoist_label_name !== desired) {
      const existing = labels.find((l) => l.name === role.todoist_label_name);
      const desiredExists = labels.some((l) => l.name === desired);

      if (existing && !desiredExists) {
        await updateLabelName(existing.id, desired);
        existing.name = desired;
      } else {
        await ensureLabel(desired);
      }

      db.query('UPDATE roles SET todoist_label_name = ? WHERE id = ?').run(desired, role.id);
      role.todoist_label_name = desired;
      continue;
    }

    await ensureLabel(desired);

    if (!role.todoist_label_name || role.todoist_label_name !== desired) {
      db.query('UPDATE roles SET todoist_label_name = ? WHERE id = ?').run(desired, role.id);
      role.todoist_label_name = desired;
    }
  }

  return roles;
}

export function buildRoleLabelName(roleName: string, roleId: number): string {
  const prefix = `A${String(roleId).padStart(2, '0')}`;

  const stripped = roleName.trim().replace(/^A\d{1,3}\s*[-: ]\s*/i, '');

  const normalized = stripped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const safe = normalized || 'role';
  return `${prefix}-${safe}`;
}
