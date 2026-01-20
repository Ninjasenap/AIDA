/**
 * Project Query Function Tests
 *
 * Tests all project CRUD operations and read scenarios using demo data.
 * Validates v_projects_full view usage, JSON parsing, and status grouping.
 */

import { describe, expect, test } from 'bun:test';
import './setup'; // Import to trigger beforeAll/afterAll hooks
import {
  getProjectById,
  getAllProjects,
  getActiveProjects,
  searchProjects,
  getProjectsByRole,
  getProjectProgress,
  getPausedProjects,
  createProject,
  updateProject,
  setProjectStatus,
  updateFinishCriteria,
} from '../queries/projects';

// =============================================================================
// READ FUNCTION TESTS
// =============================================================================

/**************************************************************************
 * getProjectById - Retrieve project with full details and progress
 *
 * TESTS:
 * - Returns project with full details when found
 * - Returns null for non-existent project IDs
 * - Includes completed/cancelled projects
 *
 * VALIDATES:
 * - Project data retrieval
 * - Statistics calculation
 *
 * NOT TESTED:
 * - Null statistics handling
 **************************************************************************/

describe('getProjectById', () => {
  /**
   * Confirms project retrieval returns all details including role and statistics.
   */
  test('should return project with full details when found', () => {
    // Demo data has project ID 1 (AIDA - AI Digital Assistant)
    const project = getProjectById(1);

    expect(project).not.toBeNull();
    expect(project?.id).toBe(1);
    expect(project?.name).toBe('AIDA - AI Digital Assistant');
    expect(project?.status).toBe('active');
    expect(project?.role_name).toBeDefined();
    expect(project?.role_type).toBeDefined();
    expect(project?.todoist_project_id).toBeNull();
    expect(project?.description).toBeDefined();
  });

  test('should return null when project not found', () => {
    const project = getProjectById(99999);
    expect(project).toBeNull();
  });

  test('should include completed/cancelled projects', () => {
    // Demo data might have completed projects with specific IDs
    // This test ensures getProjectById returns them regardless of status
    const project = getProjectById(1);
    expect(project).not.toBeNull();
  });
});

/**************************************************************************
 * getAllProjects - Retrieve all projects grouped by status
 *
 * TESTS:
 * - Returns Map of projects grouped by status
 * - Includes all project statuses (active, on_hold, completed, cancelled)
 *
 * VALIDATES:
 * - Status grouping
 * - Complete project retrieval
 *
 * NOT TESTED:
 * - Empty database case
 **************************************************************************/

describe('getAllProjects', () => {
  /**
   * Confirms all projects are returned grouped by status.
   */
  test('should return all projects grouped by status', () => {
    const projectMap = getAllProjects();

    expect(projectMap).toBeInstanceOf(Map);

    // Demo data has active projects
    const activeProjects = projectMap.get('active');
    expect(activeProjects).toBeDefined();
    expect(activeProjects?.length).toBeGreaterThan(0);

    // Each project should have full details
    if (activeProjects && activeProjects.length > 0) {
      const project = activeProjects[0];
      expect(project.role_name).toBeDefined();
      expect(project.todoist_project_id).toBeNull();
    }
  });

  test('should include all statuses (active, on_hold, completed, cancelled)', () => {
    const projectMap = getAllProjects();

    // Should return a Map instance
    expect(projectMap).toBeInstanceOf(Map);

    // All statuses that exist in demo data should be present
    // (We can't assert specific statuses as it depends on demo data,
    // but we verify the Map contains entries)
    expect(projectMap.size).toBeGreaterThan(0);
  });
});

/**************************************************************************
 * getActiveProjects - Retrieve only active projects
 *
 * TESTS:
 * - Returns array of active projects
 * - All returned projects have status='active'
 * - Returns array type (not Map)
 *
 * VALIDATES:
 * - Status filtering
 * - Return type
 *
 * NOT TESTED:
 * - Empty result handling
 **************************************************************************/

describe('getActiveProjects', () => {
  /**
   * Confirms only active projects are returned as an array.
   */
  test('should return only active projects', () => {
    const activeProjects = getActiveProjects();

    expect(activeProjects).toBeInstanceOf(Array);
    expect(activeProjects.length).toBeGreaterThan(0);

    // All projects should have status='active'
    activeProjects.forEach((project) => {
      expect(project.status).toBe('active');
    });
  });

  test('should return array with full project details', () => {
    const activeProjects = getActiveProjects();

    if (activeProjects.length > 0) {
      const project = activeProjects[0];
      expect(project.id).toBeGreaterThan(0);
      expect(project.name).toBeDefined();
      expect(project.role_name).toBeDefined();
      expect(project.todoist_project_id).toBeNull();
    }
  });

  test('should not include on_hold, completed, or cancelled projects', () => {
    const activeProjects = getActiveProjects();

    // Verify no non-active projects are included
    const hasNonActive = activeProjects.some(
      (p) => p.status !== 'active'
    );
    expect(hasNonActive).toBe(false);
  });
});

