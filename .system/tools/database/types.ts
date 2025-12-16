/**
 * Database Type Definitions
 *
 * Defines TypeScript interfaces for all database entities, views, and input
 * types used throughout the AIDA system. Includes base entities (Task, Role,
 * Project, JournalEntry), extended view types with calculated fields, and
 * input types for create/update operations.
 */

import type {
  TaskStatus,
  ProjectStatus,
  RoleStatus,
  RoleType,
  EntryType,
} from '../utilities/symbols';

// =============================================================================
// BASE ENTITY INTERFACES (match database tables exactly)
// =============================================================================

/**
 * Task entity matching the tasks table.
 *
 * Represents a discrete unit of work with status, priority, energy
 * requirements, and optional project/role associations.
 */
export interface Task {
  id: number;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: number; // 0-3
  energy_requirement: 'low' | 'medium' | 'high' | null;
  time_estimate: number | null; // minuter
  project_id: number | null;
  role_id: number;
  parent_task_id: number | null;
  start_date: string | null; // ISO date
  deadline: string | null; // ISO date
  remind_date: string | null; // ISO date
  created_at: string; // ISO datetime
}

/**
 * Role entity matching the roles table.
 *
 * Represents a professional or personal role with responsibilities,
 * status tracking, and balance targets for workload distribution.
 */
export interface Role {
  id: number;
  name: string;
  type: RoleType;
  description: string | null;
  responsibilities: string | null; // JSON array som string
  status: RoleStatus;
  balance_target: number | null; // 0.0-1.0
  created_at: string;
  updated_at: string;
}

/**
 * Project entity matching the projects table.
 *
 * Represents a project with multiple tasks, finish criteria,
 * and progress tracking within a specific role.
 */
export interface Project {
  id: number;
  name: string;
  role_id: number;
  status: ProjectStatus;
  description: string;
  finish_criteria: string | null; // JSON array som string
  created_at: string;
}

/**
 * JournalEntry entity matching the journal_entries table.
 *
 * Represents a timestamped journal entry with optional associations
 * to tasks, projects, and roles for activity logging and reflection.
 */
export interface JournalEntry {
  id: number;
  timestamp: string; // ISO datetime
  entry_type: EntryType;
  content: string;
  related_task_id: number | null;
  related_project_id: number | null;
  related_role_id: number | null;
}

// =============================================================================
// VIEW INTERFACES (extended with joins and calculated fields)
// =============================================================================

/**
 * Subtask information object stored within parent task JSON arrays.
 *
 * Represents a child task with status tracking within a parent task hierarchy.
 */
export interface SubtaskInfo {
  id: number;
  title: string;
  status: TaskStatus;
}

/**
 * Extended task view from v_tasks_full with computed fields.
 *
 * Includes role context, project association, subtask data, and
 * calculated fields like days_overdue and week_number.
 */
export interface TaskFull extends Task {
  // Roll-kontext
  role_name: string;
  role_type: RoleType;
  // Projekt-kontext
  project_name: string | null;
  project_status: ProjectStatus | null;
  // Parent task
  parent_title: string | null;
  // Subtasks som JSON-sträng (parsas vid behov)
  subtasks_json: string;
  // Beräknade fält
  days_since_creation: number;
  days_overdue: number | null;
  week_number: number;
}

/**
 * Extended project view from v_projects_full with task statistics.
 *
 * Includes role context, task counts (total, done, active), progress
 * percentage, and aggregated task data as JSON.
 */
export interface ProjectFull extends Project {
  role_name: string;
  role_type: RoleType;
  total_tasks: number;
  done_tasks: number;
  active_tasks: number;
  percent_complete: number;
  tasks_json: string;
}

/**
 * Extended role view from v_roles_summary with project and task aggregation.
 *
 * Summarizes role workload with counts of active/paused projects, tasks
 * by status (captured, ready, planned, overdue), and aggregated project data.
 */
export interface RoleSummary extends Role {
  active_projects: number;
  paused_projects: number;
  active_tasks: number;
  captured_tasks: number;
  ready_tasks: number;
  planned_tasks: number;
  overdue_tasks: number;
  projects_json: string;
}

/**
 * Extended journal entry view with related entity context.
 *
 * Includes optional names of associated task, project, and role
 * for contextual display and filtering.
 */
export interface JournalEntryFull extends JournalEntry {
  task_title?: string;
  project_name?: string;
  role_name?: string;
}

// =============================================================================
// INPUT TYPES (for create/update operations)
// =============================================================================

/**
 * Input type for creating a new task.
 *
 * All fields except title and role_id are optional with sensible defaults.
 */
export interface CreateTaskInput {
  title: string;
  role_id: number;
  notes?: string;
  status?: TaskStatus; // default: 'captured'
  priority?: number;
  energy_requirement?: 'low' | 'medium' | 'high';
  time_estimate?: number;
  project_id?: number;
  parent_task_id?: number;
  start_date?: string;
  deadline?: string;
  remind_date?: string;
}

/**
 * Input type for updating an existing task.
 *
 * All fields are optional. Null values clear previously set values.
 */
export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  priority?: number;
  energy_requirement?: 'low' | 'medium' | 'high' | null;
  time_estimate?: number | null;
  project_id?: number | null;
  role_id?: number;
  parent_task_id?: number | null;
  start_date?: string | null;
  deadline?: string | null;
  remind_date?: string | null;
}

/**
 * Input type for creating a new role.
 *
 * Requires name and type; other attributes are optional.
 */
export interface CreateRoleInput {
  name: string;
  type: RoleType;
  description?: string;
  responsibilities?: string[]; // Konverteras till JSON
  balance_target?: number;
}

/**
 * Input type for updating an existing role.
 *
 * All fields are optional for partial updates.
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  responsibilities?: string[];
  balance_target?: number;
}

/**
 * Input type for creating a new project.
 *
 * Requires name, role_id, and description; finish criteria are optional.
 */
export interface CreateProjectInput {
  name: string;
  role_id: number;
  description: string;
  finish_criteria?: FinishCriterion[];
}

/**
 * Input type for updating an existing project.
 *
 * All fields are optional for partial updates.
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

/**
 * Finish criterion for project completion tracking.
 *
 * Represents a single completion criterion with boolean done flag.
 */
export interface FinishCriterion {
  criterion: string;
  done: boolean;
}

/**
 * Input type for creating a new journal entry.
 *
 * Requires entry_type and content; entity associations and timestamp are optional.
 * Timestamp will be validated and normalized to ISO 8601 format by createEntry().
 * If not provided, defaults to server time (NOW()).
 */
export interface CreateEntryInput {
  entry_type: EntryType;
  content: string;
  timestamp?: string;
  related_task_id?: number;
  related_project_id?: number;
  related_role_id?: number;
}
