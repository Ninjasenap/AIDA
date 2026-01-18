/**
 * Todoist Integration Types
 *
 * Defines Todoist API structures and AIDA-extended task models.
 */

// ============================================================================
// TODOIST API TYPES
// ============================================================================

export interface TodoistDue {
  date: string;
  string: string;
  datetime: string | null;
  timezone: string | null;
  is_recurring: boolean;
}

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  project_id: string | null;
  section_id: string | null;
  parent_id: string | null;
  order: number;
  priority: number;
  labels: string[];
  due: TodoistDue | null;
  is_completed: boolean;
  created_at: string;
  url: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  parent_id: string | null;
  order: number;
  color: string;
  is_shared: boolean;
  is_favorite: boolean;
  is_inbox_project: boolean;
  is_team_inbox: boolean;
  url: string;
}

export interface TodoistLabel {
  id: string;
  name: string;
  color: string;
  order: number;
  is_favorite: boolean;
}

export interface TodoistCompletedItem {
  id: string;
  task_id: string;
  project_id: string | null;
  content: string;
  completed_at: string;
}

// ============================================================================
// AIDA EXTENDED TYPES
// ============================================================================

export type EnergyLevel = 'high' | 'medium' | 'low';

export interface AidaTask extends TodoistTask {
  aida_role_id: number | null;
  aida_role_name: string | null;
  aida_project_id: number | null;
  aida_project_name: string | null;
  energy_requirement: EnergyLevel | null;
  contexts: string[];
}

export interface CreateTaskInput {
  content: string;
  description?: string;
  role_id?: number;
  project_id?: number;
  energy?: EnergyLevel;
  due_string?: string;
  due_date?: string;
  priority?: 1 | 2 | 3 | 4;
  contexts?: string[];
}

export interface TaskFilter {
  role_id?: number;
  project_id?: number;
  energy?: EnergyLevel;
  due?: 'today' | 'overdue' | 'tomorrow' | 'week';
}

export interface SyncState {
  last_sync: string;
  last_completed_check: string;
}

export interface SyncResult {
  completed_synced: number;
  journal_entries_created: number;
  timestamp: string;
}
