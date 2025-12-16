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

/**
 * Path to the daily journals directory
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

  let markdown = `---\n## ${time} | ${entry.entry_type} ${symbol}\n${entry.content}`;

  if (metadata) {
    markdown += `\n\n${metadata}`;
  }

  markdown += '\n';

  return markdown;
}

/**
 * Generate journal markdown for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @returns Generated markdown content
 */
export function generateJournalMarkdown(date: string): string {
  // Get entries for the date
  const entries = getEntriesByDateRange(date, date);

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
