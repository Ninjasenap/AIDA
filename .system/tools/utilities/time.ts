/**
 * Time Parsing and Formatting for AIDA
 *
 * Provides Swedish-language date and time parsing with multiple strategies (native patterns, chrono-node, and Claude LLM).
 * Handles relative date expressions (idag, imorgon, nästa vecka) and returns comprehensive time information.
 * Essential for task scheduling and event date interpretation in the AIDA system.
 */

import * as chrono from 'chrono-node';
import { execSync } from 'child_process';

/**
─────────────────────────────────────────────────────────────────────────────
SWEDISH TIME CONSTANTS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Swedish month names in order (januari through december).
 * Used for parsing Swedish month expressions and formatting dates.
 */
export const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december'
] as const;

/**
 * Swedish weekday names in order (söndag through lördag).
 * Used for parsing Swedish weekday expressions and formatting dates.
 */
export const SWEDISH_WEEKDAYS = [
  'söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'
] as const;

/**
 * Type representing a Swedish month name (januari, februari, etc.).
 */
export type SwedishMonth = typeof SWEDISH_MONTHS[number];

/**
 * Type representing a Swedish weekday name (söndag, måndag, etc.).
 */
export type SwedishWeekday = typeof SWEDISH_WEEKDAYS[number];

/**
─────────────────────────────────────────────────────────────────────────────
TYPE DEFINITIONS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Comprehensive time information extracted from a parsed date.
 *
 * Contains ISO date string, human-readable time, week information, Swedish month/weekday names,
 * and countdown to next year. All fields are null if parsing failed.
 *
 * @property date - ISO 8601 date string (YYYY-MM-DD) or null
 * @property time - Time in HH:mm format or null
 * @property weekOfYear - ISO week format (YYYY-W##) or null
 * @property monthOfYear - Month as 01-12 or null
 * @property monthName - Swedish month name (januari, februari, etc.) or null
 * @property dayOfYear - Day number in the year (1-366) or null
 * @property dayOfMonth - Day of month (1-31) or null
 * @property weekdayName - Swedish weekday name (söndag, måndag, etc.) or null
 * @property timeUntilNextYear - Human-readable countdown like "2 dagar och 5 timmar" or null
 * @property daysUntil - Time difference from now to the parsed date (positive for future, negative for past) or null
 * @property timestamp - Unix timestamp in seconds or null
 */
export interface TimeInfo {
  date: string | null;
  time: string | null;
  weekOfYear: string | null;
  monthOfYear: string | null;
  monthName: string | null;
  dayOfYear: number | null;
  dayOfMonth: number | null;
  weekdayName: string | null;
  timeUntilNextYear: string | null;
  daysUntil: string | null;
  timestamp: number | null;
}

/**
 * Result from attempting to parse a date string using one of three strategies.
 *
 * Indicates whether parsing succeeded, which parsing method was used (native regex, chrono-node, or Claude LLM),
 * and whether the parsed date is complete (has all components) or partial.
 *
 * @property date - Parsed Date object or null if parsing failed
 * @property isComplete - True if date has complete year/month/day components
 * @property source - Parsing strategy used: 'native' (regex), 'chrono' (chronoparse), 'llm' (Claude), or null
 * @property originalInput - The original input string passed to the parser
 * @property partial - Partial date components (year, month, day) if isComplete is false
 * @property hasTime - Whether a specific time was parsed from the input
 * @property hours - Parsed hour (0-23) if time was found
 * @property minutes - Parsed minutes (0-59) if time was found
 */
export interface ParseResult {
  date: Date | null;
  isComplete: boolean;
  source: 'native' | 'chrono' | 'llm' | null;
  originalInput: string;
  partial?: {
    year?: number;
    month?: number;
    day?: number;
  };
  hasTime?: boolean;
  hours?: number;
  minutes?: number;
}

/**
─────────────────────────────────────────────────────────────────────────────
LOOKUP MAPS AND MAPPINGS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Maps Swedish relative date expressions to day offsets from reference date.
 * Used in parseWithChrono to interpret phrases like "idag", "imorgon", "förrgår".
 */
const SWEDISH_RELATIVE: Record<string, number> = {
  'idag': 0,
  'igår': -1,
  'imorgon': 1,
  'i övermorgon': 2,
  'förrgår': -2,
};

