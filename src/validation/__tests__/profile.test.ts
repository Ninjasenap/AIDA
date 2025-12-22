/**
 * Profile Validation Schema Tests
 *
 * Tests for profile validation schemas following TDD approach.
 */
import { describe, test, expect } from 'bun:test';
import {
  UpdateAttributeInputSchema,
  AddObservationInputSchema,
  ObservationCategorySchema,
  ObservationStatusSchema,
  ChangeSourceSchema,
} from '../schemas/profile';

describe('Profile Schemas', () => {
  describe('ChangeSourceSchema', () => {
    test('accepts valid change sources', () => {
      expect(ChangeSourceSchema.safeParse('user').success).toBe(true);
      expect(ChangeSourceSchema.safeParse('auto_learn').success).toBe(true);
      expect(ChangeSourceSchema.safeParse('setup_wizard').success).toBe(true);
      expect(ChangeSourceSchema.safeParse('import').success).toBe(true);
    });

    test('rejects invalid change source', () => {
      const result = ChangeSourceSchema.safeParse('invalid_source');
      expect(result.success).toBe(false);
    });
  });

  describe('ObservationCategorySchema', () => {
    test('accepts valid observation categories', () => {
      const categories = ['energy', 'time_preference', 'role_focus', 'task_completion', 'work_style', 'communication', 'other'];
      categories.forEach(cat => {
        expect(ObservationCategorySchema.safeParse(cat).success).toBe(true);
      });
    });

    test('rejects invalid category', () => {
      const result = ObservationCategorySchema.safeParse('invalid_category');
      expect(result.success).toBe(false);
    });
  });

  describe('ObservationStatusSchema', () => {
    test('accepts valid statuses', () => {
      expect(ObservationStatusSchema.safeParse('active').success).toBe(true);
      expect(ObservationStatusSchema.safeParse('applied').success).toBe(true);
      expect(ObservationStatusSchema.safeParse('dismissed').success).toBe(true);
    });

    test('rejects invalid status', () => {
      const result = ObservationStatusSchema.safeParse('pending');
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateAttributeInputSchema', () => {
    test('accepts valid minimal input', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'identity.name',
        value: 'New Name',
        source: 'user',
      });
      expect(result.success).toBe(true);
    });

    test('accepts input with reason', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'neurotype.challenges.0.severity',
        value: 'high',
        source: 'auto_learn',
        reason: 'Pattern detected from task completion rates',
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing path', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        value: 'Test',
        source: 'user',
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty path', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: '',
        value: 'Test',
        source: 'user',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing source', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'test.path',
        value: 'Test',
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid source', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'test.path',
        value: 'Test',
        source: 'invalid_source',
      });
      expect(result.success).toBe(false);
    });

    test('accepts undefined value', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'optional.field',
        value: undefined,
        source: 'user',
      });
      expect(result.success).toBe(true);
    });

    test('accepts null value', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'optional.field',
        value: null,
        source: 'user',
      });
      expect(result.success).toBe(true);
    });

    test('accepts any JSON value', () => {
      const result = UpdateAttributeInputSchema.safeParse({
        path: 'complex.data',
        value: { nested: { structure: [1, 2, 3] } },
        source: 'user',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AddObservationInputSchema', () => {
    test('accepts valid minimal observation', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'User is most productive in the morning',
        confidence: 0.85,
        status: 'active',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.evidence).toEqual([]);
      }
    });

    test('accepts observation with evidence', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'task_completion',
        pattern: 'Tasks completed faster when split into subtasks',
        confidence: 0.9,
        evidence: [
          '5 tasks with subtasks completed in avg 2h',
          '5 tasks without subtasks took avg 4h',
        ],
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    test('accepts observation with suggested_update', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Morning energy higher than initially configured',
        confidence: 0.95,
        evidence: ['Completed 15 high-energy tasks before noon'],
        suggested_update: {
          path: 'energy_pattern.high.preferred_time',
          value: 'morning',
          rationale: 'Consistent pattern over 2 weeks',
        },
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing category', () => {
      const result = AddObservationInputSchema.safeParse({
        pattern: 'Test pattern',
        confidence: 0.8,
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid category', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'invalid',
        pattern: 'Test pattern',
        confidence: 0.8,
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing pattern', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        confidence: 0.8,
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty pattern', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: '',
        confidence: 0.8,
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing confidence', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects confidence below 0', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: -0.1,
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects confidence above 1', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 1.1,
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('accepts confidence of 0', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0,
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    test('accepts confidence of 1', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 1,
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing status', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0.8,
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid status', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0.8,
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });

    test('rejects non-string items in evidence array', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0.8,
        evidence: ['Valid string', 123],
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects suggested_update missing required fields', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0.8,
        suggested_update: {
          path: 'test.path',
          // missing value and rationale
        },
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('rejects suggested_update with empty path', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0.8,
        suggested_update: {
          path: '',
          value: 'test',
          rationale: 'Test rationale',
        },
        status: 'active',
      });
      expect(result.success).toBe(false);
    });

    test('applies default empty array to evidence', () => {
      const result = AddObservationInputSchema.safeParse({
        category: 'energy',
        pattern: 'Test pattern',
        confidence: 0.8,
        status: 'active',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.evidence).toEqual([]);
      }
    });
  });
});
