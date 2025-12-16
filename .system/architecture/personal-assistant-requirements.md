# Personal AI Assistant – Requirements Specification

> **Version:** 0.3 (Draft)
> **Datum:** 2025-12-13
> **Status:** Under utveckling – Arkitektur återstår

---

## 1. Syfte och vision

### 1.1 Övergripande mål
En AI-driven personlig assistent som fungerar som ett **externt arbetsminne och exekutivt stöd** för användaren. Systemet ska kompensera för kognitiva utmaningar definierade i användarprofilen (`{{user.neurotype}}`), särskilt inom:
- Task initiation (komma igång)
- Context switching (återuppta arbete efter avbrott)
- Arbetsminne (hålla saker i huvudet)
- Prioritering bland konkurrerande krav

### 1.2 Kärnprincip
> "Problemet är inte att veta vad jag ska göra. Problemet är aktivering."

Assistenten ska **minska kognitiv belastning**, inte öka den genom fler listor och system att underhålla.

### 1.3 Teknisk plattform
- **Primärt gränssnitt:** Claude Code (CLI-verktyg för AI-assisterad utveckling)
- **Sekundärt gränssnitt:** Obsidian (för att läsa genererade markdown-filer), VS Code
- **AI-modeller:** Primärt Claude, med möjlighet till andra modeller
- **Datalagring:** SQLite för strukturerad data, Markdown-filer för dokument/resurser
- **Användarkontext:** `.system/context/personal-profile.json` (JSON-format)

---

## 2. Användarkontext

### 2.1 Funktionella mönster

Användarprofilen (`{{user.energy_pattern}}`) definierar när på dagen användaren har olika energinivåer och vilka aktiviteter som passar bäst vid varje tidpunkt.

**Arbetsflöde:**
Användarens informationsfångst-flöde definieras i `{{user.workflow.capture_flow}}`.

### 2.2 Principer

Användarprofilen definierar tre nivåer av principer:

**Kärnvärderingar:** `{{user.values.core}}`
- Djupa, stabila värderingar som styr beslutsfattande

**Arbetsprinciper:** `{{user.values.work_principles}}`
- Hur användaren föredrar att arbeta och organisera sin tid

**Preferenser och ställningstaganden:** `{{user.values.positions}}`
- Tekniska och metodologiska ställningstaganden

### 2.3 Roller (Areas)

Roller definieras i användarprofilen (`{{user.roles}}`). Varje installation av systemet har sina egna roller anpassade efter användarens liv och ansvar.

**Rollstruktur:**
- Varje roll har en kod (A01, A02, etc.)
- Varje roll har en typ (work, civic, personal, private, meta)
- Varje roll har en beskrivning och eventuella organisationer/ansvarsområden

**Exempel från en konfiguration:**
- A01: Generellt/Meta
- A02-A05: Arbetsroller
- A06: Ideellt engagemang
- A07-A08: Personlig utveckling och sidoverksamhet
- A09-A10: Privata roller (familj, hobbies)

---

## 3. Informationsarkitektur (PKM-struktur)

### 3.1 Mappstruktur (modifierad PARA)

```
ROOT/
├── 0-INBOX/                    # Obearbetat material
├── 0-JOURNAL/                  # Dagbok, loggar
├── 0-SHARED/                   # Gemensamma resurser
│
├── A01-GENERELLT/
│   ├── 01-NOTES/
│   ├── 02-RESOURCES/
│   ├── P001-[projektnamn]/
│   └── P002-[projektnamn]/
│
├── A02-DIGITALISERINGSSAMORDNING/
│   ├── 01-NOTES/
│   ├── 02-RESOURCES/
│   └── P00x-[projekt]/
│
└── [... samma struktur för A03–A10]
```

### 3.2 Datalagring

| Typ | Lagringsplats | Exempel |
|-----|---------------|---------|
| Strukturerad metadata | SQLite | Tasks, projekt-status, loggar |
| Dokument & resurser | Markdown (Obsidian) | Noter, rapporter, planer |
| Profil & kontext | `.system/context/personal-profile.json` | Roller, principer, preferenser (JSON) |
| Kalender | Import från extern källa | Markdown-export |

---

