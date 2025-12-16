/**
 * Database Helper Functions
 *
 * Utility functions for sorting, grouping, parsing JSON data, and date
 * calculations used throughout the AIDA system database operations.
 */

import type {
  SubtaskInfo,
  FinishCriterion,
  TaskStatus,
  ProjectStatus,
} from './types';

// =============================================================================
// SORTING ORDER CONSTANTS
// =============================================================================

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'planned',
  'ready',
  'clarified',
  'captured',
  'done',
  'cancelled',
];

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'active',
  'on_hold',
  'completed',
  'cancelled',
];

// =============================================================================
// GROUPING FUNCTIONS
// =============================================================================

/**
 * Groups array items by a key function result.
 *
 * @param items - Array of items to group
 * @param keyFn - Function that extracts the grouping key from each item
 * @returns Map with keys mapped to arrays of grouped items
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);

    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return map;
}

// =============================================================================
// JSON PARSING FUNCTIONS
// =============================================================================

/**
 * Parses subtask JSON array from database, handling edge cases.
 *
 * Handles null, empty, and SQLite edge case responses gracefully.
 *
 * @param json - JSON string from database
 * @returns Array of parsed subtasks, or empty array if invalid
 */
export function parseSubtasks(json: string): SubtaskInfo[] {
  if (!json || json === '[]' || json === 'null') {
    return [];
  }

  try {
    const parsed = JSON.parse(json);

    // SQLite edge case: empty JSON_AGG returns [{"id": null}], not empty array
    if (Array.isArray(parsed) && parsed.length === 1 && parsed[0].id === null) {
      return [];
    }

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parses finish criteria JSON array from database.
 *
 * @param json - JSON string or null from database
 * @returns Array of parsed finish criteria, or empty array if invalid
 */
export function parseFinishCriteria(
  json: string | null
): FinishCriterion[] {
  if (!json || json === '[]' || json === 'null') {
    return [];
  }

  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// =============================================================================
// DATE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculates the current ISO 8601 week range (Monday to Sunday).
 *
 * @returns Object with start (Monday) and end (Sunday) ISO date strings
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Calculate Monday of current week (ISO 8601: weeks start Monday)
  const monday = new Date(now);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday edge case
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // Calculate Sunday (6 days after Monday)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}
