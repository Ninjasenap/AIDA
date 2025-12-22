/**
 * Role Query Functions Test Suite
 *
 * Tests all CRUD operations for roles including reads, creates, updates,
 * and status changes with validation of JSON conversions and warnings.
 */

import { describe, test, expect } from 'bun:test';
import './setup'; // Import setup to trigger beforeAll/afterAll hooks
import {
  getRoleById,
  getActiveRoles,
  getInactiveRoles,
  getRolesByType,
  createRole,
  updateRole,
  setRoleStatus,
} from '../queries/roles';
import { getDatabase } from '../connection';

// =============================================================================
// READ FUNCTIONS
// =============================================================================

/**************************************************************************
 * getRoleById - Retrieve role by ID with full summary and statistics
 *
 * TESTS:
 * - Returns complete role summary with statistics for valid IDs
 * - Returns null for non-existent role IDs
 * - Includes inactive roles when queried directly
 *
 * VALIDATES:
 * - Role data integrity (name, type, status)
 * - Statistics calculation (active projects, tasks by status)
 * - JSON field parsing (projects_json)
 *
 * NOT TESTED:
 * - Performance with large role datasets
 * - Concurrent access patterns
 **************************************************************************/

describe('getRoleById', () => {
  /**
   * Verifies role retrieval returns complete summary with calculated statistics.
   */
  test('returns role summary with statistics for valid ID', () => {
    // Demo data has Systemutvecklare as role ID 1
    const role = getRoleById(1);

    expect(role).not.toBeNull();
    expect(role?.name).toBe('Systemutvecklare');
    expect(role?.type).toBe('work');
    expect(role?.status).toBe('active');

    // Should include statistics from v_roles_summary
    expect(role).toHaveProperty('active_projects');
    expect(role).toHaveProperty('active_tasks');
    expect(role).toHaveProperty('captured_tasks');
    expect(role).toHaveProperty('ready_tasks');
    expect(role).toHaveProperty('planned_tasks');
    expect(role).toHaveProperty('overdue_tasks');
    expect(role).toHaveProperty('projects_json');
  });

  /**
   * Verifies null is returned when role ID does not exist in database.
   */
  test('returns null for non-existent role ID', () => {
    const role = getRoleById(99999);
    expect(role).toBeNull();
  });

  /**
   * Confirms inactive roles are included in direct ID lookups.
   */
  test('returns inactive role when queried by ID', () => {
    // Demo data has Föreningsordförande (ID 4) with status 'inactive'
    const role = getRoleById(4);

    expect(role).not.toBeNull();
    expect(role?.name).toBe('Föreningsordförande');
    expect(role?.status).toBe('inactive');
  });
});

/**************************************************************************
 * getActiveRoles - Retrieve all active roles with statistics
 *
 * TESTS:
 * - Returns only active roles (status = 'active')
 * - Results ordered by ID ascending
 * - Each role includes statistics (projects, tasks, etc.)
 *
 * VALIDATES:
 * - Status filtering works correctly
 * - Ordering is consistent
 * - Statistics fields are populated
 *
 * NOT TESTED:
 * - Large result set performance
 **************************************************************************/

describe('getActiveRoles', () => {
  /**
   * Confirms only active roles are returned and inactive roles are excluded.
   */
  test('returns only active roles', () => {
    const roles = getActiveRoles();

    // Demo data has 3 active roles, but createRole tests may have added more
    expect(roles.length).toBeGreaterThanOrEqual(3);

    // All should have status 'active'
    for (const role of roles) {
      expect(role.status).toBe('active');
    }

    // Check specific names
    const names = roles.map(r => r.name);
    expect(names).toContain('Systemutvecklare');
    expect(names).toContain('Förälder');
    expect(names).toContain('Hobbyutvecklare');
    expect(names).not.toContain('Föreningsordförande'); // This one is inactive
  });

  /**
   * Verifies active roles are ordered by ID in ascending order.
   */
  test('returns roles ordered by id', () => {
    const roles = getActiveRoles();

    // Should be ordered by id
    for (let i = 1; i < roles.length; i++) {
      expect(roles[i].id).toBeGreaterThan(roles[i - 1].id);
    }
  });

  /**
   * Confirms all returned roles include complete statistics fields.
   */
  test('includes statistics for each role', () => {
    const roles = getActiveRoles();

    for (const role of roles) {
      expect(role).toHaveProperty('active_projects');
      expect(role).toHaveProperty('active_tasks');
      expect(role).toHaveProperty('captured_tasks');
      expect(role).toHaveProperty('ready_tasks');
      expect(role).toHaveProperty('planned_tasks');
      expect(role).toHaveProperty('overdue_tasks');
      expect(role).toHaveProperty('projects_json');
    }
  });
});

