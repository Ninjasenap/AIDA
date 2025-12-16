---
name: status-overview
description: Role and project workload overview. Use when user wants to see their current workload, role balance, or status across roles/projects. Auto-triggers on phrases like "how am I doing", "workload", "what's on my plate", "role balance", "project status", "hur ligger jag till", "arbetsbelastning", "rollbalans".
allowed-tools: Bash, Read
---

# Status Overview Skill 📊

## Purpose

Provides clear visibility into workload across roles and projects. Helps users understand their current balance, identify attention items (overdue, stale), and make informed decisions about where to focus.

## Triggers

- **Command**: `/status [role]`
- **Auto-triggers**: "how am I doing", "workload", "what's on my plate", "role balance", "project status", "hur ligger jag till", "arbetsbelastning", "rollbalans", "visa status", "hur ser det ut", "översikt"

## Critical Rules

- **ALL database operations MUST use `aida-cli.ts`** - See "How to Query Database" section below
- **NEVER use direct SQL queries**
- **NEVER run query modules directly**
- **Use Swedish** for user-facing output
- **Highlight actionable insights** - Don't just list, interpret
- **Show imbalances** - Compare actual vs target balance

## 🚨 How to Query Database

**ONLY use the `aida-cli.ts` tool for ALL database operations:**

```bash
# CORRECT - Always use this pattern:
bun run .system/tools/aida-cli.ts <module> <function> [args...]

# WRONG - NEVER do this:
bun run .system/tools/database/queries/roles.ts getActiveRoles  # ❌ NO!
```

**Queries you will need:**

```bash
# Get all active roles
bun run .system/tools/aida-cli.ts roles getActiveRoles

# Get specific role details
bun run .system/tools/aida-cli.ts roles getRoleById 1

# Get tasks by role
bun run .system/tools/aida-cli.ts tasks getTasksByRole 1

# Get overdue tasks
bun run .system/tools/aida-cli.ts tasks getOverdueTasks

# Get stale tasks
bun run .system/tools/aida-cli.ts tasks getStaleTasks

# Get projects by role
bun run .system/tools/aida-cli.ts projects getProjectsByRole 1
```

## Workflow

### Mode 1: General Overview (No Role Specified)

**Trigger:** `/status` or "hur ligger jag till"

**Steps:**
1. Fetch all active roles
2. For each role, count tasks by status
3. Calculate role balance vs targets
4. Identify attention items across all roles
5. Present summary with drill-down options

```bash
# Get roles
bun run .system/tools/aida-cli.ts roles getActiveRoles

# For each role, get task counts
bun run .system/tools/aida-cli.ts tasks getTasksByRole [role_id]

# Get attention items
bun run .system/tools/aida-cli.ts tasks getOverdueTasks
bun run .system/tools/aida-cli.ts tasks getStaleTasks
```

### Mode 2: Role-Specific Overview

**Trigger:** `/status Developer` or "hur ligger Developer-rollen till"

**Steps:**
1. Fetch role details
2. Get all tasks for role (grouped by status)
3. Get projects for role
4. Identify role-specific attention items
5. Present detailed breakdown

```bash
# Get role details
bun run .system/tools/aida-cli.ts roles getRoleById [id]

# Get role tasks
bun run .system/tools/aida-cli.ts tasks getTasksByRole [id]

# Get role projects
bun run .system/tools/aida-cli.ts projects getProjectsByRole [id]
```

## Supporting Documentation

- [ROLE-BALANCE.md](ROLE-BALANCE.md) - Balance target calculations
- [ATTENTION-FLAGS.md](ATTENTION-FLAGS.md) - What deserves attention

## Output Formats

### General Overview Format

```
📊 Din arbetsbelastning

┌─────────────────────────────────────────┐
│ Roll                │ Tasks │ Balans   │
├─────────────────────────────────────────┤
│ 💼 Systemutvecklare │  12   │ ✅ 45%   │
│ 🏠 Förälder         │   5   │ ⚠️ 15%   │
│ 🎮 Hobbyutvecklare  │   8   │ ✅ 30%   │
│ 🏛️ Ordförande       │   3   │ ✅ 10%   │
└─────────────────────────────────────────┘

⚠️ Kräver uppmärksamhet:
• 2 försenade tasks
• 1 stale task (captured >28 dagar)

💡 Förälder-rollen har för lite fokus (15% vs mål 25%)

Vill du se detaljer för en roll? (/status [roll])
```

### Role-Specific Format

```
📊 Systemutvecklare - Status

📈 Uppgifter:
• Captured: 3
• Ready: 5
• Planned: 2
• Active: 2
• Done (denna vecka): 4

📁 Projekt:
• AIDA (8 tasks, 2 aktiva)
• Legacy Migration (4 tasks, 0 aktiva)

⚠️ Kräver uppmärksamhet:
• "API-dokumentation" - Försenad 3 dagar
• "Refaktorera auth" - Stale (captured 35 dagar sen)

🎯 Förslag:
1. Ta hand om försenad task först
2. Besluta om stale task (gör/ta bort/flytta)
```

## Design Principles

1. **Actionable insights** - Don't just show data, interpret it
2. **Highlight problems** - Overdue and stale items need attention
3. **Show balance** - Compare actual vs target role distribution
4. **Enable drill-down** - Overview → Role → Task
5. **No overwhelm** - Summary first, details on request

## Example Invocations

### Example 1: General Check

**User**: "/status"

**Response**:
```
📊 Din arbetsbelastning just nu

Du har totalt 28 uppgifter fördelade på 4 roller:

🔹 Systemutvecklare: 12 tasks (43%)
🔹 Förälder: 5 tasks (18%)
🔹 Hobbyutvecklare: 8 tasks (29%)
🔹 Ordförande: 3 tasks (10%)

⚠️ Uppmärksamhetspunkter:
• 2 försenade tasks (båda i Systemutvecklare)
• Förälder-rollen under mål (18% vs 25%)

Vill du gå djupare i någon roll?
```

### Example 2: Role-Specific

**User**: "/status Förälder"

**Response**:
```
📊 Förälder - Status

📋 Uppgifter (5 totalt):
✅ Captured: 2
✅ Ready: 2
✅ Planned: 1
⏳ Active: 0

Inga försenade eller stale tasks! 👏

📅 Kommande:
• "Boka tandläkartid" - Deadline imorgon

💡 Du har inga aktiva tasks just nu.
Vill du aktivera någon? (/next)
```

### Example 3: Project Status

**User**: "Hur går AIDA-projektet?"

**Response**:
```
📊 AIDA - AI Digital Assistant

📈 Progress: 6/15 tasks klara (40%)

📋 Status:
• Captured: 3
• Ready: 4
• Planned: 2
• Active: 1
• Done: 5

⏱️ Aktiv task:
"Implementera skills-system"

⚠️ Uppmärksamhet:
• "Skriv tester" - Ready i 14 dagar (stale?)

🎯 Nästa logiska steg:
Ta hand om aktiva tasken, sedan "Skriv tester"
```
