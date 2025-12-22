/**
 * Task Query Functions
 *
 * Complete CRUD operations for tasks with integrated journal tracking.
 * Provides 12 query functions: 9 READ operations for retrieving tasks by various criteria,
 * and 3 WRITE operations for creating, updating, and managing task status.
 *
 * READ functions support filtering by:
 * - ID, title (search), today's tasks, week range, overdue status
 * - Role or project associations, parent-child relationships, staleness
 * - All return tasks from v_tasks_full view with complete context and calculated fields
 *
 * WRITE functions provide:
 * - Task creation with defaults (status='captured', priority=0)
 * - Partial updates via dynamic SQL
 * - Status changes with automatic journal entry creation (for done/cancelled)
 *
 * Database connection uses SQLite with bun:sqlite.
 * All queries are parameterized to prevent SQL injection.
 */
import { getDatabase } from '../connection';
import {
  groupBy,
  parseSubtasks,
  TASK_STATUS_ORDER,
  getCurrentWeekRange,
} from '../helpers';
import { getLocalTimestamp } from '../../utilities/time';
import type {
  Task,
  TaskFull,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types';

/**
─────────────────────────────────────────────────────────────────────────────
READ OPERATIONS - Retrieve tasks with various filters and grouping strategies
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Retrieves a task by its ID with full details.
 *
 * Fetches from v_tasks_full view which includes role context, project context,
 * parent task info, subtasks JSON, and calculated fields.
 * Always includes done/cancelled tasks.
 *
 * SQL: SELECT * FROM v_tasks_full WHERE id = ?
 *
 * @param id - Task ID to retrieve
 * @returns Full task details or null if not found
 */
export function getTaskById(id: number): TaskFull | null {
  const db = getDatabase();

  const task = db
    .query('SELECT * FROM v_tasks_full WHERE id = ?')
    .get(id) as TaskFull | null;

  return task;
}

/**
 * Searches for tasks by title with fuzzy matching.
 *
 * Case-insensitive partial match on task title.
 * By default excludes done/cancelled tasks unless includeDone option is true.
 *
 * SQL: SELECT * FROM v_tasks_full WHERE title LIKE '%' || ? || '%'
 *      [AND status NOT IN ('done', 'cancelled')]
 *
 * @param input - Search parameters
 * @param input.query - Search string to match against task titles
 * @param input.includeDone - Optional flag to include done/cancelled tasks (defaults to false)
 * @returns Array of matching tasks with full details
 */
export function searchTasks(input: {
  query: string;
  includeDone?: boolean;
}): TaskFull[] {
  const db = getDatabase();

  let sql = "SELECT * FROM v_tasks_full WHERE title LIKE '%' || ? || '%'";

  if (!input.includeDone) {
    sql += " AND status NOT IN ('done', 'cancelled')";
  }

  const tasks = db.query(sql).all(input.query) as TaskFull[];

  return tasks;
}

/**
 * Retrieves today's actionable tasks grouped by role.
 *
 * Uses v_today_tasks view which filters for tasks with status 'planned' or 'ready'
 * that have today's date in start_date, remind_date, or deadline.
 * Tasks are ordered by priority (descending) within each role.
 *
 * SQL: SELECT * FROM v_today_tasks ORDER BY role_id, priority DESC
 *
 * @returns Map with role_id as key and array of tasks as value
 */
export function getTodayTasks(): Map<number, TaskFull[]> {
  const db = getDatabase();

  const tasks = db
    .query('SELECT * FROM v_today_tasks ORDER BY role_id, priority DESC')
    .all() as TaskFull[];

  return groupBy(tasks, (task) => task.role_id);
}

/**
 * Retrieves this week's tasks grouped by date.
 *
 * Fetches tasks with deadline or start_date within the specified week range.
 * Excludes done and cancelled tasks.
 * Groups tasks by their deadline date (or start_date if no deadline).
 *
 * SQL: SELECT * FROM v_tasks_full
 *      WHERE (deadline BETWEEN ? AND ? OR start_date BETWEEN ? AND ?)
 *      AND status NOT IN ('done', 'cancelled')
 *
 * @param input - Week range parameters
 * @param input.weekStart - ISO date string for week start (Monday)
 * @param input.weekEnd - ISO date string for week end (Sunday)
 * @returns Map with date string as key and array of tasks as value
 */
export function getWeekTasks(input: {
  weekStart: string;
  weekEnd: string;
}): Map<string, TaskFull[]> {
  const db = getDatabase();

  const tasks = db
    .query(
      `SELECT * FROM v_tasks_full
       WHERE (deadline BETWEEN ? AND ? OR start_date BETWEEN ? AND ?)
       AND status NOT IN ('done', 'cancelled')`
    )
    .all(input.weekStart, input.weekEnd, input.weekStart, input.weekEnd) as TaskFull[];

  // Group by deadline, or start_date if no deadline
  return groupBy(tasks, (task) => task.deadline || task.start_date || '');
}

/**
 * Retrieves all overdue tasks sorted by most overdue first.
 *
 * Uses v_overdue_tasks view which filters for tasks with deadline < today
 * and status not done/cancelled. Sorted by days_overdue descending.
 *
 * SQL: SELECT * FROM v_overdue_tasks
 *
 * @returns Array of overdue tasks ordered by days overdue (descending)
 */
export function getOverdueTasks(): TaskFull[] {
  const db = getDatabase();

  const tasks = db.query('SELECT * FROM v_overdue_tasks').all() as TaskFull[];

  return tasks;
}

/**
 * Retrieves parent tasks that have subtasks.
 *
 * Filters for tasks with non-empty subtasks_json array and excludes
 * done/cancelled parent tasks. Can optionally filter by role or project.
 *
 * SQL: SELECT * FROM v_tasks_full
 *      WHERE subtasks_json != '[]' AND status NOT IN ('done', 'cancelled')
 *      [AND role_id = ? OR project_id = ?]
 *
 * @param input - Optional filters
 * @param input.roleId - Optional role ID filter
 * @param input.projectId - Optional project ID filter
 * @returns Array of parent tasks with subtasks
 */
export function getTasksWithSubtasks(input?: {
  roleId?: number;
  projectId?: number;
}): TaskFull[] {
  const db = getDatabase();

  let sql = `SELECT * FROM v_tasks_full
             WHERE subtasks_json != '[]' AND status NOT IN ('done', 'cancelled')`;

  const params: number[] = [];

  if (input?.roleId !== undefined) {
    sql += ' AND role_id = ?';
    params.push(input.roleId);
  }

  if (input?.projectId !== undefined) {
    sql += ' AND project_id = ?';
    params.push(input.projectId);
  }

  const tasks = db.query(sql).all(...params) as TaskFull[];

  return tasks;
}

/**
 * Retrieves all tasks for a role grouped by status.
 *
 * Fetches tasks for the specified role and groups them by their status.
 * Excludes done/cancelled tasks by default unless includeDone is true.
 * Tasks are ordered by status, deadline (nulls last), and priority (desc).
 *
 * SQL: SELECT * FROM v_tasks_full WHERE role_id = ?
 *      [AND status NOT IN ('done', 'cancelled')]
 *      ORDER BY status, deadline NULLS LAST, priority DESC
 *
 * @param input - Query parameters
 * @param input.roleId - Role ID to fetch tasks for
 * @param input.includeDone - Optional flag to include done/cancelled tasks (defaults to false)
 * @returns Map with TaskStatus as key and array of tasks as value
 */
export function getTasksByRole(input: {
  roleId: number;
  includeDone?: boolean;
}): Map<TaskStatus, TaskFull[]> {
  const db = getDatabase();

  let sql = 'SELECT * FROM v_tasks_full WHERE role_id = ?';

  if (!input.includeDone) {
    sql += " AND status NOT IN ('done', 'cancelled')";
  }

  sql += ' ORDER BY status, deadline NULLS LAST, priority DESC';

  const tasks = db.query(sql).all(input.roleId) as TaskFull[];

  return groupBy(tasks, (task) => task.status);
}

/**
 * Retrieves all tasks for a project with summary statistics.
 *
 * Fetches all tasks (including done/cancelled) for the specified project
 * and groups them by status. Returns both the grouped tasks and a summary
 * with total, done count, and completion percentage.
 *
 * SQL: SELECT * FROM v_tasks_full WHERE project_id = ?
 *      ORDER BY status, deadline NULLS LAST, priority DESC
 *
 * @param projectId - Project ID to fetch tasks for
 * @returns Object with tasks Map and summary statistics
 */
export function getTasksByProject(projectId: number): {
  tasks: Map<TaskStatus, TaskFull[]>;
  summary: { total: number; done: number; percentComplete: number };
} {
  const db = getDatabase();

  const tasks = db
    .query(
      'SELECT * FROM v_tasks_full WHERE project_id = ? ORDER BY status, deadline NULLS LAST, priority DESC'
    )
    .all(projectId) as TaskFull[];

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const percentComplete = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    tasks: groupBy(tasks, (task) => task.status),
    summary: { total, done, percentComplete },
  };
}

