# Role Balance Calculations ⚖️

> **Goal**: Compare actual time/task distribution against user's target balance
> **Source**: Target percentages from user profile

---

## 🚨 CRITICAL: Database Access

**ALL database queries MUST use `aida-cli.ts`:**

```bash
# Get active roles
bun run src/aida-cli.ts roles getActiveRoles

# Get tasks by role
bun run src/aida-cli.ts tasks getTasksByRole [role_id]

# NEVER use query modules directly!
```

---

## Balance Targets

### Reading from Profile

User defines target balance in `.system/context/personal-profile.json`:

```json
{
  "roles": {
    "balance_targets": {
      "Systemutvecklare": 40,
      "Förälder": 25,
      "Hobbyutvecklare": 25,
      "Ordförande": 10
    }
  }
}
```

**Note:** Percentages should sum to 100 (or close)

---

## Calculation Method

### Step 1: Get Task Counts

For each active role:
```bash
bun run src/aida-cli.ts tasks getTasksByRole [id]
```

Count **active tasks** (not done/cancelled):
- Captured
- Ready
- Planned
- Active

### Step 2: Calculate Actual Percentages

```
total_tasks = sum(all_role_task_counts)
role_percentage = (role_task_count / total_tasks) * 100
```

### Step 3: Compare to Targets

```
difference = actual_percentage - target_percentage
```

| Difference | Status |
|------------|--------|
| -5% to +5% | ✅ Balanced |
| -10% to -5% | ⚠️ Under target |
| -15% to -10% | 🔶 Significantly under |
| < -15% | 🔴 Needs attention |
| +5% to +15% | ⚠️ Over target |
| > +15% | 🔶 Dominant |

---

## Presentation Formats

### Table Format

```
📊 Rollbalans

┌──────────────────────────────────────────────────────┐
│ Roll                │ Tasks │ Actual │ Target │ Diff │
├──────────────────────────────────────────────────────┤
│ 💼 Systemutvecklare │  12   │  48%   │  40%   │ +8%  │
│ 🏠 Förälder         │   3   │  12%   │  25%   │ -13% │
│ 🎮 Hobbyutvecklare  │   7   │  28%   │  25%   │ +3%  │
│ 🏛️ Ordförande       │   3   │  12%   │  10%   │ +2%  │
└──────────────────────────────────────────────────────┘
```

### Bar Chart Format (ASCII)

```
📊 Rollbalans

Systemutvecklare [████████████████░░░░] 48% (mål: 40%)
Förälder         [██████░░░░░░░░░░░░░░] 12% (mål: 25%) ⚠️
Hobbyutvecklare  [███████████░░░░░░░░░] 28% (mål: 25%)
Ordförande       [██████░░░░░░░░░░░░░░] 12% (mål: 10%)
```

### Simple Format

```
📊 Rollbalans

✅ Systemutvecklare: 48% (mål 40%)
⚠️ Förälder: 12% (mål 25%) - Under!
✅ Hobbyutvecklare: 28% (mål 25%)
✅ Ordförande: 12% (mål 10%)
```

---

## Imbalance Insights

### When Role is Under Target

```
💡 [Roll] har för lite fokus

Aktuell: 12% | Mål: 25%

Förslag:
• Fånga fler tasks för denna roll
• Prioritera befintliga tasks högre
• Omfördela tid från andra roller
```

### When Role is Over Target

```
💡 [Roll] tar mer plats än planerat

Aktuell: 55% | Mål: 40%

Förslag:
• Slutför och avsluta tasks
• Delegera om möjligt
• Omvärdera prioriteringar
```

---

## Trend Analysis (Advanced)

### Weekly Comparison

If tracking weekly:
```
📈 Veckotrend för [Roll]:

Vecka 49: 35%
Vecka 50: 42%
Vecka 51: 48% ← Nu

Trenden: ↗️ Ökande

[Insight based on trend]
```

### Interpretation

| Trend | Insight |
|-------|---------|
| ↗️ Ökande, under mål | "Bra! Rollen får mer fokus" |
| ↗️ Ökande, över mål | "Varning: Tar över mer" |
| ↘️ Minskande, under mål | "OBS: Rollen tappar fokus" |
| ↘️ Minskande, över mål | "Bra! Balanserar sig" |
| → Stabil | "Konsekvent - som förväntat" |

---

## Special Cases

### Case 1: No Target Defined

If role has no balance target:
```
ℹ️ [Roll] har inget balansmål definierat

Aktuellt: 15% av alla tasks

Vill du sätta ett mål?
```

### Case 2: Role Has No Tasks

```
ℹ️ [Roll] har inga aktiva tasks

Mål: 20%

💡 Överväg att:
• Fånga tasks för denna roll
• Granska om rollen är aktuell
```

### Case 3: New Role

Recently added role (< 2 weeks):
```
ℹ️ [Roll] är ny (skapad [date])

Balans: 5% (mål: 20%)

Det är normalt att nya roller tar tid att etablera.
Vi ger det några veckor!
```

---

## Recommendations Engine

### Auto-Suggestions Based on Balance

**Significantly Under (> -10%):**
```
🎯 Rekommendation för [Roll]:

1. Sätt av dedikerad tid för denna roll
2. Nästa morgon: Börja med en [Roll]-task
3. Fånga nya tasks när de dyker upp
```

**Significantly Over (> +15%):**
```
🎯 Rekommendation för [Roll]:

1. Avsluta pågående tasks innan du startar nya
2. Delegera om möjligt
3. Pausa nya captures för denna roll
```

**Well Balanced:**
```
✅ [Roll] är i balans!

Fortsätt som du gör.
```

---

## Implementation Notes

### Profile Access

```bash
# Read balance targets
cat .system/context/personal-profile.json | jq '.roles.balance_targets'
```

### Task Status Filter

Only count these statuses for balance:
- captured
- ready
- planned
- active

**Exclude:**
- done
- cancelled

### Percentage Rounding

Round to whole percentages for display:
```
Math.round(percentage)
```

---

## Success Criteria

- [ ] Targets read from profile
- [ ] Task counts per role calculated
- [ ] Percentages computed correctly
- [ ] Imbalances highlighted
- [ ] Clear visual presentation
- [ ] Actionable recommendations
- [ ] Swedish output
