# AIDA CLI Quick Reference

Fast lookup table for common operations. For complete documentation, see:
- Full function reference: `docs/query-reference.md`
- Detailed usage guide: `docs/cli-usage-guide.md`

## Basic Invocation

```bash
bun run src/aida-cli.ts <module> <function> [args...]
```

## Tasks

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get today's tasks | `tasks getTodayTasks` | Map<role_id, Task[]> | Only tasks with start_date <= today |
| Get this week's tasks | `tasks getWeekTasks "2025-12-16" "2025-12-22"` | Map<date, Task[]> | YYYY-MM-DD format |
| Get task by ID | `tasks getTaskById 8` | TaskFull \| null | Includes full context |
| Search tasks | `tasks searchTasks "keyword"` | TaskFull[] | Fuzzy search by title |
| Get overdue tasks | `tasks getOverdueTasks` | TaskFull[] | Sorted by days overdue |
| Get stale tasks | `tasks getStaleTasks '{"capturedDays":30}'` | TaskFull[] | Default: captured >= 28d |
| Tasks by role | `tasks getTasksByRole 2` | Map<status, Task[]> | Grouped by status |
| Tasks by project | `tasks getTasksByProject 5` | {tasks, summary} | With completion % |
| **Create task** | `tasks createTask '{"title":"...","role_id":2}'` | Task | Required: title, role_id |
| **Update task** | `tasks updateTask 8 '{"priority":3}'` | Task | Partial update |
| **Complete task** | `tasks setTaskStatus 8 done "comment"` | Task | Auto-creates journal entry |
| **Cancel task** | `tasks setTaskStatus 8 cancelled "reason"` | Task | Auto-creates journal entry |

## Roles

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get active roles | `roles getActiveRoles` | RoleSummary[] | With task counts |
| Get inactive roles | `roles getInactiveRoles` | RoleSummary[] | Historical roles |
| Get role by ID | `roles getRoleById 2` | RoleSummary \| null | With statistics |
| Roles by type | `roles getRolesByType "work"` | RoleSummary[] | Types: work, hobby, etc. |
| **Create role** | `roles createRole '{"name":"...","type":"work"}'` | Role | - |
| **Update role** | `roles updateRole 2 '{"description":"..."}'` | Role | Partial update |
| **Set role status** | `roles setRoleStatus 2 inactive` | Role | Warns if has tasks |

## Projects

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get all projects | `projects getAllProjects` | Map<status, Project[]> | Includes all statuses |
| Get active projects | `projects getActiveProjects` | ProjectFull[] | Only active projects |
| Get project by ID | `projects getProjectById 5` | ProjectFull \| null | - |
| Search projects | `projects searchProjects "AIDA"` | ProjectFull[] | Fuzzy search |
| Projects by role | `projects getProjectsByRole 2` | Map<status, Project[]> | - |
| **Project progress** | `projects getProjectProgress 5` | {project, taskProgress, criteriaProgress} \| null | Both task & criteria % |
| Get paused projects | `projects getPausedProjects` | ProjectFull[] | With idle time |
| **Create project** | `projects createProject '{"name":"...","role_id":2}'` | Project | - |
| **Update project** | `projects updateProject 5 '{"description":"..."}'` | Project | Partial update |
| **Set status** | `projects setProjectStatus 5 completed` | Project | - |
| **Update criteria** | `projects updateFinishCriteria 5 '[{...}]'` | Project | Replaces array |

## Journal

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get today's entries | `journal getTodayEntries` | JournalEntryFull[] | With full context |
| Entries by date range | `journal getEntriesByDateRange "2025-12-16" "2025-12-18"` | JournalEntryFull[] | - |
| Entries by type | `journal getEntriesByType checkin` | JournalEntryFull[] | Types: checkin, reflection, etc. |
| Entries by task | `journal getEntriesByTask 8` | JournalEntryFull[] | Chronological |
| Entries by project | `journal getEntriesByProject 5` | JournalEntryFull[] | Chronological |
| Entries by role | `journal getEntriesByRole 2` | JournalEntryFull[] | Newest first |
| **Create entry** | `journal createEntry '{"entry_type":"checkin","content":"..."}'` | JournalEntry | Auto-regenerates markdown |

**Unix/Mac:**
```bash
bun run src/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Text"}'
```

**Windows:**
```bash
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Text\"}"
```

## Journal Markdown

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Check if file exists | `journalMd journalFileExists "2025-12-18"` | boolean | - |
| Get file path | `journalMd getJournalFilePath "2025-12-18"` | string | Full path |
| Parse journal | `journalMd parseJournalMarkdown "content"` | {focus, events} | Extract plan data |
| Generate markdown | `journalMd generateJournalMarkdown "2025-12-18"` | string | From database |
| **Regenerate** | `journalMd regenerateJournalMarkdown "2025-12-18"` | string | Rebuilds from DB |
| Regenerate with plan | `journalMd regenerateJournalMarkdownWithPlan "2025-12-18" '["focus"]' '[{"time":"10:00","title":"..."}]'` | string | Prepends plan data |

## Daily Plan

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get plan path | `plan getPlanPath` | string | Path to PLAN.md |
| Check if has content | `plan planHasContent` | boolean | - |
| **Read plan** | `plan readDailyPlan` | string \| null | Markdown content |
| Parse plan | `plan parsePlanMarkdown "content"` | {focus, events} | Extract sections |
| **Create plan** | `plan createDailyPlan '{"date":"2025-12-18","events":[],"focus":[],"next_steps":[],"parked":[],"notes":""}'` | string | Overwrites existing |
| **Clear plan** | `plan clearPlan` | void | Empty file |
| **Archive to log** | `plan archivePlanToLog "2025-12-18"` | string | Copy to journal, then clear |

