# Quick Capture Flow ⚡

> **Goal**: Capture tasks with MINIMAL friction
> **Principle**: Under 10 seconds from thought to saved task

---

## 🚨 CRITICAL: Database Access

**ALL database queries MUST use `aida-cli.ts`:**

```bash
# CORRECT pattern:
bun run .system/tools/aida-cli.ts <module> <function> [args...]

# NEVER use query modules directly:
bun run .system/tools/database/queries/tasks.ts  # ❌ WRONG!
```

---

## Quick Capture Modes

### Mode 1: Ultra-Quick (One-Shot) ⚡⚡⚡

**User provides clear task:**
```
User: "Jag måste ringa banken imorgon"
```

**Response (immediate):**
```
✅ Fångat: "Ringa banken"
   📅 Deadline: imorgon (2025-12-15)
   🎭 Roll: Förälder

Något mer?
```

**Steps:**
1. Parse input (see PARSING-RULES.md)
2. Infer role (see ROLE-INFERENCE.md)
3. Create task immediately
4. Confirm in ONE message

**Database calls:**
```bash
# 1. Create the task
bun run .system/tools/aida-cli.ts tasks createTask '{
  "title": "Ringa banken",
  "role_id": 2,
  "deadline": "2025-12-15",
  "energy_requirement": "low"
}'

# 2. Log the capture
bun run .system/tools/aida-cli.ts journal createEntry '{
  "entry_type": "task",
  "content": "Fångade: Ringa banken",
  "related_task_id": [new task id]
}'
```

---

### Mode 2: Quick with Role Question ⚡⚡

**User provides ambiguous task:**
```
User: "Skriva rapport"
```

**Response 1:**
```
Vilken roll gäller rapporten?
1. 💼 Digitaliseringssamordnare
2. 🖥️ Systemutvecklare
3. 🏛️ Föreningsordförande
```

**User:** "1"

**Response 2:**
```
✅ Fångat: "Skriva rapport"
   🎭 Roll: Digitaliseringssamordnare

Vill du sätta en deadline?
```

---

### Mode 3: Batch Capture ⚡

**User has multiple items:**
```
User: "Fånga dessa: ringa banken, köpa mjölk, maila chefen"
```

**Response:**
```
✅ Fångade 3 uppgifter:

1. "Ringa banken" → Förälder
2. "Köpa mjölk" → Förälder
3. "Maila chefen" → [Vilken roll?]

Roll för "Maila chefen"?
1. 💼 Digitaliseringssamordnare
2. 🖥️ Systemutvecklare
```

---

## Minimal Questions Principle

### NEVER Ask About:

| Field | Default | Why |
|-------|---------|-----|
| Priority | 0 | Can be upgraded later |
| Notes | null | Optional detail |
| Time estimate | null | Not critical for capture |
| Energy | inferred | Algorithm handles it |
| Start date | null | Deadline is enough |

### Only Ask When CRITICAL:

| Field | When to Ask |
|-------|-------------|
| Role | If cannot infer confidently |
| Title clarification | If input is too vague |
| Deadline | If user seems to want one |

---

## Response Templates (Swedish)

### Success - Simple
```
✅ Fångat: "[title]"

Något mer?
```

### Success - With Details
```
✅ Fångat: "[title]"
   🎭 Roll: [role name]
   📅 Deadline: [date]
   ⚡ Energi: [level]

Sparad! 💾
```

### Success - Batch
```
✅ Fångade [N] uppgifter:

1. "[title]" → [role]
2. "[title]" → [role]
3. "[title]" → [role]

Allt sparat! 📥
```

### Need Role
```
Vilken roll gäller detta?

[numbered list of active roles]
```

### Need Clarification
```
Vad menar du med "[unclear part]"?

Försök formulera som en konkret uppgift.
```

---

## Capture → Activation Bridge

After capture, optionally suggest activation:

**If user seems stuck:**
```
✅ Fångat: "[title]"

Vill du börja med den nu? (Jag kan ge dig första steget)
```

**If user is in flow:**
```
✅ Fångat! Något mer?
```

**Trigger task-activation skill if user wants help starting.**

---

## Error Handling

### Database Error
```
⚠️ Kunde inte spara just nu. Försök igen?

(Jag kommer ihåg: "[task title]")
```

### Invalid Input
```
🤔 Jag förstod inte riktigt.

Försök med: "Jag måste [göra något specifikt]"
```

### Duplicate Detection

Before creating, optionally check for similar tasks:
```bash
bun run .system/tools/aida-cli.ts tasks searchTasks "ringa banken"
```

If similar exists:
```
Jag hittade en liknande uppgift:
- "Ringa banken om lånet" (skapad igår)

Skapa ny ändå, eller menade du den här?
```

---

## Speed Optimizations

### 1. Parallel Queries

When possible, run queries in parallel:
```bash
# Run these simultaneously:
bun run .system/tools/aida-cli.ts roles getActiveRoles &
bun run .system/tools/aida-cli.ts tasks searchTasks "keyword" &
wait
```

### 2. Cache Role List

Fetch roles once at skill start, reuse for all captures in session.

### 3. Skip Optional Lookups

- Don't search for duplicates by default
- Don't search projects unless mentioned
- Don't validate role keywords for every word

### 4. Single Confirmation

Combine task creation + confirmation in ONE response:
```
[CREATE TASK]
[SHOW CONFIRMATION]
```

Never:
```
[CREATE TASK]
"Task created!"
[NEW MESSAGE]
"Here are the details..."
```

---

## Flow Diagram

```
Input Received
      │
      ▼
┌─────────────┐
│ Parse Input │──────────────────┐
└─────────────┘                  │
      │                          │
      ▼                          │
┌─────────────┐                  │
│ Infer Role  │                  │
└─────────────┘                  │
      │                          │
      ▼                          │
 Confidence?                     │
  ├─ HIGH ──────────────────────►│
  │                              │
  └─ LOW ──► Ask Role ──────────►│
                                 │
                                 ▼
                          ┌─────────────┐
                          │ Create Task │
                          └─────────────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ Log Journal │
                          └─────────────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │  Confirm    │
                          └─────────────┘
                                 │
                                 ▼
                            Offer Next?
                          (activation/more)
```

---

## Success Criteria

- [ ] Task captured in under 10 seconds (simple case)
- [ ] Maximum 1 question asked (role if ambiguous)
- [ ] Confirmation shown immediately
- [ ] All database ops via aida-cli.ts
- [ ] Journal entry created
- [ ] Swedish output
- [ ] Emojis used appropriately ✅📅🎭
- [ ] Activation offered when relevant
