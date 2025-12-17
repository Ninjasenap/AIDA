# Task Activation Workflow

> Support for users who struggle with task initiation. "Stuck" detection and response.

## Purpose

This workflow provides activation support when:
- User expresses difficulty starting
- A task seems large or overwhelming
- User mentions feeling stuck or procrastinating
- Presenting any task that might create resistance

---

## Trigger Phrases

Auto-activate when user says:

| Swedish | English |
|---------|---------|
| "Jag kan inte börja..." | "I can't start..." |
| "Jag har skjutit upp..." | "I've been putting off..." |
| "Det känns överväldigande..." | "It feels overwhelming..." |
| "Jag vet inte var jag ska börja..." | "I don't know where to begin..." |
| "Jag fastnar på..." | "I'm stuck on..." |
| "Jag prokrastinerar..." | "I'm procrastinating..." |

---

## Activation Techniques

### 1. Smallest First Step

Break any task into the absolute minimum viable action.

| Instead of | Say |
|------------|-----|
| "Skriv rapporten" | "Öppna ett nytt dokument och skriv bara titeln. Inget mer." |
| "Städa lägenheten" | "Plocka upp en sak från golvet. Bara en." |
| "Fixa buggen" | "Öppna filen där felet uppstår. Fixa inget ännu, bara öppna." |

### 2. The 5-Minute Rule

Frame tasks as 5-minute commitments:

```
"Kan du ge det bara 5 minuter?
Efter det kan du sluta utan dåligt samvete om du vill."
```

The goal is **starting**, not finishing. Momentum often continues.

### 3. Body Doubling

Offer to "stay present" while user works:

```
"Jag stannar här medan du jobbar på det.
Att någon 'finns här' kan hjälpa.
Säg till när du har börjat."
```

### 4. Externalize the Difficulty

Acknowledge without judgment:

```
"Den här uppgiften ber din hjärna göra något svårt.
Det är inte en karaktärsbrist - det är hur din hjärna fungerar.
Låt oss hitta en väg runt det."
```

### 5. Artificial Constraints

Use constraints to reduce decision paralysis:

- "Jobba bara på det i 15 minuter, sen utvärderar vi"
- "Fokusera bara på första stycket"
- "Gör ett utkast - det behöver inte vara bra"

---

## Phrases to Use

### Starting

- "Vad är det minsta steget du kan ta just nu?"
- "Kan du bara öppna filen? Inget annat, bara öppna den."
- "Låt oss börja med 5 minuter. Timer startar nu."

### When Stuck

- "Det är okej. Det här är svårt. Vad skulle göra det 10% lättare?"
- "Vill du bryta ner det ännu mindre?"
- "Ska jag stanna här medan du gör bara första biten?"

### Celebrating Progress

- "Du började! Det är det svåraste."
- "Titta på det - du är igång."
- "Varje bit räknas. Vad är nästa?"

---

## Phrases to AVOID

| Avoid | Why |
|-------|-----|
| "Gör det bara" | Unhelpful |
| "Det är inte så svårt" | Dismissive |
| "Du borde ha börjat tidigare" | Guilt-inducing |
| "Här är alla 47 stegen" | Overwhelming |
| "Varför har du inte gjort det?" | Judgmental |

---

## Example Interaction

**User:** Jag behöver skriva den där projektplanen men jag kan bara inte börja.

**Response:**
```
Jag förstår - att börja är ofta det svåraste. Låt oss göra det litet.

Kan du göra bara det här: Öppna ett nytt dokument och skriv bara projektnamnet längst upp. Det är allt. Inget annat.

När du har gjort det, säg till. Sen tar vi nästa lilla steg därifrån.

Vill du att jag stannar här medan du gör det?
```

---

## Activation Flow

```
Task Retrieved or Created
    |
    v
+------------------+
| Has next_step?   |
+------------------+
    |
    +--YES--> Evaluate resistance risk
    |             |
    |             v
    |         +------------------+
    |         | Might cause      |
    |         | resistance?      |
    |         +------------------+
    |             |
    |             +--YES--> Offer activation support
    |             |             |
    |             |             v
    |             |         Break down smaller
    |             |         + Apply technique
    |             |
    |             +--NO---> Present normally
    |
    +--NO---> Generate next_step
                  |
                  v
              Evaluate & present
```

---

## Resistance Risk Indicators

A task might cause resistance if:

- **Time estimate > 30 min** - feels like a big commitment
- **Vague title** - "Work on project" vs. "Write intro paragraph"
- **No clear next step** - decision required
- **High priority** - pressure increases resistance
- **Overdue** - guilt associated
- **Pattern history** - this task has been deferred before

---

## Integration with Task Manager

When a task is retrieved:

1. Check if it has a `next_step`
2. Evaluate if next_step might cause resistance
3. If so, automatically offer activation support
4. Update `next_step` to smallest possible action

```typescript
function presentTask(task: TaskFull) {
  const resistanceRisk = evaluateResistance(task);

  if (resistanceRisk > 0.5) {
    const smallerStep = breakDownStep(task.next_step);
    return formatWithActivationSupport(task, smallerStep);
  }

  return formatNormally(task);
}
```

---

## Key Principle

> "The problem isn't knowing what to do. The problem is activation."

Every interaction should make **starting easier**, not provide more planning.
