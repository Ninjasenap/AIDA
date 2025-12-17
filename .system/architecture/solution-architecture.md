# AIDA Solution Architecture

> **Document Type:** Solution Architecture
> **Version:** 2.0
> **Date:** 2025-12-14
> **Status:** Updated for new database schema and command structure

---

## 1. Executive Summary

AIDA (AI Digital Assistant) is a cognitive augmentation system designed to function as an external working memory and executive support for its user. Built on Claude Code as the primary interface, AIDA addresses activation challenges, context switching difficulties, and working memory limitations through a local-first, single-user architecture.

### Core Design Principle

> "It remembers so you can forget. It monitors so you can focus. It structures so you can think freely."

The system reduces cognitive load rather than adding organizational overhead. Success is measured by the user feeling *less* overwhelmed, not more organized.

---

## 2. System Context Diagram

```
+============================================================================+
|                           USER'S DIGITAL ECOSYSTEM                         |
+============================================================================+
|                                                                            |
|     +------------------+                                                   |
|     |                  |                                                   |
|     |      USER        |                                                   |
|     |   {{user.identity.name}}                                             |
|     |                  |                                                   |
|     +--------+---------+                                                   |
|              |                                                             |
|              | Natural Language                                            |
|              | Commands & Queries                                          |
|              v                                                             |
|     +------------------+        Writes        +------------------+         |
|     |                  |--------------------->|                  |         |
|     |   CLAUDE CODE    |                      |    OBSIDIAN      |         |
|     |   (Primary CLI)  |<---------------------|    VAULT         |         |
|     |                  |        Reads         |    (PKM)         |         |
|     +--------+---------+                      +------------------+         |
|              |                                        ^                    |
|              | Reads/Writes                           |                    |
|              v                                        | User Views         |
|     +------------------+                              | & Edits            |
|     |                  |                              |                    |
|     |   LOCAL DATA     |------------------------------+                    |
|     |   LAYER          |                                                   |
|     | +-------------+  |                                                   |
|     | | SQLite DB   |  |                                                   |
|     | +-------------+  |                                                   |
|     | | Markdown    |  |                                                   |
|     | | Files       |  |                                                   |
|     | +-------------+  |                                                   |
|     | | User Profile|  |                                                   |
|     | | (JSON)      |  |                                                   |
|     | +-------------+  |                                                   |
|     +------------------+                                                   |
|              |                                                             |
|     +--------+---------+                      +------------------+         |
|     |                  |                      |                  |         |
|     |    VS CODE       |                      |    CALENDAR      |         |
|     |    (IDE)         |                      |    (External)    |         |
|     |                  |                      |                  |         |
|     +------------------+                      +------------------+         |
|                                                       |                    |
|                                               Manual Export                |
|                                               (iCal/Markdown)              |
|                                                                            |
+============================================================================+
```

### External Actors and Systems

| Actor/System | Role | Integration Type |
|--------------|------|------------------|
| User | Primary actor; initiates all interactions | Direct CLI interaction |
| Claude Code | Central orchestration hub; AI-powered assistant | Primary interface |
| Obsidian | PKM system; document viewing and manual editing | File-based read/write |
| VS Code | IDE for development work; CLAUDE.md for project memory | File-based |
| Calendar System | Source of schedule data | Manual export (v1); MCP (future) |
| SQLite Database | Structured data persistence | Direct access via Bun |
| File System | Document and configuration storage | Native file operations |

---

## 3. Component Architecture

### 3.1 Architecture Overview

```
+=============================================================================+
|                            AIDA COMPONENT ARCHITECTURE                      |
+=============================================================================+
|                                                                             |
|  +---------------------------------+                                        |
|  |        INTERACTION LAYER        |                                        |
|  |  +---------------------------+  |                                        |
|  |  |       Claude Code CLI     |  |                                        |
|  |  |  - Natural language input |  |                                        |
|  |  |  - Command processing     |  |                                        |
|  |  |  - Response generation    |  |                                        |
|  |  +---------------------------+  |                                        |
|  +---------------------------------+                                        |
|              |                                                              |
|              v                                                              |
|  +---------------------------------+                                        |
|  |        CONTEXT LAYER            |                                        |
|  |  +---------------------------+  |                                        |
|  |  |    User Profile Reader    |  |                                        |
|  |  |  - {{user.neurotype}}     |  |                                        |
|  |  |  - {{user.energy_pattern}}|  |                                        |
|  |  |  - {{user.roles}}         |  |                                        |
|  |  |  - {{user.values}}        |  |                                        |
|  |  +---------------------------+  |                                        |
|  |  +---------------------------+  |                                        |
|  |  |    Session Context        |  |                                        |
|  |  |  - Current time/date      |  |                                        |
|  |  |  - Energy level (reported)|  |                                        |
|  |  |  - Active role context    |  |                                        |
|  |  +---------------------------+  |                                        |
|  +---------------------------------+                                        |
|              |                                                              |
|              v                                                              |
|  +---------------------------------+                                        |
|  |        CAPABILITY AGENTS        |                                        |
|  |  +------------+ +------------+  |                                        |
|  |  | Planning & | | Project    |  |                                        |
|  |  | Scheduling | | Management |  |                                        |
|  |  +------------+ +------------+  |                                        |
|  |  +------------+ +------------+  |                                        |
|  |  | Logging &  | | Document   |  |                                        |
|  |  | Reflection | | Writing    |  |                                        |
|  |  +------------+ +------------+  |                                        |
|  +---------------------------------+                                        |
|              |                                                              |
|              v                                                              |
|  +---------------------------------+                                        |
|  |        DATA LAYER               |                                        |
|  |  +------------+ +------------+  |                                        |
|  |  | SQLite     | | Markdown   |  |                                        |
|  |  | (via Bun)  | | Files      |  |                                        |
|  |  | - Tasks    | | - Journals |  |                                        |
|  |  | - Roles    | | - Plans    |  |                                        |
|  |  | - Projects | | - Notes    |  |                                        |
|  |  | - Journal  | | - Reports  |  |                                        |
|  |  |   Entries  | |            |  |                                        |
|  |  +------------+ +------------+  |                                        |
|  |  +---------------------------+  |                                        |
|  |  | User Profile (JSON)       |  |                                        |
|  |  | .system/context/          |  |                                        |
|  |  | personal-profile.json     |  |                                        |
|  |  +---------------------------+  |                                        |
|  +---------------------------------+                                        |
|                                                                             |
+=============================================================================+
```

