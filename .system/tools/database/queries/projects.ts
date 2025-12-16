/**
 * Project Query Functions
 *
 * Complete CRUD operations for projects with goal tracking and progress metrics.
 * Provides 12 query functions: 7 READ operations for retrieving and analyzing projects,
 * and 5 WRITE operations for creating, updating, and managing project status and criteria.
 *
 * READ functions support filtering by:
 * - ID, name (search), role association, paused (on_hold) status
 * - Progress metrics: task completion percentage, finish criteria completion
 * - All return projects from v_projects_full view with aggregated task data
 *
 * WRITE functions provide:
 * - Project creation with optional finish criteria
 * - Partial updates for name and description
 * - Status lifecycle management (active, on_hold, completed, cancelled)
 * - Finish criteria management (replace entire set with new criteria)
 *
 * Database connection uses SQLite with bun:sqlite.
 * All queries are parameterized to prevent SQL injection.
 */
import { getDatabase } from '../connection';
import {
  groupBy,
  parseFinishCriteria,
  PROJECT_STATUS_ORDER,
} from '../helpers';
import type {
  Project,
  ProjectFull,
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
  FinishCriterion,
} from '../types';

// =============================================================================
// PROJECT QUERIES - READ
// =============================================================================

/**
 * Retrieves a specific project by ID from the projects view.
 *
 * Fetches complete project information including calculated fields (task counts,
 * completion status) from the denormalized v_projects_full view. Returns null if
 * project doesn't exist.
 *
 * @param id - The unique project identifier
 * @returns Complete project object with all calculated fields, or null if not found
 *
 * @example
 * const project = getProjectById(1);
 * if (project) {
 *   console.log(project.name, project.done_tasks, project.total_tasks);
 * }
 */
export function getProjectById(id: number): ProjectFull | null {
  const db = getDatabase();
  const project = db
    .query('SELECT * FROM v_projects_full WHERE id = ?')
    .get(id) as ProjectFull | undefined;

  return project ?? null;
}

/**
 * Retrieves all projects, grouped by status.
 *
 * Fetches projects from the v_projects_full view and groups them into a Map
 * keyed by project status. By default excludes completed projects; pass
 * `includeCompleted: true` to include them. Results are ordered by status
 * and creation timestamp.
 *
 * @param options - Optional query configuration
 * @param options.includeCompleted - If true, includes 'completed' and 'cancelled' projects
 *                                    Default: false (returns only 'active' and 'on_hold')
 * @returns Map with ProjectStatus keys and arrays of ProjectFull values, grouped by status
 *
 * @example
 * const projectsByStatus = getAllProjects();
 * const activeProjects = projectsByStatus.get('active') || [];
 *
 * const allProjects = getAllProjects({ includeCompleted: true });
 */
export function getAllProjects(options?: {
  includeCompleted?: boolean;
}): Map<ProjectStatus, ProjectFull[]> {
  const db = getDatabase();

  let query = 'SELECT * FROM v_projects_full';
  if (!options?.includeCompleted) {
    query += " WHERE status IN ('active', 'on_hold')";
  }
  query += ' ORDER BY status, created_at';

  const projects = db.query(query).all() as ProjectFull[];

  return groupBy(projects, (p) => p.status);
}

/**
 * Searches for projects by name using case-insensitive fuzzy matching.
 *
 * Performs a LIKE search on project names (COLLATE NOCASE for case-insensitive
 * matching). By default only searches active and on_hold projects; use
 * `includeCompleted: true` to include completed/cancelled projects in results.
 *
 * @param query - Search string to match against project names (substring match)
 * @param options - Optional search configuration
 * @param options.includeCompleted - If true, searches all projects including completed ones
 *                                    Default: false
 * @returns Array of matching ProjectFull objects, or empty array if no matches
 *
 * @example
 * const results = searchProjects('Marketing');
 * results.forEach(p => console.log(p.name));
 */
export function searchProjects(
  query: string,
  options?: { includeCompleted?: boolean }
): ProjectFull[] {
  const db = getDatabase();

  let sql =
    "SELECT * FROM v_projects_full WHERE name LIKE '%' || ? || '%' COLLATE NOCASE";
  if (!options?.includeCompleted) {
    sql += " AND status IN ('active', 'on_hold')";
  }

  const projects = db.query(sql).all(query) as ProjectFull[];

  return projects;
}

