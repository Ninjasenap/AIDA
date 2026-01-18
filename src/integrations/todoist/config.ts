/**
 * Todoist Configuration
 *
 * Stores API tokens and integration settings.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getContextDir } from '../../utilities/paths';

// ============================================================================
// TYPES
// ============================================================================

export interface TodoistConfig {
  apiToken: string;
  syncFreshnessMinutes: number;
  defaultLabels: {
    energy: string[];
    context: string[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: TodoistConfig = {
  apiToken: '',
  syncFreshnessMinutes: 5,
  defaultLabels: {
    energy: ['energy-high', 'energy-medium', 'energy-low'],
    context: ['ctx-computer', 'ctx-phone', 'ctx-home', 'ctx-errands'],
  },
};

const CONFIG_FILENAME = 'todoist-config.json';

// ============================================================================
// PATHS
// ============================================================================

function ensureContextDir(): string {
  const contextDir = getContextDir();
  if (!existsSync(contextDir)) {
    mkdirSync(contextDir, { recursive: true });
  }
  return contextDir;
}

export function getConfigPath(): string {
  return join(ensureContextDir(), CONFIG_FILENAME);
}

// ============================================================================
// CONFIG OPERATIONS
// ============================================================================

export function getConfig(): TodoistConfig {
  const configPath = getConfigPath();

  let fileConfig: Partial<TodoistConfig> = {};

  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf-8');
    fileConfig = JSON.parse(content) as TodoistConfig;
  }

  const envToken = process.env.TODOIST_API_TOKEN || '';

  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    apiToken: envToken || fileConfig.apiToken || DEFAULT_CONFIG.apiToken,
  };
}

export function saveConfig(partial: Partial<TodoistConfig>): TodoistConfig {
  const configPath = getConfigPath();
  const merged = { ...getConfig(), ...partial };

  writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');

  return merged;
}

export function isConfigured(): boolean {
  return Boolean(getConfig().apiToken);
}