### 3.2 Component Descriptions

#### 3.2.1 Interaction Layer: Claude Code CLI

**Purpose:** Primary interface for all user interactions with AIDA.

**Responsibilities:**
- Accept natural language input from user
- Process commands (e.g., `/checkin`, `/next`, `/capture`, `/overview`)
- Generate contextually appropriate responses
- Adapt communication style to user's neurotype profile

**Technology:** Claude Code CLI running Claude models

**Key Files:**
- CLAUDE.md at project root (main system prompt)
- Agent definitions in `.claude/agents/`
- Commands in `.claude/commands/`
- Skills in `.claude/skills/`

#### 3.2.2 Context Layer

**Purpose:** Provide personalized context for all assistant operations.

**Components:**

| Component | Source | Usage |
|-----------|--------|-------|
| User Profile Reader | `.system/context/personal-profile.json` | Static user attributes, neurotype, values |
| Session Context | Runtime state | Current time, energy level, active role |
| Temporal Context | System clock + profile | Map current time to energy patterns |

**Profile Access Pattern:**
```
1. Load user profile at session start
2. Extract relevant fields based on context:
   - {{user.neurotype.challenges}} for adaptation
   - {{user.energy_pattern}} for scheduling
   - {{user.roles}} for task classification
3. Apply profile-driven behavior modifications
```

#### 3.2.3 Capability Agents

**Purpose:** Specialized agents handling different functional domains.

| Agent | Primary Function | Key Capabilities |
|-------|------------------|------------------|
| Planning & Scheduling | Daily/weekly planning | Morning planning, time blocking, energy-aware scheduling |
| Project Management | Project lifecycle | Next-step extraction, status tracking, milestone management |
| Logging & Reflection | Activity capture | Auto-logging, prompted capture, pattern detection |
| Document Writing | Content creation | Drafting, formatting, template management |

**Agent Communication:**
- Agents share context through the Context Layer
- Data persistence through shared Data Layer
- No direct agent-to-agent communication in v1

#### 3.2.4 Data Layer

**Purpose:** Persistent storage for all AIDA data.

**Storage Components:**

| Store | Technology | Contents | Rationale |
|-------|------------|----------|-----------|
| Structured Data | SQLite (via Bun) | Tasks, roles, projects, journal entries | Queryable, relational, status tracking, hierarchy support |
| Documents | Markdown files | Daily logs (generated), daily plans (temp), reviews, notes | Human-readable, Obsidian-viewable |
| Configuration | JSON files | User profile, system settings | Editable, versionable |

**Critical Design Decision:** Daily journals use a **dual-file pattern** with database as Source of Truth:
- All journal entries (check-ins, reflections, task events, notes) stored in `journal_entries` SQLite table
- Daily **log files** (`YYYY-MM-DD.md`) are generated views from database, viewable in Obsidian
- Daily **plan files** (`YYYY-MM-DD-plan.md`) are temporary markdown, editable during day, deleted at evening check-in
- Journal entries are append-only and immutable, enabling pattern analysis and audit trails
- This enables both queryable structured data AND human-readable journal output

---

## 4. Data Separation Principles

### 4.1 Database vs Markdown Decision Matrix

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Tasks | SQLite | Status tracking, queries, relationships, subtask hierarchy |
| Roles | SQLite | Foreign keys, responsibilities, balance targets |
| Projects | SQLite | Relationships, status tracking, finish criteria |
| Journal Entries | SQLite (Source of Truth) | Queryable, relational, append-only, event logging |
| Daily Logs | Markdown (Generated View) | Human-readable journal, Obsidian viewing |
| Daily Plans | Markdown (Temporary) | Editable during day, deleted at evening check-in |
| Weekly Reviews | Markdown | Long-form content, templates |
| Project Notes | Markdown | Documentation, context |

### 4.2 Dual-File Pattern for Daily Workflow

**New Architecture:** Daily journals use a dual-file pattern with database as Source of Truth.

**File 1: Daily Log** (permanent, generated)
- Location: `0-JOURNAL/1-DAILY/YYYY-MM-DD.md`
- Generated from `journal_entries` table via `generateJournalMarkdown()`
- Read-only for users (regenerated on each update)
- Contains: Morning plans, check-ins, evening reflections, task captures
- Viewable in Obsidian for review

**File 2: Daily Plan** (temporary, editable)
- Location: `0-JOURNAL/1-DAILY/YYYY-MM-DD-plan.md`
- Created at morning `/checkin`, updated during day as needed
- **Deleted at evening `/checkin`** - plan is only for TODAY
- Contains: Next steps, schedule, parked items, notes
- Editable by user during the day

**Database: journal_entries table** (Source of Truth)
```sql
CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  entry_type TEXT NOT NULL, -- 'checkin', 'reflection', 'task', 'event', 'note', 'idea'
  content TEXT NOT NULL,
  related_task_id INTEGER REFERENCES tasks(id),
  related_project_id INTEGER REFERENCES projects(id),
  related_role_id INTEGER REFERENCES roles(id)
);
```

**Example Generated Log:**
```markdown
# 2025-12-14 - Lördag

---
## 08:30 | checkin
Planerar att fokusera på AIDA-arkitekturen och träning idag
**Task:** Färdigställa arkitektur | **Projekt:** AIDA | **Roll:** Developer

---
## 14:00 | checkin
Arkitekturdokumenten klara, skjuter träningen till eftermiddag
**Task:** - | **Projekt:** - | **Roll:** -

---
## 21:00 | checkin
Produktiv dag. Dokumentationen tog längre tid än förväntat men resultatet blev bra.
**Task:** - | **Projekt:** - | **Roll:** -
```

### 4.3 Journal Entries: Unified Event Logging

The `journal_entries` table serves as a unified append-only log for all user activities, events, and reflections. It supports both user-facing content (check-ins, reflections) and system events (task changes, captures).

**Entry Types:**

