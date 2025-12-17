# AIDA Query Function Reference

> 36 TypeScript functions for database operations. All in `.system/tools/database/queries/`.

## Important Rule

**ALL database operations MUST go through these functions.** Direct SQL is NEVER used by agents, skills, commands, or hooks.

---

## Task Queries (12 functions)

**Location:** `queries/tasks.ts`

### Read Operations

```typescript
/**
 * Get task by ID with full context.
 */
function getTaskById(id: number, includeCompleted?: boolean): TaskFull | null

/**
 * Fuzzy search tasks by title.
 */
function searchTasks(searchText: string, includeCompleted?: boolean): TaskFull[]

/**
 * Get today's actionable tasks grouped by role.
 */
function getTodayTasks(): Map<number, TaskFull[]>

/**
 * Get week's tasks grouped by date.
 */
function getWeekTasks(): Map<string, TaskFull[]>

/**
 * Get overdue tasks sorted by days overdue.
 */
function getOverdueTasks(): TaskFull[]

/**
 * Get parent tasks with subtask information.
 */
function getTasksWithSubtasks(roleId?: number, projectId?: number): TaskFull[]

/**
 * Get tasks for a role grouped by status.
 */
function getTasksByRole(roleId: number, includeCompleted?: boolean): Map<TaskStatus, TaskFull[]>

/**
 * Get tasks for a project with summary stats.
 */
function getTasksByProject(projectId: number): {
  tasks: Map<TaskStatus, TaskFull[]>;
  summary: { total: number; done: number; active: number; percent: number };
}

/**
 * Get stale tasks that need attention.
 * Default: captured/clarified >= 28 days, ready >= 14 days.
 */
function getStaleTasks(capturedDays?: number, readyDays?: number): TaskFull[]
```

### Write Operations

```typescript
/**
 * Create a new task.
 */
function createTask(input: CreateTaskInput): Task

/**
 * Update an existing task (partial update).
 */
function updateTask(id: number, input: UpdateTaskInput): Task | null

/**
 * Set task status with automatic journal entry.
 * For 'done' or 'cancelled', creates a journal entry.
 */
function setTaskStatus(id: number, status: TaskStatus, comment?: string): Task | null
```

---

## Role Queries (7 functions)

**Location:** `queries/roles.ts`

### Read Operations

```typescript
/**
 * Get role by ID with statistics.
 */
function getRoleById(id: number): RoleSummary | null

/**
 * Get all active roles with stats.
 */
function getActiveRoles(): RoleSummary[]

/**
 * Get all inactive/historical roles.
 */
function getInactiveRoles(): RoleSummary[]

/**
 * Get roles by type.
 */
function getRolesByType(type: RoleType, includeInactive?: boolean): RoleSummary[]
```

### Write Operations

```typescript
/**
 * Create a new role.
 */
function createRole(input: CreateRoleInput): Role

/**
 * Update an existing role (partial update).
 */
function updateRole(id: number, input: UpdateRoleInput): Role | null

/**
 * Set role status.
 * Warns if role has linked tasks and going inactive.
 */
function setRoleStatus(id: number, status: RoleStatus): Role | null
```

---

## Project Queries (10 functions)

**Location:** `queries/projects.ts`

### Read Operations

```typescript
/**
 * Get project by ID with full context.
 */
function getProjectById(id: number): ProjectFull | null

/**
 * Get all projects grouped by status.
 */
function getAllProjects(includeCompleted?: boolean): Map<ProjectStatus, ProjectFull[]>

/**
 * Fuzzy search projects by name.
 */
function searchProjects(searchText: string, includeCompleted?: boolean): ProjectFull[]

/**
 * Get projects for a role grouped by status.
 */
function getProjectsByRole(roleId: number): Map<ProjectStatus, ProjectFull[]>

/**
 * Get project progress metrics.
 */
function getProjectProgress(projectId: number): {
  taskProgress: number;      // % based on tasks done
  criteriaProgress: number;  // % based on criteria done
  combined: number;          // average of both
}

/**
 * Get paused projects with idle time.
 */
function getPausedProjects(): ProjectFull[]
```

### Write Operations

