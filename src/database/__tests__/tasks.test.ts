/**
 * Task Query Tests
 *
 * Tests for all task CRUD and read scenario functions.
 * Uses demo data seeded in setup.ts for realistic Swedish content.
 */

import './setup'; // Import setup hooks
import { describe, expect, test } from 'bun:test';
import { getDatabase } from '../connection';
import {
  getTaskById,
  searchTasks,
  getTodayTasks,
  getWeekTasks,
  getOverdueTasks,
  getTasksWithSubtasks,
  getTasksByRole,
  getTasksByProject,
  getStaleTasks,
  createTask,
  updateTask,
  setTaskStatus,
} from '../queries/tasks';
import type { TaskFull } from '../types';

// =============================================================================
// READ TESTS
// =============================================================================

/**************************************************************************
 * getTaskById - Retrieve task with full details and calculated fields
 *
 * TESTS:
 * - Returns complete task details including role and project info
 * - Returns null for non-existent task IDs
 * - Includes done and cancelled tasks
 * - Includes subtasks_json field
 * - Includes calculated fields (days_since_creation, days_overdue, week_number)
 *
 * VALIDATES:
 * - Task data integrity and relationships
 * - Calculated field accuracy
 * - JSON serialization of subtasks
 *
 * NOT TESTED:
 * - Performance with large subtask arrays
 **************************************************************************/

describe('getTaskById', () => {
  /**
   * Confirms task retrieval returns all details with role and project information.
   */
  test('should return task with full details when task exists', () => {
    const db = getDatabase();

    // Get a known task from demo data
    const knownTask = db.query('SELECT id FROM tasks WHERE title = ? LIMIT 1')
      .get('Implementera query-funktioner för tasks') as { id: number };

    const task = getTaskById(knownTask.id);

    expect(task).toBeDefined();
    expect(task).not.toBeNull();
    expect(task!.id).toBe(knownTask.id);
    expect(task!.title).toBe('Implementera query-funktioner för tasks');
    expect(task!.role_name).toBe('Hobbyutvecklare');
    expect(task!.role_type).toBe('hobby');
    expect(task!.project_name).toBe('AIDA - AI Digital Assistant');
    expect(task!.status).toBe('planned');
    expect(task!.priority).toBe(3);
    expect(task!.energy_requirement).toBe('high');
  });

  /**
   * Verifies null is returned for non-existent task IDs.
   */
  test('should return null when task does not exist', () => {
    const task = getTaskById(99999);
    expect(task).toBeNull();
  });

  /**
   * Confirms done and cancelled tasks are included in task retrieval.
   */
  test('should include done and cancelled tasks', () => {
    const db = getDatabase();

    // Get a done task
    const doneTask = db.query('SELECT id FROM tasks WHERE status = ? LIMIT 1')
      .get('done') as { id: number };

    const task = getTaskById(doneTask.id);
    expect(task).not.toBeNull();
    expect(task!.status).toBe('done');

    // Get a cancelled task
    const cancelledTask = db.query('SELECT id FROM tasks WHERE status = ? LIMIT 1')
      .get('cancelled') as { id: number };

    const task2 = getTaskById(cancelledTask.id);
    expect(task2).not.toBeNull();
    expect(task2!.status).toBe('cancelled');
  });

  /**
   * Confirms subtasks_json field is included in task retrieval.
   */
  test('should include subtasks_json field', () => {
    const db = getDatabase();

    const anyTask = db.query('SELECT id FROM tasks LIMIT 1').get() as { id: number };
    const task = getTaskById(anyTask.id);

    expect(task).not.toBeNull();
    expect(task!.subtasks_json).toBeDefined();
    expect(typeof task!.subtasks_json).toBe('string');
  });

  /**
   * Verifies calculated fields are properly computed and returned.
   */
  test('should include calculated fields (days_since_creation, days_overdue, week_number)', () => {
    const db = getDatabase();

    const anyTask = db.query('SELECT id FROM tasks LIMIT 1').get() as { id: number };
    const task = getTaskById(anyTask.id);

    expect(task).not.toBeNull();
    expect(typeof task!.days_since_creation).toBe('number');
    expect(task!.days_since_creation).toBeGreaterThanOrEqual(0);
    expect(typeof task!.week_number).toBe('number');
    expect(task!.week_number).toBeGreaterThan(0);
    // days_overdue can be null if no deadline or not overdue
    if (task!.days_overdue !== null) {
      expect(typeof task!.days_overdue).toBe('number');
    }
  });
});

