# AIDA CLI Usage Guide

Complete guide to using `aida-cli.ts` for database and utility operations.

## Overview

The AIDA CLI is the **only** interface for interacting with the database and utility functions. All operations from agents, skills, and commands must go through this CLI.

**Location:** `src/aida-cli.ts`

**Invocation Pattern:**
```bash
bun run src/aida-cli.ts <module> <function> [args...]
```

## Available Modules

| Module | Functions | Purpose |
|--------|-----------|---------|
| `tasks` | 12 | Task management and queries |
| `roles` | 7 | Role management and statistics |
| `projects` | 10 | Project management and progress tracking |
| `journal` | 6 | Journal entry database operations |
| `journalMd` | 8 | Journal markdown file generation |
| `plan` | 7 | Daily plan file management |
| `profile` | 21 | User profile management |

**Total:** 71 functions across 7 modules.

## How the CLI Works

### Argument Parsing

The CLI automatically detects and parses argument types:

1. **JSON objects/arrays** - Strings starting with `{` or `[` are parsed as JSON
2. **Numbers** - Numeric strings like `"42"` become `42`
3. **Booleans** - Strings `"true"` and `"false"` become boolean values
4. **Strings** - Everything else remains a string

**Examples:**
```bash
# Parsed as JSON object
bun run src/aida-cli.ts tasks createTask '{"title":"Fix bug","role_id":2}'

# Parsed as number
bun run src/aida-cli.ts tasks getTaskById 8

# Parsed as string
bun run src/aida-cli.ts tasks setTaskStatus 8 done "Comment here"
```

### Output Format

- **Success:** JSON output to stdout
- **Errors:** Error messages to stderr, exit code 1
- **Maps:** Serialized as JSON objects with Map keys as object keys

### Error Handling

**Unknown module:**
```bash
$ bun run src/aida-cli.ts foo bar
Unknown: foo.bar
Available modules: tasks, roles, projects, journal, journalMd, plan, profile
```

**Unknown function:**
```bash
$ bun run src/aida-cli.ts tasks invalidFunc
Unknown: tasks.invalidFunc
Available functions in tasks: createTask, getTaskById, getTodayTasks, ...
```

**Database errors:**
```bash
$ bun run src/aida-cli.ts journal createEntry '{"content":"Missing entry_type"}'
Error executing query: NOT NULL constraint failed: journal_entries.entry_type
```

## Platform-Specific Considerations

### Unix/Mac: Single Quotes

Use single quotes for JSON strings:

```bash
# ✅ Correct
bun run src/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Morning planning"}'

# ✅ Also correct for multi-line
bun run src/aida-cli.ts journal createEntry '{
  "entry_type":"checkin",
  "content":"Morning planning complete",
  "timestamp":"2025-12-18T09:00:00"
}'
```

### Windows: Double-Escaped Quotes

Windows requires double quotes with inner quotes escaped:

```bash
# ✅ Correct on Windows
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Morning planning\"}"

# ❌ This will FAIL on Windows
bun run src/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Morning planning"}'
```

### Cross-Platform Solution

For maximum compatibility, use double-escaped quotes everywhere:

```bash
# Works on both Unix and Windows
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"checkin\",\"content\":\"Text\"}"
```

## Common Usage Patterns

### Pattern 1: No Arguments

Simple queries that take no parameters:

```bash
bun run src/aida-cli.ts tasks getTodayTasks
bun run src/aida-cli.ts roles getActiveRoles
bun run src/aida-cli.ts journal getTodayEntries
bun run src/aida-cli.ts plan readDailyPlan
bun run src/aida-cli.ts profile getCurrentEnergyLevel
```

### Pattern 2: Single Argument

Functions with one required parameter:

```bash
# Number argument
bun run src/aida-cli.ts tasks getTaskById 8
bun run src/aida-cli.ts roles getRoleById 2
bun run src/aida-cli.ts projects getProjectById 5

# String argument
bun run src/aida-cli.ts journalMd regenerateJournalMarkdown "2025-12-18"
bun run src/aida-cli.ts profile getAttribute "identity.name"
```

### Pattern 3: Multiple Positional Arguments

Functions with multiple required parameters:

