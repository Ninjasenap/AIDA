/**
 * Test Setup & Lifecycle Configuration
 *
 * Manages database initialization and cleanup for the test suite.
 * Handles database reset, demo data seeding, and connection teardown.
 *
 * This module provides global lifecycle hooks that run before and after all tests,
 * ensuring the database is in a consistent state. Uses a singleton pattern to prevent
 * multiple initialization attempts when multiple test files import this module.
 */

import { beforeAll, afterAll } from 'bun:test';
import { getDatabase, closeDatabase } from '../connection';
import { execSync } from 'child_process';
import { getLocalRoot } from '../../utilities/paths';

// =============================================================================
// TEST LIFECYCLE HOOKS
// =============================================================================

const PROJECT_ROOT = getLocalRoot();

// Flag to ensure setup runs only once across all test files
let isSetupComplete = false;

/**
 * Initialize test database with schema and demo data.
 *
 * Runs before all tests: resets database to clean state and seeds realistic demo data.
 * Uses singleton pattern to ensure it only runs once even when multiple test files import this.
 *
 * Process:
 * 1. Close any existing database connections
 * 2. Execute database reset script (manage-db.ts reset)
 * 3. Wait for filesystem sync
 * 4. Seed demo data for testing
 *
 * The isSetupComplete flag prevents re-initialization on repeated imports.
 */
beforeAll(async () => {
  if (isSetupComplete) {
    return;
  }

  // Close any existing database connection
  closeDatabase();

  // Reset database and seed with demo data
  execSync('bun run src/database/manage-db.ts reset', {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  // Wait a bit for the file system to sync
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Import demo data and seed
  const { seedDemoData } = await import('./demo-data');
  const db = getDatabase();
  seedDemoData(db);

  isSetupComplete = true;
});

/**
 * Close database connection after all tests complete.
 *
 * Ensures clean shutdown and prevents hanging connections.
 * Allows the test process to exit cleanly without waiting for open handles.
 */
afterAll(() => {
  closeDatabase();
});
