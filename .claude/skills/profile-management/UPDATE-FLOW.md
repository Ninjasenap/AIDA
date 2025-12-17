# Profile Update Flow

Interaktionsmönster för att uppdatera specifika delar av profilen.

## När ska denna workflow användas

- När användaren säger "uppdatera profil", "ändra profil", "uppdatera [sektion]"
- När användaren vill ändra ett specifikt attribut

## Allmän Uppdateringsprocess

### Steg 1: Identifiera vad som ska upd ateras

**Fråga om inte tydligt**:
```
Vad vill du uppdatera i din profil?
• Identitet (namn, plats, kontakt)
• Tidsdefinitioner (när morgon/kväll/etc börjar)
• Energimönster (energinivåer och aktiviteter)
• Roller (lägg till, ta bort, ändra)
• Neurotyp (kognitiv profil)
• Värden (kärnvärden, principer)
• Verktyg (lägg till eller ta bort verktyg)
• Bakgrund (utbildning, erfarenhet, kompetenser)
```

### Steg 2: Visa nuvarande värde

Innan du ber om uppdatering, visa alltid nuvarande värde:

```bash
bun run .system/tools/aida-cli.ts profile getAttribute "[path]"
```

```
Just nu är [beskrivning av fält]: [nuvarande värde]

Vad vill du ändra det till?
```

### Steg 3: Validera input

Beroende på fälttyp, validera:
- **Namn**: Får inte vara tomt
- **Tid**: Måste vara HH:MM format
- **Procent**: Måste vara 0-100
- **Email**: Grundläggande email-validering
- **Enum-värden**: Måste vara ett av tillåtna värden

**Vid valideringsfel**:
```
Hmm, det fungerar inte. [Förklaring av varför]

Försök igen: [Visa exempel på giltigt värde]
```

### Steg 4: Bekräfta innan sparande

```
Okej, jag förstår:
  Från: [gammalt värde]
  Till:  [nytt värde]

Ska jag spara denna ändring? (ja/nej)
```

### Steg 5: Uppdatera och logga

```bash
bun run .system/tools/aida-cli.ts profile updateAttribute "[path]" '"[value]"' "user" "[reason]"
```

```
✅ Uppdaterat! [Beskrivning av ändring]

[Om relevant, nämn påverkan:]
Detta kan påverka [relaterade features].
```

## Specifika Uppdateringsflöden

### Uppdatera Namn

```
Nuvarande namn: [identity.name]

Vad vill du ändra det till?
```

**Användare svarar**: "[Nytt Namn]"

```
Okej, ändrar namnet från "[Gammalt]" till "[Nytt]".
Bekräfta? (ja/nej)
```

**CLI**:
```bash
bun run .system/tools/aida-cli.ts profile updateAttribute "identity.name" '"[Nytt Namn]"' "user" "User requested name change"
```

### Uppdatera Tidsdefinition

```
Nuvarande morgondefinition: [time_definitions.morning.start] - [time_definitions.morning.end]

Vill du ändra:
1. Starttid
2. Sluttid
3. Båda
```

**Exempel vid ändring**:
```
Ny starttid för morgon (format HH:MM): _

[Användaren anger: "07:00"]

Okej! Ändrar morgonstart från 06:00 till 07:00.
Bekräfta? (ja/nej)
```

**CLI**:
```bash
bun run .system/tools/aida-cli.ts profile updateAttribute "time_definitions.morning.start" '"07:00"' "user" "User adjusted morning start time"
```

### Lägga till Ny Roll

```
Skapa ny roll:

1. Vad heter rollen? (t.ex. "Frontend Developer", "Förälder")
```

**Användaren svarar**: "[Roll-namn]"

```
2. Typ av roll:
   • work (arbetsrelaterad)
   • personal (personlig utveckling)
   • private (privatliv, familj, hälsa)
   • civic (samhällsengagemang)
   • side_business (sidoprojekt, företag)
   • hobby (fritidsintressen)

Välj typ: _
```

**Användaren svarar**: "[typ]"

```
3. Beskrivning (valfritt, tryck Enter för att hoppa över): _
```

