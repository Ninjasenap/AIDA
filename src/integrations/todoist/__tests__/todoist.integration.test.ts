/**
 * Todoist Integration Tests (explicit run only)
 *
 * Run with:
 *   RUN_TODOIST_INTEGRATION=1 \
 *   bun test ./src/integrations/todoist/__tests__/todoist.integration.test.ts
 *
 * Token resolution:
 * - Uses `TODOIST_API_TOKEN` if set.
 * - Otherwise uses `<pkm_root>/.aida/context/todoist-config.json` (apiToken).
 *
 * Test data policy:
 * - All tasks must have label `aida-test-data`
 * - All projects must have suffix `[aida-test-data]`
 * - Cleanup via clearTestData() removes only marked data
 */

import { beforeAll, afterAll, describe, expect, test, setSystemTime } from 'bun:test';
import { $ } from 'bun';
import { getPkmRoot } from '../../../utilities/paths';
import { closeDatabase } from '../../../database/connection';
import { createRole } from '../../../database/queries/roles';
import { createProject } from '../../../database/queries/projects';
import { getEntriesByTodoistTask } from '../../../database/queries/journal';
import { ensureProject, getProjects } from '../projects';
import { ensureLabel, getLabels, syncRolesToLabels } from '../labels';
import { isConfigured, getConfigPath } from '../config';
import {
  clearTestData,
  ensureTestLabel,
  formatTestProjectName,
  TEST_DATA_LABEL_NAME,
  TEST_PROJECT_SUFFIX,
} from '../test-data';
import * as tasks from '../tasks';
import { sync } from '../sync';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const RUN_TODOIST_INTEGRATION = process.env.RUN_TODOIST_INTEGRATION === '1';
const PKM_ROOT = getPkmRoot();

// Timeout for individual tests (API calls can be slow)
const TEST_TIMEOUT_MS = 30_000;

if (RUN_TODOIST_INTEGRATION && !PKM_ROOT.includes('PKM-TEST')) {
  throw new Error(
    `Refusing to run Todoist integration tests without a test vault. pkm_root=${PKM_ROOT}`
  );
}

if (RUN_TODOIST_INTEGRATION && !isConfigured()) {
  throw new Error(
    `Todoist API token not configured. Set TODOIST_API_TOKEN or update ${getConfigPath()}.`
  );
}

const describeIntegration = RUN_TODOIST_INTEGRATION ? describe : describe.skip;

// ============================================================================
// TEST STATE
// ============================================================================

let roleId = 0;
let projectId = 0;
let todoistProjectId = '';

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeAll(async () => {
  if (!RUN_TODOIST_INTEGRATION) {
    return;
  }

  // Close existing connection before reset
  closeDatabase();

  // Reset database to clean state
  const reset = await $`bun run src/database/manage-db.ts reset`.nothrow().quiet();
  if (reset.exitCode !== 0) {
    throw new Error(`Database reset failed: ${reset.stderr.toString()}`);
  }

  // Wait for filesystem/WAL files to settle
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Setup Todoist test infrastructure
  await ensureTestLabel();
  await clearTestData();

  // Create local role with test label
  const role = createRole({
    name: 'Todoist integration',
    type: 'work',
    description: 'Integration test role for Todoist',
    responsibilities: ['Integrationstest'],
    todoist_label_name: TEST_DATA_LABEL_NAME,
  });
  roleId = role.id;

  // Create Todoist project for tests
  const todoistProject = await ensureProject(formatTestProjectName('Todoist integration'));
  todoistProjectId = todoistProject.id;

  // Create local project linked to Todoist
  const localProject = createProject({
    name: 'Todoist integration',
    role_id: roleId,
    description: 'Local project for Todoist integration test',
    todoist_project_id: todoistProject.id,
  });
  projectId = localProject.id;
}, TEST_TIMEOUT_MS * 2);

afterAll(async () => {
  if (!RUN_TODOIST_INTEGRATION) {
    return;
  }

  await clearTestData();
  closeDatabase();
}, TEST_TIMEOUT_MS);