## Profile

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get full profile | `profile getProfile` | Profile \| null | - |
| Get section | `profile getSection identity` | any \| null | Sections: identity, neurotype, etc. |
| Get attribute | `profile getAttribute "identity.name"` | unknown | Dot notation |
| Profile exists | `profile profileExists` | boolean | - |
| Get path | `profile getProfilePath` | string | - |
| **Current time period** | `profile getCurrentTimePeriod` | TimePeriod | morning, noon, afternoon, evening, night |
| **Current energy level** | `profile getCurrentEnergyLevel` | EnergyLevel | high, medium, low |
| Get activities | `profile getActivitiesForEnergy medium` | ActivityInfo[] | For energy level |
| **Update attribute** | `profile updateAttribute "path" value user "reason"` | boolean | Auto-logs change |
| **Add observation** | `profile addObservation '{...}'` | LearningObservation | For auto-learning |
| Get observations | `profile getObservations energy` | LearningObservation[] | Optional category filter |
| **Record suggestion** | `profile recordSuggestion '{...}'` | FeedbackEntry | Track AI suggestions |
| Get acceptance rate | `profile getSuggestionAcceptanceRate task_suggestion` | number \| null | 0.0-1.0 |

## Time

| Operation | CLI Command | Returns | Notes |
|-----------|-------------|---------|-------|
| Get current time | `time getTimeInfo` | TimeInfo | All date/time fields |
| Parse expression | `time getTimeInfo "imorgon"` | TimeInfo | Swedish + ISO formats |
| Parse time | `time getTimeInfo "halv tre"` | TimeInfo | Swedish time expressions |
| Parse combined | `time getTimeInfo "imorgon klockan 15.30"` | TimeInfo | Date + time |

**TimeInfo structure:**
```typescript
{
  date: string | null,           // ISO date (YYYY-MM-DD)
  time: string | null,           // HH:mm format
  weekOfYear: string | null,     // ISO week (YYYY-W##)
  monthOfYear: string | null,    // 01-12
  monthName: string | null,      // Swedish (januari, februari, etc.)
  dayOfYear: number | null,      // 1-366
  dayOfMonth: number | null,     // 1-31
  weekdayName: string | null,    // Swedish (måndag, tisdag, etc.)
  timeUntilNextYear: string | null,  // Human-readable countdown
  daysUntil: string | null,      // Time difference from now
  timestamp: number | null       // Unix timestamp
}
```

## Entry Types (for journal.createEntry)

Valid `entry_type` values:
- `checkin` - Morning/midday/evening check-ins
- `reflection` - End-of-day reflections
- `task` - Task-related notes (auto-created by setTaskStatus)
- `event` - Event notes
- `note` - General notes
- `idea` - Ideas and insights

## Task Status Values

Valid `status` values for `setTaskStatus`:
- `captured` - Just created, needs clarification
- `clarified` - Understood but not ready
- `ready` - Ready to work on
- `planned` - Scheduled
- `active` - Currently working on
- `done` - Completed (creates journal entry)
- `cancelled` - Cancelled (creates journal entry)

## Role Types

Valid `type` values for `createRole`:
- `meta` - Meta/system roles
- `work` - Professional work
- `personal` - Personal life
- `private` - Private matters
- `civic` - Community/civic engagement
- `side_business` - Side projects
- `hobby` - Hobbies and interests

## Project Status Values

Valid `status` values:
- `active` - Currently active
- `on_hold` - Paused
- `completed` - Finished
- `cancelled` - Cancelled

## Common JSON Templates

### Create Task
```json
{
  "title": "Task title",
  "role_id": 2,
  "notes": "Optional notes",
  "priority": 0,
  "energy_requirement": "medium",
  "time_estimate": 60,
  "start_date": "2025-12-18",
  "deadline": "2025-12-25"
}
```

### Create Journal Entry
```json
{
  "entry_type": "checkin",
  "content": "Entry content here",
  "timestamp": "2025-12-18T14:00:00",
  "related_task_id": 8,
  "related_project_id": 5,
  "related_role_id": 2
}
```

### Create Daily Plan
```json
{
  "date": "2025-12-18",
  "events": [
    {"time": "10:00", "title": "Team standup"},
    {"time": "14:00", "title": "Client meeting"}
  ],
  "focus": [
    "Complete documentation",
    "Review pull requests"
  ],
  "next_steps": [
    "Plan tomorrow"
  ],
  "parked": [
    "Research new framework"
  ],
  "notes": "Energy high in morning"
}
```

## Platform-Specific Notes

### Windows JSON Escaping

Always use double-escaped quotes on Windows:

```bash
# Windows only
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Text\"}"
```

### Unix/Mac JSON Escaping

Can use single quotes:

```bash
# Unix/Mac
bun run src/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Text"}'
```

### Cross-Platform Solution

Use double-escaped quotes everywhere for maximum compatibility:

```bash
# Works on all platforms
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Text\"}"
```

## Discovering Functions

```bash
# List all modules
bun run src/aida-cli.ts unknown unknown

# List functions in a module
bun run src/aida-cli.ts tasks unknown
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `NOT NULL constraint failed` | Missing required field | Check schema in docs/database-schema.md |
| `Unknown: module.function` | Wrong function name | Use `unknown` to list available functions |
| `Binding expected...` | Wrong argument type | Check function signature in docs/query-reference.md |
| JSON parse error | Malformed JSON or Windows escaping | Use double-escaped quotes on Windows |

## Links

- **Full Reference:** `docs/query-reference.md`
- **Usage Guide:** `docs/cli-usage-guide.md`
- **Database Schema:** `docs/database-schema.md`
- **Main Instructions:** `.claude/CLAUDE.md`
