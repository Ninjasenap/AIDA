# AIDA Architecture Documentation Index

> Navigation map for AI agents and developers. Each file answers specific questions.

## Quick Reference

| Topic | File | Keywords |
|-------|------|----------|
| What AIDA can do | `capabilities.md` | capabilities, features, layers, activation, support |
| Database tables | `database-schema.md` | schema, tables, tasks, roles, projects, journal, SQL |
| Query functions | `query-reference.md` | functions, API, queries, getTaskById, createTask |
| Daily check-ins | `workflows/daily-planning.md` | checkin, morning, evening, planning, energy |
| Task capture | `workflows/task-capture.md` | capture, fanga, create task, quick capture |
| Activation support | `workflows/task-activation.md` | stuck, activation, 5-minute rule, start |
| Obsidian integration | `integration/obsidian.md` | obsidian, PKM, folders, vault, markdown |
| Journal system | `integration/journal-system.md` | journal, PLAN.md, log, dual-file, entries |
| Code documentation | `code-standards.md` | comments, JSDoc, tests, documentation style |

---

## File Descriptions

### capabilities.md
**Answers:** What can AIDA do? What features exist? What is the capability architecture?

Contains the 4-layer capability model:
- Layer 1: Foundational (memory, user model, temporal intelligence)
- Layer 2: Operational (task management, scheduling, communication)
- Layer 3: Integrative (cross-domain synthesis, work-life balance)
- Layer 4: Emergent (strategic guidance, wisdom accumulation)

Also includes anti-patterns to avoid and interaction patterns.

### database-schema.md
**Answers:** What tables exist? What are the column definitions? What indexes and views are available?

Contains:
- Complete CREATE TABLE statements for roles, projects, tasks, journal_entries
- TypeScript interfaces for all entities
- Index definitions for performance
- View definitions (v_tasks_full, v_today_tasks, v_overdue_tasks, etc.)

### query-reference.md
**Answers:** How do I query the database? What functions are available?

Contains function signatures for all 36 query functions:
- Tasks: 12 functions (getTaskById, getTodayTasks, createTask, etc.)
- Roles: 7 functions (getRoleById, getActiveRoles, etc.)
- Projects: 10 functions (getProjectById, getProjectProgress, etc.)
- Journal: 7 functions (getTodayEntries, createEntry, etc.)

### workflows/daily-planning.md
**Answers:** How does daily planning work? What happens at morning/midday/evening?

Contains:
- Context-aware `/checkin` command behavior
- Morning planning workflow
- Midday check-in workflow
- Evening closure workflow
- Energy-aware scheduling rules

### workflows/task-capture.md
**Answers:** How do tasks get captured? What is the `/capture` flow?

Contains:
- Quick capture workflow
- Task parsing and classification
- Role inference
- Next-step generation

### workflows/task-activation.md
**Answers:** How does activation support work? What happens when user is stuck?

Contains:
- Smallest first step technique
- 5-minute rule implementation
- Body doubling approach
- Trigger phrases for auto-activation
- Phrases to use and avoid

### integration/obsidian.md
**Answers:** How does AIDA integrate with Obsidian? What is the folder structure?

Contains:
- PKM folder structure (0-INBOX, 0-JOURNAL, role folders)
- Read/write patterns for vault
- File naming conventions
- Role-to-folder mapping

### integration/journal-system.md
**Answers:** How does the journal system work? What is the dual-file pattern?

Contains:
- Database as source of truth (journal_entries table)
- Generated log files (YYYY-MM-DD.md)
- Temporary plan files (PLAN.md)
- Entry types (checkin, reflection, task, event, note, idea)
- Plan archiving at evening checkout

### code-standards.md
**Answers:** How should code be documented? What commenting style to use?

Contains:
- Test file documentation style (comprehensive)
- Production file documentation style (concise)
- JSDoc patterns for exported functions
- Section markers for large files

---

## Usage for AI Agents

When searching for information:

1. **Check this INDEX first** - scan the keywords column
2. **Read the specific file** - don't load everything
3. **Use grep with keywords** - files are optimized for search

Example searches:
- "How to create a task" → `query-reference.md`
- "Morning planning flow" → `workflows/daily-planning.md`
- "User is stuck" → `workflows/task-activation.md`
- "Database schema" → `database-schema.md`

---

## Document Conventions

- All files use English
- Technical terms preserved as-is
- Code blocks use TypeScript/SQL syntax
- Diagrams use ASCII art where helpful
