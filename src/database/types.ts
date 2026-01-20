/**
 * Database Type Definitions (Local SQLite)
 *
 * Local SQLite stores:
 * - roles
 * - projects
 * - journal_entries
 * - todoist_sync_state
 *
 * Tasks are stored in Todoist and are not part of the local schema.
 */

import type { EntryType, ProjectStatus, RoleStatus, RoleType } from '../utilities/symbols';

export type { EntryType, ProjectStatus, RoleStatus, RoleType } from '../utilities/symbols';

// =============================================================================
// BASE TABLE TYPES
// =============================================================================

export interface Role {
  id: number;
  name: string;
  type: RoleType;
  description: string | null;
  responsibilities: string | null;
  todoist_label_name: string | null;
  status: RoleStatus;
  balance_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  role_id: number;
  todoist_project_id: string | null;
  status: ProjectStatus;
  description: string;
  finish_criteria: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  timestamp: string;
  entry_type: EntryType;
  content: string;
  todoist_task_id: string | null;
  related_project_id: number | null;
  related_role_id: number | null;
}

export interface TodoistSyncState {
  last_sync: string;
  last_completed_check: string;
}

// =============================================================================
// VIEW TYPES
// =============================================================================

export interface ProjectFull extends Project {
  role_name: string;
  role_type: RoleType;
}

export interface RoleSummary extends Role {
  active_projects: number;
  paused_projects: number;
  projects_json: string;
}

export interface JournalEntryFull extends JournalEntry {
  project_name?: string;
  role_name?: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateRoleInput {
  name: string;
  type: RoleType;
  description?: string;
  responsibilities?: string[];
  todoist_label_name?: string;
  balance_target?: number;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  responsibilities?: string[];
  todoist_label_name?: string;
  balance_target?: number;
}

export interface FinishCriterion {
  criterion: string;
  done: boolean;
}

export interface CreateProjectInput {
  name: string;
  role_id: number;
  description: string;
  todoist_project_id?: string;
  finish_criteria?: FinishCriterion[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  todoist_project_id?: string;
}

export interface CreateEntryInput {
  entry_type: EntryType;
  content: string;
  timestamp?: string;
  todoist_task_id?: string;
  related_project_id?: number;
  related_role_id?: number;
}
