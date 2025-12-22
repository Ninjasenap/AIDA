/**
 * Project Validation Schema Tests
 *
 * Tests for project validation schemas including create, update, status, and query operations.
 */
import { describe, expect, test } from 'bun:test';
import {
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
  SetProjectStatusInputSchema,
  UpdateFinishCriteriaInputSchema,
  SearchProjectsInputSchema,
} from '../schemas/projects';

describe('Project Schemas', () => {
  describe('CreateProjectInputSchema', () => {
    test('accepts valid minimal input', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Test Project',
        role_id: 1,
        description: 'A test project',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
        expect(result.data.role_id).toBe(1);
        expect(result.data.description).toBe('A test project');
      }
    });

    test('accepts project with finish_criteria', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Project with criteria',
        role_id: 2,
        description: 'Description',
        finish_criteria: [
          { criterion: 'Step 1', done: false },
          { criterion: 'Step 2', done: true },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.finish_criteria).toHaveLength(2);
      }
    });

    test('rejects missing name', () => {
      const result = CreateProjectInputSchema.safeParse({
        role_id: 1,
        description: 'Missing name',
      });

      expect(result.success).toBe(false);
    });

    test('rejects empty name', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: '',
        role_id: 1,
        description: 'Test',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing role_id', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Test',
        description: 'Test',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing description', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Test',
        role_id: 1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid finish_criteria format', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Test',
        role_id: 1,
        description: 'Test',
        finish_criteria: 'not an array',
      });

      expect(result.success).toBe(false);
    });

    test('rejects finish_criteria with missing criterion', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Test',
        role_id: 1,
        description: 'Test',
        finish_criteria: [{ done: false }],
      });

      expect(result.success).toBe(false);
    });

    test('rejects finish_criteria with missing done', () => {
      const result = CreateProjectInputSchema.safeParse({
        name: 'Test',
        role_id: 1,
        description: 'Test',
        finish_criteria: [{ criterion: 'Step 1' }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateProjectInputSchema', () => {
    test('accepts update with id only', () => {
      const result = UpdateProjectInputSchema.safeParse({
        id: 1,
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with name', () => {
      const result = UpdateProjectInputSchema.safeParse({
        id: 1,
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with description', () => {
      const result = UpdateProjectInputSchema.safeParse({
        id: 1,
        description: 'Updated description',
      });

      expect(result.success).toBe(true);
    });

    test('accepts update with both name and description', () => {
      const result = UpdateProjectInputSchema.safeParse({
        id: 1,
        name: 'New Name',
        description: 'New description',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = UpdateProjectInputSchema.safeParse({
        name: 'Test',
      });

      expect(result.success).toBe(false);
    });

    test('rejects empty name', () => {
      const result = UpdateProjectInputSchema.safeParse({
        id: 1,
        name: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('SetProjectStatusInputSchema', () => {
    test('accepts valid status change to active', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        id: 1,
        status: 'active',
      });

      expect(result.success).toBe(true);
    });

    test('accepts valid status change to on_hold', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        id: 1,
        status: 'on_hold',
      });

      expect(result.success).toBe(true);
    });

    test('accepts valid status change to completed', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        id: 1,
        status: 'completed',
      });

      expect(result.success).toBe(true);
    });

    test('accepts valid status change to cancelled', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        id: 1,
        status: 'cancelled',
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        status: 'active',
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing status', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        id: 1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects invalid status', () => {
      const result = SetProjectStatusInputSchema.safeParse({
        id: 1,
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateFinishCriteriaInputSchema', () => {
    test('accepts valid criteria update', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        id: 1,
        criteria: [
          { criterion: 'Step 1', done: true },
          { criterion: 'Step 2', done: false },
        ],
      });

      expect(result.success).toBe(true);
    });

    test('accepts empty criteria array', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        id: 1,
        criteria: [],
      });

      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        criteria: [{ criterion: 'Test', done: false }],
      });

      expect(result.success).toBe(false);
    });

    test('rejects missing criteria', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        id: 1,
      });

      expect(result.success).toBe(false);
    });

    test('rejects non-array criteria', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        id: 1,
        criteria: 'not an array',
      });

      expect(result.success).toBe(false);
    });

    test('rejects criterion missing criterion field', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        id: 1,
        criteria: [{ done: false }],
      });

      expect(result.success).toBe(false);
    });

    test('rejects criterion missing done field', () => {
      const result = UpdateFinishCriteriaInputSchema.safeParse({
        id: 1,
        criteria: [{ criterion: 'Test' }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('SearchProjectsInputSchema', () => {
    test('accepts valid search query', () => {
      const result = SearchProjectsInputSchema.safeParse({
        query: 'test',
      });

      expect(result.success).toBe(true);
    });

    test('accepts search with includeCompleted false', () => {
      const result = SearchProjectsInputSchema.safeParse({
        query: 'test',
        includeCompleted: false,
      });

      expect(result.success).toBe(true);
    });

    test('accepts search with includeCompleted true', () => {
      const result = SearchProjectsInputSchema.safeParse({
        query: 'test',
        includeCompleted: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeCompleted).toBe(true);
      }
    });

    test('applies default includeCompleted false', () => {
      const result = SearchProjectsInputSchema.safeParse({
        query: 'test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeCompleted).toBe(false);
      }
    });

    test('rejects missing query', () => {
      const result = SearchProjectsInputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    test('rejects empty query', () => {
      const result = SearchProjectsInputSchema.safeParse({
        query: '',
      });

      expect(result.success).toBe(false);
    });
  });
});
