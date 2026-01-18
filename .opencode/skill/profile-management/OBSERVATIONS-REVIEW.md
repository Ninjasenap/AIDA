# Learning Observations Review

> **Invocation Context:** This workflow is invoked BY the profile-learner agent after pattern analysis, not directly by user triggers. The agent analyzes data, creates/updates observations, then invokes this skill to display results and handle user actions.

Guide för att granska och applicera AIDA:s inlärda mönster.

## När ska denna workflow användas

**Primarily invoked by profile-learner agent** after:
- User says "vad har du lärt dig om mig?" or "granska observationer" (agent analyzes first, then calls this skill)
- Evening check-in completes (agent analyzes day's data if new observations exist)

**Direct skill triggers** (without agent analysis):
- "visa inlärning" - Display existing observations without new analysis
- When viewing profile and active observations exist - Offer to review

## Grundprinciper

1. **Transparens** - Visa alltid evidens bakom observationer
2. **User Control** - Användaren beslutar om applicering
3. **Non-intrusive** - Erbjud, tvinga aldrig
4. **Explanation** - Förklara varför AIDA föreslår ändringen

## Hämta Observationer

```bash
# Alla observationer
bun run src/aida-cli.ts profile getObservations

# Filtrera per kategori
bun run src/aida-cli.ts profile getObservations "energy"
bun run src/aida-cli.ts profile getObservations "role_focus"
```

## Visningsformat

### Översikt

```
**AIDA:s Inlärning** 🎓

Jag har observerat [antal] mönster i ditt arbete:

[För varje active observation, grupperat per kategori:]

**[Kategori-rubrik]** ([antal] observations)
[Lista observations i kategorin]

---
Vill du granska alla? (ja/nej)
Eller välj en kategori: energy / role_focus / task_completion / work_style
```

### Kategori-rubriker (svensk översättning)

```typescript
const categoryLabels = {
  energy: 'Energimönster ⚡',
  time_preference: 'Tidspreferenser ⏰',
  role_focus: 'Rollfokus 🎭',
  task_completion: 'Uppgiftshantering ✅',
  work_style: 'Arbetsstil 💼',
  communication: 'Kommunikation 💬',
  other: 'Övrigt 📋',
};
```

### Enskild Observation

```
**Observation [index]/[total]**: [category-label]

**Mönster**: [pattern]

**Förtroende**: [confidence * 100]% (baserat på [evidence.length] st bevis)

**Bevis**:
[För varje evidence item:]
• [evidence]

[Om suggested_update finns:]
**Förslag**:
[suggested_update.rationale]

Specifikt: Uppdatera "[path]" till "[value]"

[Om confidence < 0.6:]
⚠️ Lågt förtroende - behöver mer data för att vara säker.

---
Vad vill du göra?
1. Applicera förslaget
2. Avvisa observationen
3. Fortsätt observera (behåll som active)
4. Hoppa till nästa
5. Avsluta granskning
```

## Användarval och Hantering

### Val 1: Applicera förslaget

```
Okej! Applicerar ändring:
  Fält: [path]
  Från: [current value]
  Till:  [suggested value]

Bekräfta? (ja/nej)
```

**Vid ja**:
```bash
bun run src/aida-cli.ts profile applyObservationSuggestion "[observation.id]"
```

**Bekräftelse**:
```
✅ Tillämpat! [Beskrivning av ändring]

Observationen är markerad som "applied".

[Nästa observation eller avsluta]
```

### Val 2: Avvisa observationen

```
Okej, varför vill du avvisa denna observation?
(Valfri feedback - hjälper AIDA lära sig)

[Användare svarar eller hoppar över]
```

**Uppdatera observation**:
```bash
bun run src/aida-cli.ts profile updateObservation "[observation.id]" '{"status":"dismissed"}'
```

**Logga feedback** (om given):
```bash
# Spara som feedback entry kopplad till observationen
bun run src/aida-cli.ts profile recordSuggestion '{"type":"profile_update","suggestion":"[pattern]","outcome":"rejected","user_feedback":"[feedback]","related_observation_id":"[observation.id]"}'
```

**Bekräftelse**:
```
Okej, jag har noterat det. Tack för feedbacken!

Observationen är avvisad och kommer inte visas igen.

[Nästa observation]
```

### Val 3: Fortsätt observera

```
Okej! Jag fortsätter samla evidens för detta mönster.

[Nästa observation]
```

### Val 4: Hoppa till nästa

```
[Visa nästa observation]
```

### Val 5: Avsluta granskning

```
Granskning avslutad!

Sammanfattning:
• [antal] applicerade
• [antal] avvisade
• [antal] fortsätter observeras

Vill du se en översikt av ändringar? (ja/nej)
```

## Batch-hantering

Om användaren vill applicera alla på en gång:

```
Du kan också välja:
• Applicera alla med högt förtroende (≥70%) → "applicera alla högförtroende"
• Applicera alla → "applicera alla" (OBS: Rekommenderas ej utan granskning)
• Avvisa alla → "avvisa alla"
```

**Vid "applicera alla högförtroende"**:
```
Observationer med ≥70% förtroende:
[Lista observations]

Detta kommer att göra [antal] ändringar i din profil.

Är du säker? (ja/nej)
```

## Förtroende-nivåer

Visa förtroende visuellt:

```typescript
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return '🟢 Mycket hög (≥90%)';
  if (confidence >= 0.7) return '🟡 Hög (≥70%)';
  if (confidence >= 0.5) return '🟠 Medium (≥50%)';
  return '🔴 Låg (<50%)';
}
```

## Efter Granskning

### Visa Ändringsöversikt

Om användaren vill se översikt:

```
**Ändringar från granskningen**:

[För varje applied observation:]
✅ [pattern]
   Ändrade: [path]
   Från: [old_value]
   Till: [new_value]
   Rationale: [rationale]

Du kan alltid ångra dessa ändringar genom att uppdatera profilen manuellt.
```

### Logga Session

Logga granskningssessionen för framtida analys:

```bash
# För varje applicerad observation finns redan update_log entry från applyObservationSuggestion
# För avvisade, logga feedback entry (redan gjort ovan)
```

## Särskilda Fall

### Observations utan Suggested Update

Om observation saknar `suggested_update`:

```
**Observation [index]**: [category-label]

**Mönster**: [pattern]

**Förtroende**: [confidence * 100]%

**Bevis**:
[evidence items]

**Status**: Detta är en observation utan specifikt ändringsförslag.
AIDA behöver mer data för att föreslå en konkret ändring.

Vill du:
1. Fortsätt observera
2. Avvisa observation
3. Hoppa till nästa
```

### Konfliktande Observations

Om två observations föreslår ändringar av samma path:

```
⚠️ Obs! Flera observationer påverkar samma inställning:

Observation 1: [pattern1]
  Förslag: [value1]

Observation 2: [pattern2]
  Förslag: [value2]

Vilket föredrar du? (1/2/inget)
```

## Exempel på Full Interaktion

**Användare**: "Vad har du lärt dig om mig?"

**AIDA**:
```
**AIDA:s Inlärning** 🎓

Jag har observerat 3 mönster i ditt arbete:

**Energimönster ⚡** (1 observation)
• Du slutför djuparbete mestadels på morgonen

**Rollfokus 🎭** (1 observation)
• Stark fokus på Developer-rollen

**Tidspreferenser ⏰** (1 observation)
• Föredrar arbeta 07:00-15:00 istället för standardtider

Vill du granska alla? (ja/nej)
```

**Användare**: "ja"

**AIDA**:
```
**Observation 1/3**: Energimönster ⚡

**Mönster**: Du slutför 85% av deep work-uppgifter mellan 06:00-09:00

**Förtroende**: 🟢 Mycket hög (85%)

**Bevis**:
• 2025-12-10: Färdigställde arkitekturdok kl 07:30
• 2025-12-11: Kodgranskning kl 08:15
• 2025-12-12: Problemlösning kl 08:00
• 2025-12-13: Design-arbete kl 07:45
• 2025-12-14: Refactoring kl 08:30

**Förslag**:
Din deep work sker främst på morgonen. Uppdatera "preferred_time" för
deep_work-aktiviteter till "morning" för bättre task scheduling.

Specifikt: Uppdatera "energy_pattern.high.activities.deep_work.preferred_time" till "morning"

---
Vad vill du göra?
1. Applicera förslaget
2. Avvisa observationen
3. Fortsätt observera
4. Hoppa till nästa
5. Avsluta granskning
```

**Användare**: "1"

**AIDA**:
```
Okej! Applicerar ändring:
  Fält: energy_pattern.high.activities.deep_work.preferred_time
  Från: "afternoon"
  Till:  "morning"

Bekräfta? (ja/nej)
```

**Användare**: "ja"

**AIDA**:
```bash
bun run src/aida-cli.ts profile applyObservationSuggestion "[obs-id]"
```

```
✅ Tillämpat! Deep work-aktiviteten är nu satt till föredragen tid "morning".

Detta hjälper AIDA föreslå deep work-uppgifter på morgonen när du har mest energi.

---
**Observation 2/3**: Rollfokus 🎭
[Fortsätter med nästa observation...]
```
