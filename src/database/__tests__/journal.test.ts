/**
 * Journal Query Function Tests
 *
 * Tests for all journal entry read and write functions.
 * Follows test-first approach with demo data from setup.ts.
 */

import { describe, test, expect } from 'bun:test';
import {
  createEntry,
  getTodayEntries,
  getEntriesByTask,
  getEntriesByProject,
  getEntriesByRole,
  getEntriesByType,
  getEntriesByDateRange,
} from '../queries/journal';
import type { CreateEntryInput } from '../types';

// =============================================================================
// WRITE FUNCTIONS - createEntry
// =============================================================================

/**************************************************************************
 * createEntry - Insert new journal entry with relations
 *
 * TESTS:
 * - Creates entry with all fields
 * - Creates entry with minimal fields (only content and type)
 * - Handles different entry types
 *
 * VALIDATES:
 * - Required field handling
 * - Timestamp generation
 * - Optional field handling
 *
 * NOT TESTED:
 * - Orphaned entry relations (deleted referenced entities)
 **************************************************************************/

describe('createEntry', () => {
  /**
   * Confirms journal entry creation with all optional fields.
   */
  test('should create a new journal entry with all fields', () => {
    const input: CreateEntryInput = {
      entry_type: 'task',
      content: 'Testentry: Slutförde en viktig uppgift',
      related_task_id: 1,
      related_project_id: 1,
      related_role_id: 1,
    };

    const entry = createEntry(input);

    expect(entry).toBeDefined();
    expect(entry.id).toBeGreaterThan(0);
    expect(entry.entry_type).toBe('task');
    expect(entry.content).toBe('Testentry: Slutförde en viktig uppgift');
    expect(entry.related_task_id).toBe(1);
    expect(entry.related_project_id).toBe(1);
    expect(entry.related_role_id).toBe(1);
    expect(entry.timestamp).toBeDefined();
  });

  test('should create entry with minimal fields (only content and type)', () => {
    const input: CreateEntryInput = {
      entry_type: 'note',
      content: 'En enkel anteckning',
    };

    const entry = createEntry(input);

    expect(entry).toBeDefined();
    expect(entry.id).toBeGreaterThan(0);
    expect(entry.entry_type).toBe('note');
    expect(entry.content).toBe('En enkel anteckning');
    expect(entry.related_task_id).toBeNull();
    expect(entry.related_project_id).toBeNull();
    expect(entry.related_role_id).toBeNull();
  });

  test('should create entries with different entry types', () => {
    const types: Array<'checkin' | 'task' | 'reflection' | 'idea' | 'event' | 'note'> = [
      'checkin',
      'reflection',
      'idea',
      'event',
    ];

    for (const type of types) {
      const entry = createEntry({
        entry_type: type,
        content: `Test ${type} entry`,
      });

      expect(entry.entry_type).toBe(type);
    }
  });
});

// =============================================================================
// READ FUNCTIONS - getTodayEntries
// =============================================================================

/**************************************************************************
 * getTodayEntries - Retrieve today's journal entries with related names
 *
 * TESTS:
 * - Returns entries from today with related entity names
 * - Entries ordered chronologically (ASC)
 * - Includes task_title, project_name, role_name when available
 *
 * VALIDATES:
 * - Date filtering
 * - JOIN retrieval of related names
 * - Ordering
 *
 * NOT TESTED:
 * - Midnight edge cases
 **************************************************************************/

