/**
 * Common Validation Schemas
 *
 * Shared Zod schemas used across all modules, derived from existing symbol
 * constants to maintain single source of truth.
 */
import { z } from 'zod';
import {
  TASK_STATUS_SYMBOLS,
  PROJECT_STATUS_SYMBOLS,
  ROLE_STATUS_SYMBOLS,
  ROLE_TYPE_SYMBOLS,
  ENTRY_TYPE_SYMBOLS,
} from '../../utilities/symbols';

// Derive enum schemas from existing symbol constants (single source of truth)
export const TaskStatusSchema = z.enum(
  Object.keys(TASK_STATUS_SYMBOLS) as [string, ...string[]]
);

export const ProjectStatusSchema = z.enum(
  Object.keys(PROJECT_STATUS_SYMBOLS) as [string, ...string[]]
);

export const RoleStatusSchema = z.enum(
  Object.keys(ROLE_STATUS_SYMBOLS) as [string, ...string[]]
);

export const RoleTypeSchema = z.enum(
  Object.keys(ROLE_TYPE_SYMBOLS) as [string, ...string[]]
);

export const EntryTypeSchema = z.enum(
  Object.keys(ENTRY_TYPE_SYMBOLS) as [string, ...string[]]
);

// Common field schemas
export const EnergyRequirementSchema = z.enum(['low', 'medium', 'high']);

export const PositiveIntSchema = z.number().int().positive('Must be a positive integer');

export const ISODateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Expected format: YYYY-MM-DD'
);

export const ISODateTimeSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/,
  'Expected format: YYYY-MM-DDTHH:MM or YYYY-MM-DD HH:MM'
);

export const PrioritySchema = z.number().int().min(0).max(10);