/**
 * Retrieves all projects associated with a specific role, grouped by status.
 *
 * Fetches projects from the v_projects_full view filtered by role_id and groups
 * them by status. Includes projects in all statuses (active, on_hold, completed,
 * cancelled). Results are ordered by status and project ID.
 *
 * @param roleId - The unique identifier of the role to filter by
 * @returns Map with ProjectStatus keys and arrays of ProjectFull values for the role
 *
 * @example
 * const projectsByStatus = getProjectsByRole(1);
 * const activeProjects = projectsByStatus.get('active') || [];
 */
export function getProjectsByRole(
  roleId: number
): Map<ProjectStatus, ProjectFull[]> {
  const db = getDatabase();

  const projects = db
    .query('SELECT * FROM v_projects_full WHERE role_id = ? ORDER BY status, id')
    .all(roleId) as ProjectFull[];

  return groupBy(projects, (p) => p.status);
}

/**
 * Retrieves project progress with calculated completion metrics.
 *
 * Fetches a project and calculates two progress metrics:
 * - **taskProgress**: Ratio of completed tasks to total tasks (0 if no tasks)
 * - **criteriaProgress**: Ratio of completed finish criteria to total criteria (0 if no criteria)
 *
 * The finish_criteria JSON is parsed and evaluated to count completed items.
 * Returns null if project is not found.
 *
 * @param id - The unique project identifier
 * @returns Object containing the project and both progress metrics (0-1 range), or null if not found
 *
 * @example
 * const progress = getProjectProgress(1);
 * if (progress) {
 *   console.log(`Tasks: ${progress.taskProgress * 100}%`);
 *   console.log(`Criteria: ${progress.criteriaProgress * 100}%`);
 * }
 */
export function getProjectProgress(id: number): {
  project: ProjectFull;
  taskProgress: number;
  criteriaProgress: number;
} | null {
  const db = getDatabase();

  const project = db
    .query('SELECT * FROM v_projects_full WHERE id = ?')
    .get(id) as ProjectFull | undefined;

  if (!project) {
    return null;
  }

  // Beräkna taskProgress
  const taskProgress =
    project.total_tasks > 0 ? project.done_tasks / project.total_tasks : 0;

  // Beräkna criteriaProgress
  const criteria = parseFinishCriteria(project.finish_criteria);
  const criteriaProgress =
    criteria.length > 0
      ? criteria.filter((c) => c.done).length / criteria.length
      : 0;

  return {
    project,
    taskProgress,
    criteriaProgress,
  };
}

/**
 * Retrieves all paused (on_hold) projects with calculated idle time.
 *
 * Fetches projects with 'on_hold' status and augments each with a calculated
 * `daysSinceCreation` field representing the number of complete days since
 * the project was created. Results are ordered by creation date (oldest first),
 * making it easy to identify long-paused projects.
 *
 * @returns Array of ProjectFull objects with daysSinceCreation field added,
 *          ordered by creation timestamp ascending (oldest first)
 *
 * @example
 * const pausedProjects = getPausedProjects();
 * pausedProjects.forEach(p => {
 *   if (p.daysSinceCreation > 30) {
 *     console.log(`${p.name} paused for ${p.daysSinceCreation} days`);
 *   }
 * });
 */
export function getPausedProjects(): Array<
  ProjectFull & { daysSinceCreation: number }
> {
  const db = getDatabase();

  const projects = db
    .query(
      "SELECT * FROM v_projects_full WHERE status = 'on_hold' ORDER BY created_at ASC"
    )
    .all() as ProjectFull[];

  const now = new Date();

  return projects.map((p) => {
    const createdAt = new Date(p.created_at);
    const daysSinceCreation = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...p,
      daysSinceCreation,
    };
  });
}

// =============================================================================
// PROJECT QUERIES - WRITE
// =============================================================================

/**
 * Creates a new project with the provided information.
 *
 * Inserts a new project record into the projects table. The finish_criteria
 * array (if provided) is serialized to JSON before insertion. All other fields
 * (status, created_at, updated_at) are set by database defaults.
 *
 * @param input - Project creation input object
 * @param input.name - Project name (required)
 * @param input.role_id - ID of the role this project belongs to (required)
 * @param input.description - Project description (optional)
 * @param input.finish_criteria - Array of completion criteria (optional, converted to JSON)
 * @returns The newly created Project record with generated ID and timestamps
 * @throws Error if database insert fails due to constraint violations
 *
 * @example
 * const newProject = createProject({
 *   name: 'Website Redesign',
 *   role_id: 1,
 *   description: 'Complete redesign of company website',
 *   finish_criteria: [
 *     { criterion: 'Design complete', done: false },
 *     { criterion: 'Frontend built', done: false }
 *   ]
 * });
 */
