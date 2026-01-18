/**
 * Todoist Setup Helper
 */

import { saveConfig } from './config';
import { syncRolesToLabels } from './labels';
import { syncProjectsToTodoist } from './projects';

// ============================================================================
// TYPES
// ============================================================================

export interface TodoistSetupInput {
  apiToken: string;
  syncRoles?: boolean;
  syncProjects?: boolean;
}

export interface TodoistSetupFromEnvInput {
  syncRoles?: boolean;
  syncProjects?: boolean;
}

export interface TodoistSetupResult {
  configSaved: boolean;
  rolesSynced?: number;
  projectsSynced?: number;
}

// ============================================================================
// SETUP
// ============================================================================

export async function setupTodoist(input: TodoistSetupInput): Promise<TodoistSetupResult> {
  saveConfig({ apiToken: input.apiToken });

  const result: TodoistSetupResult = { configSaved: true };

  if (input.syncRoles) {
    const roles = await syncRolesToLabels();
    result.rolesSynced = roles.length;
  }

  if (input.syncProjects) {
    const projects = await syncProjectsToTodoist();
    result.projectsSynced = projects.length;
  }

  return result;
}

/**
 * Setup using TODOIST_API_TOKEN env var.
 *
 * This avoids typing secrets into CLI JSON arguments.
 */
export async function setupTodoistFromEnv(
  input: TodoistSetupFromEnvInput = {}
): Promise<TodoistSetupResult> {
  const envToken = process.env.TODOIST_API_TOKEN;
  if (!envToken) {
    throw new Error('TODOIST_API_TOKEN is not set');
  }

  return setupTodoist({ apiToken: envToken, ...input });
}
