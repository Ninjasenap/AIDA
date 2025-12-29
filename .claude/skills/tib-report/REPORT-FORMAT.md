# TIB Report Formatting Guidelines

## File Naming Convention

**Format:** `YYYY-MM-DD [Title].md`

**Examples:**
- `2025-06-09 Trafikolycka Algutstorp vattenskyddsområde.md`
- `2025-11-04 Nätverksstörning Herrljunga kommun 4–8 november 2025.md`

**Rules:**
- Always start with ISO date (YYYY-MM-DD)
- Use first/primary date for multi-day events
- Space between date and title
- Descriptive title that summarizes the incident
- Use Swedish characters in title (å, ä, ö)

## Report Structure

All TIB reports follow this structure:

1. **Title** (H1) - Report heading/subject
2. **Tidpunkt** - When the incident occurred
3. **Händelse** - What happened
4. **Åtgärd** - Actions taken by TIB
5. **Beslut** - Decisions made by TIB
6. **Reflektion** - Reflections and lessons learned

## Single Event Format

For incidents that occur at a specific point in time:

```markdown
## Tidpunkt

Måndag den 9 juni kl. 15.46

## Händelse

**[Time HH:mm]** [paragraph describing what happened at specified time]

**[Time HH:mm]** [paragraph describing what happened at specified time]

[...]
```

**Characteristics:**
- Simple date/time statement
- Narrative description of event
- No timeline formatting needed

**Example:**
```markdown
# Trafikolycka Algutstorp vattenskyddsområde

## Tidpunkt

Måndag den 9 juni kl. 15.46

## Händelse

**15:46** Trafikolycka inträffade vid badplatsen Algutstorp. Personbil körde igenom inhägnad med nötkreatur, vilket resulterade i skada på inhägnaden. Inga personskador rapporterades. Inget synligt läckage från inblandade fordon konstaterades. Händelsen ägde rum på vattenskyddsområde där marken ägs av Vårgårda kommun men arrenderas ut till brukare.

**16:10** TIB kontaktade chef för gata/park i Vårgårda kommun via SMS för att informera om olyckan och behov av åtgärder för att säkra inhägnaden och skydda vattenskyddsområdet från potentiell förorening.

**16:30** Åtgärder konstaterades genomförda av arrendator för att reparera inhägnaden och säkerställa att inga ytterligare risker föreligger.
```

## Multi-Day Event Format

For incidents spanning multiple days or with multiple significant timestamps:

```markdown
## Tidpunkt

[Date range, e.g., "5–8 november 2025"]

## Händelse

**[Weekday] [Date], [HH:mm]** [Event description]

**[Weekday] [Date], [HH:mm]** [Event description]

[...]
```

**Characteristics:**
- Date range in Tidpunkt section
- Each timeline entry uses **bold formatting** for timestamp
- Format: `**Weekday DD month, HH:mm**`
- Chronological order
- Each entry on new line with blank line between entries

**Example:**
```markdown
# Nätverksstörning Herrljunga kommun 4–8 november 2025

## Tidpunkt

5–8 november 2025

## Händelse

**Onsdag 5 november, 06:53** Första signalen om problemen i verksamheten kom när en bemanningsadministratör ringde TIB-telefonen. Tjänsteperson i beredskap hänvisade samtalet till IT Service Desk. Bemanningsadministratören uttryckte behov av att IT-supporten skulle öppna tidigare. Felet antogs vara relaterat till utbyte av utrustning som påbörjades tisdagen 4 november kl. 16.00.

**Onsdag 5 november, 07:17** Information om störningen skickades ut via SMS till kommunens samtliga mobiltelefoner. IT-avdelningen bekräftade omfattande nätverksstörning via information på intranät.

**Torsdag 6 november, 12:00** Uppdatering på intranätet om att problemen kvarstod samt att regelbundna uppdateringar till chefer via SMS samt till alla anställda via intranät skulle utfärdas dagligen kl. 08:00, 12:00 och 16:00.

**Fredag 8 november, 14:10** IT-chef meddelar att störningen var åtgärdad och nätverk i alla fastigheter var i drift. Sista tester skulle genomföras.
```

## Timestamp Formatting Rules

