/**
 * Profile Management Utility for AIDA
 *
 * Provides functions for reading, writing, and validating user profiles.
 * All profile operations go through this utility to ensure consistency
 * and proper logging of changes.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { getProfilePath as _getProfilePath, getContextDir as _getContextDir } from './paths';

// ============================================================================
// PATHS
// ============================================================================

const PROFILE_PATH = _getProfilePath();
const CONTEXT_DIR = _getContextDir();

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Energy levels matching profile schema */
export type EnergyLevel = 'high' | 'medium' | 'low';

/** Time periods matching profile schema */
export type TimePeriod = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

/** Profile sections for targeted reading */
export type ProfileSection =
  | 'identity'
  | 'neurotype'
  | 'time_definitions'
  | 'energy_pattern'
  | 'roles'
  | 'balance_targets'
  | 'values'
  | 'tools'
  | 'background'
  | 'learning_observations'
  | 'feedback_history'
  | 'update_log';

/** Categories for learning observations */
export type ObservationCategory =
  | 'energy'
  | 'time_preference'
  | 'role_focus'
  | 'task_completion'
  | 'work_style'
  | 'communication'
  | 'other';

/** Suggestion types for feedback history */
export type SuggestionType =
  | 'task_suggestion'
  | 'energy_match'
  | 'role_assignment'
  | 'time_recommendation'
  | 'profile_update'
  | 'activation_technique';

/** Suggestion outcomes */
export type SuggestionOutcome =
  | 'accepted'
  | 'modified'
  | 'rejected'
  | 'ignored'
  | 'pending';

/** Change sources for update log */
export type ChangeSource = 'user' | 'auto_learn' | 'setup_wizard' | 'import';

/** Learning observation entry */
export interface LearningObservation {
  id: string;
  category: ObservationCategory;
  pattern: string;
  evidence: string[];
  confidence: number;
  first_observed: string;
  last_confirmed: string;
  suggested_update?: {
    path: string;
    value: unknown;
    rationale: string;
  };
  status: 'active' | 'applied' | 'dismissed';
}

/** Feedback history entry */
export interface FeedbackEntry {
  id: string;
  type: SuggestionType;
  suggestion: string;
  context?: string;
  timestamp: string;
  outcome: SuggestionOutcome;
  user_feedback?: string;
  related_observation_id?: string;
}

/** Update log entry */
export interface UpdateLogEntry {
  id: string;
  timestamp: string;
  path: string;
  old_value: unknown;
  new_value: unknown;
  source: ChangeSource;
  reason?: string;
  related_observation_id?: string;
}

/** Activity information for energy matching */
export interface ActivityInfo {
  label: string;
  description: string;
  preferred_time: TimePeriod;
}

/** Minimal required fields for profile initialization */
export interface MinimalProfileData {
  name: string;
  time_definitions?: Record<TimePeriod, { start: string; end: string }>;
  energy_pattern?: {
    high?: { label: string };
    medium?: { label: string };
    low?: { label: string };
  };
  roles?: Record<string, { id: number; label: string; type: string }>;
}

/** Full profile type (based on schema) */
export interface Profile {
  _meta?: Record<string, string>;
  _notes?: Record<string, unknown>;
  identity: {
    name: string;
    location?: Record<string, string>;
    contact?: Record<string, string>;
  };
  neurotype?: Record<string, unknown>;
  time_definitions: Record<TimePeriod, { start: string; end: string }>;
  energy_pattern: {
    high: { label: string; description?: string; activities?: Record<string, ActivityInfo> };
    medium: { label: string; description?: string; activities?: Record<string, ActivityInfo> };
    low: { label: string; description?: string; activities?: Record<string, ActivityInfo> };
  };
  roles: Record<string, unknown>;
  balance_targets?: Record<string, unknown>;
  values?: Record<string, unknown>;
  tools?: Record<string, unknown>;
  background?: Record<string, unknown>;
  learning_observations?: {
    observations: LearningObservation[];
  };
  feedback_history?: {
    suggestions: FeedbackEntry[];
  };
  update_log?: {
    entries: UpdateLogEntry[];
  };
}

/** Profile validation result */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  required: boolean;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure the context directory exists
 */
function ensureContextDir(): void {
  if (!existsSync(CONTEXT_DIR)) {
    mkdirSync(CONTEXT_DIR, { recursive: true });
  }
}