describe('getTodayEntries', () => {
  /**
   * Confirms today's entries are retrieved with related entity information.
   */
  test('should return entries from today with related entity names', () => {
    // First create a new entry for today
    createEntry({
      entry_type: 'checkin',
      content: 'Test dagens entry',
      related_role_id: 1,
    });

    const entries = getTodayEntries();

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    // Check that entries have the extended fields
    const todayEntry = entries.find(e => e.content === 'Test dagens entry');
    expect(todayEntry).toBeDefined();
    expect(todayEntry?.role_name).toBeDefined();
  });

  test('should return entries in chronological order (ASC)', () => {
    const entries = getTodayEntries();

    if (entries.length > 1) {
      for (let i = 0; i < entries.length - 1; i++) {
        const current = new Date(entries[i].timestamp);
        const next = new Date(entries[i + 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  test('should include task_title, project_name, and role_name when available', () => {
    // Create entry with all relations
    createEntry({
      entry_type: 'task',
      content: 'Entry med alla relationer',
      related_task_id: 1,
      related_project_id: 1,
      related_role_id: 1,
    });

    const entries = getTodayEntries();
    const fullEntry = entries.find(e => e.content === 'Entry med alla relationer');

    expect(fullEntry).toBeDefined();
    expect(fullEntry?.task_title).toBeDefined();
    expect(fullEntry?.project_name).toBeDefined();
    expect(fullEntry?.role_name).toBeDefined();
  });
});

// =============================================================================
// READ FUNCTIONS - getEntriesByTask
// =============================================================================

/**************************************************************************
 * getEntriesByTask - Retrieve entries related to specific task
 *
 * TESTS:
 * - Returns all entries for specific task
 * - Entries ordered chronologically (ASC)
 * - Includes task_title from JOIN
 * - Returns empty array for task with no entries
 *
 * VALIDATES:
 * - Task filtering
 * - Ordering
 * - JOIN retrieval
 *
 * NOT TESTED:
 * - Bulk entry retrieval performance
 **************************************************************************/

describe('getEntriesByTask', () => {
  /**
   * Confirms all entries for specific task are retrieved.
   */
  test('should return all entries for a specific task', () => {
    // Create entries for task 1
    createEntry({
      entry_type: 'task',
      content: 'Startade arbetet på tasken',
      related_task_id: 1,
    });

    createEntry({
      entry_type: 'task',
      content: 'Slutförde tasken',
      related_task_id: 1,
    });

    const entries = getEntriesByTask(1);

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.every(e => e.related_task_id === 1)).toBe(true);
  });

  test('should return entries in chronological order (ASC)', () => {
    const entries = getEntriesByTask(1);

    if (entries.length > 1) {
      for (let i = 0; i < entries.length - 1; i++) {
        const current = new Date(entries[i].timestamp);
        const next = new Date(entries[i + 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  test('should include task_title from JOIN', () => {
    const entries = getEntriesByTask(1);

    if (entries.length > 0) {
      expect(entries[0].task_title).toBeDefined();
    }
  });

  test('should return empty array for task with no entries', () => {
    const entries = getEntriesByTask(999999);
    expect(entries).toEqual([]);
  });
});

// =============================================================================
// READ FUNCTIONS - getEntriesByProject
// =============================================================================

/**************************************************************************
 * getEntriesByProject - Retrieve entries related to specific project
 *
 * TESTS:
 * - Returns all entries for specific project
 * - Entries ordered chronologically (ASC)
 * - Includes project_name from JOIN
 * - Returns empty array for project with no entries
 *
 * VALIDATES:
 * - Project filtering
 * - Ordering
 * - JOIN retrieval
 *
 * NOT TESTED:
 * - Large project entry sets
 **************************************************************************/

describe('getEntriesByProject', () => {
  /**
   * Confirms all entries for specific project are retrieved.
   */
  test('should return all entries for a specific project', () => {
    // Create entries for project 1
    createEntry({
      entry_type: 'note',
      content: 'Projektanteckning 1',
      related_project_id: 1,
    });

    const entries = getEntriesByProject(1);

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(e => e.related_project_id === 1)).toBe(true);
  });

  test('should return entries in chronological order (ASC)', () => {
    const entries = getEntriesByProject(1);

    if (entries.length > 1) {
      for (let i = 0; i < entries.length - 1; i++) {
        const current = new Date(entries[i].timestamp);
        const next = new Date(entries[i + 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  test('should include project_name from JOIN', () => {
    const entries = getEntriesByProject(1);

    if (entries.length > 0) {
      expect(entries[0].project_name).toBeDefined();
    }
  });

  test('should return empty array for project with no entries', () => {
    const entries = getEntriesByProject(999999);
    expect(entries).toEqual([]);
  });
});

// =============================================================================
// READ FUNCTIONS - getEntriesByRole
// =============================================================================

/**************************************************************************
 * getEntriesByRole - Retrieve entries related to specific role
 *
 * TESTS:
 * - Returns all entries for specific role
 * - Entries ordered chronologically (ASC)
 * - Includes role_name from JOIN
 * - Returns empty array for role with no entries
 *
 * VALIDATES:
 * - Role filtering
 * - ASC ordering
 * - JOIN retrieval
 *
 * NOT TESTED:
 * - Time-series aggregation
 **************************************************************************/

describe('getEntriesByRole', () => {
  /**
   * Confirms all entries for specific role are retrieved.
   */
  test('should return all entries for a specific role', () => {
    const entries = getEntriesByRole(1);

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    // Demo data should have role entries
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(e => e.related_role_id === 1)).toBe(true);
  });

  test('should return entries in chronological order (ASC)', () => {
    const entries = getEntriesByRole(1);

    if (entries.length > 1) {
      for (let i = 0; i < entries.length - 1; i++) {
        const current = new Date(entries[i].timestamp);
        const next = new Date(entries[i + 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  test('should include role_name from JOIN', () => {
    const entries = getEntriesByRole(1);

    if (entries.length > 0) {
      expect(entries[0].role_name).toBeDefined();
    }
  });

  test('should return empty array for role with no entries', () => {
    const entries = getEntriesByRole(999999);
    expect(entries).toEqual([]);
  });
});

// =============================================================================
// READ FUNCTIONS - getEntriesByType
// =============================================================================

/**************************************************************************
 * getEntriesByType - Retrieve entries by type with optional date filtering
 *
 * TESTS:
 * - Returns entries of specific type
 * - Entries ordered chronologically (ASC)
 * - Filters by date range when provided
 * - Includes related entity names
 * - Returns empty array for type with no entries
 *
 * VALIDATES:
 * - Type filtering
 * - Date range filtering
 * - ASC ordering
 * - JOIN retrieval
 *
 * NOT TESTED:
 * - Very large date ranges
 **************************************************************************/

describe('getEntriesByType', () => {
  /**
   * Confirms entries of specific type are retrieved.
   */
  test('should return all entries of specific type', () => {
    // Create some test entries
    createEntry({ entry_type: 'reflection', content: 'Reflection 1' });
    createEntry({ entry_type: 'reflection', content: 'Reflection 2' });

    const entries = getEntriesByType({ type: 'reflection' });

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.every(e => e.entry_type === 'reflection')).toBe(true);
  });

  test('should return entries in chronological order (ASC)', () => {
    const entries = getEntriesByType({ type: 'checkin' });

    if (entries.length > 1) {
      for (let i = 0; i < entries.length - 1; i++) {
        const current = new Date(entries[i].timestamp);
        const next = new Date(entries[i + 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  test('should filter by date range when provided', () => {
    const today = new Date();
    const startDate = today.toISOString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endDate = tomorrow.toISOString();

    // Create a test entry
    createEntry({ entry_type: 'idea', content: 'Test idea för datumfilter' });

    const entries = getEntriesByType({ type: 'idea', startDate, endDate });

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);

    // All entries should be within date range
    for (const entry of entries) {
      const entryDate = new Date(entry.timestamp);
      expect(entryDate >= new Date(startDate)).toBe(true);
      expect(entryDate <= new Date(endDate)).toBe(true);
    }
  });

  test('should include related entity names when available', () => {
    createEntry({
      entry_type: 'event',
      content: 'Event med relationer',
      related_task_id: 1,
      related_role_id: 1,
    });

    const entries = getEntriesByType({ type: 'event' });
    const eventEntry = entries.find(e => e.content === 'Event med relationer');

    expect(eventEntry).toBeDefined();
    expect(eventEntry?.task_title).toBeDefined();
    expect(eventEntry?.role_name).toBeDefined();
  });

  test('should return empty array for type with no entries', () => {
    const entries = getEntriesByType({
      type: 'note',
      startDate: '2000-01-01T00:00:00Z',
      endDate: '2000-01-02T00:00:00Z',
    });
    expect(entries).toEqual([]);
  });
});

// =============================================================================
// READ FUNCTIONS - getEntriesByDateRange
// =============================================================================

/**************************************************************************
 * getEntriesByDateRange - Retrieve entries within date range
 *
 * TESTS:
 * - Returns entries within specified date range
 * - Entries ordered chronologically (ASC)
 * - Includes related entity names
 * - Handles same-day ranges
 * - Returns empty array when no entries in range
 *
 * VALIDATES:
 * - Date range filtering
 * - ASC ordering
 * - JOIN retrieval
 * - Date boundary handling
 *
 * NOT TESTED:
 * - DST transitions
 **************************************************************************/

describe('getEntriesByDateRange', () => {
  /**
   * Confirms entries within specified date range are retrieved.
   */
  test('should return entries within specified date range', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = yesterday.toISOString();
    const endDate = tomorrow.toISOString();

    // Create test entry
    createEntry({ entry_type: 'note', content: 'Entry för datumrange-test' });

    const entries = getEntriesByDateRange({ startDate, endDate });

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    // Verify all entries are within range
    for (const entry of entries) {
      const entryDate = new Date(entry.timestamp);
      expect(entryDate >= new Date(startDate)).toBe(true);
      expect(entryDate <= new Date(endDate)).toBe(true);
    }
  });

  test('should return entries in chronological order (ASC)', () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const entries = getEntriesByDateRange({ startDate: weekAgo.toISOString(), endDate: today.toISOString() });

    if (entries.length > 1) {
      for (let i = 0; i < entries.length - 1; i++) {
        const current = new Date(entries[i].timestamp);
        const next = new Date(entries[i + 1].timestamp);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    }
  });

  test('should include related entity names', () => {
    createEntry({
      entry_type: 'task',
      content: 'Entry med alla relationer för range-test',
      related_task_id: 1,
      related_project_id: 1,
      related_role_id: 1,
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = getEntriesByDateRange({ startDate: yesterday.toISOString(), endDate: tomorrow.toISOString() });
    const fullEntry = entries.find(e => e.content === 'Entry med alla relationer för range-test');

    expect(fullEntry).toBeDefined();
    expect(fullEntry?.task_title).toBeDefined();
    expect(fullEntry?.project_name).toBeDefined();
    expect(fullEntry?.role_name).toBeDefined();
  });

  test('should return empty array when no entries in range', () => {
    const entries = getEntriesByDateRange({ startDate: '2000-01-01T00:00:00Z', endDate: '2000-01-02T00:00:00Z' });
    expect(entries).toEqual([]);
  });

  test('should handle same day range', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = getEntriesByDateRange({ startDate: today.toISOString(), endDate: endOfDay.toISOString() });

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
  });
});
