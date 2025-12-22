/**
 * Common Schema Tests
 * Tests for shared validation schemas used across all modules
 */
import { describe, expect, test } from 'bun:test';
import {
  TaskStatusSchema,
  ProjectStatusSchema,
  RoleStatusSchema,
  RoleTypeSchema,
  EntryTypeSchema,
  EnergyRequirementSchema,
  PositiveIntSchema,
  ISODateSchema,
  ISODateTimeSchema,
  PrioritySchema,
} from '../schemas/common';

describe('Common Schemas', () => {
  describe('TaskStatusSchema', () => {
    test('accepts valid status values', () => {
      expect(() => TaskStatusSchema.parse('captured')).not.toThrow();
      expect(() => TaskStatusSchema.parse('clarified')).not.toThrow();
      expect(() => TaskStatusSchema.parse('ready')).not.toThrow();
      expect(() => TaskStatusSchema.parse('planned')).not.toThrow();
      expect(() => TaskStatusSchema.parse('done')).not.toThrow();
      expect(() => TaskStatusSchema.parse('cancelled')).not.toThrow();
    });

    test('rejects invalid status', () => {
      expect(() => TaskStatusSchema.parse('invalid')).toThrow();
      expect(() => TaskStatusSchema.parse('active')).toThrow();
    });
  });

  describe('ProjectStatusSchema', () => {
    test('accepts valid project statuses', () => {
      expect(() => ProjectStatusSchema.parse('active')).not.toThrow();
      expect(() => ProjectStatusSchema.parse('on_hold')).not.toThrow();
      expect(() => ProjectStatusSchema.parse('completed')).not.toThrow();
      expect(() => ProjectStatusSchema.parse('cancelled')).not.toThrow();
    });

    test('rejects invalid status', () => {
      expect(() => ProjectStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('RoleStatusSchema', () => {
    test('accepts valid role statuses', () => {
      expect(() => RoleStatusSchema.parse('active')).not.toThrow();
      expect(() => RoleStatusSchema.parse('inactive')).not.toThrow();
      expect(() => RoleStatusSchema.parse('historical')).not.toThrow();
    });

    test('rejects invalid status', () => {
      expect(() => RoleStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('RoleTypeSchema', () => {
    test('accepts valid role types', () => {
      expect(() => RoleTypeSchema.parse('meta')).not.toThrow();
      expect(() => RoleTypeSchema.parse('work')).not.toThrow();
      expect(() => RoleTypeSchema.parse('personal')).not.toThrow();
      expect(() => RoleTypeSchema.parse('hobby')).not.toThrow();
    });

    test('rejects invalid type', () => {
      expect(() => RoleTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('EntryTypeSchema', () => {
    test('accepts valid entry types', () => {
      expect(() => EntryTypeSchema.parse('checkin')).not.toThrow();
      expect(() => EntryTypeSchema.parse('reflection')).not.toThrow();
      expect(() => EntryTypeSchema.parse('task')).not.toThrow();
      expect(() => EntryTypeSchema.parse('note')).not.toThrow();
    });

    test('rejects invalid type', () => {
      expect(() => EntryTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('EnergyRequirementSchema', () => {
    test('accepts valid energy levels', () => {
      expect(() => EnergyRequirementSchema.parse('low')).not.toThrow();
      expect(() => EnergyRequirementSchema.parse('medium')).not.toThrow();
      expect(() => EnergyRequirementSchema.parse('high')).not.toThrow();
    });

    test('rejects invalid energy level', () => {
      expect(() => EnergyRequirementSchema.parse('invalid')).toThrow();
      expect(() => EnergyRequirementSchema.parse('very-high')).toThrow();
    });
  });

  describe('PositiveIntSchema', () => {
    test('accepts positive integers', () => {
      expect(() => PositiveIntSchema.parse(1)).not.toThrow();
      expect(() => PositiveIntSchema.parse(100)).not.toThrow();
    });

    test('rejects zero and negative', () => {
      expect(() => PositiveIntSchema.parse(0)).toThrow();
      expect(() => PositiveIntSchema.parse(-1)).toThrow();
    });

    test('rejects non-integers', () => {
      expect(() => PositiveIntSchema.parse(1.5)).toThrow();
      expect(() => PositiveIntSchema.parse('1')).toThrow();
    });
  });

  describe('ISODateSchema', () => {
    test('accepts valid ISO date format', () => {
      expect(() => ISODateSchema.parse('2025-12-18')).not.toThrow();
      expect(() => ISODateSchema.parse('2025-01-01')).not.toThrow();
    });

    test('rejects invalid formats', () => {
      expect(() => ISODateSchema.parse('18-12-2025')).toThrow();
      expect(() => ISODateSchema.parse('2025/12/18')).toThrow();
      expect(() => ISODateSchema.parse('Dec 18, 2025')).toThrow();
    });
  });

  describe('ISODateTimeSchema', () => {
    test('accepts valid ISO datetime formats', () => {
      expect(() => ISODateTimeSchema.parse('2025-12-18T14:30')).not.toThrow();
      expect(() => ISODateTimeSchema.parse('2025-12-18T14:30:00')).not.toThrow();
      expect(() => ISODateTimeSchema.parse('2025-12-18 14:30')).not.toThrow();
    });

    test('rejects invalid formats', () => {
      expect(() => ISODateTimeSchema.parse('2025-12-18')).toThrow();
      expect(() => ISODateTimeSchema.parse('14:30')).toThrow();
    });
  });

  describe('PrioritySchema', () => {
    test('accepts valid priority values', () => {
      expect(() => PrioritySchema.parse(0)).not.toThrow();
      expect(() => PrioritySchema.parse(3)).not.toThrow();
      expect(() => PrioritySchema.parse(10)).not.toThrow();
    });

    test('rejects out of range', () => {
      expect(() => PrioritySchema.parse(-1)).toThrow();
      expect(() => PrioritySchema.parse(11)).toThrow();
    });

    test('rejects non-integers', () => {
      expect(() => PrioritySchema.parse(1.5)).toThrow();
    });
  });
});
