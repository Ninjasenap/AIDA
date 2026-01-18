# AIDA — OpenCode Rules

This repository contains **AIDA**, a cognitive augmentation system for ADHD/AuDHD users.

AIDA runs in **single mode**:
- **System** (repo): code, templates, docs, OpenCode skills/agents/commands
- **PKM** (external): vault folders + `<pkm>/.aida/` runtime data

## Core Architecture
- Runtime: **Bun** + TypeScript
- Source of truth: **SQLite** in `<pkm>/.aida/data/aida.db`
- Interface: **OpenCode** (terminal UI / CLI)

## Path Configuration
- Config file: `config/aida-paths.json`
- `paths.pkm_root`: absolute/expanded path to your PKM vault
- `paths.local_root`: absolute/expanded path to your local repo checkout

## Mandatory Data Access Pattern
- **Never** access SQLite directly.
- **Never** import/run query modules directly.
- **Always** use:
  - `bun run src/aida-cli.ts <module> <function> [args...]`

## Routing / Interaction Conventions
- User-facing language is **Swedish** by default.
- Prefer AIDA workflows:
  - `/checkin` → daily planning
  - `/capture` → task capture
  - `/next` → activation support
  - `/overview` → status overview
  - `/weekly` → weekly planning

OpenCode wiring lives in:
- Commands: `.opencode/command/*`
- Skills: `.opencode/skill/*`
- Agents: `.opencode/agent/*`

## Safety Boundaries
- Do not write to generated journal markdown (`0-JOURNAL/1-DAILY/*.md`).
- Do not edit database files under `<pkm>/.aida/data/`.
- If asked to change schema, implement via repo code + schema updates (not ad-hoc SQL).

## Repo Docs
- Navigation index: `docs/INDEX.md`
- Query functions: `docs/query-reference.md`
- Workflows: `docs/workflows/*`

## Coding Practices
- Keep changes minimal and focused.
- Prefer fixing root causes over patches.
- Run `bun test` when changes might impact behavior.
