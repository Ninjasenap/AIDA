#!/usr/bin/env bun
/**
 * AIDA CLI - Command-line interface for database query functions
 *
 * This is the ONLY way to invoke database query functions from Claude Code skills,
 * commands, hooks, or any agent interaction. Direct SQL is NEVER allowed.
 *
 * Usage:
 *   bun run .system/tools/aida-cli.ts <module> <function> [args...]
 *
 * Examples:
 *   bun run .system/tools/aida-cli.ts tasks getTodayTasks
 *   bun run .system/tools/aida-cli.ts tasks getOverdueTasks
 *   bun run .system/tools/aida-cli.ts journal getTodayEntries
 *   bun run .system/tools/aida-cli.ts journal createEntry '{"entry_type":"checkin","content":"Morning check-in"}'
 *   bun run .system/tools/aida-cli.ts roles getActiveRoles
 *
 * Modules:
 *   - tasks: Task CRUD operations (12 functions)
 *   - roles: Role management (7 functions)
 *   - projects: Project management (10 functions)
 *   - journal: Journal entries (7 functions)
 *   - journalMd: Journal markdown generation (5 functions)
 *   - plan: Daily plan file management (6 functions)
 *
 * Arguments:
 *   - JSON strings are automatically parsed: '{"key":"value"}' → object
 *   - Numbers remain as numbers: 42 → 42
 *   - Strings remain as strings: foo → "foo"
 *
 * Output:
 *   - Always JSON formatted (can be piped to jq or parsed by calling code)
 *   - Errors go to stderr, data to stdout
 */

import * as tasks from './database/queries/tasks';
import * as roles from './database/queries/roles';
import * as projects from './database/queries/projects';
import * as journal from './database/queries/journal';
import * as journalMd from './utilities/journal-markdown';
import * as plan from './utilities/daily-plan';

const modules = { tasks, roles, projects, journal, journalMd, plan };

const [module, func, ...args] = process.argv.slice(2);

if (!module || !func) {
  console.log('Usage: aida-cli <module> <function> [args...]');
  console.log('');
  console.log('Modules: tasks, roles, projects, journal, journalMd, plan');
  console.log('');
  console.log('Examples:');
  console.log('  bun run .system/tools/aida-cli.ts tasks getTodayTasks');
  console.log('  bun run .system/tools/aida-cli.ts journal createEntry \'{"entry_type":"checkin","content":"test"}\'');
  console.log('  bun run .system/tools/aida-cli.ts journalMd regenerateJournalMarkdown "2025-12-16"');
  console.log('  bun run .system/tools/aida-cli.ts plan createDailyPlan \'{"date":"2025-12-16","events":[],"focus":["Task 1"],"next_steps":[],"parked":[],"notes":""}\'');
  console.log('  bun run .system/tools/aida-cli.ts plan archivePlanToLog "2025-12-16"');
  console.log('  bun run .system/tools/aida-cli.ts plan clearPlan');
  process.exit(1);
}

const mod = modules[module as keyof typeof modules];
const fn = mod?.[func as keyof typeof mod];

if (!fn) {
  console.error(`Unknown: ${module}.${func}`);
  console.error(`Available modules: ${Object.keys(modules).join(', ')}`);
  if (mod) {
    console.error(`Available functions in ${module}: ${Object.keys(mod).join(', ')}`);
  }
  process.exit(1);
}

// Parse arguments - JSON strings become objects, everything else stays as-is
const parsedArgs = args.map(a => {
  try {
    return JSON.parse(a);
  } catch {
    return a;
  }
});

try {
  const result = await (fn as any)(...parsedArgs);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error executing query:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
