import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { unlinkSync, existsSync } from 'fs';
import {
  getProfile,
  getSection,
  getAttribute,
  updateAttribute,
  appendToArray,
  validateProfile,
  hasRequiredFields,
  getCurrentTimePeriod,
  getActivitiesForEnergy,
  getCurrentEnergyLevel,
  initializeProfile,
  profileExists,
  getProfilePath,
  addObservation,
  updateObservation,
  getObservations,
  applyObservationSuggestion,
  recordSuggestion,
  updateSuggestionOutcome,
  getSuggestionAcceptanceRate,
} from '../profile';
import type {
  Profile,
  LearningObservation,
  EnergyLevel,
  TimePeriod,
} from '../profile';

// ============================================================================
// HELPER: Generate Complete Fake Profile
// ============================================================================

function generateCompleteFakeProfile(): Profile {
  return {
    _meta: {
      purpose: 'Test profile for AIDA comprehensive testing',
      last_updated: new Date().toISOString().split('T')[0],
      version: '1.0.0',
    },
    _notes: {
      test_profile: 'This is a complete fake profile for testing all fields',
    },
    identity: {
      name: 'Test User',
      location: {
        city: 'Stockholm',
        region: 'Stockholms län',
        country: 'Sverige',
      },
      contact: {
        email: 'test@example.com',
        phone_primary: '+46 70 123 45 67',
        phone_secondary: '+46 8 123 45 67',
        address: 'Testgatan 123, 12345 Stockholm',
      },
    },
    neurotype: {
      label: 'AuDHD',
      description: 'Combined ADHD and autistic traits for testing',
      strengths: [
        {
          label: 'Pattern recognition',
          description: 'Excellent at seeing patterns in complex data',
          assistant_response: 'Present complex problems for deep analysis',
        },
        {
          label: 'Hyperfocus',
          description: 'Intense concentration on interesting topics',
          assistant_response: 'Leverage for challenging technical work',
        },
      ],
      challenges: [
        {
          label: 'task_initiation',
          description: 'Difficulty starting tasks',
          details: 'Especially when task feels overwhelming or unclear',
          assistant_response: 'Break into smallest possible first step, offer 5-minute rule',
        },
        {
          label: 'context_switching',
          description: 'Difficult to switch between tasks',
          details: 'Need time for transitions',
          assistant_response: 'Warn before context switches, suggest pause rituals',
        },
      ],
      effective_strategies: ['Body doubling', 'Pomodoro technique', 'External timers'],
      core_principle: 'Support starting, not just planning - activation over perfection',
    },
    time_definitions: {
      morning: { start: '06:00', end: '12:00' },
      noon: { start: '12:00', end: '14:00' },
      afternoon: { start: '14:00', end: '18:00' },
      evening: { start: '18:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' },
    },
    energy_pattern: {
      high: {
        label: 'Hög energi',
        description: 'Peak mental capacity and focus',
        activities: {
          deep_work: {
            label: 'Djuparbete',
            description: 'Complex problem solving, architecture design',
            preferred_time: 'morning',
          },
          creative_work: {
            label: 'Kreativt arbete',
            description: 'Writing, brainstorming, design',
            preferred_time: 'morning',
          },
        },
      },
      medium: {
        label: 'Medium energi',
        description: 'Stable productivity for routine work',
        activities: {
          meetings: {
            label: 'Möten',
            description: 'Team collaboration and discussions',
            preferred_time: 'afternoon',
          },
          code_review: {
            label: 'Kodgranskning',
            description: 'Review pull requests and provide feedback',
            preferred_time: 'afternoon',
          },
        },
      },
      low: {
        label: 'Låg energi',
        description: 'Light tasks and rest',
        activities: {
          admin: {
            label: 'Adminuppgifter',
            description: 'Simple administrative tasks, filing',
            preferred_time: 'evening',
          },
          reading: {
            label: 'Läsning',
            description: 'Articles, documentation (passive learning)',
            preferred_time: 'evening',
          },
        },
      },
    },
    roles: {
      '1': {
        id: 1,
        label: 'Developer',
        type: 'work',
        description: 'Software development and engineering',
        status: 'active',
        balance_target: 40,
      },
      '2': {
        id: 2,
        label: 'Personal Development',
        type: 'personal',
        description: 'Learning and skill building',
        status: 'active',
        balance_target: 30,
      },
      '3': {
        id: 3,
        label: 'Health & Fitness',
        type: 'private',
        description: 'Physical and mental health',
        status: 'active',
        balance_target: 20,
      },
      '4': {
        id: 4,
        label: 'Hobby Projects',
        type: 'hobby',
        description: 'Side projects for fun',
        status: 'active',
        balance_target: 10,
      },
    },
    balance_targets: {
      weekly_distribution: {
        work: 40,
        personal: 30,
        private: 20,
        hobby: 10,
      },
    },
    values: {
      core: ['Integrity', 'Learning', 'Balance', 'Kindness'],
      positions: [
        'Quality over quantity',
        'Transparency in communication',
        'Sustainability over quick wins',
      ],
      work_principles: [
        'One thing at a time',
        'Document for future self',
        'Automate repetitive tasks',
        'Test-driven development',
      ],
    },
    tools: {
      vscode: {
        name: 'Visual Studio Code',
        purpose: 'Primary code editor',
        category: 'development',
        example_usage: 'All coding work with extensions for TypeScript, testing',
      },
      obsidian: {
        name: 'Obsidian',
        purpose: 'Note-taking and knowledge management',
        category: 'pkm',
        example_usage: 'Daily notes, project documentation, zettelkasten method',
      },
      slack: {
        name: 'Slack',
        purpose: 'Team communication',
        category: 'communication',
        example_usage: 'Daily standups, async discussions with team',
      },
    },
    background: {
      education: [
        {
          name: 'University of Test',
          start: '2010',
          end: '2015',
          description: 'BSc in Computer Science',
        },
        {
          name: 'Online Certification Program',
          start: '2020',
          end: '2021',
          description: 'Advanced TypeScript and System Design',
        },
      ],
      professional: [
        {
          name: 'Senior Developer - Tech Company AB',
          start: '2020',
          end: 'present',
          description: 'Lead developer for core platform',
          responsibilities: [
            'Architecture design and implementation',
            'Code review and mentoring',
            'Performance optimization',
          ],
          related_competencies: [
            'TypeScript/JavaScript',
            'System design',
            'Team leadership',
          ],
        },
        {
          name: 'Developer - Startup Inc',
          start: '2015',
          end: '2020',
          description: 'Full-stack developer',
          responsibilities: ['Feature development', 'Bug fixes', 'Customer support'],
          related_competencies: ['React', 'Node.js', 'PostgreSQL'],
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Developer',
          obtained: '2022',
          valid_until: '2025',
          description: 'Cloud architecture and deployment',
        },
      ],
      competencies: [
        {
          name: 'TypeScript',
          description: 'Programming language for robust applications',
          level: 5,
          category: 'technical',
        },
        {
          name: 'System Design',
          description: 'Architecting scalable systems',
          level: 4,
          category: 'technical',
        },
        {
          name: 'Team Leadership',
          description: 'Mentoring and guiding development teams',
          level: 3,
          category: 'leadership',
        },
      ],
      languages: [
        { name: 'Swedish', level: 5 },
        { name: 'English', level: 4 },
        { name: 'Spanish', level: 2 },
      ],
      memberships: [
        {
          name: 'Swedish Software Professionals',
          description: 'Active member since 2018',
        },
      ],
    },
    learning_observations: {
      observations: [],
    },
    feedback_history: {
      suggestions: [],
    },
    update_log: {
      entries: [],
    },
  };
}

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Profile Utility', () => {
  afterEach(() => {
    // Clean up profile after each test
    const profilePath = getProfilePath();
    if (existsSync(profilePath)) {
      unlinkSync(profilePath);
    }
  });

  // ==========================================================================
  // A. BASIC OPERATIONS
  // ==========================================================================

  describe('A. Basic Operations', () => {
    describe('Create profile from scratch', () => {
      test('should create profile with minimal required fields', () => {
        const profile = initializeProfile({ name: 'Test User' });

        expect(profile).not.toBeNull();
        expect(profile?.identity.name).toBe('Test User');
        expect(profile?.time_definitions).toBeDefined();
        expect(profile?.energy_pattern).toBeDefined();
        expect(profile?.roles).toBeDefined();
        expect(profileExists()).toBe(true);
      });

      test('should create profile with all provided fields', () => {
        const profile = initializeProfile({
          name: 'Test User',
          time_definitions: {
            morning: { start: '07:00', end: '12:00' },
            noon: { start: '12:00', end: '14:00' },
            afternoon: { start: '14:00', end: '17:00' },
            evening: { start: '17:00', end: '22:00' },
            night: { start: '22:00', end: '07:00' },
          },
          roles: {
            '1': { id: 1, label: 'Test Role', type: 'work' },
          },
        });

        expect(profile?.time_definitions.morning.start).toBe('07:00');
        expect(profile?.roles['1']).toBeDefined();
      });

      test('should return existing profile if already exists', () => {
        const first = initializeProfile({ name: 'First User' });
        const second = initializeProfile({ name: 'Second User' });

        // Should return the existing profile (first)
        expect(second?.identity.name).toBe('First User');
      });
    });

    describe('Read full profile', () => {
      test('should return complete profile object', () => {
        initializeProfile({ name: 'Test User' });
        const profile = getProfile();

        expect(profile).not.toBeNull();
        expect(profile?.identity).toBeDefined();
        expect(profile?.time_definitions).toBeDefined();
      });

      test('should return null if profile does not exist', () => {
        const profile = getProfile();
        expect(profile).toBeNull();
      });
    });

    describe('Read specific sections', () => {
      beforeEach(() => {
        initializeProfile({ name: 'Test User' });
      });

      test('should return identity section', () => {
        const identity = getSection('identity');
        expect(identity).not.toBeNull();
        expect(identity.name).toBe('Test User');
      });

      test('should return time_definitions section', () => {
        const timeDefs = getSection('time_definitions');
        expect(timeDefs).not.toBeNull();
        expect(timeDefs.morning).toBeDefined();
      });

      test('should return null for non-existent section', () => {
        const section = getSection('neurotype');
        expect(section).toBeNull();
      });
    });

    describe('Update single attribute', () => {
      beforeEach(() => {
        initializeProfile({ name: 'Test User' });
      });

      test('should update top-level attribute', () => {
        const success = updateAttribute('identity.name', 'Updated User', 'user');
        expect(success).toBe(true);

        const name = getAttribute('identity.name');
        expect(name).toBe('Updated User');
      });

      test('should update nested attribute', () => {
        const success = updateAttribute('identity.location.city', 'Göteborg', 'user');
        expect(success).toBe(true);

        const city = getAttribute('identity.location.city');
        expect(city).toBe('Göteborg');
      });

      test('should create update log entry', () => {
        updateAttribute('identity.name', 'Updated', 'user', 'User requested name change');

        const profile = getProfile();
        expect(profile?.update_log?.entries.length).toBeGreaterThan(0);

        const lastLog = profile!.update_log!.entries[profile!.update_log!.entries.length - 1];
        expect(lastLog.path).toBe('identity.name');
        expect(lastLog.new_value).toBe('Updated');
        expect(lastLog.source).toBe('user');
        expect(lastLog.reason).toBe('User requested name change');
      });
    });

    describe('Append to arrays', () => {
      beforeEach(() => {
        const profile = generateCompleteFakeProfile();
        const path = getProfilePath();
        const { writeFileSync } = require('fs');
        writeFileSync(path, JSON.stringify(profile, null, 2));
      });

      test('should append to existing array', () => {
        const newStrength = {
          label: 'New Strength',
          description: 'Test strength',
          assistant_response: 'Use for testing',
        };

        const success = appendToArray('neurotype.strengths', newStrength, 'user');
        expect(success).toBe(true);

        const strengths = getAttribute('neurotype.strengths') as any[];
        expect(strengths.length).toBe(3); // Original 2 + new one
        expect(strengths[2].label).toBe('New Strength');
      });

      test('should create array if path does not exist', () => {
        const success = appendToArray('new_array_field', 'item1', 'user');
        expect(success).toBe(true);

        const arr = getAttribute('new_array_field') as any[];
        expect(Array.isArray(arr)).toBe(true);
        expect(arr[0]).toBe('item1');
      });

      test('should fail if path is not an array', () => {
        const success = appendToArray('identity.name', 'value', 'user');
        expect(success).toBe(false);
      });
    });
  });

  // ==========================================================================
  // B. FAKE PROFILE GENERATION
  // ==========================================================================

  describe('B. Fake Profile Generation', () => {
    test('should generate complete fake profile with ALL fields', () => {
      const fakeProfile = generateCompleteFakeProfile();

      // Verify all required sections exist
      expect(fakeProfile.identity).toBeDefined();
      expect(fakeProfile.identity.name).toBeDefined();
      expect(fakeProfile.time_definitions).toBeDefined();
      expect(fakeProfile.energy_pattern).toBeDefined();
      expect(fakeProfile.roles).toBeDefined();

      // Verify optional sections exist
      expect(fakeProfile.neurotype).toBeDefined();
      expect(fakeProfile.values).toBeDefined();
      expect(fakeProfile.tools).toBeDefined();
      expect(fakeProfile.background).toBeDefined();

      // Verify new learning sections
      expect(fakeProfile.learning_observations).toBeDefined();
      expect(fakeProfile.feedback_history).toBeDefined();
      expect(fakeProfile.update_log).toBeDefined();

      // Verify deep nested fields
      expect(fakeProfile.identity.location?.city).toBe('Stockholm');
      expect(fakeProfile.neurotype.strengths).toHaveLength(2);
      expect(fakeProfile.background.education).toHaveLength(2);
      expect(fakeProfile.background.professional).toHaveLength(2);
    });

    test('should validate fake profile against schema', () => {
      const fakeProfile = generateCompleteFakeProfile();
      const result = validateProfile(fakeProfile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // C. REAL-WORLD SCENARIOS
  // ==========================================================================

  describe('C. Real-world Scenarios', () => {
    beforeEach(() => {
      const profile = generateCompleteFakeProfile();
      const path = getProfilePath();
      const { writeFileSync } = require('fs');
      writeFileSync(path, JSON.stringify(profile, null, 2));
    });

    describe('Morning planning', () => {
      test('should get current time period correctly', () => {
        const period = getCurrentTimePeriod();
        expect(period).toBeDefined();
        expect(['morning', 'noon', 'afternoon', 'evening', 'night']).toContain(period);
      });

      test('should get energy activities for current level', () => {
        const activities = getActivitiesForEnergy('high');

        expect(activities).toBeInstanceOf(Array);
        expect(activities.length).toBeGreaterThan(0);
        expect(activities[0]).toHaveProperty('label');
        expect(activities[0]).toHaveProperty('description');
        expect(activities[0]).toHaveProperty('preferred_time');
      });
    });

    describe('Role switching', () => {
      test('should get role by ID', () => {
        const role = getAttribute('roles.1');
        expect(role).toBeDefined();
        expect((role as any).label).toBe('Developer');
      });

      test('should check balance targets', () => {
        const roles = getSection('roles') as Record<string, any>;
        const targets = Object.values(roles)
          .filter((r: any) => r.balance_target)
          .reduce((sum: number, r: any) => sum + r.balance_target, 0);

        expect(targets).toBe(100); // Should sum to 100%
      });
    });

    describe('Task selection', () => {
      test('should get neurotype challenges for activation support', () => {
        const challenges = getAttribute('neurotype.challenges') as any[];
        expect(Array.isArray(challenges)).toBe(true);
        expect(challenges.length).toBeGreaterThan(0);
        expect(challenges[0].assistant_response).toBeDefined();
      });

      test('should get suitable activities for current energy', () => {
        const energyLevel = getCurrentEnergyLevel();
        const activities = getActivitiesForEnergy(energyLevel);

        expect(activities.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // D. AUTO-LEARNING SCENARIOS
  // ==========================================================================

  describe('D. Auto-learning Scenarios', () => {
    beforeEach(() => {
      initializeProfile({ name: 'Test User' });
    });

    describe('Energy pattern observation', () => {
      test('should create observation when morning work preference detected', () => {
        const observation = addObservation({
          category: 'time_preference',
          pattern: 'Prefers morning for deep work (80% of entries)',
          evidence: [
            '2025-12-10: Check-in at 07:30',
            '2025-12-11: Check-in at 08:00',
            '2025-12-12: Check-in at 07:45',
            '2025-12-13: Check-in at 08:15',
          ],
          confidence: 0.8,
          status: 'active',
        });

        expect(observation.id).toBeDefined();
        expect(observation.first_observed).toBeDefined();
        expect(observation.last_confirmed).toBeDefined();
        expect(observation.confidence).toBe(0.8);
        expect(observation.category).toBe('time_preference');
      });
    });

    describe('Role focus observation', () => {
      test('should detect role imbalance from task completion', () => {
        const observation = addObservation({
          category: 'role_focus',
          pattern: 'Strong focus on Developer role (90% of completions)',
          evidence: ['20 tasks in Developer role', '2 tasks in Personal role'],
          confidence: 0.9,
          status: 'active',
          suggested_update: {
            path: 'roles.1.balance_target',
            value: 50,
            rationale: 'Actual time spent exceeds current target of 40%',
          },
        });

        expect(observation.suggested_update).toBeDefined();
        expect(observation.suggested_update?.path).toBe('roles.1.balance_target');
        expect(observation.suggested_update?.value).toBe(50);
      });
    });

    describe('Energy pattern adjustment', () => {
      test('should suggest energy pattern update based on check-ins', () => {
        const observation = addObservation({
          category: 'energy',
          pattern: 'Afternoon energy lower than profile suggests',
          evidence: [
            '14:00 check-in: low energy',
            '15:30 check-in: low energy',
            '16:00 check-in: low energy',
            '14:30 check-in: low energy',
            '15:00 check-in: low energy',
          ],
          confidence: 0.7,
          status: 'active',
          suggested_update: {
            path: 'energy_pattern.low.description',
            value: 'Particularly during afternoons (14:00-17:00)',
            rationale: '70% of afternoon check-ins report low energy',
          },
        });

        expect(observation.confidence).toBeGreaterThanOrEqual(0.6);
        expect(observation.suggested_update).toBeDefined();
      });
    });

    describe('Observation application', () => {
      test('should apply observation suggestion to profile', () => {
        const observation = addObservation({
          category: 'energy',
          pattern: 'Test pattern',
          evidence: ['evidence1'],
          confidence: 0.8,
          status: 'active',
          suggested_update: {
            path: 'identity.name',
            value: 'Auto-Updated Name',
            rationale: 'Testing auto-update',
          },
        });

        const success = applyObservationSuggestion(observation.id);
        expect(success).toBe(true);

        const name = getAttribute('identity.name');
        expect(name).toBe('Auto-Updated Name');

        const observations = getObservations();
        const updated = observations.find(o => o.id === observation.id);
        expect(updated?.status).toBe('applied');
      });

      test('should log update when applying observation', () => {
        const observation = addObservation({
          category: 'energy',
          pattern: 'Test',
          evidence: [],
          confidence: 0.5,
          status: 'active',
          suggested_update: {
            path: 'identity.name',
            value: 'New Name',
            rationale: 'Test rationale',
          },
        });

        applyObservationSuggestion(observation.id);

        const profile = getProfile();
        const logs = profile?.update_log?.entries || [];
        const autoLearnLog = logs.find(log => log.source === 'auto_learn');

        expect(autoLearnLog).toBeDefined();
        expect(autoLearnLog?.reason).toBe('Test rationale');
      });
    });

    describe('Update and retrieve observations', () => {
      test('should update observation confidence', () => {
        const obs = addObservation({
          category: 'energy',
          pattern: 'Test pattern',
          evidence: ['e1'],
          confidence: 0.5,
          status: 'active',
        });

        const success = updateObservation(obs.id, {
          confidence: 0.9,
          evidence: ['e1', 'e2', 'e3'],
        });

        expect(success).toBe(true);

        const updated = getObservations().find(o => o.id === obs.id);
        expect(updated?.confidence).toBe(0.9);
        expect(updated?.evidence).toHaveLength(3);
      });

      test('should filter observations by category', () => {
        addObservation({
          category: 'energy',
          pattern: 'Energy test',
          evidence: [],
          confidence: 0.5,
          status: 'active',
        });

        addObservation({
          category: 'role_focus',
          pattern: 'Role test',
          evidence: [],
          confidence: 0.5,
          status: 'active',
        });

        const energyObs = getObservations('energy');
        expect(energyObs).toHaveLength(1);
        expect(energyObs[0].category).toBe('energy');
      });
    });
  });

  // ==========================================================================
  // E. INTEGRATION TESTS
  // ==========================================================================

  describe('E. Integration Tests', () => {
    beforeEach(() => {
      const profile = generateCompleteFakeProfile();
      const path = getProfilePath();
      const { writeFileSync } = require('fs');
      writeFileSync(path, JSON.stringify(profile, null, 2));
    });

    describe('Feedback loop integration', () => {
      test('should track suggestion acceptance rate', () => {
        recordSuggestion({
          type: 'task_suggestion',
          suggestion: 'Work on architecture doc',
          outcome: 'accepted',
        });

        recordSuggestion({
          type: 'task_suggestion',
          suggestion: 'Review pull requests',
          outcome: 'rejected',
          user_feedback: 'Not in the mood for reviews',
        });

        recordSuggestion({
          type: 'task_suggestion',
          suggestion: 'Write tests',
          outcome: 'accepted',
        });

        const rate = getSuggestionAcceptanceRate('task_suggestion');
        expect(rate).toBeCloseTo(0.667, 2); // 2/3 accepted
      });

      test('should update suggestion outcome', () => {
        const sug = recordSuggestion({
          type: 'energy_match',
          suggestion: 'Deep work now',
          outcome: 'pending',
        });

        const success = updateSuggestionOutcome(sug.id, 'accepted', 'Great suggestion!');
        expect(success).toBe(true);

        const profile = getProfile();
        const updated = profile?.feedback_history?.suggestions.find(s => s.id === sug.id);

        expect(updated?.outcome).toBe('accepted');
        expect(updated?.user_feedback).toBe('Great suggestion!');
      });

      test('should return null acceptance rate when no suggestions of type', () => {
        const rate = getSuggestionAcceptanceRate('activation_technique');
        expect(rate).toBeNull();
      });
    });

    describe('Validation integration', () => {
      test('should validate complete fake profile', () => {
        const profile = getProfile();
        const result = validateProfile(profile);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should detect missing required fields', () => {
        const invalidProfile = { identity: {} }; // Missing name and other required fields
        const result = validateProfile(invalidProfile);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.path === 'identity.name')).toBe(true);
      });

      test('should provide warnings for missing optional fields', () => {
        const minimalProfile = {
          identity: { name: 'Test' },
          time_definitions: {
            morning: { start: '06:00', end: '12:00' },
            noon: { start: '12:00', end: '14:00' },
            afternoon: { start: '14:00', end: '18:00' },
            evening: { start: '18:00', end: '22:00' },
            night: { start: '22:00', end: '06:00' },
          },
          energy_pattern: {
            high: { label: 'High' },
            medium: { label: 'Medium' },
            low: { label: 'Low' },
          },
          roles: { '1': { id: 1, label: 'Test', type: 'work' } },
        };

        const result = validateProfile(minimalProfile);
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });
  });
});
