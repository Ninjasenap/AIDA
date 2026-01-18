#!/usr/bin/env bun

/**
═════════════════════════════════════════════════════════════════════════════
  AIDA DATABASE MANAGEMENT TOOL
═════════════════════════════════════════════════════════════════════════════

PURPOSE:
Provides command-line utilities for initializing, deleting, and resetting the
AIDA SQLite database. Handles schema application, WAL file management, and
verification of database initialization.

FEATURES:
- Database initialization with schema application
- Safe deletion of database and WAL/SHM files
- Database reset (delete + reinitialize) workflow
- Schema verification and table/view enumeration
- PRAGMA settings inspection

USAGE:
  bun run src/database/manage-db.ts init    # Initialize/recreate
  bun run src/database/manage-db.ts delete  # Delete database files
  bun run src/database/manage-db.ts reset   # Delete and reinitialize

DEPENDENCIES:
- bun:sqlite (Database class)
- fs (file operations)
- path (path utilities)

═════════════════════════════════════════════════════════════════════════════
*/

import { Database } from 'bun:sqlite';
import { existsSync, unlinkSync } from 'fs';
import { getDatabasePath, getSchemaPath, getLocalRoot } from '../utilities/paths';

/**
─────────────────────────────────────────────────────────────────────────────
CONFIGURATION CONSTANTS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Local root directory (Git repository root)
 * @type {string}
 */
const LOCAL_ROOT = getLocalRoot();

/**
 * Path to the main AIDA SQLite database file
 * @type {string}
 */
const DB_PATH = getDatabasePath();

/**
 * Path to the database schema SQL file
 * Contains all table, view, index, and trigger definitions
 * @type {string}
 */
const SCHEMA_PATH = getSchemaPath();

/**
 * Path to the Write-Ahead Logging (WAL) file
 * Created by SQLite when journal_mode is set to WAL
 * Must be deleted along with the main database file
 * @type {string}
 */
const DB_WAL_PATH = `${DB_PATH}-wal`;

/**
 * Path to the shared memory (SHM) file
 * Created by SQLite when journal_mode is set to WAL
 * Must be deleted along with the main database file
 * @type {string}
 */
const DB_SHM_PATH = `${DB_PATH}-shm`;

/**
─────────────────────────────────────────────────────────────────────────────
DATABASE OPERATIONS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Deletes the database and associated WAL/SHM files.
 *
 * Safely removes all three database-related files:
 * - Main database file (aida.db)
 * - Write-Ahead Log file (aida.db-wal)
 * - Shared Memory file (aida.db-shm)
 *
 * Files that don't exist are silently skipped. Errors during deletion are
 * logged but do not halt execution of remaining deletions.
 *
 * @returns {void}
 *
 * @example
 * deleteDatabase();
  * // Output: ✓ Deleted: <pkm>/.aida/data/aida.db

 */
function deleteDatabase(): void {
  console.log('🗑️  Deleting database files...');

  const files = [DB_PATH, DB_WAL_PATH, DB_SHM_PATH];
  let deletedCount = 0;

  for (const file of files) {
    if (existsSync(file)) {
      try {
        unlinkSync(file);
        console.log(`   ✓ Deleted: ${file.replace(LOCAL_ROOT, '')}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ✗ Failed to delete ${file}:`, error);
      }
    }
  }

  if (deletedCount === 0) {
    console.log('   ℹ️  No database files found');
  } else {
    console.log(`✅ Deleted ${deletedCount} file(s)`);
  }
}

/**
 * Initializes the database with the schema from db_schema.sql.
 *
 * Performs the following steps:
 * 1. Validates that schema file exists
 * 2. Reads the schema SQL from file
 * 3. Creates or opens the SQLite database
 * 4. Executes the schema to create tables, views, indexes, and triggers
 * 5. Verifies successful creation by listing tables and views
 * 6. Inspects and reports database settings (journal_mode, foreign_keys)
 * 7. Closes the database connection cleanly
 *
 * Exits with error code 1 if:
 * - Schema file is not found at SCHEMA_PATH
 * - Database creation or schema execution fails
 *
 * Success displays a summary of created tables, views, and settings.
 *
 * @returns {Promise<void>}
 *
 * @example
 * await initializeDatabase();
 * // Output: ✅ Database initialized successfully
 */
