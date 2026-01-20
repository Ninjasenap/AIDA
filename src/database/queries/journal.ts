/**
 * Journal Query Functions
 *
 * Provides CRUD operations for journal entries with emphasis on immutability.
 * All journal entries are WRITE-ONCE, READ-MANY - they can never be edited or
 * deleted after creation, ensuring a complete audit trail.
 *
 * QUERY PATTERN:
 * All READ queries use consistent LEFT JOINs to enrich journal entries with
 * related entity names:
 * - LEFT JOIN projects: Retrieves project name if entry is project-related
 * - LEFT JOIN roles: Retrieves role name if entry is role-related
 *
 * This pattern allows journal entries to reference related items by ID while
 * providing human-readable names in query results without breaking if a related
 * entity is deleted (entries remain accessible).
 *
 * IMMUTABILITY GUARANTEE:
 * There are NO UPDATE or DELETE operations for journal entries. The schema
 * enforces this through business logic and the API surface provides no
 * modification methods. Once written, entries are permanent.
 */

import { getDatabase } from '../connection';
import { normalizeToISO8601, getLocalTimestamp } from '../../utilities/time';
import { regenerateJournalMarkdown } from '../../utilities/journal-markdown.js';
import type {
  JournalEntry,
  JournalEntryFull,
  CreateEntryInput,
} from '../types';

import type {
  EntryType,
} from '../../utilities/symbols';

// =============================================================================
// JOURNAL QUERIES - READ
// =============================================================================

/**
 * Retrieves all journal entries from today.
 *
 * Fetches every entry created on the current date, enriched with related entity
 * names (task, project, role). Results are ordered chronologically from earliest
 * to latest, making it useful for reviewing the day's activities in sequence.
 *
 * QUERY PATTERN:
 * Uses standard LEFT JOIN enrichment pattern to attach human-readable names
 * from related entities while preserving entries with missing relationships.
 *
 * @returns Array of today's journal entries with related entity names.
 *          Each entry includes: id, timestamp, entry_type, content,
 *          project_name, role_name (null if no related entity).
 *          Ordered by timestamp ascending (oldest first).
 */
export function getTodayEntries(): JournalEntryFull[] {
  const db = getDatabase();

  const entries = db
    .query(
      `SELECT je.*,
              p.name as project_name,
              r.name as role_name
       FROM journal_entries je
       LEFT JOIN projects p ON je.related_project_id = p.id
       LEFT JOIN roles r ON je.related_role_id = r.id
       WHERE DATE(je.timestamp) = DATE('now', 'localtime')
       ORDER BY datetime(je.timestamp) ASC`
    )
    .all() as JournalEntryFull[];

  return entries;
}

/**
 * Retrieves all journal entries for a specific task.
 *
 * Fetches the complete activity history for a task, including all notes,
 * status changes, and context entries. Useful for understanding a task's
 * lifecycle and all decisions/observations made about it.
 *
 * QUERY PATTERN:
 * Filters entries by todoist_task_id and enriches with project and role context.
 * Uses LEFT JOINs so entries remain accessible even if task is deleted (id only).
 *
 * @param taskId - Numeric ID of the task to retrieve entries for
 * @returns Array of journal entries associated with the task, ordered by
 *          timestamp ascending (oldest first). Entries may be null for
 *          project_name and role_name if not set.
 */
export function getEntriesByTodoistTask(todoistTaskId: string): JournalEntryFull[] {
  const db = getDatabase();

  const entries = db
    .query(
      `SELECT je.*,
              p.name as project_name,
              r.name as role_name
       FROM journal_entries je
       LEFT JOIN projects p ON je.related_project_id = p.id
       LEFT JOIN roles r ON je.related_role_id = r.id
       WHERE je.todoist_task_id = ?
       ORDER BY datetime(je.timestamp) ASC`
    )
    .all(todoistTaskId) as JournalEntryFull[];

  return entries;
}

/**
 * Retrieves all journal entries for a specific project.
 *
 * Fetches the complete activity history for a project, showing all decisions,
 * milestones, blockers, and progress notes. Provides a chronological record
 * of the project's evolution.
 *
 * QUERY PATTERN:
 * Filters entries by related_project_id and enriches with task and role context.
 * Uses LEFT JOINs so entries remain accessible even if project is deleted (id only).
 *
 * @param projectId - Numeric ID of the project to retrieve entries for
 * @returns Array of journal entries associated with the project, ordered by
 *          timestamp ascending (oldest first). Entries may be null for
 *          role_name if not set.
 */
