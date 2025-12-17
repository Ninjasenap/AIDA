#!/usr/bin/env bun

/**
═════════════════════════════════════════════════════════════════════════════
  AIDA SETUP TOOL
═════════════════════════════════════════════════════════════════════════════

PURPOSE:
First-time setup script for AIDA that creates the folder structure and
initializes the database. Called by install.sh (Mac/Linux) and install.ps1
(Windows) after dependencies are installed.

RESPONSIBILITIES:
- Create default user folders (0-INBOX, 0-JOURNAL with subfolders, 0-SHARED RESOURCES)
- Initialize SQLite database with schema
- Verify setup completion

USAGE:
  bun run .system/tools/setup.ts

  This is typically called by the platform-specific install scripts:
  - install.sh (Mac/Linux)
  - install.ps1 (Windows)

DEPENDENCIES:
- bun:sqlite (Database class)
- fs (file operations)
- path (path utilities)

═════════════════════════════════════════════════════════════════════════════
*/

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { getPkmRoot, getDatabasePath, getSchemaPath, getPlanFilePath, getAidaDir, getProfilePath, getLocalRoot } from './utilities/paths';

/**
─────────────────────────────────────────────────────────────────────────────
CONFIGURATION CONSTANTS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * PKM root directory (where user data is stored)
 * @type {string}
 */
const PKM_ROOT = getPkmRoot();

/**
 * Path to the main AIDA SQLite database file
 * @type {string}
 */
const DB_PATH = getDatabasePath();

/**
 * Path to the database schema SQL file
 * @type {string}
 */
const SCHEMA_PATH = getSchemaPath();

/**
 * Local root directory (where system files are stored)
 * @type {string}
 */
const LOCAL_ROOT = getLocalRoot();

/**
 * Default folders to create during setup
 * These folders are gitignored and created fresh on each install
 */
const DEFAULT_FOLDERS = [
  '0-INBOX',
  '0-JOURNAL',
  '0-JOURNAL/1-DAILY',
  '0-JOURNAL/2-WEEKLY',
  '0-JOURNAL/3-MONTHLY',
  '0-JOURNAL/4-YEARLY',
  '0-SHARED',
];

/**
 * Emoji display mapping for pretty console output
 * Maps folder paths to their emoji representations
 */
const FOLDER_EMOJI_MAP: Record<string, string> = {
  '0-INBOX': '📥 0-INBOX',
  '0-JOURNAL': '📔 0-JOURNAL',
  '0-JOURNAL/1-DAILY': '📔 0-JOURNAL/📅 1-DAILY',
  '0-JOURNAL/2-WEEKLY': '📔 0-JOURNAL/📅 2-WEEKLY',
  '0-JOURNAL/3-MONTHLY': '📔 0-JOURNAL/📅 3-MONTHLY',
  '0-JOURNAL/4-YEARLY': '📔 0-JOURNAL/📅 4-YEARLY',
  '0-SHARED': '🗂️ 0-SHARED',
};

/**
─────────────────────────────────────────────────────────────────────────────
SETUP OPERATIONS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Creates the default folder structure for AIDA.
 *
 * Creates the following folders in the project root:
 * - 0-INBOX/              : Capture bucket for unprocessed items
 * - 0-JOURNAL/            : Time-based logs and journals
 *   - 1-DAILY/            : Daily journal entries
 *   - 2-WEEKLY/           : Weekly reviews
 *   - 3-MONTHLY/          : Monthly reviews
 *   - 4-YEARLY/           : Yearly reviews
 * - 0-SHARED/             : Cross-role shared resources
 *
 * Folders that already exist are silently skipped. This allows the script
 * to be run multiple times safely without errors.
 *
 * @returns {void}
 *
 * @example
 * createFolders();
 * // Output: ✓ Created: 📥 0-INBOX/
 */
function createFolders(): void {
  console.log('📁 Creating folder structure...');

  let createdCount = 0;
  let skippedCount = 0;

  // First, create .aida directory structure for PKM data
  const aidaDataDir = dirname(DB_PATH);
  const aidaContextDir = dirname(getProfilePath());

  for (const dir of [aidaDataDir, aidaContextDir]) {
    if (!existsSync(dir)) {
      try {
        mkdirSync(dir, { recursive: true });
        console.log(`   ✓ Created: ${dir}`);
        createdCount++;
      } catch (error) {
        console.error(`   ✗ Failed to create ${dir}:`, error);
      }
    }
  }

  // Then create user-facing PKM folders
  for (const folder of DEFAULT_FOLDERS) {
    const fullPath = join(PKM_ROOT, folder);
    const displayName = FOLDER_EMOJI_MAP[folder] || folder;

    if (existsSync(fullPath)) {
      console.log(`   ℹ️  Already exists: ${displayName}/`);
      skippedCount++;
    } else {
      try {
        mkdirSync(fullPath, { recursive: true });
        console.log(`   ✓ Created: ${displayName}/`);
        createdCount++;
      } catch (error) {
        console.error(`   ✗ Failed to create ${displayName}/:`, error);
      }
    }
  }

  if (createdCount > 0) {
    console.log(`✅ Created ${createdCount} folder(s)`);
  }
  if (skippedCount > 0) {
    console.log(`ℹ️  Skipped ${skippedCount} existing folder(s)`);
  }
}