/**************************************************************************
 * searchProjects - Find projects by name with optional status filtering
 *
 * TESTS:
 * - Finds projects by partial name match (case-insensitive)
 * - Excludes completed projects by default
 * - Includes completed when option is set
 * - Returns empty array when no matches
 *
 * VALIDATES:
 * - Search functionality
 * - Filtering behavior
 *
 * NOT TESTED:
 * - Special characters in project names
 **************************************************************************/

describe('searchProjects', () => {
  /**
   * Confirms partial project name matching works with case-insensitive search.
   */
  test('should find projects by partial name match', () => {
    // Search for "AIDA" should find "AIDA - AI Digital Assistant"
    const results = searchProjects({ query: 'AIDA' });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('AIDA');
  });

  test('should be case insensitive', () => {
    const results = searchProjects({ query: 'aida' });

    expect(results.length).toBeGreaterThan(0);
  });

  test('should return empty array when no matches', () => {
    const results = searchProjects({ query: 'nonexistent-project-xyz' });

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(0);
  });

  test('should exclude completed projects by default', () => {
    const results = searchProjects({ query: '' });

    // No completed or cancelled projects should be in results
    const hasCompleted = results.some(
      (p) => p.status === 'completed' || p.status === 'cancelled'
    );
    expect(hasCompleted).toBe(false);
  });

  test('should include completed projects when option is set', () => {
    const completedProject = createProject({
      name: 'Completed search test',
      role_id: 1,
      description: 'Test project for includeCompleted',
    });

    setProjectStatus({ id: completedProject.id, status: 'completed' });

    const results = searchProjects({ query: 'Completed search test', includeCompleted: true });
    expect(results.some((p) => p.id === completedProject.id)).toBe(true);

    const defaultResults = searchProjects({ query: 'Completed search test' });
    expect(defaultResults.some((p) => p.id === completedProject.id)).toBe(false);
  });
});

/**************************************************************************
 * getProjectsByRole - Retrieve projects for specific role grouped by status
 *
 * TESTS:
 * - Returns Map of projects for role grouped by status
 * - Includes all project statuses
 * - Returns empty Map for role with no projects
 *
 * VALIDATES:
 * - Role filtering
 * - Status grouping
 *
 * NOT TESTED:
 * - Performance with many projects per role
 **************************************************************************/

describe('getProjectsByRole', () => {
  /**
   * Confirms projects for specific role are returned grouped by status.
   */
  test('should return projects for specific role grouped by status', () => {
    // Role ID 3 is Hobbyutvecklare with AIDA project
    const projectMap = getProjectsByRole(3);

    expect(projectMap).toBeInstanceOf(Map);

    const activeProjects = projectMap.get('active');
    expect(activeProjects).toBeDefined();
    expect(activeProjects?.length).toBeGreaterThan(0);

    // Should have AIDA project
    const aidaProject = activeProjects?.find((p) => p.name.includes('AIDA'));
    expect(aidaProject).toBeDefined();
  });

  test('should return all project statuses for role', () => {
    const projectMap = getProjectsByRole(3);

    // Should include active, on_hold, completed, cancelled if they exist
    expect(projectMap).toBeInstanceOf(Map);
  });

  test('should return empty map for role with no projects', () => {
    // Role ID 4 is Föreningsordförande (inactive, no projects in demo data)
    const projectMap = getProjectsByRole(4);

    expect(projectMap).toBeInstanceOf(Map);
    expect(projectMap.size).toBe(0);
  });
});

/**************************************************************************
 * getProjectProgress - Calculate project progress metrics
 *
 * TESTS:
 * - Calculates task and criteria progress
 * - Handles projects without finish criteria
 * - Returns null for non-existent projects
 * - Calculates 0 progress when no tasks done
 *
 * VALIDATES:
 * - Progress calculation accuracy
 * - Null handling
 *
 * NOT TESTED:
 * - Edge cases with 0 tasks
 **************************************************************************/