export function getEntriesByProject(projectId: number): JournalEntryFull[] {
  const db = getDatabase();

  const entries = db
    .query(
      `SELECT je.*,
              p.name as project_name,
              r.name as role_name
       FROM journal_entries je
       LEFT JOIN projects p ON je.related_project_id = p.id
       LEFT JOIN roles r ON je.related_role_id = r.id
       WHERE je.related_project_id = ?
       ORDER BY datetime(je.timestamp) ASC`
    )
    .all(projectId) as JournalEntryFull[];

  return entries;
}

/**
 * Retrieves all journal entries for a specific role.
 *
 * Fetches the activity log for a role context (e.g., "Developer", "Manager",
 * "Mentor"), showing work within that role in chronological order.
 *
 * QUERY PATTERN:
 * Filters entries by related_role_id and enriches with task and project context.
 * Uses LEFT JOINs so entries remain accessible even if role is deleted (id only).
 *
 * @param roleId - Numeric ID of the role to retrieve entries for
 * @returns Array of journal entries associated with the role, ordered by
 *          timestamp ascending (oldest first). Entries may be null for
 *          project_name if not set.
 */
export function getEntriesByRole(roleId: number): JournalEntryFull[] {
  const db = getDatabase();

  const entries = db
    .query(
      `SELECT je.*,
              p.name as project_name,
              r.name as role_name
       FROM journal_entries je
       LEFT JOIN projects p ON je.related_project_id = p.id
       LEFT JOIN roles r ON je.related_role_id = r.id
       WHERE je.related_role_id = ?
       ORDER BY datetime(je.timestamp) ASC`
    )
    .all(roleId) as JournalEntryFull[];

  return entries;
}

/**
 * Retrieves journal entries by type with optional date filtering.
 *
 * Fetches entries filtered by entry_type (e.g., "reflection", "decision", "note"),
 * with optional date range narrowing. Useful for finding specific types of entries
 * across the system or within a time window.
 *
 * QUERY PATTERN:
 * Filters by entry_type, optionally narrows with timestamp BETWEEN if date range
 * provided. Enriches with all related entity names via standard LEFT JOINs.
 *
 * @param input - Query parameters:
 *        - type: EntryType to filter by (required)
 *        - startDate: ISO string for range start (inclusive, optional)
 *        - endDate: ISO string for range end (inclusive, optional)
 *        If both dates provided, applies BETWEEN filter; partial options are ignored.
 * @returns Array of journal entries matching type (and optionally date range),
 *          ordered by timestamp ascending (oldest first).
 *          Entries enriched with project_name, role_name (null if unset).
 */
export function getEntriesByType(
  input: { type: EntryType; startDate?: string; endDate?: string }
): JournalEntryFull[] {
  const db = getDatabase();

  let sql = `SELECT je.*,
              p.name as project_name,
              r.name as role_name
       FROM journal_entries je
       LEFT JOIN projects p ON je.related_project_id = p.id
       LEFT JOIN roles r ON je.related_role_id = r.id
       WHERE je.entry_type = ?`;

  const params: any[] = [input.type];

  if (input.startDate && input.endDate) {
    sql += ` AND je.timestamp BETWEEN ? AND ?`;
    params.push(input.startDate, input.endDate);
  }

  sql += ` ORDER BY datetime(je.timestamp) ASC`;

  const entries = db.query(sql).all(...params) as JournalEntryFull[];

  return entries;
}

/**
 * Retrieves journal entries within a date range.
 *
 * Fetches all entries between two dates (inclusive), useful for reviewing
 * activity across a time period (e.g., weekly review, sprint retrospective).
 * Includes all entry types, contexts, and related entities.
 *
 * QUERY PATTERN:
 * Filters by timestamp BETWEEN startDate and endDate, then enriches with
 * all related entity names via standard LEFT JOINs.
 * Ordered ASC (oldest first) for chronological narrative of the period.
 *
 * @param input - Query parameters:
 *        - startDate: ISO 8601 datetime string for range start (inclusive)
 *        - endDate: ISO 8601 datetime string for range end (inclusive)
 * @returns Array of all journal entries within the date range, ordered by
  *          timestamp ascending (oldest first). Entries enriched with project_name,
  *          role_name (null if unset).

 */
