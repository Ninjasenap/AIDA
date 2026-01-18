# AIDA (AI Digital Assistant) — OpenCode Rules

This repository contains **AIDA**, a cognitive augmentation system for ADHD/AuDHD users.

## Core Architecture
- Runtime: **Bun** + TypeScript.
- Source of truth: **SQLite** via the CLI entrypoint `src/aida-cli.ts`.
- PKM data lives outside the repo (vault folders + `.aida/` database). Do not modify PKM files directly.

## Mandatory Data Access Pattern
- **Never** access the SQLite database directly.
- **Never** import or run query modules directly.
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

## Safety Boundaries
- Do not write to generated journal markdown (`0-JOURNAL/1-DAILY/*.md`).
- Do not edit database files under `<pkm>/.aida/data/`.
- If asked to change schema, implement via repo code + migrations (not ad-hoc SQL).

## Repo Docs
- Navigation index: `docs/INDEX.md`
- Query functions: `docs/query-reference.md`
- Workflows: `docs/workflows/*`

## Coding Practices
- Keep changes minimal and focused.
- Prefer fixing root causes over patches.
- Run `bun test` when changes might impact behavior.
