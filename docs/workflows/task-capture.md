# Task Capture Workflow

> Quick capture with `/capture` command and natural language processing.

## Design Principle

**Minimal friction** - capture first, organize later. The goal is to get information out of the user's head as fast as possible.

---

## Quick Capture Workflow

```
User: /capture [text] OR natural language
    |
    v
+------------------+
| Parse Input      |
| - Task or note?  |
| - Deadline?      |
| - Role context?  |
+------------------+
    |
    v
+------------------+
| Classify         |
| - Action-oriented|
|   = task         |
| - Information    |
|   = note/idea    |
+------------------+
    |
    v
+------------------+
| Extract          |
| - Title          |
| - Role (infer)   |
| - Deadline       |
| - Priority cues  |
+------------------+
    |
    v
+------------------+
| Generate         |
| Next Step        |
+------------------+
    |
    v
+------------------+
| Insert Task      |
| createTask()     |
+------------------+
    |
    v
+------------------+
| Create Journal   |
| Entry (task)     |
+------------------+
    |
    v
Confirm to user
```

---

## Input Classification

| Type | Indicators | Storage |
|------|------------|---------|
| Task | Action verb, "need to", "should", "must" | `tasks` table |
| Note | Information, thought, observation | `journal_entries` (type: note) |
| Idea | "idea", "maybe", "what if" | `journal_entries` (type: idea) |
| Reminder | Time-specific, "remind me" | `tasks` with `remind_date` |

---

## Role Inference

When role is not explicitly mentioned:

1. Check for organization keywords
2. Check for role-specific vocabulary
3. Look at recent context (last few tasks)
4. **If unclear: ask briefly** - "Vilken roll tillhör detta?"

```typescript
// Role inference heuristics
const roleKeywords = {
  2: ['arbete', 'jobb', 'projekt', 'kund'],
  9: ['familj', 'hem', 'barn'],
  // ... etc
};
```

---

## Next-Step Generation

Every task gets a concrete, small next step automatically:

| Task Type | Example Next Step |
|-----------|-------------------|
| Document | "Öppna dokumentet och skriv titeln" |
| Call | "Hitta telefonnumret till [person]" |
| Research | "Googla '[topic]' och läs första resultatet" |
| Meeting prep | "Öppna mötesagendan och läs igenom" |
| Email | "Öppna nytt mail och skriv ämnesraden" |

The next step should be:
- **5 minutes or less**
- **Concrete** - not vague
- **No decisions required**

---

## Output Format

### For Tasks

```
Fångat: [Task title]
Roll: [Role name]
Nästa steg: [Generated next step]

Vill du lägga till mer info?
```

### For Notes/Ideas

```
Noterat: [Brief summary]
```

---

## Examples

### Example 1: Clear task

**Input:** `/capture ringa banken om lånet`

**Output:**
```
Fångat: Ringa banken om lånet
Roll: A09 - Privat (inferred)
Nästa steg: Hitta bankens telefonnummer

Vill du lägga till mer info?
```

### Example 2: Task with deadline

**Input:** `/capture skicka rapporten senast fredag`

**Output:**
```
Fångat: Skicka rapporten
Deadline: Fredag
Roll: [ask if unclear]
Nästa steg: Öppna rapporten och läs igenom sammanfattningen

Vill du lägga till mer info?
```

### Example 3: Idea

**Input:** `/capture idé om ny feature för projektet`

**Output:**
```
Noterat: Idé - ny feature för projektet

Vill du utveckla den?
```

---

## Processing Pipeline

```typescript
async function processCapture(input: string) {
  // 1. Parse
  const parsed = parseCapture(input);

  // 2. Classify
  const type = classifyInput(parsed);

  if (type === 'task') {
    // 3. Extract task details
    const taskData = extractTaskData(parsed);

    // 4. Infer role if needed
    if (!taskData.role_id) {
      taskData.role_id = await inferRole(parsed) || await askRole();
    }

    // 5. Generate next step
    taskData.next_step = generateNextStep(taskData.title);

    // 6. Create task
    const task = createTask(taskData);

    // 7. Log to journal
    createEntry({
      entry_type: 'task',
      content: `Captured: ${task.title}`,
      related_task_id: task.id,
      related_role_id: task.role_id
    });

    return formatTaskConfirmation(task);
  } else {
    // Handle note/idea
    createEntry({
      entry_type: type,
      content: parsed.content
    });

    return formatNoteConfirmation(parsed);
  }
}
```

---

## Important Rules

1. **Never ask more than one question** during capture
2. **Always generate a next step** for tasks
3. **Role can be assigned later** - don't block capture
4. **Confirm immediately** - then offer to add more
5. **Keep confirmations short** - user is busy