export function getEntriesByDateRange(input: { startDate: string; endDate: string }): JournalEntryFull[] {
  const db = getDatabase();

  const entries = db
    .query(
      `SELECT je.*,
              p.name as project_name,
              r.name as role_name
       FROM journal_entries je
       LEFT JOIN projects p ON je.related_project_id = p.id
       LEFT JOIN roles r ON je.related_role_id = r.id
       WHERE DATE(je.timestamp) BETWEEN ? AND ?
       ORDER BY datetime(je.timestamp) ASC`
    )
    .all(input.startDate, input.endDate) as JournalEntryFull[];

  return entries;
}

// =============================================================================
// JOURNAL QUERIES - WRITE
// =============================================================================

/**
 * Creates a new journal entry.
 *
 * IMMUTABILITY GUARANTEE:
 * Journal entries are WRITE-ONCE, READ-MANY. Once created, they can NEVER be
 * edited or deleted. The timestamp is immutable. This is intentional to create
 * an audit trail of thoughts, decisions, and observations that cannot be
 * retroactively modified.
 *
 * TIMESTAMP HANDLING:
 * - If input.timestamp is provided: Validates and normalizes to ISO 8601 format
 * - If input.timestamp is omitted: Database DEFAULT datetime('now') is used
 * - Accepts flexible formats: ISO dates, datetime strings, Swedish natural language
 *
 * QUERY PATTERN:
 * Single INSERT with RETURNING clause to immediately return the created entry
 * including the auto-generated id and timestamp (either provided or server-generated).
 *
 * @param input - Journal entry creation data:
 *        - entry_type: Type of entry (required)
 *        - content: Text content (required)
 *        - timestamp: Optional ISO 8601 datetime or parseable string
  *        - todoist_task_id: Optional Todoist task ID
  *        - related_project_id: Optional numeric project ID
  *        - related_role_id: Optional numeric role ID

 *
 * @returns Created JournalEntry object with:
 *         - id: Auto-generated numeric primary key
 *         - timestamp: Either provided or server-generated creation time (immutable)
 *         - All input fields echoed back
 *
 * @throws Error if timestamp format is invalid or database insert fails
 */
export function createEntry(input: CreateEntryInput): JournalEntry {
  const db = getDatabase();

  // Generate or validate timestamp - always provide explicit timestamp for local time
  let timestamp: string;
  if (input.timestamp !== undefined) {
    // User provided timestamp - validate and convert to SQLite format
    const normalizedISO = normalizeToISO8601(input.timestamp);
    if (!normalizedISO) {
      throw new Error(`Invalid timestamp format: "${input.timestamp}". Expected ISO 8601 format or parseable date expression.`);
    }
    // Convert from ISO format (T separator) to SQLite format (space separator)
    timestamp = normalizedISO.replace('T', ' ');
  } else {
    // No timestamp provided - use current local time
    timestamp = getLocalTimestamp();
  }

  // Always include timestamp in INSERT to ensure local time
  const sql = `INSERT INTO journal_entries (
         timestamp,
         entry_type,
         content,
         todoist_task_id,
         related_project_id,
         related_role_id
       ) VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`;
  const params = [
    timestamp,
    input.entry_type,
    input.content,
    input.todoist_task_id ?? null,
    input.related_project_id ?? null,
    input.related_role_id ?? null,
  ];

  const result = db.query(sql).get(...params) as JournalEntry;

  // Auto-regenerate journal markdown for the entry's date
  // Handle both "T" and space separators in timestamp format
  const entryDate = result.timestamp.split(/[T ]/)[0]; // Extract YYYY-MM-DD
  try {
    // Import functions dynamically to avoid circular dependency
    const { readFileSync, existsSync } = require('fs');
    const { getJournalFilePath, parseJournalMarkdown, regenerateJournalMarkdownWithPlan } = require('../../utilities/journal-markdown.js');

    const journalPath = getJournalFilePath(entryDate);

    // Check if journal file exists and has focus/calendar data to preserve
    if (existsSync(journalPath)) {
      const existingContent = readFileSync(journalPath, 'utf-8');
      const { focus, events } = parseJournalMarkdown(existingContent);

      if (focus.length > 0 || events.length > 0) {
        // Preserve focus and calendar when regenerating
        regenerateJournalMarkdownWithPlan(entryDate, focus, events);
      } else {
        // No plan data to preserve, use standard regeneration
        regenerateJournalMarkdown(entryDate);
      }
    } else {
      // File doesn't exist yet, create it without plan data
      regenerateJournalMarkdown(entryDate);
    }
  } catch (error) {
    // Log error but don't fail the entry creation
    console.error(`Failed to regenerate journal markdown for ${entryDate}:`, error);
  }

  return result;
}