// ============================================================================
// TASK TESTS
// ============================================================================

describeIntegration('Todoist Tasks', () => {
  test(
    'createTask - creates task with role and project labels',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Create task test',
        role_id: roleId,
        project_id: projectId,
        due_string: 'today',
        priority: 4,
      });

      expect(created.id).toBeTruthy();
      expect(created.content).toBe('[aida-test-data] Create task test');
      expect(created.labels).toContain(TEST_DATA_LABEL_NAME);
      expect(created.priority).toBe(4);
      expect(created.aida_role_id).toBe(roleId);
      expect(created.aida_project_id).toBe(projectId);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'createTask - creates task with energy label',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Energy task test',
        role_id: roleId,
        energy: 'high',
        due_string: 'today',
      });

      expect(created.labels).toContain('energy-high');
      expect(created.energy_requirement).toBe('high');

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'getTaskById - fetches task with AIDA mappings',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Get task test',
        role_id: roleId,
        project_id: projectId,
      });

      const fetched = await tasks.getTaskById(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toBe('[aida-test-data] Get task test');
      expect(fetched.aida_role_id).toBe(roleId);
      expect(fetched.aida_project_id).toBe(projectId);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'updateTask - updates task content and labels',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Update task test',
        role_id: roleId,
        priority: 2,
      });

      await tasks.updateTask({
        taskId: created.id,
        content: '[aida-test-data] Update task test (updated)',
        priority: 4,
      });

      const updated = await tasks.getTaskById(created.id);
      expect(updated.content).toBe('[aida-test-data] Update task test (updated)');
      expect(updated.priority).toBe(4);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'tagTask - adds label to existing task',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Tag task test',
        role_id: roleId,
      });

      const tagged = await tasks.tagTask({
        taskId: created.id,
        label: 'energy-low',
      });

      expect(tagged.labels).toContain('energy-low');
      expect(tagged.labels).toContain(TEST_DATA_LABEL_NAME);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'completeTask - marks task as done and creates journal entry',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Complete task test',
        role_id: roleId,
        project_id: projectId,
        due_string: 'today',
      });

      await tasks.completeTask(created.id);

      // Verify journal entry was created
      const entries = getEntriesByTodoistTask(created.id);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].todoist_task_id).toBe(created.id);
      expect(entries[0].content).toContain('Slutfört:');
    },
    TEST_TIMEOUT_MS
  );

  test(
    'deleteTask - removes task from Todoist',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Delete task test',
        role_id: roleId,
      });

      await tasks.deleteTask(created.id);

      // Verify task is no longer in active tasks list
      // Note: Todoist API may have eventual consistency, so we check the list
      // rather than expecting getTaskById to throw immediately
      const activeTasks = await tasks.getTasks({ role_id: roleId });
      expect(activeTasks.some((t) => t.id === created.id)).toBe(false);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'getTasks - filters by project',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Filter by project test',
        role_id: roleId,
        project_id: projectId,
      });

      const byProject = await tasks.getTasks({ project_id: projectId });
      expect(byProject.some((t) => t.id === created.id)).toBe(true);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'getTasksByRole - filters by role label',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Filter by role test',
        role_id: roleId,
      });

      const byRole = await tasks.getTasksByRole({ role_id: roleId });
      expect(byRole.some((t) => t.id === created.id)).toBe(true);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'getTasksByEnergy - filters by energy label',
    async () => {
      const created = await tasks.createTask({
        content: '[aida-test-data] Filter by energy test',
        role_id: roleId,
        energy: 'medium',
      });

      const byEnergy = await tasks.getTasksByEnergy({ energy: 'medium' });
      expect(byEnergy.some((t) => t.id === created.id)).toBe(true);

      // Cleanup
      await tasks.deleteTask(created.id);
    },
    TEST_TIMEOUT_MS
  );
});

// ============================================================================
// LABEL TESTS
// ============================================================================

