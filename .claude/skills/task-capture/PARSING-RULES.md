# Parsing Rules for Task Capture 📝

> **Goal**: Extract structured task data from natural language input
> **Languages**: Swedish (primary), English (supported)

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

## Task Title Extraction

### Rule 1: Remove Intent Phrases

Strip common intent phrases to get clean task title:

**Swedish phrases to remove:**
- "Jag måste..." → ""
- "Jag ska..." → ""
- "Jag behöver..." → ""
- "Kom ihåg att..." → ""
- "Glöm inte..." → ""
- "Lägg till uppgift:" → ""
- "Ny task:" → ""
- "Todo:" → ""

**English phrases to remove:**
- "I need to..." → ""
- "I have to..." → ""
- "I should..." → ""
- "Remind me to..." → ""
- "Don't forget to..." → ""
- "Add task:" → ""
- "New todo:" → ""

**Example:**
- Input: "Jag måste ringa tandläkaren imorgon"
- After stripping: "ringa tandläkaren imorgon"

### Rule 2: Extract Date/Time First

Before finalizing title, extract temporal expressions:

**Swedish date patterns:**
| Pattern | Interpretation |
|---------|----------------|
| "idag" | Today's date |
| "imorgon" | Tomorrow |
| "i övermorgon" | Day after tomorrow |
| "på måndag/tisdag/..." | Next occurrence of weekday |
| "nästa vecka" | Monday of next week |
| "om X dagar" | X days from now |
| "innan fredag" | Friday as deadline |
| "senast [date]" | Hard deadline |
| "före jul" | December 23 |
| "efter nyår" | January 2 |

**Use getTimeInfo() for parsing:**
```typescript
import { getTimeInfo } from '.system/tools/utilities/time.ts';
const parsed = await getTimeInfo('nästa tisdag');
// Returns: { date: "2025-12-17", ... }
```

**Example:**
- Input: "ringa tandläkaren imorgon"
- Title: "Ringa tandläkaren"
- Deadline: [tomorrow's date]

### Rule 3: Capitalize First Letter

Task titles should start with capital letter:
- "ringa tandläkaren" → "Ringa tandläkaren"
- "skicka rapport" → "Skicka rapport"

### Rule 4: Remove Trailing Punctuation

Clean up title:
- "Ringa tandläkaren." → "Ringa tandläkaren"
- "Skicka rapporten!" → "Skicka rapporten"

---

## Deadline Extraction

### Priority Order

1. **Explicit deadline** ("deadline: fredag", "senast måndag")
2. **Hard temporal** ("innan fredag", "före 15 december")
3. **Soft temporal** ("nästa vecka", "snart")
4. **Implicit** ("imorgon" in context usually means deadline)

### Deadline Keywords (Swedish)

| Keyword | Type | Example |
|---------|------|---------|
| "deadline" | Explicit | "deadline fredag" |
| "senast" | Hard | "senast på måndag" |
| "innan" | Hard | "innan jul" |
| "före" | Hard | "före mötet" |
| "till" | Soft | "till nästa vecka" |
| "om" | Relative | "om 3 dagar" |

### When NOT to Set Deadline

- "Ringa tandläkaren någon gång" → No deadline (vague)
- "Kanske städa garaget" → No deadline (uncertain)
- No temporal mention at all → No deadline

---

## Priority Extraction

### Priority Keywords

| Priority | Swedish Keywords | English Keywords |
|----------|------------------|------------------|
| 3 (Highest) | "viktig", "kritisk", "brådskande", "akut", "ASAP" | "critical", "urgent", "important", "ASAP" |
| 2 | "bör göras", "snart", "denna vecka" | "should do", "soon", "this week" |
| 1 | "när jag hinner", "låg prio" | "when I have time", "low priority" |
| 0 (Default) | No indicator | No indicator |

### Context-Based Priority

- Has deadline today → Priority 3
- Has deadline this week → Priority 2
- Mentioned as "viktig" → Priority +1
- Mentioned as "låg prio" → Priority 0

---

## Energy Requirement Extraction

### High Energy Indicators 🔋

**Keywords:**
- "implementera", "bygga", "designa", "skapa"
- "planera", "strategisk", "beslut"
- "lära sig", "studera", "analysera"
- "skriva" (long-form), "dokumentera"

**Task types:**
- Coding/development
- Strategic planning
- Learning new things
- Creative work
- Complex problem-solving

### Medium Energy Indicators ⚡

**Keywords:**
- "möte", "prata med", "diskutera"
- "granska", "revidera", "uppdatera"
- "testa", "verifiera"
- "svara på", "kommunicera"

**Task types:**
- Meetings
- Communication
- Reviews
- Routine updates

### Low Energy Indicators 🔌

**Keywords:**
- "ringa", "boka", "beställa"
- "organisera", "städa", "sortera"
- "läsa" (casual), "kolla"
- "admin", "rutin"

**Task types:**
- Administrative tasks
- Phone calls
- Organizing
- Simple lookups

---

## Project Association

### Extraction Rules

1. **Explicit mention**: "för AIDA-projektet" → Search projects for "AIDA"
2. **Context keywords**: Technical terms → Developer projects
3. **Role context**: If role is clear, search that role's projects

### Query for Project Matching

```bash
bun run .system/tools/aida-cli.ts projects searchProjects "keyword"
```

---

## Examples

### Example 1: Full Parse

**Input:** "Jag måste skriva färdigt arkitekturdokumentationen för AIDA innan fredag, det är viktigt"

**Parsed:**
```json
{
  "title": "Skriva färdigt arkitekturdokumentationen",
  "deadline": "2025-12-20",
  "priority": 3,
  "energy_requirement": "high",
  "project_hint": "AIDA",
  "role_hint": "developer/technical"
}
```

### Example 2: Minimal Parse

**Input:** "Ringa mamma"

**Parsed:**
```json
{
  "title": "Ringa mamma",
  "deadline": null,
  "priority": 0,
  "energy_requirement": "low",
  "project_hint": null,
  "role_hint": "personal/family"
}
```

### Example 3: Date Parse

**Input:** "Boka tandläkartid nästa tisdag"

**Parsed:**
```json
{
  "title": "Boka tandläkartid",
  "deadline": "2025-12-17",
  "priority": 0,
  "energy_requirement": "low",
  "project_hint": null,
  "role_hint": "personal"
}
```

---

## Fallback Rules

1. **Can't parse date?** → Don't set deadline, confirm with user
2. **Unclear priority?** → Default to 0
3. **Unknown energy?** → Default to "medium"
4. **No role hints?** → Ask user (see ROLE-INFERENCE.md)
5. **Title unclear?** → Show extracted title, ask for confirmation

---

## Success Criteria

- [ ] Intent phrases stripped correctly
- [ ] Swedish dates parsed via getTimeInfo()
- [ ] Title capitalized and cleaned
- [ ] Priority extracted when present
- [ ] Energy inferred from keywords/task type
- [ ] Project hints identified
- [ ] Fallbacks used when parsing fails
