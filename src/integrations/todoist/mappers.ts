/**
 * Todoist ↔ AIDA Mapping Helpers
 */

import type { AidaTask, CreateTaskInput, EnergyLevel, TodoistTask } from './types';
import { getDatabase } from '../../database/connection';
import { buildRoleLabelName } from './labels';

// ============================================================================
// CONSTANTS
// ============================================================================

const ENERGY_LABELS: Record<EnergyLevel, string> = {
  high: 'energy-high',
  medium: 'energy-medium',
  low: 'energy-low',
};

const CONTEXT_PREFIX = 'ctx-';

// ============================================================================
// MAPPERS
// ============================================================================

export function mapLabelsForTask(input: Partial<CreateTaskInput>): string[] {
  const labels: string[] = [];

  if (input.energy) {
    labels.push(ENERGY_LABELS[input.energy]);
  }

  if (input.role_id) {
    const db = getDatabase();
    const role = db
      .query('SELECT id, name, todoist_label_name FROM roles WHERE id = ?')
      .get(input.role_id) as { id: number; name: string; todoist_label_name: string | null } | null;

    if (role) {
      labels.push(role.todoist_label_name || buildRoleLabelName(role.name, role.id));
    }
  }

  if (input.contexts) {
    labels.push(...input.contexts.map((context) => `${CONTEXT_PREFIX}${context}`));
  }

  return labels;
}

export function mapToAidaTask(task: TodoistTask): AidaTask {
  const db = getDatabase();

  let energyRequirement: EnergyLevel | null = null;
  for (const [level, label] of Object.entries(ENERGY_LABELS)) {
    if (task.labels.includes(label)) {
      energyRequirement = level as EnergyLevel;
      break;
    }
  }

  const contexts = task.labels
    .filter((label) => label.startsWith(CONTEXT_PREFIX))
    .map((label) => label.replace(CONTEXT_PREFIX, ''));

  let aidaRoleId: number | null = null;
  let aidaRoleName: string | null = null;

  for (const label of task.labels) {
    const role = db
      .query('SELECT id, name FROM roles WHERE todoist_label_name = ?')
      .get(label) as { id: number; name: string } | null;

    if (role) {
      aidaRoleId = role.id;
      aidaRoleName = role.name;
      break;
    }
  }

  let aidaProjectId: number | null = null;
  let aidaProjectName: string | null = null;

  if (task.project_id) {
    const project = db
      .query('SELECT id, name FROM projects WHERE todoist_project_id = ?')
      .get(task.project_id) as { id: number; name: string } | null;

    if (project) {
      aidaProjectId = project.id;
      aidaProjectName = project.name;
    }
  }

  return {
    ...task,
    aida_role_id: aidaRoleId,
    aida_role_name: aidaRoleName,
    aida_project_id: aidaProjectId,
    aida_project_name: aidaProjectName,
    energy_requirement: energyRequirement,
    contexts,
  };
}
