# AIDA - AI Digital Assistant

> Status: **Implementation Phase** - Database layer complete, skills operational

## Project Overview

AIDA is a cognitive augmentation system built on Claude Code, designed to function as an external working memory and executive support system for users with ADHD/AuDHD neurotypes.

## Installation

**Prerequisites:**
- Bun runtime (v1.0+) - https://bun.sh

**First-time setup:**

```bash
# Mac/Linux
./install.sh

# Windows (PowerShell)
.\install.ps1
```

The install script will:
1. Check for Bun installation
2. Install npm dependencies (`cd .system && bun install`)
3. Create user folders (0-INBOX, 0-JOURNAL with subfolders, 0-SHARED)
4. Initialize the SQLite database

**Note:** User folders (0-INBOX/, 0-JOURNAL/, 0-SHARED/, and role folders 01-*, 02-*) are gitignored and created by the install script.

## Repository Structure

```
AIDA/
├── .claude/              # Claude Code configuration
│   ├── CLAUDE.md         # This file
│   ├── agents/           # Subagent definitions
│   │   ├── code-commenter.md         # Documentation comments (haiku)
│   │   └── documentation-retriever.md # Doc lookup (haiku)
│   ├── commands/         # Slash commands
│   │   ├── checkin.md    # /checkin - Daily check-ins
│   │   ├── capture.md    # /capture - Quick task capture
│   │   ├── next.md       # /next - Next action suggestion
│   │   └── status.md     # /status - Workload overview
│   ├── skills/           # Auto-invoked skills
│   │   ├── task-activation/   # Help START tasks (ADHD support)
│   │   ├── task-capture/      # Quick task capture
│   │   ├── daily-planning/    # Morning/midday/evening check-ins
│   │   ├── status-overview/   # Workload visibility
│   │   └── time-info/         # Swedish date/time parsing
│   └── settings.json     # Model configuration
├── .system/              # AI-agnostic system data
│   ├── architecture/     # Design specs and coding standards
│   ├── context/          # User profile data
│   ├── data/             # SQLite database (aida.db)
│   ├── tools/            # Bun/TypeScript scripts
│   │   ├── aida-cli.ts   # CLI for all database operations
│   │   ├── database/     # Database layer
│   │   │   ├── queries/  # Query functions (tasks, roles, projects, journal)
│   │   │   ├── connection.ts
│   │   │   ├── helpers.ts
│   │   │   └── types.ts
│   │   └── utilities/    # Helper utilities (time, symbols)
│   ├── bunfig.toml       # Bun configuration
│   ├── package.json      # Dependencies (chrono-node, @types/bun)
│   ├── bun.lock          # Lock file (gitignored)
│   └── node_modules/     # Dependencies (gitignored)
├── 0-INBOX/              # Capture bucket
├── 0-JOURNAL/            # Journals (markdown)
│   ├── 1-DAILY/          # Daily journal entries
│   ├── 2-WEEKLY/         # Weekly reviews
│   ├── 3-MONTHLY/        # Monthly reviews
│   └── 4-YEARLY/         # Yearly reviews
└── 0-SHARED/             # Cross-role shared resources
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun (native SQLite via `bun:sqlite`) |
| Database | SQLite with WAL mode |
| Interface | Claude Code CLI |
| Documents | Markdown (Obsidian-compatible) |

**Important locations:**
- Database: `.system/data/aida.db`
- Package management: `.system/package.json` (dependencies located in `.system/`)
- Install dependencies: `cd .system && bun install`

## ⚠️ CRITICAL DATABASE ACCESS RULE ⚠️

**ALL database operations MUST use the `aida-cli.ts` tool**

**NEVER use:**
- Direct SQL queries (`sqlite3 ...`)
- Query modules directly (`bun run .system/tools/database/queries/tasks.ts`)
- Temporary wrapper scripts

**ONLY CORRECT APPROACH:**
```bash
# Use aida-cli.ts for ALL database operations
bun run .system/tools/aida-cli.ts <module> <function> [args...]
```

**Available modules:** `tasks`, `roles`, `projects`, `journal`

**Common examples:**
```bash
# Get today's tasks
bun run .system/tools/aida-cli.ts tasks getTodayTasks

# Get overdue tasks
bun run .system/tools/aida-cli.ts tasks getOverdueTasks

# Get today's journal entries
bun run .system/tools/aida-cli.ts journal getTodayEntries

# Create journal entry (JSON argument)
bun run .system/tools/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Morning check-in"}'

# Get active roles
bun run .system/tools/aida-cli.ts roles getActiveRoles

# Get week tasks (with date arguments)
bun run .system/tools/aida-cli.ts tasks getWeekTasks "2025-12-09" "2025-12-15"

# Create task
bun run .system/tools/aida-cli.ts tasks createTask '{"title":"Task title","role_id":1}'

