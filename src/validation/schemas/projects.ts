/**
 * Project Validation Schemas
 *
 * Zod schemas for all project-related operations including creation, updates,
 * status changes, criteria management, and search. All schemas derive from
 * common schemas and existing TypeScript types to maintain consistency.
 */
import { z } from 'zod';
import { PositiveIntSchema } from './common';
import { PROJECT_STATUS_SYMBOLS } from '../../utilities/symbols';

/**
 * Project status enum derived from existing symbols (single source of truth)
 */
export const ProjectStatusSchema = z.enum(
	Object.keys(PROJECT_STATUS_SYMBOLS) as [string, ...string[]],
);

/**
 * Finish criterion schema for project completion criteria
 */
export const FinishCriterionSchema = z.object({
	criterion: z.string().min(1, 'Criterion cannot be empty'),
	done: z.boolean(),
});

/**
 * Schema for creating new projects.
 *
 * Required fields: name, role_id, description
 * Optional fields: finish_criteria
 * Defaults: status='active' (handled in database)
 */
export const CreateProjectInputSchema = z.object({
	name: z.string().min(1, 'Name cannot be empty'),
	role_id: PositiveIntSchema,
	description: z.string(),
	todoist_project_id: z.string().optional(),
	finish_criteria: z.array(FinishCriterionSchema).optional(),
});

/**
 * Schema for updating existing projects.
 *
 * Required fields: id
 * Optional fields: name, description
 * Allows partial updates - only provided fields are updated
 */
export const UpdateProjectInputSchema = z.object({
	id: PositiveIntSchema,
	name: z.string().min(1, 'Name cannot be empty').optional(),
	description: z.string().optional(),
	todoist_project_id: z.string().optional(),
});

/**
 * Schema for setting project status.
 *
 * Used for status transitions between active, on_hold, completed, and cancelled.
 */
export const SetProjectStatusInputSchema = z.object({
	id: PositiveIntSchema,
	status: ProjectStatusSchema,
});

/**
 * Schema for updating finish criteria.
 *
 * Replaces the entire finish_criteria array for a project.
 */
export const UpdateFinishCriteriaInputSchema = z.object({
	id: PositiveIntSchema,
	criteria: z.array(FinishCriterionSchema),
});

/**
 * Schema for searching projects by name.
 *
 * Query must be non-empty string.
 * Defaults: includeCompleted=false (excludes completed and cancelled projects)
 */
export const SearchProjectsInputSchema = z.object({
	query: z.string().min(1, 'Search query cannot be empty'),
	includeCompleted: z.boolean().optional().default(false),
});
