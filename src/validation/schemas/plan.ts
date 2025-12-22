/**
 * Plan Validation Schemas
 *
 * Zod schemas for daily plan operations including events, focus items,
 * next steps, parked ideas, and notes.
 */
import { z } from 'zod';
import { ISODateSchema } from './common';

/**
 * Plan event schema for calendar items.
 * Time must be in HH:mm format (24-hour).
 */
export const PlanEventSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  title: z.string().min(1, 'Title cannot be empty'),
});

/**
 * Schema for creating a daily plan.
 *
 * Required fields: date (YYYY-MM-DD)
 * Optional fields: events, focus, next_steps, parked, notes
 * Defaults: All arrays default to [], notes defaults to ''
 */
export const CreateDailyPlanInputSchema = z.object({
  date: ISODateSchema,
  events: z.array(PlanEventSchema).optional().default([]),
  focus: z.array(z.string()).optional().default([]),
  next_steps: z.array(z.string()).optional().default([]),
  parked: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
});
