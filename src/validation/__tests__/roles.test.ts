/**
 * Role Validation Schema Tests
 *
 * Tests for role validation schemas including create, update, and query operations.
 */
import { describe, expect, test } from 'bun:test';
import {
  CreateRoleInputSchema,
  UpdateRoleInputSchema,
  SetRoleStatusInputSchema,
  GetRolesByTypeInputSchema,
} from '../schemas/roles';

describe('Role Schemas', () => {
  describe('CreateRoleInputSchema', () => {
    test('accepts valid minimal input', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
        type: 'work',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Role');
        expect(result.data.type).toBe('work');
        expect(result.data.description).toBeUndefined();
        expect(result.data.responsibilities).toBeUndefined();
        expect(result.data.balance_target).toBeUndefined();
      }
    });

    test('accepts all optional fields', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Manager',
        type: 'work',
        description: 'Team leadership',
        responsibilities: ['Mentor team', 'Plan sprints'],
        balance_target: 0.4,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responsibilities).toEqual(['Mentor team', 'Plan sprints']);
        expect(result.data.balance_target).toBe(0.4);
      }
    });

    test('rejects missing name', () => {
      const result = CreateRoleInputSchema.safeParse({
        type: 'work',
      });

      expect(result.success).toBe(false);
    });

    test('rejects empty name string', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: '',
        type: 'work',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing type', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid type', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
        type: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    test('rejects negative balance_target', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
        type: 'work',
        balance_target: -0.1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects balance_target > 1', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
        type: 'work',
        balance_target: 1.5,
      });

      expect(result.success).toBe(false);
    });

    test('accepts valid balance_target', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
        type: 'work',
        balance_target: 0.5,
      });

      expect(result.success).toBe(true);
    });

    test('rejects non-array responsibilities', () => {
      const result = CreateRoleInputSchema.safeParse({
        name: 'Test Role',
        type: 'work',
        responsibilities: 'not an array',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateRoleInputSchema', () => {
    test('accepts valid update with id only', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with name', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with description', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        description: 'Updated description',
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with responsibilities', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        responsibilities: ['New task'],
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with balance_target', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        balance_target: 0.3,
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with all fields', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        name: 'New Name',
        description: 'New description',
        responsibilities: ['Task 1', 'Task 2'],
        balance_target: 0.6,
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = UpdateRoleInputSchema.safeParse({
        name: 'Test',
      });

      expect(result.success).toBe(false);
    });

    test('rejects empty name', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        name: '',
      });

      expect(result.success).toBe(false);
    });

    test('rejects negative balance_target', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 1,
        balance_target: -1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid id type', () => {
      const result = UpdateRoleInputSchema.safeParse({
        id: 'abc',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('SetRoleStatusInputSchema', () => {
    test('accepts valid status change to active', () => {
      const result = SetRoleStatusInputSchema.safeParse({
        id: 1,
        status: 'active',
      });

      expect(result.success).toBe(true);
    });

    test('accepts valid status change to inactive', () => {
      const result = SetRoleStatusInputSchema.safeParse({
        id: 1,
        status: 'inactive',
      });

      expect(result.success).toBe(true);
    });

    test('accepts valid status change to historical', () => {
      const result = SetRoleStatusInputSchema.safeParse({
        id: 1,
        status: 'historical',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = SetRoleStatusInputSchema.safeParse({
        status: 'active',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing status', () => {
      const result = SetRoleStatusInputSchema.safeParse({
        id: 1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid status', () => {
      const result = SetRoleStatusInputSchema.safeParse({
        id: 1,
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('GetRolesByTypeInputSchema', () => {
    test('accepts valid type query', () => {
      const result = GetRolesByTypeInputSchema.safeParse({
        type: 'work',
      });

      expect(result.success).toBe(true);
    });

    test('accepts type with includeInactive false', () => {
      const result = GetRolesByTypeInputSchema.safeParse({
        type: 'personal',
        includeInactive: false,
      });

      expect(result.success).toBe(true);
    });

    test('accepts type with includeInactive true', () => {
      const result = GetRolesByTypeInputSchema.safeParse({
        type: 'hobby',
        includeInactive: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(true);
      }
    });

    test('applies default includeInactive false', () => {
      const result = GetRolesByTypeInputSchema.safeParse({
        type: 'civic',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(false);
      }
    });

    test('rejects missing type', () => {
      const result = GetRolesByTypeInputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('rejects invalid type', () => {
      const result = GetRolesByTypeInputSchema.safeParse({
        type: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid includeInactive type', () => {
      const result = GetRolesByTypeInputSchema.safeParse({
        type: 'work',
        includeInactive: 'yes',
      });

      expect(result.success).toBe(false);
    });
  });
});
