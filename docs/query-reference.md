# AIDA Query Function Reference

> Complete reference for all CLI-accessible functions. Database operations in `src/database/queries/`, utilities in `src/utilities/`.

## Important Rule

**ALL operations MUST go through these functions.** Direct SQL or file manipulation is NEVER used by agents, skills, commands, or hooks.

## Available Modules

Access via CLI: `bun run src/aida-cli.ts <module> <function> [args...]`

- **tasks** - Task management (12 functions)
- **roles** - Role management (7 functions)
- **projects** - Project management (10 functions)
- **journal** - Journal entry management (6 functions)
- **journalMd** - Journal markdown generation (8 functions)
- **plan** - Daily plan file management (7 functions)
- **profile** - Profile management (21 functions)
- **time** - Time parsing and utilities (1 function)

---

## Task Queries (12 functions)

**Location:** `src/database/queries/tasks.ts`

### Read Operations

```typescript
/**
 * Get task by ID with full context.
 */
function getTaskById(id: number, includeCompleted?: boolean): TaskFull | null

/**
 * Fuzzy search tasks by title.
 */
function searchTasks(query: string, options?: { includeDone?: boolean }): TaskFull[]

/**
 * Get today's actionable tasks grouped by role.
 */
function getTodayTasks(): Map<number, TaskFull[]>

/**
 * Get week's tasks grouped by date.
 * Returns Map where keys are YYYY-MM-DD date strings.
 */
function getWeekTasks(weekStart: string, weekEnd: string): Map<string, TaskFull[]>

/**
 * Get overdue tasks sorted by days overdue.
 */
function getOverdueTasks(): TaskFull[]

/**
 * Get parent tasks with subtask information.
 */
function getTasksWithSubtasks(options?: { roleId?: number; projectId?: number }): TaskFull[]

/**
 * Get tasks for a role grouped by status.
 */
function getTasksByRole(roleId: number, options?: { includeDone?: boolean }): Map<TaskStatus, TaskFull[]>

/**
 * Get tasks for a project with summary stats.
 */
function getTasksByProject(projectId: number): {
  tasks: Map<TaskStatus, TaskFull[]>;
  summary: { total: number; done: number; active: number; percentComplete: number };
}

/**
 * Get stale tasks that need attention.
 * Default: captured/clarified >= 28 days, ready >= 14 days.
 */
function getStaleTasks(options?: { capturedDays?: number; readyDays?: number }): TaskFull[]
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

**Location:** `src/database/queries/roles.ts`

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

**Location:** `src/database/queries/projects.ts`

### Read Operations

```typescript
/**
 * Get project by ID with full context.
 */
function getProjectById(id: number): ProjectFull | null

/**
 * Get all projects grouped by status (includes all statuses).
 */
function getAllProjects(): Map<ProjectStatus, ProjectFull[]>

/**
 * Get only active projects.
 */
function getActiveProjects(): ProjectFull[]

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
  project: ProjectFull;
  taskProgress: number;      // % based on tasks done
  criteriaProgress: number;  // % based on criteria done
} | null

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

## Journal Queries (6 functions)

**Location:** `src/database/queries/journal.ts`

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

## JournalMd Queries (8 functions)

**Location:** `src/utilities/journal-markdown.ts`

Functions for generating and managing journal markdown files from database entries.

### Read Operations

```typescript
/**
 * Check if a journal file exists for a specific date.
 */
function journalFileExists(date: string): boolean

/**
 * Get the path to a journal file.
 */
function getJournalFilePath(date: string): string

/**
 * Parse focus and calendar from existing journal markdown.
 */
function parseJournalMarkdown(content: string): {
  focus: string[];
  events: { time: string; title: string }[];
}
```

### Write Operations

```typescript
/**
 * Generate journal markdown for a specific date from database.
 */
function generateJournalMarkdown(date: string): string

/**
 * Write journal markdown to file.
 */
function writeJournalMarkdown(date: string, content: string): string

/**
 * Regenerate journal markdown from database entries.
 * Auto-triggered when journal entries are created.
 */
function regenerateJournalMarkdown(date: string): string

/**
 * Generate journal markdown with plan data prepended.
 * Includes focus items and calendar events at the top.
 */
function generateJournalMarkdownWithPlan(
  date: string,
  focusItems: string[],
  calendarEvents: { time: string; title: string }[]
): string

/**
 * Regenerate journal markdown with plan data.
 * Used when archiving daily plan to journal log.
 */
function regenerateJournalMarkdownWithPlan(
  date: string,
  focusItems: string[],
  calendarEvents: { time: string; title: string }[]
): string
```

---

## Plan Queries (7 functions)

**Location:** `src/utilities/daily-plan.ts`

Functions for managing the single PLAN.md file in 0-JOURNAL/.