| Type | Purpose | Example Content |
|------|---------|-----------------|
| `checkin` | Daily check-ins (morning/midday/evening) | "Planerar att fokusera på arkitekturen idag" |
| `reflection` | Periodic reflections and reviews | "Produktiv vecka, men behöver bättre tidsuppskattningar" |
| `task` | Task-related events (created, completed, cancelled) | "Färdigställde arkitekturdokumentationen" |
| `event` | External events and meetings | "Standup med teamet - diskuterade ny feature" |
| `note` | Quick notes and observations | "Insikt: morning check-ins funkar bättre än planerat" |
| `idea` | Ideas and brainstorming | "Idé: MCP-server för kalendersync" |

**Design Principles:**
- **Append-only:** Entries are never modified or deleted (immutability for pattern analysis)
- **Relational:** Can link to tasks, projects, and roles for context
- **Queryable:** Structured data enables pattern detection and analytics
- **Renderable:** Generates human-readable markdown journals

**Example:** When user runs `/checkin` in the morning:
1. **journal_entries:** `INSERT INTO journal_entries (entry_type, content, timestamp) VALUES ('checkin', 'Planerar...', '2025-12-14 08:30')`
2. **Markdown log:** Regenerate `YYYY-MM-DD.md` from all journal_entries for the day
3. **Markdown plan:** Create or update `YYYY-MM-DD-plan.md` with today's focus

### 4.4 Data Flow for Daily Workflows

```
User Interaction → journal_entries (INSERT) → generateJournalMarkdown() → YYYY-MM-DD.md

/checkin (morning) → journal_entries + YYYY-MM-DD.md + create YYYY-MM-DD-plan.md
/checkin (midday) → journal_entries + regenerate YYYY-MM-DD.md + update plan if needed
/checkin (evening) → journal_entries + regenerate YYYY-MM-DD.md + DELETE plan file
/capture → tasks + journal_entries (type='task') + regenerate YYYY-MM-DD.md
/next → query tasks + journal_entries (type='checkin') if energy reported
```

