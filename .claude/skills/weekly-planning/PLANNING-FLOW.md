# Weekly Planning Flow

## Purpose

Help users plan the upcoming week with realistic focus areas based on energy patterns, role balance, and existing commitments. Designed to prevent overwhelm and support activation.

## When to Use

- Start of week (Monday-Thursday)
- User explicitly requests planning: "planera veckan", "plan my week"
- User triggers `/weekly plan`
- After completing REVIEW-FLOW when user says yes to planning

## Step-by-Step Procedure

### 1. Get Time Context

```bash
bun run src/utilities/time.ts getTimeInfo
```

Extract from JSON response:
- `weekOfYear` - Current week number
- `date` - Today's date
- `weekdayName` - Day of week

Calculate upcoming week date range:
- **Week start**: Next Monday (or current Monday if today is Monday)
- **Week end**: Next Sunday
- Format: YYYY-MM-DD for both

### 2. Query Upcoming Week Context

**Get overdue tasks:**
```bash
bun run src/aida-cli.ts tasks getOverdueTasks
```

**Get stale tasks (captured but not activated):**
```bash
bun run src/aida-cli.ts tasks getStaleTasks
```

**Get tasks with deadlines this week:**
```bash
bun run src/aida-cli.ts tasks getWeekTasks "<weekStart>" "<weekEnd>"
```

Filter for tasks with `deadline` field set within the week range.

**Get active roles:**
```bash
bun run src/aida-cli.ts roles getActiveRoles
```

### 3. Analyze Role Balance

**For each active role, check:**
- How many tasks are currently active or ready?
- What is the role's `balance_target` (percentage)?
- Is this role under-represented in current tasks?

**Example:**
```
Developer: 45% of tasks (target: 50%) - slightly under
Personal: 15% of tasks (target: 20%) - needs attention
Work: 40% of tasks (target: 30%) - over-committed
```

### 4. Identify Weekly Priorities

**Priority calculation (in order):**

1. **Critical overdue** - Tasks past deadline (must address)
2. **This week's deadlines** - Tasks due this week (high priority)
3. **Role rebalancing** - Tasks for under-represented roles
4. **Stale task activation** - Old captured tasks needing decision
5. **New opportunities** - What else does user want to accomplish?

