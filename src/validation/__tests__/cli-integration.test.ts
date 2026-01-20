/**
 * CLI Integration Tests
 *
 * End-to-end tests for CLI validation integration.
 *
 * Note: Tasks are Todoist-backed; these tests only exercise validation for `tasks/*`
 * to avoid network dependencies during `bun test`.
 */
import { beforeAll, describe, test, expect } from 'bun:test';
import { $ } from 'bun';
let roleId = 1;

beforeAll(async () => {
  // Ensure local DB exists and has at least one role.
  const reset = await $`bun run src/database/manage-db.ts reset`.nothrow();
  if (reset.exitCode !== 0) {
    throw new Error(reset.stderr.toString());
  }

  const proc = await $`bun run src/aida-cli.ts roles createRole '{"name":"Test role","type":"work","description":"Test"}'`.nothrow();
  if (proc.exitCode !== 0) {
    throw new Error(proc.stderr.toString());
  }

  roleId = JSON.parse(proc.stdout.toString()).id;
});

describe('CLI Validation Integration', () => {
  describe('Tasks module (Todoist)', () => {
    test('returns structured error for missing required field (content)', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks createTask '{}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation).toBeDefined();
      expect(parsed.validation.module).toBe('tasks');
      expect(parsed.validation.function).toBe('createTask');
      expect(parsed.validation.details.some((d: any) => d.field === 'content')).toBe(true);
    });

    test('returns structured error for invalid priority value', async () => {
      const proc = await $`bun run src/aida-cli.ts tasks createTask '{"content":"Test","priority":5}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'priority')).toBe(true);
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
      const proc = await $`bun run src/aida-cli.ts projects createProject '{"name":"Test","role_id":${roleId}}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation.details.some((d: any) => d.field === 'description')).toBe(true);
    });

    test('passes validation for correct project input', async () => {
      const proc = await $`bun run src/aida-cli.ts projects createProject '{"name":"Test Project","role_id":${roleId},"description":"Test description"}'`.nothrow();
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
    test('passes validation for roles.getActiveRoles', async () => {
      const proc = await $`bun run src/aida-cli.ts roles getActiveRoles`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('Positional-id functions', () => {
    test('returns structured error for invalid ID (non-positive)', async () => {
      const proc = await $`bun run src/aida-cli.ts roles getRoleById 0`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.validation).toBeDefined();
    });

    test('passes validation for valid positive ID', async () => {
      const proc = await $`bun run src/aida-cli.ts roles getRoleById ${roleId}`.nothrow();
      const result = proc.stdout.toString();

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeUndefined();
    });
  });

  describe('Error messages', () => {
    test('includes helpful suggestion in error message', async () => {
      const proc = await $`bun run src/aida-cli.ts roles setRoleStatus '{"status":"inactive"}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.validation.suggestion).toBeDefined();
      expect(parsed.validation.suggestion).toContain('id');
    });

    test('lists all validation errors', async () => {
      const proc = await $`bun run src/aida-cli.ts projects createProject '{}'`.nothrow();
      const result = proc.stderr.toString();

      const parsed = JSON.parse(result);
      expect(parsed.validation.details.length).toBeGreaterThan(0);
      const fields = parsed.validation.details.map((d: any) => d.field);
      expect(fields).toContain('name');
      expect(fields).toContain('role_id');
      expect(fields).toContain('description');
    });
  });
});
