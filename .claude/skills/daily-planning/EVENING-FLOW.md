# Evening Review Flow

> **When**: Daily plan exists AND time > 18:00
> **Goal**: Celebrate progress, learn from the day, close out gracefully

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

### 1. Greet & Set Positive Tone

**Swedish evening greeting:**
- 18:00-20:00: "God kväll! 🌆"
- 20:00-22:00: "God kväll! 🌙"
- After 22:00: "Sent! 🌃 Låt oss avsluta dagen"

**Frame positively from start:**
```
Dags att reflektera över dagen!
```

### 2. Read Morning Plan

**File:** `0-JOURNAL/1-DAILY/YYYY-MM-DD-plan.md`

Extract:
- Original focus items
- Any midday adjustments
- Notes added during day

### 3. Query Day's Accomplishments

**Run scripts:**
```bash
# Get all tasks completed today
bun run .system/tools/aida-cli.ts tasks getTodayTasks

# Filter for status='done' with timestamp = today
```

**Also check:**
- Journal entries created today (type='task', type='note')
- Any new tasks captured

### 4. Celebrate Wins

**CRITICAL: Start with wins, not gaps**

**Format (Swedish):**
```
Vad du har åstadkommit idag:

✅ [Completed task 1] ([Role])
✅ [Completed task 2] ([Role])
✅ [Completed task 3] ([Role])

[Encouraging comment based on accomplishments]
```

**Encouraging comments examples:**
- "Grym framgång!"
- "Tre viktiga saker gjorda!"
- "Bra jobbat med [specific achievement]!"
- "Deadline träffad! 🎯"

**Even if only 1 task done:**
```
✅ [Task] - Det är framsteg! 💪

[Acknowledge effort, not just result]
```

### 5. Note What Rolled Over

**Frame as rescheduling, NOT failure**

**IF items not completed:**
```
Några saker att ta hand om senare:

🔄 [Task 1] - Ska vi lägga den imorgon?
🔄 [Task 2] - Eventuell ny deadline?
```

**DON'T say:**
- "Du hann inte med..."
- "Inte klart..."
- "Missade..."

**DO say:**
- "Fortsätter imorgon"
- "Skjuter vi till [new date]?"
- "Prioriterar vi detta senare?"

### 6. Ask Reflection Questions

**Optional, only if user seems open:**

**Quick reflection (1-2 questions max):**
```
Snabb reflektion:

1. Vad gick bra idag?
2. Något du vill justera imorgon?
```

**If user doesn't want to reflect:**
Accept short answers:
- "Bra" → "Toppen! 👍"
- "Okej" → "Bra att höra!"
- No answer → Skip reflection, just close out

### 7. Create Reflection Journal Entry

**Via script:**
```bash
bun run .system/tools/aida-cli.ts journal createEntry '{
  "entry_type": "reflection",
  "content": "[Summary of day]: Completed [X] tasks, rolled over [Y]. [User reflection if provided]",
  "timestamp": "[current timestamp]"
}'
```

### 8. DELETE Daily Plan File

**CRITICAL: This file is only for TODAY**

```bash
rm 0-JOURNAL/1-DAILY/YYYY-MM-DD-plan.md
```

**Why delete:**
- Tomorrow is a new day
- Fresh planning each morning
- Prevents clutter and confusion
- Forces intentional daily planning

### 9. Optional: Tomorrow Preview

**Only if user seems interested:**

```
Vill du en förhandstitt på imorgon?

[If yes, query tomorrow's tasks and deadlines]

Imorgon ser jag:
- [Deadline 1]
- [Scheduled event]
- [Continued task]

Vi planerar mer detaljerat på morgonen!
```

### 10. Closing

**Encouraging close (Swedish):**
```
Bra jobbat idag! 💪

Vila gott, vi kör igen imorgon! 🌙
```

**Or if late:**
```
Sent nu - dags att vila! 🌃

Imorgon är en ny dag. God natt! 🌙
```

---

## Scenarios

### Scenario 1: Productive Day

**Completed:**
- All 3 morning focus items
- 2 additional captures

**Time:** 19:30

**Output:**
```
God kväll! 🌆

Dags att reflektera över dagen!

Vad du har åstadkommit idag:

✅ Arkitekturdokumentation (Developer)
✅ Team standup (Work)
✅ Email-hantering (Work)
✅ Träning (Personal)
✅ Veckomöte prep (Work)

Fem saker! Grym framgång! 🎯

Snabb reflektion:
Vad gick bra idag?
```