**Select 3-5 focus areas:**
- 1-2 MUST-DO items (deadlines, critical)
- 2-3 WANT-TO-DO items (important but flexible)
- Leave capacity buffer (don't over-plan)

### 5. Ask About Known Commitments

**Query user:**
```
Har du några kända commitments denna vecka?

Exempel:
- Möten eller events
- Resor eller semester
- Andra begränsningar av din tid
```

**Use this to:**
- Adjust expectations (fewer focus items if week is busy)
- Identify specific days with more/less capacity
- Set realistic scope

### 6. Consider Energy Patterns

**Read from profile (if available):**
- Best focus time of day
- Typical energy levels by day of week
- Preferred work patterns

**Match tasks to energy:**
- High-energy tasks → Best focus times (e.g., morning)
- Low-energy tasks → Energy dip times (e.g., afternoon)
- Quick wins → Low-energy days for momentum

### 7. Generate Weekly Plan

**Structure (in Swedish):**

```markdown
# Vecka {weekNumber} - Plan

## Fokusområden (3-5 st)

### 🎯 Must-Do
1. **{Task title}** ({Role})
   - Varför: {Reason - deadline, critical, etc.}
   - När: {Suggested day/time based on energy}

### 💪 Want-To-Do
2. **{Task title}** ({Role})
   - Varför: {Purpose}
   - När: {Suggested timing}

3. **{Task title}** ({Role})
   - Varför: {Purpose}
   - När: {Suggested timing}

## Per Roll

**Developer** (target: 50%)
- {X} tasks aktiva
- Fokus denna vecka: {Specific goal}

**Personal** (target: 20%)
- {Y} tasks aktiva
- Fokus denna vecka: {Specific goal}

**Work** (target: 30%)
- {Z} tasks aktiva
- Fokus denna vecka: {Specific goal}

## Övrigt att tänka på

- {Overdue tasks count} förfallna uppgifter att hantera
- {Stale tasks count} gamla uppgifter att granska
- {Known commitment noted}

## Mantra för veckan

{Short motivational statement aligned with user's goals/patterns}
```

**Tone guidelines:**
- Realistic, not aspirational (3-5 items, not 10)
- Supportive, not prescriptive
- Flexible, not rigid schedule
- Energy-aware suggestions

### 8. Create Journal Entry

```bash
bun run src/aida-cli.ts journal createEntry '{
  "entry_type": "weekly_plan",
  "content": "<full plan text in markdown>",
  "metadata": {
    "week_number": {weekOfYear},
    "focus_areas_count": {count},
    "roles_planned": {roleCount}
  }
}'
```

**Note:** The `content` field should contain the full markdown plan generated in Step 7.

### 9. Suggest First Action

After presenting the plan, provide immediate activation:

```
Vad vill du börja med? Jag föreslår att du startar med {first must-do task} eftersom {energy/priority reason}.

Använd /next när du är redo att börja!
```

## Example Output

```
Låt oss planera vecka 52!

# Vecka 52 - Plan

## Fokusområden (4 st)

### 🎯 Must-Do

1. **Färdigställ Q4-rapport** (Work)
   - Varför: Deadline fredag 22/12
   - När: Måndag-tisdag förmiddag (din bästa fokustid)

2. **Fix kritisk säkerhetsbug** (Developer)
   - Varför: Förfallen 2 dagar sedan
   - När: Onsdag förmiddag (hög energi)

### 💪 Want-To-Do

3. **Julträning 3 gånger** (Personal)
   - Varför: Hålla rutinen under jul
   - När: Måndag, onsdag, fredag kvällar

4. **Granska 15 gamla captured tasks** (Alla roller)
   - Varför: 15 stale tasks behöver decisions
   - När: Torsdag eftermiddag (lågenergitid, passar för granskande)

## Per Roll

**Work** (target: 30%, nu: 35%)
- 8 tasks aktiva
- Fokus denna vecka: Färdigställa Q4-rapport och stänga året starkt

**Developer** (target: 50%, nu: 45%)
- 11 tasks aktiva
- Fokus denna vecka: Fixa säkerhetsbug, sen maintenance items

**Personal** (target: 20%, nu: 20%)
- 5 tasks aktiva
- Fokus denna vecka: Behålla träningsrutinen trots julstress

## Övrigt att tänka på

- 2 förfallna uppgifter att hantera
- 15 gamla uppgifter att granska (många från november)
- Julledigt börjar måndag 23/12 - håll fokus på must-do items

## Mantra för veckan

"Stäng året starkt. Färdigställ det viktiga, släpp det som inte längre är relevant."

---

Vad vill du börja med? Jag föreslår att du startar med **Q4-rapporten** eftersom du har deadline på fredag och det passar din morgonenergi perfekt.

Använd /next när du är redo att börja!
```

## Handling Special Cases

### User Has Many Overdue Tasks

```
Jag ser att du har {count} förfallna uppgifter.

Det kan kännas överväldigande. Låt oss hantera det smart:

1. Är några inte längre relevanta? (kan tas bort)
2. Vilka 1-2 är mest kritiska? (fokusera där)
3. Resten kan vi omschmalägga realistiskt

Vill du gå igenom dem nu eller ska jag föreslå de 2 mest kritiska?
```

### User Has Very Few Tasks

```
Jag ser att du har relativt få tasks just nu ({count} totalt).

Det kan betyda:
- Du är i en lugn fas (njut!)
- Du har idéer men inte fångat dem än
- Du fokuserar på projekt utanför AIDA

Vill du:
1. Planera med det du har (enkelt!)
2. Capture några nya tasks först
3. Bara fokusera på de pågående
```

### Week Is Very Busy (Many Commitments)

Adjust focus areas downward:
```
Med alla dina commitments denna vecka föreslår jag att vi sätter bara 2 fokusområden:

1. {Critical item}
2. {One manageable item}

Det ger dig utrymme för oväntade saker och minskar stress.
Håller du med?
```

## CLI Reference

| Need | Command |
|------|---------|
| Get overdue tasks | `bun run src/aida-cli.ts tasks getOverdueTasks` |
| Get stale tasks | `bun run src/aida-cli.ts tasks getStaleTasks` |
| Get week tasks | `bun run src/aida-cli.ts tasks getWeekTasks "2025-12-23" "2025-12-29"` |
| Get roles | `bun run src/aida-cli.ts roles getActiveRoles` |
| Create plan entry | `bun run src/aida-cli.ts journal createEntry '{...}'` |
| Get time info | `bun run src/utilities/time.ts getTimeInfo` |

## Integration Notes

- After creating weekly plan, daily `/checkin` flows can reference weekly focus areas
- Weekly focus areas should inform daily task prioritization
- If user calls `/next`, consider weekly priorities when selecting task