/**
 * Maps Swedish weekday names to numeric day values (0=Sunday through 6=Saturday).
 * Follows JavaScript Date.getDay() convention.
 */
const SWEDISH_WEEKDAY_MAP: Record<string, number> = {
  'söndag': 0,
  'måndag': 1,
  'tisdag': 2,
  'onsdag': 3,
  'torsdag': 4,
  'fredag': 5,
  'lördag': 6,
};

/**
 * Maps Swedish month names to numeric month values (0=januari through 11=december).
 * Matches JavaScript Date month indexing (0-based).
 */
const SWEDISH_MONTH_MAP: Record<string, number> = {
  'januari': 0,
  'februari': 1,
  'mars': 2,
  'april': 3,
  'maj': 4,
  'juni': 5,
  'juli': 6,
  'augusti': 7,
  'september': 8,
  'oktober': 9,
  'november': 10,
  'december': 11,
};

/**
 * Maps Swedish ordinal words to day numbers (första=1, andra=2, ..., trettioförsta=31).
 * Used for parsing expressions like "tredje april" or "första januari".
 */
const SWEDISH_ORDINALS: Record<string, number> = {
  'första': 1, 'andra': 2, 'tredje': 3, 'fjärde': 4, 'femte': 5,
  'sjätte': 6, 'sjunde': 7, 'åttonde': 8, 'nionde': 9, 'tionde': 10,
  'elfte': 11, 'tolfte': 12, 'trettonde': 13, 'fjortonde': 14, 'femtonde': 15,
  'sextonde': 16, 'sjuttonde': 17, 'artonde': 18, 'nittonde': 19, 'tjugonde': 20,
  'tjugoförsta': 21, 'tjugoandra': 22, 'tjugotredje': 23, 'tjugofjärde': 24, 'tjugofemte': 25,
  'tjugosjätte': 26, 'tjugosjunde': 27, 'tjugoåttonde': 28, 'tjugonionde': 29, 'trettionde': 30,
  'trettioförsta': 31,
};

/**
 * Maps Swedish number words to numeric values for time parsing.
 * Used for expressions like "halv tre" (half past two = 2:30), "kvart över fyra" (quarter past four = 4:15).
 */
const SWEDISH_TIME_NUMBERS: Record<string, number> = {
  'ett': 1, 'en': 1, 'två': 2, 'tre': 3, 'fyra': 4, 'fem': 5,
  'sex': 6, 'sju': 7, 'åtta': 8, 'nio': 9, 'tio': 10,
  'elva': 11, 'tolv': 12, 'tretton': 13, 'fjorton': 14, 'femton': 15,
  'sexton': 16, 'sjutton': 17, 'arton': 18, 'nitton': 19, 'tjugo': 20,
  'tjugoett': 21, 'tjugotvå': 22, 'tjugotre': 23, 'tjugofyra': 24,
};

/**
─────────────────────────────────────────────────────────────────────────────
ISO WEEK AND DAY CALCULATIONS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Calculates the ISO 8601 week number for a given date.
 *
 * Implements the ISO week date system where week 1 is the first week with a Thursday,
 * and weeks start on Monday. Handles year boundaries correctly.
 *
 * @param date - The date to get the week number for
 * @returns ISO week number (1-53)
 * @example
 * const weekNum = getISOWeekNumber(new Date('2024-01-04')); // Returns 1
 */