```bash
# Two string arguments
bun run src/aida-cli.ts tasks getWeekTasks "2025-12-16" "2025-12-22"

# Number + enum string + optional comment
bun run src/aida-cli.ts tasks setTaskStatus 8 done "Fixed the bug"

# Date + array arguments (parsed as JSON)
bun run src/aida-cli.ts journalMd regenerateJournalMarkdownWithPlan "2025-12-18" '["Task 1","Task 2"]' '[{"time":"10:00","title":"Meeting"}]'
```

### Pattern 4: Options Object

Functions accepting an optional `options` parameter:

```bash
# With boolean option
bun run src/aida-cli.ts tasks getTasksByRole 2 '{"includeDone":true}'

# With numeric options
bun run src/aida-cli.ts tasks getStaleTasks '{"capturedDays":30,"readyDays":14}'

# With multiple options
bun run src/aida-cli.ts tasks getTasksWithSubtasks '{"roleId":2,"projectId":5}'
```

### Pattern 5: Complex JSON Input

Functions requiring a structured input object:

```bash
# Create task
bun run src/aida-cli.ts tasks createTask '{
  "title":"Implement dark mode",
  "role_id":2,
  "priority":2,
  "energy_requirement":"medium",
  "time_estimate":120,
  "start_date":"2025-12-18"
}'

# Create journal entry
bun run src/aida-cli.ts journal createEntry '{
  "entry_type":"checkin",
  "content":"Midday check-in: 4 tasks complete, energy level medium",
  "timestamp":"2025-12-18T14:00:00",
  "related_role_id":2
}'

# Create daily plan
bun run src/aida-cli.ts plan createDailyPlan '{
  "date":"2025-12-18",
  "events":[{"time":"10:00","title":"Team standup"}],
  "focus":["Complete AIDA documentation","Review pull requests"],
  "next_steps":["Plan tomorrow"],
  "parked":["Research new framework"],
  "notes":"Energy high in morning"
}'
```

## Working with Return Types

### Map Objects

Functions that return `Map<K, V>` are serialized as regular JSON objects:

**Function:** `tasks.getTodayTasks()` returns `Map<number, TaskFull[]>`

**Output:**
```json
{
  "2": [
    { "id": 5, "title": "Code review", "role_id": 2 }
  ],
  "10": [
    { "id": 8, "title": "Write docs", "role_id": 10 }
  ]
}
```

Access like a regular object - keys are role IDs as strings.

### Null Returns

Some functions may return `null` if no data found:

```bash
$ bun run src/aida-cli.ts tasks getTaskById 999
null
```

Always handle null returns in your scripts.

### Boolean Returns

```bash
$ bun run src/aida-cli.ts journalMd journalFileExists "2025-12-18"
true
```

## Common Errors and Solutions

### Error: NOT NULL constraint failed

**Cause:** Missing required field in input object

**Example:**
```bash
$ bun run src/aida-cli.ts journal createEntry '{"content":"Missing entry_type"}'
Error: NOT NULL constraint failed: journal_entries.entry_type
```

**Solution:** Check schema requirements in `docs/database-schema.md`
```bash
# Fixed - includes required entry_type
bun run src/aida-cli.ts journal createEntry '{"entry_type":"note","content":"Fixed"}'
```

### Error: Binding expected string, TypedArray, boolean, number, bigint or null

**Cause:** Wrong argument type passed to function

**Example:**
```bash
# Passing object where number expected
bun run src/aida-cli.ts tasks setTaskStatus '{"id":8}' done
```

**Solution:** Check function signature in `docs/query-reference.md`
```bash
# Fixed - pass id as number, status as string
bun run src/aida-cli.ts tasks setTaskStatus 8 done
```

### Error: Unknown: module.function

**Cause:** Typo in module or function name, or function doesn't exist

**Examples:**
```bash
# Wrong module name
$ bun run src/aida-cli.ts task getTodayTasks
Unknown: task.getTodayTasks
Available modules: tasks, roles, projects, ...

# Wrong function name
$ bun run src/aida-cli.ts tasks completeTask 8
Unknown: tasks.completeTask
Available functions in tasks: setTaskStatus, ...
```

**Solution:**
- Use correct module name: `tasks` not `task`
- Use correct function name: `setTaskStatus` not `completeTask`
- List available functions: `bun run src/aida-cli.ts tasks unknown`

### Error: JSON parse error

**Cause:** Malformed JSON string or Windows escaping issue