# Set task status
bun run .system/tools/aida-cli.ts tasks setTaskStatus 123 "done"
```

**Available query functions:**
- **tasks**: 12 functions (getTaskById, getTodayTasks, getWeekTasks, getOverdueTasks, getStaleTasks, getTasksByRole, getTasksByProject, searchTasks, getTasksWithSubtasks, createTask, updateTask, setTaskStatus)
- **roles**: 7 functions (getRoleById, getActiveRoles, getInactiveRoles, getRolesByType, createRole, updateRole, setRoleStatus)
- **projects**: 10 functions (getProjectById, getAllProjects, getProjectsByRole, searchProjects, getProjectProgress, getPausedProjects, createProject, updateProject, setProjectStatus, updateFinishCriteria)
- **journal**: 7 functions (getTodayEntries, getEntriesByTask, getEntriesByProject, getEntriesByRole, getEntriesByType, getEntriesByDateRange, createEntry)

See `.system/architecture/system-architecture.md` for complete function signatures.

## Implementation Status

### Fully Implemented ✅
- Directory structure and organization
- Architecture documentation (agent, system, solution)
- Database schema (4 tables, 6 views, indexes, triggers)
- Database connection singleton with WAL mode
- Type definitions for all entities
- Helper utilities (grouping, parsing, date calculations)
- **36 query functions** across 4 modules (tasks, roles, projects, journal)
- CLI tool (`aida-cli.ts`) for safe database access
- Database management tool (init/delete/reset)
- Comprehensive test suite with demo data
- Symbol/emoji mappings for statuses
- Swedish time parsing utility
- **5 skills** with supporting documentation
- **4 commands** linked to skills
- **2 subagents** (code-commenter, documentation-retriever)

### Ready for Use
- `/checkin` - Context-aware daily check-in (morning/midday/evening)
- `/next` - Get next action with activation support
- `/capture [text]` - Quick task capture
- `/status [role]` - Workload overview

### Planned
- Hook configurations (SessionStart, PostToolUse)
- Daily plan file management (create/delete)
- Journal markdown generation from database

## Commands

| Command | Purpose | Invokes Skill |
|---------|---------|---------------|
| `/checkin` | Context-aware daily check-in (auto-detects morning/midday/evening) | daily-planning |
| `/next` | Next recommended action with activation support | task-activation |
| `/capture [text]` | Quick task capture with minimal friction | task-capture |
| `/status [role]` | Workload overview for role(s) | status-overview |

## Skills (Auto-Invoked)

| Skill | Purpose | Trigger Phrases |
|-------|---------|-----------------|
| task-activation | Help START tasks (ADHD support) | "stuck", "can't start", "what should I do", "nästa steg" |
| task-capture | Quick task capture | "I need to...", "remind me", "jag måste...", "lägg till" |
| daily-planning | Daily check-ins | "plan my day", "morning planning", "check in", "evening review" |
| status-overview | Workload visibility | "how am I doing", "workload", "role balance", "hur ligger jag till" |
| time-info | Swedish date/time parsing | "imorgon", "nästa vecka", "påskafton" |

## Subagents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| code-commenter | haiku | Read, Edit | Add documentation comments to code files |
| documentation-retriever | haiku | Read, Grep, Glob, WebSearch, WebFetch | Look up documentation facts |

## Design Principles

Keep these in mind when implementing:
1. **Activation over perfection** - Help START, not just plan
2. **One thing at a time** - Never overwhelm with options
3. **Energy-aware** - Match tasks to current capacity
4. **Non-judgmental** - Support without guilt

## Development Guidelines

### Runtime & Language
- **Always use Bun** as the runtime environment
- **Always use TypeScript** for all scripts and tools
- Scripts location: `.system/tools/`
- Package management: `cd .system && bun install` (dependencies in `.system/`)
- Run scripts with: `bun run .system/tools/<script.ts>`

### Code Documentation
- **Always use `@agent-code-commenter`** after creating script files or test files
- Add clear JSDoc comments to all exported functions
- Document parameters, return types, and behavior

### Testing Strategy

**Test-first approach:**
1. Create test scenarios BEFORE implementing functionality
2. Tests go in `.system/tools/__tests__/` or module-specific `__tests__/` directories
3. Use `bun:test` for all tests

**Demo data handling:**
- Before each test run: Reset database and populate with demo data
- After test run: **Keep demo data** (do not clean up)
- This allows inspection of tables and data between test runs

**Test execution:**
```bash
# Run from .system directory (where package.json is located)
cd .system && bun test

# Or run specific test file
cd .system && bun test tools/utilities/__tests__/time.test.ts
```

## Development Notes

- Use Swedish for user-facing text (default language)
- Profile data accessed from `.system/context/personal-profile.json`
- Journal entries stored in SQLite (`journal_entries` table)
- Daily plans are temporary markdown files, deleted at evening check-in
- ALL database operations via `aida-cli.ts`, never direct SQL

## Architecture Reference

Detailed specifications in `.system/architecture/`:
- `agent-architecture.md` - Agent hierarchy, skills, commands, hooks design
- `solution-architecture.md` - Integration patterns, data flows
- `system-architecture.md` - Database schema, TypeScript interfaces
- `personal-assistant-requirements.md` - Functional requirements
- `personal-assistant-capabilities-spec.md` - Capability specifications
