/**
 * Database Query Functions - Central Export Hub
 *
 * Aggregates and re-exports all CRUD operations for roles, projects, and journal entries.
 * This module provides a single import point for all database queries used throughout AIDA.
 *
 * Use this module to access all database operations across the system. Each query module
 * implements parameterized SQL with type-safe TypeScript interfaces. All operations integrate
 * with SQLite (via bun:sqlite) and use denormalized views for efficient read operations with
 * aggregated data and calculated fields.
 *
 * EXPORTS:
 * - Task/Project/Role/JournalEntry interfaces (from types.ts)
 * - Input types for create/update operations
 * - Query functions for CRUD operations on all entities
 *
 * QUERY MODULES:
 * - tasks: createTask, getTask, updateTask, deleteTask, listTasks, listTasksByRole, etc.
 * - roles: createRole, getRole, updateRole, deleteRole, listRoles, getRoleSummary, etc.
 * - projects: createProject, getProject, updateProject, deleteProject, listProjects, etc.
 * - journal: createEntry, getEntry, updateEntry, deleteEntry, listEntries, etc.
 *
 * USAGE PATTERN:
 * import { createTask, getTask, type Task } from '@/database/queries';
 * const newTask = createTask({ title: 'Example', role_id: 1 });
 * const task = getTask(newTask.id);
 */

/**
─────────────────────────────────────────────────────────────────────────────
TYPE EXPORTS
─────────────────────────────────────────────────────────────────────────────
*/
export * from '../types';

/**
─────────────────────────────────────────────────────────────────────────────
QUERY FUNCTION EXPORTS
─────────────────────────────────────────────────────────────────────────────
*/
// Re-export all query functions
export * from './roles';
export * from './projects';
export * from './journal';
export * from './sync-state';