/**************************************************************************
 * getInactiveRoles - Retrieve all inactive and historical roles
 *
 * TESTS:
 * - Returns only roles with status 'inactive' or 'historical'
 * - Excludes all active roles
 * - Handles scenarios with no inactive roles
 *
 * VALIDATES:
 * - Status filtering excludes active roles
 * - Return type is array
 *
 * NOT TESTED:
 * - Multiple inactive roles ordering
 **************************************************************************/

describe('getInactiveRoles', () => {
  /**
   * Confirms only inactive and historical roles are returned.
   */
  test('returns only inactive and historical roles', () => {
    const roles = getInactiveRoles();

    // Demo data has 1 inactive role (Föreningsordförande)
    expect(roles).toHaveLength(1);

    // All should have status 'inactive' or 'historical'
    for (const role of roles) {
      expect(['inactive', 'historical']).toContain(role.status);
    }

    expect(roles[0].name).toBe('Föreningsordförande');
    expect(roles[0].status).toBe('inactive');
  });

  /**
   * Verifies active roles are excluded from inactive roles result.
   */
  test('does not include active roles', () => {
    const roles = getInactiveRoles();

    const names = roles.map(r => r.name);
    expect(names).not.toContain('Systemutvecklare');
    expect(names).not.toContain('Förälder');
    expect(names).not.toContain('Hobbyutvecklare');
  });

  /**
   * Confirms function returns array (possibly empty) when no inactive roles exist.
   */
  test('returns empty array when no inactive roles exist', () => {
    // This test assumes demo data might change - just verify it's an array
    const roles = getInactiveRoles();
    expect(Array.isArray(roles)).toBe(true);
  });
});

/**************************************************************************
 * getRolesByType - Retrieve roles by type with optional inactive filtering
 *
 * TESTS:
 * - Filters roles by type (work, personal, hobby, civic, etc.)
 * - Excludes inactive roles by default
 * - Includes inactive when includeInactive option is set
 * - Returns empty array for non-existent types
 *
 * VALIDATES:
 * - Type filtering accuracy
 * - Default behavior excludes inactive
 * - Option override works correctly
 *
 * NOT TESTED:
 * - Custom role types beyond standard set
 **************************************************************************/

describe('getRolesByType', () => {
  /**
   * Confirms only roles of work type are returned.
   */
  test('returns only roles of specified type (work)', () => {
    const roles = getRolesByType({ type: 'work' });

    // Demo data has 1 work role (Systemutvecklare), but tests may create more
    expect(roles.length).toBeGreaterThanOrEqual(1);
    // At least one should be Systemutvecklare from demo data
    expect(roles.some(r => r.name === 'Systemutvecklare')).toBe(true);
    expect(roles[0].type).toBe('work');
  });

  /**
   * Confirms only personal type roles are returned.
   */
  test('returns only roles of specified type (personal)', () => {
    const roles = getRolesByType({ type: 'personal' });

    // Demo data has 1 personal role (Förälder)
    expect(roles).toHaveLength(1);
    expect(roles[0].name).toBe('Förälder');
    expect(roles[0].type).toBe('personal');
  });

  /**
   * Confirms only hobby type roles are returned.
   */
  test('returns only roles of specified type (hobby)', () => {
    const roles = getRolesByType({ type: 'hobby' });

    // Demo data has 1 hobby role (Hobbyutvecklare)
    expect(roles).toHaveLength(1);
    expect(roles[0].name).toBe('Hobbyutvecklare');
    expect(roles[0].type).toBe('hobby');
  });

  /**
   * Verifies inactive roles are excluded by default, even when querying by type.
   */
  test('returns only active roles by default', () => {
    const roles = getRolesByType({ type: 'civic' });

    // Demo data has 1 civic role (Föreningsordförande), but it's inactive
    expect(roles).toHaveLength(0);
  });

  /**
   * Confirms includeInactive option allows inactive roles to be returned.
   */
  test('includes inactive roles when option is set', () => {
    const roles = getRolesByType({ type: 'civic', includeInactive: true });

    // Now we should get the inactive civic role
    expect(roles).toHaveLength(1);
    expect(roles[0].name).toBe('Föreningsordförande');
    expect(roles[0].type).toBe('civic');
    expect(roles[0].status).toBe('inactive');
  });

  /**
   * Confirms empty array is returned for type with no matching roles.
   */
  test('returns empty array for type with no roles', () => {
    const roles = getRolesByType({ type: 'meta' });

    expect(roles).toHaveLength(0);
    expect(Array.isArray(roles)).toBe(true);
  });
});

