# Profile Display Formatting

Riktlinjer för hur profilen ska visas för användaren.

## Grundprinciper

1. **Alltid på svenska** - All användarvänd text ska vara på svenska
2. **Scannable format** - Använd emojis, rubriker och bullets
3. **Progressiv detalj** - Visa sammanfattning först, erbjud djupdykning
4. **Aldrig rå JSON** - Formatera alltid data människovänligt

## Sammanfattningsvy

### Standardformat

```
Här är din profil, [Namn]! 👤

**Identitet**
Namn: [Namn]
[Plats: [Stad], [Land]]
[Kontakt: [Email]]

**Tidsdefinitioner**
Just nu: [current period] (kl [current time])
Morgon: [start]-[end]
Eftermiddag: [start]-[end]
Kväll: [start]-[end]

**Energimönster** (just nu: [current energy])
- Hög energi: [aktiviteter] ([preferred times])
- Medium energi: [aktiviteter] ([preferred times])
- Låg energi: [aktiviteter] ([preferred times])

**Aktiva roller** ([antal] st)
[För varje aktiv roll:]
[index]. [emoji] [Label] ([balance_target]%) - [type]

[Om neurotype finns:]
**Kognitiv profil**
[Label]: [Description]
Styrkor: [antal], Utmaningar: [antal]

**AIDA:s inlärning**
[Om observations > 0:]
AIDA har gjort [antal] observationer om dina arbetsmönster.
Vill du granska dem? → "granska observationer"

[Om inga observations:]
AIDA lär sig fortfarande dina mönster.

---
Vad vill du göra?
• Uppdatera en sektion → "uppdatera [sektion]"
• Visa detaljer → "visa [sektion]"
• Granska observationer → "granska observationer"
```

### Emoji-mappning för Roller

```typescript
const roleEmojis = {
  work: '💼',
  personal: '📚',
  private: '💪',
  civic: '🏛️',
  side_business: '🚀',
  hobby: '🎨',
  meta: '🎯',
};
```

## Detaljvyer

### Identitetsdetaljer

```
**Identitet** 👤

Namn: [Namn]

Plats:
  Stad: [city]
  Region: [region]
  Land: [country]

Kontaktuppgifter:
  Email: [email]
  Telefon: [phone_primary]
  [phone_secondary om finns]
  Adress: [address]
```

### Neurotypdetaljer

```
**Kognitiv Profil** 🧠

[Label]: [Description]

**Styrkor** ([antal])
[För varje:]
• [label]: [description]
  → AIDA:s respons: [assistant_response]

**Utmaningar** ([antal])
[För varje:]
• [label]: [description]
  [details om finns]
  → AIDA:s respons: [assistant_response]

**Effektiva strategier**
[Lista effective_strategies]

**Kärnprincip**
[core_principle]
```

### Energimönsterdetaljer

```
**Energimönster** ⚡

Just nu: [getCurrentTimePeriod()] → [getCurrentEnergyLevel()]

**Hög energi** - [label]
[description]

Aktiviteter:
[För varje aktivitet:]
• [label] ([preferred_time])
  [description]

**Medium energi** - [label]
[description]

Aktiviteter:
[...]

**Låg energi** - [label]
[description]

Aktiviteter:
[...]
```

### Rolldetaljer

```
**Roller** 🎭

**Aktiva roller**
[För varje aktiv roll:]
[emoji] **[label]** ([type])
  ID: [id]
  Beskrivning: [description]
  Balans-mål: [balance_target]%
  [notes om finns]

**Inaktiva/Historiska roller**
[Om finns, lista med status och notes]

**Balans-översikt**
Totalt mål: [summa av balance_targets]%
[Varna om totalen ≠ 100%]
```

### Värdendetaljer

```
**Värden och Principer** 💎

**Kärnvärden**
[Lista core values med bullets]

**Positioner**
[Lista positions med bullets]

**Arbetsprinciper**
[Lista work_principles med bullets]
```

### Verktygsdetaljer

```
**Verktyg** 🛠️

[För varje tool:]
**[name]** ([category])
Syfte: [purpose]
Exempel: [example_usage]
```

### Bakgrundsdetaljer

```
**Bakgrund** 📋

**Utbildning**
[För varje:]
• [name] ([start] - [end])
  [description]

**Professionell erfarenhet**
[För varje:]
• [name] ([start] - [end])
  [description]
  Ansvar: [responsibilities lista]
  Kompetenser: [related_competencies lista]

**Certifieringar**
[För varje:]
• [name] (erhållen: [obtained], giltig till: [valid_until])
  [description]

**Kompetenser**
[Gruppera per category]
[För varje:]
• [name] - Nivå [level]/5
  [description]

**Språk**
[För varje:]
• [name]: [level]/5 [(native/fluent/conversational/basic)]

**Medlemskap**
[För varje:]
• [name]: [description]
```

## Inlärningsöversikt

```
**AIDA:s Inlärning** 🎓

**Observationer** ([antal] aktiva, [antal] applicerade, [antal] avvisade)

[Om aktiva observations > 0:]
Aktiva observationer:
[För varje active observation:]
• [pattern] (förtroende: [confidence * 100]%)
  [evidence.length] st bevis
  → Förslag: [suggested_update.rationale]

Vill du granska dessa? → "granska observationer"

[Om inga aktiva:]
Inga aktiva observationer just nu.

**Förbättringshistorik**
Acceptansgrad för förslag:
[För varje suggestion type:]
• [type]: [acceptance rate * 100]%
```

## Kontext-awareness

Inkludera alltid aktuell kontext i vyn:
- Nuvarande tid och period (`getCurrentTimePeriod`)
- Förväntad energinivå (`getCurrentEnergyLevel`)
- Lämpliga aktiviteter för nuvarande energi (`getActivitiesForEnergy`)

## Exempel på Formattering

Se SKILL.md för kompletta exempel på hur profilen ska visas i olika scenarion.