**Single event:**
- Use natural language: "Måndag den 9 juni kl. 15.46"
- Include day of week if relevant
- Use "kl." before time

**Multi-day timeline:**
- **Bold** entire timestamp: `**Onsdag 5 november, 06:53**`
- Format: `**[Weekday] [Day] [Month], [HH:mm]**`
- Comma between date and time
- Use 24-hour format (HH:mm)
- Swedish month names (januari, februari, mars, etc.)

## Section Content Guidelines

### Åtgärd (Actions)

What TIB specifically did in response to the incident:

- Contacts made (who was called/informed)
- Information dissemination
- Coordination activities
- Resource allocation

**If no actions:** "Inga åtgärder vidtagna av TIB."

### Beslut (Decisions)

Formal decisions made by TIB during the incident:

- Operational decisions
- Policy interpretations
- Resource commitments

**If no decisions:** "Inga beslut fattades av tjänstgörande TIB." or "Inget beslut taget av TIB."

### Reflektion (Reflections)

Lessons learned, observations, and improvements:

- What worked well
- What could be improved
- Process observations
- Follow-up suggestions

**If no reflections:** "Har ingen ytterligare reflektion att tillföra."

## Språkliga riktlinjer

### Generella principer

Använd alltid formellt, professionellt språk i TIB-rapporter:

- **Formellt språk:** Skriv i passiv form där lämpligt ("kontaktades" istället för "ringde")
- **Undvik talspråk:** Använd inte informella uttryck eller förkortningar
- **Var konkret:** Använd specifika termer och undvik vaga formuleringar
- **Saklig ton:** Fokusera på fakta och händelseförlopp

### Ordval och ersättningar

| Undvik | Använd istället |
|--------|-----------------|
| "ringer och förklarar" | "kontaktade och rapporterade" |
| "fick inget svar" | "utan att få svar" |
| "pga." eller "p.g.a." | "till följd av" |
| "ok" | "godkändes" |
| "troligtvis" | "bedöms" |
| "ringande" | "personal från [enhet]" |
| "åter i kontakt" | "återupptog kontakten" |

### Strukturella krav för professionellt språk

1. **Börja med subjekt:** Varje tidpunkt ska börja med tydligt subjekt (TIB, Personal från..., Ansvarig chef)
2. **Konsekvent terminologi:** Använd samma termer genom hela rapporten
3. **Fullständiga meningar:** Varje tidpunkt ska ha grammatiskt fullständiga meningar
4. **Aktiva subjekt:** Förtydliga vem som utförde handlingen

**Exempel på professionell formulering:**

```markdown
❌ UNDVIK:
**18:00** Försök att ringa chef, fick inget svar. Meddelade situationen per SMS.

✅ ANVÄND:
**18:00** TIB försökte kontakta ansvarig chef per telefon utan att få svar. Situationen kommunicerades därefter via SMS.
```

## Detection Criteria for Multi-Day Format

Use multi-day format when:

1. Incident explicitly spans date range (e.g., "4–8 november")
2. Multiple significant timestamps mentioned
3. Event has chronological progression over days
4. User provides timeline with specific times

Use single event format when:

1. Incident occurs at one point in time
2. No timeline progression
3. Simple narrative structure sufficient

## Examples

### Simple Report
```markdown
# Trafikolycka Algutstorp

## Tidpunkt

Måndag den 9 juni kl. 15.46

## Händelse

15.46 Trafikolycka inträffade vid badplatsen Algutstorp.

## Åtgärd

Chef för gata/park informerades via SMS.

## Beslut

Inga beslut fattades av tjänstgörande TIB.

## Reflektion

Situationen hanterades genom informationsspridning.
```

### Complex Multi-Day Report
```markdown
# Nätverksstörning Herrljunga kommun

## Tidpunkt

5–8 november 2025

## Händelse

**Onsdag 5 november, 06:53** Första signalen kom via telefon.

**Fredag 8 november, 14:10** Störningen var åtgärdad.

## Åtgärd

Inga åtgärder vidtagna av TIB.

## Beslut

Inget beslut taget av TIB.

## Reflektion

IT-avdelningen kunde i ett tidigare skede ha påbörjat regelbundna informationsuppdateringar.
```