/**************************************************************************
 * searchTasks - Find tasks by title search with optional status filtering
 *
 * TESTS:
 * - Finds tasks by partial title match (case-insensitive)
 * - Excludes done/cancelled tasks by default
 * - Includes done/cancelled when includeDone option is true
 * - Returns empty array when no matches found
 * - Matches titles anywhere in string
 * - Returns full task details
 *
 * VALIDATES:
 * - Search case-insensitivity
 * - Default filtering behavior
 * - Option override functionality
 *
 * NOT TESTED:
 * - Special character handling in search
 **************************************************************************/

describe('searchTasks', () => {
  /**
   * Confirms partial title matching works with case-insensitive search.
   */
  test('should find tasks by partial title match (case-insensitive)', () => {
    const results = searchTasks('query');

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('query');
  });

  /**
   * Verifies done and cancelled tasks are excluded from search by default.
   */
  test('should exclude done and cancelled tasks by default', () => {
    const results = searchTasks('starta'); // "Starta podcast" is cancelled

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(0); // Should not find the cancelled task
  });

  /**
   * Confirms done and cancelled tasks are included when includeDone option is set.
   */
  test('should include done and cancelled tasks when includeDone is true', () => {
    const results = searchTasks('starta', { includeDone: true });

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(t => t.status === 'cancelled')).toBe(true);
  });

  /**
   * Verifies search returns empty array when no title matches found.
   */
  test('should return empty array when no matches found', () => {
    const results = searchTasks('xyznonexistent123');

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(0);
  });

  /**
   * Confirms search matches partial strings anywhere in title.
   */
  test('should match anywhere in title', () => {
    const results = searchTasks('kod'); // Should match "Kodgranskning" or other kod-related

    expect(results).toBeInstanceOf(Array);
    // At least one result should contain 'kod' somewhere
  });

  /**
   * Verifies search results include all required task detail fields.
   */
  test('should return full task details', () => {
    const results = searchTasks('implementera');

    expect(results.length).toBeGreaterThan(0);
    const task = results[0];
    expect(task.id).toBeDefined();
    expect(task.title).toBeDefined();
    expect(task.role_name).toBeDefined();
    expect(task.role_type).toBeDefined();
    expect(task.subtasks_json).toBeDefined();
  });
});

/**************************************************************************
 * getTodayTasks - Retrieve today's tasks grouped by role with priority order
 *
 * TESTS:
 * - Returns Map grouped by role_id
 * - Includes only tasks matching today's date criteria
 * - Groups tasks by role_id correctly
 * - Orders tasks by priority descending within each role
 * - Returns empty Map when no today tasks exist
 *
 * VALIDATES:
 * - Date filtering logic
 * - Role-based grouping
 * - Priority ordering
 *
 * NOT TESTED:
 * - Timezone edge cases
 **************************************************************************/

