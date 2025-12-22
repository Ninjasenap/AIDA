/**
 * CLI Integration Tests
 *
 * End-to-end tests for CLI validation integration.
 * Tests that validation errors are properly returned and valid input succeeds.
 */
import { describe, test, expect } from 'bun:test';
import { $ } from 'bun';

describe('CLI Validation Integration', () => {
  describe('Tasks module', () => {
    test('returns structured error for missing required field (title)', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks createTask '{"role_id":1}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation).toBeDefined();
      expect(parsed.validation.module).toBe('tasks');
      expect(parsed.validation.function).toBe('createTask');
      expect(parsed.validation.details.some((d: any) => d.field === 'title')).toBe(true);
    });

    test('returns structured error for invalid status value', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks createTask '{"title":"Test","role_id":1,"status":"invalid"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'status')).toBe(true);
    });

    test('passes validation for correct task input', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks createTask '{"title":"Test Task","role_id":1}'`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
      expect(parsed.title).toBe('Test Task');
    });

    test('returns error for invalid function in module', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks unknownFunction`.nothrow();
      const result = proc.stderr.toString();

      expect(result).toContain('Unknown: tasks.unknownFunction');
    });
  });

  describe('Journal module', () => {
    test('returns structured error for missing entry_type', async () => {
      const proc = await $`bun run src/aida-cli.ts journal createEntry '{"content":"Test"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'entry_type')).toBe(true);
    });

    test('returns structured error for invalid entry_type', async () => {
      const proc = await $`bun run src/aida-cli.ts journal createEntry '{"entry_type":"invalid","content":"Test"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'entry_type')).toBe(true);
    });

    test('passes validation for correct journal entry', async () => {
      const proc = await $`bun run src/aida-cli.ts journal createEntry '{"entry_type":"note","content":"Test note"}'`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
      expect(parsed.entry_type).toBe('note');
    });
  });

  describe('Projects module', () => {
    test('returns structured error for missing description', async () => {
      const proc = await $`bun run src/aida-cli.ts projects createProject '{"name":"Test","role_id":1}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'description')).toBe(true);
    });

    test('passes validation for correct project input', async () => {
      const proc = await $`bun run src/aida-cli.ts projects createProject '{"name":"Test Project","role_id":1,"description":"Test description"}'`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
      expect(parsed.name).toBe('Test Project');
    });
  });

  describe('Plan module', () => {
    test('returns structured error for invalid date format', async () => {
      const proc = await $`bun run src/aida-cli.ts plan createDailyPlan '{"date":"18-12-2025"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'date')).toBe(true);
    });

    test('returns structured error for invalid event time format', async () => {
      const proc = await $`bun run src/aida-cli.ts plan createDailyPlan '{"date":"2025-12-18","events":[{"time":"9:00","title":"Meeting"}]}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.message).toContain('Validation failed');
    });

    test('passes validation for correct plan input', async () => {
      const proc = await $`bun run src/aida-cli.ts plan createDailyPlan '{"date":"2025-12-18","events":[{"time":"09:00","title":"Meeting"}],"focus":["Task 1"]}'`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
      expect(typeof parsed).toBe('string');
    });
  });

  describe('Profile module', () => {
    test('returns structured error for missing source', async () => {
      const proc = await $`bun run src/aida-cli.ts profile updateAttribute '{"path":"identity.name","value":"Test"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'source')).toBe(true);
    });

    test('returns structured error for invalid confidence range', async () => {
      const proc = await $`bun run src/aida-cli.ts profile addObservation '{"category":"energy","pattern":"Test","confidence":1.5,"status":"active"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'confidence')).toBe(true);
    });
  });

  describe('No-arg functions', () => {
    test('passes validation for no-arg tasks.getTodayTasks', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks getTodayTasks`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
      expect(typeof parsed).toBe('object');
    });

    test('passes validation for no-arg profile.getCurrentEnergyLevel', async () => {
      const proc = await $`bun run src/aida-cli.ts profile getCurrentEnergyLevel`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });
  });

  describe('Positional-id functions', () => {
    test('returns structured error for invalid ID (non-positive)', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks getTaskById 0`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation).toBeDefined();
    });

    test('passes validation for valid positive ID', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks getTaskById 1`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      // May be null if task doesn't exist, but should not have validation error
      // If null, that's fine - it means no task with ID 1 exists
      if (parsed !== null) {
        expect(parsed.error).toBeUndefined();
      }
    });
  });

  describe('Error messages', () => {
    test('includes helpful suggestion in error message', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks setTaskStatus '{"status":"done"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.validation.suggestion).toBeDefined();
      expect(parsed.validation.suggestion).toContain('id');
    });

    test('lists all validation errors', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks createTask '{}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.validation.details.length).toBeGreaterThan(0);
      const fields = parsed.validation.details.map((d: any) => d.field);
      expect(fields).toContain('title');
      expect(fields).toContain('role_id');
    });
  });
});
