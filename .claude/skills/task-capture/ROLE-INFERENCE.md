# Role Inference Rules 🎭

> **Goal**: Automatically determine which role a task belongs to
> **Principle**: Infer first, ask only when ambiguous

---

## 🚨 CRITICAL: Database Access

**ALL database queries MUST use `aida-cli.ts`:**

```bash
# Get all active roles
bun run src/aida-cli.ts roles getActiveRoles

# NEVER use query modules directly!
bun run src/database/queries/roles.ts  # ❌ WRONG!
```

---

## Inference Strategy

### Priority Order

1. **Explicit mention** - User says the role name
2. **Project association** - Task mentions a known project
3. **Keyword matching** - Task contains role-specific keywords
4. **Context inference** - Previous conversation or time of day
5. **Ask user** - Only if all above fail

---

## Role Keyword Mappings

### 🖥️ Technical/Developer Roles

**Keywords (Swedish):**
- "kod", "koda", "programmera", "implementera"
- "bugg", "fix", "debug", "felsök"
- "api", "databas", "server", "frontend", "backend"
- "test", "testa", "deploy", "release"
- "arkitektur", "design", "refaktorera"
- "git", "commit", "merge", "branch"
- "funktion", "modul", "komponent"

**Keywords (English):**
- "code", "implement", "build", "develop"
- "bug", "fix", "debug"
- "API", "database", "server"
- "test", "deploy", "release"

**Confidence:** HIGH when 2+ keywords match

### 📋 Administrative/Coordination Roles

**Keywords (Swedish):**
- "rapport", "dokument", "dokumentation"
- "möte", "agenda", "protokoll"
- "samordna", "koordinera", "planera"
- "uppföljning", "status", "rapport"
- "budget", "resurs", "tidplan"
- "förändring", "process", "rutin"

**Keywords (English):**
- "report", "document", "meeting"
- "coordinate", "plan", "schedule"
- "budget", "timeline", "status"

**Confidence:** HIGH when context is work-related

### 👨‍👩‍👧‍👦 Personal/Family Roles

**Keywords (Swedish):**
- "barn", "familj", "hem", "hus"
- "läkare", "tandläkare", "veterinär"
- "skola", "dagis", "förskola"
- "mat", "handla", "städa"
- "träna", "motion", "hälsa"
- "hobby", "fritid"
- "mamma", "pappa", "fru", "man", "partner"
- "bil", "service", "reparation"

**Keywords (English):**
- "kids", "family", "home", "house"
- "doctor", "dentist", "appointment"
- "school", "daycare"
- "grocery", "shopping", "clean"
- "exercise", "workout", "health"

**Confidence:** HIGH when personal context clear

### 🏛️ Association/Board Roles

**Keywords (Swedish):**
- "förening", "styrelse", "årsmöte"
- "medlem", "stadgar", "protokoll"
- "ordförande", "sekreterare", "kassör"
- "verksamhet", "aktivitet", "evenemang"
- "kallelse", "dagordning"

**Confidence:** HIGH when association context

---

## Project-Based Inference

### Strategy

1. Extract project hints from task text
2. Search projects database
3. If match found → Use project's role

```bash
# Search for project match
bun run src/aida-cli.ts projects searchProjects "AIDA"

# Response includes role_id:
{
  "id": 1,
  "name": "AIDA - AI Digital Assistant",
  "role_id": 3,  # ← Use this for the task
  ...
}
```

### Project Keywords

| Project Hint | Search Term |
|--------------|-------------|
| "AIDA", "Claude", "AI assistant" | "AIDA" |
| "migration", "legacy", "mikroservice" | "migrer" |
| "hemsida", "webb" | "webb" |

---

## Context-Based Inference

### Time of Day

| Time | Likely Role |
|------|-------------|
| 06:00-08:00 | Personal (morning routine) |
| 08:00-17:00 | Work-related |
| 17:00-20:00 | Personal/Family |
| 20:00-22:00 | Hobby/Personal |

**Note:** This is WEAK inference, use only as tiebreaker

### Previous Conversation

If user has been discussing:
- A specific project → Same role
- Work tasks → Work role
- Personal life → Personal role

**Track context in conversation, don't ask again if recently established**

---

## When to Ask User

### MUST Ask When:

1. **Multiple roles match equally** - "skriva rapport" could be work or hobby
2. **No keywords match** - Generic task with no hints
3. **Conflicting signals** - Work keyword + personal time context
4. **New/unknown role mention** - User might have new role

### Ask Format (Swedish):

```
Vilken roll gäller detta?

1. Systemutvecklare
2. Digitaliseringssamordnare
3. Förälder
4. Hobbyutvecklare
5. Annat...

(Eller skriv rollnamnet)
```

### DON'T Ask When:

1. **Clear keyword match** - "debugga API:et" → Developer
2. **Explicit project mention** - "för AIDA-projektet" → Lookup project's role
3. **Explicit role mention** - "för jobbet" → Work role
4. **Recent context** - Just discussed this role

---

## Confidence Scoring

### High Confidence (Auto-assign)

- 2+ strong keyword matches
- Explicit project match
- User mentioned role
- Clear personal context (family member names)

**Action:** Assign role, confirm in response

### Medium Confidence (Confirm)

- 1 keyword match
- Time-of-day inference
- Weak project hint

**Action:** Assign role, ask "Stämmer [roll]?"

### Low Confidence (Ask)

- No keyword matches
- Conflicting signals
- Generic task

**Action:** Ask user to select role

---

## Examples

### Example 1: High Confidence (Auto)

**Input:** "Fixa bugg i auth-modulen för AIDA"

**Analysis:**
- "Fixa bugg" → Developer keyword ✓
- "auth-modul" → Technical keyword ✓
- "AIDA" → Known project (role: Hobbyutvecklare) ✓

**Result:** Auto-assign Hobbyutvecklare, HIGH confidence

---

### Example 2: Medium Confidence (Confirm)

**Input:** "Skriva rapport"

**Analysis:**
- "rapport" → Could be work (Digitaliseringssamordnare) or other
- Time: 14:00 (work hours) → Weak signal for work
- No project hint

**Result:** Ask "Detta verkar vara för jobbet - stämmer det?"

---

### Example 3: Low Confidence (Ask)

**Input:** "Boka tid"

**Analysis:**
- "Boka tid" → Too generic
- No keywords match specifically
- Could be: doctor (personal), meeting (work), service (personal)

**Result:** Ask "Vilken roll gäller detta?"

---

### Example 4: Personal Context Clear

**Input:** "Ring mamma om helgen"

**Analysis:**
- "mamma" → Family keyword ✓
- "helgen" → Personal time ✓

**Result:** Auto-assign Förälder, HIGH confidence

---

## Implementation Notes

### Cache Active Roles

At skill start, fetch roles once:
```bash
bun run src/aida-cli.ts roles getActiveRoles
```

Store in memory for quick lookup during inference.

### Role ID Mapping

Build mapping from role names to IDs:
```json
{
  "Systemutvecklare": 1,
  "Förälder": 2,
  "Hobbyutvecklare": 3,
  "Digitaliseringssamordnare": 4
}
```

### Success Criteria

- [ ] Roles fetched via aida-cli.ts
- [ ] Keyword matching implemented
- [ ] Project lookup working
- [ ] Confidence scoring applied
- [ ] Only asks when truly ambiguous
- [ ] Previous context respected