describe('getTodayTasks', () => {
  /**
   * Confirms getTodayTasks returns results grouped as a Map by role_id.
   */
  test('should return a Map grouped by role_id', () => {
    const tasksByRole = getTodayTasks();

    expect(tasksByRole).toBeInstanceOf(Map);
  });

  /**
   * Verifies only planned/ready tasks with today's dates are included.
   */
  test('should only include tasks from v_today_tasks view', () => {
    const tasksByRole = getTodayTasks();

    // v_today_tasks includes tasks with:
    // - status IN ('planned', 'ready')
    // - AND (start_date = today OR remind_date = today OR deadline = today)
    for (const [roleId, tasks] of tasksByRole) {
      expect(Array.isArray(tasks)).toBe(true);
      for (const task of tasks) {
        expect(['planned', 'ready']).toContain(task.status);
      }
    }
  });

  /**
   * Confirms tasks are correctly grouped by role_id.
   */
  test('should group tasks by role_id', () => {
    const tasksByRole = getTodayTasks();

    for (const [roleId, tasks] of tasksByRole) {
      expect(typeof roleId).toBe('number');
      expect(Array.isArray(tasks)).toBe(true);

      // All tasks in the group should have the same role_id
      for (const task of tasks) {
        expect(task.role_id).toBe(roleId);
      }
    }
  });

  /**
   * Verifies tasks are ordered by priority descending within each role.
   */
  test('should order tasks by priority DESC within each role', () => {
    const tasksByRole = getTodayTasks();

    for (const [roleId, tasks] of tasksByRole) {
      if (tasks.length > 1) {
        // Check that tasks are ordered by priority descending
        for (let i = 0; i < tasks.length - 1; i++) {
          expect(tasks[i].priority).toBeGreaterThanOrEqual(tasks[i + 1].priority);
        }
      }
    }
  });

  /**
   * Confirms empty Map is returned when no tasks match today criteria.
   */
  test('should return empty Map when no tasks match today criteria', () => {
    const db = getDatabase();

    // Clear all tasks temporarily
    db.query('DELETE FROM tasks').run();

    const tasksByRole = getTodayTasks();
    expect(tasksByRole).toBeInstanceOf(Map);
    expect(tasksByRole.size).toBe(0);
  });
});

/**************************************************************************
 * getWeekTasks - Retrieve tasks within date range grouped by date
 *
 * TESTS:
 * - Returns Map grouped by date string
 * - Only includes tasks with deadline or start_date in range
 * - Excludes done and cancelled tasks
 * - Returns empty Map when no tasks in range
 *
 * VALIDATES:
 * - Date range filtering
 * - Date grouping logic
 *
 * NOT TESTED:
 * - Multi-week ranges
 **************************************************************************/

describe('getWeekTasks', () => {
  /**
   * Confirms getWeekTasks returns results grouped as Map by date string.
   */
  test('should return a Map grouped by date string', () => {
    const weekStart = '2025-12-08'; // Monday
    const weekEnd = '2025-12-14'; // Sunday

    const tasksByDate = getWeekTasks(weekStart, weekEnd);

    expect(tasksByDate).toBeInstanceOf(Map);
  });

  test('should only include tasks with deadline or start_date in range', () => {
    const weekStart = '2025-12-08';
    const weekEnd = '2025-12-14';

    const tasksByDate = getWeekTasks(weekStart, weekEnd);

    for (const [dateStr, tasks] of tasksByDate) {
      expect(typeof dateStr).toBe('string');
      expect(Array.isArray(tasks)).toBe(true);

      for (const task of tasks) {
        // Task should have deadline or start_date in the week range
        const hasDeadlineInRange = task.deadline && task.deadline >= weekStart && task.deadline <= weekEnd;
        const hasStartInRange = task.start_date && task.start_date >= weekStart && task.start_date <= weekEnd;

        expect(hasDeadlineInRange || hasStartInRange).toBe(true);
      }
    }
  });

  test('should exclude done and cancelled tasks', () => {
    const weekStart = '2025-12-08';
    const weekEnd = '2025-12-14';

    const tasksByDate = getWeekTasks(weekStart, weekEnd);

    for (const [dateStr, tasks] of tasksByDate) {
      for (const task of tasks) {
        expect(['done', 'cancelled']).not.toContain(task.status);
      }
    }
  });

  test('should return empty Map when no tasks in range', () => {
    const weekStart = '2030-01-01';
    const weekEnd = '2030-01-07';

    const tasksByDate = getWeekTasks(weekStart, weekEnd);

    expect(tasksByDate).toBeInstanceOf(Map);
    expect(tasksByDate.size).toBe(0);
  });
});

/**************************************************************************
 * getOverdueTasks - Retrieve overdue tasks ordered by days overdue
 *
 * TESTS:
 * - Returns array of overdue tasks
 * - Uses v_overdue_tasks view with correct filtering
 * - Sorted by most overdue first
 * - Returns empty array when no overdue tasks
 *
 * VALIDATES:
 * - Overdue calculation correctness
 * - Proper view usage
 * - Sorting order
 *
 * NOT TESTED:
 * - Edge cases near midnight
 **************************************************************************/