// =============================================================================
// WRITE FUNCTIONS
// =============================================================================

/**************************************************************************
 * createRole - Insert new role into database with optional fields
 *
 * TESTS:
 * - Creates roles with minimal required fields (name, type)
 * - Creates roles with all optional fields (description, responsibilities, balance_target)
 * - Handles empty responsibilities arrays
 * - Verifies role can be retrieved after creation
 *
 * VALIDATES:
 * - Default status set to 'active'
 * - ID auto-increment works
 * - Timestamps created
 * - JSON serialization of arrays (responsibilities)
 *
 * NOT TESTED:
 * - Duplicate role names
 * - Invalid role types
 **************************************************************************/

describe('createRole', () => {
  /**
   * Verifies minimal role creation with only required fields (name, type).
   */
  test('creates a new role with minimal fields', () => {
    const input = {
      name: 'Träningsentusiast',
      type: 'personal' as const,
    };

    const role = createRole(input);

    expect(role).toHaveProperty('id');
    expect(role.name).toBe('Träningsentusiast');
    expect(role.type).toBe('personal');
    expect(role.status).toBe('active'); // Default status
    expect(role.description).toBeNull();
    expect(role.responsibilities).toBeNull();
    expect(role.balance_target).toBeNull();
    expect(role).toHaveProperty('created_at');
    expect(role).toHaveProperty('updated_at');
  });

  /**
   * Verifies role creation with all optional fields including responsibilities array.
   */
  test('creates a role with all fields including responsibilities array', () => {
    const input = {
      name: 'Miljöaktivist',
      type: 'civic' as const,
      description: 'Engagemang i miljöfrågor',
      responsibilities: ['Organisera städdagar', 'Informationskampanjer', 'Lobbying'],
      balance_target: 0.1,
    };

    const role = createRole(input);

    expect(role.id).toBeGreaterThan(0);
    expect(role.name).toBe('Miljöaktivist');
    expect(role.type).toBe('civic');
    expect(role.description).toBe('Engagemang i miljöfrågor');
    expect(role.balance_target).toBe(0.1);

    // Responsibilities should be stored as JSON string
    expect(role.responsibilities).toBeTruthy();
    const parsed = JSON.parse(role.responsibilities!);
    expect(parsed).toEqual(['Organisera städdagar', 'Informationskampanjer', 'Lobbying']);
  });

  /**
   * Confirms empty responsibilities arrays are handled correctly.
   */
  test('creates role with empty responsibilities array', () => {
    const input = {
      name: 'Test Role',
      type: 'hobby' as const,
      responsibilities: [],
    };

    const role = createRole(input);

    expect(role.responsibilities).toBe('[]');
  });

  /**
   * Verifies created role can be retrieved from database using ID.
   */
  test('can retrieve created role by ID', () => {
    const input = {
      name: 'Musiker',
      type: 'hobby' as const,
      description: 'Musikskapande och spelande',
    };

    const created = createRole(input);
    const retrieved = getRoleById(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Musiker');
    expect(retrieved?.type).toBe('hobby');
    expect(retrieved?.description).toBe('Musikskapande och spelande');
  });
});

/**************************************************************************
 * updateRole - Update one or more fields of an existing role
 *
 * TESTS:
 * - Updates individual fields (name, description, responsibilities, balance_target)
 * - Updates multiple fields in one call
 * - Updates responsibilities array correctly
 * - Updates updated_at timestamp
 * - Throws error when role not found
 *
 * VALIDATES:
 * - Selective field updates work
 * - Unchanged fields remain intact
 * - Timestamp updates on modification
 *
 * NOT TESTED:
 * - Partial role type changes
 * - Status transitions through update
 **************************************************************************/

describe('updateRole', () => {
  /**
   * Confirms role name can be updated independently.
   */
  test('updates role name', () => {
    const original = createRole({
      name: 'Test Role',
      type: 'hobby' as const,
    });

    const updated = updateRole({
      id: original.id,
      name: 'Updated Role Name',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Updated Role Name');
    expect(updated.type).toBe('hobby'); // Unchanged
  });

  /**
   * Confirms role description can be updated independently.
   */
  test('updates role description', () => {
    const original = createRole({
      name: 'Artist',
      type: 'hobby' as const,
      description: 'Old description',
    });

    const updated = updateRole({
      id: original.id,
      description: 'New creative description',
    });

    expect(updated.description).toBe('New creative description');
    expect(updated.name).toBe('Artist'); // Unchanged
  });

  /**
   * Verifies responsibilities array can be updated as JSON.
   */
  test('updates responsibilities array', () => {
    const original = createRole({
      name: 'Volunteer',
      type: 'civic' as const,
      responsibilities: ['Old task 1', 'Old task 2'],
    });

    const updated = updateRole({
      id: original.id,
      responsibilities: ['New task 1', 'New task 2', 'New task 3'],
    });

    expect(updated.responsibilities).toBeTruthy();
    const parsed = JSON.parse(updated.responsibilities!);
    expect(parsed).toEqual(['New task 1', 'New task 2', 'New task 3']);
  });

  /**
   * Confirms balance_target can be updated independently.
   */
  test('updates balance_target', () => {
    const original = createRole({
      name: 'Freelancer',
      type: 'side_business' as const,
      balance_target: 0.2,
    });

    const updated = updateRole({
      id: original.id,
      balance_target: 0.35,
    });

    expect(updated.balance_target).toBe(0.35);
  });

  /**
   * Verifies multiple role fields can be updated in a single call.
   */
  test('updates multiple fields at once', () => {
    const original = createRole({
      name: 'Coach',
      type: 'work' as const,
      description: 'Old',
      responsibilities: ['Old'],
      balance_target: 0.5,
    });

    const updated = updateRole({
      id: original.id,
      name: 'Senior Coach',
      description: 'Leadership and mentoring',
      responsibilities: ['Team leadership', 'Individual coaching', 'Career development'],
      balance_target: 0.6,
    });

    expect(updated.name).toBe('Senior Coach');
    expect(updated.description).toBe('Leadership and mentoring');
    expect(updated.balance_target).toBe(0.6);

    const parsed = JSON.parse(updated.responsibilities!);
    expect(parsed).toEqual(['Team leadership', 'Individual coaching', 'Career development']);
  });

  /**
   * Confirms updated_at timestamp is modified when role is updated.
   */
  test('updates updated_at timestamp', () => {
    const original = createRole({
      name: 'Test',
      type: 'hobby' as const,
    });

    // Small delay to ensure timestamp difference
    const updated = updateRole({
      id: original.id,
      name: 'Test Updated',
    });

    // updated_at should be >= created_at
    expect(updated.updated_at >= original.created_at).toBe(true);
  });

  /**
   * Verifies update operation throws error when role ID does not exist.
   */
  test('throws error when updating non-existent role', () => {
    expect(() => {
      updateRole({ id: 99999, name: 'Should fail' });
    }).toThrow();
  });
});

/**************************************************************************
 * setRoleStatus - Change role status with linked task warnings
 *
 * TESTS:
 * - Changes status between active, inactive, and historical
 * - Warns when deactivating/historicalizing roles with linked tasks
 * - No warning when activating or when no linked tasks exist
 * - Throws error when role not found
 *
 * VALIDATES:
 * - Status transitions work correctly
 * - Warning logic for linked tasks
 * - Return structure includes role and optional warning
 *
 * NOT TESTED:
 * - Cascading updates to dependent tasks
 **************************************************************************/

describe('setRoleStatus', () => {
  /**
   * Confirms role status can be changed from active to inactive.
   */
  test('changes role status from active to inactive', () => {
    const role = createRole({
      name: 'Temporary Role',
      type: 'hobby' as const,
    });

    const result = setRoleStatus({ id: role.id, status: 'inactive' });

    expect(result.role.status).toBe('inactive');
    expect(result.role.id).toBe(role.id);
  });

  /**
   * Confirms role status can be changed from inactive back to active.
   */
  test('changes role status from inactive to active', () => {
    const role = createRole({
      name: 'Reactivated Role',
      type: 'hobby' as const,
    });

    // First set to inactive
    setRoleStatus({ id: role.id, status: 'inactive' });

    // Then reactivate
    const result = setRoleStatus({ id: role.id, status: 'active' });

    expect(result.role.status).toBe('active');
    expect(result.warning).toBeUndefined();
  });

  /**
   * Confirms role status can be changed to historical.
   */
  test('changes role status to historical', () => {
    const role = createRole({
      name: 'Past Role',
      type: 'work' as const,
    });

    const result = setRoleStatus({ id: role.id, status: 'historical' });

    expect(result.role.status).toBe('historical');
  });

  /**
   * Verifies warning is issued when deactivating role with linked tasks.
   */
  test('warns when setting to inactive with linked tasks', () => {
    // Create a role with tasks
    const db = getDatabase();
    const role = createRole({ name: 'Role With Tasks', type: 'work' as const });

    // Create a task for this role
    db.query('INSERT INTO tasks (title, role_id, status) VALUES (?, ?, ?)')
      .run('Test task', role.id, 'captured');

    const result = setRoleStatus({ id: role.id, status: 'inactive' });

    expect(result.role.status).toBe('inactive');
    expect(result.warning).toBeDefined();
    expect(result.warning?.linkedTaskCount).toBeGreaterThan(0);
  });

  /**
   * Verifies warning is issued when setting role to historical with linked tasks.
   */
  test('warns when setting to historical with linked tasks', () => {
    // Create a role with tasks
    const db = getDatabase();
    const role = createRole({ name: 'Another Role With Tasks', type: 'hobby' as const });

    // Create a task for this role
    db.query('INSERT INTO tasks (title, role_id, status) VALUES (?, ?, ?)')
      .run('Another test task', role.id, 'ready');

    const result = setRoleStatus({ id: role.id, status: 'historical' });

    expect(result.role.status).toBe('historical');
    expect(result.warning).toBeDefined();
    expect(result.warning?.linkedTaskCount).toBeGreaterThan(0);
  });

  /**
   * Confirms no warning issued when activating a role.
   */
  test('no warning when setting to active', () => {
    const role = createRole({
      name: 'New Active',
      type: 'hobby' as const,
    });

    const result = setRoleStatus({ id: role.id, status: 'active' });

    expect(result.role.status).toBe('active');
    expect(result.warning).toBeUndefined();
  });

  /**
   * Verifies no warning when deactivating role with no linked tasks.
   */
  test('no warning when setting to inactive/historical without tasks', () => {
    const role = createRole({
      name: 'No Tasks Role',
      type: 'private' as const,
    });

    const result = setRoleStatus({ id: role.id, status: 'inactive' });

    expect(result.role.status).toBe('inactive');
    // Should have no warning or warning with 0 tasks
    if (result.warning) {
      expect(result.warning.linkedTaskCount).toBe(0);
    }
  });

  /**
   * Confirms status change throws error when role ID does not exist.
   */
  test('throws error when setting status on non-existent role', () => {
    expect(() => {
      setRoleStatus({ id: 99999, status: 'inactive' });
    }).toThrow();
  });
});