## 4. Funktionskrav

### 4.1 Projekthantering

#### 4.1.1 Kärnprinciper
- **Nästa-steg-fokus:** Visa alltid bara ETT aktivt nästa steg per projekt
- **Just-in-time breakdown:** Detaljerad nedbrytning sker när steget ska utföras, inte innan
- **Lazy loading:** Dold komplexitet – visa inte alla steg på en gång

#### 4.1.2 Två projektlägen

**Läge 1: Solo/mindre projekt**
```
PROJEKT: [Namn]
├── Status: [🔴🟡🟢]
├── Nästa steg: "[Konkret handling]" (tidsuppskattning)
└── [Resten dolt]
```

**Läge 2: Större projekt / med beroenden**
- Översiktlig plan med milstolpar
- Tidsbedömning för kommunikation till andra
- Fortfarande bara ETT aktivt nästa steg
- Detaljnedbrytning sker "just in time"

#### 4.1.3 Aktiveringsstöd

| Funktion | Beskrivning |
|----------|-------------|
| Minsta första steg | "Vad är det absolut minsta du kan göra?" (5 min eller mindre) |
| Återuppstart-stöd | Logga avbrottspunkt, påminn var användaren var |
| Synliggörande av tid | Visa hur länge något legat, projicera "om du gör X idag..." |

**Exempel på synliggörande:**
> "Momsdeklarationen har legat i 3 veckor. Om du gör 30 min idag är du klar på fredag."

Tonen ska vara **synliggörande, inte skuldbeläggande**.

### 4.2 Daglig styrning

#### 4.2.1 Check-in-struktur

| Tillfälle | Tid | Syfte |
|-----------|-----|-------|
| Morgonplanering | `{{user.touchpoints.morning_planning.preferred_time}}` | Sätt upp dagen: kalender → block → nästa steg |
| Dag-checkins | `{{user.touchpoints.day_checkins.frequency}}` | Logga vad som hänt, justera plan |
| Kvällslogg | `{{user.touchpoints.evening_log.timing}}` | Sammanfatta dagen |

#### 4.2.2 Input till assistenten vid check-in
- Kalender (exporterad markdown)
- Tasks från databasen
- Pågående projekt & deras status
- Logg från igår/senaste sessionen
- Energimönster från profil (baserat på tid på dygnet)
- Aktuell roll/kontext
- "Signaler" – saker som kan eskalera om de ignoreras

#### 4.2.3 Output vid check-in
- Förslag på tidsblock för dagen
- Påminnelse om "nästan bortglömt" (legat länge)
- Halvfärdiga saker från igår
- Proaktiva varningar ("X kan bli problem om...")
- ETT rekommenderat nästa steg per block

#### 4.2.4 Interaktionsmönster
1. Användaren initierar (vid planerings-/check-in-tillfälle)
2. Assistenten ger sammanfattning + rekommendationer
3. Användaren justerar och bestämmer
4. Assistenten uppdaterar planen

**Notera:** Inga push-notiser i första versionen. All interaktion initieras av användaren.

### 4.3 Loggning och minne

#### 4.3.1 Vad som loggas
- **Aktiviteter:** Vad användaren gjorde
- **Reflektioner:** Tankar, känslor, insikter
- **Händelser:** Möten, beslut, viktiga skeenden
- **Energi/mående:** Subjektiv upplevelse

#### 4.3.2 Automatisk loggning (default)
- Planerade aktiviteter → markerade som genomförda
- Tasks som bockats av
- Tid spenderad per block/område
- Genererad sammanfattning av dagen

#### 4.3.3 Smarta frågor (vid behov)

**Efter möten:**
- "Vilka beslut togs?"
- "Nya tasks att registrera?"
- "Något att följa upp?"

**Vid avvikelser:**
- "Du hade planerat X men gjorde Y – vad hände?"
- "Tre tasks flyttades – behöver något omprioriteras?"

#### 4.3.4 Periodiska reviews

| Frekvens | Fokus |
|----------|-------|
| Veckovis | Vad åstadkom jag? Vad ska justeras? |
| Månadsvis | Mönster, projekt-progress, mål-avstämning |
| Kvartalsvis | Strategisk reflektion, större justeringar |
| Årsvis | Vision, livsmål, långsiktig riktning |