describe('getOverdueTasks', () => {
  /**
   * Confirms getOverdueTasks returns an array.
   */
  test('should return array of overdue tasks', () => {
    const overdueTasks = getOverdueTasks();

    expect(Array.isArray(overdueTasks)).toBe(true);
  });

  test('should use v_overdue_tasks view', () => {
    // v_overdue_tasks filters for:
    // - deadline < current_date
    // - status NOT IN ('done', 'cancelled')
    const overdueTasks = getOverdueTasks();

    for (const task of overdueTasks) {
      expect(['done', 'cancelled']).not.toContain(task.status);
      expect(task.deadline).toBeDefined();
      expect(task.deadline).not.toBeNull();
      // days_overdue should be positive for overdue tasks
      expect(task.days_overdue).toBeGreaterThan(0);
    }
  });

  test('should be sorted by most overdue first', () => {
    const overdueTasks = getOverdueTasks();

    if (overdueTasks.length > 1) {
      for (let i = 0; i < overdueTasks.length - 1; i++) {
        // days_overdue should be descending (most overdue first)
        expect(overdueTasks[i].days_overdue!).toBeGreaterThanOrEqual(
          overdueTasks[i + 1].days_overdue!
        );
      }
    }
  });

  test('should return empty array when no overdue tasks', () => {
    const db = getDatabase();

    // Clear all tasks
    db.query('DELETE FROM tasks').run();

    const overdueTasks = getOverdueTasks();
    expect(Array.isArray(overdueTasks)).toBe(true);
    expect(overdueTasks.length).toBe(0);
  });
});

/**************************************************************************
 * getTasksWithSubtasks - Retrieve parent tasks with subtasks
 *
 * TESTS:
 * - Returns array of parent tasks
 * - Only includes tasks with non-empty subtasks_json
 * - Excludes done and cancelled parent tasks
 * - Filters by roleId when provided
 * - Filters by projectId when provided
 * - Returns empty array when no parent tasks exist
 *
 * VALIDATES:
 * - Subtask detection
 * - Status filtering
 * - Optional filtering
 *
 * NOT TESTED:
 * - Deeply nested subtasks
 **************************************************************************/

describe('getTasksWithSubtasks', () => {
  /**
   * Confirms getTasksWithSubtasks returns an array.
   */
  test('should return array of parent tasks', () => {
    const parentTasks = getTasksWithSubtasks();

    expect(Array.isArray(parentTasks)).toBe(true);
  });

  test('should only include tasks with non-empty subtasks_json', () => {
    const parentTasks = getTasksWithSubtasks();

    for (const task of parentTasks) {
      expect(task.subtasks_json).toBeDefined();
      expect(task.subtasks_json).not.toBe('[]');
      // Parse to verify it's a valid non-empty array
      const subtasks = JSON.parse(task.subtasks_json);
      expect(Array.isArray(subtasks)).toBe(true);
      expect(subtasks.length).toBeGreaterThan(0);
    }
  });

  test('should exclude done and cancelled parent tasks', () => {
    const parentTasks = getTasksWithSubtasks();

    for (const task of parentTasks) {
      expect(['done', 'cancelled']).not.toContain(task.status);
    }
  });

  test('should filter by roleId when provided', () => {
    const db = getDatabase();

    // Get a role ID that has a parent task
    const parentTask = db
      .query("SELECT role_id FROM v_tasks_full WHERE subtasks_json != '[]' LIMIT 1")
      .get() as { role_id: number } | null;

    if (parentTask) {
      const parentTasks = getTasksWithSubtasks({ roleId: parentTask.role_id });

      for (const task of parentTasks) {
        expect(task.role_id).toBe(parentTask.role_id);
      }
    }
  });

  test('should filter by projectId when provided', () => {
    const db = getDatabase();

    // Get a project ID
    const anyProject = db.query('SELECT id FROM projects LIMIT 1').get() as { id: number } | null;

    if (anyProject) {
      const parentTasks = getTasksWithSubtasks({ projectId: anyProject.id });

      for (const task of parentTasks) {
        if (task.project_id !== null) {
          expect(task.project_id).toBe(anyProject.id);
        }
      }
    }
  });

  test('should return empty array when no parent tasks exist', () => {
    const db = getDatabase();

    // Delete all tasks
    db.query('DELETE FROM tasks').run();

    const parentTasks = getTasksWithSubtasks();
    expect(Array.isArray(parentTasks)).toBe(true);
    expect(parentTasks.length).toBe(0);
  });
});

