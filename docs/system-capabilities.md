# AIDA System Capabilities

> Practical capability overview for cognitive augmentation.

## Design Philosophy

AIDA exists to **extend human cognitive capacity**, not replace human judgment.

> "It remembers so you can forget. It monitors so you can focus. It structures so you can think freely."

The system succeeds when the user feels *less* overwhelmed, can focus on high-value decisions while routine cognition is externalized, and experiences AIDA as an extension of self rather than an external tool.

---

## Core Capabilities

### 1. Session Management

Context-aware daily structure through three check-in types:

| Check-in | Timing | Purpose |
|----------|--------|---------|
| **Morning** | < 11:00 or first of day | Plan focus items, match tasks to energy |
| **Midday** | 11:00-17:59 with plan | Adjust priorities, check progress |
| **Evening** | >= 18:00 with plan | Review accomplishments, archive plan |

**Key Features:**
- Energy-aware task scheduling (match high-energy tasks to peak hours)
- 1-3 focus items max (prevents overwhelm)
- Daily plan file (PLAN.md) created morning, cleared evening
- Automatic journal entry generation

**Related:**
- Command: `/checkin`
- Skill: `daily-planning`
- Docs: `workflows/daily-planning.md`

---

### 2. Task Management

Frictionless capture and activation support for task execution.

**Lifecycle Stages:**
```
captured → clarified → ready → planned → active → done
```

**Capabilities:**

| Capability | Description | How |
|------------|-------------|-----|
| **Capture** | Natural language → structured task | `/capture` or trigger phrases |
| **Classification** | Auto-infer role, priority, energy requirement | Role inference from keywords/context |
| **Activation** | Extract smallest first step | `/next` when stuck/overwhelmed |
| **Status Tracking** | Monitor progress, identify stale tasks | Status lifecycle queries |
| **Abandonment** | Deliberate "not doing" decisions | Manual status: cancelled |

**Design Principles:**
- Speed over perfection (capture now, refine later)
- ONE thing at a time (never show full list)
- 5-minute rule (just start, decide to continue later)
- Non-judgmental framing (deferrals = rescheduling, not failure)

**Related:**
- Commands: `/capture`, `/next`
- Skills: `task-capture`, `task-activation`
- Docs: `workflows/task-capture.md`, `workflows/task-activation.md`

---

### 3. Information Management

Dual-file pattern: database as source of truth, markdown as generated view.

**Storage:**
- **Database**: SQLite with journal_entries, tasks, roles, projects tables
- **Markdown**: Generated from database for Obsidian compatibility
- **Journal entries**: Immutable, append-only log

**Entry Types:**

| Type | Purpose | Created By |
|------|---------|------------|
| `checkin` | Daily check-ins | `/checkin` command |
| `reflection` | Thoughts, learnings | User-initiated |
| `task` | Task completions | Task marked done |
| `event` | Meeting logs | After meetings |
| `note` | General notes | User capture |
| `idea` | Captured ideas | User capture |

**Query Capabilities:**
- 71 database functions across 7 modules
- Search by role, project, date range, entry type
- Structured retrieval (getTodayTasks, getOverdueTasks, etc.)

**Related:**
- Modules: `journal`, `journalMd`, `tasks`, `roles`, `projects`, `plan`, `profile`
- Docs: `integration/journal-system.md`, `query-reference.md`

---

## Support Systems

### 4. Energy & Context

User model with dynamic state tracking and pattern learning.

**Profile Sections:**

| Section | Contents |
|---------|----------|
| **Identity** | Name, location, roles |
| **Energy Pattern** | High/medium/low energy times and suitable activities |
| **Time Definitions** | Personal definitions of morning/noon/afternoon/evening/night |
| **Neurotype** | ADHD/AuDHD adaptations, challenges, coping strategies |
| **Values** | Core values and priorities |
| **Tools** | Preferred apps, workflows, integrations |

**Learning System:**
- Observations: Pattern detection from behavior
- Confidence levels: 70%/85%/90% thresholds
- Suggestions: Auto-generated profile updates
- User approval: Required before applying

**Context Awareness:**
- Current time period detection
- Energy level estimation
- Activity-energy matching
- Capacity model (cognitive load tracking)

**Related:**
- Module: `profile`
- Skill: `profile-management`
- Agent: `profile-learner`

---

### 5. Safety & Boundaries

Protective patterns to prevent overwhelm and burnout.

**Anti-Patterns to Avoid:**

| Anti-Pattern | Description | Why It Fails |
|--------------|-------------|--------------|
| Task Accumulator | Only adds tasks, never removes | Increases cognitive load |
| Perfect Planner | Creates elaborate plans before action | Blocks activation; plans become stale |
| Passive Responder | Only acts when explicitly asked | Misses proactive intervention |
| Context Amnesiac | Treats each interaction as isolated | Loses compounding value |
| One-Size-Fits-All | Ignores user's current state | Suggestions misaligned with capacity |

**Neurotype Adaptations:**

| Challenge | Adaptation Strategy |
|-----------|---------------------|
| Task initiation difficulty | Smallest first step; make starting frictionless |
| Working memory limitations | Never require user to remember; externalize |
| Context switching cost | Log interruption points; rich context on resume |
| Overwhelm susceptibility | One thing at a time; hide complexity |
| Time perception challenges | Make time visible; concrete comparisons |
| Emotional sensitivity | Supportive tone, never critical |

