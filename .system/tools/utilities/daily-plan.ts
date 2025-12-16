/**
 * Daily Plan File Management
 *
 * Manages temporary daily plan files (YYYY-MM-DD-plan.md).
 * These files are created in the morning, updated during the day, and deleted in the evening.
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadTemplate, renderTemplate, formatSwedishDate } from './templates.js';

/**
 * Path to the daily journals directory (where plans are also stored)
 * Resolves correctly whether run from project root or .system directory
 */
const DAILY_JOURNAL_DIR = (() => {
  const cwd = process.cwd();
  // If already in .system directory, go up one level
  if (cwd.endsWith('.system')) {
    return join(cwd, '..', '0-JOURNAL', '1-DAILY');
  }
  // Otherwise, assume we're at project root
  return join(cwd, '0-JOURNAL', '1-DAILY');
})();

/**
 * Event item for the daily plan
 */
export interface PlanEvent {
  time: string;
  title: string;
}

/**
 * Daily plan structure
 */
export interface DailyPlan {
  date: string; // YYYY-MM-DD
  events: PlanEvent[];
  focus: string[];
  next_steps: string[];
  parked: string[];
  notes: string;
}

/**
 * Ensure the daily journal directory exists
 */
function ensureJournalDir(): void {
  if (!existsSync(DAILY_JOURNAL_DIR)) {
    mkdirSync(DAILY_JOURNAL_DIR, { recursive: true });
  }
}

/**
 * Get the path to a daily plan file
 * @param date - Date in YYYY-MM-DD format
 * @returns Full path to the plan file
 */
export function getDailyPlanPath(date: string): string {
  return join(DAILY_JOURNAL_DIR, `${date}-plan.md`);
}

/**
 * Check if a daily plan exists
 * @param date - Date in YYYY-MM-DD format
 * @returns True if plan file exists
 */
export function dailyPlanExists(date: string): boolean {
  return existsSync(getDailyPlanPath(date));
}

/**
 * Create a daily plan file
 * @param plan - Daily plan data
 * @returns Path to the created file
 */
export function createDailyPlan(plan: DailyPlan): string {
  ensureJournalDir();

  // Parse date for Swedish formatting
  const dateObj = new Date(plan.date);
  const dateParts = formatSwedishDate(dateObj);

  // Prepare template data
  const templateData = {
    weekday_lowercase: dateParts.weekday_lowercase,
    day: dateParts.day,
    month_name: dateParts.month_name,
    events: plan.events,
    focus: plan.focus.map((item, index) => ({
      index: index + 1,
      title: item
    })),
    next_steps: plan.next_steps.map(step => ({ step })),
    parked: plan.parked.map(item => ({ item })),
    notes: plan.notes || '_Inga anteckningar än_'
  };

  // Load and render template
  const template = loadTemplate('daily-plan');
  const markdown = renderTemplate(template, templateData);

  // Write to file
  const filePath = getDailyPlanPath(plan.date);
  writeFileSync(filePath, markdown, 'utf-8');

  return filePath;
}

/**
 * Read a daily plan file
 * @param date - Date in YYYY-MM-DD format
 * @returns Daily plan data or null if file doesn't exist
 */
export function readDailyPlan(date: string): DailyPlan | null {
  const filePath = getDailyPlanPath(date);

  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');

  // Parse markdown back to structure
  // For simplicity, we'll return a basic structure
  // In a full implementation, we'd parse the markdown properly
  return {
    date,
    events: [],
    focus: [],
    next_steps: [],
    parked: [],
    notes: content
  };
}

/**
 * Update a daily plan file
 * @param date - Date in YYYY-MM-DD format
 * @param updates - Partial plan data to update
 * @returns Path to the updated file, or null if plan doesn't exist
 */
export function updateDailyPlan(date: string, updates: Partial<Omit<DailyPlan, 'date'>>): string | null {
  const existing = readDailyPlan(date);

  if (!existing) {
    return null;
  }

  // Merge updates with existing plan
  const updated: DailyPlan = {
    date,
    events: updates.events ?? existing.events,
    focus: updates.focus ?? existing.focus,
    next_steps: updates.next_steps ?? existing.next_steps,
    parked: updates.parked ?? existing.parked,
    notes: updates.notes ?? existing.notes
  };

  return createDailyPlan(updated);
}

/**
 * Delete a daily plan file
 * @param date - Date in YYYY-MM-DD format
 * @returns True if file was deleted, false if it didn't exist
 */
export function deleteDailyPlan(date: string): boolean {
  const filePath = getDailyPlanPath(date);

  if (!existsSync(filePath)) {
    return false;
  }

  unlinkSync(filePath);
  return true;
}

/**
 * Append a note to the daily plan
 * @param date - Date in YYYY-MM-DD format
 * @param note - Note to append
 * @returns Path to the updated file, or null if plan doesn't exist
 */
export function appendNoteToPlan(date: string, note: string): string | null {
  const filePath = getDailyPlanPath(date);

  if (!existsSync(filePath)) {
    return null;
  }

  const existing = readFileSync(filePath, 'utf-8');
  const updated = existing + `\n${note}`;

  writeFileSync(filePath, updated, 'utf-8');
  return filePath;
}