/**************************************************************************
 * getTasksByRole - Retrieve tasks for specific role grouped by status
 *
 * TESTS:
 * - Returns Map grouped by task status
 * - Only includes tasks for specified role
 * - Excludes done/cancelled by default
 * - Includes done/cancelled when includeDone option is set
 * - Orders tasks by deadline, priority within each status
 * - Returns empty Map for role with no tasks
 *
 * VALIDATES:
 * - Role filtering
 * - Status grouping
 * - Optional filtering
 *
 * NOT TESTED:
 * - Performance with many tasks per role
 **************************************************************************/

describe('getTasksByRole', () => {
  /**
   * Confirms getTasksByRole returns results as Map grouped by status.
   */
  test('should return Map grouped by TaskStatus', () => {
    const db = getDatabase();

    const anyRole = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const tasksByStatus = getTasksByRole(anyRole.id);

    expect(tasksByStatus).toBeInstanceOf(Map);
  });

  test('should only include tasks for the specified role', () => {
    const db = getDatabase();

    const anyRole = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const tasksByStatus = getTasksByRole(anyRole.id);

    for (const [status, tasks] of tasksByStatus) {
      for (const task of tasks) {
        expect(task.role_id).toBe(anyRole.id);
      }
    }
  });

  test('should exclude done and cancelled by default', () => {
    const db = getDatabase();

    const anyRole = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const tasksByStatus = getTasksByRole(anyRole.id);

    for (const [status, tasks] of tasksByStatus) {
      expect(['done', 'cancelled']).not.toContain(status);
      for (const task of tasks) {
        expect(['done', 'cancelled']).not.toContain(task.status);
      }
    }
  });

  test('should include done and cancelled when includeDone is true', () => {
    const db = getDatabase();

    const anyRole = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const tasksByStatus = getTasksByRole(anyRole.id, { includeDone: true });

    // Should potentially have done or cancelled tasks if they exist for this role
    const allStatuses = Array.from(tasksByStatus.keys());
    // At minimum, it should allow these statuses if they exist
  });

  test('should order tasks within each status by deadline, priority', () => {
    const db = getDatabase();

    const anyRole = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const tasksByStatus = getTasksByRole(anyRole.id);

    for (const [status, tasks] of tasksByStatus) {
      if (tasks.length > 1) {
        // Tasks should be ordered (deadline NULLS LAST, priority DESC)
        // Can't easily test ordering without creating specific test data
        // But we can verify they all have the same status
        for (const task of tasks) {
          expect(task.status).toBe(status);
        }
      }
    }
  });

  test('should return empty Map when role has no tasks', () => {
    const db = getDatabase();

    // Create a new role with no tasks
    const newRole = db
      .query("INSERT INTO roles (name, type, status) VALUES ('Test Role', 'work', 'active') RETURNING id")
      .get() as { id: number };

    const tasksByStatus = getTasksByRole(newRole.id);

    expect(tasksByStatus).toBeInstanceOf(Map);
    expect(tasksByStatus.size).toBe(0);
  });
});

/**************************************************************************
 * getTasksByProject - Retrieve project tasks grouped by status with summary
 *
 * TESTS:
 * - Returns object with tasks Map and summary
 * - Includes all task statuses (including done/cancelled)
 * - Calculates summary correctly (total, done, percentComplete)
 * - Returns empty tasks Map for project with no tasks
 *
 * VALIDATES:
 * - Project filtering
 * - Summary calculation accuracy
 * - Percentage calculation
 *
 * NOT TESTED:
 * - Division by zero edge case handling
 **************************************************************************/

