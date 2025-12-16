# Databasförmågor för AIDA

> Version: 1.0 (2025-12-14)
> Status: UTKAST - Granska och redigera före implementation

---

## Status, typer och mappning

### Tillgängliga statuses för task
Statusvärden för tasks i systemet är alltid någon av:
- captured: Just captured, needs processing | Symbol: 📥
- clarified: Processed, but not yet actionable | Symbol: 🔍
- ready: Actionable, waiting to be started | Symbol: 🎯
- planned: Planned and waiting | Symbol: 📅
- done: Completed successfully | Symbol: ✅
- cancelled: Deliberately decided not to do | Symbol: ❌

### Tillgängliga statuses för projekt
Statusvärden för projekt i systemet är alltid någon av:
- active: Ongoing work, actively being pursued | Symbol: ▶️
- on_hold: Temporarily paused, waiting on something | Symbol: ⏸️
- completed: Successfully finished, all goals achieved | Symbol: ✅
- cancelled: Abandoned, will not be completed | Symbol: ❌

### Tillgängliga statuses för roller
Statusvärden för roller i systemet är alltid någon av:
- active: Actively used, appears in normal views | Symbol: 🟢
- inactive: Temporarily paused, hidden from normal views but preserved | Symbol: 🔵
- historical: No longer relevant, archived | Symbol: ⚪

### Tillgängliga entry types för journalposter
Journalposter kan ha olika typer för att kategorisera innehållet:
- checkin | Symbol: ✓
- reflection | Symbol: 💭
- task | Symbol: ☑️
- event | Symbol: 📅
- note | Symbol: 📝
- idea | Symbol: 💡

### Tillgängliga typer för roller
Roller kan ha olika typer för att kategorisera livsområden:
- meta | Symbol: 🧠
- work | Symbol: 💼
- personal | Symbol: 👤
- private | Symbol: 🔒
- civic | Symbol: 🏛️
- side_business | Symbol: 💰
- hobby | Symbol: 🎨

---

## 1. TASKS - Läsa

Output från databasen för olika scenarier relaterade till tasks. Output formateeras som JSON-arrayer med objekt som representerar tasks och deras fält. Alla format behöver en parameter/switch för att kunna inkludera tasks som är done och cancelled. Om inte annat anges, inkludera endast tasks som INTE är done eller cancelled.

### Läsa specifik task med ID eller där titel innehåller viss söktext
Oftast kan ID användas för att hämta en specifik task, men AI kan behöva kunna söka ut tasks baserat på titeltext eller del av titel med fussymatch. Alla tasks som matchar sökningen returneras så Agenten kan besluta vilken eller vilka som är bäst.
- Hämta alla fält för task med matchande ID ELLER där titel innehåller söktext (case insensitive, partial match)
- TILLSAMMANS MED roll ID
- TILLSAMMANS MED projekt ID
- TILLSAMMANS med beroenden (subtasks): andra tasks som har denna task som parent_task_id
- Om ID anges, returnera exakt den tasken oavsett status
- Om söktext används, returnera alla matchande tasks som INTE är done eller cancelled ELLER alla om parameter för inkludering av klara tasks är satt

### Läsa dagens aktuella tasks
Hämtar alla tasks som gäller för idag och som ska kunna planeras in för dagen.

- har planerat datum (start_date) idag eller tidigare
- ELLER har deadline idag eller tidigare
- ELLER har deadline denna vecka och inte är planerad
- ELLER har remind-datum idag
- TILLSAMMANS MED roll ID och TITEL
- TILLSAMMANS MED projekt ID och TITEL (om tillämpligt)
- TILLSAMMANS med beroenden (subtasks): andra tasks som har denna task som parent_task_id
- INTE om STATUS är done eller cancelled
- GRUPPERA per roll
- Visa alla fält i task, plus roll id och namn, samt projekt id och namn, och beroenden id och titel


### Läsa den här veckans tasks
Hämtar tasks som gäller för den här veckan (måndag-söndag) för att få överblick över veckans åtaganden och planering.