**DailyPlan Interface:**
```typescript
interface DailyPlan {
  date: string;              // YYYY-MM-DD
  events: PlanEvent[];       // { time: string; title: string }[]
  focus: string[];
  next_steps: string[];
  parked: string[];
  notes: string;
}
```

### Read Operations

```typescript
/**
 * Get the path to the PLAN.md file.
 */
function getPlanPath(): string

/**
 * Check if the plan file has content.
 */
function planHasContent(): boolean

/**
 * Read the daily plan file.
 * Returns null if file doesn't exist.
 */
function readDailyPlan(): string | null

/**
 * Parse plan markdown to extract focus and events.
 */
function parsePlanMarkdown(content: string): {
  focus: string[];
  events: { time: string; title: string }[];
}
```

### Write Operations

```typescript
/**
 * Create/overwrite the daily plan file.
 * Overwrites existing plan - use for morning planning.
 */
function createDailyPlan(plan: DailyPlan): string

/**
 * Clear the plan file (keep file but remove content).
 * Used during evening checkout.
 */
function clearPlan(): void

/**
 * Archive plan to daily log and clear plan file.
 * Extracts focus and events, adds to journal markdown, then clears.
 */
function archivePlanToLog(date: string): string
```

---

## Profile Queries (21 functions)

**Location:** `src/utilities/profile.ts`

Functions for reading, writing, and managing user profiles. Profile stored at `<pkm>/.aida/context/personal-profile.json`.

### Core Read Functions

```typescript
/**
 * Get the full profile object.
 */
function getProfile(): Profile | null

/**
 * Get a specific section of the profile.
 */
function getSection<T extends ProfileSection>(section: T): any | null

/**
 * Get a nested attribute using dot notation.
 * @example getAttribute("identity.name") // "Henrik"
 */
function getAttribute(path: string): unknown

/**
 * Get the path to the profile file.
 */
function getProfilePath(): string

/**
 * Check if a profile exists.
 */
function profileExists(): boolean
```

### Write Functions

```typescript
/**
 * Update a specific attribute in the profile.
 * Automatically logs the change to update_log.
 */
function updateAttribute(
  path: string,
  value: unknown,
  source: ChangeSource,
  reason?: string
): boolean

/**
 * Append an item to an array in the profile.
 */
function appendToArray(
  path: string,
  item: unknown,
  source: ChangeSource
): boolean

/**
 * Log a profile change with timestamp.
 */
function logChange(change: Omit<UpdateLogEntry, 'id' | 'timestamp'>): void
```

### Validation Functions

```typescript
/**
 * Validate a profile against the schema.
 */
function validateProfile(profile: unknown): ValidationResult

/**
 * Check if a profile has all required fields.
 */
function hasRequiredFields(profile: Profile): boolean
```

### Time & Energy Functions

```typescript
/**
 * Get the current time period based on user's time_definitions.
 * Returns one of: 'morning', 'noon', 'afternoon', 'evening', 'night'
 */
function getCurrentTimePeriod(): TimePeriod

/**
 * Get activities suitable for a given energy level.
 */
function getActivitiesForEnergy(level: EnergyLevel): ActivityInfo[]

/**
 * Determine current energy level based on time and profile patterns.
 */
function getCurrentEnergyLevel(): EnergyLevel
```

### Initialization Functions

```typescript
/**
 * Initialize a new profile with minimal required fields.
 */
function initializeProfile(basicData: MinimalProfileData): Profile | null
```

### Learning Observation Functions

```typescript
/**
 * Add a new learning observation.
 */
function addObservation(
  observation: Omit<LearningObservation, 'id' | 'first_observed' | 'last_confirmed'>
): LearningObservation

/**
 * Update an existing observation.
 */
function updateObservation(
  id: string,
  updates: Partial<LearningObservation>
): boolean

/**
 * Get active observations for a category.
 */
function getObservations(category?: ObservationCategory): LearningObservation[]

/**
 * Apply a suggested update from an observation to the profile.
 */
function applyObservationSuggestion(observationId: string): boolean
```

### Feedback History Functions

```typescript
/**
 * Record a suggestion made to the user.
 */
function recordSuggestion(
  suggestion: Omit<FeedbackEntry, 'id' | 'timestamp'>
): FeedbackEntry

/**
 * Update the outcome of a suggestion.
 */
function updateSuggestionOutcome(
  id: string,
  outcome: SuggestionOutcome,
  feedback?: string
): boolean

/**
 * Get suggestion acceptance rate for a type.
 */
function getSuggestionAcceptanceRate(type: SuggestionType): number | null
```

---

## Time Queries (1 function)

**Location:** `src/utilities/time.ts`

### getTimeInfo

Parse Swedish and English date/time expressions.