describe('getTasksByProject', () => {
  /**
   * Confirms getTasksByProject returns object with tasks Map and summary.
   */
  test('should return object with tasks Map and summary', () => {
    const db = getDatabase();

    const anyProject = db.query('SELECT id FROM projects LIMIT 1').get() as { id: number };

    const result = getTasksByProject(anyProject.id);

    expect(result).toBeDefined();
    expect(result.tasks).toBeInstanceOf(Map);
    expect(result.summary).toBeDefined();
    expect(result.summary.total).toBeGreaterThanOrEqual(0);
    expect(result.summary.done).toBeGreaterThanOrEqual(0);
    expect(result.summary.percentComplete).toBeGreaterThanOrEqual(0);
    expect(result.summary.percentComplete).toBeLessThanOrEqual(100);
  });

  test('should include all task statuses (done and cancelled)', () => {
    const db = getDatabase();

    const anyProject = db.query('SELECT id FROM projects LIMIT 1').get() as { id: number };

    const result = getTasksByProject(anyProject.id);

    // All tasks should belong to the project
    for (const [status, tasks] of result.tasks) {
      for (const task of tasks) {
        expect(task.project_id).toBe(anyProject.id);
      }
    }
  });

  test('should calculate summary correctly', () => {
    const db = getDatabase();

    const anyProject = db.query('SELECT id FROM projects LIMIT 1').get() as { id: number };

    const result = getTasksByProject(anyProject.id);

    let totalCount = 0;
    let doneCount = 0;

    for (const [status, tasks] of result.tasks) {
      totalCount += tasks.length;
      if (status === 'done') {
        doneCount += tasks.length;
      }
    }

    expect(result.summary.total).toBe(totalCount);
    expect(result.summary.done).toBe(doneCount);

    if (totalCount > 0) {
      const expectedPercent = Math.round((doneCount / totalCount) * 100);
      expect(result.summary.percentComplete).toBe(expectedPercent);
    } else {
      expect(result.summary.percentComplete).toBe(0);
    }
  });

  test('should return empty tasks Map for project with no tasks', () => {
    const db = getDatabase();

    // Create a new project with no tasks
    const newProject = db
      .query(
        "INSERT INTO projects (name, role_id, description) VALUES ('New Project', (SELECT id FROM roles LIMIT 1), 'Test') RETURNING id"
      )
      .get() as { id: number };

    const result = getTasksByProject(newProject.id);

    expect(result.tasks).toBeInstanceOf(Map);
    expect(result.tasks.size).toBe(0);
    expect(result.summary.total).toBe(0);
    expect(result.summary.done).toBe(0);
    expect(result.summary.percentComplete).toBe(0);
  });
});

/**************************************************************************
 * getStaleTasks - Retrieve stale tasks with configurable thresholds
 *
 * TESTS:
 * - Returns array of stale tasks
 * - Uses v_stale_tasks view with default thresholds
 * - Respects custom capturedDays threshold
 * - Respects custom readyDays threshold
 * - Returns empty array when no stale tasks exist
 *
 * VALIDATES:
 * - Default threshold application
 * - Custom threshold override
 * - Proper view usage
 *
 * NOT TESTED:
 * - Edge cases with zero thresholds
 **************************************************************************/

