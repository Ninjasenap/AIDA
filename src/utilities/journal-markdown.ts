/**
 * Journal Markdown Generation
 *
 * Generates daily journal log files (YYYY-MM-DD.md) from database journal_entries.
 * Database is source of truth; markdown files are generated views for human readability.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { JournalEntryFull } from '../database/types';
import { getEntriesByDateRange } from '../database/queries/journal.js';
import { getEntryTypeSymbol } from './symbols.js';
import { loadTemplate, renderTemplate, formatSwedishDate } from './templates.js';
import { getDailyJournalDir } from './paths';

/**
 * Path to the daily journals directory
 */
const DAILY_JOURNAL_DIR = getDailyJournalDir();

/**
 * Ensure the daily journal directory exists
 */
function ensureJournalDir(): void {
  if (!existsSync(DAILY_JOURNAL_DIR)) {
    mkdirSync(DAILY_JOURNAL_DIR, { recursive: true });
  }
}

/**
 * Format a timestamp as HH:MM
 * @param timestamp - ISO datetime string
 * @returns Formatted time string
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format metadata from a journal entry
 * @param entry - Journal entry to format
 * @returns Formatted metadata string or empty string
 */
function formatEntryMetadata(entry: JournalEntryFull): string {
  const parts: string[] = [];

  if (entry.task_title) {
    parts.push(`**Uppgift:** ${entry.task_title}`);
  }

  if (entry.project_name) {
    parts.push(`**Projekt:** ${entry.project_name}`);
  }

  if (entry.role_name) {
    parts.push(`**Roll:** ${entry.role_name}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '';
}

/**
 * Format a single journal entry as markdown
 * @param entry - Journal entry to format
 * @returns Formatted markdown string
 */
function formatEntry(entry: JournalEntryFull): string {
  const time = formatTime(entry.timestamp);
  const symbol = getEntryTypeSymbol(entry.entry_type);
  const metadata = formatEntryMetadata(entry);

  let markdown = `---\n\n## ${time} | ${entry.entry_type} ${symbol}\n${entry.content}`;

  if (metadata) {
    markdown += `\n\n${metadata}`;
  }

  markdown += '\n\n';

  return markdown;
}

/**
 * Generate journal markdown for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @returns Generated markdown content
 */
export function generateJournalMarkdown(date: string): string {
  // Get entries for the date
  const entries = getEntriesByDateRange({ startDate: date, endDate: date });

  // Parse date and format Swedish parts
  const dateObj = new Date(date);
  const dateParts = formatSwedishDate(dateObj);

  // If using template (optional - can be hardcoded for now)
  // For simplicity, let's build it manually first
  let markdown = `# ${dateParts.date_long} - ${dateParts.weekday}\n\n`;

  if (entries.length === 0) {
    markdown += '_Inga journalposter för denna dag_\n';
  } else {
    entries.forEach(entry => {
      markdown += formatEntry(entry);
    });
  }

  return markdown;
}

/**
 * Write journal markdown to file
 * @param date - Date in YYYY-MM-DD format
 * @param content - Markdown content to write
 * @returns Path to the written file
 */
export function writeJournalMarkdown(date: string, content: string): string {
  ensureJournalDir();
  const filePath = join(DAILY_JOURNAL_DIR, `${date}.md`);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Regenerate journal markdown from database entries
 * @param date - Date in YYYY-MM-DD format
 * @returns Path to the regenerated file
 */
export function regenerateJournalMarkdown(date: string): string {
  const markdown = generateJournalMarkdown(date);
  return writeJournalMarkdown(date, markdown);
}

/**
 * Generate journal markdown with plan data (focus and calendar) prepended
 * @param date - Date in YYYY-MM-DD format
 * @param focusItems - Array of focus items for the day
 * @param calendarEvents - Array of calendar events
 * @returns Generated markdown content
 */
export function generateJournalMarkdownWithPlan(
  date: string,
  focusItems: string[],
  calendarEvents: { time: string; title: string }[]
): string {
  // Get entries for the date
  const entries = getEntriesByDateRange({ startDate: date, endDate: date });

  // Parse date and format Swedish parts
  const dateObj = new Date(date);
  const dateParts = formatSwedishDate(dateObj);

  let markdown = `# ${dateParts.date_long} - ${dateParts.weekday}\n\n`;

  // Add focus section if there are focus items
  if (focusItems.length > 0) {
    markdown += '---\n\n## Fokus för dagen\n\n';
    focusItems.forEach((item, index) => {
      markdown += `${index + 1}. ${item}\n\n`;
    });
  }

  // Add calendar section if there are events
  if (calendarEvents.length > 0) {
    markdown += '---\n\n# Dagens kalender\n\n';
    calendarEvents.forEach(event => {
      markdown += `- ${event.time} ${event.title}\n`;
    });
    markdown += '\n';
  }

  // Add journal entries
  if (entries.length === 0) {
    markdown += '---\n\n_Inga journalposter för denna dag_\n';
  } else {
    entries.forEach(entry => {
      markdown += formatEntry(entry);
    });
  }

  return markdown;
}

/**
 * Regenerate journal markdown with plan data
 * @param date - Date in YYYY-MM-DD format
 * @param focusItems - Array of focus items for the day
 * @param calendarEvents - Array of calendar events
 * @returns Path to the regenerated file
 */
export function regenerateJournalMarkdownWithPlan(
  date: string,
  focusItems: string[],
  calendarEvents: { time: string; title: string }[]
): string {
  const markdown = generateJournalMarkdownWithPlan(date, focusItems, calendarEvents);
  return writeJournalMarkdown(date, markdown);
}

/**
 * Check if a journal file exists for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @returns True if file exists
 */
export function journalFileExists(date: string): boolean {
  const filePath = join(DAILY_JOURNAL_DIR, `${date}.md`);
  return existsSync(filePath);
}

/**
 * Get the path to a journal file
 * @param date - Date in YYYY-MM-DD format
 * @returns Full path to the journal file
 */
export function getJournalFilePath(date: string): string {
  return join(DAILY_JOURNAL_DIR, `${date}.md`);
}

/**
 * Parse focus and calendar from existing journal markdown
 *
 * Extracts "Fokus för dagen" and "Dagens kalender" sections from a journal
 * markdown file. This allows preserving plan data when regenerating the file.
 *
 * @param content - Markdown content to parse
 * @returns Object with focus items and calendar events
 */
export function parseJournalMarkdown(content: string): {
  focus: string[];
  events: { time: string; title: string }[];
} {
  const focus: string[] = [];
  const events: { time: string; title: string }[] = [];

  const lines = content.split('\n');
  let inFocusSection = false;
  let inCalendarSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed === '## Fokus för dagen') {
      inFocusSection = true;
      inCalendarSection = false;
      continue;
    } else if (trimmed.startsWith('# Dagens kalender') || trimmed === '## Dagens kalender') {
      inCalendarSection = true;
      inFocusSection = false;
      continue;
    } else if (trimmed.startsWith('## ') || trimmed === '---') {
      // New section or separator - exit current section
      inFocusSection = false;
      inCalendarSection = false;
      continue;
    }

    // Parse focus items (numbered list)
    if (inFocusSection && /^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s+/, '').trim();
      if (text) focus.push(text);
    }

    // Parse calendar events (bullet list with time)
    if (inCalendarSection && trimmed.startsWith('- ')) {
      const match = trimmed.match(/^-\s+(\d{2}:\d{2})\s+(.+)$/);
      if (match) {
        events.push({ time: match[1], title: match[2] });
      }
    }
  }

  return { focus, events };
}