**Signature:**
```typescript
async function getTimeInfo(input?: string): Promise<TimeInfo>
```

**Parameters:**
- `input` (optional) - Date/time expression. If omitted, returns current time.

**Returns:** `TimeInfo` object with all fields populated based on parsed input.

**Supported formats:**
- ISO dates: `2025-12-25`, `2025-12-25T14:30`
- Swedish relative: `idag`, `imorgon`, `i förrgår`, `nästa vecka`, `om 3 dagar`
- Swedish times: `klockan 15.30`, `halv tre`, `kvart över två`
- Combined: `imorgon klockan 15.30`
- Holidays: `påskafton`, `midsommarafton 2026`

**Examples:**
```bash
# Current time
bun run src/aida-cli.ts time getTimeInfo

# Parse Swedish expression
bun run src/aida-cli.ts time getTimeInfo "imorgon"

# Parse time
bun run src/aida-cli.ts time getTimeInfo "halv tre"

# Combined
bun run src/aida-cli.ts time getTimeInfo "nästa tisdag klockan 14.00"
```

**TimeInfo structure:**
```typescript
interface TimeInfo {
  date: string | null;              // ISO date (YYYY-MM-DD)
  time: string | null;              // HH:mm format
  weekOfYear: string | null;        // ISO week (YYYY-W##)
  monthOfYear: string | null;       // 01-12
  monthName: string | null;         // Swedish (januari, etc.)
  dayOfYear: number | null;         // 1-366
  dayOfMonth: number | null;        // 1-31
  weekdayName: string | null;       // Swedish (måndag, etc.)
  timeUntilNextYear: string | null; // Human-readable countdown
  daysUntil: string | null;         // Time difference from now
  timestamp: number | null;         // Unix timestamp
}
```

---

## CLI Usage Examples

All functions are accessed via the CLI:
```bash
bun run src/aida-cli.ts <module> <function> [args...]
```

### Get today's tasks

```bash
bun run src/aida-cli.ts tasks getTodayTasks
```

Returns Map grouped by role_id:
```json
{
  "10": [
    {
      "id": 8,
      "title": "Fix timestamp logging",
      "role_name": "Hobbies",
      "status": "ready"
    }
  ]
}
```

### Create and complete a task

```bash
# Create task
bun run src/aida-cli.ts tasks createTask '{"title":"Review PR","role_id":2,"priority":2,"energy_requirement":"medium"}'

# Complete task
bun run src/aida-cli.ts tasks setTaskStatus 8 done "Approved with minor comments"
```

### Get role overview

```bash
bun run src/aida-cli.ts roles getActiveRoles
```

### Check project progress

```bash
bun run src/aida-cli.ts projects getProjectProgress 5
```

Returns:
```json
{
  "project": { "id": 5, "name": "AIDA Development", ... },
  "taskProgress": 0.65,
  "criteriaProgress": 0.5
}
```

### Log a check-in

```bash
# Unix/Mac
bun run src/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Morning planning complete"}'

# Windows
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Morning planning complete\"}"
```

### Read daily plan

```bash
bun run src/aida-cli.ts plan readDailyPlan
```

### Get current energy level

```bash
bun run src/aida-cli.ts profile getCurrentEnergyLevel
```

Returns: `"medium"`, `"high"`, or `"low"`

---

## Platform-Specific Usage Notes

### JSON Argument Escaping

**Unix/Mac:**
```bash
# Use single quotes for JSON
bun run src/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Text here"}'
```

**Windows:**
```bash
# Use double-escaped quotes
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Text here\"}"
```

### Argument Passing Rules

The CLI automatically parses arguments:
- **JSON objects/arrays**: Strings starting with `{` or `[` are auto-parsed
- **Numbers**: Numeric strings converted to numbers
- **Booleans**: `"true"` and `"false"` converted to booleans
- **Strings**: Other values remain strings

### Options Objects

Many functions accept optional `options` objects:

```bash
# With options object
bun run src/aida-cli.ts tasks getTasksByRole 2 '{"includeDone":true}'

# With multiple optional parameters
bun run src/aida-cli.ts tasks getStaleTasks '{"capturedDays":30,"readyDays":14}'
```

### Discovering Available Functions

```bash
# See available modules
bun run src/aida-cli.ts unknown unknown
# Output: Available modules: tasks, roles, projects, journal, journalMd, plan, profile

# See functions in a module
bun run src/aida-cli.ts tasks unknown
# Output: Available functions in tasks: createTask, getTaskById, ...
```

### Map Return Types

Functions returning `Map<K, V>` serialize as JSON objects where Map keys become object keys:

```json
{
  "role_id_1": [...],
  "role_id_2": [...]
}
```

Iterate over results by treating them as regular objects.