export function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Formats a date as an ISO 8601 week string (YYYY-W##).
 *
 * Handles year boundaries where the week number might cross into the next or previous year.
 * For example, December 31st might be in week 1 of the next year.
 *
 * @param date - The date to format
 * @returns ISO week string like "2024-W01" or "2025-W01"
 * @example
 * const weekStr = formatISOWeek(new Date('2024-12-31')); // Returns "2025-W01"
 */
export function formatISOWeek(date: Date): string {
  const weekNum = getISOWeekNumber(date);
  const year = date.getFullYear();

  if (weekNum === 1 && date.getMonth() === 11) {
    return `${year + 1}-W${String(weekNum).padStart(2, '0')}`;
  }
  if (weekNum >= 52 && date.getMonth() === 0) {
    return `${year - 1}-W${String(weekNum).padStart(2, '0')}`;
  }

  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Calculates the day number within the year (1-366).
 *
 * Useful for displaying progress through the year or comparing dates without considering the year.
 *
 * @param date - The date to calculate day of year for
 * @returns Day number in year (1-366), where 1 is January 1st
 * @example
 * const dayNum = getDayOfYear(new Date('2024-01-01')); // Returns 1
 * const dayNum = getDayOfYear(new Date('2024-12-31')); // Returns 366
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Formats a countdown from a given date to the next New Year.
 *
 * Returns Swedish-formatted human-readable text with days, hours, and minutes.
 * Examples: "2 dagar och 5 timmar", "10 minuter", "1 dag, 3 timmar och 45 minuter".
 *
 * @param from - The reference date to calculate from (typically now)
 * @returns Swedish formatted countdown string, empty string if no time remains
 * @example
 * const countdown = formatTimeUntilNextYear(new Date('2024-12-30'));
 * // Returns something like "1 dag och 0 timmar"
 */
export function formatTimeUntilNextYear(from: Date): string {
  const nextYear = new Date(from.getFullYear() + 1, 0, 1, 0, 0, 0);
  const diff = nextYear.getTime() - from.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'dag' : 'dagar'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'timme' : 'timmar'}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minut' : 'minuter'}`);
  }

  if (parts.length === 0) return '0 minuter';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} och ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} och ${parts[2]}`;
}

/**
 * Formats the time difference between two dates.
 *
 * Returns Swedish-formatted human-readable text with sign, days, hours, and minutes.
 * Positive values indicate future dates, negative values indicate past dates.
 * Examples: "+2 dagar och 5 timmar", "-3 dagar, 2 timmar och 15 minuter", "+10 minuter".
 *
 * @param from - The reference date (typically now)
 * @param to - The target date to calculate difference to
 * @returns Swedish formatted time difference string with sign prefix
 * @example
 * const diff = formatTimeDifference(new Date('2024-12-30'), new Date('2025-01-01'));
 * // Returns something like "+2 dagar och 0 timmar"
 * const diff = formatTimeDifference(new Date('2024-12-30'), new Date('2024-12-25'));
 * // Returns something like "-5 dagar och 0 timmar"
 */
export function formatTimeDifference(from: Date, to: Date): string {
  const diff = to.getTime() - from.getTime();
  const absDiff = Math.abs(diff);
  const sign = diff >= 0 ? '+' : '-';

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'dag' : 'dagar'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'timme' : 'timmar'}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minut' : 'minuter'}`);
  }

  let result = '';
  if (parts.length === 0) {
    result = '0 minuter';
  } else if (parts.length === 1) {
    result = parts[0];
  } else if (parts.length === 2) {
    result = `${parts[0]} och ${parts[1]}`;
  } else {
    result = `${parts[0]}, ${parts[1]} och ${parts[2]}`;
  }

  return `${sign}${result}`;
}

/**
─────────────────────────────────────────────────────────────────────────────
SWEDISH TIME PARSING
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Parses Swedish time expressions from input string.
 *
 * Handles various Swedish time formats:
 * - "klockan 23.00", "kl 15:30" → { hours: 23, minutes: 0 }
 * - "halv tre" → { hours: 2, minutes: 30 } (half to three = 2:30)
 * - "kvart över två" → { hours: 2, minutes: 15 }
 * - "kvart i tre" → { hours: 2, minutes: 45 }
 *
 * @param input - String potentially containing Swedish time expression
 * @returns Object with hours and minutes if found, null otherwise
 */
