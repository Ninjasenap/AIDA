/**
 * Daily Plan File Management
 *
 * Manages the single PLAN.md file in 0-JOURNAL/.
 * This file is overwritten each morning and cleared each evening after archiving to the daily log.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadTemplate, renderTemplate, formatSwedishDate } from './templates.js';
import { getPlanFilePath, getJournalDir } from './paths';

/**
 * Paths to plan file and journal directory
 */
const PLAN_FILE_PATH = getPlanFilePath();
const JOURNAL_DIR = getJournalDir();

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
 * Ensure the journal directory exists
 */
function ensureJournalDir(): void {
  if (!existsSync(JOURNAL_DIR)) {
    mkdirSync(JOURNAL_DIR, { recursive: true });
  }
}

/**
 * Get the path to the PLAN.md file
 * @returns Full path to the plan file
 */
export function getPlanPath(): string {
  return PLAN_FILE_PATH;
}

/**
 * Check if the plan file has content
 * @returns True if plan file exists and has content
 */
export function planHasContent(): boolean {
  if (!existsSync(PLAN_FILE_PATH)) return false;
  const content = readFileSync(PLAN_FILE_PATH, 'utf-8');
  return content.trim().length > 0;
}

/**
 * Create/overwrite the daily plan file
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
  writeFileSync(PLAN_FILE_PATH, markdown, 'utf-8');

  return PLAN_FILE_PATH;
}

/**
 * Read the daily plan file
 * @returns Daily plan content as string, or null if file doesn't exist
 */
export function readDailyPlan(): string | null {
  if (!existsSync(PLAN_FILE_PATH)) {
    return null;
  }

  return readFileSync(PLAN_FILE_PATH, 'utf-8');
}

/**
 * Parse plan markdown to extract focus and events
 * @param content - Markdown content
 * @returns Parsed focus items and calendar events
 */
export function parsePlanMarkdown(content: string): { focus: string[], events: PlanEvent[] } {
  const focus: string[] = [];
  const events: PlanEvent[] = [];

  const lines = content.split('\n');
  let inFocusSection = false;
  let inCalendarSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check section headers
    if (trimmed === '## Fokus för dagen') {
      inFocusSection = true;
      inCalendarSection = false;
      continue;
    } else if (trimmed === '## Dagens events' || trimmed === '## Dagens kalender') {
      inCalendarSection = true;
      inFocusSection = false;
      continue;
    } else if (trimmed.startsWith('## ')) {
      // Other section, stop parsing
      inFocusSection = false;
      inCalendarSection = false;
      continue;
    }

    // Parse focus items (numbered list)
    if (inFocusSection && /^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s+/, '');
      if (text) focus.push(text);
    }

    // Parse calendar events (bulleted list with time)
    if (inCalendarSection && trimmed.startsWith('- ')) {
      const match = trimmed.match(/^-\s+(\d{2}:\d{2})\s+(.+)$/);
      if (match) {
        events.push({ time: match[1], title: match[2] });
      }
    }
  }

  return { focus, events };
}

/**
 * Clear the plan file (keep file but remove content)
 */
export function clearPlan(): void {
  ensureJournalDir();
  writeFileSync(PLAN_FILE_PATH, '', 'utf-8');
}

/**
 * Archive plan to daily log and clear plan file
 * @param date - Date in YYYY-MM-DD format
 * @returns Path to the updated log file
 */
export function archivePlanToLog(date: string): string {
  // Read plan content
  const planContent = readDailyPlan();
  if (!planContent || planContent.trim().length === 0) {
    throw new Error('No plan content to archive');
  }

  // Parse focus and events from plan
  const { focus, events } = parsePlanMarkdown(planContent);

  // Import regenerateJournalMarkdownWithPlan dynamically to avoid circular dependency
  const { regenerateJournalMarkdownWithPlan } = require('./journal-markdown.js');

  // Regenerate journal with plan data
  const logPath = regenerateJournalMarkdownWithPlan(date, focus, events);

  // Clear plan file
  clearPlan();

  return logPath;
}
