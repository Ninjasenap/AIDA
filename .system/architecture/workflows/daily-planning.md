# Daily Planning Workflow

> Context-aware `/checkin` command behavior for morning, midday, and evening.

## Context Detection

The `/checkin` command auto-detects context based on:
1. **Time of day** (from `{{user.time_definitions}}`)
2. **Existing daily plan** (has morning check-in happened?)
3. **User's energy pattern** (from `{{user.energy_pattern}}`)

| Time | Condition | Behavior |
|------|-----------|----------|
| First check-in OR < noon | No plan exists | Morning planning |
| 11:00-16:00 | Plan exists | Midday check-in |
| > 18:00 | Plan exists | Evening closure |

---

## Morning Planning Workflow

```
User: /checkin (morning)
    |
    v
+------------------+
| Load Context     |
| - User profile   |
| - Energy pattern |
| - Yesterday's log|
+------------------+
    |
    v
+------------------+
| Query Tasks      |
| - getTodayTasks()|
| - getOverdueTasks()|
+------------------+
    |
    v
+------------------+
| Read Calendar    |
| (if available)   |
+------------------+
    |
    v
+------------------+
| Generate Plan    |
| - Fixed commits  |
| - 2-3 focus items|
| - ONE first step |
+------------------+
    |
    v
+------------------+
| Create Files     |
| - journal entry  |
| - PLAN.md        |
+------------------+
    |
    v
Present to user
```

### Input

- Calendar for today
- Yesterday's incomplete items
- Current energy (from time → energy_pattern)
- Week context (day of week)

### Output

- Today's recommended focus (1-3 items)
- Suggested time blocks
- Preparations for upcoming commitments
- "Almost forgotten" warnings (stale items)
- ONE recommended first step

### Example Output

```
God morgon! Det är [dag].

IDAG PÅ SCHEMAT:
- 09:00 Standup (Teams)
- 14:00 Projektmöte

FOKUS IDAG (välj det som passar):
1. [Task] - ca 2h
2. [Task] - ca 1h
3. [Optional om tid finns]

PÅMINNELSE:
- [Överdue item] har legat sedan [datum]

FÖRSTA STEGET:
[Ett konkret, litet steg baserat på energinivå]

Hur känns det? Vill du justera något?
```

---

## Midday Check-in Workflow

```
User: /checkin (midday)
    |
    v
+------------------+
| Load Context     |
| - Morning plan   |
| - Completed tasks|
+------------------+
    |
    v
+------------------+
| Ask Energy       |
| "Hur är energin?"|
+------------------+
    |
    v
+------------------+
| Compare Plan     |
| vs Actual        |
+------------------+
    |
    v
+------------------+
| Adjust Plan      |
| if needed        |
+------------------+
    |
    v
+------------------+
| Create Entry     |
| type: 'checkin'  |
+------------------+
    |
    v
Suggest next action
```

### Output

```
Check-in [tid]:

Hur går det? Har du hunnit med något från morgonens plan?

[After user responds:]

Bra jobbat med [genomförda saker]!

Baserat på din energi ([nivå]) föreslår jag:
[En lämplig nästa åtgärd]

Ska vi uppdatera något i planen?
```

---

## Evening Closure Workflow

```
User: /checkin (evening)
    |
    v
+------------------+
| Query Completed  |
| for today        |
+------------------+
    |
    v
+------------------+
| Query Incomplete |
| from today       |
+------------------+
    |
    v
+------------------+
| Generate Summary |
| - Accomplished   |
| - Continuing     |
| - Observations   |
+------------------+
    |
    v
+------------------+
| Archive Plan     |
| Focus + calendar |
| -> log file      |
+------------------+
    |
    v
+------------------+
| Delete PLAN.md   |
+------------------+
    |
    v
+------------------+
| Create Entry     |
| type: 'checkin'  |
+------------------+
    |
    v
Ask for final capture
```

### Output

```
Dagsavslut [datum]:

IDAG HAR DU:
- [Completed task]
- [Completed task]

FORTSÄTTER IMORGON:
- [Task] (nästa steg: [step])

BRA JOBBAT med [specific highlight]!

Inför imorgon: [One priority or early commitment]

Något mer att fånga innan vi stänger?
```

---

## Energy-Aware Scheduling

Based on `{{user.energy_pattern}}`:

| Energy | Suitable Activities | Avoid |
|--------|---------------------|-------|
| High | Deep work, strategic planning, learning | Admin, routine |
| Medium | Meetings, routine coding, communication | Complex problems |
| Low | Admin tasks, passive activities, rest | High focus work |

### Matching Tasks to Energy

```typescript
// Check current energy period
const currentHour = new Date().getHours();
const energyPattern = user.energy_pattern;

// Match time to energy level
let currentEnergy = 'medium';
if (currentHour >= 5 && currentHour < 12) {
  currentEnergy = energyPattern.high ? 'high' : 'medium';
} else if (currentHour >= 18) {
  currentEnergy = 'low';
}

// Filter tasks by energy requirement
const suitableTasks = tasks.filter(t =>
  t.energy_requirement === currentEnergy ||
  t.energy_requirement === null
);
```

---

## Data Flow Summary

```
/checkin (morning) → journal_entries + PLAN.md + regenerate log
/checkin (midday)  → journal_entries + regenerate log + update plan if needed
/checkin (evening) → journal_entries + regenerate log + DELETE PLAN.md
```

---

## Principles

1. **Flexibility over rigidity** - Plans are suggestions, not mandates
2. **One focus at a time** - Don't overwhelm with full schedules
3. **Grace for changes** - "Plans changed? No problem, let's adjust"
4. **Celebrate progress** - Acknowledge every completion
5. **Energy respect** - Never push high-demand tasks during low energy
