import { describe, expect, test } from 'bun:test';
import {
  getTimeInfo,
  parseWithNative,
  parseWithChrono,
  getISOWeekNumber,
  getDayOfYear,
  formatTimeUntilNextYear,
  formatISOWeek,
  SWEDISH_MONTHS,
  SWEDISH_WEEKDAYS,
} from '../time';

describe('getTimeInfo - current time', () => {
  test('should return current date when called without arguments', async () => {
    const result = await getTimeInfo();
    const now = new Date();
    const expectedDate = now.toISOString().split('T')[0];

    expect(result.date).toBe(expectedDate);
    expect(result.monthOfYear).toBe(String(now.getMonth() + 1).padStart(2, '0'));
    expect(result.dayOfMonth).toBe(now.getDate());
    expect(result.timestamp).toBeGreaterThan(0);
  });

  test('should return Swedish month and weekday names', async () => {
    const result = await getTimeInfo();

    expect(SWEDISH_MONTHS).toContain(result.monthName);
    expect(SWEDISH_WEEKDAYS).toContain(result.weekdayName);
  });

  test('should return current time in HH:mm format', async () => {
    const result = await getTimeInfo();

    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should return ISO week format', async () => {
    const result = await getTimeInfo();

    expect(result.weekOfYear).toMatch(/^\d{4}-W\d{2}$/);
  });

  test('should return time until next year', async () => {
    const result = await getTimeInfo();

    expect(result.timeUntilNextYear).toMatch(/\d+\s+(dag|dagar)/);
  });
});

describe('getTimeInfo - ISO format', () => {
  test('should parse ISO date YYYY-MM-DD', async () => {
    const result = await getTimeInfo('2025-12-25');

    expect(result.date).toBe('2025-12-25');
    expect(result.monthName).toBe('december');
    expect(result.dayOfMonth).toBe(25);
    expect(result.weekdayName).toBe('torsdag');
  });

  test('should handle leap year dates', async () => {
    const result = await getTimeInfo('2024-02-29');

    expect(result.date).toBe('2024-02-29');
    expect(result.dayOfYear).toBe(60);
  });

  test('should parse ISO datetime', async () => {
    const result = await getTimeInfo('2025-01-15T14:30:00');

    expect(result.date).toBe('2025-01-15');
    expect(result.time).toBe('14:30');
  });
});

describe('getTimeInfo - MM.YYYY format', () => {
  test('should parse MM.YYYY format', async () => {
    const result = await getTimeInfo('03.2025');

    expect(result.monthOfYear).toBe('03');
    expect(result.monthName).toBe('mars');
  });

  test('should return partial info for incomplete date', async () => {
    const result = await getTimeInfo('06.2025');

    expect(result.monthOfYear).toBe('06');
    expect(result.monthName).toBe('juni');
    expect(result.dayOfMonth).toBeNull();
  });
});

describe('getTimeInfo - Swedish basics', () => {
  test('should parse "idag"', async () => {
    const result = await getTimeInfo('idag');
    const today = new Date().toISOString().split('T')[0];

    expect(result.date).toBe(today);
  });

  test('should parse "igår"', async () => {
    const result = await getTimeInfo('igår');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(result.date).toBe(yesterday.toISOString().split('T')[0]);
  });

  test('should parse "imorgon"', async () => {
    const result = await getTimeInfo('imorgon');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    expect(result.date).toBe(tomorrow.toISOString().split('T')[0]);
  });

  test('should parse "i övermorgon"', async () => {
    const result = await getTimeInfo('i övermorgon');
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    expect(result.date).toBe(dayAfterTomorrow.toISOString().split('T')[0]);
  });
});

describe('getTimeInfo - Swedish advanced', () => {
  test('should parse "sjunde november i år"', async () => {
    const result = await getTimeInfo('sjunde november i år');
    const year = new Date().getFullYear();

    expect(result.date).toBe(`${year}-11-07`);
    expect(result.monthName).toBe('november');
  });

  test('should parse "den 15 mars"', async () => {
    const result = await getTimeInfo('den 15 mars');
    const year = new Date().getFullYear();

    expect(result.date).toBe(`${year}-03-15`);
    expect(result.monthName).toBe('mars');
  });

  test('should parse "nästa måndag"', async () => {
    const result = await getTimeInfo('nästa måndag');

    expect(result.weekdayName).toBe('måndag');
    expect(result.date).toBeDefined();
  });

  test('should parse "förra fredag"', async () => {
    const result = await getTimeInfo('förra fredag');

    expect(result.weekdayName).toBe('fredag');
    expect(result.date).toBeDefined();
  });

  test('should parse "nästa vecka"', async () => {
    const result = await getTimeInfo('nästa vecka');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    expect(result.date).toBe(nextWeek.toISOString().split('T')[0]);
  });

  test('should parse "förra veckan"', async () => {
    const result = await getTimeInfo('förra veckan');
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    expect(result.date).toBe(lastWeek.toISOString().split('T')[0]);
  });

  test('should parse "om 3 dagar"', async () => {
    const result = await getTimeInfo('om 3 dagar');
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    expect(result.date).toBe(in3Days.toISOString().split('T')[0]);
  });

  test('should parse "om 2 veckor"', async () => {
    const result = await getTimeInfo('om 2 veckor');
    const in2Weeks = new Date();
    in2Weeks.setDate(in2Weeks.getDate() + 14);

    expect(result.date).toBe(in2Weeks.toISOString().split('T')[0]);
  });
});

