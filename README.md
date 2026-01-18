# AIDA - AI Digital Assistant

> **Status:** Implementation Phase - Database layer complete, skills operational

AIDA is a cognitive augmentation system designed to function as an external working memory and executive support system for users with ADHD/AuDHD neurotypes.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) runtime (v1.0+)

**Install Bun:**
```bash
# Mac/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AIDA

# Run the install script for your platform
./install.sh              # Mac/Linux
.\install.ps1             # Windows (PowerShell)
```

The install script will:
1. ✓ Check for Bun installation
2. ✓ Install dependencies
3. ✓ Create folder structure (0-INBOX, 0-JOURNAL, 0-SHARED RESOURCES)
4. ✓ Initialize SQLite database

## Usage

Once installed, use these commands:

| Command | Purpose |
|---------|---------|
| `/checkin` | Daily check-in (auto-detects morning/midday/evening) |
| `/next` | Get next recommended action |
| `/capture [text]` | Quick task capture |
| `/overview [role]` | Workload overview |

## Architecture

- **Runtime:** Bun with native SQLite support
- **Database:** SQLite with WAL mode
- **Interface:** OpenCode (terminal UI / CLI)
- **Documents:** Markdown (Obsidian-compatible)

## Documentation

- **`AGENTS.md`** - Main system rules (OpenCode)
- **`docs/`** - Design specifications
  - `solution-architecture.md` - Integration patterns, data flows
  - `system-architecture.md` - Database schema, TypeScript interfaces
  - `agent-architecture.md` - Agent hierarchy, skills, commands

## Development

All database operations use the CLI tool:
```bash
# Query the database
bun run src/aida-cli.ts tasks getTodayTasks
bun run src/aida-cli.ts journal getTodayEntries

# Database management
bun run src/database/manage-db.ts init    # Initialize
bun run src/database/manage-db.ts reset   # Reset
```

## Design Principles

1. **Activation over perfection** - Help START, not just plan
2. **One thing at a time** - Never overwhelm with options
3. **Energy-aware** - Match tasks to current capacity
4. **Non-judgmental** - Support without guilt

---

For detailed documentation, see `docs/`
