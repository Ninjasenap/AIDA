---
description: View workload overview for a role or all roles
---

Invoke the weekly-planning skill for weekly review and planning.

## Usage

```
/weekly [review|plan]
```

## Behavior

The skill will determine the mode:

**If argument provided:**
- `/weekly review` → Force review mode (summarize past week)
- `/weekly plan` → Force planning mode (plan upcoming week)

**If no argument (auto-detect):**
- **Review mode**: Friday, Saturday, or Sunday
- **Planning mode**: Monday through Thursday

## What It Does

**Review mode:**
- Summarizes past week's accomplishments by role
- Identifies productivity and energy patterns
- Celebrates wins and notes challenges
- Creates weekly review journal entry
- Offers to transition to planning

**Planning mode:**
- Reviews overdue and stale tasks
- Checks role balance vs targets
- Suggests 3-5 weekly focus areas
- Considers energy patterns and commitments
- Creates weekly plan journal entry
- Provides first action suggestion

## Integration

Works with other AIDA workflows:
- Daily `/checkin` can reference weekly focus areas
- `/next` considers weekly priorities when selecting tasks
- Profile learning uses weekly patterns

All responses in Swedish, all database operations via aida-cli.ts.
