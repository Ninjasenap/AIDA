# Activation Techniques 💡

> **Goal**: Help users START tasks by removing activation barriers
> **Based on**: ADHD-friendly productivity research

---

## 🚨 CRITICAL: Database Access

**ALL database queries MUST use `aida-cli.ts`:**

```bash
# CORRECT pattern:
bun run src/aida-cli.ts <module> <function> [args...]

# NEVER use query modules directly!
```

---

## Core Techniques

### 1. The 5-Minute Rule ⏱️

**Principle:** Commit to just 5 minutes. After that, decide if you want to continue.

**Why it works:**
- Starting is the hardest part
- Once in motion, momentum carries you
- 5 minutes feels non-threatening
- Often leads to 25+ minutes

**How to present (Swedish):**
```
Du behöver bara göra 5 minuter.

Efter det kan du bestämma om du vill fortsätta.
Ofta vill man det, men om inte - det är okej!

5 minuter. Kör!
```

**When to use:**
- User says "orkar inte"
- Task feels big/overwhelming
- Procrastination suspected
- Any time user hesitates

---

### 2. Smallest Possible Step 🔬

**Principle:** Break task down until the first step is OBVIOUS and EASY.

**Why it works:**
- Removes decision fatigue
- Makes starting trivial
- Builds momentum through micro-wins

**How to extract smallest step:**

| Task | Too Big | Just Right |
|------|---------|------------|
| "Skriv rapport" | "Börja skriva" | "Öppna dokumentet" |
| "Implementera feature" | "Skriv koden" | "Skapa ny fil" |
| "Ringa kund" | "Ring samtalet" | "Hitta telefonnumret" |
| "Städa huset" | "Städa vardagsrummet" | "Plocka upp 5 saker" |
| "Svara på mail" | "Svara på alla" | "Öppna första mailet" |

**Test:** If user can do it in <2 minutes without thinking, it's small enough.

**How to present (Swedish):**
```
Första steget - superenkelt:

🎯 [Smallest possible action]

Bara det. Inget mer just nu.
```

---

### 3. Remove All Options 🎯

**Principle:** Make the decision FOR them. Don't offer choices.

**Why it works:**
- Decision fatigue is real
- "What should I do?" means they can't choose
- One clear direction removes paralysis

**DON'T do this:**
```
❌ Du kan antingen:
   1. Jobba med rapporten
   2. Svara på mail
   3. Ringa kunden

   Vad vill du göra?
```

**DO this:**
```
✅ 🎯 Nästa steg: Öppna rapporten

   Kör!
```

**When to use:**
- User asks "vad ska jag göra?"
- User seems paralyzed
- Multiple competing priorities

---

### 4. Body Doubling (Virtual) 👥

**Principle:** Having someone "present" makes starting easier.

**How to implement:**
```
Jag är här med dig.

🎯 Starta med: [task]

Säg till när du börjat, så checkar jag in om 5 minuter!
```

**Follow-up after 5 minutes:**
```
Hur går det?

🔄 Fortsätt med samma?
✅ Klart - vad är nästa?
⏸️ Behöver paus?
```

---

### 5. Temptation Bundling 🎁

**Principle:** Combine boring task with something enjoyable.

**How to suggest (Swedish):**
```
Tips: Sätt på musik/podcast medan du gör detta?

🎵 + 🎯 = Lättare att börja!
```

**Examples:**
- "Sätt på favoritmusiken och börja med rapporten"
- "Podcast i lurarna medan du svarar på mail"
- "Kaffe redo? Perfekt tillfälle att ringa"

---

### 6. Implementation Intentions 📍

**Principle:** Specify WHEN and WHERE, not just WHAT.

**Format:**
```
När [trigger], då [action].
```

**How to present:**
```
🎯 "När du har ställt ner kaffekoppen, öppna rapporten"

Låter det rimligt?
```

**Why it works:**
- Creates mental link to trigger
- Reduces need for willpower
- "Decides" in advance

---

### 7. Just Start Anywhere 🎲

**Principle:** For some tasks, ANY starting point works.

**When to use:**
- Task has no clear sequence
- User is paralyzed by "where to start"
- Creative/writing tasks

**How to present:**
```
Det spelar ingen roll var du börjar.

🎯 Välj ETT ställe och börja där.

Du kan ändra ordning senare - men börja NU.
```

---

### 8. The 2-Minute Rule ⚡

**Principle:** If it takes <2 minutes, do it NOW.

**When to suggest:**
```
Det här tar under 2 minuter.

🎯 Gör det nu - direkt!

Sen är det klart. Forever. ✅
```

**Works for:**
- Quick emails
- Short calls
- Simple decisions
- Filing/organizing

---

## Technique Selection Matrix

| User State | Primary Technique | Secondary |
|------------|-------------------|-----------|
| "Orkar inte" | 5-Minute Rule | Smallest Step |
| "Vet inte var jag ska börja" | Smallest Step | Remove Options |
| "För mycket att göra" | Remove Options | 5-Minute Rule |
| "Kan inte bestämma mig" | Remove Options | Implementation Intention |
| "Det är så tråkigt" | Temptation Bundling | 5-Minute Rule |
| "Jag skjuter upp det" | Implementation Intention | Smallest Step |
| "Känns överväldigande" | Smallest Step | Body Doubling |

---

## Language Patterns (Swedish)

### Starting Phrases
- "Bara [action]" - Minimizes perceived effort
- "5 minuter" - Time-boxed commitment
- "EN sak" - Removes overwhelm
- "Kör!" - Energizing, action-oriented

### Encouraging Phrases
- "Du klarar det" - Confidence
- "Jag är här" - Support
- "Liten sak" - Minimizing
- "Framsteg!" - Celebrating

### Reframing Phrases
- "Låt oss bryta ner det" - Problem-solving
- "Vad är första steget?" - Collaborative
- "Resten kan vänta" - Permission to focus

---

## DO's and DON'Ts

### ✅ DO

- Break tasks into tiny steps
- Make one clear suggestion
- Use encouraging language
- Offer the 5-minute escape hatch
- Celebrate small wins
- Check in after short intervals

### ❌ DON'T

- Show the full task list
- Offer multiple options
- Use guilt or pressure
- Say "you should have..."
- Minimize their struggle
- Push when they need rest

---

## Success Criteria

- [ ] User starts the task
- [ ] First step is obvious and easy
- [ ] 5-minute rule offered
- [ ] No multiple choice given
- [ ] Supportive, non-judgmental tone
- [ ] Follow-up offered
- [ ] Small wins celebrated
