/**
 * Task Validation Schema Tests
 *
 * Tests for all task-related Zod validation schemas.
 * Validates input schemas for task creation, updates, and queries.
 */
import { describe, expect, test } from 'bun:test';
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  SetTaskStatusInputSchema,
  SearchTasksInputSchema,
  GetTasksByRoleInputSchema,
  GetWeekTasksInputSchema,
  GetStaleTasksInputSchema,
  GetTasksWithSubtasksInputSchema,
} from '../schemas/tasks';

describe('Task Schemas', () => {
  describe('CreateTaskInputSchema', () => {
    test('accepts valid minimal input', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test Task',
        role_id: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Task');
        expect(result.data.role_id).toBe(1);
        expect(result.data.status).toBe('captured'); // default
        expect(result.data.priority).toBe(0); // default
      }
    });

    test('accepts all optional fields', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Full Task',
        role_id: 2,
        notes: 'Test notes',
        status: 'ready',
        priority: 3,
        energy_requirement: 'high',
        time_estimate: 60,
        project_id: 5,
        parent_task_id: 10,
        start_date: '2025-12-20',
        deadline: '2025-12-25',
        remind_date: '2025-12-24',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.energy_requirement).toBe('high');
        expect(result.data.time_estimate).toBe(60);
        expect(result.data.deadline).toBe('2025-12-25');
      }
    });

    test('rejects missing title', () => {
      const result = CreateTaskInputSchema.safeParse({ role_id: 1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('title');
      }
    });

    test('rejects missing role_id', () => {
      const result = CreateTaskInputSchema.safeParse({ title: 'Test' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('role_id');
      }
    });

    test('rejects invalid role_id type', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test',
        role_id: 'abc',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid status', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test',
        role_id: 1,
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid energy_requirement', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test',
        role_id: 1,
        energy_requirement: 'extreme',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid date format', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test',
        role_id: 1,
        deadline: '25-12-2025',
      });

      expect(result.success).toBe(false);
    });

    test('rejects negative priority', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test',
        role_id: 1,
        priority: -1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects priority above 10', () => {
      const result = CreateTaskInputSchema.safeParse({
        title: 'Test',
        role_id: 1,
        priority: 11,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTaskInputSchema', () => {
    test('accepts valid update with id and fields', () => {
      const result = UpdateTaskInputSchema.safeParse({
        id: 1,
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.title).toBe('Updated Title');
      }
    });

    test('accepts multiple fields', () => {
      const result = UpdateTaskInputSchema.safeParse({
        id: 1,
        title: 'New Title',
        notes: 'New notes',
        priority: 5,
      });

      expect(result.success).toBe(true);
    });

    test('accepts null for optional fields', () => {
      const result = UpdateTaskInputSchema.safeParse({
        id: 1,
        notes: null,
        time_estimate: null,
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = UpdateTaskInputSchema.safeParse({ title: 'Test' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('id');
      }
    });

    test('rejects invalid id type', () => {
      const result = UpdateTaskInputSchema.safeParse({
        id: 'abc',
        title: 'Test',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid status', () => {
      const result = UpdateTaskInputSchema.safeParse({
        id: 1,
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('SetTaskStatusInputSchema', () => {
    test('accepts valid status change', () => {
      const result = SetTaskStatusInputSchema.safeParse({
        id: 1,
        status: 'done',
      });

      expect(result.success).toBe(true);
    });

    test('accepts status with comment', () => {
      const result = SetTaskStatusInputSchema.safeParse({
        id: 1,
        status: 'done',
        comment: 'Finished successfully',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).toBe('Finished successfully');
      }
    });

    test('rejects missing id', () => {
      const result = SetTaskStatusInputSchema.safeParse({ status: 'done' });

      expect(result.success).toBe(false);
    });

    test('rejects missing status', () => {
      const result = SetTaskStatusInputSchema.safeParse({ id: 1 });

      expect(result.success).toBe(false);
    });

    test('rejects invalid status', () => {
      const result = SetTaskStatusInputSchema.safeParse({
        id: 1,
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('SearchTasksInputSchema', () => {
    test('accepts valid search query', () => {
      const result = SearchTasksInputSchema.safeParse({
        query: 'test',
      });

      expect(result.success).toBe(true);
    });

    test('accepts query with includeDone', () => {
      const result = SearchTasksInputSchema.safeParse({
        query: 'test',
        includeDone: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeDone).toBe(true);
      }
    });

    test('defaults includeDone to false', () => {
      const result = SearchTasksInputSchema.safeParse({
        query: 'test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeDone).toBe(false);
      }
    });

    test('rejects missing query', () => {
      const result = SearchTasksInputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('rejects empty query string', () => {
      const result = SearchTasksInputSchema.safeParse({ query: '' });

      expect(result.success).toBe(false);
    });
  });

  describe('GetTasksByRoleInputSchema', () => {
    test('accepts valid roleId', () => {
      const result = GetTasksByRoleInputSchema.safeParse({
        roleId: 1,
      });

      expect(result.success).toBe(true);
    });

    test('accepts roleId with includeDone', () => {
      const result = GetTasksByRoleInputSchema.safeParse({
        roleId: 2,
        includeDone: true,
      });

      expect(result.success).toBe(true);
    });

    test('defaults includeDone to false', () => {
      const result = GetTasksByRoleInputSchema.safeParse({
        roleId: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeDone).toBe(false);
      }
    });

    test('rejects missing roleId', () => {
      const result = GetTasksByRoleInputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('rejects invalid roleId type', () => {
      const result = GetTasksByRoleInputSchema.safeParse({ roleId: 'abc' });

      expect(result.success).toBe(false);
    });
  });

  describe('GetWeekTasksInputSchema', () => {
    test('accepts valid week range', () => {
      const result = GetWeekTasksInputSchema.safeParse({
        weekStart: '2025-12-08',
        weekEnd: '2025-12-14',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing weekStart', () => {
      const result = GetWeekTasksInputSchema.safeParse({
        weekEnd: '2025-12-14',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing weekEnd', () => {
      const result = GetWeekTasksInputSchema.safeParse({
        weekStart: '2025-12-08',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid date format', () => {
      const result = GetWeekTasksInputSchema.safeParse({
        weekStart: '08-12-2025',
        weekEnd: '14-12-2025',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('GetStaleTasksInputSchema', () => {
    test('accepts no arguments', () => {
      const result = GetStaleTasksInputSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    test('accepts custom capturedDays', () => {
      const result = GetStaleTasksInputSchema.safeParse({
        capturedDays: 14,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capturedDays).toBe(14);
      }
    });

    test('accepts custom readyDays', () => {
      const result = GetStaleTasksInputSchema.safeParse({
        readyDays: 7,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.readyDays).toBe(7);
      }
    });

    test('accepts both custom thresholds', () => {
      const result = GetStaleTasksInputSchema.safeParse({
        capturedDays: 21,
        readyDays: 10,
      });

      expect(result.success).toBe(true);
    });

    test('rejects negative capturedDays', () => {
      const result = GetStaleTasksInputSchema.safeParse({
        capturedDays: -5,
      });

      expect(result.success).toBe(false);
    });

    test('rejects negative readyDays', () => {
      const result = GetStaleTasksInputSchema.safeParse({
        readyDays: -3,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('GetTasksWithSubtasksInputSchema', () => {
    test('accepts no arguments', () => {
      const result = GetTasksWithSubtasksInputSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    test('accepts roleId filter', () => {
      const result = GetTasksWithSubtasksInputSchema.safeParse({
        roleId: 1,
      });

      expect(result.success).toBe(true);
    });

    test('accepts projectId filter', () => {
      const result = GetTasksWithSubtasksInputSchema.safeParse({
        projectId: 2,
      });

      expect(result.success).toBe(true);
    });

    test('accepts both filters', () => {
      const result = GetTasksWithSubtasksInputSchema.safeParse({
        roleId: 1,
        projectId: 2,
      });

      expect(result.success).toBe(true);
    });

    test('rejects invalid roleId type', () => {
      const result = GetTasksWithSubtasksInputSchema.safeParse({
        roleId: 'abc',
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid projectId type', () => {
      const result = GetTasksWithSubtasksInputSchema.safeParse({
        projectId: 'xyz',
      });

      expect(result.success).toBe(false);
    });
  });
});