/**
 * Creates the empty PLAN.md file in 0-JOURNAL/
 *
 * The PLAN.md file is used to store the daily plan, which is overwritten
 * each morning and cleared each evening after archiving to the daily log.
 *
 * @returns {void}
 */
function createPlanFile(): void {
  console.log('\n📄 Creating PLAN.md file...');

  const planPath = getPlanFilePath();

  if (existsSync(planPath)) {
    console.log('   ℹ️  PLAN.md already exists');
    return;
  }

  try {
    writeFileSync(planPath, '', 'utf-8');
    console.log('   ✓ Created: 0-JOURNAL/PLAN.md');
  } catch (error) {
    console.error('   ✗ Failed to create PLAN.md:', error);
  }
}

/**
 * Initializes the database with the schema from db_schema.sql.
 *
 * Performs the following steps:
 * 1. Validates that schema file exists
 * 2. Checks if database already exists (skip if exists)
 * 3. Reads the schema SQL from file
 * 4. Creates the SQLite database
 * 5. Executes the schema to create tables, views, indexes, and triggers
 * 6. Verifies successful creation by listing tables and views
 * 7. Closes the database connection cleanly
 *
 * Exits with error code 1 if:
 * - Schema file is not found at SCHEMA_PATH
 * - Database creation or schema execution fails
 *
 * Success displays a summary of created tables and views.
 *
 * @returns {Promise<void>}
 *
 * @example
 * await initializeDatabase();
 * // Output: ✅ Database initialized successfully
 */
async function initializeDatabase(): Promise<void> {
  console.log('\n🔧 Initializing database...');

  // Check if schema file exists
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌ Schema file not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  // Check if database already exists
  if (existsSync(DB_PATH)) {
    console.log(`   ℹ️  Database already exists: ${DB_PATH.replace(LOCAL_ROOT, '')}`);
    console.log('   ℹ️  Skipping database initialization');
    console.log('   ℹ️  To reinitialize, run: bun run .system/tools/database/manage-db.ts reset');
    return;
  }

  // Read schema
  const schemaSQL = await Bun.file(SCHEMA_PATH).text();

  try {
    // Create database
    const db = new Database(DB_PATH, { create: true });

    console.log(`   ℹ️  Database: ${DB_PATH.replace(LOCAL_ROOT, '')}`);
    console.log(`   ℹ️  Schema: ${SCHEMA_PATH.replace(LOCAL_ROOT, '')}`);

    // Execute schema
    db.exec(schemaSQL);

    // Verify tables were created
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const views = db.query("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name").all() as { name: string }[];

    console.log('\n   📋 Created tables:');
    tables.forEach(({ name }) => console.log(`      • ${name}`));

    console.log('\n   👁️  Created views:');
    views.forEach(({ name }) => console.log(`      • ${name}`));

    // Check PRAGMA settings
    const journalMode = db.query("PRAGMA journal_mode").get() as { journal_mode: string };
    const foreignKeys = db.query("PRAGMA foreign_keys").get() as { foreign_keys: number };

    console.log('\n   ⚙️  Database settings:');
    console.log(`      • Journal mode: ${journalMode.journal_mode}`);
    console.log(`      • Foreign keys: ${foreignKeys.foreign_keys === 1 ? 'enabled' : 'disabled'}`);

    db.close();

    console.log('\n✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

/**
 * Main setup function that orchestrates folder creation and database initialization.
 *
 * Runs the complete first-time setup process:
 * 1. Create default folder structure
 * 2. Initialize SQLite database
 * 3. Display completion message
 *
 * @returns {Promise<void>}
 */
async function runSetup(): Promise<void> {
  console.log(`
╔═════════════════════════════════════════════════════════════════════════════╗
║                        AIDA SETUP                                           ║
╚═════════════════════════════════════════════════════════════════════════════╝
`);

  // Create folders
  createFolders();

  // Create PLAN.md file
  createPlanFile();

  // Initialize database
  await initializeDatabase();

  // Done
  console.log(`
╔═════════════════════════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE                                           ║
╚═════════════════════════════════════════════════════════════════════════════╝

AIDA is now ready to use!

Next steps:
  1. Configure your personal profile (optional):
     .system/context/personal-profile.json

  2. Start using AIDA:
     /checkin    - Daily check-in (morning/midday/evening)
     /next       - Get next recommended action
     /capture    - Quick task capture
     /status     - Workload overview

For more information, see:
  - .claude/CLAUDE.md (system documentation)
  - .system/architecture/ (design specs)
`);
}

// Run setup
runSetup().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
