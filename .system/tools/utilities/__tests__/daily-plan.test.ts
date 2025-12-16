import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { existsSync, unlinkSync } from 'fs';
import {
  createDailyPlan,
  readDailyPlan,
  updateDailyPlan,
  deleteDailyPlan,
  dailyPlanExists,
  getDailyPlanPath,
  appendNoteToPlan,
  type DailyPlan
} from '../daily-plan';

describe('Daily Plan Management', () => {
  const testDate = '2025-12-16';

  afterEach(() => {
    // Clean up test files
    const filePath = getDailyPlanPath(testDate);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  });

  test('should create a daily plan file', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [{ time: '09:00', title: 'Team meeting' }],
      focus: ['Complete journal implementation'],
      next_steps: ['Write tests'],
      parked: [],
      notes: ''
    };

    const filePath = createDailyPlan(plan);

    expect(existsSync(filePath)).toBe(true);
    expect(dailyPlanExists(testDate)).toBe(true);
  });

  test('should generate plan with Swedish date format', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [],
      focus: ['Test task'],
      next_steps: [],
      parked: [],
      notes: ''
    };

    createDailyPlan(plan);
    const readPlan = readDailyPlan(testDate);

    expect(readPlan).not.toBeNull();
    expect(readPlan?.notes).toContain('Plan för');
  });

  test('should update an existing plan', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [],
      focus: ['Original focus'],
      next_steps: [],
      parked: [],
      notes: ''
    };

    createDailyPlan(plan);

    const updatedPath = updateDailyPlan(testDate, {
      focus: ['Updated focus'],
      notes: 'Updated notes'
    });

    expect(updatedPath).not.toBeNull();
  });

  test('should return null when updating non-existent plan', () => {
    const result = updateDailyPlan('2099-01-01', { notes: 'test' });
    expect(result).toBeNull();
  });

  test('should delete a daily plan', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [],
      focus: [],
      next_steps: [],
      parked: [],
      notes: ''
    };

    createDailyPlan(plan);
    expect(dailyPlanExists(testDate)).toBe(true);

    const deleted = deleteDailyPlan(testDate);
    expect(deleted).toBe(true);
    expect(dailyPlanExists(testDate)).toBe(false);
  });

  test('should return false when deleting non-existent plan', () => {
    const deleted = deleteDailyPlan('2099-01-01');
    expect(deleted).toBe(false);
  });

  test('should handle empty events with placeholder text', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [],
      focus: [],
      next_steps: [],
      parked: [],
      notes: ''
    };

    createDailyPlan(plan);
    const readPlan = readDailyPlan(testDate);

    expect(readPlan?.notes).toContain('_Inga events inbokade_');
  });

  test('should handle multiple events', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [
        { time: '09:00', title: 'Morning standup' },
        { time: '14:00', title: 'Code review' },
        { time: '16:00', title: 'Planning session' }
      ],
      focus: [],
      next_steps: [],
      parked: [],
      notes: ''
    };

    createDailyPlan(plan);
    const readPlan = readDailyPlan(testDate);

    expect(readPlan).not.toBeNull();
  });

  test('should append notes to existing plan', () => {
    const plan: DailyPlan = {
      date: testDate,
      events: [],
      focus: [],
      next_steps: [],
      parked: [],
      notes: 'Original notes'
    };

    createDailyPlan(plan);
    const updatedPath = appendNoteToPlan(testDate, 'Additional note');

    expect(updatedPath).not.toBeNull();
  });

  test('should return null when appending to non-existent plan', () => {
    const result = appendNoteToPlan('2099-01-01', 'test note');
    expect(result).toBeNull();
  });
});
