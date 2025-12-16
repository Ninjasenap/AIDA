---
name: task-activation
description: Help user START tasks with activation support for ADHD. Use when user is stuck, overwhelmed, or asking what to do next. Auto-triggers on phrases like "I'm stuck", "can't get started", "overwhelmed", "what should I do", "next step", "where do I start", "jag fastnar", "kan inte börja", "vad ska jag göra", "nästa steg".
allowed-tools: Bash, Read
---

# Task Activation Skill 🚀

## Purpose

Provides activation support to help users START tasks, not just plan them. Addresses executive function challenges by removing barriers to beginning. Based on ADHD-friendly techniques like the 5-minute rule and smallest-step extraction.

## Triggers

- **Command**: `/next`
- **Auto-triggers**: "I'm stuck", "can't get started", "overwhelmed", "what should I do", "next step", "where do I start", "jag fastnar", "kan inte börja", "vad ska jag göra", "nästa steg", "hjälp mig börja", "orkar inte", "vet inte var jag ska börja"

## Critical Rules

- **ALL database operations MUST use `aida-cli.ts`** - See "How to Query Database" section below
- **NEVER use direct SQL queries**
- **NEVER run query modules directly**
- **NEVER show full task list** - Suggest ONE thing at a time
- **Use Swedish** for user-facing output
- **Non-judgmental tone** - No guilt, no pressure
- **Frame deferrals positively** - "Låt oss flytta den" not "Du missade"

## 🚨 How to Query Database

**ONLY use the `aida-cli.ts` tool for ALL database operations:**

```bash
# CORRECT - Always use this pattern:
bun run .system/tools/aida-cli.ts <module> <function> [args...]

# WRONG - NEVER do this:
bun run .system/tools/database/queries/tasks.ts getTodayTasks  # ❌ NO!
```

**Queries you will need:**

```bash
# Get today's tasks (for suggestions)
bun run .system/tools/aida-cli.ts tasks getTodayTasks

# Get a specific task
bun run .system/tools/aida-cli.ts tasks getTaskById 123

# Update task status (to 'active' when starting)
bun run .system/tools/aida-cli.ts tasks setTaskStatus 123 "active"

# Log activation attempt
bun run .system/tools/aida-cli.ts journal createEntry '{"entry_type":"task","content":"Började med: [task]"}'
```

## Workflow

### 1. Assess User State

**Detect from conversation:**
- "Jag fastnar" → Stuck, needs smallest step
- "Orkar inte" → Low energy, needs easy win
- "För mycket" → Overwhelmed, needs ONE thing
- "Vad ska jag göra?" → Choice paralysis, needs direction
- No specific complaint → Just asking for next action

See [OVERWHELM-RESPONSE.md](OVERWHELM-RESPONSE.md) for state-specific responses.

### 2. Get Available Tasks

```bash
bun run .system/tools/aida-cli.ts tasks getTodayTasks
```

### 3. Select Best Task

See [ENERGY-AWARE-SELECTION.md](ENERGY-AWARE-SELECTION.md) for selection rules.

**Consider:**
1. User's current energy level (ask or infer)
2. Time of day (from user's energy pattern)
3. Task energy requirements
4. Deadlines
5. Task status (ready > planned > captured)

### 4. Apply Activation Technique

See [ACTIVATION-TECHNIQUES.md](ACTIVATION-TECHNIQUES.md) for techniques.

**Based on user state:**
- Stuck → Extract smallest first step
- Overwhelmed → One thing only, 5-minute rule
- Low energy → Easy win first
- Choice paralysis → Make the choice for them

### 5. Present Single Action

**Format (Swedish):**
```
🎯 Nästa steg:

[One concrete action]

Du behöver bara göra 5 minuter - sedan kan du bestämma om du vill fortsätta.

Ska vi köra?
```

### 6. Log Activation

When user starts:
```bash
bun run .system/tools/aida-cli.ts tasks setTaskStatus [id] "active"
bun run .system/tools/aida-cli.ts journal createEntry '{"entry_type":"task","content":"Aktiverade: [task title]"}'
```

## Supporting Documentation

- [ACTIVATION-TECHNIQUES.md](ACTIVATION-TECHNIQUES.md) - 5-minute rule, smallest step, etc.
- [ENERGY-AWARE-SELECTION.md](ENERGY-AWARE-SELECTION.md) - Matching tasks to energy
- [OVERWHELM-RESPONSE.md](OVERWHELM-RESPONSE.md) - Handling stuck/overwhelmed states

## Design Principles

1. **ONE thing** - Never present multiple options
2. **Smallest step** - Break it down until it's obvious
3. **5-minute rule** - Just start, decide later
4. **No guilt** - Deferrals are rescheduling, not failure
5. **Energy-aware** - Don't suggest high-energy tasks when user is drained
6. **Momentum** - Small wins build confidence

## Example Invocations

### Example 1: Simple "What's Next?"

**User**: "/next"

**Response**:
```
🎯 Nästa steg för dig:

**Öppna rapporten** (Digitaliseringssamordnare)
- Deadline: imorgon
- Bara öppna filen och läs första stycket

5 minuter - sedan bestämmer du om du fortsätter. Kör! 🚀
```

### Example 2: User is Overwhelmed

**User**: "Jag har för mycket, vet inte var jag ska börja"

**Response**:
```
Jag hör dig. Låt oss göra det enkelt.

Glöm allt annat just nu. EN sak:

🎯 **Ringa banken** (2 min)
   - Ta upp telefonen
   - Slå numret
   - Klart!

Det är allt. Resten kan vänta.

Redo?
```

### Example 3: User is Stuck on Specific Task

**User**: "Jag kan inte börja med rapporten"

**Response**:
```
Rapporten känns stor - det förstår jag!

Vad sägs om att vi bryter ner det?

🎯 Första steget:
**Öppna dokumentet och skriv rubriken**

Bara rubriken! Inget mer.

5 minuter, sedan pratar vi igen. Kör?
```

### Example 4: Low Energy

**User**: "Orkar ingenting..."

**Response**:
```
Det är okej att vara trött. 💙

Vad sägs om EN liten sak som känns hanterbar?

🎯 **Rensa 5 mail från inkorgen**
   - Öppna mail
   - Delete/Archive/Reply kort
   - Klart!

Lite framsteg > Inget framsteg.

Eller vill du ta en paus först?
```
