/**
 * Todoist Tagging Schemas
 */

import { z } from 'zod';

export const TodoistTagTaskSchema = z.object({
  taskId: z.union([z.string(), z.number()]),
  label: z.string().min(1, 'Label cannot be empty'),
});
