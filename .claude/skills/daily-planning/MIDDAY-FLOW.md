# Midday Check-in Flow

> **When**: Daily plan exists AND time is 11:00-16:00
> **Goal**: Adjust priorities based on progress and current energy

---

## 🚨 CRITICAL: Database Access

**ALL database queries in this flow MUST use `aida-cli.ts`:**

```bash
# CORRECT pattern:
bun run src/aida-cli.ts <module> <function> [args...]

# NEVER use query modules directly:
bun run src/database/queries/tasks.ts getTodayTasks  # ❌ WRONG!
```

---

## Step-by-Step Procedure

### 1. Greet & Acknowledge Context

**Swedish greeting:**
- "Hej! Hur går det?"
- "Dags för en check-in!"

**Acknowledge it's midday:**
```
Halv

tidsläge! Låt oss kolla hur morgonen gått.
```

### 2. Read Morning Plan

**File:** `0-JOURNAL/PLAN.md` (single plan file for today)

Extract:
- Original focus items (1-3 tasks)
- Parked items
- Any notes user has added

### 3. Query Progress

**Run scripts:**
```bash
# Get today's completed tasks
bun run src/aida-cli.ts tasks getTodayTasks

# Filter for status='done' since morning check-in
# (Compare timestamps with morning journal entry)
```

### 4. Calculate Progress

**For each morning focus item:**
- ✅ Done
- 🔄 In progress (user can confirm)
- ⏸️ Not started

**Summarize in Swedish:**
```
Av morgonens fokus:
✅ [Task 1] - Klart!
🔄 [Task 2] - Pågående
⏸️ [Task 3] - Inte påbörjat än
```

### 5. Ask About Energy Level

**Energy check question (in Swedish):**
```
Hur är din energinivå nu?
(hög / medel / låg)
```

**If user doesn't answer directly:**
Use conversational cues:
- "trött" → low
- "pigg", "bra", "fokuserad" → high
- "okej", "går bra" → medium

### 6. Adjust Remaining Priorities

**Based on:**
1. What's completed
2. Current energy level
3. Remaining time in day
4. Original priorities

**Decision logic:**

**IF high energy still:**
- Continue with remaining high-energy tasks
- Suggest pushing through if close to done

**IF medium energy:**
- Suggest switching to medium-energy tasks
- Batch communication/meetings if possible

**IF low energy:**
- Suggest low-energy tasks
- Offer to defer hard tasks to tomorrow
- Remind about breaks

### 7. Reprioritize

**Output format (Swedish):**
```
För resten av dagen, föreslår jag:

1. **[Adjusted task 1]** ([Reason for adjustment])
   - [Time estimate]

2. **[Adjusted task 2]** ([Reason])

Låter det bra?
```

**Examples of reasons:**
- "Du har medel energi nu - bra för detta"
- "Färdig med morgonens fokus - detta är näst viktigt"
- "Deadline imorgon - bra att få det gjort idag"

### 8. Update Journal Entry

**⚠️ TIMESTAMP-REGEL (KRITISK):**
Omit ALDRIG timestamp - det ger fel tidszon (UTC istället för lokal)!

**Hämta alltid tid via time module först:**
```bash
bun run src/aida-cli.ts time getTimeInfo
```

**Bygg timestamp från output:**
- Extrahera `date` och `time` fält från JSON
- Kombinera: `"{date}T{time}:00"`
- Exempel: `"2025-12-16T12:30:00"`

**Create new entry:**
```bash
bun run src/aida-cli.ts journal createEntry '{
  "entry_type": "checkin",
  "content": "Middag check-in: [progress summary]. Justerade prioriteter: [new focus]",
  "timestamp": "2025-12-16T12:30:00"
}'
```

### 9. Optional: Update Plan File

**If significant changes:**

Update `0-JOURNAL/PLAN.md`:
- Mark completed items with ✅
- Update "Nästa steg" section
- Add any new notes

**Note:** User can edit PLAN.md directly in their editor. CLI update not required - file is meant to be a living document throughout the day.

**Use Edit tool to update file if updating via skill.**

### 10. Suggest Next Action

**Same principle as morning:** Smallest possible first step

```
Nästa steg: [smallest action]

Hur mycket tid har du nu?
```