### Scenario 2: Partial Progress

**Completed:**
- 1 of 3 focus items
- Reason: Unexpected meeting took 2 hours

**Time:** 20:00

**Output:**
```
God kväll! 🌙

Vad du har åstadkommit idag:

✅ Team standup (Work)

Jag ser att mötet tog längre tid än planerat - det händer!

Dessa fortsätter vi med:
🔄 Arkitekturdokumentation - Imorgon morgon när energin är tillbaka?
🔄 Email - Snabb 10-min uppgift imorgon?

Du gjorde vad du kunde med tiden du hade. Det är okej! 💙

Bra jobbat idag! 💪
```

### Scenario 3: Difficult Day (Little Progress)

**Completed:**
- 0 focus items
- But: attended unexpected crisis meeting, helped colleague

**Time:** 21:00

**Output:**
```
God kväll! 🌙

Sent! Låt oss avsluta dagen.

Jag ser att planen ändrades mycket idag.

Fast du har:
✅ Hanterat akut situation
✅ Hjälpt teamet

Det är också viktigt arbete, även om det inte var planerat! 💪

Imorgons fokus blir:
🔄 [Original priority 1] - Ny start imorgon
🔄 [Original priority 2]

Vissa dagar blir inte som planerat - det är okej.
Imorgon är en ny dag! 🌙

Vila gott!
```

### Scenario 4: User Feeling Guilty

**User says:** "Jag fick inte gjort något idag..."

**Completed:**
- Actually completed 2 smaller tasks

**Output:**
```
Stopp! Låt mig visa vad du faktiskt gjorde:

✅ Email-hantering (10 meddelanden)
✅ Filadministration (städat workspace)

Det är framsteg! 💪

Jag förstår att det känns som för lite, men framsteg är framsteg.

Imorgon kan vi:
🔄 Börja med EN sak
🔄 5-minutersregeln
🔄 Ingen press

Du gjorde vad du kunde. Det räcker. 💙

Vila nu!
```

---

## Reflection Question Bank

Use sparingly, 1-2 max:

**Process questions:**
- "Vad gick bra idag?"
- "Något du vill justera imorgon?"
- "Energinivåerna - stämde prognosen?"

**Learning questions:**
- "Tog något längre tid än förväntat?"
- "Något oväntat som dök upp?"
- "Vad lärde du dig idag?"

**Planning questions:**
- "Behöver vi justera schemaläggningen?"
- "Passar fokustiderna?"
- "För mycket / för lite inplanerat?"

**DON'T ask:**
- "Varför hann du inte?" (guilt-inducing)
- "Vad gick fel?" (negative framing)
- "Varför tog det så lång tid?" (judgmental)

---

## Handling User States

**If user is:**

| State | Response |
|-------|----------|
| Proud/happy | "Fantastiskt! Berätta mer!" |
| Tired | "Helt rätt att vila nu! Bra jobbat!" |
| Frustrated | "Jag förstår. Vissa dagar är tuffare. Imorgon är ny chans!" |
| Guilty | "Stopp! Se vad du faktiskt gjorde..." [show accomplishments] |
| Overwhelmed | "Låt oss göra imorgon enklare. EN sak i taget." |
| Satisfied | "Toppen! Just den balansen vi siktar på!" |

---

## What Gets Deleted vs Kept

**DELETE (temporary, day-specific):**
- `YYYY-MM-DD-plan.md` - The daily plan file

**KEEP (permanent record):**
- `YYYY-MM-DD.md` - Daily journal log (generated from journal_entries)
- Journal entries in database (all types: checkin, reflection, task, etc.)
- Task completion timestamps in database
- All task data

**Why this split:**
- Plan = TODAY only, fresh start each morning
- Journal = permanent record for reflection and patterns
- Database = source of truth for all data

---

## Success Criteria

- [ ] Day's accomplishments summarized
- [ ] Wins celebrated FIRST (before gaps)
- [ ] Rollover items identified (framed as rescheduling)
- [ ] Reflection questions asked (1-2 max, optional)
- [ ] Journal entry created (type='reflection')
- [ ] Daily plan file DELETED
- [ ] Positive, supportive tone throughout
- [ ] Swedish output
- [ ] No guilt-inducing language
- [ ] Acknowledges effort, not just results
