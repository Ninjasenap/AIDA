/**
 * Validator Tests
 * Tests for CLI argument validation logic
 */
import { describe, expect, test } from 'bun:test';
import { validateCLIArgs } from '../validator';

describe('validateCLIArgs', () => {
  describe('Module and function validation', () => {
    test('returns error for unknown module', () => {
      const result = validateCLIArgs('unknown', 'someFunc', []);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown module');
      expect(result.error?.suggestion).toContain('Available modules');
    });

    test('returns error for unknown function', () => {
      const result = validateCLIArgs('tasks', 'unknownFunction', []);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unknown function');
      expect(result.error?.suggestion).toContain('Available functions');
    });
  });

  describe('Argument mode: none', () => {
    test('accepts no arguments for no-arg functions', () => {
      const result = validateCLIArgs('tasks', 'getTodayTasks', []);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('Argument mode: positional-id', () => {
    test('accepts valid ID', () => {
      const result = validateCLIArgs('tasks', 'getTaskById', [1]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1]);
    });

    test('rejects invalid ID type', () => {
      const result = validateCLIArgs('tasks', 'getTaskById', ['abc']);

      expect(result.success).toBe(false);
      expect(result.error?.details).toBeDefined();
    });

    test('rejects wrong argument count', () => {
      const result = validateCLIArgs('tasks', 'getTaskById', []);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('requires exactly 1 argument');
    });
  });

  describe('Argument mode: single-object', () => {
    test('accepts no args for optional schema (getTimeInfo)', () => {
      const result = validateCLIArgs('time', 'getTimeInfo', []);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('accepts optional string argument', () => {
      const result = validateCLIArgs('time', 'getTimeInfo', ['tomorrow']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['tomorrow']);
    });

    // Note: Full single-object validation will be tested in module-specific tests
    // once CreateTaskInputSchema etc. are added to the registry
  });

  describe('Error formatting', () => {
    test('includes module/function in error', () => {
      const result = validateCLIArgs('tasks', 'unknownFunc', []);

      expect(result.success).toBe(false);
      expect(result.error?.module).toBe('tasks');
      expect(result.error?.function).toBe('unknownFunc');
    });

    test('provides actionable suggestions for unknown functions', () => {
      const result = validateCLIArgs('tasks', 'unknownFunc', []);

      expect(result.success).toBe(false);
      expect(result.error?.suggestion).toBeDefined();
      expect(result.error?.suggestion).toContain('Available functions');
    });
  });
});
