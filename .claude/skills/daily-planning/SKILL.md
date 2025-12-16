---
name: daily-planning
description: Context-aware daily check-ins for morning planning, midday adjustments, and evening reviews. Use when the user wants to plan their day, check in on progress, or review their evening. Auto-triggers on phrases like "plan my day", "morning planning", "let's check in", "how's my day going", "evening review".
allowed-tools: Bash, Read, Write
---

# Daily Planning Skill

## Purpose

Provides context-aware daily check-ins that adapt based on time of day, existing plan, and user energy. Helps structure the day with minimal cognitive overhead through morning planning, midday adjustments, and evening reviews.

## Triggers

- **Command**: `/checkin`
- **Auto-triggers**: "plan my day", "morning planning", "morgonplanering", "let's check in", "how's my day going", "kolla läget", "evening review", "kvällsreflektion", "day review"

## Critical Rules

- **ALL database operations MUST use `aida-cli.ts`** - See "How to Query Database" section below
- **NEVER use direct SQL queries**
- **NEVER run query modules directly** (e.g., `bun run .system/tools/database/queries/tasks.ts`)
- **Use Swedish** for user-facing output (questions, confirmations, summaries)
- **Always use** `getTimeInfo()` for date/time context
- **Read user profile** from `.system/context/personal-profile.json` via template variables

## 🚨 How to Query Database

**ONLY use the `aida-cli.ts` tool for ALL database operations:**

```bash
# CORRECT - Always use this pattern:
bun run .system/tools/aida-cli.ts <module> <function> [args...]

# WRONG - NEVER do this:
bun run .system/tools/database/queries/tasks.ts getTodayTasks  # ❌ NO!
sqlite3 .system/data/aida.db "SELECT..."                       # ❌ NO!
```

**Available modules:** `tasks`, `roles`, `projects`, `journal`, `journalMd`, `plan`

**Example queries you will need:**
```bash
# Get today's tasks
bun run .system/tools/aida-cli.ts tasks getTodayTasks

# Get overdue tasks
bun run .system/tools/aida-cli.ts tasks getOverdueTasks

# Get today's journal entries
bun run .system/tools/aida-cli.ts journal getTodayEntries

# Create journal entry (with JSON argument)
bun run .system/tools/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Morning planning"}'

# Get active roles
bun run .system/tools/aida-cli.ts roles getActiveRoles
```

## Workflow

### 1. Determine Context

**Get current time via bash:**
```bash
bun run .system/tools/utilities/time.ts getTimeInfo
```

This returns JSON with current time info including `hour`, `minute`, `date`, `weekday`, etc.

Check:
- Current time (from `hour` field in JSON output)
- Whether daily plan file exists (check via `bun run .system/tools/aida-cli.ts plan planHasContent`)
- Whether morning check-in has happened (query today's journal entries for type='checkin')

**Flow Selection Priority (first match wins):**

1. **Evening** → Time >= 18:00 AND plan exists AND not first check-in of day
2. **Midday** → Time 11:00-17:59 AND plan exists
3. **Morning** → Time < 11:00 OR first check-in of day OR no plan exists

### 2. Morning Check-in (first check-in of day)

See [MORNING-FLOW.md](MORNING-FLOW.md) for detailed procedure.

**Summary:**
1. Query today's tasks and overdue tasks
2. Read user energy patterns from profile
3. Ask user for todays schedueled events
4. Suggest 1-3 focus items based on energy + priority
5. Create daily plan markdown file
6. Create journal entry (type='checkin')
7. Provide first action suggestion

### 3. Midday Check-in (plan exists, not first or last check-in)

See [MIDDAY-FLOW.md](MIDDAY-FLOW.md) for detailed procedure.

**Summary:**
1. Review progress vs morning plan
2. Query completed tasks since morning
3. Ask about current energy level
4. Adjust remaining priorities if needed
5. Update journal entry (type='checkin')
6. Suggest next action

### 4. Evening Review (not first checkin for today, time > 18:00 or user indicates end of day)

See [EVENING-FLOW.md](EVENING-FLOW.md) for detailed procedure.

**Summary:**
1. Summarize day's accomplishments
2. Note what rolled over (not completed)
3. Create reflection journal entry (type='reflection')
4. **DELETE daily plan file** (it's only for TODAY)
5. Optionally prepare tomorrow's focus

## Query Scripts Available

**From `tasks.ts`:**
- `getTodayTasks()` - Get all tasks relevant for today (grouped by role)
- `getOverdueTasks()` - Get tasks past their deadline
- `getTasksByRole(roleId, includeCompleted?)` - Get tasks for specific role
- `getWeekTasks()` - Get tasks for the week (grouped by date)

**From `journal.ts`:**
- `getTodayEntries()` - Get all journal entries for today
- `createEntry(input)` - Create new journal entry

**From `roles.ts`:**
- `getActiveRoles()` - Get all active roles

## Supporting Documentation

- [MORNING-FLOW.md](MORNING-FLOW.md) - Detailed morning check-in procedure
- [MIDDAY-FLOW.md](MIDDAY-FLOW.md) - Midday adjustment procedure
- [EVENING-FLOW.md](EVENING-FLOW.md) - Evening closure procedure
- [ENERGY-MATCHING.md](ENERGY-MATCHING.md) - How to match tasks to energy levels

## Design Principles

1. **Activation over perfection** - Help START the day, not just plan it
2. **One thing at a time** - Suggest 1-3 focus items max, never the full list
3. **Energy-aware** - Match task suggestions to user's energy patterns
4. **Non-judgmental** - Frame progress positively, deferrals as rescheduling

## Example Invocation

**User**: "God morgon! Vad ska jag fokusera på idag?"

**Response**:
```
God morgon! ☀️

Låt mig kolla läget för dagen...

[Queries database via scripts]

Idag ser jag tre fokusområden baserat på din energi:

1. **Färdigställ arkitekturdokumentation** (Developer-rollen)
   - Du har hög energi på morgonen - perfekt för detta
   - Deadline: idag

2. **Team standup 09:00** (Work-rollen)
   - Förberedelsetid: 10 minuter

3. **Träning** (Personal-rollen)
   - Schemalagt: 18:00

Vad ska vi börja med först? Jag föreslår arkitekturdokumentationen medan energin är hög.
```
