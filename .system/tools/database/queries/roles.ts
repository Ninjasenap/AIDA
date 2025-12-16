/**
 * Role Query Functions
 *
 * Complete CRUD operations for roles with integrated statistics and context.
 * Provides 8 query functions: 4 READ operations for retrieving roles by various criteria,
 * and 4 WRITE operations for creating, updating, and managing role status.
 *
 * READ functions support filtering by:
 * - ID, active/inactive status, type (caretaker/professional/personal/avocation)
 * - All return roles from v_roles_summary view with project and task aggregations
 *
 * WRITE functions provide:
 * - Role creation with optional responsibilities and balance targets
 * - Partial updates via dynamic SQL
 * - Status management with linked task warnings
 *
 * Database connection uses SQLite with bun:sqlite.
 * All queries are parameterized to prevent SQL injection.
 */
import { getDatabase } from '../connection';
import type {
  Role,
  RoleSummary,
  RoleType,
  RoleStatus,
  CreateRoleInput,
  UpdateRoleInput,
} from '../types';

// =============================================================================
// ROLE QUERIES - READ
// =============================================================================

/**
 * Retrieves a specific role by ID with statistics.
 *
 * Uses the v_roles_summary view to include project and task aggregations.
 *
 * SQL: SELECT * FROM v_roles_summary WHERE id = ?
 *
 * @param id - Role ID to retrieve
 * @returns RoleSummary object with statistics, or null if not found
 */
export function getRoleById(id: number): RoleSummary | null {
  const db = getDatabase();
  const result = db
    .query('SELECT * FROM v_roles_summary WHERE id = ?')
    .get(id) as RoleSummary | undefined;

  return result ?? null;
}

/**
 * Retrieves all active roles with statistics.
 *
 * Uses the v_roles_summary view to include project and task aggregations.
 *
 * SQL: SELECT * FROM v_roles_summary WHERE status = 'active' ORDER BY id
 *
 * @returns Array of RoleSummary objects for active roles, ordered by ID
 */
export function getActiveRoles(): RoleSummary[] {
  const db = getDatabase();
  const results = db
    .query("SELECT * FROM v_roles_summary WHERE status = 'active' ORDER BY id")
    .all() as RoleSummary[];

  return results;
}

/**
 * Retrieves all inactive and historical roles with statistics.
 *
 * Uses the v_roles_summary view to include project and task aggregations.
 *
 * SQL: SELECT * FROM v_roles_summary WHERE status IN ('inactive', 'historical')
 *
 * @returns Array of RoleSummary objects for inactive/historical roles
 */
export function getInactiveRoles(): RoleSummary[] {
  const db = getDatabase();
  const results = db
    .query("SELECT * FROM v_roles_summary WHERE status IN ('inactive', 'historical')")
    .all() as RoleSummary[];

  return results;
}

/**
 * Retrieves roles by type with optional inactive filter.
 *
 * Uses the v_roles_summary view to include project and task aggregations.
 *
 * SQL: SELECT * FROM v_roles_summary WHERE type = ? [AND status = 'active']
 *
 * @param type - Role type to filter by
 * @param options - Optional filter options
 * @param options.includeInactive - Include inactive/historical roles (default: false)
 * @returns Array of RoleSummary objects matching the type
 */
export function getRolesByType(
  type: RoleType,
  options?: { includeInactive?: boolean }
): RoleSummary[] {
  const db = getDatabase();

  let query = 'SELECT * FROM v_roles_summary WHERE type = ?';
  const params: any[] = [type];

  if (!options?.includeInactive) {
    query += " AND status = 'active'";
  }

  const results = db.query(query).all(...params) as RoleSummary[];

  return results;
}

// =============================================================================
// ROLE QUERIES - WRITE
// =============================================================================

/**
 * Creates a new role.
 *
 * Converts responsibilities array to JSON string for storage.
 *
 * SQL: INSERT INTO roles (name, type, description, responsibilities, balance_target)
 *      VALUES (?, ?, ?, ?, ?)
 *
 * @param input - Role creation input
 * @returns Created Role object with generated ID
 */
export function createRole(input: CreateRoleInput): Role {
  const db = getDatabase();

  // Convert responsibilities array to JSON string
  const responsibilitiesJson = input.responsibilities
    ? JSON.stringify(input.responsibilities)
    : null;

  const result = db
    .query(
      `INSERT INTO roles (name, type, description, responsibilities, balance_target)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      input.name,
      input.type,
      input.description ?? null,
      responsibilitiesJson,
      input.balance_target ?? null
    ) as Role;

  return result;
}

/**
 * Updates an existing role.
 *
 * Converts responsibilities array to JSON string if provided.
 * Only updates fields that are included in the input object.
 *
 * SQL: UPDATE roles SET [field1 = ?, field2 = ?, ...] WHERE id = ?
 *
 * @param id - Role ID to update
 * @param input - Fields to update
 * @returns Updated Role object
 * @throws Error if role does not exist
 */
export function updateRole(id: number, input: UpdateRoleInput): Role {
  const db = getDatabase();

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }

  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }

  if (input.responsibilities !== undefined) {
    updates.push('responsibilities = ?');
    values.push(JSON.stringify(input.responsibilities));
  }

  if (input.balance_target !== undefined) {
    updates.push('balance_target = ?');
    values.push(input.balance_target);
  }

  if (updates.length === 0) {
    // No fields to update, just return current role
    const current = db
      .query('SELECT * FROM roles WHERE id = ?')
      .get(id) as Role | undefined;

    if (!current) {
      throw new Error(`Role not found: id=${id}`);
    }

    return current;
  }

  // Add ID to values
  values.push(id);

  const query = `UPDATE roles SET ${updates.join(', ')} WHERE id = ? RETURNING *`;
  const result = db.query(query).get(...values) as Role | undefined;

  if (!result) {
    throw new Error(`Role not found: id=${id}`);
  }

  return result;
}

/**
 * Changes the status of a role.
 *
 * Returns a warning with linked task count when changing to 'inactive' or
 * 'historical' status if the role has associated tasks.
 *
 * SQL: UPDATE roles SET status = ? WHERE id = ?
 *
 * @param id - Role ID to update
 * @param status - New status for the role
 * @returns Object with updated role and optional warning
 * @throws Error if role does not exist
 */
export function setRoleStatus(
  id: number,
  status: RoleStatus
): {
  role: Role;
  warning?: { linkedTaskCount: number };
} {
  const db = getDatabase();

  // Update the status
  const result = db
    .query('UPDATE roles SET status = ? WHERE id = ? RETURNING *')
    .get(status, id) as Role | undefined;

  if (!result) {
    throw new Error(`Role not found: id=${id}`);
  }

  // Check for linked tasks if going to inactive or historical
  let warning: { linkedTaskCount: number } | undefined;

  if (status === 'inactive' || status === 'historical') {
    const taskCount = db
      .query('SELECT COUNT(*) as count FROM tasks WHERE role_id = ?')
      .get(id) as { count: number };

    if (taskCount.count > 0) {
      warning = { linkedTaskCount: taskCount.count };
    }
  }

  return { role: result, warning };
}