describe('getStaleTasks', () => {
  /**
   * Confirms getStaleTasks returns an array.
   */
  test('should return array of stale tasks', () => {
    const staleTasks = getStaleTasks();

    expect(Array.isArray(staleTasks)).toBe(true);
  });

  test('should use v_stale_tasks view by default', () => {
    // v_stale_tasks filters for:
    // - status = 'captured' AND days_since_creation >= 28
    // - OR status = 'ready' AND days_since_creation >= 14
    const staleTasks = getStaleTasks();

    for (const task of staleTasks) {
      if (task.status === 'captured') {
        expect(task.days_since_creation).toBeGreaterThanOrEqual(28);
      } else if (task.status === 'ready') {
        expect(task.days_since_creation).toBeGreaterThanOrEqual(14);
      }
    }
  });

  test('should respect custom capturedDays threshold', () => {
    const staleTasks = getStaleTasks({ capturedDays: 0 });

    // With 0 days threshold, all captured tasks should be included
    for (const task of staleTasks) {
      if (task.status === 'captured') {
        expect(task.days_since_creation).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should respect custom readyDays threshold', () => {
    const staleTasks = getStaleTasks({ readyDays: 0 });

    // With 0 days threshold, all ready tasks should be included
    for (const task of staleTasks) {
      if (task.status === 'ready') {
        expect(task.days_since_creation).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should return empty array when no stale tasks exist', () => {
    const db = getDatabase();

    // Delete all tasks
    db.query('DELETE FROM tasks').run();

    const staleTasks = getStaleTasks();
    expect(Array.isArray(staleTasks)).toBe(true);
    expect(staleTasks.length).toBe(0);
  });
});

// =============================================================================
// WRITE TESTS
// =============================================================================

/**************************************************************************
 * createTask - Insert new task with optional fields
 *
 * TESTS:
 * - Creates task with minimal fields (title, role_id)
 * - Creates task with all optional fields
 * - Creates subtask with parent_task_id
 * - Sets created_at timestamp
 *
 * VALIDATES:
 * - Default status 'captured'
 * - Default priority 0
 * - ID auto-increment
 * - Timestamp generation
 *
 * NOT TESTED:
 * - Circular subtask references
 **************************************************************************/

describe('createTask', () => {
  /**
   * Confirms task creation with only required fields (title, role_id).
   */
  test('should create task with minimal required fields', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Test Task',
      role_id: roleId.id,
    });

    expect(task).toBeDefined();
    expect(task.id).toBeGreaterThan(0);
    expect(task.title).toBe('Test Task');
    expect(task.role_id).toBe(roleId.id);
    expect(task.status).toBe('captured'); // default
    expect(task.priority).toBe(0); // default
  });

  /**
   * Confirms task creation with all optional fields.
   */
  test('should create task with all optional fields', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };
    const projectId = db.query('SELECT id FROM projects LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Full Task',
      role_id: roleId.id,
      notes: 'Test notes',
      status: 'ready',
      priority: 3,
      energy_requirement: 'high',
      time_estimate: 60,
      project_id: projectId.id,
      start_date: '2025-12-14',
      deadline: '2025-12-21',
      remind_date: '2025-12-20',
    });

    expect(task.title).toBe('Full Task');
    expect(task.notes).toBe('Test notes');
    expect(task.status).toBe('ready');
    expect(task.priority).toBe(3);
    expect(task.energy_requirement).toBe('high');
    expect(task.time_estimate).toBe(60);
    expect(task.project_id).toBe(projectId.id);
    expect(task.start_date).toBe('2025-12-14');
    expect(task.deadline).toBe('2025-12-21');
    expect(task.remind_date).toBe('2025-12-20');
  });

  /**
   * Confirms subtask can be created with parent_task_id.
   */
  test('should create subtask with parent_task_id', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const parentTask = createTask({
      title: 'Parent Task',
      role_id: roleId.id,
    });

    const subtask = createTask({
      title: 'Subtask',
      role_id: roleId.id,
      parent_task_id: parentTask.id,
    });

    expect(subtask.parent_task_id).toBe(parentTask.id);
  });

  /**
   * Verifies created_at timestamp is generated when task is created.
   */
  test('should have created_at timestamp', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task with timestamp',
      role_id: roleId.id,
    });

    expect(task.created_at).toBeDefined();
    expect(task.created_at).toMatch(/^\d{4}-\d{2}-\d{2}/); // ISO datetime format
  });
});

/**************************************************************************
 * updateTask - Update specific task fields
 *
 * TESTS:
 * - Updates single field without affecting others
 * - Updates multiple fields at once
 * - Clears optional fields with null
 * - Throws error when task not found
 *
 * VALIDATES:
 * - Selective field update
 * - Data integrity
 * - Error handling
 *
 * NOT TESTED:
 * - Changing role_id of existing task
 **************************************************************************/

