# Journal System

> Dual-file pattern: Database as source of truth, markdown as generated view.

## Architecture Overview

```
journal_entries (SQLite)    →    YYYY-MM-DD.md (Markdown)
     [source of truth]              [generated view]
```

The database stores structured journal data. Markdown files are generated for:
- Human readability in Obsidian
- Search and linking
- Archive and backup

---

## Database Table

```sql
CREATE TABLE journal_entries (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp           TEXT NOT NULL DEFAULT (datetime('now')),
    entry_type          TEXT NOT NULL DEFAULT 'checkin',
    content             TEXT NOT NULL,
    related_task_id     INTEGER,
    related_project_id  INTEGER,
    related_role_id     INTEGER
);
```

**Entry Types:**

| Type | Description | When Created |
|------|-------------|--------------|
| `checkin` | Daily check-ins | `/checkin` command |
| `reflection` | Thoughts, learnings | User-initiated |
| `task` | Task completion log | Task marked done |
| `event` | Meeting/event log | After meetings |
| `note` | General notes | `/capture` (note type) |
| `idea` | Captured ideas | `/capture` (idea type) |

**Immutability:** Journal entries are append-only. No UPDATE or DELETE operations.

---

## Generated Log Files

**Location:** `<pkm>/0-JOURNAL/1-DAILY/YYYY-MM-DD.md`

### File Format

```markdown
---
date: 2025-12-17
type: daily
created_by: aida
---

# 2025-12-17 (Onsdag)

## Morgon

**Planerat fokus:**
- Task 1
- Task 2

**Kalender:**
- 09:00 Standup
- 14:00 Projektmöte

---

## Middag

**Status:** 1 av 3 fokusuppgifter klara
**Energi:** Medium

Anteckningar från check-in...

---

## Kväll

**Genomfört:**
- [x] Task 1
- [x] Extra sak som dök upp

**Fortsätter imorgon:**
- [ ] Task 2

**Reflektion:**
Bra dag, fokuserade på rätt saker.
```

### Generation Rules

1. **Create file** when first check-in of day occurs
2. **Append sections** as check-ins happen (morning → midday → evening)
3. **Regenerate** on each check-in to include latest data
4. **Include links** to related tasks and projects

---

## PLAN.md (Temporary Plan)

**Location:** `<pkm>/0-JOURNAL/PLAN.md`

### Lifecycle

```
Morning Check-in
    |
    v
Create PLAN.md
    |
    +--> Contains today's focus
    |    and calendar
    |
    v
[Throughout day]
    |
    +--> May be updated at midday
    |
    v
Evening Check-in
    |
    v
Archive to log file
    |
    v
DELETE PLAN.md
```

### Format

```markdown
# Dagens Plan

**Datum:** 2025-12-17

## Fokus

1. [ ] Primär uppgift
2. [ ] Sekundär uppgift
3. [ ] Om tid finns

## Kalender

- 09:00-09:30 Standup
- 14:00-15:00 Projektmöte

## Nästa steg

[Konkret första åtgärd]
```

### Plan Archiving

At evening check-in:
1. Read focus items and calendar from PLAN.md
2. Copy to evening section of daily log
3. Delete PLAN.md

---

## Entry Creation Flow

### Check-in Entry

```typescript
import { createEntry } from './queries/journal';

// Morning check-in
createEntry({
  entry_type: 'checkin',
  content: 'Morning planning completed. Focus: AIDA documentation.',
  related_role_id: currentRole
});

// This triggers log file regeneration
await regenerateLogFile(today);
```

### Task Completion Entry

```typescript
// When task is marked done
createEntry({
  entry_type: 'task',
  content: `Completed: ${task.title}`,
  related_task_id: task.id,
  related_role_id: task.role_id,
  related_project_id: task.project_id
});
```

### Reflection Entry

```typescript
// User-initiated reflection
createEntry({
  entry_type: 'reflection',
  content: userReflection,
  related_role_id: contextRole
});
```

---

## Query Patterns

### Get Today's Log Content

```typescript
const entries = getTodayEntries();

const byType = groupBy(entries, e => e.entry_type);
const checkins = byType.get('checkin') || [];
const tasks = byType.get('task') || [];
```

### Get Week's Reflections

```typescript
const { start, end } = getCurrentWeekRange();
const reflections = getEntriesByType('reflection', start, end);
```

### Get Project History

```typescript
const projectEntries = getEntriesByProject(projectId);
// Returns all entries related to this project, chronologically
```

---

## Log File Generation

```typescript
async function regenerateLogFile(date: string) {
  const entries = await getEntriesForDate(date);
  const plan = await readPlanIfExists();

  const markdown = generateLogMarkdown(date, entries, plan);

  const path = `${paths.pkm}/0-JOURNAL/1-DAILY/${date}.md`;
  await writeFile(path, markdown);
}

function generateLogMarkdown(date: string, entries: JournalEntry[], plan?: Plan) {
  const dayName = getDayName(date);
  let md = `---
date: ${date}
type: daily
created_by: aida
---

# ${date} (${dayName})

`;

  // Group entries by time of day
  const morning = entries.filter(e => isMorning(e.timestamp));
  const midday = entries.filter(e => isMidday(e.timestamp));
  const evening = entries.filter(e => isEvening(e.timestamp));

  if (morning.length > 0 || plan) {
    md += `## Morgon\n\n`;
    if (plan) {
      md += `**Planerat fokus:**\n${formatFocus(plan.focus)}\n\n`;
      md += `**Kalender:**\n${formatCalendar(plan.calendar)}\n\n`;
    }
    md += formatEntries(morning);
    md += `\n---\n\n`;
  }

  // ... similar for midday and evening

  return md;
}
```

---

## Important Rules

1. **Never edit generated log files** - they are regenerated on check-in
2. **Journal entries are immutable** - append only
3. **PLAN.md is deleted each evening** - don't store persistent data there
4. **Database is source of truth** - markdown is for viewing
5. **Link to tasks/projects** - use related_*_id fields for traceability

---

## Review Files

Weekly and monthly reviews follow similar patterns:

| Period | Location | When Created |
|--------|----------|--------------|
| Weekly | `0-JOURNAL/2-WEEKLY/YYYY-Www.md` | Weekly review command |
| Monthly | `0-JOURNAL/3-MONTHLY/YYYY-MM.md` | Monthly review command |
| Yearly | `0-JOURNAL/4-YEARLY/YYYY.md` | Year-end review |

These are user-initiated and may include:
- Summary of entries for the period
- Goal progress
- Reflections
- Adjustments for next period
