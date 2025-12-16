---
description: View workload overview for a role or all roles
---

Invoke the **status-overview skill** to show workload status.

## Input

**Arguments:** $ARGUMENTS (optional role name)

## Modes

### General Overview (no arguments)

Show summary across ALL roles:
- Task counts per role
- Role balance vs targets
- Attention items (overdue, stale)

```bash
# Get all roles
bun run .system/tools/aida-cli.ts roles getActiveRoles

# For each role
bun run .system/tools/aida-cli.ts tasks getTasksByRole [id]

# Get attention items
bun run .system/tools/aida-cli.ts tasks getOverdueTasks
bun run .system/tools/aida-cli.ts tasks getStaleTasks
```

### Role-Specific (with argument)

Show detailed status for ONE role:
- Tasks grouped by status
- Projects in this role
- Role-specific attention items

```bash
# Get role tasks
bun run .system/tools/aida-cli.ts tasks getTasksByRole [id]

# Get role projects
bun run .system/tools/aida-cli.ts projects getProjectsByRole [id]
```

## CRITICAL

**All database operations via `aida-cli.ts`:**
```bash
bun run .system/tools/aida-cli.ts <module> <function> [args...]
```

**NEVER use query modules directly!**

## Example Usage

### `/status`
```
📊 Din arbetsbelastning

🔹 Systemutvecklare: 12 tasks (43%)
🔹 Förälder: 5 tasks (18%)
🔹 Hobbyutvecklare: 8 tasks (29%)
🔹 Ordförande: 3 tasks (10%)

⚠️ Uppmärksamhetspunkter:
• 2 försenade tasks
• 1 stale task

💡 Förälder under mål (18% vs 25%)

Detaljer? /status [roll]
```

### `/status Förälder`
```
📊 Förälder - Status

📋 Uppgifter (5):
• Captured: 2
• Ready: 2
• Planned: 1
• Active: 0

✅ Inga försenade tasks!

📅 Kommande:
• "Boka tandläkartid" - Deadline imorgon

Vill du aktivera något? /next
```

## Response in Swedish

- Use emojis for visual clarity 📊📋✅⚠️
- Highlight actionable insights
- Offer drill-down options
