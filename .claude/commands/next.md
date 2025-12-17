---
description: Get next recommended action based on energy and context
---

Invoke the **task-activation skill** to suggest the next action.

## Purpose

Help user START tasks with activation support. Focuses on ONE thing at a time.

## Instructions

1. **Assess user state** from conversation context:
   - Stuck? → Use smallest step technique
   - Overwhelmed? → Simplify radically
   - Low energy? → Suggest easy win
   - Just asking? → Energy-aware selection

2. **Get available tasks:**
   ```bash
   bun run src/aida-cli.ts tasks getTodayTasks
   ```

3. **Select best match** based on:
   - User's energy level (from profile or ask)
   - Current time of day
   - Task deadlines
   - Task energy requirements

4. **Present ONE action** with:
   - 5-minute rule
   - Smallest first step
   - Supportive, non-judgmental tone

5. **CRITICAL:** All database operations via `aida-cli.ts`:
   ```bash
   bun run src/aida-cli.ts tasks getTodayTasks
   bun run src/aida-cli.ts tasks setTaskStatus 123 "active"
   ```

6. Respond in Swedish.

## Example Output

```
🎯 Nästa steg för dig:

**Öppna rapporten** (Digitaliseringssamordnare)
- Deadline: imorgon
- Bara öppna filen och läs första stycket

5 minuter - sedan bestämmer du. Kör! 🚀
```

## Key Principles

- **ONE thing** - Never show task list
- **Smallest step** - Break it down until obvious
- **5-minute rule** - Just start, decide later
- **No guilt** - Deferrals are rescheduling, not failure
- **Energy-aware** - Match suggestions to capacity