describe('getTimeInfo - partial dates', () => {
  test('should handle year-only input', async () => {
    const result = await getTimeInfo('2025');

    expect(result.timestamp).toBeNull();
    expect(result.date).toBeNull();
  });

  test('should handle month.year format', async () => {
    const result = await getTimeInfo('12.2025');

    expect(result.monthName).toBe('december');
    expect(result.monthOfYear).toBe('12');
    expect(result.dayOfMonth).toBeNull();
  });
});

describe('getTimeInfo - edge cases', () => {
  test('should handle empty string', async () => {
    const result = await getTimeInfo('');
    const today = new Date().toISOString().split('T')[0];

    expect(result.date).toBe(today);
  });

  test('should roll over invalid date (lenient behavior)', async () => {
    const result = await getTimeInfo('2025-02-30');

    // Feb 30 rolls over to March 2
    expect(result.date).toBe('2025-03-02');
  }, 10000);

  test('should handle gibberish', async () => {
    const result = await getTimeInfo('asdfghjkl');

    expect(result.date).toBeNull();
  }, 10000);

  test('should be case insensitive for Swedish words', async () => {
    const lower = await getTimeInfo('imorgon');
    const upper = await getTimeInfo('IMORGON');
    const mixed = await getTimeInfo('Imorgon');

    expect(lower.date).toBe(upper.date);
    expect(lower.date).toBe(mixed.date);
  });
});

describe('parseWithNative', () => {
  test('should parse ISO date format', () => {
    const result = parseWithNative('2025-06-15');

    expect(result.date).not.toBeNull();
    expect(result.isComplete).toBe(true);
    expect(result.source).toBe('native');
  });

  test('should parse MM.YYYY format', () => {
    const result = parseWithNative('06.2025');

    expect(result.date).not.toBeNull();
    expect(result.isComplete).toBe(false);
    expect(result.partial?.month).toBe(6);
    expect(result.partial?.year).toBe(2025);
  });

  test('should parse year only', () => {
    const result = parseWithNative('2025');

    expect(result.date).not.toBeNull();
    expect(result.isComplete).toBe(false);
    expect(result.partial?.year).toBe(2025);
  });

  test('should reject invalid dates', () => {
    const result = parseWithNative('2025-13-45');

    expect(result.date).toBeNull();
  });
});

describe('parseWithChrono', () => {
  test('should parse Swedish relative dates', () => {
    const today = new Date();
    const result = parseWithChrono('idag');

    expect(result.date).not.toBeNull();
    expect(result.source).toBe('chrono');
  });

  test('should parse next weekday', () => {
    const result = parseWithChrono('nästa tisdag');

    expect(result.date).not.toBeNull();
    expect(result.isComplete).toBe(true);
  });

  test('should parse ordinal month format', () => {
    const result = parseWithChrono('femte maj i år');

    expect(result.date).not.toBeNull();
    expect(result.source).toBe('chrono');
  });

  test('should parse "om X dagar"', () => {
    const result = parseWithChrono('om 5 dagar');

    expect(result.date).not.toBeNull();
    expect(result.isComplete).toBe(true);
  });
});

describe('getISOWeekNumber', () => {
  test('should return week 1 for January 1, 2025', () => {
    const date = new Date('2025-01-01');
    expect(getISOWeekNumber(date)).toBe(1);
  });

  test('should handle week transitions correctly', () => {
    const date = new Date('2025-12-29');
    const weekNum = getISOWeekNumber(date);
    expect(weekNum).toBeGreaterThanOrEqual(1);
    expect(weekNum).toBeLessThanOrEqual(53);
  });
});

describe('getDayOfYear', () => {
  test('should return 1 for January 1', () => {
    const date = new Date('2025-01-01');
    expect(getDayOfYear(date)).toBe(1);
  });

  test('should return 365 for December 31 (non-leap)', () => {
    const date = new Date('2025-12-31');
    expect(getDayOfYear(date)).toBe(365);
  });

  test('should return 366 for December 31 (leap year)', () => {
    const date = new Date('2024-12-31');
    expect(getDayOfYear(date)).toBe(366);
  });

  test('should handle mid-year correctly', () => {
    const date = new Date('2025-07-01');
    const dayOfYear = getDayOfYear(date);
    expect(dayOfYear).toBeGreaterThan(180);
    expect(dayOfYear).toBeLessThan(185);
  });
});

describe('formatTimeUntilNextYear', () => {
  test('should format countdown in Swedish', () => {
    const dec14 = new Date('2025-12-14T10:00:00');
    const result = formatTimeUntilNextYear(dec14);

    expect(result).toContain('dag');
    expect(result).toMatch(/och/);
  });

  test('should use singular forms correctly', () => {
    const dec31 = new Date('2025-12-31T23:00:00');
    const result = formatTimeUntilNextYear(dec31);

    expect(result).toMatch(/\d+\s+(dag|dagar|timme|timmar|minut|minuter)/);
  });

  test('should handle new year eve', () => {
    const nye = new Date('2025-12-31T23:59:00');
    const result = formatTimeUntilNextYear(nye);

    expect(result).toContain('minut');
  });
});

describe('formatISOWeek', () => {
  test('should format ISO week correctly', () => {
    const date = new Date('2025-06-15');
    const result = formatISOWeek(date);

    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  test('should handle year boundaries', () => {
    const date = new Date('2024-12-30');
    const result = formatISOWeek(date);

    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});