export function createProject(input: CreateProjectInput): Project {
  const db = getDatabase();

  const finishCriteriaJson = input.finish_criteria
    ? JSON.stringify(input.finish_criteria)
    : null;

  const result = db
    .query(
      `INSERT INTO projects (name, role_id, description, finish_criteria)
       VALUES (?, ?, ?, ?)
       RETURNING *`
    )
    .get(
      input.name,
      input.role_id,
      input.description,
      finishCriteriaJson
    ) as Project;

  return result;
}

/**
 * Updates a project's name and/or description.
 *
 * Updates the specified fields on a project record. Only provided fields are
 * updated (partial update support). Dynamically builds the SQL SET clause based
 * on which fields are provided. Returns the current project if no fields are
 * provided for update.
 *
 * @param id - The unique project identifier to update
 * @param input - Project update input object
 * @param input.name - New project name (optional)
 * @param input.description - New project description (optional)
 * @returns The updated Project record with all current fields
 * @throws Error if project with the given id is not found
 *
 * @example
 * const updated = updateProject(1, {
 *   name: 'Updated Project Name',
 *   description: 'New description'
 * });
 *
 * // Partial update
 * const nameOnly = updateProject(1, { name: 'New Name' });
 */
export function updateProject(
  id: number,
  input: UpdateProjectInput
): Project {
  const db = getDatabase();

  const updates: string[] = [];
  const params: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    params.push(input.name);
  }

  if (input.description !== undefined) {
    updates.push('description = ?');
    params.push(input.description);
  }

  if (updates.length === 0) {
    // No updates, just return current project
    const current = db.query('SELECT * FROM projects WHERE id = ?').get(id) as
      | Project
      | undefined;
    if (!current) {
      throw new Error(`Project not found: id=${id}`);
    }
    return current;
  }

  params.push(id);

  const result = db
    .query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    )
    .get(...params) as Project | undefined;

  if (!result) {
    throw new Error(`Project not found: id=${id}`);
  }

  return result;
}

/**
 * Changes a project's status.
 *
 * Updates the status field on a project record. Valid statuses are defined by
 * the ProjectStatus type and typically include: 'active', 'on_hold', 'completed',
 * 'cancelled'. This is the primary mechanism for transitioning projects between
 * lifecycle states.
 *
 * @param id - The unique project identifier to update
 * @param status - The new status to set
 * @returns The updated Project record with the new status
 * @throws Error if project with the given id is not found
 *
 * @example
 * // Pause a project
 * const paused = setProjectStatus(1, 'on_hold');
 *
 * // Mark as complete
 * const completed = setProjectStatus(1, 'completed');
 */
export function setProjectStatus(
  id: number,
  status: ProjectStatus
): Project {
  const db = getDatabase();

  const result = db
    .query('UPDATE projects SET status = ? WHERE id = ? RETURNING *')
    .get(status, id) as Project | undefined;

  if (!result) {
    throw new Error(`Project not found: id=${id}`);
  }

  return result;
}

/**
 * Replaces all finish criteria for a project.
 *
 * Updates the finish_criteria field with a new complete set of criteria.
 * The provided array is serialized to JSON and replaces any existing criteria
 * entirely (not a merge operation). Use this to set initial criteria, modify
 * the set, or mark criteria as complete.
 *
 * @param id - The unique project identifier to update
 * @param criteria - Complete array of FinishCriterion objects to set.
 *                   Each criterion has: { criterion: string, done: boolean }
 * @returns The updated Project record with new finish_criteria JSON
 * @throws Error if project with the given id is not found
 *
 * @example
 * // Set initial finish criteria
 * const updated = updateFinishCriteria(1, [
 *   { criterion: 'Requirements gathered', done: true },
 *   { criterion: 'Design approved', done: false },
 *   { criterion: 'Implementation complete', done: false }
 * ]);
 *
 * // Update to mark one complete
 * const updated2 = updateFinishCriteria(1, [
 *   { criterion: 'Requirements gathered', done: true },
 *   { criterion: 'Design approved', done: true },
 *   { criterion: 'Implementation complete', done: false }
 * ]);
 */
export function updateFinishCriteria(
  id: number,
  criteria: FinishCriterion[]
): Project {
  const db = getDatabase();

  const criteriaJson = JSON.stringify(criteria);

  const result = db
    .query('UPDATE projects SET finish_criteria = ? WHERE id = ? RETURNING *')
    .get(criteriaJson, id) as Project | undefined;

  if (!result) {
    throw new Error(`Project not found: id=${id}`);
  }

  return result;
}