export function parseSwedishTime(input: string): { hours: number; minutes: number } | null {
  const normalized = input.toLowerCase().trim();

  // Pattern: "klockan HH.MM" or "kl HH:MM" or "klockan HH:MM"
  const clockPattern = /(?:klockan|kl\.?)\s+(\d{1,2})[\.:,](\d{2})/;
  const clockMatch = normalized.match(clockPattern);
  if (clockMatch) {
    const hours = parseInt(clockMatch[1]);
    const minutes = parseInt(clockMatch[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  // Pattern: "klockan HH" or "kl HH" (no minutes)
  const clockHourPattern = /(?:klockan|kl\.?)\s+(\d{1,2})(?!\d)/;
  const clockHourMatch = normalized.match(clockHourPattern);
  if (clockHourMatch) {
    const hours = parseInt(clockHourMatch[1]);
    if (hours >= 0 && hours <= 23) {
      return { hours, minutes: 0 };
    }
  }

  // Pattern: "halv X" (half past X-1, e.g., "halv tre" = 2:30)
  const halvPattern = /\bhalv\s+([a-zåäö]+|\d+)/;
  const halvMatch = normalized.match(halvPattern);
  if (halvMatch) {
    const hourWord = halvMatch[1];
    let hour = SWEDISH_TIME_NUMBERS[hourWord];
    if (!hour) {
      const hourNum = parseInt(hourWord);
      if (!isNaN(hourNum) && hourNum >= 1 && hourNum <= 24) {
        hour = hourNum;
      }
    }
    if (hour) {
      return { hours: (hour - 1 + 24) % 24, minutes: 30 };
    }
  }

  // Pattern: "kvart över X" or "klockan kvart över X" (quarter past X, e.g., "kvart över två" = 2:15)
  const kvartOverPattern = /(?:klockan\s+)?kvart\s+över\s+([a-zåäö]+|\d+)/;
  const kvartOverMatch = normalized.match(kvartOverPattern);
  if (kvartOverMatch) {
    const hourWord = kvartOverMatch[1];
    let hour = SWEDISH_TIME_NUMBERS[hourWord];
    if (!hour) {
      const hourNum = parseInt(hourWord);
      if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
        hour = hourNum;
      }
    }
    if (hour !== undefined) {
      return { hours: hour, minutes: 15 };
    }
  }

  // Pattern: "kvart i X" or "klockan kvart i X" (quarter to X, e.g., "kvart i tre" = 2:45)
  const kvartIPattern = /(?:klockan\s+)?kvart\s+i\s+([a-zåäö]+|\d+)/;
  const kvartIMatch = normalized.match(kvartIPattern);
  if (kvartIMatch) {
    const hourWord = kvartIMatch[1];
    let hour = SWEDISH_TIME_NUMBERS[hourWord];
    if (!hour) {
      const hourNum = parseInt(hourWord);
      if (!isNaN(hourNum) && hourNum >= 1 && hourNum <= 24) {
        hour = hourNum;
      }
    }
    if (hour) {
      return { hours: (hour - 1 + 24) % 24, minutes: 45 };
    }
  }

  // Pattern: numeric time without "klockan" - "15:30" or "15.30"
  const numericTimePattern = /\b(\d{1,2})[\.:,](\d{2})\b/;
  const numericMatch = normalized.match(numericTimePattern);
  if (numericMatch) {
    const hours = parseInt(numericMatch[1]);
    const minutes = parseInt(numericMatch[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  return null;
}

/**
─────────────────────────────────────────────────────────────────────────────
PARSING FUNCTIONS: STRATEGY 1 - NATIVE REGEX PATTERNS
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Parses date strings using strict regex patterns for common formats.
 *
 * Handles: ISO dates (YYYY-MM-DD), ISO datetime (YYYY-MM-DDTHH:mm), month-year (MM.YYYY), year-only (YYYY).
 * This is the fastest parsing method and most reliable for structured input.
 * Falls through to null if no pattern matches - caller should try other strategies.
 *
 * @param input - Date string to parse
 * @returns ParseResult with date if matched, or null if no pattern matched
 * @example
 * const result = parseWithNative('2024-12-25'); // { date: Date(...), isComplete: true, source: 'native' }
 * const result = parseWithNative('12.2024'); // { date: Date(...), isComplete: false, partial: {...} }
 */
export function parseWithNative(input: string): ParseResult {
  const trimmed = input.trim();

  // Try to extract Swedish time from the input
  const timeInfo = parseSwedishTime(input);

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;
  const monthYear = /^(\d{2})\.(\d{4})$/;
  const yearOnly = /^(\d{4})$/;
  const isoDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

  let match = trimmed.match(isoDate);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    const date = new Date(year, month, day);

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      // Apply time if found
      if (timeInfo) {
        date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
      }
      return {
        date,
        isComplete: true,
        source: 'native',
        originalInput: input,
        hasTime: !!timeInfo,
        hours: timeInfo?.hours,
        minutes: timeInfo?.minutes
      };
    }
  }

  match = trimmed.match(isoDateTime);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);
    const date = new Date(year, month, day, hour, minute);

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return {
        date,
        isComplete: true,
        source: 'native',
        originalInput: input,
        hasTime: true,
        hours: hour,
        minutes: minute
      };
    }
  }

  match = trimmed.match(monthYear);
  if (match) {
    const month = parseInt(match[1]) - 1;
    const year = parseInt(match[2]);

    if (month >= 0 && month <= 11) {
      const date = new Date(year, month, 1);
      return {
        date,
        isComplete: false,
        source: 'native',
        originalInput: input,
        partial: { year, month: month + 1 }
      };
    }
  }

  match = trimmed.match(yearOnly);
  if (match) {
    const year = parseInt(match[1]);
    const date = new Date(year, 0, 1);
    return {
      date,
      isComplete: false,
      source: 'native',
      originalInput: input,
      partial: { year }
    };
  }

  return { date: null, isComplete: false, source: null, originalInput: input };
}

