# Profile Setup Wizard

Interaktiv guide för att skapa en ny användarprofil från grunden.

## När ska denna workflow användas

- När användaren startar AIDA för första gången
- När `profile profileExists` returnerar `false`
- När användaren explicit ber om att "skapa profil" eller "setup"

## Steg-för-steg Procedur

### Steg 1: Välkomsthälsning

```
Hej! Välkommen till AIDA - din AI Digital Assistant. 👋

Jag är här för att hjälpa dig hantera uppgifter, planera dagar och stödja dig
baserat på hur DIN hjärna fungerar.

För att ge dig bästa möjliga stöd behöver jag lära känna dig lite. Det tar
ca 5 minuter och du kan alltid ändra informationen senare.

Redo att sätta upp din profil? (ja/nej)
```

**Om användaren svarar nej**: "Okej! Du kan alltid köra '/profil setup' när du är redo."

### Steg 2: Namn

```
Vad heter du? (förnamn räcker)
```

**Validering**: Namnet får inte vara tomt.

**När användaren svarar**, bekräfta:
```
Trevligt att träffas, [Namn]! 😊
```

### Steg 3: Tidsdefinitioner (Valfritt, erbjud standard)

```
Alla har olika dygnsrytm. Låt mig fråga om din.

När börjar och slutar "morgon" för dig?
(Standard: 06:00-12:00, tryck Enter för standard)
```

**För varje period** (morning, noon, afternoon, evening, night):
- Visa standard
- Låt användaren acceptera eller ange egna tider
- Validera format (HH:MM)

**Om användaren accepterar alla standarder**:
```
Perfekt! Vi kör med standardtider. Du kan alltid justera senare.
```

### Steg 4: Energimönster (Obligatoriskt, förenkla)

```
Hur skulle du beskriva dina energinivåer?

1. Hög energi (när är du som mest alert?)
   Standardlabel: "Hög energi"
   Vill du ändra? (Enter för standard, eller skriv egen)

2. Medium energi
   Standardlabel: "Medium energi"

3. Låg energi
   Standardlabel: "Låg energi"
```

**OBS**: Fråga bara om labels först. Aktiviteter kan läggas till senare.

### Steg 5: Första Rollen (Obligatoriskt)

```
Du har olika roller i livet - arbete, familj, hälsa, hobbies.

Låt oss börja med en roll. Vad är din huvudsakliga roll?
Exempel: "Developer", "Förälder", "Student"
```

**Följdfrågor för rollen**:
1. Typ av roll (work/personal/private/civic/side_business/hobby)
2. Beskrivning (valfritt)
3. Status (active/inactive) - default active

**Fråga om fler roller**:
```
Vill du lägga till fler roller nu? (ja/nej)
Det går alltid att lägga till senare.
```

### Steg 6: Neurotype (Valfritt, Känsligt)

```
Valfri fråga: Har du någon specifik neurotyp eller kognitiv profil du vill att
jag ska veta om? (t.ex. ADHD, autism, AuDHD, dyslexi)

Detta hjälper mig att anpassa mitt stöd efter hur din hjärna fungerar.

Svara gärna, eller tryck Enter för att hoppa över.
```

**Om användaren svarar**:
```
Tack för att du delar! Vill du berätta om några specifika:
1. Styrkor? (t.ex. "hyperfokus", "mönsterigenkänning")
2. Utmaningar? (t.ex. "task initiation", "context switching")

(Du kan skriva "nej" för att hoppa över detaljer)
```

**Lagra med respekt**: Spara endast vad användaren explicit delar.

### Steg 7: Sammanfattning och Bekräftelse

```
Perfekt! Här är din profil:

👤 Namn: [Namn]
⏰ Tidsdefinitioner: [Standard eller anpassade]
⚡ Energimönster: [Labels]
🎭 Roller: [Listade roller]
[🧠 Neurotyp: [Om angiven]]

Ska jag skapa profilen? (ja/nej)
```

**Vid ja**:
```bash
bun run src/aida-cli.ts profile initializeProfile '{"name":"[Namn]",...}'
```

**Bekräftelse**:
```
✅ Profilen är skapad!

Du kan alltid visa den med "visa profil" eller uppdatera med "uppdatera profil".

AIDA kommer att lära sig mer om dig över tid och föreslå uppdateringar.

Vad vill du göra härnäst?
- Planera dagens fokus (/checkin)
- Skapa en uppgift
- Visa kommande uppgifter
```

## Hantera Avbrott

Om användaren säger "stopp", "avbryt", "senare":
```
Inget problem! Din profilinställning är sparad så här långt.
Kör "/profil setup" när du vill fortsätta.
```

## Valideringskontroller

1. **Namn**: Får inte vara tomt
2. **Tidsdefinitioner**: Måste vara HH:MM format, alla 5 perioder krävs
3. **Energimönster**: Minst labels för high, medium, low
4. **Roller**: Minst en roll krävs

## Efter Setup Klart

- Logga profil-skapande i update_log med source='setup_wizard'
- Föreslå nästa steg (morgonplanering, skapa första uppgift)
- Om neurologisk profil angiven, nämn relevanta AIDA-features:
  - "Task activation" för task initiation
  - "Energy matching" för energi-utmaningar

## Exempel på Full Interaktion

Se SKILL.md för kompletta exempel.
