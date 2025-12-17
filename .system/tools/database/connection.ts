/**
 * Database Connection Manager
 *
 * Manages the singleton SQLite database connection for AIDA.
 * Ensures only one connection instance is active at a time.
 */

import { Database } from 'bun:sqlite';
import { getDatabasePath } from '../utilities/paths';

// =============================================================================
// DATABASE PATH CONFIGURATION
// =============================================================================

const DB_PATH = getDatabasePath();

// =============================================================================
// SINGLETON DATABASE CONNECTION
// =============================================================================

let dbInstance: Database | null = null;

/**
 * Gets the singleton database connection, creating it if necessary.
 *
 * @returns The active database connection instance
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    // create: false prevents accidental DB creation; schema must exist
    dbInstance = new Database(DB_PATH, { create: false, readwrite: true });
  }
  return dbInstance;
}

/**
 * Closes the active database connection and clears the singleton instance.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
