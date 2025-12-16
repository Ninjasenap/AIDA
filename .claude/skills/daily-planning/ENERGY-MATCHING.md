# Energy-Aware Task Matching

> **Purpose:** Match tasks to user's energy levels for optimal productivity and wellbeing
> **Source:** User energy patterns from `.system/context/personal-profile.json`

---

## Energy Levels & Task Types

### High Energy

**Characteristics:**
- Mental clarity
- Deep focus available
- Creative thinking
- Problem-solving capacity

**Best for:**
- Deep work (programming, writing, design)
- Strategic planning
- Learning new concepts
- Creative tasks
- Complex problem-solving
- Decision-making requiring analysis

**Task markers:**
- `energy_requirement='high'`
- Priority 2-3 (important tasks)
- Tasks requiring sustained focus
- Creative or analytical work

**Examples:**
- Write architecture documentation
- Implement complex feature
- Design system architecture
- Learn new technology
- Strategic project planning

---

### Medium Energy

**Characteristics:**
- Good baseline functioning
- Can handle routine work
- Social interaction possible
- Moderate focus

**Best for:**
- Routine work
- Meetings and communication
- Code reviews
- Testing existing code
- Administrative tasks (with some thought)
- Collaborative work

**Task markers:**
- `energy_requirement='medium'`
- Priority 1 (routine but important)
- Tasks with clear structure
- Communication-heavy tasks

**Examples:**
- Team meetings
- Email responses
- Code review
- Documentation updates (not creation)
- Project status updates
- Testing and QA

---

### Low Energy

**Characteristics:**
- Limited focus capacity
- Reduced decision-making energy
- Good for passive tasks
- Need for structure

**Best for:**
- Administrative tasks (simple)
- Passive activities (reading, reviewing)
- Organizing and cleaning up
- Easy completions
- Low-stakes communication

**Task markers:**
- `energy_requirement='low'`
- Priority 0 (nice to have)
- Tasks requiring minimal thought
- Repetitive or mechanical tasks

**Examples:**
- Organize files
- Update task statuses
- Light email triage
- Documentation reading
- Planning next week's schedule
- Clearing inbox

---

## Reading User Energy Pattern

From `personal-profile.json`:

```json
{
  "energy_pattern": {
    "high": ["06:00-10:00", "18:00-20:00"],
    "medium": ["10:00-14:00", "20:00-21:00"],
    "low": ["14:00-18:00", "21:00-22:00"]
  }
}
```

**Access via template variables:**
- `{{user.energy_pattern.high}}`
- `{{user.energy_pattern.medium}}`
- `{{user.energy_pattern.low}}`

---

## Matching Algorithm

### Step 1: Get Current Time

```bash
bun run .system/tools/utilities/time.ts getTimeInfo
```

Parse the JSON output to extract `hour` and `minute` fields.

### Step 2: Determine Current Energy Level

```typescript
function getCurrentEnergyLevel(hour: number, energyPattern: EnergyPattern): 'high' | 'medium' | 'low' {
  // Check each period
  for (const period of energyPattern.high) {
    if (isInPeriod(hour, period)) return 'high';
  }
  for (const period of energyPattern.medium) {
    if (isInPeriod(hour, period)) return 'medium';
  }
  for (const period of energyPattern.low) {
    if (isInPeriod(hour, period)) return 'low';
  }
  return 'medium'; // default fallback
}

function isInPeriod(hour: number, period: string): boolean {
  // period format: "06:00-10:00"
  const [start, end] = period.split('-');
  const startHour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);
  return hour >= startHour && hour < endHour;
}
```

### Step 3: Filter Tasks by Energy Match

```typescript
// From tasks.ts query result
const todayTasks = await getTodayTasks();

// Current energy level
const currentEnergy = getCurrentEnergyLevel(now.hour, user.energy_pattern);

// Filter and score tasks
const scoredTasks = todayTasks.map(task => ({
  ...task,
  energyMatch: calculateEnergyMatch(task, currentEnergy),
  urgencyScore: calculateUrgency(task),
  roleBalance: calculateRoleBalance(task, user.roles)
}));

// Sort by combined score
scoredTasks.sort((a, b) =>
  (b.energyMatch + b.urgencyScore + b.roleBalance) -
  (a.energyMatch + a.urgencyScore + a.roleBalance)
);
```

### Step 4: Energy Match Scoring

```typescript
function calculateEnergyMatch(task: Task, currentEnergy: EnergyLevel): number {
  const requirement = task.energy_requirement || 'medium';

  if (requirement === currentEnergy) return 10; // Perfect match

  // Acceptable mismatches (can still do, but not optimal)
  if (currentEnergy === 'high') {
    if (requirement === 'medium') return 7; // Can do medium with high energy
    if (requirement === 'low') return 5; // Can do low, but wasteful
  }

  if (currentEnergy === 'medium') {
    if (requirement === 'low') return 8; // Can easily do low with medium
    if (requirement === 'high') return 3; // Struggle with high tasks
  }

  if (currentEnergy === 'low') {
    if (requirement === 'medium') return 2; // Very hard
    if (requirement === 'high') return 0; // Don't suggest
  }

  return 5; // default
}
```