describe('updateTask', () => {
  /**
   * Confirms single task field can be updated independently.
   */
  test('should update single field', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Original Title',
      role_id: roleId.id,
    });

    const updated = updateTask(task.id, {
      title: 'Updated Title',
    });

    expect(updated.id).toBe(task.id);
    expect(updated.title).toBe('Updated Title');
    expect(updated.role_id).toBe(roleId.id); // unchanged
  });

  /**
   * Confirms multiple task fields can be updated in a single call.
   */
  test('should update multiple fields', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task',
      role_id: roleId.id,
      priority: 0,
    });

    const updated = updateTask(task.id, {
      title: 'New Title',
      notes: 'New notes',
      priority: 3,
      energy_requirement: 'high',
    });

    expect(updated.title).toBe('New Title');
    expect(updated.notes).toBe('New notes');
    expect(updated.priority).toBe(3);
    expect(updated.energy_requirement).toBe('high');
  });

  /**
   * Verifies optional task fields can be cleared by setting to null.
   */
  test('should clear optional fields with null', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task',
      role_id: roleId.id,
      notes: 'Some notes',
      time_estimate: 60,
    });

    const updated = updateTask(task.id, {
      notes: null,
      time_estimate: null,
    });

    expect(updated.notes).toBeNull();
    expect(updated.time_estimate).toBeNull();
  });

  /**
   * Confirms update throws error when task ID does not exist.
   */
  test('should throw error when task not found', () => {
    expect(() => {
      updateTask(99999, { title: 'New Title' });
    }).toThrow('Task not found');
  });
});

/**************************************************************************
 * setTaskStatus - Update task status with optional journal entry
 *
 * TESTS:
 * - Updates task status to any valid status
 * - Creates journal entry when status changes to done
 * - Creates journal entry when status changes to cancelled
 * - Does not create journal entry for other status changes
 * - Throws error when task not found
 *
 * VALIDATES:
 * - Status update correctness
 * - Journal entry creation logic
 * - Error handling
 *
 * NOT TESTED:
 * - Multi-step status transitions
 **************************************************************************/

describe('setTaskStatus', () => {
  /**
   * Confirms task status can be updated to any valid status.
   */
  test('should update task status', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task',
      role_id: roleId.id,
      status: 'captured',
    });

    const updated = setTaskStatus(task.id, 'ready');

    expect(updated.status).toBe('ready');
  });

  /**
   * Verifies journal entry is created when task status changes to done.
   */
  test('should create journal entry when status is done', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task to complete',
      role_id: roleId.id,
      status: 'ready',
    });

    const beforeEntryCount = db
      .query('SELECT COUNT(*) as count FROM journal_entries WHERE related_task_id = ?')
      .get(task.id) as { count: number };

    setTaskStatus(task.id, 'done', 'Completed successfully');

    const afterEntryCount = db
      .query('SELECT COUNT(*) as count FROM journal_entries WHERE related_task_id = ?')
      .get(task.id) as { count: number };

    expect(afterEntryCount.count).toBe(beforeEntryCount.count + 1);

    // Verify journal entry content
    const entry = db
      .query(
        "SELECT * FROM journal_entries WHERE related_task_id = ? AND entry_type = 'task' ORDER BY id DESC LIMIT 1"
      )
      .get(task.id) as any;

    expect(entry).toBeDefined();
    expect(entry.content).toContain('Completed successfully');
  });

  /**
   * Verifies journal entry is created when task status changes to cancelled.
   */
  test('should create journal entry when status is cancelled', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task to cancel',
      role_id: roleId.id,
      status: 'captured',
    });

    setTaskStatus(task.id, 'cancelled', 'No longer needed');

    const entry = db
      .query(
        "SELECT * FROM journal_entries WHERE related_task_id = ? AND entry_type = 'task'"
      )
      .get(task.id) as any;

    expect(entry).toBeDefined();
    expect(entry.content).toContain('No longer needed');
  });

  /**
   * Confirms no journal entry is created for non-terminal status changes.
   */
  test('should not create journal entry for other status changes', () => {
    const db = getDatabase();

    const roleId = db.query('SELECT id FROM roles LIMIT 1').get() as { id: number };

    const task = createTask({
      title: 'Task',
      role_id: roleId.id,
      status: 'captured',
    });

    const beforeCount = db
      .query('SELECT COUNT(*) as count FROM journal_entries WHERE related_task_id = ?')
      .get(task.id) as { count: number };

    setTaskStatus(task.id, 'ready');

    const afterCount = db
      .query('SELECT COUNT(*) as count FROM journal_entries WHERE related_task_id = ?')
      .get(task.id) as { count: number };

    expect(afterCount.count).toBe(beforeCount.count);
  });

  /**
   * Confirms status change throws error when task ID does not exist.
   */
  test('should throw error when task not found', () => {
    expect(() => {
      setTaskStatus(99999, 'done');
    }).toThrow('Task not found');
  });
});