/**
─────────────────────────────────────────────────────────────────────────────
PARSING FUNCTIONS: STRATEGY 2 - SWEDISH-AWARE CHRONO-NODE PARSING
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Parses Swedish date expressions using chrono-node library and custom Swedish patterns.
 *
 * Handles Swedish relative dates (idag, imorgon, igår), weekday references (nästa måndag, förra fredag),
 * week offsets (nästa vecka, förra veckan), month-year combinations, day-of-month expressions,
 * and numeric offsets (om 3 dagar, om 2 veckor).
 *
 * Falls back to chrono-node library for other English-compatible patterns.
 * Best for natural language input like "nästa torsdag" or "om två veckor".
 *
 * @param input - Date expression to parse (Swedish or English)
 * @param refDate - Reference date for relative calculations (defaults to current date/time)
 * @returns ParseResult with date if parsed successfully
 * @example
 * const result = parseWithChrono('imorgon'); // Tomorrow
 * const result = parseWithChrono('nästa måndag'); // Next Monday
 * const result = parseWithChrono('om 5 dagar'); // 5 days from now
 */
export function parseWithChrono(input: string, refDate: Date = new Date()): ParseResult {
  const normalized = input.toLowerCase().trim();

  // Try to extract Swedish time from the input
  const timeInfo = parseSwedishTime(input);

  if (normalized in SWEDISH_RELATIVE) {
    const offset = SWEDISH_RELATIVE[normalized];
    const date = new Date(refDate);
    date.setDate(date.getDate() + offset);
    if (timeInfo) {
      date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return {
      date,
      isComplete: true,
      source: 'chrono',
      originalInput: input,
      hasTime: !!timeInfo,
      hours: timeInfo?.hours,
      minutes: timeInfo?.minutes
    };
  }

  const nextWeekdayMatch = normalized.match(/^nästa\s+([a-zåäö]+)$/);
  if (nextWeekdayMatch) {
    const weekdayName = nextWeekdayMatch[1];
    if (weekdayName in SWEDISH_WEEKDAY_MAP) {
      const targetDay = SWEDISH_WEEKDAY_MAP[weekdayName];
      const date = new Date(refDate);
      const currentDay = date.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      date.setDate(date.getDate() + daysToAdd);
      if (timeInfo) {
        date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return {
        date,
        isComplete: true,
        source: 'chrono',
        originalInput: input,
        hasTime: !!timeInfo,
        hours: timeInfo?.hours,
        minutes: timeInfo?.minutes
      };
    }
  }

  const lastWeekdayMatch = normalized.match(/^förra\s+([a-zåäö]+)$/);
  if (lastWeekdayMatch) {
    const weekdayName = lastWeekdayMatch[1];
    if (weekdayName in SWEDISH_WEEKDAY_MAP) {
      const targetDay = SWEDISH_WEEKDAY_MAP[weekdayName];
      const date = new Date(refDate);
      const currentDay = date.getDay();
      let daysToSubtract = currentDay - targetDay;
      if (daysToSubtract <= 0) daysToSubtract += 7;
      date.setDate(date.getDate() - daysToSubtract);
      if (timeInfo) {
        date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return {
        date,
        isComplete: true,
        source: 'chrono',
        originalInput: input,
        hasTime: !!timeInfo,
        hours: timeInfo?.hours,
        minutes: timeInfo?.minutes
      };
    }
  }

  const weekOffsetMatch = normalized.match(/^(förra|nästa)\s+veckan?$/);
  if (weekOffsetMatch) {
    const direction = weekOffsetMatch[1];
    const offset = direction === 'nästa' ? 7 : -7;
    const date = new Date(refDate);
    date.setDate(date.getDate() + offset);
    if (timeInfo) {
      date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return {
      date,
      isComplete: true,
      source: 'chrono',
      originalInput: input,
      hasTime: !!timeInfo,
      hours: timeInfo?.hours,
      minutes: timeInfo?.minutes
    };
  }

  const monthYearMatch = normalized.match(/^([a-zåäö]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2]);
    if (monthName in SWEDISH_MONTH_MAP) {
      const month = SWEDISH_MONTH_MAP[monthName];
      const date = new Date(year, month, 1);
      if (timeInfo) {
        date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
      }
      return {
        date,
        isComplete: false,
        source: 'chrono',
        originalInput: input,
        partial: { year, month: month + 1 },
        hasTime: !!timeInfo,
        hours: timeInfo?.hours,
        minutes: timeInfo?.minutes
      };
    }
  }

  const dayMonthMatch = normalized.match(/^(?:den\s+)?(\d+)\s+([a-zåäö]+)(?:\s+(?:i\s+)?år)?$/);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1]);
    const monthName = dayMonthMatch[2];
    if (monthName in SWEDISH_MONTH_MAP && day >= 1 && day <= 31) {
      const month = SWEDISH_MONTH_MAP[monthName];
      const year = refDate.getFullYear();
      const date = new Date(year, month, day);
      if (date.getDate() === day) {
        if (timeInfo) {
          date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
        }
        return {
          date,
          isComplete: true,
          source: 'chrono',
          originalInput: input,
          hasTime: !!timeInfo,
          hours: timeInfo?.hours,
          minutes: timeInfo?.minutes
        };
      }
    }
  }

  const ordinalMonthMatch = normalized.match(/^([a-zåäö]+)\s+([a-zåäö]+)(?:\s+(?:i\s+)?år)?$/);
  if (ordinalMonthMatch) {
    const ordinalName = ordinalMonthMatch[1];
    const monthName = ordinalMonthMatch[2];
    if (ordinalName in SWEDISH_ORDINALS && monthName in SWEDISH_MONTH_MAP) {
      const day = SWEDISH_ORDINALS[ordinalName];
      const month = SWEDISH_MONTH_MAP[monthName];
      const year = refDate.getFullYear();
      const date = new Date(year, month, day);
      if (date.getDate() === day) {
        if (timeInfo) {
          date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
        }
        return {
          date,
          isComplete: true,
          source: 'chrono',
          originalInput: input,
          hasTime: !!timeInfo,
          hours: timeInfo?.hours,
          minutes: timeInfo?.minutes
        };
      }
    }
  }

  const inDaysMatch = normalized.match(/^om\s+(\d+)\s+dag(?:ar)?$/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const date = new Date(refDate);
    date.setDate(date.getDate() + days);
    if (timeInfo) {
      date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return {
      date,
      isComplete: true,
      source: 'chrono',
      originalInput: input,
      hasTime: !!timeInfo,
      hours: timeInfo?.hours,
      minutes: timeInfo?.minutes
    };
  }

  const inWeeksMatch = normalized.match(/^om\s+(\d+)\s+veck(?:a|or)$/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1]);
    const date = new Date(refDate);
    date.setDate(date.getDate() + weeks * 7);
    if (timeInfo) {
      date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return {
      date,
      isComplete: true,
      source: 'chrono',
      originalInput: input,
      hasTime: !!timeInfo,
      hours: timeInfo?.hours,
      minutes: timeInfo?.minutes
    };
  }

  try {
    const results = chrono.parse(input, refDate, { forwardDate: true });
    if (results.length > 0) {
      const parsed = results[0];
      const date = parsed.start.date();

      // Apply Swedish time if found
      if (timeInfo) {
        date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
      }

      const isComplete = parsed.start.isCertain('day') &&
                         parsed.start.isCertain('month') &&
                         parsed.start.isCertain('year');

      return {
        date,
        isComplete,
        source: 'chrono',
        originalInput: input,
        hasTime: !!timeInfo,
        hours: timeInfo?.hours,
        minutes: timeInfo?.minutes
      };
    }
  } catch {
    // Fall through to return null
  }

  return { date: null, isComplete: false, source: null, originalInput: input };
}