**Tone Guidelines:**

**Always:**
- Supportive and encouraging
- Non-judgmental about deferrals
- Concrete and specific
- Focused on "what next"
- Celebrating small wins

**Never:**
- Guilt-inducing
- Overwhelming with options
- Presumptuous about state
- Dismissive of concerns

---

### 6. Integration

Seamless integration with Obsidian PKM and external tools.

**PKM Structure:**

```
[AIDA-PKM]/
├── .aida/
│   ├── data/aida.db           # Database (source of truth)
│   └── context/               # Profile JSON
├── 0-INBOX/                   # Capture bucket
├── 0-JOURNAL/                 # Generated logs
│   ├── 1-DAILY/               # YYYY-MM-DD.md (auto-generated)
│   ├── 2-WEEKLY/              # Review files
│   ├── 3-MONTHLY/
│   ├── 4-YEARLY/
│   └── PLAN.md                # Today's plan (temporary)
├── 0-SHARED/                  # Cross-role resources
└── 01-*, 02-*, etc.           # Role folders
```

**Role System:**
- Maps user roles to PKM folders
- Tracks balance targets (% of time/tasks)
- Monitors actual vs target distribution
- Flags imbalances

**CLI Access:**
```bash
bun run src/aida-cli.ts <module> <function> [args...]
```

All database operations go through the CLI - no direct SQL manipulation.

**Markdown Generation:**
- Daily logs from journal entries
- Plan files from focus + calendar
- Auto-regeneration on updates
- Obsidian-compatible formatting

**Related:**
- Docs: `integration/obsidian.md`, `cli-usage-guide.md`
- Config: `config/aida-paths.json`

---

## Component Tool Contracts

Each AIDA component has explicit tool usage contracts defining what operations are allowed and forbidden. This prevents scope creep and ensures predictable behavior.

### Main Orchestrator (CLAUDE.md)

**Allowed Direct Operations:**
- Simple read queries: `tasks.getTodayTasks`, `roles.getActiveRoles`, `profile.getCurrentEnergyLevel`
- Development tasks: Full access to `src/`, `docs/`, `.claude/` for system changes

**Delegation Rules:**
- Workflow operations → Skills
- Pattern analysis → Subagents
- Complex operations → Appropriate specialist

**Forbidden:**
- Direct writes to database files
- Creating tasks/journal entries without skills
- Profile updates without profile-management skill

### Skills

| Skill | CLI Modules | Can Create | Can Modify | Read Only |
|-------|-------------|------------|------------|-----------|
| **daily-planning** | plan, tasks, roles, journal, profile | Plan, journal entries (checkin/reflection) | Plan file | tasks, roles, profile |
| **task-activation** | tasks, journal, profile | Journal entries (task) | Task status (→active/done) | profile |
| **task-capture** | tasks, roles, projects, journal | Tasks, journal entries | - | roles, projects |
| **status-overview** | tasks, roles, projects, profile | - | - | All (read-only) |
| **profile-management** | profile | Profile, observations | Profile | - |
| **weekly-planning** | tasks, roles, journal, profile | Journal entries (weekly_*) | - | tasks, roles, profile |

**Journal Entry Type Ownership:**
- `checkin`, `reflection` → daily-planning
- `task` → task-capture, task-activation
- `weekly_review`, `weekly_plan` → weekly-planning
- `note` → main orchestrator (freeform)

### Subagents

**profile-learner:**
- **Can read**: journal, tasks, roles
- **Can write**: observations (always), profile updates (confidence ≥ 0.8)
- **Update rules**: High-confidence patterns auto-applied with source="learned"
- **Analysis window**: Last 7-14 days

**code-commenter (built-in):**
- **Can read**: `src/**/*.ts`
- **Can write**: JSDoc comments, section markers
- **Forbidden**: Modify tests, user data, config files

**documentation-retriever (built-in):**
- **Can read**: `docs/`, `src/` (for API signatures)
- **Tools**: Read, Grep, Glob, WebSearch, WebFetch
- **Output only**: No file modifications

**Contract Documentation:**
- Each skill file has `## Tool Contract` section
- Agent definitions include allowed/forbidden operations
- Plan file: `/Users/henrik/.claude/plans/temporal-sleeping-puzzle.md`

---

## Implementation Status

| Capability | Status | Notes |
|------------|--------|-------|
| Session Management | ✅ Operational | Morning/midday/evening flows |
| Task Management | ✅ Operational | Capture, activation, lifecycle |
| Information Management | ✅ Operational | 71 database functions, journal system |
| Energy & Context | ✅ Operational | Profile system, energy matching |
| Safety & Boundaries | ✅ Guidelines | Anti-patterns documented, tone enforced |
| Integration | ✅ Operational | Obsidian sync, CLI access, role mapping |

**Skills Implemented:** 7 (6 user-facing, 1 internal support)
**Commands Available:** 5 (`/checkin`, `/capture`, `/next`, `/overview`, `/weekly`)
**Database Modules:** 7 (tasks, roles, projects, journal, journalMd, plan, profile)

---

## Quick Reference

**Need to...**
- Plan your day → `/checkin`
- Capture a task → `/capture [text]`
- Get unstuck → `/next`
- Check workload → `/overview [role]`
- Weekly planning → `/weekly`
- View profile → Trigger: "visa min profil"

See `docs/INDEX.md` for complete documentation map.
