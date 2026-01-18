/**
 * Journal Validation Schemas
 *
 * Zod schemas for all journal-related operations including entry creation
 * and query filters. Uses soft validation approach where entry-specific
 * fields are optional across all entry types.
 */
import { z } from 'zod';
import { PositiveIntSchema, ISODateSchema, ISODateTimeSchema } from './common';
import { ENTRY_TYPE_SYMBOLS } from '../../utilities/symbols';

/**
 * Entry type enum derived from existing symbols (single source of truth)
 */
export const EntryTypeSchema = z.enum(
	Object.keys(ENTRY_TYPE_SYMBOLS) as [string, ...string[]],
);

/**
 * Schema for creating journal entries.
 *
 * Required fields: entry_type, content
 * Optional fields: timestamp, related_task_id, related_project_id, related_role_id
 *
 * Soft validation approach: All entry-specific fields are optional,
 * allowing flexibility in what data is provided for each entry type.
 */
export const CreateEntryInputSchema = z.object({
	entry_type: EntryTypeSchema,
	content: z.string().min(1, 'Content cannot be empty'),
	timestamp: ISODateTimeSchema.optional(),
	todoist_task_id: z.string().optional(),
	related_task_id: PositiveIntSchema.optional(),
	related_project_id: PositiveIntSchema.optional(),
	related_role_id: PositiveIntSchema.optional(),
});

/**
 * Schema for retrieving entries by type.
 *
 * Required fields: type
 * Optional fields: startDate, endDate (for filtering by date range)
 */
export const GetEntriesByTypeInputSchema = z.object({
	type: EntryTypeSchema,
	startDate: ISODateSchema.optional(),
	endDate: ISODateSchema.optional(),
});

/**
 * Schema for retrieving entries by date range.
 *
 * Both startDate and endDate are required for range queries.
 */
export const GetEntriesByDateRangeInputSchema = z.object({
	startDate: ISODateSchema,
	endDate: ISODateSchema,
});
