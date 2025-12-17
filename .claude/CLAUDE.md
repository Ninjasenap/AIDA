# AIDA - AI Digital Assistant

> Status: **Implementation Phase** - Database layer complete, skills operational

## Project Overview

AIDA is a cognitive augmentation system built on Claude Code, designed to function as an external working memory and executive support system for users with ADHD/AuDHD neurotypes.

## Repository Structure

AIDA använder **separated mode**: systemfiler i LOCAL (Git), användardata i PKM (extern mapp).

**Konfiguration:** `.system/config/aida-paths.json`

### SYSTEM FILES / Git repo
```
[AIDA]/
├── .claude/              # Claude Code configuration
│   ├── CLAUDE.md         # This file
│   ├── agents/           # Subagent definitions (3 st)
│   ├── commands/         # Slash commands (4 st)
│   ├── skills/           # Auto-invoked skills (6 st)
│   └── settings.json     # Model configuration
└── .system/              # System files
    ├── architecture/     # Design specs
    ├── config/           # aida-paths.json
    ├── data/schema/      # SQL schema (NOT the database!)
    ├── templates/        # Markdown templates
    └── tools/            # Bun/TypeScript scripts (aida-cli.ts)
```

### PKM (extern mapp, t.ex. OneDrive)
```
[AIDA-PKM]/
├── .aida/
│   ├── data/aida.db      # SQLite database
│   └── context/          # personal-profile.json
├── 0-INBOX/              # Capture bucket
├── 0-JOURNAL/            # Journals + PLAN.md
│   ├── 1-DAILY/
│   ├── 2-WEEKLY/
│   ├── 3-MONTHLY/
│   └── 4-YEARLY/
├── 0-SHARED/             # Cross-role resources
├── .obsidian/            # Obsidian vault config
└── 01-*, 02-*, etc.      # Role folders
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun (native SQLite via `bun:sqlite`) |
| Database | SQLite with WAL mode |
| Interface | Claude Code CLI |
| Documents | Markdown (Obsidian-compatible) |

**Important locations:**
- Config: `.system/config/aida-paths.json`
- Database: `<pkm>/.aida/data/aida.db`
- Profile: `<pkm>/.aida/context/personal-profile.json`


## Flödet för all interaktion med AIDA

```
Användare → Main Agent → (Subagent) → Skill → aida-cli.ts → Databas
```
## Subagents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| code-commenter | haiku | Read, Edit | Add documentation comments to code files |
| documentation-retriever | haiku | Read, Grep, Glob, WebSearch, WebFetch | Look up documentation facts |
| profile-learner | haiku | Bash, Read | Analyze patterns and suggest profile updates |


**GÖR ALDRIG direkta anrop** till `aida-cli.ts` eller databas-skript för dagliga uppgifter. Alla användarinteraktioner ska gå genom skills.

## Skills

**⚠️ ANVÄND ALLTID SKILLS ⚠️**

| Behov | Skill | Slash Command | Trigger Phrases |
|-------|-------|---------------|-----------------|
| Planera dagen | `daily-planning` | `/checkin` | "plan my day", "morning planning", "check in", "evening review" |
| Fånga uppgifter | `task-capture` | `/capture` | "I need to...", "remind me", "jag måste...", "lägg till" |
| Nästa steg/aktivering | `task-activation` | `/next` | "stuck", "can't start", "what should I do", "nästa steg" |
| Översikt/workload | `status-overview` | `/overview` | "how am I doing", "workload", "role balance", "hur ligger jag till" |
| Profiländringar | `profile-management` | - | "min profil", "uppdatera profil", "profile setup", "vem är jag", "granska observationer" |
| Tid/datumtolkning | `time-info` | - | "imorgon", "nästa vecka", "påskafton" |

## Commands

| Command | Purpose | Invokes Skill |
|---------|---------|---------------|
| `/checkin` | Context-aware daily check-in (auto-detects morning/midday/evening) | daily-planning |
| `/next` | Next recommended action with activation support | task-activation |
| `/capture [text]` | Quick task capture with minimal friction | task-capture |
| `/overview [role]` | Workload overview for role(s) | status-overview |


## Implementation Status

**Operativt:** Database layer, 6 skills, 4 commands, 3 subagents

**Planerat:** Hook configurations

**Detaljer:** Se `.system/architecture/INDEX.md`

## Development Guidelines

### Runtime & Language
- **Always use Bun** as the runtime environment
- **Always use TypeScript** for all scripts and tools
- Scripts location: `.system/tools/`
- Package management: `cd .system && bun install` (dependencies in `.system/`)
- CLI-referens för utveckling: Se `.system/architecture/query-reference.md`

### Git Branching Strategy

**Branches ENDAST för systemändringar** (`.claude/` eller `.system/`):
- Arbete sker i branches gjorda på Dev branch. Main branch är skyddad.
- Skapa branch EFTER planering, FÖRE implementation
- Namnkonvention: `feat/beskrivning` eller `fix/beskrivning`
- Committa till aktuell branch
- Merga ALDRIG branches själv!

**ALDRIG branches för PKM-data** (`0-INBOX/`, `0-JOURNAL/`, `0-SHARED/`, roll-mappar):
- Committa PKM-ändringar direkt till main

### Code Documentation
- **Always use `@agent-code-commenter`** after creating script files or test files
- Add clear JSDoc comments to all exported functions
- Document parameters, return types, and behavior

### Testing Strategy

**Test-first approach (TDD):**
1. Write tests before implementing functionality
2. Use `bun:test` for all tests
3. Tests in `.system/tools/__tests__/`
4. Keep demo data after test runs for inspection
5. Run tests: `cd .system && bun test`

## Development Notes

- Use Swedish for user-facing text (default language)
- Profile data accessed from `.system/context/personal-profile.json`
- **Database is source of truth** for journal entries (`journal_entries` table)
- **Journal markdown files** (`YYYY-MM-DD.md`) are auto-generated from database
- **Daily plan** (`0-JOURNAL/PLAN.md`) is a single file, overwritten each morning, cleared each evening
- **Plan archiving**: Focus and calendar are copied to log file at evening checkout
- **Templates** stored in `.system/templates/` using Mustache-style syntax
- ALL database operations via `aida-cli.ts`, never direct SQL

## Architecture Reference

Start from **`.system/architecture/INDEX.md`** - navigation map for all docs.

| Topic | File |
|-------|------|
| Capability model | `capabilities.md` |
| Database schema | `database-schema.md` |
| Query functions | `query-reference.md` |
| Daily workflows | `workflows/daily-planning.md` |
| Task capture | `workflows/task-capture.md` |
| Activation support | `workflows/task-activation.md` |
| Obsidian integration | `integration/obsidian.md` |
| Journal system | `integration/journal-system.md` |
| Code documentation | `code-standards.md` |
