/**
 * Plan Validation Schema Tests
 *
 * Tests for daily plan validation schemas following TDD approach.
 */
import { describe, test, expect } from 'bun:test';
import {
  PlanEventSchema,
  CreateDailyPlanInputSchema,
} from '../schemas/plan';

describe('Plan Schemas', () => {
  describe('PlanEventSchema', () => {
    test('accepts valid event with time and title', () => {
      const result = PlanEventSchema.safeParse({
        time: '09:00',
        title: 'Morning standup',
      });
      expect(result.success).toBe(true);
    });

    test('accepts various time formats', () => {
      expect(PlanEventSchema.safeParse({ time: '00:00', title: 'Midnight' }).success).toBe(true);
      expect(PlanEventSchema.safeParse({ time: '12:30', title: 'Lunch' }).success).toBe(true);
      expect(PlanEventSchema.safeParse({ time: '23:59', title: 'End of day' }).success).toBe(true);
    });

    test('rejects invalid time format', () => {
      const result = PlanEventSchema.safeParse({
        time: '9:00',  // Missing leading zero
        title: 'Meeting',
      });
      expect(result.success).toBe(false);
    });

    test('rejects time with seconds', () => {
      const result = PlanEventSchema.safeParse({
        time: '09:00:00',
        title: 'Meeting',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing title', () => {
      const result = PlanEventSchema.safeParse({
        time: '09:00',
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty title', () => {
      const result = PlanEventSchema.safeParse({
        time: '09:00',
        title: '',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing time', () => {
      const result = PlanEventSchema.safeParse({
        title: 'Meeting',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateDailyPlanInputSchema', () => {
    test('accepts valid minimal input', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toEqual([]);
        expect(result.data.focus).toEqual([]);
        expect(result.data.next_steps).toEqual([]);
        expect(result.data.parked).toEqual([]);
        expect(result.data.notes).toBe('');
      }
    });

    test('accepts complete plan input', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        events: [
          { time: '09:00', title: 'Standup' },
          { time: '14:00', title: 'Review' },
        ],
        focus: ['Complete feature X', 'Review PRs'],
        next_steps: ['Test deployment', 'Update docs'],
        parked: ['Future idea 1', 'Future idea 2'],
        notes: 'Important deadline on Friday',
      });
      expect(result.success).toBe(true);
    });

    test('rejects invalid date format', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '18-12-2025',  // Wrong format
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing date', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        events: [],
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid event in events array', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        events: [
          { time: '9:00', title: 'Meeting' },  // Invalid time format
        ],
      });
      expect(result.success).toBe(false);
    });

    test('rejects non-string items in focus array', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        focus: ['Valid', 123],  // Number in array
      });
      expect(result.success).toBe(false);
    });

    test('rejects non-string items in next_steps array', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        next_steps: [null],  // Null in array
      });
      expect(result.success).toBe(false);
    });

    test('rejects non-string items in parked array', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        parked: [{ item: 'test' }],  // Object in array
      });
      expect(result.success).toBe(false);
    });

    test('rejects non-string notes', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        notes: 123,
      });
      expect(result.success).toBe(false);
    });

    test('accepts empty arrays for all optional fields', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        events: [],
        focus: [],
        next_steps: [],
        parked: [],
        notes: '',
      });
      expect(result.success).toBe(true);
    });

    test('applies defaults when optional fields omitted', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toEqual([]);
        expect(result.data.focus).toEqual([]);
        expect(result.data.next_steps).toEqual([]);
        expect(result.data.parked).toEqual([]);
        expect(result.data.notes).toBe('');
      }
    });

    test('accepts mix of provided and omitted optional fields', () => {
      const result = CreateDailyPlanInputSchema.safeParse({
        date: '2025-12-18',
        focus: ['Focus item'],
        // events, next_steps, parked, notes omitted
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.focus).toEqual(['Focus item']);
        expect(result.data.events).toEqual([]);
        expect(result.data.next_steps).toEqual([]);
        expect(result.data.parked).toEqual([]);
        expect(result.data.notes).toBe('');
      }
    });
  });
});
