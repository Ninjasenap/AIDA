/**
 * Task Validation Schemas
 *
 * Zod schemas for all task-related operations including creation, updates,
 * status changes, and query filters. All schemas derive from common schemas
 * and existing TypeScript types to maintain consistency.
 */
import { z } from 'zod';
import {
  TaskStatusSchema,
  EnergyRequirementSchema,
  PositiveIntSchema,
  ISODateSchema,
  PrioritySchema,
} from './common';

/**
 * Schema for creating new tasks.
 *
 * Required fields: title, role_id
 * Optional fields: All other task properties with appropriate defaults
 * Defaults: status='captured', priority=0
 */
export const CreateTaskInputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  role_id: PositiveIntSchema,
  notes: z.string().nullable().optional(),
  status: TaskStatusSchema.optional().default('captured'),
  priority: PrioritySchema.optional().default(0),
  energy_requirement: EnergyRequirementSchema.optional(),
  time_estimate: z.number().int().positive().nullable().optional(),
  project_id: PositiveIntSchema.nullable().optional(),
  parent_task_id: PositiveIntSchema.nullable().optional(),
  start_date: ISODateSchema.nullable().optional(),
  deadline: ISODateSchema.nullable().optional(),
  remind_date: ISODateSchema.nullable().optional(),
});

/**
 * Schema for updating existing tasks.
 *
 * Required fields: id
 * Optional fields: Any task property can be updated
 * Allows null values to clear optional fields
 */
export const UpdateTaskInputSchema = z.object({
  id: PositiveIntSchema,
  title: z.string().min(1, 'Title cannot be empty').optional(),
  notes: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  energy_requirement: EnergyRequirementSchema.nullable().optional(),
  time_estimate: z.number().int().positive().nullable().optional(),
  project_id: PositiveIntSchema.nullable().optional(),
  role_id: PositiveIntSchema.optional(),
  parent_task_id: PositiveIntSchema.nullable().optional(),
  start_date: ISODateSchema.nullable().optional(),
  deadline: ISODateSchema.nullable().optional(),
  remind_date: ISODateSchema.nullable().optional(),
});

/**
 * Schema for setting task status.
 *
 * Used for status changes that may trigger journal entry creation.
 * Comment is optional and only used for done/cancelled statuses.
 */
export const SetTaskStatusInputSchema = z.object({
  id: PositiveIntSchema,
  status: TaskStatusSchema,
  comment: z.string().optional(),
});

/**
 * Schema for searching tasks by title.
 *
 * Query must be non-empty string.
 * Defaults: includeDone=false (excludes done and cancelled tasks)
 */
export const SearchTasksInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  includeDone: z.boolean().optional().default(false),
});

/**
 * Schema for retrieving tasks by role.
 *
 * Filters tasks by role ID with optional inclusion of completed tasks.
 * Defaults: includeDone=false
 */
export const GetTasksByRoleInputSchema = z.object({
  roleId: PositiveIntSchema,
  includeDone: z.boolean().optional().default(false),
});

/**
 * Schema for retrieving tasks within a week range.
 *
 * Both dates are required and must be in ISO format (YYYY-MM-DD).
 * Typically weekStart=Monday, weekEnd=Sunday.
 */
export const GetWeekTasksInputSchema = z.object({
  weekStart: ISODateSchema,
  weekEnd: ISODateSchema,
});

/**
 * Schema for retrieving stale tasks.
 *
 * Both thresholds are optional - function will use view defaults if not provided.
 * Defaults: capturedDays=28, readyDays=14 (handled in query function)
 */
export const GetStaleTasksInputSchema = z.object({
  capturedDays: z.number().int().nonnegative().optional(),
  readyDays: z.number().int().nonnegative().optional(),
});

/**
 * Schema for retrieving tasks with subtasks.
 *
 * Optional filters by role and/or project.
 * If no filters provided, returns all parent tasks.
 */
export const GetTasksWithSubtasksInputSchema = z.object({
  roleId: PositiveIntSchema.optional(),
  projectId: PositiveIntSchema.optional(),
});