---

## Special Cases

### Case 1: Task Lacks Energy Requirement

**If `task.energy_requirement === null`:**

Use heuristics:
- Priority 2-3 → Assume 'high'
- Has deadline today → Assume 'medium'
- Simple admin task → Assume 'low'
- Default → 'medium'

### Case 2: All Tasks Require High Energy, But User Has Low

**Don't suggest impossible tasks**

Response:
```
Du har låg energi just nu.

Inga av dagens tasks passar den nivån - vilket är helt okej!

Förslag:
1. Ta en paus
2. Gör något lätt (organisera, läs)
3. Vänta till imorgon när energin är tillbaka

Vad känns bäst?
```

### Case 3: Deadline Today But Wrong Energy

**Prioritize deadline, but acknowledge mismatch:**

```
"Rapport" har deadline idag, men kräver hög energi (du har medel nu).

Alternativ:
1. Pusha genom (1-2 timmar)
2. Vänta till [nästa högenergitid] idag
3. Justera deadline om möjligt

Vad föredrar du?
```

### Case 4: User Overrides Energy (Reported vs Pattern)

**User says:** "Jag är pigg!" (even though pattern says low energy)

**TRUST the user's self-report:**
- User knows their body best
- Pattern is guideline, not rule
- Update matching to use reported energy

---

## Communicating Energy Matches

**When suggesting tasks, explain energy match (Swedish):**

**Perfect match:**
```
✅ [Task] - Passar din energinivå perfekt!
```

**Acceptable match:**
```
👍 [Task] - Passar din nuvarande energi
```

**Mismatch (but urgent):**
```
⚠️ [Task] - Kräver mer energi, men deadline idag
   Vill du pusha genom, eller justera?
```

**Poor match (skip):**
```
[Don't suggest these tasks at all - wait for better energy time]
```

---

## Energy Transitions

**Suggest timing based on energy pattern:**

**User at low energy, high-energy task waiting:**
```
Den här uppgiften passar bättre imorgon 06:00-10:00 när du har hög energi.

Ska vi schemalägga den då?
```

**User finishing high-energy period:**
```
Du har högenergitid kvar i [X] minuter.

Vill du:
1. Fortsätta med detta (max ut tiden)?
2. Avsluta nu och förbereda nästa fas?
```

---

## Profile Integration

**From user profile, also consider:**

### Time Definitions
```json
"time_definitions": {
  "morning": "06:00-10:00",
  "afternoon": "12:00-17:00",
  "evening": "18:00-22:00"
}
```

Use for context in greetings and time-of-day references.

### Work Principles
```json
"work_principles": [
  "Deep work blocks in morning",
  "No meetings before 10:00",
  "Admin in low-energy periods"
]
```

Use as hard constraints when scheduling.

---

## Examples

### Example 1: Morning (High Energy)

**Time:** 08:00
**Energy:** High
**Available tasks:**
1. Write architecture doc (high energy, priority 3, deadline today)
2. Email responses (low energy, priority 1)
3. Code review (medium energy, priority 2)

**Matching scores:**
1. Architecture: 10 (energy) + 8 (urgency) + 5 (priority) = 23
2. Email: 5 (energy) + 2 (urgency) + 2 (priority) = 9
3. Code review: 7 (energy) + 4 (urgency) + 4 (priority) = 15

**Suggestion:**
```
Du har hög energi nu (08:00) - perfekt för deep work!

Förslag:
1. **Arkitekturdokumentation** (Developer)
   ✅ Passar din energi perfekt
   ⏰ Deadline idag
   📝 2 timmar uppskattad tid
```

### Example 2: Afternoon Slump (Low Energy)

**Time:** 15:00
**Energy:** Low
**Available tasks:**
1. Complex algorithm (high energy, priority 3)
2. File organization (low energy, priority 0)
3. Meeting prep (medium energy, deadline tomorrow)

**Matching scores:**
1. Algorithm: 0 (energy mismatch) - SKIP
2. File org: 10 (energy) + 1 (urgency) = 11
3. Meeting prep: 2 (energy) + 5 (urgency) = 7

**Suggestion:**
```
Du har låg energi nu (15:00) - post-lunch slump!

Lätta uppgifter som passar:

1. **Organisera filer** (Personal)
   ✅ Passar din energi
   🧹 Känns bra att få gjort

Det komplexa algoritm-arbetet väntar till imorgon morgon (hög energi). Okej?
```

---

## Success Criteria

- [ ] Current time determined via getTimeInfo()
- [ ] User energy pattern read from profile
- [ ] Current energy level calculated correctly
- [ ] Tasks scored by energy match + urgency + role balance
- [ ] High-energy tasks NOT suggested during low energy
- [ ] User self-reported energy overrides pattern
- [ ] Energy match communicated clearly (Swedish)
- [ ] Alternative timing suggested when mismatch
- [ ] No guilt-inducing language about energy levels
