# Morning Check-in Flow

> **When**: First check-in of the day OR time < 12:00
> **Goal**: Structure the day with clear focus and minimal overwhelm

---

## 🚨 CRITICAL: Database Access

**ALL database queries in this flow MUST use `aida-cli.ts`:**

```bash
# CORRECT pattern:
bun run .system/tools/aida-cli.ts <module> <function> [args...]

# NEVER use query modules directly:
bun run .system/tools/database/queries/tasks.ts getTodayTasks  # ❌ WRONG!
```

---

## Step-by-Step Procedure

### 1. Greet & Get Context

**Swedish greeting based on time:**
- 06:00-10:00: "God morgon! ☀️"
- 10:00-12:00: "Hej! 👋"

**Query time context:**
```typescript
const now = await getTimeInfo();
```

### 2. Query Today's Data

**Run in parallel (use scripts, not SQL):**

```bash
# Get today's tasks (grouped by role)
bun run .system/tools/aida-cli.ts tasks getTodayTasks

# Get overdue tasks
bun run .system/tools/aida-cli.ts tasks getOverdueTasks

# Get active roles
bun run .system/tools/aida-cli.ts roles getActiveRoles
```

### 3. Ask for Scheduled Events
**Prompt user:**
```
Har du några schemalagda möten eller händelser idag? Lista dem gärna med tidpunkter.
```   

### 4. Read User Energy Pattern

From `.system/context/personal-profile.json` via template variables:

- `{{user.energy_pattern.high}}` - When user has high energy
- `{{user.energy_pattern.medium}}` - When user has medium energy
- `{{user.energy_pattern.low}}` - When user has low energy

**Example:**
```json
{
  "high": ["06:00-10:00", "18:00-20:00"],
  "medium": ["10:00-14:00"],
  "low": ["14:00-18:00", "20:00-22:00"]
}
```

### 5. Match Tasks to Energy

See [ENERGY-MATCHING.md](ENERGY-MATCHING.md) for detailed rules.

**Quick summary:**
- **High energy** → Deep work, strategic planning, creative tasks
- **Medium energy** → Routine work, meetings, communication
- **Low energy** → Admin tasks, passive activities, easy completions

**Current time context:**
If `now.hour` is 06:00-10:00 (high energy period), prioritize:
1. Tasks marked with `energy_requirement='high'`
2. Tasks with nearest deadlines that need deep work
3. Tasks from most important roles

### 6. Suggest 1-3 Focus Items

**CRITICAL: Show only 1-3 items, NEVER the full task list**

Format in Swedish:
```
Idag ser jag [antal] fokusområden:

1. **[Task title]** ([Role])
   - [Reason: energy match / deadline / priority]
   - [Time estimate if available]

2. **[Task title]** ([Role])
   - [Reason]

3. **[Task title]** ([Role])
   - [Reason]
```

**Prioritization logic:**
1. Overdue tasks (if any) - max 1, don't overwhelm
2. Tasks with deadline today - max 1-2
3. High-priority tasks matching current energy - 1-2
4. Consider role balance targets if no urgency

### 7. Handle Overdue Tasks Gently

If overdue tasks exist:

**DO:**
- Mention max 1 overdue item
- Frame as "Ska vi ta hand om detta först?"
- Offer to reschedule if too much

**DON'T:**
- List all overdue items (overwhelming!)
- Use guilt-inducing language
- Make user feel bad about delays

**Example:**
```
Jag ser att "Dokumentation" har deadline igår.
Vill du prioritera den först, eller ska vi lägga om den till senare idag?
```

### 8. Create Daily Plan File

**Location:** `0-JOURNAL/1-DAILY/YYYY-MM-DD-plan.md`

**Content:**
```markdown
# Plan for [date in Swedish]

## Focus för dagen
1. [Task 1]
2. [Task 2]
3. [Task 3]

## Nästa steg
- [Smallest first step for task 1]

## Parkerade items
_Items that came up but aren't for today_

## Anteckningar
_Space for notes during the day_
```

**Use Markdown Write tool to create file.**

### 9. Create Journal Entry

**Via script:**
```bash
bun run .system/tools/aida-cli.ts journal createEntry '{
  "entry_type": "checkin",
  "content": "Morgonplanering: Fokus på [task 1], [task 2], [task 3]",
  "timestamp": "[current timestamp from getTimeInfo]"
}'
```

