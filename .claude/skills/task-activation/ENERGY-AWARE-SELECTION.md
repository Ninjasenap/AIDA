# Energy-Aware Task Selection 🔋

> **Goal**: Match task suggestions to user's current energy level
> **Principle**: Right task at right time = Success

---

## 🚨 CRITICAL: Database Access

**ALL database queries MUST use `aida-cli.ts`:**

```bash
# Get today's tasks
bun run src/aida-cli.ts tasks getTodayTasks

# NEVER use query modules directly!
```

---

## Energy Assessment

### Step 1: Check User's Energy Pattern

Read from user profile (`.system/context/personal-profile.json`):

```json
{
  "energy_pattern": {
    "high": ["06:00-10:00", "18:00-20:00"],
    "medium": ["10:00-14:00", "20:00-21:00"],
    "low": ["14:00-18:00", "21:00-22:00"]
  }
}
```

### Step 2: Get Current Time

```bash
bun run src/utilities/time.ts
```

### Step 3: Determine Default Energy

| Current Time | Default Energy |
|--------------|----------------|
| 06:00-10:00 | HIGH ⚡⚡⚡ |
| 10:00-14:00 | MEDIUM ⚡⚡ |
| 14:00-18:00 | LOW ⚡ |
| 18:00-20:00 | HIGH ⚡⚡⚡ |
| 20:00-21:00 | MEDIUM ⚡⚡ |
| 21:00-06:00 | LOW ⚡ |

### Step 4: User Override

**If user says:**
- "Jag är pigg!" → HIGH
- "Bra energi" → HIGH
- "Okej" → MEDIUM
- "Trött", "orkar inte" → LOW
- "Utmattad" → VERY LOW

**TRUST user self-report over pattern!**

---

## Task-Energy Matching

### High Energy Tasks 🔋🔋🔋

**Characteristics:**
- Require deep focus
- Complex problem-solving
- Creative work
- Learning new things
- Strategic decisions

**Database markers:**
- `energy_requirement = 'high'`
- Priority 2-3
- Involves coding/writing/designing

**Examples:**
- Implementera feature
- Skriv arkitekturdokumentation
- Planera strategi
- Lär dig nytt verktyg

### Medium Energy Tasks 🔋🔋

**Characteristics:**
- Routine work
- Communication
- Reviews
- Collaboration
- Structured tasks

**Database markers:**
- `energy_requirement = 'medium'`
- Priority 1
- Meetings, reviews

**Examples:**
- Code review
- Svara på mail
- Möte
- Uppdatera dokumentation

### Low Energy Tasks 🔋

**Characteristics:**
- Simple, repetitive
- Minimal decisions
- Organizing
- Short phone calls

**Database markers:**
- `energy_requirement = 'low'`
- Priority 0
- Admin tasks

**Examples:**
- Ringa snabbt samtal
- Organisera filer
- Bokning
- Läs notiser

---

## Selection Algorithm

### Step 1: Get Tasks
```bash
bun run src/aida-cli.ts tasks getTodayTasks
```

### Step 2: Filter by Energy Match

```
IF user_energy == 'high':
    candidates = tasks WHERE energy_requirement IN ('high', 'medium')

ELIF user_energy == 'medium':
    candidates = tasks WHERE energy_requirement IN ('medium', 'low')

ELIF user_energy == 'low':
    candidates = tasks WHERE energy_requirement == 'low'

IF candidates.empty AND user_energy == 'low':
    # Special case: No low-energy tasks
    Suggest: Take a break, or we can defer high-energy tasks
```

### Step 3: Sort by Priority

```
sorted_candidates = candidates.sort_by(
    deadline_urgency DESC,  # Today's deadlines first
    priority DESC,          # Higher priority next
    created_at ASC          # Older tasks before newer
)
```

### Step 4: Select Top Task

```
selected = sorted_candidates[0]
```

---

## Special Cases

### Case 1: Deadline Today but Wrong Energy

**Scenario:** High-energy task due today, user has low energy

**Response:**
```
⚠️ "Rapporten" har deadline idag, men kräver hög energi.

Du verkar ha låg energi just nu. Alternativ:

1. 🎯 Pusha genom (jag hjälper dig starta)
2. ⏰ Vänta till [next high-energy period]
3. 📅 Försök förlänga deadline?

Vad känns bäst?
```

### Case 2: Only High-Energy Tasks, Low Energy

**Response:**
```
Du har låg energi, och alla uppgifter kräver hög energi.

Förslag:
1. 🛋️ Ta en paus (15-30 min)
2. 🚶 Kort promenad
3. ☕ Kaffe/te-break

Sedan kollar vi igen!

Eller: Finns det något LITET du kan göra?
(organisera, läsa, planera)
```

### Case 3: No Tasks at All

**Response:**
```
Inga uppgifter för idag! 🎉

Alternativ:
1. 📥 Fånga något nytt (/capture)
2. 🔍 Kolla framåt (/overview)
3. 🛋️ Vila - du har gjort det!
```

---

## Energy Mismatch Handling

### Don't Suggest:

| User Energy | Never Suggest |
|-------------|---------------|
| Low | "Implementera komplex feature" |
| Low | "Strategisk planering" |
| Low | "Lär dig nytt verktyg" |
| Medium | "4-timmars deep work" |

### Always Acceptable:

| Task Type | Any Energy Level |
|-----------|-----------------|
| Ultra-short (<2 min) | ✅ |
| Already started | ✅ |
| User explicitly asked for it | ✅ |

---

## Communicating Energy Match

### Perfect Match (Swedish):
```
✅ Passar din energi perfekt!
```

### Acceptable Match:
```
👍 Bra match för just nu
```

### Mismatch (but urgent):
```
⚠️ Kräver mer energi, men deadline idag
```

### Poor Match (defer):
```
❌ Sparar vi till imorgon morgon när energin är tillbaka
```

---

## Time-Based Suggestions

### Morning (06:00-10:00)
```
Morgon = Hög energi! 🌅

🎯 Perfekt tid för: [high-energy task]

Låt oss maxa din bästa tid!
```

### Afternoon Slump (14:00-16:00)
```
Eftermiddagsdipp? Helt normalt!

🎯 Lättare uppgift: [low-energy task]

Eller: Ta 15 min paus först?
```

### Evening (18:00-20:00)
```
Kvällsenergi! 🌆

🎯 Bra tid för: [high-energy task]

Eller om du vill varva ner: [low-energy alternative]
```

---

## Implementation Notes

### Get User Energy Pattern

```bash
# Read from profile
cat .system/context/personal-profile.json | jq '.energy_pattern'
```

### Time Check

```bash
bun run src/utilities/time.ts
# Returns: { hour: 14, minute: 30, ... }
```

### Task Energy Field

Tasks have `energy_requirement` field:
- `'high'` - Deep work
- `'medium'` - Normal work
- `'low'` - Light work
- `null` - Not specified (treat as medium)

---

## Success Criteria

- [ ] Current time checked
- [ ] User energy assessed (pattern or self-report)
- [ ] Tasks filtered by energy match
- [ ] Deadlines considered
- [ ] Mismatch handled gracefully
- [ ] Single task suggested (not list)
- [ ] Energy match communicated
