---
name: task-capture
description: Quick, structured task capture with automatic processing. Use when user wants to capture a task, add a todo, or remember something. Auto-triggers on phrases like "I need to...", "remind me to...", "add task", "new todo", "capture this", "jag måste...", "lägg till uppgift", "fånga detta".
allowed-tools: Bash, Read
---

# Task Capture Skill 📥

## Purpose

Provides minimal-friction task capture that processes natural language input into structured tasks. Focuses on SPEED over perfectionism - get it captured, refine later if needed.

## Triggers

- **Command**: `/capture [text]`
- **Auto-triggers**: "I need to...", "remind me to...", "add task", "new todo", "capture this", "jag måste...", "lägg till uppgift", "fånga detta", "kom ihåg att...", "todo:", "task:"

## Critical Rules

- **ALL database operations MUST use `aida-cli.ts`** - See "How to Query Database" section below
- **NEVER use direct SQL queries**
- **NEVER run query modules directly** (e.g., `bun run src/database/queries/tasks.ts`)
- **Use Swedish** for user-facing output
- **SPEED is key** - Capture first, refine later
- **Ask ONLY if role is ambiguous** - Don't over-ask, infer when possible

## 🚨 How to Query Database

**ONLY use the `aida-cli.ts` tool for ALL database operations:**

```bash
# CORRECT - Always use this pattern:
bun run src/aida-cli.ts <module> <function> [args...]

# WRONG - NEVER do this:
bun run src/database/queries/tasks.ts createTask '...'  # ❌ NO!
sqlite3 .system/data/aida.db "INSERT INTO..."                     # ❌ NO!
```

**Queries you will need:**

```bash
# Create a new task
bun run src/aida-cli.ts tasks createTask '{"title":"Task title","role_id":1}'

# Search for existing tasks (to avoid duplicates)
bun run src/aida-cli.ts tasks searchTasks "keyword"

# Get active roles (for role selection)
bun run src/aida-cli.ts roles getActiveRoles

# Search projects (for project association)
bun run src/aida-cli.ts projects searchProjects "keyword"

# Create journal entry (to log the capture)
bun run src/aida-cli.ts journal createEntry '{"entry_type":"task","content":"Captured: [task title]"}'
```

## Workflow

### 1. Parse Input

See [PARSING-RULES.md](PARSING-RULES.md) for detailed parsing rules.

**Extract from natural language:**
- Task title (required)
- Deadline/dates (if mentioned)
- Role hints (if mentioned)
- Project hints (if mentioned)
- Energy requirement hints (if inferrable)
- Priority hints (if mentioned)

### 2. Infer Role

See [ROLE-INFERENCE.md](ROLE-INFERENCE.md) for inference rules.

**First: Try to infer automatically:**
- Keywords → Role mapping
- Project context → Role
- Previous conversation context → Role

**Only if ambiguous: Ask user**
```
Vilken roll gäller detta?
- Systemutvecklare
- Digitaliseringssamordnare
- Förälder
- [etc...]
```

### 3. Create Task

```bash
bun run src/aida-cli.ts tasks createTask '{
  "title": "[parsed title]",
  "role_id": [inferred or selected role id],
  "deadline": "[parsed date or null]",
  "priority": [0-3, default 0],
  "energy_requirement": "[low/medium/high or null]",
  "project_id": [associated project or null]
}'
```

### 4. Create Journal Entry

```bash
bun run src/aida-cli.ts journal createEntry '{
  "entry_type": "task",
  "content": "Fångade: [task title]",
  "related_task_id": [created task id]
}'
```

### 5. Confirm & Suggest Next Step

**Quick confirmation (Swedish):**
```
✅ Fångat: "[task title]"
   Roll: [role name]
   [Deadline: datum] (if set)

Vill du göra något mer med den? (annars är den sparad i captured-status)
```

**Optional follow-ups:**
- "Vill du sätta en deadline?"
- "Ska vi aktivera den nu?" (triggers task-activation)
- "Finns det fler saker att fånga?"

## Supporting Documentation

- [PARSING-RULES.md](PARSING-RULES.md) - How to parse natural language input
- [ROLE-INFERENCE.md](ROLE-INFERENCE.md) - Rules for inferring roles
- [QUICK-CAPTURE.md](QUICK-CAPTURE.md) - Minimal-friction capture flow

## Design Principles

1. **Speed over perfection** - Capture now, refine later
2. **Minimal questions** - Infer as much as possible
3. **Non-blocking** - Don't force user to fill in all fields
4. **Confirm, don't interrogate** - Show what was captured, offer to adjust

## Example Invocations

### Example 1: Simple Capture
**User**: "Jag måste ringa tandläkaren"

**Response**:
```
✅ Fångat: "Ringa tandläkaren"
   Roll: Förälder (inferred from personal context)

Sparad! Något mer?
```

### Example 2: With Deadline
**User**: "/capture Skicka rapporten till chefen innan fredag"

**Response**:
```
✅ Fångat: "Skicka rapporten till chefen"
   Roll: [Frågar om det är oklart]
   Deadline: 2025-12-20 (fredag)

Sparad med deadline! 📅
```

### Example 3: With Context
**User**: "Ny task: Implementera auth-modulen för AIDA-projektet"

**Response**:
```
✅ Fångat: "Implementera auth-modulen"
   Roll: Systemutvecklare
   Projekt: AIDA - AI Digital Assistant
   Energi: Hög (inferred from "implementera")

Sparad! Ska vi sätta en deadline?
```
