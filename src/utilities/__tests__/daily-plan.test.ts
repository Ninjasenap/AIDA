import { describe, expect, test, afterEach } from 'bun:test';
import { existsSync } from 'fs';
import {
  getPlanPath,
  planHasContent,
  createDailyPlan,
  readDailyPlan,
  parsePlanMarkdown,
  clearPlan,
  archivePlanToLog,
  type DailyPlan,
} from '../daily-plan';

describe('Daily Plan Management', () => {
  // Clean up after each test
  afterEach(() => {
    try {
      clearPlan();
    } catch (e) {
      // Ignore errors if plan doesn't exist
    }
  });

  describe('getPlanPath', () => {
    test('should return path to PLAN.md', () => {
      const path = getPlanPath();
      expect(path).toBeDefined();
      expect(path).toContain('0-JOURNAL');
      expect(path).toContain('PLAN.md');
    });
  });

  describe('planHasContent', () => {
    test('should return false when plan does not exist', () => {
      clearPlan();
      const hasContent = planHasContent();
      expect(hasContent).toBe(false);
    });

    test('should return false when plan is empty', () => {
      clearPlan();
      const hasContent = planHasContent();
      expect(hasContent).toBe(false);
    });

    test('should return true when plan has content', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [],
        focus: ['Test task'],
        next_steps: [],
        parked: [],
        notes: ''
      };
      createDailyPlan(plan);
      const hasContent = planHasContent();
      expect(hasContent).toBe(true);
    });
  });

  describe('createDailyPlan', () => {
    test('should create plan file', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [{ time: '09:00', title: 'Team meeting' }],
        focus: ['Complete implementation'],
        next_steps: ['Write tests'],
        parked: ['Refactoring'],
        notes: 'Test notes'
      };

      const path = createDailyPlan(plan);
      expect(existsSync(path)).toBe(true);
      expect(planHasContent()).toBe(true);
    });

    test('should overwrite existing plan', () => {
      const plan1: DailyPlan = {
        date: '2025-12-16',
        events: [],
        focus: ['First plan'],
        next_steps: [],
        parked: [],
        notes: ''
      };

      const plan2: DailyPlan = {
        date: '2025-12-16',
        events: [],
        focus: ['Second plan'],
        next_steps: [],
        parked: [],
        notes: ''
      };

      createDailyPlan(plan1);
      createDailyPlan(plan2);

      const content = readDailyPlan();
      expect(content).toContain('Second plan');
      expect(content).not.toContain('First plan');
    });

    test('should format Swedish date correctly', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [],
        focus: ['Test'],
        next_steps: [],
        parked: [],
        notes: ''
      };

      createDailyPlan(plan);
      const content = readDailyPlan();
      expect(content).toContain('Plan för');
    });

    test('should include all sections', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [{ time: '10:00', title: 'Meeting' }],
        focus: ['Focus item'],
        next_steps: ['Next step'],
        parked: ['Parked item'],
        notes: 'My notes'
      };

      createDailyPlan(plan);
      const content = readDailyPlan()!;
      expect(content).toContain('Dagens events');
      expect(content).toContain('Fokus för dagen');
      expect(content).toContain('Nästa steg');
      expect(content).toContain('Parkerade');
      expect(content).toContain('Anteckningar');
    });
  });

  describe('readDailyPlan', () => {
    test('should return empty string when plan is cleared', () => {
      clearPlan();
      const content = readDailyPlan();
      expect(content).toBe('');
    });

    test('should return null when plan file does not exist', () => {
      const path = getPlanPath();
      if (existsSync(path)) {
        const { unlinkSync } = require('fs');
        unlinkSync(path);
      }
      const content = readDailyPlan();
      expect(content).toBeNull();
    });

    test('should return plan content', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [],
        focus: ['Test focus'],
        next_steps: [],
        parked: [],
        notes: ''
      };

      createDailyPlan(plan);
      const content = readDailyPlan();
      expect(content).not.toBeNull();
      expect(content).toContain('Test focus');
    });
  });

  describe('parsePlanMarkdown', () => {
    test('should extract focus items', () => {
      const markdown = `
# Plan

## Fokus för dagen
1. First focus item
2. Second focus item
3. Third focus item

## Anteckningar
Notes here
`;

      const { focus, events } = parsePlanMarkdown(markdown);
      expect(focus).toHaveLength(3);
      expect(focus[0]).toBe('First focus item');
      expect(focus[1]).toBe('Second focus item');
      expect(focus[2]).toBe('Third focus item');
    });

    test('should extract calendar events', () => {
      const markdown = `
# Plan

## Dagens events
- 09:00 Team standup
- 14:00 Code review
- 16:00 Planning session

## Fokus för dagen
1. Focus item
`;

      const { focus, events } = parsePlanMarkdown(markdown);
      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ time: '09:00', title: 'Team standup' });
      expect(events[1]).toEqual({ time: '14:00', title: 'Code review' });
      expect(events[2]).toEqual({ time: '16:00', title: 'Planning session' });
    });

    test('should handle both "Dagens events" and "Dagens kalender"', () => {
      const markdown = `
## Dagens kalender
- 10:00 Meeting

## Fokus för dagen
1. Task
`;

      const { events } = parsePlanMarkdown(markdown);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ time: '10:00', title: 'Meeting' });
    });

    test('should return empty arrays when sections are missing', () => {
      const markdown = `# Just a title`;
      const { focus, events } = parsePlanMarkdown(markdown);
      expect(focus).toHaveLength(0);
      expect(events).toHaveLength(0);
    });

    test('should handle empty sections', () => {
      const markdown = `
## Fokus för dagen

## Dagens events

## Anteckningar
Notes
`;

      const { focus, events } = parsePlanMarkdown(markdown);
      expect(focus).toHaveLength(0);
      expect(events).toHaveLength(0);
    });
  });

  describe('clearPlan', () => {
    test('should clear plan file', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [],
        focus: ['Test'],
        next_steps: [],
        parked: [],
        notes: ''
      };

      createDailyPlan(plan);
      expect(planHasContent()).toBe(true);

      clearPlan();
      expect(planHasContent()).toBe(false);
    });

    test('should not throw when plan does not exist', () => {
      expect(() => clearPlan()).not.toThrow();
    });
  });

  describe('archivePlanToLog', () => {
    test('should throw error when plan is empty', () => {
      clearPlan();
      expect(() => archivePlanToLog('2025-12-16')).toThrow('No plan content to archive');
    });

    test('should archive plan with focus and events to journal', () => {
      const plan: DailyPlan = {
        date: '2025-12-16',
        events: [{ time: '10:00', title: 'Meeting' }],
        focus: ['Focus item 1', 'Focus item 2'],
        next_steps: [],
        parked: [],
        notes: 'Test notes'
      };

      createDailyPlan(plan);

      // Archive should succeed without throwing
      const logPath = archivePlanToLog('2025-12-16');
      expect(logPath).toBeDefined();
      expect(logPath).toContain('0-JOURNAL');
      expect(logPath).toContain('1-DAILY');

      // Plan should be cleared after archiving
      expect(planHasContent()).toBe(false);
    });
  });
});