```
4. Balans-mål i procent (hur mycket tid per vecka?): _
```

**Användaren svarar**: "25"

```
Okej! Ny roll:
  Namn: [Roll-namn]
  Typ: [typ]
  Beskrivning: [beskrivning eller "Ingen beskrivning"]
  Balans-mål: 25%
  Status: active

Ska jag lägga till den? (ja/nej)
```

**CLI** (hitta nästa lediga ID först):
```bash
# Hämta befintliga roller
bun run .system/tools/aida-cli.ts profile getSection "roles"

# Bestäm nästa ID (max ID + 1)
# Lägg till ny roll
bun run .system/tools/aida-cli.ts profile updateAttribute "roles.[next_id]" '{"id":[next_id],"label":"[Roll-namn]","type":"[typ]","description":"[beskrivning]","status":"active","balance_target":25}' "user" "User added new role"
```

### Uppdatera Energiaktivitet

```
Nuvarande aktiviteter för hög energi:
[Lista aktiviteter]

Vill du:
1. Lägga till ny aktivitet
2. Ändra befintlig aktivitet
3. Ta bort en aktivitet
```

**Vid tillägg**:
```
Ny aktivitet för hög energi:

1. Namn (t.ex. "Problemlösning"): _
2. Beskrivning: _
3. Föredragen tid (morning/noon/afternoon/evening/night): _
```

### Uppdatera Neurotyp-utmaning

```
Nuvarande utmaningar:
[Lista challenges med index]

Vill du:
1. Lägga till ny utmaning
2. Uppdatera AIDA:s respons för en utmaning
3. Ta bort en utmaning
```

## Hantera Arrays

Vid uppdatering av array-fält (strengths, challenges, values, etc.):

**Lägga till**:
```bash
bun run .system/tools/aida-cli.ts profile appendToArray "[path]" '[{item}]' "user"
```

**Ta bort** (kräver omskrivning av hela arrayen):
```bash
# 1. Hämta array
bun run .system/tools/aida-cli.ts profile getAttribute "[path]"

# 2. Ta bort item från array (i kod/script)

# 3. Skriv tillbaka array
bun run .system/tools/aida-cli.ts profile updateAttribute "[path]" '[updated_array]' "user" "User removed item"
```

## Konfliktshantering

### Balans-målkonflikter

Om summan av role balance_targets ≠ 100%:
```
⚠️ Obs! Dina roller summerar till [summa]%.

Rekommendation: Balans-målen bör summera till 100% för tydlig planering.

Vill du justera något? (ja/nej)
```

### Tidsöverlappningar

Om tidsdefinitioner överlappar:
```
⚠️ Obs! [period1] slutar [time] men [period2] börjar [time].

Det kan orsaka förvirring. Vill du justera? (ja/nej)
```

## Efter Uppdatering

**Bekräfta alltid**:
```
✅ [Beskrivning av ändring] är uppdaterad!

[Om relevant:]
Detta påverkar:
• [Feature 1]
• [Feature 2]

Vill du göra fler ändringar? (ja/nej)
```

## Exempel på Full Interaktion

**Användare**: "Jag vill uppdatera min morgontid"

**AIDA**:
```
Just nu börjar din morgon kl 06:00 och slutar kl 12:00.

Vad vill du ändra?
1. Starttid (06:00)
2. Sluttid (12:00)
3. Båda
```

**Användare**: "1"

**AIDA**:
```
Ny starttid för morgon (format HH:MM): _
```

**Användare**: "07:30"

**AIDA**:
```
Okej! Ändrar morgonstart från 06:00 till 07:30.

Din morgon blir då: 07:30 - 12:00

Ska jag spara? (ja/nej)
```

**Användare**: "ja"

**AIDA**:
```bash
bun run .system/tools/aida-cli.ts profile updateAttribute "time_definitions.morning.start" '"07:30"' "user" "User adjusted morning start time to match their schedule"
```

```
✅ Morgontiden är uppdaterad!

Detta påverkar:
• När AIDA bedömer "nuvarande energinivå"
• Förslag för task scheduling

Vill du göra fler ändringar? (ja/nej)
```
