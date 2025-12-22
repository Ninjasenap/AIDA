#!/usr/bin/env bun
/**
 * Database Migration: Fix UTC Timestamps to Local Time
 *
 * This script fixes timestamps in the production database that were incorrectly
 * stored as UTC instead of local Swedish time (CET/CEST).
 *
 * Affected tables:
 * - journal_entries.timestamp
 * - tasks.created_at
 * - roles.created_at, roles.updated_at
 * - projects.created_at
 *
 * Usage:
 *   bun run src/migrations/fix-timestamps.ts --dry-run  # Preview changes
 *   bun run src/migrations/fix-timestamps.ts            # Execute migration
 */

import { Database } from 'bun:sqlite';
import { copyFileSync, existsSync } from 'fs';
import { getDatabasePath, getPkmRoot, getAidaDir } from '../utilities/paths';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

/**
 * Calculates the timezone offset for Sweden (CET/CEST).
 * CET (winter): UTC+1
 * CEST (summer): UTC+2
 */
function getTimezoneOffset(): number {
  const now = new Date();
  const januaryOffset = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
  const julyOffset = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
  const currentOffset = now.getTimezoneOffset();

  // Convert minutes to hours (negative because JS returns negative for ahead of UTC)
  const offsetHours = -currentOffset / 60;

  console.log(`\nTimezone Detection:`);
  console.log(`  Current offset: UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`);
  console.log(`  January offset: ${-januaryOffset / 60} hours`);
  console.log(`  July offset: ${-julyOffset / 60} hours`);

  return offsetHours;
}

/**
 * Creates a backup of the database file.
 */
function createBackup(dbPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = dbPath.replace('.db', `-backup-${timestamp}.db`);

  console.log(`\nCreating backup:`);
  console.log(`  Source: ${dbPath}`);
  console.log(`  Backup: ${backupPath}`);

  if (!isDryRun) {
    copyFileSync(dbPath, backupPath);
    console.log(`  ✓ Backup created successfully`);
  } else {
    console.log(`  [DRY RUN] Would create backup`);
  }

  return backupPath;
}

/**
 * Counts records that will be affected by the migration.
 */
function analyzeDatabase(db: Database): void {
  console.log(`\nAnalyzing database...`);

  const counts = {
    journal_entries: db.query('SELECT COUNT(*) as count FROM journal_entries').get() as { count: number },
    tasks: db.query('SELECT COUNT(*) as count FROM tasks').get() as { count: number },
    roles: db.query('SELECT COUNT(*) as count FROM roles').get() as { count: number },
    projects: db.query('SELECT COUNT(*) as count FROM projects').get() as { count: number },
  };

  console.log(`\nRecords to update:`);
  console.log(`  journal_entries: ${counts.journal_entries.count} records`);
  console.log(`  tasks: ${counts.tasks.count} records`);
  console.log(`  roles: ${counts.roles.count} records`);
  console.log(`  projects: ${counts.projects.count} records`);

  // Show sample of current timestamps
  const sampleJournal = db.query('SELECT timestamp FROM journal_entries ORDER BY id DESC LIMIT 1').get() as { timestamp: string } | null;
  const sampleTask = db.query('SELECT created_at FROM tasks ORDER BY id DESC LIMIT 1').get() as { created_at: string } | null;

  console.log(`\nSample current timestamps:`);
  if (sampleJournal) console.log(`  journal_entries: ${sampleJournal.timestamp}`);
  if (sampleTask) console.log(`  tasks: ${sampleTask.created_at}`);
}

/**
 * Performs the migration to fix timestamps.
 */
function migrateTimestamps(db: Database, offsetHours: number): void {
  const offsetModifier = offsetHours >= 0 ? `+${offsetHours} hours` : `${offsetHours} hours`;

  console.log(`\nExecuting migration with offset: ${offsetModifier}`);

  const migrations = [
    {
      table: 'journal_entries',
      column: 'timestamp',
      sql: `UPDATE journal_entries SET timestamp = datetime(timestamp, '${offsetModifier}')`,
    },
    {
      table: 'tasks',
      column: 'created_at',
      sql: `UPDATE tasks SET created_at = datetime(created_at, '${offsetModifier}')`,
    },
    {
      table: 'roles',
      column: 'created_at, updated_at',
      sql: `UPDATE roles SET
            created_at = datetime(created_at, '${offsetModifier}'),
            updated_at = datetime(updated_at, '${offsetModifier}')`,
    },
    {
      table: 'projects',
      column: 'created_at',
      sql: `UPDATE projects SET created_at = datetime(created_at, '${offsetModifier}')`,
    },
  ];

  if (isDryRun) {
    console.log(`\n[DRY RUN] Would execute the following SQL statements:\n`);
    migrations.forEach(m => {
      console.log(`-- ${m.table}.${m.column}`);
      console.log(m.sql + ';\n');
    });
  } else {
    migrations.forEach(m => {
      console.log(`  Updating ${m.table}.${m.column}...`);
      const result = db.query(m.sql).run();
      console.log(`    ✓ Updated ${result.changes} records`);
    });
  }
}

/**
 * Verifies the migration by showing sample timestamps after update.
 */
function verifyMigration(db: Database, offsetHours: number): void {
  console.log(`\nVerifying migration...`);

  const sampleJournal = db.query('SELECT timestamp FROM journal_entries ORDER BY id DESC LIMIT 1').get() as { timestamp: string } | null;
  const sampleTask = db.query('SELECT created_at FROM tasks ORDER BY id DESC LIMIT 1').get() as { created_at: string } | null;

  console.log(`\nSample updated timestamps:`);
  if (sampleJournal) console.log(`  journal_entries: ${sampleJournal.timestamp}`);
  if (sampleTask) console.log(`  tasks: ${sampleTask.created_at}`);

  if (!isDryRun) {
    console.log(`\n✓ Migration completed successfully!`);
    console.log(`  All timestamps have been adjusted by ${offsetHours >= 0 ? '+' : ''}${offsetHours} hours`);
  }
}

/**
 * Main migration function.
 */
async function main() {
  console.log(`\n========================================`);
  console.log(`  Timestamp Migration Tool`);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE EXECUTION'}`);
  console.log(`========================================`);

  // Get database path
  const dbPath = getDatabasePath();

  if (!existsSync(dbPath)) {
    console.error(`\n❌ Database not found at: ${dbPath}`);
    process.exit(1);
  }

  console.log(`\nDatabase: ${dbPath}`);

  // Calculate timezone offset
  const offsetHours = getTimezoneOffset();

  // Create backup (unless dry run)
  const backupPath = createBackup(dbPath);

  // Open database
  const db = new Database(dbPath);

  try {
    // Analyze current state
    analyzeDatabase(db);

    // Perform migration
    migrateTimestamps(db, offsetHours);

    // Verify results
    if (!isDryRun) {
      verifyMigration(db, offsetHours);
    }

    if (isDryRun) {
      console.log(`\n========================================`);
      console.log(`  DRY RUN COMPLETE`);
      console.log(`  No changes were made to the database`);
      console.log(`  Remove --dry-run flag to execute`);
      console.log(`========================================\n`);
    } else {
      console.log(`\n========================================`);
      console.log(`  MIGRATION COMPLETE`);
      console.log(`  Backup saved to: ${backupPath}`);
      console.log(`========================================\n`);
    }
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration
main();
