/**
 * Symbol Mappings for AIDA
 *
 * Provides mappings between database values (statuses, types) and their visual symbols (emojis).
 * Source: .system/dbscenarios.md
 */

export const TASK_STATUS_SYMBOLS = {
  captured: '📥',
  clarified: '🔍',
  ready: '🎯',
  planned: '📅',
  done: '✅',
  cancelled: '❌',
} as const;

export const PROJECT_STATUS_SYMBOLS = {
  active: '▶️',
  on_hold: '⏸️',
  completed: '✅',
  cancelled: '❌',
} as const;

export const ROLE_STATUS_SYMBOLS = {
  active: '🟢',
  inactive: '🔵',
  historical: '⚪',
} as const;

export const ENTRY_TYPE_SYMBOLS = {
  checkin: '✓',
  reflection: '💭',
  task: '☑️',
  event: '📅',
  note: '📝',
  idea: '💡',
} as const;

export const ROLE_TYPE_SYMBOLS = {
  meta: '🧠',
  work: '💼',
  personal: '👤',
  private: '🔒',
  civic: '🏛️',
  side_business: '💰',
  hobby: '🎨',
} as const;

// Type definitions
export type TaskStatus = keyof typeof TASK_STATUS_SYMBOLS;
export type ProjectStatus = keyof typeof PROJECT_STATUS_SYMBOLS;
export type RoleStatus = keyof typeof ROLE_STATUS_SYMBOLS;
export type EntryType = keyof typeof ENTRY_TYPE_SYMBOLS;
export type RoleType = keyof typeof ROLE_TYPE_SYMBOLS;

/**
─────────────────────────────────────────────────────────────────────────────
SYMBOL LOOKUP FUNCTIONS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Gets the emoji symbol for a task status.
 *
 * @param status - The task status key to look up
 * @returns The corresponding emoji symbol, or '❓' if not found
 */
export function getTaskStatusSymbol(status: TaskStatus): string {
  return TASK_STATUS_SYMBOLS[status] || '❓';
}

/**
 * Gets the emoji symbol for a project status.
 *
 * @param status - The project status key to look up
 * @returns The corresponding emoji symbol, or '❓' if not found
 */
export function getProjectStatusSymbol(status: ProjectStatus): string {
  return PROJECT_STATUS_SYMBOLS[status] || '❓';
}

/**
 * Gets the emoji symbol for a role status.
 *
 * @param status - The role status key to look up
 * @returns The corresponding emoji symbol, or '❓' if not found
 */
export function getRoleStatusSymbol(status: RoleStatus): string {
  return ROLE_STATUS_SYMBOLS[status] || '❓';
}

/**
 * Gets the emoji symbol for an entry type.
 *
 * @param type - The entry type key to look up
 * @returns The corresponding emoji symbol, or '❓' if not found
 */
export function getEntryTypeSymbol(type: EntryType): string {
  return ENTRY_TYPE_SYMBOLS[type] || '❓';
}

/**
 * Gets the emoji symbol for a role type.
 *
 * @param type - The role type key to look up
 * @returns The corresponding emoji symbol, or '❓' if not found
 */
export function getRoleTypeSymbol(type: RoleType): string {
  return ROLE_TYPE_SYMBOLS[type] || '❓';
}

/**
─────────────────────────────────────────────────────────────────────────────
REVERSE LOOKUP FUNCTIONS (symbol -> value)
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Looks up a task status from its emoji symbol.
 *
 * @param symbol - The emoji symbol to look up
 * @returns The corresponding task status key, or undefined if not found
 */
export function getTaskStatusFromSymbol(symbol: string): TaskStatus | undefined {
  return (Object.keys(TASK_STATUS_SYMBOLS) as TaskStatus[]).find(
    key => TASK_STATUS_SYMBOLS[key] === symbol
  );
}

/**
 * Looks up a project status from its emoji symbol.
 *
 * @param symbol - The emoji symbol to look up
 * @returns The corresponding project status key, or undefined if not found
 */
export function getProjectStatusFromSymbol(symbol: string): ProjectStatus | undefined {
  return (Object.keys(PROJECT_STATUS_SYMBOLS) as ProjectStatus[]).find(
    key => PROJECT_STATUS_SYMBOLS[key] === symbol
  );
}

/**
 * Looks up a role status from its emoji symbol.
 *
 * @param symbol - The emoji symbol to look up
 * @returns The corresponding role status key, or undefined if not found
 */
export function getRoleStatusFromSymbol(symbol: string): RoleStatus | undefined {
  return (Object.keys(ROLE_STATUS_SYMBOLS) as RoleStatus[]).find(
    key => ROLE_STATUS_SYMBOLS[key] === symbol
  );
}

/**
 * Looks up an entry type from its emoji symbol.
 *
 * @param symbol - The emoji symbol to look up
 * @returns The corresponding entry type key, or undefined if not found
 */
export function getEntryTypeFromSymbol(symbol: string): EntryType | undefined {
  return (Object.keys(ENTRY_TYPE_SYMBOLS) as EntryType[]).find(
    key => ENTRY_TYPE_SYMBOLS[key] === symbol
  );
}

/**
 * Looks up a role type from its emoji symbol.
 *
 * @param symbol - The emoji symbol to look up
 * @returns The corresponding role type key, or undefined if not found
 */
export function getRoleTypeFromSymbol(symbol: string): RoleType | undefined {
  return (Object.keys(ROLE_TYPE_SYMBOLS) as RoleType[]).find(
    key => ROLE_TYPE_SYMBOLS[key] === symbol
  );
}

/**
─────────────────────────────────────────────────────────────────────────────
FORMATTED DISPLAY HELPERS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Formats a task status for display with emoji prefix.
 *
 * @param status - The task status to format
 * @returns Formatted string like "🎯 ready"
 */
export function formatTaskStatus(status: TaskStatus): string {
  return `${getTaskStatusSymbol(status)} ${status}`;
}

/**
 * Formats a project status for display with emoji prefix.
 *
 * @param status - The project status to format
 * @returns Formatted string like "▶️ active"
 */
export function formatProjectStatus(status: ProjectStatus): string {
  return `${getProjectStatusSymbol(status)} ${status}`;
}

/**
 * Formats a role status for display with emoji prefix.
 *
 * @param status - The role status to format
 * @returns Formatted string like "🟢 active"
 */
export function formatRoleStatus(status: RoleStatus): string {
  return `${getRoleStatusSymbol(status)} ${status}`;
}

/**
 * Formats an entry type for display with emoji prefix.
 *
 * @param type - The entry type to format
 * @returns Formatted string like "💭 reflection"
 */
export function formatEntryType(type: EntryType): string {
  return `${getEntryTypeSymbol(type)} ${type}`;
}

/**
 * Formats a role type for display with emoji prefix.
 *
 * @param type - The role type to format
 * @returns Formatted string like "💼 work"
 */
export function formatRoleType(type: RoleType): string {
  return `${getRoleTypeSymbol(type)} ${type}`;
}