/**
 * Retrieves stale tasks based on customizable thresholds.
 *
 * Uses v_stale_tasks view by default (captured >= 28 days, ready >= 14 days).
 * Can customize thresholds via input parameter.
 *
 * SQL: SELECT * FROM v_stale_tasks
 *      OR custom query with adjustable days_since_creation thresholds
 *
 * @param input - Optional custom thresholds
 * @param input.capturedDays - Days threshold for captured tasks
 * @param input.readyDays - Days threshold for ready tasks
 * @returns Array of stale tasks
 */
export function getStaleTasks(input?: {
  capturedDays?: number;
  readyDays?: number;
}): TaskFull[] {
  const db = getDatabase();

  // If custom thresholds provided, build custom query
  if (
    input?.capturedDays !== undefined ||
    input?.readyDays !== undefined
  ) {
    const capturedDays = input.capturedDays ?? 28;
    const readyDays = input.readyDays ?? 14;

    const tasks = db
      .query(
        `SELECT * FROM v_tasks_full
         WHERE (status = 'captured' AND days_since_creation >= ?)
         OR (status = 'ready' AND days_since_creation >= ?)`
      )
      .all(capturedDays, readyDays) as TaskFull[];

    return tasks;
  }

  // Use default view
  const tasks = db.query('SELECT * FROM v_stale_tasks').all() as TaskFull[];

  return tasks;
}