async function initializeDatabase(): Promise<void> {
  console.log('🔧 Initializing database...');

  // Check if schema file exists
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌ Schema file not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  // Read schema
  const schemaSQL = await Bun.file(SCHEMA_PATH).text();

  try {
    // Create/open database
    const db = new Database(DB_PATH, { create: true });

    console.log(`   ℹ️  Database: ${DB_PATH.replace(LOCAL_ROOT, '')}`);
    console.log(`   ℹ️  Schema: ${SCHEMA_PATH.replace(LOCAL_ROOT, '')}`);

    // Execute schema
    db.exec(schemaSQL);

    // Verify tables were created
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const views = db.query("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name").all() as { name: string }[];

    console.log('\n📋 Created tables:');
    tables.forEach(({ name }) => console.log(`   • ${name}`));

    console.log('\n👁️  Created views:');
    views.forEach(({ name }) => console.log(`   • ${name}`));

    // Check PRAGMA settings
    const journalMode = db.query("PRAGMA journal_mode").get() as { journal_mode: string };
    const foreignKeys = db.query("PRAGMA foreign_keys").get() as { foreign_keys: number };

    console.log('\n⚙️  Database settings:');
    console.log(`   • Journal mode: ${journalMode.journal_mode}`);
    console.log(`   • Foreign keys: ${foreignKeys.foreign_keys === 1 ? 'enabled' : 'disabled'}`);

    db.close();

    console.log('\n✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

/**
 * Resets the database by deleting all files and reinitializing with schema.
 *
 * This is a convenience function that performs:
 * 1. Complete deletion of database and all WAL/SHM files
 * 2. Fresh initialization with the current schema
 *
 * Use this command to:
 * - Clear corrupted database state
 * - Start fresh during development
 * - Apply a new schema version
 *
 * This is equivalent to running 'delete' followed by 'init' commands.
 *
 * @returns {Promise<void>}
 *
 * @example
 * await resetDatabase();
 * // Output: 🔄 Resetting database...
  * //         ✓ Deleted: <pkm>/.aida/data/aida.db

 * //         ✅ Database initialized successfully
 */
async function resetDatabase(): Promise<void> {
  console.log('🔄 Resetting database...\n');
  deleteDatabase();
  console.log('');
  await initializeDatabase();
}

/**
─────────────────────────────────────────────────────────────────────────────
CLI ENTRY POINT
─────────────────────────────────────────────────────────────────────────────

The script uses process.argv[2] to determine which database operation to perform.
Each command is handled by a dedicated async function that performs validation,
execution, and error reporting.

COMMANDS AVAILABLE:
- init    : Create/reinitialize database with schema
- delete  : Remove database and WAL/SHM files
- reset   : Delete and reinitialize in one operation
- help    : Display usage information (default if no command)

EXIT CODES:
- 0       : Successful execution
- 1       : Command error or validation failure
*/

const command = process.argv[2];

(async () => {
  switch (command) {
    case 'init':
      await initializeDatabase();
      break;

    case 'delete':
      deleteDatabase();
      break;

    case 'reset':
      await resetDatabase();
      break;

    default:
      console.log(`
╔═════════════════════════════════════════════════════════════════════════════╗
║                   AIDA DATABASE MANAGEMENT TOOL                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

USAGE:
  bun run src/database/manage-db.ts <command>

COMMANDS:
  init      Initialize/create database with schema (creates if doesn't exist)
            - Reads schema from data/schema/db_schema.sql
            - Creates all tables, views, indexes, and triggers
            - Enables WAL mode for improved concurrency
            - Enables foreign key constraints

  delete    Delete all database files
            - Removes main database file (aida.db)
            - Removes Write-Ahead Log file (aida.db-wal)
            - Removes shared memory file (aida.db-shm)
            - Safe: silently skips non-existent files

  reset     Delete and reinitialize in one operation
            - Combines delete + init commands
            - Useful for development and troubleshooting
            - Clears corrupted database state

EXAMPLES:
  bun run src/database/manage-db.ts init
  bun run src/database/manage-db.ts delete
  bun run src/database/manage-db.ts reset

SCHEMA LOCATION:
  ${SCHEMA_PATH.replace(LOCAL_ROOT, '')}

DATABASE LOCATION:
  ${DB_PATH.replace(LOCAL_ROOT, '')}

╔═════════════════════════════════════════════════════════════════════════════╗
`);
      process.exit(command ? 1 : 0);
  }
})();