- har deadline den här veckan (måndag-söndag, identifiera vilka datum som gäller)
- ELLER har planerat den här veckan
- TILLSAMMANS MED roll ID och TITEL
- TILLSAMMANS MED projekt ID och TITEL (om tillämpligt)
- TILLSAMMANS med beroenden (subtasks): andra tasks som har denna task som parent_task_id
- Grupperat per dag
- Visa alla task ID, titel, beroenden, plus roll ID och NAMN, samt projekt ID och NAMN


### Läsa försenade tasks
Tasks som har passerat sin deadline och inte är klara än, s.k. overdue tasks. Detta hjälper användaren att snabbt identifiera vad som är försenat och behöver uppmärksamhet.

- har deadline som passerat (deadline < idag)
- OCH status är INTE done eller cancelled
- Visa antal dagar försenad
- Sortera efter mest försenad först
- TILLSAMMANS MED roll ID och TITEL
- TILLSAMMANS MED projekt ID och TITEL (om tillämpligt)
- TILLSAMMANS med beroenden (subtasks): andra tasks som har denna task som parent_task_id
- Visa alla task ID, titel, beroenden, plus roll ID och NAMN, samt projekt ID och NAMN


### Läsa tasks med subtasks
Hämtar parent tasks som har subtasks kopplade till sig. Detta ger överblick över tasks som är beroende av att subtasks slutförs först.

- Har andra tasks som pekar på denna via parent_task_id (dvs denna task är parent till en eller flera subtasks)
- OCH status är INTE done eller cancelled 
- Ska kunna filtrera på ROLL eller PROJEKT genom parameter
- TILLSAMMANS MED roll ID och NAMN
- TILLSAMMANS MED projekt ID och NAMN (om tillämpligt)
- TILLSAMMANS MED subtasks (tasks som har denna som parent_task_id)
- För parent tasks: visa antal subtasks som ännu inte är done
- Gruppera efter roll ELLER projekt baserat på om ett specifikt projekt eller roll anges
- Visa alla task-fält, plus roll info, projekt info, och subtask-lista med id och titel

### Läsa tasks efter roll
Hämtar alla tasks för en specifik roll för att få överblick över rollens åtaganden och arbetsbörda.

- Filtrera på role_id = [angiven roll]
- Status är INTE done eller cancelled (om inte annat anges)
- TILLSAMMANS MED projekt ID och NAMN (om tillämpligt)
- TILLSAMMANS MED parent task ID och TITEL (om task är subtask)
- Visa: id, title, notes, status, priority, energy_requirement, time_estimate, start_date, deadline, remind_date, created_at
- Grupperat per status (captured, clarified, ready, planned))
- Sorterat inom varje status: deadline först (nulls sist), sedan priority DESC, sedan created_at
- Visa även antal tasks per status för rollen

### Läsa tasks efter projekt
Hämtar alla tasks för ett specifikt projekt för att se projektets framsteg och återstående arbete.

- Filtrera på project_id = [angivet projekt]
- Inkludera ALLA statusar (även done och cancelled för att se historik)
- TILLSAMMANS MED roll ID och NAMN
- TILLSAMMANS MED parent task ID och TITEL (om task är subtask)
- Visa: id, title, notes, status, priority, energy_requirement, time_estimate, start_date, deadline, remind_date, created_at
- Grupperat per status (i ordning: planned, ready, clarified, captured, done, cancelled)
- Sorterat inom status: deadline först (nulls sist), sedan priority DESC
- Visa sammanfattning: antal done / totalt antal, procent klart

### Läsa oinaktuella tasks (stale)
Hämtar tasks som legat och väntat länge utan att flyttas framåt, för regelbunden genomgång och beslut (gör eller överge).

- status är captured, clarified, ready
- created_at är äldre än X dagar (parameter, standard: 28 dagar för captured/clarified, 14 dagar för ready)
- TILLSAMMANS MED roll ID och NAMN
- TILLSAMMANS MED projekt ID och NAMN (om tillämpligt)
- Visa: id, title, status, priority, deadline, created_at
- Visa antal dagar sedan created_at
- Grupperat per status
- Sorterat efter äldst först (created_at ASC) inom varje status


---

## 2. TASKS - Skriva

### Skapa task
Skapa task med alla fält:

Obligatoriska fält, dessa krävs alltid och agenten försöker att fylla i utifrån kontext:
- title
- role_id
- status = captured (automatiskt) eller clarified beroende på input
- created_at = nu (automatiskt)

