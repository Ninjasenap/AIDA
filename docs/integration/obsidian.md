# Obsidian / PKM Integration

> How AIDA integrates with Obsidian vault and PKM folder structure.

## PKM Location

Configured in `config/aida-paths.json`:

```json
{
  "_meta": { "version": "1.0" },
  "paths": {
    "pkm_root": "/path/to/AIDA-PKM",
    "local_root": "/path/to/AIDA-dev"
  }
}
```

---

## Folder Structure

```
<pkm>/
├── .aida/                      # AIDA system files
│   ├── data/aida.db            # SQLite database
│   └── context/                # Context files
│       └── personal-profile.json
│
├── .obsidian/                  # Obsidian vault config
│
├── 0-INBOX/                    # Capture bucket
│   └── (quick captures)
│
├── 0-JOURNAL/                  # Journals + daily planning
│   ├── 1-DAILY/
│   │   └── YYYY-MM-DD.md       # Daily log files
│   ├── 2-WEEKLY/
│   │   └── YYYY-Www.md         # Weekly reviews
│   ├── 3-MONTHLY/
│   │   └── YYYY-MM.md          # Monthly reviews
│   ├── 4-YEARLY/
│   │   └── YYYY.md             # Yearly reviews
│   └── PLAN.md                 # Current day plan (temporary)
│
├── 0-SHARED/                   # Cross-role resources
│   ├── Templates/
│   └── Checklists/
│
└── [Role folders]              # One per role
    ├── A01-META/
    ├── A02-WORK-ROLE/
    │   ├── 01-NOTES/
    │   ├── 02-RESOURCES/
    │   └── P001-ProjectName/
    └── ...
```

---

## Role Folder Mapping

Each role in `roles` table maps to a folder:

| Role ID | Folder Example |
|---------|----------------|
| 1 | `A01-META/` |
| 2 | `A02-[role-name]/` |
| 3 | `A03-[role-name]/` |

Pattern: `A{id:02d}-{ROLE_NAME}/`

### Within Role Folders

```
A02-WORK-ROLE/
├── 01-NOTES/           # General notes for this role
├── 02-RESOURCES/       # Reference materials
├── P001-ProjectA/      # Project folders (named by project)
├── P002-ProjectB/
└── README.md           # Role overview (optional)
```

---

## File Types and Ownership

| File Type | Created By | Location |
|-----------|------------|----------|
| Daily log | AIDA (generated) | `0-JOURNAL/1-DAILY/YYYY-MM-DD.md` |
| Daily plan | AIDA (temporary) | `0-JOURNAL/PLAN.md` |
| Weekly review | AIDA (prompted) | `0-JOURNAL/2-WEEKLY/` |
| Project notes | User | Role folder `/P00x/` |
| General notes | User | Role folder `/01-NOTES/` |
| Quick captures | User/AIDA | `0-INBOX/` |

---

## Read Patterns

### Journal Context

```typescript
// Get today's journal for morning planning
const journalPath = `${pkm}/0-JOURNAL/1-DAILY/${today}.md`;

// Get yesterday's journal for continuity
const yesterdayPath = `${pkm}/0-JOURNAL/1-DAILY/${yesterday}.md`;

// Get current week's entries
const weekFiles = glob(`${pkm}/0-JOURNAL/1-DAILY/${year}-${week}-*.md`);
```

### Calendar Integration

Calendar is imported to markdown if available:

```
<pkm>/.aida/calendar-today.md
```

Format: Standard markdown with time blocks.

---

## Write Patterns

### Daily Log Generation

Generated from `journal_entries` table:

```
${pkm}/0-JOURNAL/1-DAILY/YYYY-MM-DD.md
```

See `integration/journal-system.md` for format.

### Daily Plan (Temporary)

Created during morning check-in, deleted at evening:

```
${pkm}/0-JOURNAL/PLAN.md
```

Contains:
- Today's scheduled items
- Focus priorities
- Calendar commitments

### Quick Capture to Inbox

Tasks captured without clear role go to:

```
${pkm}/0-INBOX/capture-{timestamp}.md
```

Processed later during daily planning.

---

## Obsidian Compatibility

### Linking

Use standard wiki links:

```markdown
[[A02-WORK/P001-ProjectName/meeting-notes]]
```

### Tags

AIDA uses tags for searchability:

- `#aida/task` - Task reference
- `#aida/captured` - Needs processing
- `#aida/checkin` - Check-in entry

### Frontmatter

Journal entries include frontmatter:

```yaml
---
date: 2025-12-17
type: daily
created_by: aida
---
```

---

## Path Resolution

```typescript
import { getPkmRoot } from 'src/utilities/paths';

const paths = getAidaPaths();
// paths.pkm = "/path/to/AIDA-PKM"
// paths.db = "/path/to/AIDA-PKM/.aida/data/aida.db"
// paths.profile = "/path/to/AIDA-PKM/.aida/context/personal-profile.json"

// Build journal path
const journalPath = `${paths.pkm}/0-JOURNAL/1-DAILY/${date}.md`;
```

---

## Important Rules

1. **Database is source of truth** for tasks, roles, projects, journal entries
2. **Markdown files are generated views** - don't edit generated files
3. **PLAN.md is temporary** - cleared at evening check-in
4. **User-created files are preserved** - AIDA only writes to defined locations
5. **Respect vault structure** - don't create unexpected folders
