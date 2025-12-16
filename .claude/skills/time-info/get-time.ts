#!/usr/bin/env bun

/**
 * Time Info Skill - Command Line Wrapper
 *
 * Usage:
 *   bun run .claude/skills/time-info/get-time.ts "imorgon klockan 15.30"
 *   bun run .claude/skills/time-info/get-time.ts "påskafton nästa år"
 */

import { getTimeInfo } from '../../../.system/tools/utilities/time';

const input = process.argv[2];

if (!input) {
  console.log('Usage: bun run get-time.ts "<date expression>"');
  console.log('Examples:');
  console.log('  bun run get-time.ts "imorgon"');
  console.log('  bun run get-time.ts "nästa måndag klockan 15.00"');
  console.log('  bun run get-time.ts "påskafton 2026"');
  process.exit(1);
}

const result = await getTimeInfo(input);

// Pretty print the result
console.log(JSON.stringify(result, null, 2));

// Also show a human-readable summary if date was parsed
if (result.date) {
  console.log('\n---');
  if (result.time && result.time !== '00:00') {
    console.log(`${result.weekdayName} den ${result.dayOfMonth} ${result.monthName} ${result.date.split('-')[0]} klockan ${result.time}`);
  } else {
    console.log(`${result.weekdayName} den ${result.dayOfMonth} ${result.monthName} ${result.date.split('-')[0]}`);
  }
  console.log(`Vecka ${result.weekOfYear}, dag ${result.dayOfYear} av året`);
  if (result.timeUntilNextYear) {
    console.log(`${result.timeUntilNextYear} kvar till nästa år`);
  }
}