Valfria fält som fylls i efter sammanhang, eller frågas vid skapande. Vid snabb capture ska dessa fyllas i senare vid revision:
- notes/description
- project_id
- status, priority, energy_requirement
- start_date, deadline, remind_date

### Uppdatera task
Ändra valfria fält på befintlig task:
- Kräv task_id (kan behöva hämta via läs-scenarier först)
- Dynamiskt: endast skickade fält uppdateras
- updated_at sätts automatiskt

### Markera task som {{status}}
Sätt status på task till en av de tillåtna värdena
-  'captured',     -- Just captured, needs processing
   'clarified',    -- Processed, but not yet actionable
   'ready',        -- Actionable, waiting to be started
   'planned',      -- Planned and waiting
   'done',         -- Completed successfully
   'cancelled'     -- Deliberately decided not to do
- Om DONE eller CANCELLED - Uppdatera även loggen med en journalpost av typen 'task' som anger att tasken är klar eller avbruten, med eventuell kommentar från användaren.



### Ta bort task
Permanent radering av task från databasen kan INTE göras via agenten för att bevara historik och dataintegritet. Istället:
- Sätt status = cancelled

---

## 3. ROLLER - Läsa

### Läsa alla aktiva roller
Hämtar en komplett lista över alla roller för översikt och navigering i systemet.

- Hämta roller som är aktiva
- Visa: id, name, type, description, responsibilities, status, balance_target, created_at, updated_at
- TILLSAMMANS MED antal aktiva projekt och all info och alla aktiva tasks relaterade till detta projekt id
- TILLSAMMANS MED alla tasks som är relaterade till denna roll och är aktiva: status IN (captured, clarified, ready, planned)
- Sorterat på id asc

### Läsa inaktiva roller
Hämtar endast roller som är inaktiva eller historiska (ej aktiva)

- Filtrera på status IN ('inactive', 'historical')
- Exkludera status = 'active'
- Visa: id, name, type, description, status, skapad och uppdaterad tid

### Läsa roller efter typ
Hämtar roller filtrerade på specifik typ för att gruppera relaterade livsområden. För tematisk genomgång och balansanalys.

- Filtrera på type = [angiven typ] utifrån parameter
- Type IN ('meta', 'work', 'personal', 'private', 'civic', 'side_business', 'hobby')
- Visa: id, name, description, status
- Endast status = 'active' om inte switch för inkludering av inaktiva är satt
- Sorterat på name ASC

---

## 4. ROLLER - Skriva

### Skapa roll
Skapar en ny roll när användaren tar på sig ett nytt ansvarsområde eller livsområde.

- name (obligatoriskt): Namnet på rollen
- type (obligatoriskt): En av 'meta', 'work', 'personal', 'private', 'civic', 'side_business', 'hobby'
- description (optional): Beskrivning av rollen
- responsibilities (optional): JSON-array med ansvarsområden, t.ex. ["ansvar 1", "ansvar 2"]
- status = 'active' (sätts automatiskt)
- balance_target (optional): Decimal 0.0-1.0 för önskad tidsfördelning
- created_at och updated_at sätts automatiskt
- Returnera den nya rollens id

### Uppdatera roll
Ändrar information om en befintlig roll när ansvar eller fokus förändras.

- Kräv role_id
- Uppdatera valfria fält: name, description, responsibilities (helt JSON-objekt), balance_target
- responsibilities måste vara komplett JSON-array om den uppdateras (ej partiell)
- updated_at sätts automatiskt via trigger
- Returnera bekräftelse och uppdaterad roll

### Ändra rollstatus
Ändrar statusen på en roll för att reflektera dess aktivitetsnivå.

- Kräv role_id
- Sätt status till en av:
  - 'active': Används aktivt, visas i normala vyer
  - 'inactive': Tillfälligt pausad, döljs från normala vyer men bevaras
  - 'historical': Inte längre relevant, arkiverad
- updated_at sätts automatiskt
- Validera att det finns tasks kopplade till rollen och varna om status ändras till inactive/historical

---

## 5. PROJEKT - Läsa
Hämtar endast projekt som har status active och on_hold om inte annat anges.