### 10. Provide First Action

**Extract smallest possible first step** from task 1:

Examples:
- "Öppna dokumentet" (not "Skriv hela dokumentationen")
- "Skapa projektet i IDE" (not "Implementera featuren")
- "Läs igenom kraven" (not "Lös problemet")

**Format:**
```
Ska vi börja med: [smallest first step]?

[5-minute rule] Du behöver bara göra 5 minuter - sedan kan du bestämma om du vill fortsätta.
```

---

## Examples

### Example 1: Normal Morning

**User:** `/checkin`

**Time:** 08:30 (high energy period)

**Tasks available:**
- "Färdigställ arkitekturdokumentation" (Developer, deadline today, high energy)
- "Team standup" (Work, scheduled 09:00)
- "Svara på email" (Work, medium priority, low energy)
- "Träning" (Personal, scheduled 18:00)

**Output:**
```
God morgon! ☀️

Låt mig kolla läget för dagen...

Har du några schemalagda möten eller händelser idag? Lista dem gärna med tidpunkter.

[User responds with scheduled events...]

Idag ser jag tre fokusområden:

1. **Färdigställ arkitekturdokumentation** (Developer)
   - Du har hög energi nu - perfekt för detta
   - Deadline: idag
   - Uppskattad tid: 2 timmar

2. **Team standup 09:00** (Work)
   - Om 30 minuter
   - Förberedelsetid: 10 minuter

3. **Träning 18:00** (Personal)
   - Schemalagt för kvällen

Ska vi börja med att öppna arkitekturdokumentet?
Du behöver bara göra 5 minuter - sedan kan du bestämma om du vill fortsätta.
```

### Example 2: Overdue Task

**User:** "planera min dag"

**Time:** 07:00

**Tasks available:**
- "Skicka rapport" (Work, deadline yesterday, overdue 1 day)
- "Veckomöte prep" (Work, deadline today)
- "Code review" (Developer, no deadline, medium priority)

**Output:**
```
God morgon! ☀️

Jag ser att "Skicka rapport" hade deadline igår.
Vill du prioritera den först idag, eller ska vi lägga om den?

Om vi tar den först kan vi sedan fokusera på:
- Veckomöte prep (deadline idag)

Vad känns bäst?
```

### Example 3: No Urgent Tasks (Low Stress Day)

**User:** `/checkin`

**Time:** 09:00

**Tasks available:**
- Multiple tasks, no deadlines today
- User role balance: Developer 70% (target: 50%), Personal 10% (target: 30%)

**Output:**
```
God morgon! ☀️

Idag har du inga akuta deadlines - en bra dag för balans!

Jag märker att Personal-rollen behöver mer uppmärksamhet (bara 10% vs mål 30%).

Förslag för idag:

1. **Morgon-träning** (Personal)
   - Du har hög energi nu
   - Hjälper med rollbalans

2. **Code review för projekt X** (Developer)
   - Viktig men inte brådskande
   - Passar bra efter träning

Vill du börja med träningen, eller något annat?
```

---

## Error Handling

**If no tasks found:**
```
God morgon! ☀️

Du har inga aktiva tasks just nu.

Vill du:
- Fånga något nytt? (skriv bara vad du behöver göra)
- Kolla på någon specifik roll? (/status [roll])
```

**If database query fails:**
```
God morgon! ☀️

Jag kan inte nå databasen just nu. Låt oss försöka igen om ett ögonblick.

Vad ville du fokusera på idag? Jag kan hjälpa till ändå.
```

**If user seems overwhelmed:**
Detect from:
- User says "too much", "overwhelmed", "kan inte"
- More than 5 overdue tasks
- User explicitly asks for help

Response:
```
Jag ser att det är mycket just nu. Låt oss börja med EN sak.

Vad är det MINSTA du kan göra för att känna framsteg idag?

Vi kan alltid lägga om resten.
```

---

## Success Criteria

- [ ] Time detection works (morning vs midday/evening)
- [ ] Tasks queried via scripts (never direct SQL)
- [ ] Energy matching applied correctly
- [ ] Only 1-3 focus items shown (not full list)
- [ ] First action is smallest possible step
- [ ] Daily plan file created
- [ ] Journal entry created
- [ ] Swedish user-facing output
- [ ] 5-minute rule mentioned
- [ ] Overdue tasks handled gently (if any)
