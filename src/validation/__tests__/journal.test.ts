/**
 * Journal Validation Schema Tests
 *
 * Tests for journal entry validation schemas including discriminated union
 * for different entry types with soft validation (entry-specific fields optional).
 */
import { describe, expect, test } from 'bun:test';
import {
  CreateEntryInputSchema,
  GetEntriesByTypeInputSchema,
  GetEntriesByDateRangeInputSchema,
} from '../schemas/journal';

describe('Journal Schemas', () => {
  describe('CreateEntryInputSchema (discriminated union)', () => {
    describe('checkin entries', () => {
      test('accepts valid minimal checkin entry', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'checkin',
          content: 'Morning check-in',
        });

        expect(result.success).toBe(true);
      });

      test('accepts checkin with all optional fields', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'checkin',
          content: 'Feeling productive today',
          timestamp: '2025-12-19T09:00:00',
          todoist_task_id: 'todoist-1',
          related_project_id: 2,
          related_role_id: 3,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('reflection entries', () => {
      test('accepts valid reflection entry', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'reflection',
          content: 'Today went well',
        });

        expect(result.success).toBe(true);
      });

      test('accepts reflection with optional fields', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'reflection',
          content: 'Learned something new',
          timestamp: '2025-12-19T18:00:00',
          related_role_id: 1,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('note entries', () => {
      test('accepts valid note entry', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'note',
          content: 'A simple note',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('task entries', () => {
      test('accepts task entry with todoist task association', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'task',
          content: 'Task completed',
          todoist_task_id: 'todoist-5',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('event entries', () => {
      test('accepts event entry', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'event',
          content: 'Meeting with team',
        });

        expect(result.success).toBe(true);
      });

      test('accepts event with timestamp', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'event',
          content: 'Scheduled event',
          timestamp: '2025-12-20T14:00:00',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('idea entries', () => {
      test('accepts idea entry', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'idea',
          content: 'New feature idea',
        });

        expect(result.success).toBe(true);
      });

      test('accepts idea with project association', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'idea',
          content: 'Could improve performance',
          related_project_id: 3,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('validation rules', () => {
      test('rejects invalid entry_type', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'invalid',
          content: 'Test',
        });

        expect(result.success).toBe(false);
      });

      test('rejects missing content', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'note',
        });

        expect(result.success).toBe(false);
      });

      test('rejects empty content string', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'note',
          content: '',
        });

        expect(result.success).toBe(false);
      });

      test('rejects invalid timestamp format', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'note',
          content: 'Test',
          timestamp: 'not-a-date',
        });

        expect(result.success).toBe(false);
      });

      test('rejects invalid todoist_task_id type', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'task',
          content: 'Test',
          todoist_task_id: 123,
        });

        expect(result.success).toBe(false);
      });

      test('rejects negative related_project_id', () => {
        const result = CreateEntryInputSchema.safeParse({
          entry_type: 'note',
          content: 'Test',
          related_project_id: -1,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('GetEntriesByTypeInputSchema', () => {
    test('accepts valid type query', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({
        type: 'reflection',
      });

      expect(result.success).toBe(true);
    });

    test('accepts type with date range', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({
        type: 'checkin',
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBe('2025-12-01');
        expect(result.data.endDate).toBe('2025-12-31');
      }
    });

    test('accepts type with only startDate', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({
        type: 'note',
        startDate: '2025-12-01',
      });

      expect(result.success).toBe(true);
    });

    test('accepts type with only endDate', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({
        type: 'event',
        endDate: '2025-12-31',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing type', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('rejects invalid type', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({
        type: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid date format', () => {
      const result = GetEntriesByTypeInputSchema.safeParse({
        type: 'note',
        startDate: '01-12-2025',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('GetEntriesByDateRangeInputSchema', () => {
    test('accepts valid date range', () => {
      const result = GetEntriesByDateRangeInputSchema.safeParse({
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing startDate', () => {
      const result = GetEntriesByDateRangeInputSchema.safeParse({
        endDate: '2025-12-31',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing endDate', () => {
      const result = GetEntriesByDateRangeInputSchema.safeParse({
        startDate: '2025-12-01',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid date format', () => {
      const result = GetEntriesByDateRangeInputSchema.safeParse({
        startDate: '01/12/2025',
        endDate: '31/12/2025',
      });

      expect(result.success).toBe(false);
    });
  });
});