### Läsa alla projekt
Hämtar en komplett lista över alla projekt för översikt över pågående och avslutade initiativ.

- Hämta alla projekt med status 'active', 'on_hold' eller om parameter för inkludering av klara/avbrutna är satt även 'completed', 'cancelled'
- Visa: id, name, role_id, status, description, finish_criteria, created_at
- TILLSAMMANS MED roll NAMN och TYPE (JOIN roles)
- Grupperat per status (i ordning: active, on_hold, completed, cancelled)
- Sorterat på created_at asc inom varje status

### Läsa specifik projekt med ID eller där namn innehåller viss söktext
Oftast kan ID användas för att hämta en specifik projekt, men AI kan behöva kunna söka ut projekt baserat på namntext eller del av namn med fussymatch. Alla projekt som matchar sökningen returneras så Agenten kan besluta vilken eller vilka som är bäst.

- Hämta alla fält för projekt med matchande ID ELLER där namn innehåller söktext (case insensitive, partial match)
- TILLSAMMANS MED roll ID och NAMN
- TILLSAMMANS MED alla tasks för projektet:
  - Grupperat per task status (planned, ready, clarified, captured, done, cancelled)
  - För varje task: id, title, status, priority, deadline
- Om ID anges, returnera exakt det projektet *oavsett status*
- Om söktext används, returnera alla matchande tasks som INTE är done eller cancelled ELLER alla projekt om parameter för inkludering av klara/avbrutna projekt är satt


### Läsa projekt för roll
Hämtar alla projekt som tillhör en specifik roll för rollspecifik översikt.

- Filtrera på role_id = [angiven roll]
- Inkludera ALLA statusar (active, on_hold, completed, cancelled)
- Visa: id, name, status, description, finish_criteria, created_at
- TILLSAMMANS MED antal tasks (totalt och per status)
- Grupperat per projektstatus
- Sorterat på id ASC inom varje status

### Läsa projektframsteg
Beräknar hur långt ett projekt har kommit baserat på både tasks och finish_criteria.

- Filtrera på project_id = [angivet projekt]
- Visa: id, name, status
- Beräkna task-framsteg: antal done tasks / totalt antal tasks (procent)
- Beräkna criteria-framsteg: antal done criteria / totalt antal criteria (procent) från finish_criteria JSON
- Returnera båda procentsatserna
- Används för rapporter och översikter

### Läsa pausade projekt
Hämtar projekt som är tillfälligt parkerade för regelbunden genomgång och omprövning.

- Filtrera på status = 'on_hold'
- Visa: id, name, role_id, description, created_at
- TILLSAMMANS MED roll NAMN
- TILLSAMMANS MED antal dagar sedan created_at
- TILLSAMMANS MED antal tasks (per status)
- Sorterat efter äldst först (created_at ASC)

---

## 6. PROJEKT - Skriva

### Skapa projekt
Skapar ett nytt projekt för att gruppera relaterade tasks under ett gemensamt mål.

- name (obligatoriskt): Projektets namn
- role_id (obligatoriskt): Vilken roll projektet tillhör
- description (obligatoriskt): Beskrivning av projektets syfte
- finish_criteria (optional): JSON-array med kriterier, t.ex. [{"criterion": "Lansera MVP", "done": false}, {"criterion": "10 användare", "done": false}]
- status = 'active' (sätts automatiskt)
- created_at sätts automatiskt
- Returnera det nya projektets id och alla fält

### Uppdatera projekt
Ändrar information om ett befintligt projekt när omfattning eller mål eller status förändras.

- Kräv project_id
- Uppdatera valfria fält: name, description
- finish_criteria uppdateras separat (se nedan)
- Returnera bekräftelse och uppdaterat projekt

### Uppdatera finish criteria (hela listan)
Ersätter hela listan med avslutsvillkor när projektets definition ändras. Separat funktion pga ytterligare komplexitet med JSON-hanteringen.

- Kräv project_id
- Kräv komplett finish_criteria JSON-array (ersätter helt)
- Format: [{"criterion": "text", "done": true/false}, ...]
- Används när projektomfattningen ändras
- Returnera uppdaterat projekt med alla fält


---

