name: task-complete
description: Mark a task complete in Todoist and log the completion. Use when user says they finished a task.
allowed-tools: Bash, Read
---

# Skill: task-complete

## Purpose

Marks a Todoist task as completed and logs it to the AIDA journal with the Todoist task ID. Ensures AIDA and Todoist stay in sync.

## Trigger Conditions

- **Natural phrases:** ["jag är klar", "markera som klar", "done", "completed", "slutfört", "färdig", "checka av"]
- **Auto-trigger:** When user indicates a task is completed

## Required Context

1. Task ID or exact task title (from user input)
2. If title is ambiguous, fetch tasks via `tasks getTasks` and ask for clarification

## Workflow Steps

### Step 1: Identify Task

- **Action:** Determine the Todoist task ID
- **If ID provided:** use directly
- **If title provided:** search via `tasks getTasks '{"due":"today"}'` and match title, otherwise ask user

### Step 2: Complete Task

- **Action:** Complete task via `tasks completeTask [task_id]`
- **CLI call:**
  ```bash
  bun run src/aida-cli.ts tasks completeTask "[task_id]"
  ```

### Step 3: Confirm

- **Output to user:**
  ```
  ✅ Klarmarkerat: "[task title]"
  ```

## Error Handling

- **If task not found:** Ask user to clarify title or provide ID
- **If completion fails:** Show error and suggest manual completion in Todoist

## Tool Contract

**Allowed CLI Operations:**
- **tasks:** completeTask, getTaskById, getTasks (READ ONLY)

**Forbidden Operations:**
- Creating or deleting tasks
- Updating task content
- Any profile or plan operations

## Notes

Completion logging is handled inside `tasks completeTask` via journal entry creation.