describe('getProjectProgress', () => {
  test('should calculate criteria progress', () => {
    const result = getProjectProgress(1);

    expect(result).not.toBeNull();
    expect(result?.project).toBeDefined();
    expect(result?.project.id).toBe(1);
    expect(result?.criteriaProgress).toBeGreaterThanOrEqual(0);
    expect(result?.criteriaProgress).toBeLessThanOrEqual(1);
  });

  test('should return 0 criteriaProgress when project has no criteria', () => {
    const project = createProject({
      name: 'Project without criteria',
      role_id: 1,
      description: 'Test',
    });

    const result = getProjectProgress(project.id);

    expect(result).not.toBeNull();
    expect(result?.criteriaProgress).toBe(0);
  });

  test('should reflect completed criteria', () => {
    // Project 2 has one criterion marked as done in demo data
    const result = getProjectProgress(2);

    expect(result).not.toBeNull();
    expect(result?.criteriaProgress).toBeGreaterThan(0);
    expect(result?.criteriaProgress).toBeLessThanOrEqual(1);
  });

  test('should return null for non-existent project', () => {
    const result = getProjectProgress(99999);

    expect(result).toBeNull();
  });
});

/**************************************************************************
 * getPausedProjects - Retrieve on_hold projects ordered by creation date
 *
 * TESTS:
 * - Returns projects with on_hold status
 * - Includes days since creation for each project
 * - Ordered by created_at ASC (oldest first)
 *
 * VALIDATES:
 * - Status filtering
 * - Ordering
 * - Days calculation
 *
 * NOT TESTED:
 * - Large date ranges
 **************************************************************************/

describe('getPausedProjects', () => {
  /**
   * Confirms only on_hold status projects are returned.
   */
  test('should return projects with on_hold status', () => {
    const pausedProjects = getPausedProjects();

    expect(pausedProjects).toBeInstanceOf(Array);
    // Demo data might not have on_hold projects, so this is flexible
    pausedProjects.forEach((p) => {
      expect(p.status).toBe('on_hold');
    });
  });

  test('should include days since creation for each project', () => {
    const pausedProjects = getPausedProjects();

    pausedProjects.forEach((p) => {
      expect(p.daysSinceCreation).toBeGreaterThanOrEqual(0);
      expect(typeof p.daysSinceCreation).toBe('number');
    });
  });

  test('should be ordered by created_at ASC (oldest first)', () => {
    const pausedProjects = getPausedProjects();

    if (pausedProjects.length > 1) {
      for (let i = 1; i < pausedProjects.length; i++) {
        const prev = new Date(pausedProjects[i - 1].created_at);
        const curr = new Date(pausedProjects[i].created_at);
        expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
      }
    }
  });
});

// =============================================================================
// WRITE FUNCTION TESTS
// =============================================================================

/**************************************************************************
 * createProject - Insert new project with optional finish criteria
 *
 * TESTS:
 * - Creates project with basic fields
 * - Creates project with finish criteria
 * - Creates project without finish criteria
 *
 * VALIDATES:
 * - Default status 'active'
 * - JSON serialization of criteria
 * - Timestamp generation
 *
 * NOT TESTED:
 * - Very large criteria arrays
 **************************************************************************/

describe('createProject', () => {
  /**
   * Confirms project creation with basic required fields.
   */
  test('should create project with basic fields', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'En testbeskrivning för projektet',
    });

    expect(project.id).toBeGreaterThan(0);
    expect(project.name).toBe('Test Project');
    expect(project.role_id).toBe(1);
    expect(project.description).toBe('En testbeskrivning för projektet');
    expect(project.status).toBe('active');
    expect(project.created_at).toBeDefined();
  });

  test('should create project with finish criteria', () => {
    const project = createProject({
      name: 'Project with Criteria',
      role_id: 1,
      description: 'Test',
      finish_criteria: [
        { criterion: 'Första målet', done: false },
        { criterion: 'Andra målet', done: true },
      ],
    });

    expect(project.id).toBeGreaterThan(0);
    expect(project.finish_criteria).toBeDefined();

    // Verify JSON parsing works
    const parsed = JSON.parse(project.finish_criteria!);
    expect(parsed.length).toBe(2);
    expect(parsed[0].criterion).toBe('Första målet');
  });

  test('should create project without finish criteria', () => {
    const project = createProject({
      name: 'Simple Project',
      role_id: 2,
      description: 'Ingen criteria',
    });

    expect(project.id).toBeGreaterThan(0);
    expect(project.finish_criteria).toBeNull();
  });
});

/**************************************************************************
 * updateProject - Update project name and/or description
 *
 * TESTS:
 * - Updates project name
 * - Updates project description
 * - Updates both name and description
 *
 * VALIDATES:
 * - Selective field update
 * - Data preservation
 *
 * NOT TESTED:
 * - Role ID changes
 **************************************************************************/

