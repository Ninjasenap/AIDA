/**
 * Role Validation Schemas
 *
 * Zod schemas for all role-related operations including creation, updates,
 * status changes, and query filters. All schemas derive from common schemas
 * and existing TypeScript types to maintain consistency.
 */
import { z } from 'zod';
import { PositiveIntSchema } from './common';
import { ROLE_TYPE_SYMBOLS, ROLE_STATUS_SYMBOLS } from '../../utilities/symbols';

/**
 * Role type enum derived from existing symbols (single source of truth)
 */
export const RoleTypeSchema = z.enum(
	Object.keys(ROLE_TYPE_SYMBOLS) as [string, ...string[]],
);

/**
 * Role status enum derived from existing symbols (single source of truth)
 */
export const RoleStatusSchema = z.enum(
	Object.keys(ROLE_STATUS_SYMBOLS) as [string, ...string[]],
);

/**
 * Schema for creating new roles.
 *
 * Required fields: name, type
 * Optional fields: description, responsibilities, balance_target
 * Defaults: status='active' (handled in database)
 */
export const CreateRoleInputSchema = z.object({
	name: z.string().min(1, 'Name cannot be empty'),
	type: RoleTypeSchema,
	description: z.string().optional(),
	responsibilities: z.array(z.string()).optional(),
	balance_target: z.number().min(0).max(1).optional(),
});

/**
 * Schema for updating existing roles.
 *
 * Required fields: id
 * Optional fields: name, description, responsibilities, balance_target
 * Allows partial updates - only provided fields are updated
 */
export const UpdateRoleInputSchema = z.object({
	id: PositiveIntSchema,
	name: z.string().min(1, 'Name cannot be empty').optional(),
	description: z.string().optional(),
	responsibilities: z.array(z.string()).optional(),
	balance_target: z.number().min(0).max(1).optional(),
});

/**
 * Schema for setting role status.
 *
 * Used for status changes that may trigger linked task warnings.
 */
export const SetRoleStatusInputSchema = z.object({
	id: PositiveIntSchema,
	status: RoleStatusSchema,
});

/**
 * Schema for retrieving roles by type.
 *
 * Filters roles by type with optional inclusion of inactive roles.
 * Defaults: includeInactive=false (excludes inactive and historical roles)
 */
export const GetRolesByTypeInputSchema = z.object({
	type: RoleTypeSchema,
	includeInactive: z.boolean().optional().default(false),
});
