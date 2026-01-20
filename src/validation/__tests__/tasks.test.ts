/**
 * Task Validation Schema Tests (Todoist)
 *
 * Tasks are stored in Todoist; these tests cover the Todoist-backed schemas.
 */
import { describe, expect, test } from 'bun:test';
import {
  TodoistCreateTaskInputSchema,
  TodoistUpdateTaskInputSchema,
  TodoistGetTasksFilterSchema,
  TodoistGetTasksByEnergySchema,
  TodoistGetTasksByRoleSchema,
} from '../schemas/todoist-tasks';

describe('Todoist Task Schemas', () => {
  describe('TodoistCreateTaskInputSchema', () => {
    test('accepts valid minimal input', () => {
      const result = TodoistCreateTaskInputSchema.safeParse({
        content: 'Test task',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Test task');
      }
    });

    test('rejects missing content', () => {
      const result = TodoistCreateTaskInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test('rejects empty content', () => {
      const result = TodoistCreateTaskInputSchema.safeParse({ content: '' });
      expect(result.success).toBe(false);
    });

    test('accepts optional fields', () => {
      const result = TodoistCreateTaskInputSchema.safeParse({
        content: 'Full task',
        description: 'desc',
        role_id: 1,
        project_id: 2,
        energy: 'high',
        due_string: 'tomorrow',
        priority: 4,
        contexts: ['hemma', 'dator'],
      });

      expect(result.success).toBe(true);
    });

    test('rejects invalid priority', () => {
      expect(
        TodoistCreateTaskInputSchema.safeParse({ content: 'x', priority: 0 }).success
      ).toBe(false);
      expect(
        TodoistCreateTaskInputSchema.safeParse({ content: 'x', priority: 5 }).success
      ).toBe(false);
    });

    test('rejects invalid energy', () => {
      const result = TodoistCreateTaskInputSchema.safeParse({
        content: 'x',
        energy: 'extreme',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('TodoistUpdateTaskInputSchema', () => {
    test('accepts valid update', () => {
      const result = TodoistUpdateTaskInputSchema.safeParse({
        taskId: '123',
        content: 'Updated',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing taskId', () => {
      const result = TodoistUpdateTaskInputSchema.safeParse({ content: 'x' });
      expect(result.success).toBe(false);
    });
  });

  describe('TodoistGetTasksFilterSchema', () => {
    test('accepts empty filter', () => {
      const result = TodoistGetTasksFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    test('accepts due filter values', () => {
      const result = TodoistGetTasksFilterSchema.safeParse({ due: 'today' });
      expect(result.success).toBe(true);
    });

    test('rejects invalid due value', () => {
      const result = TodoistGetTasksFilterSchema.safeParse({ due: 'yesterday' });
      expect(result.success).toBe(false);
    });
  });

  describe('TodoistGetTasksByEnergySchema', () => {
    test('requires energy', () => {
      const result = TodoistGetTasksByEnergySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('TodoistGetTasksByRoleSchema', () => {
    test('requires positive role_id', () => {
      expect(TodoistGetTasksByRoleSchema.safeParse({ role_id: 1 }).success).toBe(true);
      expect(TodoistGetTasksByRoleSchema.safeParse({ role_id: 0 }).success).toBe(false);
    });
  });
});