/**
─────────────────────────────────────────────────────────────────────────────
WRITE OPERATIONS - Create, update, and manage task status with journaling
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Creates a new task.
 *
 * Inserts a task with required fields (title, role_id) and optional fields.
 * New tasks default to status='captured' and priority=0.
 * Timestamps (created_at, updated_at) are auto-generated by database.
 *
 * SQL Pattern: INSERT INTO tasks (title, role_id, ...) VALUES (?, ?, ...)
 *              RETURNING * to fetch generated ID and timestamps
 *
 * @param input - Task creation data
 * @param input.title - Task title (required)
 * @param input.role_id - Associated role (required)
 * @param input.notes - Optional task description/notes
 * @param input.status - Task status (defaults to 'captured')
 * @param input.priority - Priority level 0-10 (defaults to 0)
 * @param input.energy_requirement - Low/medium/high (optional)
 * @param input.time_estimate - Estimated minutes (optional)
 * @param input.project_id - Associated project (optional)
 * @param input.parent_task_id - Parent task for subtasks (optional)
 * @param input.start_date - ISO date for task start (optional)
 * @param input.deadline - ISO date for task deadline (optional)
 * @param input.remind_date - ISO date for reminder (optional)
 * @returns Created task with generated ID and timestamp
 */
export function createTask(input: CreateTaskInput): Task {
  const db = getDatabase();

  // Generate local timestamp to ensure consistent timezone handling
  const created_at = getLocalTimestamp();

  const result = db
    .query(
      `INSERT INTO tasks (
        created_at, title, role_id, notes, status, priority, energy_requirement,
        time_estimate, project_id, parent_task_id, start_date, deadline, remind_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
    .get(
      created_at,
      input.title,
      input.role_id,
      input.notes ?? null,
      input.status ?? 'captured',
      input.priority ?? 0,
      input.energy_requirement ?? null,
      input.time_estimate ?? null,
      input.project_id ?? null,
      input.parent_task_id ?? null,
      input.start_date ?? null,
      input.deadline ?? null,
      input.remind_date ?? null
    ) as Task;

  return result;
}

/**
 * Updates an existing task with partial data.
 *
 * Only updates fields provided in the input object. Dynamically builds SQL SET clause
 * from the input object fields, allowing flexible partial updates without overwriting
 * unspecified fields.
 *
 * Updated_at timestamp is automatically set by database trigger.
 * Returns the complete updated task record.
 *
 * SQL Pattern: UPDATE tasks SET field1 = ?, field2 = ? WHERE id = ?
 *              RETURNING * (only fields provided in input are updated)
 *
 * @param input - Update parameters including task ID and fields to update
 * @param input.id - Task ID to update (required)
 * @param input.title - Update task title (optional)
 * @param input.notes - Update notes/description (optional)
 * @param input.priority - Update priority level (optional)
 * @param input.energy_requirement - Update energy requirement (optional)
 * @param input.time_estimate - Update time estimate (optional)
 * @param input.project_id - Update project association (optional)
 * @param input.role_id - Update role association (optional)
 * @param input.parent_task_id - Update parent task (optional)
 * @param input.start_date - Update start date (optional)
 * @param input.deadline - Update deadline (optional)
 * @param input.remind_date - Update remind date (optional)
 * @returns Updated task with all fields populated
 * @throws Error if task not found or if no fields provided (returns current task)
 */
export function updateTask(input: UpdateTaskInput & { id: number }): Task {
  const db = getDatabase();

  // Build dynamic SQL for partial updates
  const fields: string[] = [];
  const values: any[] = [];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title);
  }
  if (input.notes !== undefined) {
    fields.push('notes = ?');
    values.push(input.notes);
  }
  if (input.status !== undefined) {
    fields.push('status = ?');
    values.push(input.status);
  }
  if (input.priority !== undefined) {
    fields.push('priority = ?');
    values.push(input.priority);
  }
  if (input.energy_requirement !== undefined) {
    fields.push('energy_requirement = ?');
    values.push(input.energy_requirement);
  }
  if (input.time_estimate !== undefined) {
    fields.push('time_estimate = ?');
    values.push(input.time_estimate);
  }
  if (input.project_id !== undefined) {
    fields.push('project_id = ?');
    values.push(input.project_id);
  }
  if (input.role_id !== undefined) {
    fields.push('role_id = ?');
    values.push(input.role_id);
  }
  if (input.parent_task_id !== undefined) {
    fields.push('parent_task_id = ?');
    values.push(input.parent_task_id);
  }
  if (input.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(input.start_date);
  }
  if (input.deadline !== undefined) {
    fields.push('deadline = ?');
    values.push(input.deadline);
  }
  if (input.remind_date !== undefined) {
    fields.push('remind_date = ?');
    values.push(input.remind_date);
  }

  if (fields.length === 0) {
    // No fields to update, just return current task
    const task = db.query('SELECT * FROM tasks WHERE id = ?').get(input.id) as Task;
    if (!task) {
      throw new Error(`Task not found: id=${input.id}`);
    }
    return task;
  }

  values.push(input.id);

  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? RETURNING *`;

  const result = db.query(sql).get(...values) as Task | null;

  if (!result) {
    throw new Error(`Task not found: id=${input.id}`);
  }

  return result;
}

/**
 * Sets task status with automatic journal entry creation.
 *
 * Updates task status and triggers automatic journal entry creation when
 * tasks are marked as 'done' or 'cancelled'. This integrates task lifecycle
 * events into the activity journal for retrospectives and reflection.
 *
 * Journal Entry Behavior:
 * - If status = 'done': Creates 'task' type entry with "Task completed: [title]"
 * - If status = 'cancelled': Creates 'task' type entry with "Task cancelled: [title]"
 * - If custom comment provided: Uses comment instead of auto-generated text
 * - Other statuses: No journal entry created
 *
 * SQL Pattern: UPDATE tasks SET status = ? WHERE id = ?
 *              + INSERT INTO journal_entries (conditional on status)
 *
 * @param input - Status change parameters
 * @param input.id - Task ID to update
 * @param input.status - New status to set (captured, ready, planned, active, done, cancelled)
 * @param input.comment - Optional comment for journal entry (only used if done/cancelled)
 * @returns Updated task with new status
 * @throws Error if task not found
 *
 * @example
 * // Complete task with auto-generated journal entry
 * setTaskStatus({ id: 42, status: 'done' });
 *
 * @example
 * // Complete with custom reflection
 * setTaskStatus({ id: 42, status: 'done', comment: 'Completed earlier than expected' });
 */
export function setTaskStatus(input: {
  id: number;
  status: TaskStatus;
  comment?: string;
}): Task {
  const db = getDatabase();

  // Update status
  const result = db
    .query('UPDATE tasks SET status = ? WHERE id = ? RETURNING *')
    .get(input.status, input.id) as Task | null;

  if (!result) {
    throw new Error(`Task not found: id=${input.id}`);
  }

  // Create journal entry if done or cancelled
  if (input.status === 'done' || input.status === 'cancelled') {
    const content =
      input.comment ||
      `Task ${input.status === 'done' ? 'completed' : 'cancelled'}: ${result.title}`;

    db.query(
      `INSERT INTO journal_entries (entry_type, content, related_task_id)
       VALUES ('task', ?, ?)`
    ).run(content, input.id);
  }

  return result;
}
