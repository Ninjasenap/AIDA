/**
 * Todoist Task Validation Schemas
 */

import { z } from 'zod';
import { PositiveIntSchema } from './common';

export const EnergyLevelSchema = z.enum(['low', 'medium', 'high']);

export const TodoistCreateTaskInputSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  description: z.string().optional(),
  role_id: PositiveIntSchema.optional(),
  project_id: PositiveIntSchema.optional(),
  energy: EnergyLevelSchema.optional(),
  due_string: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  contexts: z.array(z.string()).optional(),
});

export const TodoistUpdateTaskInputSchema = z.object({
  taskId: z.union([z.string(), z.number()]),
  content: z.string().optional(),
  description: z.string().optional(),
  role_id: PositiveIntSchema.optional(),
  project_id: PositiveIntSchema.optional(),
  energy: EnergyLevelSchema.optional(),
  due_string: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  contexts: z.array(z.string()).optional(),
});

export const TodoistGetTasksFilterSchema = z.object({
  role_id: PositiveIntSchema.optional(),
  project_id: PositiveIntSchema.optional(),
  energy: EnergyLevelSchema.optional(),
  due: z.enum(['today', 'overdue', 'tomorrow', 'week']).optional(),
});

export const TodoistGetTasksByEnergySchema = z.object({
  energy: EnergyLevelSchema,
});

export const TodoistGetTasksByRoleSchema = z.object({
  role_id: PositiveIntSchema,
});