/**
─────────────────────────────────────────────────────────────────────────────
PARSING FUNCTIONS: STRATEGY 3 - CLAUDE LLM FALLBACK
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Parses date expressions using Claude LLM as a fallback when other methods fail.
 *
 * Uses Claude via the claude CLI tool to interpret arbitrary Swedish date expressions.
 * This is the most flexible but slowest parsing method (30 second timeout).
 * Should only be called after native and chrono parsing have failed.
 *
 * Claude is prompted to return JSON with ISO date and optional partial components.
 * Useful for ambiguous or complex expressions that don't fit structured patterns.
 *
 * @param input - Date expression to parse (any Swedish or English)
 * @param refDate - Reference date for context (defaults to current date/time)
 * @returns Promise resolving to ParseResult with date if successful
 * @throws Silently fails and returns null result if Claude cannot parse
 * @example
 * const result = await parseWithLLM('den femte april nästa år');
 * const result = await parseWithLLM('mitt deadline är lite snart');
 */
export async function parseWithLLM(input: string, refDate: Date = new Date()): Promise<ParseResult> {
  const today = refDate.toISOString().split('T')[0];

  // Try to extract Swedish time from the input
  const timeInfo = parseSwedishTime(input);

  const prompt = `Tolka denna svenska datumfras till ISO 8601.
Dagens datum: ${today}
Returnera ENDAST JSON (ingen annan text): {"date": "YYYY-MM-DD" | null, "partial": {"year": number|null, "month": number|null, "day": number|null}}

Fras: "${input}"`;

  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const result = execSync(
      `claude -p "${escapedPrompt}"`,
      { encoding: 'utf-8', timeout: 30000 }
    );

    const cleanResult = result.trim();
    const jsonMatch = cleanResult.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.date) {
        const dateParts = parsed.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateParts) {
          const date = new Date(parseInt(dateParts[1]), parseInt(dateParts[2]) - 1, parseInt(dateParts[3]));
          // Apply Swedish time if found
          if (timeInfo) {
            date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
          }
          return {
            date,
            isComplete: true,
            source: 'llm',
            originalInput: input,
            hasTime: !!timeInfo,
            hours: timeInfo?.hours,
            minutes: timeInfo?.minutes
          };
        }
      }

      if (parsed.partial && (parsed.partial.year || parsed.partial.month || parsed.partial.day)) {
        const year = parsed.partial.year || refDate.getFullYear();
        const month = (parsed.partial.month || 1) - 1;
        const day = parsed.partial.day || 1;
        const date = new Date(year, month, day);
        // Apply Swedish time if found
        if (timeInfo) {
          date.setHours(timeInfo.hours, timeInfo.minutes, 0, 0);
        }

        return {
          date,
          isComplete: !!(parsed.partial.year && parsed.partial.month && parsed.partial.day),
          source: 'llm',
          originalInput: input,
          partial: parsed.partial,
          hasTime: !!timeInfo,
          hours: timeInfo?.hours,
          minutes: timeInfo?.minutes
        };
      }
    }
  } catch {
    // Fall through to return null
  }

  return { date: null, isComplete: false, source: null, originalInput: input };
}