## 7. JOURNAL - Läsa

### Läsa dagens journalposter
Hämtar alla journalposter från idag för att se dagens aktivitet och reflektioner.

- Filtrera på DATE(timestamp) = DATE('now')
- Visa: id, timestamp, entry_type, content, related_task_id, related_project_id, related_role_id
- TILLSAMMANS MED task ID och TITEL (om related_task_id finns)
- TILLSAMMANS MED projekt ID och NAMN (om related_project_id finns)
- TILLSAMMANS MED roll ID och NAMN (om related_role_id finns)
- Sorterat efter timestamp ASC (kronologisk ordning)


### Läsa journalposter för task
Hämtar alla journalposter kopplade till en specifik task. För att förstå taskens resa, beslut och kontext.

- Filtrera på related_task_id = [angiven task]
- Visa: id, timestamp, entry_type, content
- TILLSAMMANS MED task ID och TITEL
- Sorterat efter timestamp ASC (äldst först, kronologisk berättelse)

### Läsa journalposter för projekt
Hämtar alla journalposter kopplade till ett projekt för att se projektets utveckling över tid. För projektloggbok och lärdomar. Används vid projektutvärdering.

- Filtrera på related_project_id = [angivet projekt]
- Visa: id, timestamp, entry_type, content, related_task_id
- TILLSAMMANS MED projekt ID och NAMN
- TILLSAMMANS MED task ID och TITEL (om finns)
- Sorterat efter timestamp ASC

### Läsa journalposter för roll
Hämtar alla journalposter kopplade till en roll för att se rollens aktivitet och mönster. För rollbalansanalys och reflektion. Används vid vecko/månadsgenomgång per roll.

- Filtrera på related_role_id = [angiven roll]
- Visa: id, timestamp, entry_type, content, related_task_id, related_project_id
- TILLSAMMANS MED roll NAMN
- TILLSAMMANS MED task och projekt NAMN (om finns)
- Sorterat efter timestamp DESC (senaste först för översikt)


### Läsa journalposter efter typ
Hämtar journalposter av en specifik typ för mönsteranalys och tematisk genomgång.

- Filtrera på entry_type = [angiven typ]
- Typer: 'checkin', 'reflection', 'task', 'event', 'note', 'idea' - anges som parameter
- Visa: id, timestamp, content, relaterad TASK och PROJEKT och ROLL med ID och NAMN/TITEL
- TILLSAMMANS MED relaterad task/projekt/roll
- Sorterat efter timestamp DESC (senaste först)
- Valfri datumfiltrering med TIMESTAMP BETWEEN [start_date] AND [end_date]
- För att analysera vanor (morgonrutiner) eller samla idéer

### Läsa journalposter för datumintervall
Hämtar journalposter mellan två datum för periodoversikt (vecka, månad), kan användas vid periodiska genomgångar och rapporter.

- Filtrera på timestamp BETWEEN [start_date] AND [end_date]
- Visa: id, timestamp, entry_type, content, related info
- TILLSAMMANS MED task/projekt/roll info om relevant
- Sorterat efter timestamp ASC

---

## 8. JOURNAL - Skriva - **aldrig redigera eller ta bort!**

### Skapa journalpost
Skapar en ny journalpost för att dokumentera händelser, tankar eller reflektioner. Typen anges för att kategorisera posten och underlätta framtida sökningar och rapporter. Checkin sker morgon, mitt på dagen, kväll och syftar till att ge löpande status på dagen. Tasks loggar när man är klar eller task avbryts för att se hur det har gått. Events loggar möten och händelser både planerade och ej planerade och när något blir inställt. Notes och ideas är fria anteckningar och idéer som har möjlighet att kopplas till tasks, projekt eller roller. 

- entry_type (obligatoriskt): Typ av post ('checkin', 'reflection', 'task', 'event', 'note', 'idea') som parameter
- content (obligatoriskt): Textinnehåll i posten
- related_task_id (optional): Länka till specifik task om relevant
- related_project_id (optional): Länka till specifikt projekt om relevant
- related_role_id (optional): Länka till specifik roll om relevant
- timestamp sätts automatiskt till nuvarande tidpunkt
- Returnera den nya postens alla fält inklusive id


