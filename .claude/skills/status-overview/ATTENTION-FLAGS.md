# Attention Flags 🚩

> **Goal**: Identify items that need user attention
> **Types**: Overdue, Stale, Blocked, Imbalanced

---

## 🚨 CRITICAL: Database Access

**ALL database queries MUST use `aida-cli.ts`:**

```bash
# Get overdue tasks
bun run .system/tools/aida-cli.ts tasks getOverdueTasks

# Get stale tasks
bun run .system/tools/aida-cli.ts tasks getStaleTasks

# NEVER use query modules directly!
```

---

## Flag Types

### 🔴 Overdue Tasks

**Definition:** Tasks with `deadline < today` and status not done/cancelled

**Query:**
```bash
bun run .system/tools/aida-cli.ts tasks getOverdueTasks
```

**Severity Levels:**

| Days Overdue | Severity | Icon |
|--------------|----------|------|
| 1-2 days | Low | ⚠️ |
| 3-7 days | Medium | 🔶 |
| 8+ days | High | 🔴 |

**Presentation:**
```
🔴 Försenade tasks (2):

1. "API-dokumentation" - 5 dagar försenad
   Roll: Systemutvecklare
   Åtgärd: Slutför eller justera deadline?

2. "Boka hotell" - 1 dag försenad
   Roll: Förälder
   Åtgärd: Snabb task - 5 min?
```

---

### 🟡 Stale Tasks

**Definition:** Tasks that have been in same status too long

**Query:**
```bash
bun run .system/tools/aida-cli.ts tasks getStaleTasks
```

**Thresholds:**

| Status | Stale After | Why |
|--------|-------------|-----|
| captured | 28 days | Should be processed or discarded |
| ready | 14 days | Should be planned or reconsidered |
| planned | 21 days | Should be started or rescheduled |
| active | 7 days | Should progress or be unblocked |

**Presentation:**
```
🟡 Stale tasks (3):

1. "Lär sig Rust" - captured 45 dagar sen
   💡 Fortfarande relevant? Gör/ta bort/flytta?

2. "Refaktorera login" - ready 18 dagar sen
   💡 Dags att planera in?

3. "Fixa CSS-bugg" - active 10 dagar sen
   💡 Är du blockerad? Behöver hjälp?
```

---

### 🟠 Blocked Tasks

**Definition:** Tasks marked as blocked or showing no progress

**Indicators:**
- Status = 'active' for >7 days with no journal activity
- User has mentioned being stuck
- No subtask progress

**Presentation:**
```
🟠 Potentiellt blockerade:

1. "Integrera API" - Active i 12 dagar
   Ingen aktivitet loggad
   💡 Är du fast? Vad hindrar?
```

---

### 🟣 Role Imbalance

**Definition:** Role significantly under or over target balance

**Threshold:** >10% deviation from target

**Presentation:**
```
🟣 Rollbalans:

⚠️ Förälder: 12% (mål 25%) - Behöver mer fokus
⚠️ Systemutvecklare: 55% (mål 40%) - Tar för stor plats
```

---

## Priority Order

When showing attention items, order by:

1. **Overdue tasks** (most urgent)
   - Sorted by days overdue (most first)

2. **Blocked tasks** (need unblocking)
   - Sorted by days stuck

3. **Stale tasks** (need decision)
   - Sorted by days stale

4. **Imbalances** (longer-term issue)
   - Sorted by deviation percentage

---

## Consolidated View

### Summary Format

```
⚠️ Kräver uppmärksamhet:

🔴 2 försenade tasks
🟡 3 stale tasks
🟠 1 potentiellt blockerad
🟣 1 roll ur balans

Vill du gå igenom dem? (ja/senare/ignorera)
```

### Detail Format

```
⚠️ Genomgång av uppmärksamhetspunkter:

───────────────────────────────────
🔴 FÖRSENADE (2)
───────────────────────────────────

1. "API-dokumentation"
   📅 5 dagar försenad
   🎭 Systemutvecklare

   Åtgärd?
   [1] Slutför nu
   [2] Ny deadline
   [3] Avbryt task

2. "Boka hotell"
   📅 1 dag försenad
   🎭 Förälder

   Snabb task - 5 min att klara av!

───────────────────────────────────
🟡 STALE (3)
───────────────────────────────────

[Similar format for stale tasks]
```

---

## Action Suggestions

### For Overdue Tasks

| Days Overdue | Suggested Action |
|--------------|------------------|
| 1-2 | "Snabb task? Kan du klara den nu?" |
| 3-7 | "Behöver du justera deadline?" |
| 8+ | "Dags att besluta: Gör, skjut upp, eller ta bort?" |

### For Stale Tasks

| Status | Suggested Action |
|--------|------------------|
| captured (stale) | "Fortfarande relevant? Processsa eller ta bort" |
| ready (stale) | "Dags att planera in eller omvärdera" |
| planned (stale) | "Aktivera eller flytta till senare" |
| active (stale) | "Är du blockerad? Vad hindrar?" |

### For Blocked Tasks

```
Det verkar som att "[task]" har fastnat.

Vanliga orsaker:
• Väntar på någon annan?
• Saknar information?
• För stor task - behöver brytas ner?
• Motivation saknas?

Vad är det som blockerar?
```

---

## Suppression Rules

### Don't Flag

- Tasks created <24 hours ago
- Tasks with future start dates
- Tasks explicitly paused by user
- Tasks in "someday" bucket (if implemented)

### Snooze Option

Allow user to snooze flags:
```
[Snooze "Lär sig Rust" i 7 dagar]

OK! Jag påminner dig om 7 dagar.
```

---

## Batch Actions

### Overdue Batch

```
Du har 5 försenade tasks.

Vill du:
[1] Gå igenom en i taget
[2] Flytta alla till nya datum
[3] Se listan och välja
```

### Stale Batch

```
Du har 8 stale captured tasks.

Vill du:
[1] Gå igenom en i taget
[2] Arkivera alla (kan återställas)
[3] Se listan och välja
```

---

## Weekly Review Integration

Flag summary for weekly review:

```
📊 Veckans uppmärksamhetspunkter

Nya denna vecka:
• 2 tasks blev försenade
• 1 task blev stale

Lösta denna vecka:
• 3 försenade tasks hanterade ✅
• 2 stale tasks arkiverade ✅

Kvarstår:
• 2 försenade
• 3 stale

Bra jobbat med att hantera dem! 👏
```

---

## Success Criteria

- [ ] Overdue tasks identified via aida-cli.ts
- [ ] Stale tasks identified with correct thresholds
- [ ] Blocked tasks detected
- [ ] Imbalances calculated
- [ ] Priority ordering applied
- [ ] Clear visual presentation
- [ ] Actionable suggestions provided
- [ ] Snooze option offered
- [ ] Swedish output
