# Weekly Review Flow

## Purpose

Help users reflect on the past week's accomplishments, identify patterns, and celebrate wins. Focus on learning and recognition rather than judgment.

## When to Use

- End of week (Friday-Sunday)
- User explicitly requests review: "weekly review", "hur gick veckan"
- User triggers `/weekly review`

## Step-by-Step Procedure

### 1. Get Time Context

```bash
bun run src/aida-cli.ts time getTimeInfo
```

Extract from JSON response:
- `weekOfYear` - Current week number
- `date` - Today's date
- `weekdayName` - Day of week

Calculate past week date range:
- **Week start**: Previous Monday (or current Monday if today is Monday)
- **Week end**: Previous Sunday (or today if today is Sunday)
- Format: YYYY-MM-DD for both

### 2. Query Past Week Data

**Get completed tasks:**
```bash
bun run src/aida-cli.ts tasks getWeekTasks "<weekStart>" "<weekEnd>"
```

This returns tasks grouped by date. Filter for `status="done"` to count completions.

**Get journal entries:**
```bash
bun run src/aida-cli.ts journal getEntriesByDateRange "<weekStart>" "<weekEnd>"
```

**Get active roles:**
```bash
bun run src/aida-cli.ts roles getActiveRoles
```

### 3. Analyze Accomplishments

**Group completed tasks by role:**
```
Developer-rollen: 5 tasks
Personal-rollen: 3 tasks
Work-rollen: 7 tasks
```

**Identify significant completions:**
- Tasks with high priority
- Tasks with deadlines met
- Long-standing tasks finally completed

**Count by type:**
- How many tasks total?
- How many overdue tasks were cleared?
- How many projects progressed?

### 4. Pattern Recognition

**Energy patterns from check-ins:**
- Scan journal entries for type='checkin'
- Extract energy level mentions (if logged)
- Identify: Which days had high energy? Low energy?

**Productivity patterns:**
- Which days had most completions?
- What time of day were tasks marked done? (if timestamped)
- Which roles got most attention?

**Behavioral patterns:**
- How often did user check in? (daily consistency)
- Were there activation barriers? (journal mentions of "stuck")
- What techniques helped? (mentions of "5-minute rule", etc.)

### 5. Generate Summary

**Structure (in Swedish):**

```markdown
# Vecka {weekNumber} - Sammanfattning

## Accomplishments 🎉

**{Role 1}** ({X} uppgifter färdiga)
- {Specific significant task 1}
- {Specific significant task 2}
- {Summary if many small tasks}

**{Role 2}** ({Y} uppgifter färdiga)
- ...

## Patterns jag noterar

- Mest produktiv: {Day/time patterns}
- Energidippar: {When energy was low}
- Bäst för fokusarbete: {Optimal focus times}

## Vad fungerade bra?

- {Technique/pattern that helped}
- {Consistency achievements}
- {Wins worth celebrating}

## Challenges

- {Barrier encountered - framed constructively}
- {Area that needs attention}

## Reflection

{1-2 sentences summarizing overall week trajectory}
```

**Tone guidelines:**
- Celebrate wins, even small ones
- Frame challenges as learning opportunities
- No guilt or judgment about incomplete tasks
- Highlight patterns to build self-awareness

### 6. Create Journal Entry

```bash
bun run src/aida-cli.ts journal createEntry '{
  "entry_type": "weekly_review",
  "content": "<full summary text in markdown>",
  "metadata": {
    "week_number": {weekOfYear},
    "tasks_completed": {count},
    "roles_active": {roleCount}
  }
}'
```

**Note:** The `content` field should contain the full markdown summary generated in Step 5.

### 7. Ask About Next Week

After presenting the review, ask:

```
Vill du planera för nästa vecka nu?
```

- If yes → Transition to PLANNING-FLOW
- If no → End with encouraging message

## Example Output

```
Låt mig granska veckan som gick...

# Vecka 51 - Sammanfattning

## Accomplishments 🎉

**Developer-rollen** (5 uppgifter färdiga)
- Färdigställde API-dokumentation för nya endpoints
- Implementerade autentiseringsflow med JWT
- Fixade 3 kritiska säkerhetsbuggar
- Code review på 2 pull requests

**Personal-rollen** (3 uppgifter färdiga)
- Tränade 4 av 5 planerade gånger
- Läste 2 kapitel i "Atomic Habits"
- Planerade jul-handlingar

**Work-rollen** (7 uppgifter färdiga)
- Genomförde 5 kundmöten
- Färdigställde Q4 rapport
- Uppdaterade projektplan

## Patterns jag noterar

- **Mest produktiv**: Måndag-tisdag förmiddag (8-11)
- **Energidippar**: Onsdagar efter lunch, fredagar eftermiddag
- **Bäst för fokusarbete**: Morgontimmar innan 11:00
- **Checkin-konsistens**: 6 av 7 dagar - bra jobbat!

## Vad fungerade bra?

- Morgonrutinen med /checkin hjälpte dig starta fokuserat
- 5-minutersregeln fick dig igång på svåra uppgifter (4 tillfällen)
- Du prioriterade Developer-rollen som planerat

## Challenges

- Onsdagar var svåra - kanske för många möten?
- Personal-rollen fick minst uppmärksamhet (bara 3 tasks)
- 2 uppgifter rullade över från förra veckan

## Reflection

En stark vecka med tydligt fokus på Developer-rollen. Du håller dig konsekvent med dagliga check-ins och använder aktiveringsverktyg när du kör fast. Överväg att blocka onsdagar mer för fokusarbete.

---

Vill du planera för nästa vecka nu?
```

## Error Handling

**If no tasks completed:**
```
Jag ser att inga uppgifter markerades som färdiga den här veckan.

Det kan bero på flera saker:
- Du jobbade på större uppgifter som inte är klara än
- Du glömde markera färdiga uppgifter
- Det var en återhämtningsvecka (också viktigt!)

Vill du kolla igenom uppgifterna och se om något borde markeras som färdigt?
```

**If no journal entries:**
```
Det finns inga journal-entries för veckan som gick. Det gör det svårt för mig att se patterns.

Tips för nästa vecka: Använd /checkin för att logga hur dagen går. Det hjälper både dig och mig att förstå dina patterns.

Vill du planera för nästa vecka ändå?
```

## CLI Reference

| Need | Command |
|------|---------|
| Get week tasks | `bun run src/aida-cli.ts tasks getWeekTasks "2025-12-16" "2025-12-22"` |
| Get journal entries | `bun run src/aida-cli.ts journal getEntriesByDateRange "2025-12-16" "2025-12-22"` |
| Get roles | `bun run src/aida-cli.ts roles getActiveRoles` |
| Create review entry | `bun run src/aida-cli.ts journal createEntry '{...}'` |
| Get time info | `bun run src/aida-cli.ts time getTimeInfo` |