/**
 * Get nested value from object using dot notation
 * @param obj - Object to traverse
 * @param path - Dot-notation path
 * @returns Value at path or undefined
 */
function getNestedValue(obj: any, path: string): unknown {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Set nested value in object using dot notation
 * @param obj - Object to modify
 * @param path - Dot-notation path
 * @param value - Value to set
 */
function setNestedValue(obj: any, path: string, value: unknown): void {
  const parts = path.split('.');
  const lastPart = parts.pop()!;
  let current = obj;

  for (const part of parts) {
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[lastPart] = value;
}

/**
 * Get current ISO 8601 datetime
 */
function getCurrentISO(): string {
  return new Date().toISOString();
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// CORE READ FUNCTIONS
// ============================================================================

/**
 * Get the full profile object.
 * @returns Full profile or null if profile doesn't exist
 */
export function getProfile(): Profile | null {
  if (!existsSync(PROFILE_PATH)) return null;

  try {
    const content = readFileSync(PROFILE_PATH, 'utf-8');
    return JSON.parse(content) as Profile;
  } catch (error) {
    console.error('Error reading profile:', error);
    return null;
  }
}

/**
 * Get a specific section of the profile.
 * @param section - Section name to retrieve
 * @returns Section data or null if not found
 */
export function getSection<T extends ProfileSection>(section: T): any | null {
  const profile = getProfile();
  if (!profile) return null;

  return (profile as any)[section] || null;
}

/**
 * Get a nested attribute using dot notation.
 * @param path - Dot-notation path (e.g., "identity.name", "neurotype.challenges")
 * @returns Value at path or undefined if not found
 * @example
 *   getAttribute("identity.name") // "Henrik"
 *   getAttribute("neurotype.challenges.0.label") // "task_initiation"
 *   getAttribute("roles.1.label") // "Developer"
 */
export function getAttribute(path: string): unknown {
  const profile = getProfile();
  if (!profile) return undefined;

  return getNestedValue(profile, path);
}

// ============================================================================
// WRITE FUNCTIONS
// ============================================================================

/**
 * Update a specific attribute in the profile.
 * Automatically logs the change to update_log.
 * @param input - Update parameters:
 *        - path: Dot-notation path to update
 *        - value: New value to set
 *        - source: Source of the change (user, auto_learn, setup_wizard, import)
 *        - reason: Optional reason for the change
 * @returns true if successful, false otherwise
 */
export function updateAttribute(
  input: { path: string; value: unknown; source: ChangeSource; reason?: string }
): boolean {
  const profile = getProfile();
  if (!profile) return false;

  const oldValue = getNestedValue(profile, input.path);
  setNestedValue(profile, input.path, input.value);

  // Ensure update_log exists
  if (!profile.update_log) {
    profile.update_log = { entries: [] };
  }

  // Create log entry
  const logEntry: UpdateLogEntry = {
    id: randomUUID(),
    timestamp: getCurrentISO(),
    path: input.path,
    old_value: oldValue,
    new_value: input.value,
    source: input.source,
    reason: input.reason,
  };

  profile.update_log.entries.push(logEntry);

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return true;
}

/**
 * Append an item to an array in the profile.
 * @param path - Dot-notation path to the array
 * @param item - Item to append
 * @param source - Source of the change
 * @returns true if successful, false if path is not an array
 */
export function appendToArray(
  path: string,
  item: unknown,
  source: ChangeSource
): boolean {
  const profile = getProfile();
  if (!profile) return false;

  let current = getNestedValue(profile, path);

  // If path doesn't exist, create an array
  if (current === undefined) {
    current = [];
    setNestedValue(profile, path, current);
  }

  // Verify it's an array
  if (!Array.isArray(current)) {
    return false;
  }

  // Append item
  current.push(item);

  // Log the change
  logChange({
    path: `${path}[${current.length - 1}]`,
    old_value: null,
    new_value: item,
    source,
    reason: 'Array item added',
  });

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return true;
}

/**
 * Log a profile change with timestamp.
 * @param change - Change details to log
 */
export function logChange(change: Omit<UpdateLogEntry, 'id' | 'timestamp'>): void {
  const profile = getProfile();
  if (!profile) return;

  // Ensure update_log exists
  if (!profile.update_log) {
    profile.update_log = { entries: [] };
  }

  // Create log entry
  const entry: UpdateLogEntry = {
    id: randomUUID(),
    timestamp: getCurrentISO(),
    ...change,
  };

  profile.update_log.entries.push(entry);

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a profile against the schema.
 * @param profile - Profile object to validate
 * @returns Validation result with errors and warnings
 */
export function validateProfile(profile: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!profile || typeof profile !== 'object') {
    errors.push({
      path: '',
      message: 'Profile must be an object',
      required: true,
    });
    return { valid: false, errors, warnings };
  }

  const p = profile as any;

  // Check required fields
  if (!p.identity || !p.identity.name) {
    errors.push({
      path: 'identity.name',
      message: 'Name is required',
      required: true,
    });
  }

  if (!p.time_definitions) {
    errors.push({
      path: 'time_definitions',
      message: 'Time definitions are required',
      required: true,
    });
  } else {
    const periods: TimePeriod[] = ['morning', 'noon', 'afternoon', 'evening', 'night'];
    for (const period of periods) {
      if (!p.time_definitions[period]) {
        errors.push({
          path: `time_definitions.${period}`,
          message: `${period} definition is required`,
          required: true,
        });
      }
    }
  }

  if (!p.energy_pattern) {
    errors.push({
      path: 'energy_pattern',
      message: 'Energy pattern is required',
      required: true,
    });
  } else {
    const levels: EnergyLevel[] = ['high', 'medium', 'low'];
    for (const level of levels) {
      if (!p.energy_pattern[level]) {
        errors.push({
          path: `energy_pattern.${level}`,
          message: `${level} energy definition is required`,
          required: true,
        });
      }
    }
  }

  if (!p.roles || Object.keys(p.roles).length === 0) {
    errors.push({
      path: 'roles',
      message: 'At least one role is required',
      required: true,
    });
  }

  // Warnings for optional but recommended fields
  if (!p.neurotype) {
    warnings.push({
      path: 'neurotype',
      message: 'Neurotype information helps AIDA adapt to your needs',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a profile has all required fields.
 * @param profile - Profile to check
 * @returns true if all required fields are present
 */
export function hasRequiredFields(profile: Profile): boolean {
  const result = validateProfile(profile);
  return result.valid;
}

// ============================================================================
// TIME & ENERGY FUNCTIONS
// ============================================================================

/**
 * Get the current time period based on user's time_definitions.
 * @returns Current time period or 'afternoon' as default
 */
export function getCurrentTimePeriod(): TimePeriod {
  const profile = getProfile();
  if (!profile || !profile.time_definitions) return 'afternoon';

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const periods: TimePeriod[] = ['morning', 'noon', 'afternoon', 'evening', 'night'];

  for (const period of periods) {
    const def = profile.time_definitions[period];
    if (!def) continue;

    const { start, end } = def;

    // Handle periods that cross midnight (e.g., night: 22:00-06:00)
    if (start > end) {
      if (currentTime >= start || currentTime < end) {
        return period;
      }
    } else {
      if (currentTime >= start && currentTime < end) {
        return period;
      }
    }
  }

  return 'afternoon';
}

/**
 * Get activities suitable for a given energy level.
 * @param level - Energy level to match
 * @returns Array of activity info objects
 */
export function getActivitiesForEnergy(level: EnergyLevel): ActivityInfo[] {
  const profile = getProfile();
  if (!profile || !profile.energy_pattern) return [];

  const energyDef = profile.energy_pattern[level];
  if (!energyDef || !energyDef.activities) return [];

  const activities: ActivityInfo[] = [];

  for (const [key, activity] of Object.entries(energyDef.activities)) {
    activities.push(activity as ActivityInfo);
  }

  return activities;
}

/**
 * Determine current energy level based on time and profile patterns.
 * @returns Current expected energy level
 */
export function getCurrentEnergyLevel(): EnergyLevel {
  const profile = getProfile();
  if (!profile || !profile.energy_pattern) return 'medium';

  const currentPeriod = getCurrentTimePeriod();

  // Find which energy level has activities matching the current period
  const levels: EnergyLevel[] = ['high', 'medium', 'low'];

  for (const level of levels) {
    const activities = getActivitiesForEnergy(level);
    for (const activity of activities) {
      if (activity.preferred_time === currentPeriod) {
        return level;
      }
    }
  }

  // Default heuristic: morning = high, afternoon = medium, evening/night = low
  switch (currentPeriod) {
    case 'morning':
      return 'high';
    case 'afternoon':
    case 'noon':
      return 'medium';
    case 'evening':
    case 'night':
      return 'low';
    default:
      return 'medium';
  }
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize a new profile with minimal required fields.
 * Creates the profile file with default structure.
 * @param basicData - Minimal required data for profile
 * @returns The created profile or null on failure
 */
export function initializeProfile(basicData: MinimalProfileData): Profile | null {
  if (existsSync(PROFILE_PATH)) {
    // Profile already exists, return it
    return getProfile();
  }

  const defaultTimeDefinitions: Record<TimePeriod, { start: string; end: string }> = {
    morning: { start: '06:00', end: '12:00' },
    noon: { start: '12:00', end: '14:00' },
    afternoon: { start: '14:00', end: '18:00' },
    evening: { start: '18:00', end: '22:00' },
    night: { start: '22:00', end: '06:00' },
  };

  const defaultEnergyPattern = {
    high: { label: 'Hög energi', description: 'Peak mental capacity' },
    medium: { label: 'Medium energi', description: 'Stable productivity' },
    low: { label: 'Låg energi', description: 'Rest and light tasks' },
  };

  const profile: Profile = {
    _meta: {
      purpose: 'User profile for AIDA',
      last_updated: getCurrentDate(),
    },
    identity: {
      name: basicData.name,
    },
    time_definitions: basicData.time_definitions || defaultTimeDefinitions,
    energy_pattern: {
      high: basicData.energy_pattern?.high || defaultEnergyPattern.high,
      medium: basicData.energy_pattern?.medium || defaultEnergyPattern.medium,
      low: basicData.energy_pattern?.low || defaultEnergyPattern.low,
    },
    roles: basicData.roles || {},
    learning_observations: { observations: [] },
    feedback_history: { suggestions: [] },
    update_log: { entries: [] },
  };

  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return profile;
}

/**
 * Check if a profile exists.
 * @returns true if profile file exists
 */
export function profileExists(): boolean {
  return existsSync(PROFILE_PATH);
}

/**
 * Get the path to the profile file.
 * @returns Absolute path to personal-profile.json
 */
export function getProfilePath(): string {
  return PROFILE_PATH;
}

// ============================================================================
// LEARNING OBSERVATION FUNCTIONS
// ============================================================================

/**
 * Add a new learning observation.
 * @param observation - Observation to add (id and timestamps are auto-generated)
 * @returns The created observation with generated fields
 */
export function addObservation(
  observation: Omit<LearningObservation, 'id' | 'first_observed' | 'last_confirmed'>
): LearningObservation {
  const profile = getProfile();
  if (!profile) {
    throw new Error('Profile does not exist');
  }

  // Ensure learning_observations exists
  if (!profile.learning_observations) {
    profile.learning_observations = { observations: [] };
  }

  const now = getCurrentDate();
  const newObservation: LearningObservation = {
    id: randomUUID(),
    first_observed: now,
    last_confirmed: now,
    ...observation,
  };

  profile.learning_observations.observations.push(newObservation);

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return newObservation;
}

/**
 * Update an existing observation (e.g., add evidence, update confidence).
 * @param id - Observation ID
 * @param updates - Fields to update
 * @returns true if successful
 */
export function updateObservation(
  id: string,
  updates: Partial<LearningObservation>
): boolean {
  const profile = getProfile();
  if (!profile || !profile.learning_observations) return false;

  const observation = profile.learning_observations.observations.find(o => o.id === id);
  if (!observation) return false;

  // Apply updates
  Object.assign(observation, updates);

  // Update last_confirmed timestamp
  observation.last_confirmed = getCurrentDate();

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return true;
}

/**
 * Get active observations for a category.
 * @param category - Optional category filter
 * @returns Array of matching observations
 */
export function getObservations(category?: ObservationCategory): LearningObservation[] {
  const profile = getProfile();
  if (!profile || !profile.learning_observations) return [];

  let observations = profile.learning_observations.observations;

  if (category) {
    observations = observations.filter(o => o.category === category);
  }

  return observations;
}

/**
 * Apply a suggested update from an observation to the profile.
 * @param observationId - ID of the observation with the suggestion
 * @returns true if applied successfully
 */
export function applyObservationSuggestion(observationId: string): boolean {
  const profile = getProfile();
  if (!profile || !profile.learning_observations) return false;

  const observation = profile.learning_observations.observations.find(o => o.id === observationId);
  if (!observation || !observation.suggested_update) return false;

  const { path, value, rationale } = observation.suggested_update;

  // Apply the update using updateAttribute
  const success = updateAttribute({ path, value, source: 'auto_learn', reason: rationale });

  if (success) {
    // Re-read profile to get the updated version
    const updatedProfile = getProfile();
    if (!updatedProfile || !updatedProfile.learning_observations) return false;

    // Mark observation as applied in the updated profile
    const obs = updatedProfile.learning_observations.observations.find(o => o.id === observationId);
    if (obs) {
      obs.status = 'applied';
      ensureContextDir();
      writeFileSync(PROFILE_PATH, JSON.stringify(updatedProfile, null, 2), 'utf-8');
    }
  }

  return success;
}

// ============================================================================
// FEEDBACK HISTORY FUNCTIONS
// ============================================================================

/**
 * Record a suggestion made to the user.
 * @param suggestion - Suggestion details (id and timestamp auto-generated)
 * @returns The recorded suggestion
 */
export function recordSuggestion(
  suggestion: Omit<FeedbackEntry, 'id' | 'timestamp'>
): FeedbackEntry {
  const profile = getProfile();
  if (!profile) {
    throw new Error('Profile does not exist');
  }

  // Ensure feedback_history exists
  if (!profile.feedback_history) {
    profile.feedback_history = { suggestions: [] };
  }

  const newSuggestion: FeedbackEntry = {
    id: randomUUID(),
    timestamp: getCurrentISO(),
    ...suggestion,
  };

  profile.feedback_history.suggestions.push(newSuggestion);

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return newSuggestion;
}

/**
 * Update the outcome of a suggestion.
 * @param id - Suggestion ID
 * @param outcome - User's response
 * @param feedback - Optional user feedback
 * @returns true if successful
 */
export function updateSuggestionOutcome(
  id: string,
  outcome: SuggestionOutcome,
  feedback?: string
): boolean {
  const profile = getProfile();
  if (!profile || !profile.feedback_history) return false;

  const suggestion = profile.feedback_history.suggestions.find(s => s.id === id);
  if (!suggestion) return false;

  suggestion.outcome = outcome;
  if (feedback) {
    suggestion.user_feedback = feedback;
  }

  // Write updated profile
  ensureContextDir();
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');

  return true;
}

/**
 * Get suggestion acceptance rate for a type.
 * @param type - Suggestion type to analyze
 * @returns Acceptance rate (0.0-1.0) or null if no data
 */
export function getSuggestionAcceptanceRate(type: SuggestionType): number | null {
  const profile = getProfile();
  if (!profile || !profile.feedback_history) return null;

  const suggestions = profile.feedback_history.suggestions.filter(s => s.type === type);
  if (suggestions.length === 0) return null;

  const accepted = suggestions.filter(s => s.outcome === 'accepted' || s.outcome === 'modified').length;

  return accepted / suggestions.length;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (import.meta.main) {
  const [, , command, ...args] = process.argv;

  if (!command) {
    console.log('Usage: profile.ts <command> [args...]');
    console.log('');
    console.log('Commands:');
    console.log('  getProfile');
    console.log('  getSection <section>');
    console.log('  getAttribute <path>');
    console.log('  getCurrentTimePeriod');
    console.log('  getCurrentEnergyLevel');
    console.log('  profileExists');
    process.exit(1);
  }

  try {
    let result: any;

    switch (command) {
      case 'getProfile':
        result = getProfile();
        break;
      case 'getSection':
        result = getSection(args[0] as ProfileSection);
        break;
      case 'getAttribute':
        result = getAttribute(args[0]);
        break;
      case 'getCurrentTimePeriod':
        result = getCurrentTimePeriod();
        break;
      case 'getCurrentEnergyLevel':
        result = getCurrentEnergyLevel();
        break;
      case 'profileExists':
        result = profileExists();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