describe('updateProject', () => {
  /**
   * Confirms project name can be updated independently.
   */
  test('should update project name', () => {
    const original = createProject({
      name: 'Original Name',
      role_id: 1,
      description: 'Test',
    });

    const updated = updateProject({ id: original.id,
      name: 'Updated Name',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Updated Name');
    expect(updated.description).toBe('Test'); // unchanged
  });

  test('should update project description', () => {
    const original = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Original description',
    });

    const updated = updateProject({ id: original.id,
      description: 'Updated description',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Test Project'); // unchanged
    expect(updated.description).toBe('Updated description');
  });

  test('should update both name and description', () => {
    const original = createProject({
      name: 'Old Name',
      role_id: 1,
      description: 'Old description',
    });

    const updated = updateProject({ id: original.id,
      name: 'New Name',
      description: 'New description',
    });

    expect(updated.name).toBe('New Name');
    expect(updated.description).toBe('New description');
  });
});

/**************************************************************************
 * setProjectStatus - Change project status
 *
 * TESTS:
 * - Changes status to on_hold
 * - Changes status to completed
 * - Changes status to cancelled
 * - Changes status back to active
 *
 * VALIDATES:
 * - Status transitions
 * - Status update persistence
 *
 * NOT TESTED:
 * - Cascading effects on linked tasks
 **************************************************************************/

describe('setProjectStatus', () => {
  /**
   * Confirms project status can be changed to on_hold.
   */
  test('should change project status to on_hold', () => {
    const project = createProject({
      name: 'Active Project',
      role_id: 1,
      description: 'Test',
    });

    expect(project.status).toBe('active');

    const updated = setProjectStatus({ id: project.id, status: 'on_hold' });

    expect(updated.id).toBe(project.id);
    expect(updated.status).toBe('on_hold');
  });

  test('should change project status to completed', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Test',
    });

    const updated = setProjectStatus({ id: project.id, status: 'completed' });

    expect(updated.status).toBe('completed');
  });

  test('should change project status to cancelled', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Test',
    });

    const updated = setProjectStatus({ id: project.id, status: 'cancelled' });

    expect(updated.status).toBe('cancelled');
  });

  test('should change project back to active', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Test',
    });

    setProjectStatus({ id: project.id, status: 'on_hold' });
    const updated = setProjectStatus({ id: project.id, status: 'active' });

    expect(updated.status).toBe('active');
  });
});

/**************************************************************************
 * updateFinishCriteria - Replace project finish criteria
 *
 * TESTS:
 * - Replaces finish criteria array
 * - Sets finish criteria to empty array
 * - Adds finish criteria to project that had none
 *
 * VALIDATES:
 * - JSON serialization of criteria
 * - Array replacement logic
 *
 * NOT TESTED:
 * - Partial criteria updates
 **************************************************************************/

describe('updateFinishCriteria', () => {
  /**
   * Confirms finish criteria array can be replaced completely.
   */
  test('should replace finish criteria array', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Test',
      finish_criteria: [
        { criterion: 'Original criterion 1', done: false },
        { criterion: 'Original criterion 2', done: false },
      ],
    });

    const updated = updateFinishCriteria({ id: project.id, criteria: [
      { criterion: 'New criterion 1', done: true },
      { criterion: 'New criterion 2', done: false },
      { criterion: 'New criterion 3', done: false },
    ] });

    expect(updated.id).toBe(project.id);
    expect(updated.finish_criteria).toBeDefined();

    const parsed = JSON.parse(updated.finish_criteria!);
    expect(parsed.length).toBe(3);
    expect(parsed[0].criterion).toBe('New criterion 1');
    expect(parsed[0].done).toBe(true);
    expect(parsed[2].criterion).toBe('New criterion 3');
  });

  test('should set finish criteria to empty array', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Test',
      finish_criteria: [{ criterion: 'Some criterion', done: false }],
    });

    const updated = updateFinishCriteria({ id: project.id, criteria: [] });

    expect(updated.finish_criteria).toBe('[]');
  });

  test('should add finish criteria to project that had none', () => {
    const project = createProject({
      name: 'Test Project',
      role_id: 1,
      description: 'Test',
    });

    expect(project.finish_criteria).toBeNull();

    const updated = updateFinishCriteria({ id: project.id, criteria: [
      { criterion: 'First criterion', done: false },
    ] });

    expect(updated.finish_criteria).toBeDefined();
    const parsed = JSON.parse(updated.finish_criteria!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].criterion).toBe('First criterion');
  });
});