**Solution for Windows:**
```bash
# Wrong - single quotes don't work on Windows
bun run src/aida-cli.ts journal createEntry '{"entry_type":"note"}'

# Correct - use double-escaped quotes
bun run src/aida-cli.ts journal createEntry "{\"entry_type\":\"note\",\"content\":\"Text\"}"
```

## Discovering Functions

### List All Modules

```bash
$ bun run src/aida-cli.ts unknown unknown
Unknown: unknown.unknown
Available modules: tasks, roles, projects, journal, journalMd, plan, profile
```

### List Functions in a Module

```bash
$ bun run src/aida-cli.ts tasks unknown
Unknown: tasks.unknown
Available functions in tasks: createTask, updateTask, setTaskStatus, getTaskById, searchTasks, getTodayTasks, getWeekTasks, getOverdueTasks, getTasksWithSubtasks, getTasksByRole, getTasksByProject, getStaleTasks
```

### Get Function Signature

See `docs/query-reference.md` for complete function signatures and parameter details.

## Best Practices

### 1. Always Use Cross-Platform JSON Escaping

```bash
# ✅ Good - works everywhere
"{\"key\":\"value\"}"

# ❌ Bad - fails on Windows
'{"key":"value"}'
```

### 2. Use Options Objects, Not Positional Booleans

```bash
# ✅ Correct
bun run src/aida-cli.ts tasks getTasksByRole 2 '{"includeDone":true}'

# ❌ Wrong - function signature changed
bun run src/aida-cli.ts tasks getTasksByRole 2 true
```

### 3. Handle Null Returns

```bash
# Always check for null when querying by ID
result=$(bun run src/aida-cli.ts tasks getTaskById 999)
if [ "$result" = "null" ]; then
  echo "Task not found"
fi
```

### 4. Validate JSON Before Passing

```bash
# Test JSON validity first
json='{"entry_type":"checkin","content":"Test"}'
echo "$json" | jq . > /dev/null 2>&1
if [ $? -eq 0 ]; then
  bun run src/aida-cli.ts journal createEntry "$json"
fi
```

### 5. Use Database Schema for Reference

Before creating entries, check `docs/database-schema.md` for:
- Required fields
- Valid enum values (status, entry_type, etc.)
- Field constraints

### 6. Check Return Types in Documentation

Before parsing results, check `docs/query-reference.md` for:
- Is return type a Map? (will be serialized as object)
- Can function return null?
- What fields are in the return type?

## Module-Specific Notes

### Tasks Module

- `setTaskStatus` auto-creates journal entry for `done` and `cancelled` status
- `getTodayTasks` only returns tasks with `start_date` <= today
- `getTasksByRole` returns Map grouped by TaskStatus

### Journal Module

- `createEntry` auto-regenerates journal markdown file
- `timestamp` is optional (defaults to current time)
- `timestamp` accepts flexible formats (ISO 8601, Swedish natural language)

### JournalMd Module

- These functions generate markdown FILES, not database entries
- Auto-triggered by `journal.createEntry`
- Use `regenerateJournalMarkdown` to rebuild from database

### Plan Module

- `createDailyPlan` OVERWRITES existing plan
- `archivePlanToLog` copies to journal then clears plan
- `clearPlan` empties file but keeps it

### Profile Module

- `updateAttribute` auto-logs changes to `update_log`
- `getAttribute` uses dot notation: `"identity.name"`, `"roles.1.label"`
- Most write operations require `source` parameter: `'user'`, `'auto_learn'`, `'setup_wizard'`, `'import'`

## Quick Reference

| Task | CLI Command |
|------|-------------|
| Get today's tasks | `bun run src/aida-cli.ts tasks getTodayTasks` |
| Create task | `bun run src/aida-cli.ts tasks createTask '{json}'` |
| Complete task | `bun run src/aida-cli.ts tasks setTaskStatus 8 done "comment"` |
| Search tasks | `bun run src/aida-cli.ts tasks searchTasks "keyword"` |
| Log journal entry | `bun run src/aida-cli.ts journal createEntry '{json}'` |
| Read daily plan | `bun run src/aida-cli.ts plan readDailyPlan` |
| Get current energy | `bun run src/aida-cli.ts profile getCurrentEnergyLevel` |

For complete function list, see `docs/query-reference.md`.