describeIntegration('Todoist Labels', () => {
  test(
    'getLabels - returns all labels',
    async () => {
      const labels = await getLabels();

      expect(Array.isArray(labels)).toBe(true);
      expect(labels.some((l) => l.name === TEST_DATA_LABEL_NAME)).toBe(true);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'ensureLabel - creates label if not exists',
    async () => {
      // Use a unique test label name
      const testLabelName = `aida-test-temp-${Date.now()}`;

      const label = await ensureLabel(testLabelName);
      expect(label.name).toBe(testLabelName);

      // Verify it exists
      const labels = await getLabels();
      expect(labels.some((l) => l.name === testLabelName)).toBe(true);

      // Note: We don't delete labels as Todoist doesn't have a delete label API in REST v2
      // The label will remain but is harmless
    },
    TEST_TIMEOUT_MS
  );

  test(
    'ensureLabel - returns existing label',
    async () => {
      const first = await ensureLabel(TEST_DATA_LABEL_NAME);
      const second = await ensureLabel(TEST_DATA_LABEL_NAME);

      expect(first.id).toBe(second.id);
    },
    TEST_TIMEOUT_MS
  );
});

// ============================================================================
// PROJECT TESTS
// ============================================================================

describeIntegration('Todoist Projects', () => {
  test(
    'getProjects - returns all projects',
    async () => {
      const projects = await getProjects();

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      // Should have at least inbox project
      expect(projects.some((p) => p.is_inbox_project)).toBe(true);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'ensureProject - creates test project with correct suffix',
    async () => {
      const projectName = formatTestProjectName('Test project creation');
      const project = await ensureProject(projectName);

      expect(project.name).toBe(projectName);
      expect(project.name).toContain(TEST_PROJECT_SUFFIX);
      expect(project.id).toBeTruthy();

      // Project will be cleaned up by afterAll via clearTestData()
    },
    TEST_TIMEOUT_MS
  );

  test(
    'ensureProject - returns existing project',
    async () => {
      const projectName = formatTestProjectName('Todoist integration');

      const first = await ensureProject(projectName);
      const second = await ensureProject(projectName);

      expect(first.id).toBe(second.id);
    },
    TEST_TIMEOUT_MS
  );
});

// ============================================================================
// SYNC TESTS
// ============================================================================

describeIntegration('Todoist Sync', () => {
  test(
    'sync - syncs completed tasks to journal',
    async () => {
      // Create and complete a task
      const created = await tasks.createTask({
        content: '[aida-test-data] Sync test task',
        role_id: roleId,
        project_id: projectId,
      });

      await tasks.completeTask(created.id);

      // Run sync - may fail due to temporary Todoist API issues
      // so we wrap in try/catch and skip on 5xx errors
      try {
        const result = await sync({ quiet: true });

        expect(result.timestamp).toBeTruthy();
        expect(typeof result.completed_synced).toBe('number');
        expect(typeof result.journal_entries_created).toBe('number');
      } catch (error) {
        // Skip test on Todoist server errors (5xx)
        if (error instanceof Error && error.message.includes('500')) {
          console.warn('Skipping sync test due to Todoist API 500 error');
          return;
        }
        throw error;
      }
    },
    TEST_TIMEOUT_MS
  );
});

// ============================================================================
// CLEANUP TESTS
// ============================================================================

describeIntegration('Test Data Cleanup', () => {
  test(
    'clearTestData - removes only test-marked data',
    async () => {
      // Create test task
      const testTask = await tasks.createTask({
        content: '[aida-test-data] Cleanup test',
        role_id: roleId,
      });

      // Verify it exists
      const before = await tasks.getTasks({ role_id: roleId });
      expect(before.some((t) => t.id === testTask.id)).toBe(true);

      // Clear test data
      const result = await clearTestData({ deleteTasks: true, deleteProjects: false });

      expect(result.errors.length).toBe(0);
      expect(result.deletedActiveTasks).toBeGreaterThan(0);

      // Verify task is gone
      const after = await tasks.getTasks({ role_id: roleId });
      expect(after.some((t) => t.id === testTask.id)).toBe(false);
    },
    TEST_TIMEOUT_MS
  );
});
