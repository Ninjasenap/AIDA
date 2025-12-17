# Code Commenting Style Guide

This guide defines commenting standards for the AIDA project. Two distinct styles are used: one for test files (comprehensive documentation) and one for production code (concise and functional).

---

## Why Two Styles?

- **Test files**: Serve as documentation. Developers read tests to understand expected behavior. Comprehensive comments are valuable.
- **Production code**: Should be self-documenting. Comments explain *why*, not *what*. Keep them concise but visible for AI-assisted code review.

---

## Determining File Type

**TEST FILE** if any of these are true:
- Filename contains `.test.` or `.spec.`
- Filename contains `test` or `spec` in path
- File imports from `bun:test`, `jest`, `vitest`, `mocha`

**PRODUCTION FILE** if none of the above are true.

---

## TEST FILES

Use this comprehensive style for all test-related files.

### File Header

At the very top of the file, BEFORE any imports, add:

```typescript
/**
=============================================================================
  TEST SUITE: [Name based on filename]
=============================================================================

PURPOSE:
[Read the tests and write 1-2 sentences about what is being tested]

FUNCTIONS TESTED:
[List each function being tested with one-line description]

TEST ORGANIZATION:
[Describe how tests are grouped - usually by describe blocks]

COVERAGE GAPS:
[List things NOT tested - concurrent operations, edge cases, errors]
=============================================================================
*/
```

### Describe Block Headers

BEFORE each `describe()` block, add:

```typescript
/**************************************************************************
 * [function/feature name] - [one line purpose]
 *
 * TESTS:
 * [List what scenarios are tested]
 *
 * VALIDATES:
 * [What behavior is being verified]
 *
 * NOT TESTED:
 * [What is missing from this block]
 **************************************************************************/
```

### Individual Test Comments

BEFORE each `test()` or `it()`, add a brief comment:

```typescript
/**
 * [One sentence: what this specific test verifies]
 */
```

---

## PRODUCTION FILES

Use this concise style for all non-test TypeScript/JavaScript files.

### File Header (Optional)

Only add for files with 50+ lines OR non-obvious purpose:

```typescript
/**
 * [Module Name from filename]
 *
 * [1-2 sentences explaining what this module does in an AI friendly way]
 */
```

### JSDoc for Exported Functions

For each `export function` or `export const` that is a function:

```typescript
/**
 * [What the function does in one sentence]
 * 
 * [AI friendly detailed description on how to use the function and what effect is expected]
 *
 * @param paramName - [What this parameter is for]
 * @returns [What is returned]
 */
```

### Section Markers (for files with 100+ lines)

Group related code with:

```typescript
/**
─────────────────────────────────────────────────────────────────────────────
SECTION NAME IN CAPS
─────────────────────────────────────────────────────────────────────────────
*/
```

### Inline Comments (sparingly)

Only add inline comments when:
- Logic is non-obvious (workarounds, edge cases)
- Magic numbers or strings need explanation
- Business rules are encoded in code

```typescript
// AVOID: Increments counter (obvious from code)
counter++;

// GOOD: Offset by 1 because API uses 1-based indexing
const pageNumber = index + 1;

// GOOD: Skip weekends - user preference from profile
if (day === 0 || day === 6) continue;
```

---

## Rules

1. **Never remove existing comments** - only add new ones
2. **Never change code logic** - only add comments
3. **Use Edit tool** - make surgical edits, not full file rewrites
4. **Match existing style** - if file has JSDoc, continue with JSDoc
5. **Be concise** - comments should be scannable, not essays

---

## What NOT to Comment

- Comments on obvious code: `const x = 5; // Set x to 5`
- Empty or placeholder comments
- Comments that repeat the code
- TODOs without actionable context
- Commented-out code (delete it, use git history)
- Changelog in comments (use git commits)

---

## Examples

### Test File Example

```typescript
/**
=============================================================================
  TEST SUITE: Task Database Operations
=============================================================================

PURPOSE:
Tests CRUD operations for tasks in SQLite database, including insertion,
updates, queries, and deletion with proper transaction handling.

FUNCTIONS TESTED:
- insertTask(): Creates new task records with validation
- updateTask(): Modifies existing task fields
- queryTasks(): Retrieves tasks by various filters
- deleteTask(): Removes tasks and cascade relationships

TEST ORGANIZATION:
Organized by function with describe blocks. Each block tests success cases,
edge cases, and error conditions. Uses beforeEach for database reset.

COVERAGE GAPS:
- Concurrent task modifications from multiple sessions
- Transaction rollback on constraint violations
- Performance with 10,000+ task records
=============================================================================
*/

import { test, describe, expect, beforeEach } from 'bun:test';
import { insertTask, updateTask } from './database.ts';

/**************************************************************************
 * insertTask() - Create new task records
 *
 * TESTS:
 * - Task insertion with all required fields
 * - Default values for optional fields
 * - Validation of required field constraints
 *
 * VALIDATES:
 * - Database writes succeed with valid data
 * - Proper error handling for missing required fields
 * - Auto-generated IDs are returned
 *
 * NOT TESTED:
 * - Concurrent insertions from multiple processes
 **************************************************************************/
describe('insertTask()', () => {
  /**
   * Verifies task insertion with all required fields populated
   */
  test('inserts task with required fields', () => {
    const result = insertTask({ title: 'Test', role_id: 1 });
    expect(result.id).toBeGreaterThan(0);
  });
});
```

### Production File Example

```typescript
/**
 * Task Scheduling
 *
 * Matches tasks to available time slots based on user energy patterns
 * and calendar availability.
 */

import type { Task, TimeSlot, EnergyLevel } from './types.ts';

/**
─────────────────────────────────────────────────────────────────────────────
SLOT FINDING
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Finds the next available time slot for a task based on energy level.
 * 
 * This function checks the user's calendar and matches the task's energy level to find an appropriate time slot.
 * It helps in scheduling tasks when the user is most capable of handling them effectively.
 * Expect to receive a time slot (HH:mm - HH:mm) or null if no suitable slot is found.
 *
 * @param task - The task to schedule
 * @param energy - Current energy level: 'high' | 'medium' | 'low'
 * @returns Time slot or null if no suitable slot found
 */
export function findNextSlot(task: Task, energy: EnergyLevel): TimeSlot | null {
  // Add 1 because API uses 1-based page indexing
  const page = index + 1;

  return null;
}
```

---

## Quick Reference

| Aspect | Test Files | Production Files |
|--------|-----------|-----------------|
| **File header** | Required (full template) | Optional (50+ lines) |
| **Function docs** | Per describe block | JSDoc for exports only |
| **Inline comments** | Brief per test | Sparingly, when non-obvious |
| **Section markers** | Not typically used | For 100+ line files |
| **When to add** | Always comprehensive | Only when adds value |