### 4.4 Strategiskt stöd

#### 4.4.1 Måltyper

**Arbete:**
- Leverabler
- Kompetensutveckling
- Projekt-milstolpar
- Roll-specifika mål

**Personligt:**
- Hälsa
- Lärande
- Vanor
- Relationer

#### 4.4.2 Assistentens roll i strategiarbete

1. **Samla in data:** Loggar, projekt-status, mönster
2. **Analysera:** Vad fungerar, vad fastnar, trender
3. **Föreslå:** Mål, justeringar, prioriteringar
4. **Dialog:** Användaren justerar, ifrågasätter, beslutar
5. **Dokumentera:** Beslutade mål → länkas till dagligt arbete

#### 4.4.3 Review-cykel kopplad till strategi

| Nivå | Frekvens | Fråga |
|------|----------|-------|
| Taktisk | Vecka | "Går jag åt rätt håll?" |
| Operativ | Månad | "Fungerar systemet?" |
| Strategisk | Kvartal | "Är det rätt mål?" |
| Vision | År | "Vart är jag på väg?" |

---

## 5. Icke-funktionella krav

### 5.1 Kognitiv anpassning
Systemet anpassar sig efter användarens kognitiva profil (`{{user.neurotype}}`):
- **Minimera overwhelm:** Visa en sak i taget när möjligt
- **Aktivering före perfektion:** Hjälp att komma igång är viktigare än perfekt planering
- **Friktionsfritt:** Systemet ska inte kräva underhåll som blir ytterligare en börda
- **Flexibelt:** Anpassa sig till hur dagen faktiskt blir, inte bara planen

### 5.2 Iterativ utveckling
- Funktioner byggs in en i taget
- Varje steg ska vara användbart innan nästa läggs till
- Undvik onödig komplexitet

### 5.3 Öppenhet och kontroll
- Open source-verktyg när möjligt (enligt `{{user.values.positions}}`)
- Data under användarens kontroll
- Möjlighet att inspektera och förstå systemets beslut

---

## 6. Agentarkitektur (att specificera)

> **Status:** Ej påbörjad – nästa steg i arbetet

### 6.1 Frågor att besvara
- Vilka primäragenter behövs?
- Vilka subagenter delas mellan primäragenter?
- Hur hanteras kontext mellan agenter?
- Vilka dataflöden finns?
- Hur struktureras prompt-instruktioner?

### 6.2 Preliminär skiss

```
┌─────────────────────────────────────────────────────────┐
│                    GRÄNSSNITT                           │
│  OpenCode (input/interaktion) → Obsidian (output)       │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│              PRIMÄRAGENTER (Orchestrators)              │
│  • Planering & Loggning                                 │
│  • Projekthantering                                     │
│  • Dokumentskrivning                                    │
│  • [fler?]                                              │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│              SUBAGENTER (Specialists)                   │
│  • Task-hanterare (SQLite)                              │
│  • Research                                             │
│  • Formatering                                          │
│  • Peer-review                                          │
│  • [fler?]                                              │
└─────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────┐
│                 PERSISTENT DATA                         │
│  • SQLite (tasks, loggar, metadata)                     │
│  • Markdown-filer (Obsidian vault)                      │
│  • User profile (.system/context/personal-profile.json) │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Öppna frågor och nästa steg

### 7.1 Att specificera
- [ ] Detaljerad agentarkitektur
- [ ] Databasschema för tasks, projekt, loggar
- [ ] Prompt-mallar för varje agent
- [ ] Specifika workflows (morgonplanering, reviews, etc.)

### 7.2 Att testa
- [ ] Årsskiftes-review (december 2025) som första riktiga test

---

## Ändringshistorik

| Datum | Version | Ändring |
|-------|---------|---------|
| 2025-12-13 | 0.3 | Format: Context-filer ändrade från YAML till JSON |
| 2025-12-13 | 0.2 | Avpersonalisering: All specifik användarinfo flyttad till `.system/context/personal-profile.md`, template-variabler införda |
| 2025-12-11 | 0.1 | Första utkast – 5 av 6 områden specificerade |