**Context-Aware `/checkin` Command:**
The `/checkin` command adapts based on:
- **Time of day** (from user's time_definitions in profile)
- **Existing daily plan** (has morning check-in already happened?)
- **User preferences** (reported energy level, current context)

---

## 5. Integration Specifications

### 5.1 Obsidian Integration

#### 5.1.1 Reading from Obsidian Vault

AIDA reads from the Obsidian vault to gain context about existing knowledge and notes.

**Read Locations:**

| Path Pattern | Purpose | Read Frequency |
|--------------|---------|----------------|
| `0-INBOX/` | Unprocessed captures | On check-in |
| `0-JOURNAL/` | Daily logs, reflections | On planning |
| `A{XX}-{ROLE}/01-NOTES/` | Role-specific notes | On role context switch |
| `A{XX}-{ROLE}/02-RESOURCES/` | Reference materials | On demand |
| `A{XX}-{ROLE}/P{XXX}-*/` | Project files | On project reference |

**Reading Pattern:**
```
1. User initiates interaction (e.g., /morgon)
2. AIDA reads relevant vault sections:
   - Yesterday's journal entry (context)
   - Active project folders (status)
   - Inbox items (new captures)
3. Incorporate into planning/response
```

#### 5.1.2 Writing to Obsidian Vault

AIDA generates output that appears in the Obsidian vault.

**Write Locations:**

| Output Type | Path | Filename Pattern |
|-------------|------|------------------|
| Daily Summary | `0-JOURNAL/` | `YYYY-MM-DD.md` |
| Weekly Review | `0-JOURNAL/reviews/` | `YYYY-Wnn-review.md` |
| Task Lists | `A{XX}-{ROLE}/01-NOTES/` | `tasks-active.md` |
| Project Status | `A{XX}-{ROLE}/P{XXX}-*/` | `status.md` |
| Meeting Notes | `A{XX}-{ROLE}/01-NOTES/` | `YYYY-MM-DD-{meeting}.md` |

**Writing Pattern:**
```
1. User completes check-in or review
2. AIDA generates structured markdown
3. Write to appropriate vault location
4. User views/edits in Obsidian
```

#### 5.1.3 Folder Mapping (mixed principles from PARA, GTD and dewey decimal)

The structured maps to user roles defined in `{{user.roles}}`:

```
ROOT/
+-- 0-INBOX/                    # Capture bucket (role-agnostic)
+-- 0-JOURNAL/                  # Time-based logs (role-agnostic)
|   +-- reviews/                # Periodic reviews
+-- 0-SHARED/                   # Cross-role resources
|
+-- 01-{role.label}/           # Role 1 (from {{user.roles.1}})
|   +-- 01-NOTES/               # Working notes
|   +-- 02-RESOURCES/           # Reference materials
|   +-- P001-{project}/         # Active projects
|   +-- P002-{project}/
|
+-- 02-{role.label}/           # Role 2 (from {{user.roles.2}})
|   +-- [same structure]
|
+-- [... A03-A10 as defined in profile]
```

**Role-to-Folder Mapping:**
- Role IDs (1-10) map to folders (A01-A10)
- Role `{{user.roles.N.label}}` determines folder name
- Role `{{user.roles.N.type}}` helps classify work/personal boundaries

### 5.2 VS Code Integration

#### 5.2.1 Claude Code IDE Extension

VS Code serves as the development environment where Claude Code can assist with coding tasks.

**Integration Points:**

| Feature | Mechanism | Purpose |
|---------|-----------|---------|
| Code Assistance | Claude Code extension | AI-assisted development |
| Project Context | CLAUDE.md files | Project-specific memory |
| File Operations | Native file access | Read/write project files |

#### 5.2.2 Project Memory via CLAUDE.md

Each project can maintain context through CLAUDE.md files:

```
PROJECT_ROOT/
+-- CLAUDE.md                   # Project-level context
|   +-- Project description
|   +-- Key decisions
|   +-- Architecture notes
|   +-- Conventions
+-- src/
+-- ...
```

**CLAUDE.md Structure:**
```markdown
# Project: {Project Name}

## Overview
[Brief project description]

## Key Decisions
- Decision 1: Rationale
- Decision 2: Rationale

## Architecture
[High-level architecture notes]

## Conventions
- Naming conventions
- File organization
- Code style

## Current Focus
[What's being worked on]
```

### 5.3 Calendar Integration

#### 5.3.1 Initial Approach: Manual Export

**Version 1 Workflow:**
```
1. User exports calendar to markdown format
2. Sends to AIDA via copy-paste during morning planning
4. AIDA reads event data
5. Incorporate into planning
```

**Calendar Markdown Format:**
```markdown
# Calendar: 2025-12-14

## Scheduled Events

### 09:00-10:00 - Team Standup
- Location: Teams
- Role: {{user.roles.1.label}}
- Prep needed: Review sprint board

### 14:00-15:30 - Project Review
- Location: Conference Room B
- Role: {{user.roles.2.label}}
- Prep needed: Status update document

## Available Blocks
- 06:00-09:00: Deep work (high energy)
- 10:00-12:00: Available
- 15:30-17:00: Available
```

#### 5.3.2 Future: MCP Integration

**Potential MCP Calendar Integration:**
```
+-------------------+        MCP Protocol        +-------------------+
|                   |<-------------------------->|                   |
|   Claude Code     |    calendar.list_events    |   Calendar MCP    |
|                   |    calendar.get_event      |   Server          |
|                   |    calendar.create_event   |                   |
+-------------------+                            +-------------------+
                                                         |
                                                         v
                                                 +-------------------+
                                                 |   Apple Calendar  |
                                                 |   Google Calendar |
                                                 |   Outlook         |
                                                 +-------------------+
```

**Benefits of MCP Integration:**
- Real-time calendar access
- Bi-directional sync (read and write)
- Automatic event detection
- No manual export required

---

## 6. Data Flow Diagrams

### 6.1 Morning Check-in Workflow

```
+============================================================================+
|                        MORNING CHECK-IN WORKFLOW                            |
+============================================================================+

  User                Claude Code              Data Layer            Obsidian
    |                     |                        |                     |
    |   /checkin          |                        |                     |
    |   (morning)         |                        |                     |
    |-------------------->|                        |                     |
    |                     |                        |                     |
    |                     |  Read user profile     |                     |
    |                     |----------------------->|                     |
    |                     |  {{user.energy_pattern}}                     |
    |                     |  {{user.roles}}        |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  Read yesterday's log  |                     |
    |                     |------------------------------------------------>|
    |                     |  0-JOURNAL/YYYY-MM-DD.md                      |
    |                     |<------------------------------------------------|
    |                     |                        |                     |
    |                     |  Query active tasks    |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: tasks WHERE   |                     |
    |                     |  status='active'       |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  Read calendar         |                     |
    |                     |------------------------------------------------>|
    |                     |  0-SHARED/calendar/                           |
    |                     |<------------------------------------------------|
    |                     |                        |                     |
    |                     |  [Generate Plan]       |                     |
    |                     |  - Map energy to time  |                     |
    |                     |  - Select 1-3 focus items                    |
    |                     |  - Identify next steps |                     |
    |                     |                        |                     |
    |  Day plan summary   |                        |                     |
    |<--------------------|                        |                     |
    |  - Today's focus    |                        |                     |
    |  - Suggested blocks |                        |                     |
    |  - First action     |                        |                     |
    |                     |                        |                     |
    |  Confirm/adjust     |                        |                     |
    |-------------------->|                        |                     |
    |                     |                        |                     |
    |                     |  Write daily plan      |                     |
    |                     |------------------------------------------------>|
    |                     |  0-JOURNAL/YYYY-MM-DD.md                      |
    |                     |                        |                     |
    |                     |  Update task status    |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: tasks         |                     |
    |                     |                        |                     |
    |  "Start with: X"    |                        |                     |
    |<--------------------|                        |                     |
    |                     |                        |                     |
+============================================================================+
```

### 6.2 Task Capture Workflow

```
+============================================================================+
|                          TASK CAPTURE WORKFLOW                              |
+============================================================================+

  User                Claude Code              Data Layer            Obsidian
    |                     |                        |                     |
    |  Natural language   |                        |                     |
    |  task description   |                        |                     |
    |-------------------->|                        |                     |
    |  "I need to finish  |                        |                     |
    |   the report for    |                        |                     |
    |   tomorrow's meeting"|                       |                     |
    |                     |                        |                     |
    |                     |  Read user profile     |                     |
    |                     |----------------------->|                     |
    |                     |  {{user.roles}}        |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  [Parse & Classify]    |                     |
    |                     |  - Extract: "report"   |                     |
    |                     |  - Deadline: tomorrow  |                     |
    |                     |  - Context: meeting    |                     |
    |                     |  - Role: infer from context                  |
    |                     |                        |                     |
    |  Clarification      |                        |                     |
    |  (if needed)        |                        |                     |
    |<--------------------|                        |                     |
    |  "Is this for       |                        |                     |
    |   {{user.roles.2.label}}?"                   |                     |
    |                     |                        |                     |
    |  Confirmation       |                        |                     |
    |-------------------->|                        |                     |
    |                     |                        |                     |
    |                     |  [Generate Next Step]  |                     |
    |                     |  "Open report document |                     |
    |                     |   and review outline"  |                     |
    |                     |                        |                     |
    |                     |  Insert task           |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: INSERT INTO   |                     |
    |                     |  tasks (...)           |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |  Confirmation       |                        |                     |
    |<--------------------|                        |                     |
    |  "Captured: Report  |                        |                     |
    |   due tomorrow      |                        |                     |
    |   Role: {role}      |                        |                     |
    |   Next: {step}"     |                        |                     |
    |                     |                        |                     |
+============================================================================+
```

### 6.3 Task Completion and Journal Entry Workflow

```
+============================================================================+
|                  TASK COMPLETION & JOURNAL ENTRY WORKFLOW                   |
+============================================================================+

  User                Claude Code              Data Layer            Obsidian
    |                     |                        |                     |
    |  Natural language   |                        |                     |
    |  completion report  |                        |                     |
    |-------------------->|                        |                     |
    |  "Finished the      |                        |                     |
    |   security review,  |                        |                     |
    |   took longer than  |                        |                     |
    |   expected"         |                        |                     |
    |                     |                        |                     |
    |                     |  Query active tasks    |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: SELECT FROM   |                     |
    |                     |  tasks WHERE status IN |                     |
    |                     |  ('ready', 'planned')  |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  [Match Task]          |                     |
    |                     |  - Identify: "security review" task          |
    |                     |  - Detect completion   |                     |
    |                     |  - Note: time variance |                     |
    |                     |                        |                     |
    |                     |  Update task status    |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: UPDATE tasks  |                     |
    |                     |  SET status='done'     |                     |
    |                     |  Script: setTaskStatus()|                    |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  Create journal entry  |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: INSERT INTO   |                     |
    |                     |  journal_entries       |                     |
    |                     |  (type='task', ...)    |                     |
    |                     |  Script: createEntry() |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  Regenerate daily log  |                     |
    |                     |------------------------------------------------>|
    |                     |  YYYY-MM-DD.md         |                     |
    |                     |                        |                     |
    |  Optional prompt    |                        |                     |
    |<--------------------|                        |                     |
    |  "How much longer?  |                        |                     |
    |   Any learnings?"   |                        |                     |
    |                     |                        |                     |
    |  Response           |                        |                     |
    |-------------------->|                        |                     |
    |  "About 2 hours     |                        |                     |
    |   instead of 1"     |                        |                     |
    |                     |                        |                     |
    |                     |  Update time estimate  |                     |
    |                     |  in task metadata      |                     |
    |                     |----------------------->|                     |
    |                     |  (for future estimates)|                     |
    |                     |                        |                     |
    |  Acknowledgment     |                        |                     |
    |<--------------------|                        |                     |
    |  "Logged. Task      |                        |                     |
    |   marked complete." |                        |                     |
    |                     |                        |                     |
+============================================================================+
```

### 6.4 Context-Aware Check-in Workflow

```
+=============================================================================+
|                     CONTEXT-AWARE CHECK-IN WORKFLOW                         |
+=============================================================================+

  User                Claude Code              Data Layer            Obsidian
    |                     |                        |                     |
    |  /checkin           |                        |                     |
    |-------------------->|                        |                     |
    |                     |                        |                     |
    |                     |  [Determine Context]   |                     |
    |                     |  - Read user profile   |                     |
    |                     |  - Check time of day   |                     |
    |                     |  - Query existing plan |                     |
    |                     |                        |                     |
    |                     |  Read journal entries  |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: SELECT FROM   |                     |
    |                     |  journal_entries WHERE |                     |
    |                     |  date(timestamp)=today |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  Read tasks & plan     |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: today's tasks |                     |
    |                     |  File: YYYY-MM-DD-plan |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  [Adapt Behavior]      |                     |
    |                     |  IF morning:           |                     |
    |                     |    - Create day plan   |                     |
    |                     |    - Suggest focus     |                     |
    |                     |  IF midday:            |                     |
    |                     |    - Progress summary  |                     |
    |                     |    - Adjust plan       |                     |
    |                     |  IF evening:           |                     |
    |                     |    - Day review        |                     |
    |                     |    - Delete plan file  |                     |
    |                     |                        |                     |
    |  Context-aware      |                        |                     |
    |  response           |                        |                     |
    |<--------------------|                        |                     |
    |  [Morning example]  |                        |                     |
    |  "God morgon!       |                        |                     |
    |   Today's focus:    |                        |                     |
    |   - Architecture    |                        |                     |
    |   Start with: X"    |                        |                     |
    |                     |                        |                     |
    |  Energy/notes       |                        |                     |
    |  (optional)         |                        |                     |
    |-------------------->|                        |                     |
    |  "High energy,      |                        |                     |
    |   ready to code"    |                        |                     |
    |                     |                        |                     |
    |                     |  Create journal entry  |                     |
    |                     |----------------------->|                     |
    |                     |  SQLite: INSERT INTO   |                     |
    |                     |  journal_entries       |                     |
    |                     |  (type='checkin', ...) |                     |
    |                     |<-----------------------|                     |
    |                     |                        |                     |
    |                     |  Update/create files   |                     |
    |                     |------------------------------------------------>|
    |                     |  YYYY-MM-DD.md         |                     |
    |                     |  YYYY-MM-DD-plan.md    |                     |
    |                     |                        |                     |
+============================================================================+
```

**Context Detection Logic:**
1. **Morning** (first check-in of day, or time < noon): Create day plan, suggest focus tasks
2. **Midday** (plan exists, time 11:00-16:00): Progress check, adjust plan, energy assessment
3. **Evening** (plan exists, time > 18:00): Day review, completion summary, delete plan file

---

## 7. Deployment Topology

### 7.1 Installation

**First-Time Setup:**

AIDA uses cross-platform install scripts that handle:
1. Dependency installation (Bun packages)
2. Folder structure creation
3. Database initialization

**Installation Scripts:**

| Platform | Script | Command |
|----------|--------|---------|
| Mac/Linux | `install.sh` | `./install.sh` |
| Windows | `install.ps1` | `.\install.ps1` |

**Installation Workflow:**

```
User Clones Repository
        |
        v
Run install.sh / install.ps1
        |
        +---> [1] Check Bun installed
        |
        +---> [2] cd .system && bun install
        |
        +---> [3] bun run .system/tools/setup.ts
                   |
                   +---> Create folders:
                   |     - 0-INBOX/
                   |     - 0-JOURNAL/
                   |       - 1-DAILY/
                   |       - 2-WEEKLY/
                   |       - 3-MONTHLY/
                   |       - 4-YEARLY/
                   |     - 0-SHARED/
                   |
                   +---> Initialize database:
                         - Create .system/data/aida.db
                         - Apply schema from db_schema.sql
                         - Enable WAL mode
                         - Enable foreign keys
        |
        v
✅ AIDA Ready to Use
```

**User Folders (gitignored):**

All user content folders start with a digit and are gitignored via pattern `[0-9]*/`:
- `0-INBOX/` - Capture bucket
- `0-JOURNAL/` - Daily logs and journals (with 1-DAILY/, 2-WEEKLY/, 3-MONTHLY/, 4-YEARLY/ subfolders)
- `0-SHARED/` - Cross-role shared resources
- `01-{role}/`, `02-{role}/`, etc. - Role-specific folders (created by user as needed)

This approach keeps the repository clean and focuses version control on:
- System code and tools
- Architecture documentation
- Claude Code configuration (agents, commands, skills)
- Database schema

**Prerequisites:**

- **Bun runtime** (v1.0+) - https://bun.sh
  - Mac/Linux: `curl -fsSL https://bun.sh/install | bash`
  - Windows: `powershell -c "irm bun.sh/install.ps1|iex"`

### 7.2 Local-First Architecture

```
+=============================================================================+
|                         LOCAL DEPLOYMENT TOPOLOGY                           |
+=============================================================================+
|                                                                             |
|                        USER'S LOCAL MACHINE (macOS)                         |
|  +-----------------------------------------------------------------------+  |
|  |                                                                       |  |
|  |  +------------------+                                                 |  |
|  |  |   Claude Code    |  Anthropic API calls for AI processing          |  |
|  |  |   CLI Process    |-----------------------------------------> Cloud |  |
|  |  +--------+---------+                                                 |  |
|  |           |                                                           |  |
|  |           | File System Access                                        |  |
|  |           v                                                           |  |
|  |  +------------------------------------------------------------------+ |  |
|  |  |                    LOCAL FILE SYSTEM                             | |  |
|  |  |                                                                  | |  |
|  |  |  ~/PAi/                                                          | |  |
|  |  |  +-- CLAUDE.md                         [Main System Prompt]      | |  |
|  |  |  +-- .claude/                          [Claude Code Config]      | |  |
|  |  |  |   +-- agents/                       [Subagent Definitions]    | |  |
|  |  |  |   +-- commands/                     [Slash Commands]          | |  |
|  |  |  |   +-- skills/                       [Auto-invoked Skills]     | |  |
|  |  |  |   +-- settings.json                 [Hooks Config]            | |  |
|  |  |  |                                                               | |  |
|  |  |  +-- .system/                          [AIDA System Files]       | |  |
|  |  |  |   +-- architecture/                 [Design Specs/Standards]  | |  |
|  |  |  |   +-- context/                      [User Profile]            | |  |
|  |  |  |   +-- data/                         [SQLite Database]         | |  |
|  |  |  |   +-- tools/                        [Scripts & Utilities]     | |  |
|  |  |  |   +-- bunfig.toml                   [Bun Configuration]       | |  |
|  |  |  |                                                               | |  |
|  |  |  +-- 0-INBOX/                          [Obsidian Vault]          | |  |
|  |  |  +-- 0-JOURNAL/                        [Daily Journals - MD]     | |  |
|  |  |  +-- 0-SHARED/                         [Cross-role resources]    | |  |
|  |  |  +-- A01-{role}/                                                 | |  |
|  |  |  +-- A02-{role}/                                                 | |  |
|  |  |  +-- ...                                                         | |  |
|  |  |                                                                  | |  |
|  |  +------------------------------------------------------------------+ |  |
|  |           ^                                                           |  |
|  |           | Read/Edit                                                 |  |
|  |           |                                                           |  |
|  |  +--------+---------+         +------------------+                    |  |
|  |  |                  |         |                  |                    |  |
|  |  |    Obsidian      |         |     VS Code      |                    |  |
|  |  |    (PKM App)     |         |     (IDE)        |                    |  |
|  |  |                  |         |                  |                    |  |
|  |  +------------------+         +------------------+                    |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+=============================================================================+
```

### 7.2 Single-User Design

**Design Decisions:**

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| User Model | Single user only | Cognitive profiles are deeply personal |
| Data Isolation | All data local | Privacy and data sovereignty |
| Authentication | None required | Local execution, no multi-tenancy |
| Permissions | OS-level only | File system permissions suffice |

### 7.3 File-Based Persistence

**Data Location Strategy:**

```
~/PAi/                           # Root directory (configurable)
+-- CLAUDE.md                    # Main system prompt for Claude Code
+-- .claude/                     # Claude Code configuration (managed by Claude Code)
|   +-- agents/                  # Subagent definitions (task-manager, daily-planner)
|   +-- commands/                # Slash commands (/morgon, /checkin, etc.)
|   +-- skills/                  # Auto-invoked skills (task-activation, etc.)
|   +-- settings.json            # Hooks configuration
|
+-- .system/                     # System files (hidden)
|   +-- architecture/            # Architecture documentation
|   +-- context/                 # User context
|   |   +-- personal-profile.json
|   |   +-- personal-profile-schema.json
|   +-- data/                    # Structured data (SQLite only)
|   |   +-- aida.db              # SQLite database
|   +-- tools/                   # Scripts and utilities (Bun/TypeScript)
|   |   +-- database/            # Database layer (queries, types, connection)
|   |   +-- utilities/           # Helper utilities (time, symbols)
|   +-- architecture/            # Design specs and coding standards
|   +-- bunfig.toml              # Bun configuration
|
+-- [Obsidian vault structure]   # User-visible content (journals, notes, etc.)
```

**Separation of Concerns:**
- `.claude/` - Claude Code's configuration system (agents, commands, skills, hooks)
- `.system/` - AIDA's internal system (data, tools, architecture, context)

### 7.4 No Cloud Dependencies

**External Service Usage:**

| Service | Usage | Data Sent | Privacy Impact |
|---------|-------|-----------|----------------|
| Anthropic API | AI model inference | Prompts only | Minimal - no persistent storage |
| None | N/A | N/A | All data remains local |

**Offline Capability:**
- All data stored locally
- System functional for data access without internet
- AI features require internet for API calls
- No cloud sync or backup built-in

---

## 8. Technology Rationale

### 8.1 Why SQLite (via Bun)

**Decision:** Use SQLite as the structured data store, accessed via Bun runtime as its driver is built-in.

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| PostgreSQL | Full-featured, scalable | Server process, complex setup | Overkill for single-user |
| JSON files | Simple, human-readable | No queries, concurrency issues | Limited query capability |
| MongoDB | Flexible schema | Server process, resource heavy | Unnecessary complexity |
| LevelDB | Fast, embedded | Limited query support | Poor fit for relational data |

**Why SQLite:**

1. **Local-first:** Single file, no server process
2. **Portable:** Database is just a file, easy to backup/move
3. **Capable:** Full SQL support for complex queries
4. **Performant:** Excellent for single-user read/write patterns
5. **Mature:** Battle-tested, widely supported
6. **Bun-native:** Bun has excellent SQLite bindings, fast access

**Example Use Cases:**

```sql
-- Task queries
SELECT * FROM tasks
WHERE role_id = 2 AND status = 'active'
ORDER BY priority DESC;

-- Time tracking
SELECT role_id, SUM(duration_minutes) as total
FROM activity_log
WHERE date >= date('now', '-7 days')
GROUP BY role_id;

-- Staleness detection
SELECT * FROM tasks
WHERE status = 'active'
AND last_updated < date('now', '-14 days');
```

### 8.2 Why Claude Code as Primary Interface

**Decision:** Use Claude Code CLI as the primary (and initially only) interface.

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| Custom GUI | Full control, rich UI | Development effort, maintenance | Resource constraint |
| Obsidian Plugin | Integrated, familiar | Limited AI capabilities | Insufficient for AI-first |
| Web App | Accessible anywhere | Server required, security concerns | Against local-first principle |
| Mobile App | Always available | Multiple platforms, complexity | Future consideration |

**Why Claude Code:**

1. **Already available:** Built into the user's workflow
2. **Powerful AI:** Full Claude model capabilities
3. **Extensible:** MCP tools, custom agents
4. **Low friction:** Terminal-based, keyboard-driven
5. **Developer-friendly:** Matches user's existing tools
6. **File access:** Native read/write to local files

**Cognitive Fit:**
- Reduces context switching from development work
- Supports the "activation over perfection" principle

### 8.3 Why Local-First Approach

**Decision:** All data stored locally, no cloud sync or storage.

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| Cloud-first | Anywhere access, backup | Privacy concerns, dependency | User values data sovereignty |
| Hybrid | Best of both | Complexity, sync conflicts | Unnecessary for single-user |
| Cloud backup | Data safety | Still dependent on external | Can be added separately |

**Why Local-First:**

1. **Privacy:** Sensitive cognitive profile data stays local
2. **Control:** User owns all their data
3. **Reliability:** No service dependencies
4. **Speed:** No network latency for data access
5. **Simplicity:** No sync logic or conflict resolution
6. **User values:** Aligns with `{{user.values.positions}}` on data control

**Trade-offs Accepted:**
- No automatic backup (user responsible)
- No multi-device sync (future consideration)
- No mobile access (CLI limitation)

---

## 9. Backup and Recovery

### 9.1 Data Persistence Strategy

**Data Categories and Persistence:**

| Data Type | Location | Backup Priority | Recovery Impact |
|-----------|----------|-----------------|-----------------|
| User Profile | `.system/context/personal-profile.json` | Critical | System non-functional |
| SQLite Database | `.system/data/aida.db` | Critical | Lose all task/project data |
| Markdown Documents | `0-JOURNAL/`, `A{XX}-*/` | High | Lose notes and history |
| Claude Code Configs | `.claude/` | Medium | Can regenerate |
| Architecture Docs | `.system/architecture/` | Low | Reference only |

### 9.2 Backup Approach

**Recommended Backup Strategy:**

```
+============================================================================+
|                           BACKUP STRATEGY                                   |
+============================================================================+

  Option 1: Git-based (Recommended)
  +-----------------------------------------+
  |                                         |
  |   ~/PAi/.git/                          |
  |                                         |
  |   - Version control for all files      |
  |   - Full history of changes            |
  |   - Can push to private remote         |
  |   - SQLite can be tracked (binary)     |
  |                                         |
  |   Exclude:                              |
  |   - .system/logs/ (if large)           |
  |   - Temp files                          |
  |                                         |
  +-----------------------------------------+

  Option 2: Time Machine / System Backup
  +-----------------------------------------+
  |                                         |
  |   Automatic inclusion in:               |
  |   - macOS Time Machine                  |
  |   - Any whole-system backup             |
  |                                         |
  |   Pros: Zero configuration              |
  |   Cons: Less granular recovery          |
  |                                         |
  +-----------------------------------------+

  Option 3: Manual Export
  +-----------------------------------------+
  |                                         |
  |   Periodic export command:              |
  |   /backup or custom script              |
  |                                         |
  |   Exports:                              |
  |   - SQLite dump to SQL                  |
  |   - Profile JSON                        |
  |   - Key documents                       |
  |                                         |
  |   Destination: External drive/cloud     |
  |                                         |
  +-----------------------------------------+
```

### 9.3 Recovery Approach

**Recovery Scenarios:**

| Scenario | Recovery Method | Data Loss |
|----------|-----------------|-----------|
| Accidental deletion | Git checkout / Time Machine | None if backed up |
| Database corruption | Restore from backup | Since last backup |
| Profile misconfiguration | Revert to previous version | Configuration only |
| Full system failure | Restore from Git/backup | Since last backup |
| New machine setup | Clone Git repo + install tools | None |

**Recovery Procedure:**

```
1. CRITICAL FILES RECOVERY
   - Restore personal-profile.json first
   - Restore aida.db second
   - Verify: Claude Code can read profile

2. DOCUMENT RECOVERY
   - Restore Obsidian vault folders
   - Verify: Obsidian opens without errors

3. VERIFICATION
   - Run /overview command
   - Check task counts match expected
   - Review recent journal entries

4. OPTIONAL REGENERATION
   - Agent configs can be regenerated
   - Architecture docs are reference only
```

### 9.4 Data Integrity

**SQLite Integrity:**

```sql
-- Run periodically or after recovery
PRAGMA integrity_check;
PRAGMA foreign_key_check;
```

**Profile Validation:**

```javascript
// Validate against schema
const Ajv = require('ajv');
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(profile);
```

---

## 10. Security Considerations

### 10.1 Threat Model

| Threat | Mitigation | Residual Risk |
|--------|------------|---------------|
| Unauthorized local access | OS file permissions | User device security |
| Profile data exposure | Local-only storage | Device theft/access |
| API key exposure | Standard Claude Code security | Minimal |
| Data loss | Backup strategy | User discipline |

### 10.2 Sensitive Data Handling

**Profile Data:**
- Contains personal cognitive information
- Never transmitted except in prompts
- User controls all access

**Recommendations:**
- Enable FileVault (macOS disk encryption)
- Use strong device password
- Backup to encrypted destinations

---

## 11. Future Considerations

### 11.1 Potential Enhancements

| Enhancement | Priority | Complexity | Value |
|-------------|----------|------------|-------|
| MCP Calendar Integration | High | Medium | Real-time scheduling |
| Email Integration (MCP) | Medium | High | Communication management |
| Mobile Companion App | Medium | High | Anywhere capture |
| Voice Input | Low | Medium | Accessibility |
| Multi-device Sync | Low | High | Cross-device use |

### 11.2 MCP Expansion Opportunities

```
Current: Claude Code + File Access
Future:  Claude Code + MCP Ecosystem

Potential MCP Servers:
+-- calendar-mcp          # Calendar read/write
+-- email-mcp             # Email access
+-- browser-mcp           # Web research
+-- notes-mcp             # Cross-app notes
+-- reminders-mcp         # System reminders
```

### 11.3 Evolution Path

```
Phase 1 (Current): Foundation
  - Claude Code CLI
  - SQLite + Markdown
  - Manual calendar export
  - Obsidian for output viewing

Phase 2: Integration
  - MCP Calendar
  - Richer planning algorithms
  - Pattern learning

Phase 3: Expansion
  - Email integration
  - Mobile capture companion
  - Cross-device sync (optional)

Phase 4: Intelligence
  - Predictive suggestions
  - Automated task generation
  - Deep pattern analysis
```

---

## 12. Appendix

### 12.1 Command Reference

| Command | Purpose | Data Sources |
|---------|---------|--------------|
| `/checkin` | Context-aware daily check-in (morning/midday/evening) | Profile, Time, Tasks, Journal entries, Yesterday's log |
| `/next` | Next recommended action | Active tasks, Energy state, Current context |
| `/capture [text]` | Quick task capture | Parse to task store, Create journal entry |
| `/overview [role]` | Role workload overview | Tasks, Projects by role (from v_roles_summary view) |

**Deprecated Commands** (replaced by `/checkin`):
- ~~`/morgon`~~ → `/checkin` (morning behavior auto-detected)
- ~~`/kvall`~~ → `/checkin` (evening behavior auto-detected)
- ~~`/nasta`~~ → `/next`
- ~~`/fanga`~~ → `/capture`
- ~~`/logg`~~ → Natural language task completion

**Context-Aware `/checkin` Behavior:**
The `/checkin` command adapts automatically based on time of day and existing daily plan:
- **Morning** (first check-in or time < noon): Creates day plan, suggests focus
- **Midday** (11:00-16:00 with existing plan): Progress check, plan adjustment
- **Evening** (after 18:00 with existing plan): Day review, deletes plan file

### 12.2 Data Schema Overview

**Core Tables (SQLite):**

```sql
-- Roles: User's life/work roles
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- Changed from 'label'
    type TEXT NOT NULL,                     -- 'meta', 'work', 'personal', 'private', 'civic', 'side_business', 'hobby'
    description TEXT,
    responsibilities TEXT,                  -- JSON array: ["resp 1", "resp 2", ...]
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'inactive', 'historical'
    balance_target REAL,                    -- 0.0-1.0
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Projects: Group related tasks under projects
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'on_hold', 'completed', 'cancelled'
    description TEXT NOT NULL,
    finish_criteria TEXT,                   -- JSON: [{"criterion": "...", "done": false}, ...]
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Tasks: Full lifecycle management with subtask hierarchy
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'captured',  -- 'captured', 'clarified', 'ready', 'planned', 'done', 'cancelled'
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 0 AND 3),
    energy_requirement TEXT CHECK (energy_requirement IN ('low', 'medium', 'high')),
    time_estimate INTEGER,                    -- minutes
    project_id INTEGER,                       -- NEW: link to project
    role_id INTEGER NOT NULL,
    parent_task_id INTEGER,                   -- NEW: for subtask hierarchy
    start_date TEXT,
    deadline TEXT,
    remind_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Journal Entries: Unified append-only event log
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    entry_type TEXT NOT NULL DEFAULT 'checkin',  -- 'checkin', 'reflection', 'task', 'event', 'note', 'idea'
    content TEXT NOT NULL,
    related_task_id INTEGER,
    related_project_id INTEGER,
    related_role_id INTEGER,
    FOREIGN KEY (related_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (related_role_id) REFERENCES roles(id) ON DELETE SET NULL
);
```

**Key Views (computed from base tables):**
- `v_tasks_full` - Tasks with role/project context, subtasks JSON, calculated fields (days_overdue, week_number)
- `v_today_tasks` - Tasks relevant for today's planning
- `v_overdue_tasks` - Tasks past their deadline
- `v_stale_tasks` - Tasks that haven't progressed in a while
- `v_projects_full` - Projects with task statistics (total, done, active, percent_complete)
- `v_roles_summary` - Roles with aggregated project and task counts

See `system-architecture.md` for complete view definitions and query function specifications.

**Generated from Database:**
- Daily log files → `0-JOURNAL/1-DAILY/YYYY-MM-DD.md` (generated from journal_entries)

**Pure Markdown (NOT in Database):**
- Daily plan files → `0-JOURNAL/1-DAILY/YYYY-MM-DD-plan.md` (temporary, deleted at /kvall)
- Weekly reviews → `0-JOURNAL/2-WEEKLY/YYYY-Wnn-review.md`
- Project documentation → `A{XX}-{role}/P{XXX}-{project}/`

### 12.3 Profile Field Reference

Key profile fields used by AIDA:

| Variable | Maps To | Value |
|----------|---------|---------------|
| `{{user.identity.name}}` | `profile.identity.name` | Name of user |
| `{{user.neurotype}}` | `profile.neurotype` | Full neurotype object |
| `{{user.neurotype.label}}` | `profile.neurotype.label` | Nerotype profile |
| `{{user.neurotype.challenges}}` | `profile.neurotype.challenges` | Array of challenges |
| `{{user.energy_pattern}}` | `profile.energy_pattern` | Full energy pattern |
| `{{user.energy_pattern.high}}` | `profile.energy_pattern.high` | High energy config |
| `{{user.roles}}` | `profile.roles` | Full roles object |
| `{{user.values.core}}` | `profile.values.core` | Array of core values |
| `{{user.time_definitions}}` | `profile.time_definitions` | Time period definitions |

---

## 13. Document History

| Date | Version | Change |
|------|---------|--------|
| 2025-12-14 | 1.0 | Initial solution architecture document |
| 2025-12-14 | 2.0 | Updated for new database schema: added projects table, removed activity_log, unified journal_entries. Updated commands: consolidated /morgon, /kvall to context-aware /checkin. Renamed commands to English (/next, /capture, /overview). Updated all data flows and workflows. |
| 2025-12-15 | 2.1 | Added installation section (7.1): documented cross-platform install scripts (install.sh, install.ps1, setup.ts), gitignore pattern for user folders, and setup workflow. |
| 2025-12-16 | 2.2 | Renamed /status command to /overview to avoid conflict with Claude Code's built-in /status command. Updated all references across documentation. |

---

*End of Solution Architecture Document*
