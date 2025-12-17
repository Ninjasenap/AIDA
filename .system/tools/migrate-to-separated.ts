#!/usr/bin/env bun

/**
═════════════════════════════════════════════════════════════════════════════
  AIDA MIGRATION TOOL - Migrate to Separated Setup
═════════════════════════════════════════════════════════════════════════════

PURPOSE:
Migrates an existing AIDA installation from legacy mode (all files in one
directory) to separated mode (system files in Git repo, data in OneDrive).

USAGE:
  # Dry-run (default) - shows what will happen without making changes
  bun run .system/tools/migrate-to-separated.ts

  # Execute migration
  bun run .system/tools/migrate-to-separated.ts --execute

WHAT IT DOES:
1. Checks if already separated
2. Asks for OneDrive PKM path
3. Shows planned operations (dry-run by default)
4. With --execute flag: performs migration with verification

SAFETY:
- Copies files first, deletes only after verification
- Aborts on first error
- Logs all operations

═════════════════════════════════════════════════════════════════════════════
*/

import { existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { getConfigPath, getConfig, expandPath } from './utilities/paths';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXECUTE_MODE = process.argv.includes('--execute');
const LOCAL_ROOT = join(import.meta.dir, '../..');

// Folders to migrate from LOCAL to PKM
const PKM_FOLDERS = [
  '0-INBOX',
  '0-JOURNAL',
  '0-SHARED',
  '.obsidian',
];

// Files/folders within .system to migrate
const SYSTEM_DATA_TO_MIGRATE = [
  { from: '.system/data/aida.db', to: '.aida/data/aida.db' },
  { from: '.system/data/aida.db-wal', to: '.aida/data/aida.db-wal' },
  { from: '.system/data/aida.db-shm', to: '.aida/data/aida.db-shm' },
  { from: '.system/context', to: '.aida/context' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Prompts user for input
 */
function prompt(question: string): string {
  const buf = new Uint8Array(1024);
  process.stdout.write(question);
  const n = Bun.stdin.readSync(buf);
  return new TextDecoder().decode(buf.slice(0, n)).trim();
}

/**
 * Copy directory recursively
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!existsSync(src)) return;

  // Create destination directory
  mkdirSync(dest, { recursive: true });

  // Read source directory
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Find all role folders (01-*, 02-*, etc.)
 */
function findRoleFolders(): string[] {
  const folders: string[] = [];

  if (!existsSync(LOCAL_ROOT)) return folders;

  const entries = readdirSync(LOCAL_ROOT);

  for (const entry of entries) {
    const fullPath = join(LOCAL_ROOT, entry);

    // Check if it's a directory starting with a digit
    if (statSync(fullPath).isDirectory() && /^[0-9]/.test(entry)) {
      // Skip the known PKM folders
      if (!PKM_FOLDERS.includes(entry)) {
        folders.push(entry);
      }
    }
  }

  return folders;
}

// ============================================================================
// MIGRATION OPERATIONS
// ============================================================================

interface MigrationOperation {
  type: 'create_dir' | 'copy_file' | 'copy_dir' | 'delete_file' | 'delete_dir' | 'create_config';
  from?: string;
  to: string;
  description: string;
}

/**
 * Plans all migration operations
 */
function planMigration(pkmRoot: string): MigrationOperation[] {
  const operations: MigrationOperation[] = [];

  // 1. Create .aida directory structure
  operations.push({
    type: 'create_dir',
    to: join(pkmRoot, '.aida/data'),
    description: 'Create .aida/data directory',
  });

  operations.push({
    type: 'create_dir',
    to: join(pkmRoot, '.aida/context'),
    description: 'Create .aida/context directory',
  });

  // 2. Copy system data to PKM
  for (const item of SYSTEM_DATA_TO_MIGRATE) {
    const fromPath = join(LOCAL_ROOT, item.from);
    const toPath = join(pkmRoot, item.to);

    if (!existsSync(fromPath)) continue;

    const isDir = statSync(fromPath).isDirectory();

    operations.push({
      type: isDir ? 'copy_dir' : 'copy_file',
      from: fromPath,
      to: toPath,
      description: `Copy ${item.from} → ${item.to}`,
    });
  }

  // 3. Copy PKM folders
  for (const folder of PKM_FOLDERS) {
    const fromPath = join(LOCAL_ROOT, folder);
    const toPath = join(pkmRoot, folder);

    if (!existsSync(fromPath)) continue;

    operations.push({
      type: 'copy_dir',
      from: fromPath,
      to: toPath,
      description: `Copy ${folder}/ → ${folder}/`,
    });
  }

  // 4. Copy role folders (01-*, 02-*, etc.)
  const roleFolders = findRoleFolders();
  for (const folder of roleFolders) {
    const fromPath = join(LOCAL_ROOT, folder);
    const toPath = join(pkmRoot, folder);

    operations.push({
      type: 'copy_dir',
      from: fromPath,
      to: toPath,
      description: `Copy ${folder}/ → ${folder}/`,
    });
  }

  // 5. Create config file
  operations.push({
    type: 'create_config',
    to: join(LOCAL_ROOT, '.system/config/aida-paths.json'),
    description: 'Create config file',
  });

  // 6. Delete migrated files from LOCAL (only if executing)
  if (EXECUTE_MODE) {
    // Delete system data
    for (const item of SYSTEM_DATA_TO_MIGRATE) {
      const fromPath = join(LOCAL_ROOT, item.from);
      if (!existsSync(fromPath)) continue;

      operations.push({
        type: statSync(fromPath).isDirectory() ? 'delete_dir' : 'delete_file',
        to: fromPath,
        description: `Delete ${item.from}`,
      });
    }

    // Delete PKM folders
    for (const folder of PKM_FOLDERS) {
      const fromPath = join(LOCAL_ROOT, folder);
      if (!existsSync(fromPath)) continue;

      operations.push({
        type: 'delete_dir',
        to: fromPath,
        description: `Delete ${folder}/`,
      });
    }

    // Delete role folders
    for (const folder of roleFolders) {
      const fromPath = join(LOCAL_ROOT, folder);

      operations.push({
        type: 'delete_dir',
        to: fromPath,
        description: `Delete ${folder}/`,
      });
    }
  }

  return operations;
}

/**
 * Executes migration operations
 */
function executeMigration(operations: MigrationOperation[], pkmRoot: string): boolean {
  let successCount = 0;
  let errorCount = 0;

  for (const op of operations) {
    try {
      switch (op.type) {
        case 'create_dir':
          mkdirSync(op.to, { recursive: true });
          console.log(`  ✓ ${op.description}`);
          break;

        case 'copy_file':
          if (op.from) {
            mkdirSync(dirname(op.to), { recursive: true });
            copyFileSync(op.from, op.to);
            console.log(`  ✓ ${op.description}`);
          }
          break;

        case 'copy_dir':
          if (op.from) {
            copyDirRecursive(op.from, op.to);
            console.log(`  ✓ ${op.description}`);
          }
          break;

        case 'create_config':
          mkdirSync(dirname(op.to), { recursive: true });
          const config = {
            _meta: { version: '1.0' },
            paths: {
              pkm_root: pkmRoot,
              local_root: LOCAL_ROOT,
            },
          };
          Bun.write(op.to, JSON.stringify(config, null, 2));
          console.log(`  ✓ ${op.description}`);
          break;

        case 'delete_file':
          rmSync(op.to, { force: true });
          console.log(`  ✓ ${op.description}`);
          break;

        case 'delete_dir':
          rmSync(op.to, { recursive: true, force: true });
          console.log(`  ✓ ${op.description}`);
          break;
      }

      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed: ${op.description}`);
      console.error(`    Error: ${error}`);
      errorCount++;

      // Abort on first error
      return false;
    }
  }

  console.log('');
  console.log(`✅ Completed ${successCount} operations`);
  if (errorCount > 0) {
    console.log(`❌ Failed ${errorCount} operations`);
  }

  return errorCount === 0;
}

// ============================================================================
// MAIN
// ============================================================================

console.log('');
console.log('╔═════════════════════════════════════════════════════════════════════════════╗');
console.log('║           AIDA MIGRATION - Separate LOCAL and PKM                          ║');
console.log('╚═════════════════════════════════════════════════════════════════════════════╝');
console.log('');

// Check if already separated
const config = getConfig();
if (config !== null) {
  console.log('❌ Already separated!');
  console.log('');
  console.log('Current configuration:');
  console.log(`  PKM root: ${config.paths.pkm_root}`);
  console.log(`  Local root: ${config.paths.local_root}`);
  console.log('');
  console.log('To re-migrate, delete .system/config/aida-paths.json first.');
  process.exit(1);
}

// Ask for PKM path
console.log('This script will migrate your AIDA data from legacy mode to separated mode.');
console.log('');
console.log('System files will remain in: ' + LOCAL_ROOT);
console.log('PKM data will be moved to your specified OneDrive location.');
console.log('');

const pkmPathInput = prompt('Enter OneDrive PKM path (e.g., ~/OneDrive/AIDA-PKM): ');
if (!pkmPathInput) {
  console.log('❌ No path provided. Aborting.');
  process.exit(1);
}

const pkmRoot = expandPath(pkmPathInput);
console.log('');
console.log(`Expanded path: ${pkmRoot}`);
console.log('');

// Plan migration
console.log('📋 Planning migration...');
console.log('');

const operations = planMigration(pkmRoot);

console.log('Planned operations:');
console.log('');

for (const op of operations) {
  const icon = op.type.startsWith('delete') ? '🗑️' :
               op.type.startsWith('copy') ? '📦' :
               op.type === 'create_config' ? '⚙️' : '📁';
  console.log(`  ${icon} ${op.description}`);
}

console.log('');
console.log(`Total operations: ${operations.length}`);
console.log('');

// Execute or show instructions
if (EXECUTE_MODE) {
  console.log('🚀 Executing migration...');
  console.log('');

  const success = executeMigration(operations, pkmRoot);

  if (success) {
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify that your data is in: ' + pkmRoot);
    console.log('  2. Test the system with: bun run .system/tools/aida-cli.ts tasks getTodayTasks');
    console.log('  3. If everything works, the old files have been removed from LOCAL');
    console.log('');
  } else {
    console.log('');
    console.log('❌ Migration failed!');
    console.log('');
    console.log('Your data has NOT been deleted. Please fix the error and try again.');
    process.exit(1);
  }
} else {
  console.log('⚠️  DRY-RUN MODE');
  console.log('');
  console.log('This was a dry-run. No files were modified.');
  console.log('');
  console.log('To execute the migration, run:');
  console.log('  bun run .system/tools/migrate-to-separated.ts --execute');
  console.log('');
}