```typescript
/**
 * Create a new project.
 */
function createProject(input: CreateProjectInput): Project

/**
 * Update an existing project (partial update).
 */
function updateProject(id: number, input: UpdateProjectInput): Project | null

/**
 * Set project status.
 */
function setProjectStatus(id: number, status: ProjectStatus): Project | null

/**
 * Update finish criteria (replaces entire array).
 */
function updateFinishCriteria(projectId: number, criteria: FinishCriterion[]): Project | null
```

---

## Journal Queries (7 functions)

**Location:** `queries/journal.ts`

### Read Operations

```typescript
/**
 * Get today's journal entries with context.
 */
function getTodayEntries(): JournalEntryFull[]

/**
 * Get all entries for a task (chronological).
 */
function getEntriesByTask(taskId: number): JournalEntryFull[]

/**
 * Get all entries for a project (chronological).
 */
function getEntriesByProject(projectId: number): JournalEntryFull[]

/**
 * Get all entries for a role (newest first).
 */
function getEntriesByRole(roleId: number): JournalEntryFull[]

/**
 * Get entries by type with optional date range.
 */
function getEntriesByType(type: EntryType, startDate?: string, endDate?: string): JournalEntryFull[]

/**
 * Get entries within date range.
 */
function getEntriesByDateRange(startDate: string, endDate: string): JournalEntryFull[]
```

### Write Operations

```typescript
/**
 * Create a new journal entry.
 * Note: Journal entries are immutable - no update or delete.
 */
function createEntry(input: CreateEntryInput): JournalEntry
```

---

## Usage Examples

### Get today's ready tasks

```typescript
import { getTodayTasks } from '.system/tools/database/queries/tasks';

const tasksByRole = getTodayTasks();
for (const [roleId, tasks] of tasksByRole) {
  console.log(`Role ${roleId}: ${tasks.length} tasks`);
}
```

### Create and complete a task

```typescript
import { createTask, setTaskStatus } from '.system/tools/database/queries/tasks';

const task = createTask({
  title: 'Review PR',
  role_id: 2,
  priority: 2,
  energy_requirement: 'medium'
});

// Later...
setTaskStatus(task.id, 'done', 'Approved with minor comments');
```

### Get role overview

```typescript
import { getActiveRoles } from '.system/tools/database/queries/roles';

const roles = getActiveRoles();
for (const role of roles) {
  console.log(`${role.name}: ${role.active_tasks} active, ${role.overdue_tasks} overdue`);
}
```

### Check project progress

```typescript
import { getProjectProgress } from '.system/tools/database/queries/projects';

const progress = getProjectProgress(5);
console.log(`Task completion: ${progress.taskProgress}%`);
console.log(`Criteria completion: ${progress.criteriaProgress}%`);
```

### Log a check-in

```typescript
import { createEntry } from '.system/tools/database/queries/journal';

createEntry({
  entry_type: 'checkin',
  content: 'Morning planning complete. Focus on AIDA architecture today.',
  related_role_id: 2
});
```

---

## Helper Functions

**Location:** `helpers.ts`

```typescript
/**
 * Parse JSON subtask array from database.
 */
function parseSubtasks(json: string): SubtaskInfo[]

/**
 * Parse JSON finish criteria from database.
 */
function parseFinishCriteria(json: string | null): FinishCriterion[]

/**
 * Get current ISO week date range (Monday-Sunday).
 */
function getCurrentWeekRange(): { start: string; end: string }

/**
 * Group array items by a key function.
 */
function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]>
```

---

## Common Import Pattern

```typescript
// Query functions
import {
  getTaskById,
  getTodayTasks,
  createTask,
  setTaskStatus
} from '.system/tools/database/queries/tasks';

import { getActiveRoles, getRoleById } from '.system/tools/database/queries/roles';

import { getAllProjects, getProjectProgress } from '.system/tools/database/queries/projects';

import { getTodayEntries, createEntry } from '.system/tools/database/queries/journal';

// Types
import type { Task, TaskFull, CreateTaskInput, TaskStatus } from '.system/tools/database/types';

// Helpers
import { parseSubtasks, getCurrentWeekRange } from '.system/tools/database/helpers';
```
