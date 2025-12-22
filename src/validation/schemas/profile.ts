/**
 * Profile Validation Schemas
 *
 * Zod schemas for profile management operations including attribute updates
 * and learning observations.
 */
import { z } from 'zod';

/**
 * Change source enum for profile updates
 */
export const ChangeSourceSchema = z.enum([
  'user',
  'auto_learn',
  'setup_wizard',
  'import',
]);

/**
 * Observation category enum for learning patterns
 */
export const ObservationCategorySchema = z.enum([
  'energy',
  'time_preference',
  'role_focus',
  'task_completion',
  'work_style',
  'communication',
  'other',
]);

/**
 * Observation status enum
 */
export const ObservationStatusSchema = z.enum([
  'active',
  'applied',
  'dismissed',
]);

/**
 * Schema for updating a profile attribute.
 *
 * Required fields: path (dot notation), value, source
 * Optional fields: reason
 */
export const UpdateAttributeInputSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  value: z.unknown(), // Accept any JSON value (null, undefined, object, array, primitive)
  source: ChangeSourceSchema,
  reason: z.string().optional(),
});

/**
 * Schema for suggested profile updates within observations
 */
const SuggestedUpdateSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  value: z.unknown(),
  rationale: z.string().min(1, 'Rationale cannot be empty'),
});

/**
 * Schema for adding a learning observation.
 *
 * Required fields: category, pattern, confidence (0-1), status
 * Optional fields: evidence (array of strings), suggested_update
 * Defaults: evidence defaults to []
 */
export const AddObservationInputSchema = z.object({
  category: ObservationCategorySchema,
  pattern: z.string().min(1, 'Pattern description cannot be empty'),
  confidence: z.number().min(0, 'Confidence must be >= 0').max(1, 'Confidence must be <= 1'),
  evidence: z.array(z.string()).optional().default([]),
  suggested_update: SuggestedUpdateSchema.optional(),
  status: ObservationStatusSchema,
});