---

## Scenarios

### Scenario 1: Good Progress

**Morning plan:**
1. ✅ Arkitekturdokumentation (done)
2. ✅ Team standup (done)
3. ⏸️ Email

**Current time:** 13:00
**Energy:** Medium

**Output:**
```
Hej! Hur går det? 👋

Grym framgång på morgonen!
✅ Arkitekturdokumentation - Klart!
✅ Team standup - Klart!

Du har medel energi nu. Perfekt för att ta hand om email och andra rutinuppgifter.

För resten av dagen:

1. **Svara på email** (10 minuter)
   - Låg mental belastning
   - Får det ur vägen

2. **Planera veckomöte** (30 minuter)
   - Deadline imorgon
   - Passar medium energi

Vill du börja med emailen?
```

### Scenario 2: Behind Schedule

**Morning plan:**
1. ⏸️ Rapport (not started, deadline today)
2. ✅ Standup (done)
3. ⏸️ Code review (not started)

**Current time:** 14:00
**Energy:** Low

**Output:**
```
Hej! Dags för en check-in! 👋

Jag ser att "Rapport" inte är påbörjad än (deadline idag).

Du har låg energi just nu. Två alternativ:

1. **Pusha genom rapporten** (uppskattad tid: 1h)
   - Får den gjord idag
   - Men kräver energi

2. **Justera deadline till imorgon** + göra lättare saker nu
   - Mindre stress
   - Bättre kvalitet imorgon när energin är tillbaka

Vad känns bäst för dig?
```

### Scenario 3: Energy Crash

**Morning plan:**
1. ✅ Deep work task (done)
2. ⏸️ Another high-energy task

**Current time:** 14:30
**Energy:** Low (user mentions "trött", "orkar inte")

**Output:**
```
Jag hör att du är trött. Det är helt okej! 💙

Du har gjort deep work på morgonen - det tar energi.

Förslag för resten av dagen:

1. **Ta en paus** (15-30 min)
   - Gå en runda
   - Kaffe/te
   - Byt fokus

2. **Sedan: lätta administrativa tasks**
   - Svara på meddelanden
   - Organisera filer
   - Lätt planering

3. **Skjut high-energy tasks till imorgon**
   - Du har hög energi 06:00-10:00
   - Bättre kvalitet då

Vill du ta en paus först?
```

### Scenario 4: Everything on Track

**Morning plan:**
1. ✅ Task 1 (done)
2. 🔄 Task 2 (in progress, going well)

**Current time:** 12:30
**Energy:** High still

**Output:**
```
Hej! 👋

Ser bra ut! Du ligger i fas:
✅ [Task 1] - Klart!
🔄 [Task 2] - Pågående

Du har fortfarande hög energi - fantastiskt!

Vill du:
1. Fortsätta med [Task 2] tills klar?
2. Ta en snabb paus och sedan fortsätta?

Du är på god väg! 🎯
```

---

## Adaptation Based on User State

**If user mentions:**

| User says | Interpretation | Response |
|-----------|---------------|----------|
| "trött", "orkar inte" | Low energy | Suggest low-energy tasks or break |
| "pigg", "bra flyt" | High energy | Keep momentum, suggest continuing |
| "distraherad", "svårt fokusera" | Low focus | Suggest structured break or context switch |
| "för mycket" | Overwhelmed | Reduce to ONE thing, defer rest |
| "tråkigt" | Boredom | Suggest varied tasks, different context |

---

## Time-Based Defaults

If user doesn't report energy:

| Time | Default Energy | Suggestion |
|------|---------------|------------|
| 11:00-13:00 | Medium | Routine work, communication |
| 13:00-15:00 | Low (post-lunch) | Light tasks, admin, meetings |
| 15:00-16:00 | Medium recovery | Structured tasks, not deep work |

---

## Success Criteria

- [ ] Morning plan file read successfully
- [ ] Progress calculated correctly
- [ ] Energy level assessed (asked or inferred)
- [ ] Priorities adjusted based on energy + progress
- [ ] Journal entry created
- [ ] Plan file updated if needed
- [ ] Next action suggested (smallest step)
- [ ] Swedish output
- [ ] Supportive tone (never guilt-inducing)