/**
─────────────────────────────────────────────────────────────────────────────
TIME INFO BUILDING AND MAIN API
─────────────────────────────────────────────────────────────────────────────
*/

/**
 * Builds comprehensive TimeInfo object from a parsed date.
 *
 * Extracts all time components and formats them in Swedish context:
 * ISO date, HH:mm time, ISO week, Swedish month/weekday names, day of year, day of month,
 * countdown to next year, and Unix timestamp.
 *
 * For partial/incomplete dates (only month and year), returns limited information.
 * Returns all nulls if date is null.
 *
 * @param date - The parsed Date object (null if parsing failed)
 * @param isComplete - Whether all date components were parsed
 * @param partial - For incomplete dates, contains available components (year, month, day)
 * @returns TimeInfo object with all formatted time fields
 * @example
 * const timeInfo = buildTimeInfo(new Date('2024-12-25'), true);
 * // { date: '2024-12-25', time: '00:00', weekOfYear: '2024-W52', ... }
 */
export function buildTimeInfo(
  date: Date | null,
  isComplete: boolean,
  partial?: { year?: number; month?: number; day?: number }
): TimeInfo {
  if (!date) {
    return {
      date: null,
      time: null,
      weekOfYear: null,
      monthOfYear: null,
      monthName: null,
      dayOfYear: null,
      dayOfMonth: null,
      weekdayName: null,
      timeUntilNextYear: null,
      daysUntil: null,
      timestamp: null,
    };
  }

  if (!isComplete) {
    const info: TimeInfo = {
      date: null,
      time: null,
      weekOfYear: null,
      monthOfYear: null,
      monthName: null,
      dayOfYear: null,
      dayOfMonth: null,
      weekdayName: null,
      timeUntilNextYear: null,
      daysUntil: null,
      timestamp: null,
    };

    if (partial?.year) {
      if (partial.month && partial.day) {
        info.date = `${partial.year}-${String(partial.month).padStart(2, '0')}-${String(partial.day).padStart(2, '0')}`;
        info.monthOfYear = String(partial.month).padStart(2, '0');
        info.monthName = SWEDISH_MONTHS[partial.month - 1];
        info.dayOfMonth = partial.day;
        // Calculate daysUntil for partial dates with complete day info
        info.daysUntil = formatTimeDifference(new Date(), date);
      } else if (partial.month) {
        info.monthOfYear = String(partial.month).padStart(2, '0');
        info.monthName = SWEDISH_MONTHS[partial.month - 1];
      }
    }

    return info;
  }

  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  const weekOfYear = formatISOWeek(date);
  const monthOfYear = String(date.getMonth() + 1).padStart(2, '0');
  const monthName = SWEDISH_MONTHS[date.getMonth()];
  const dayOfYear = getDayOfYear(date);
  const dayOfMonth = date.getDate();
  const weekdayName = SWEDISH_WEEKDAYS[date.getDay()];
  const timeUntilNextYear = formatTimeUntilNextYear(date);
  const daysUntil = formatTimeDifference(new Date(), date);
  const timestamp = Math.floor(date.getTime() / 1000);

  return {
    date: isoDate,
    time,
    weekOfYear,
    monthOfYear,
    monthName,
    dayOfYear,
    dayOfMonth,
    weekdayName,
    timeUntilNextYear,
    daysUntil,
    timestamp,
  };
}

