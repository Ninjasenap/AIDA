---
description: Quick task capture - captures a task with minimal friction
---

Invoke the **task-capture skill** to capture a new task.

## Input

**Arguments:** $ARGUMENTS

## Instructions

1. If `$ARGUMENTS` is provided:
   - Parse the text using PARSING-RULES.md
   - Infer role using ROLE-INFERENCE.md
   - Create task quickly (see QUICK-CAPTURE.md)

2. If NO arguments provided:
   - Ask: "Vad vill du fånga?" and wait for response

3. **CRITICAL:** All database operations via `aida-cli.ts`:
   ```bash
   bun run .system/tools/aida-cli.ts tasks createTask '{"title":"...","role_id":...}'
   bun run .system/tools/aida-cli.ts journal createEntry '{"entry_type":"task","content":"..."}'
   ```

4. Respond in Swedish with quick confirmation.

## Example Usage

```
/capture Ringa tandläkaren imorgon
```

Expected output:
```
✅ Fångat: "Ringa tandläkaren"
   📅 Deadline: 2025-12-16
   🎭 Roll: Förälder

Något mer?
```

## Speed Priority

- Capture first, refine later
- Only ask about role if truly ambiguous
- Maximum 1 question before saving
- Confirm with emojis ✅📅🎭