/**
 * Main API: Parses a date expression using all available strategies and returns comprehensive time information.
 *
 * Implements a three-strategy fallback chain:
 * 1. Native regex patterns (fastest, most structured)
 * 2. Chrono-node with Swedish language support (good for natural language)
 * 3. Claude LLM (most flexible, slowest)
 *
 * If no input provided, returns current date/time info.
 * Always returns a TimeInfo object (with all nulls if parsing fails).
 *
 * Use this function when you need to accept user input and get structured time data.
 * The parsing source is available via subsequent calls to getTimeInfo tracking,
 * but TimeInfo itself doesn't expose the source (use parseWithNative/Chrono/LLM for that).
 *
 * @param input - Optional date expression to parse (any Swedish or English)
 * @returns Promise resolving to TimeInfo with all extracted time components
 * @example
 * const timeInfo = await getTimeInfo('nästa tisdag');
 * const timeInfo = await getTimeInfo('2024-12-25');
 * const timeInfo = await getTimeInfo(); // Current time
 */
export async function getTimeInfo(input?: string): Promise<TimeInfo> {
  if (!input || input.trim() === '') {
    return buildTimeInfo(new Date(), true);
  }

  const normalized = input.trim();

  const nativeResult = parseWithNative(normalized);
  if (nativeResult.date) {
    return buildTimeInfo(nativeResult.date, nativeResult.isComplete, nativeResult.partial);
  }

  const chronoResult = parseWithChrono(normalized);
  if (chronoResult.date) {
    return buildTimeInfo(chronoResult.date, chronoResult.isComplete, chronoResult.partial);
  }

  const llmResult = await parseWithLLM(input);
  if (llmResult.date) {
    return buildTimeInfo(llmResult.date, llmResult.isComplete, llmResult.partial);
  }

  return buildTimeInfo(null, false);
}

/**
─────────────────────────────────────────────────────────────────────────────
CLI INTERFACE
─────────────────────────────────────────────────────────────────────────────
*/

// CLI interface: if run directly with arguments, execute getTimeInfo and print JSON
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'getTimeInfo') {
    const dateExpression = args.length === 1 ? undefined : args.slice(1).join(' ');

    getTimeInfo(dateExpression).then(result => {
      console.log(JSON.stringify(result, null, 2));
    }).catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  } else {
    console.error('Usage: bun run time.ts [getTimeInfo] [date expression]');
    process.exit(1);
  }
}
