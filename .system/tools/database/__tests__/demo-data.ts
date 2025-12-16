/**
 * Demo Data Seeding Module
 *
 * Populates test database with realistic Swedish content covering all entity types.
 * Includes edge cases like completed tasks, cancelled items, and subtasks.
 * Demo data is preserved after tests for inspection and debugging.
 *
 * This module provides a single seeding function that creates a realistic data scenario
 * for testing AIDA's task management, role tracking, and journal features. Data includes
 * multiple roles (work, personal, hobby, civic), active projects, tasks in various states,
 * and journal entries demonstrating different capture types.
 */

import type { Database } from 'bun:sqlite';

// =============================================================================
// DEMO DATA SEEDING FUNCTION
// =============================================================================

/**
 * Seeds SQLite database with realistic demo data for testing.
 *
 * Inserts demo data across all tables creating a complete test scenario:
 * - 4 roles (Systemutvecklare, Förälder, Hobbyutvecklare, Föreningsordförande)
 * - 3 projects with varying completion states (AIDA, legacy migration, summer planning)
 * - 11 tasks with different statuses (planned, ready, done, cancelled, captured, clarified)
 * - 3 subtasks for parent task testing (Förbered årsmöte)
 * - 6 journal entries covering all entry types (checkin, task, reflection, idea, event, note)
 *
 * The demo data uses Swedish content and realistic dates (relative to current date).
 * Edge cases included:
 * - Overdue tasks (deadline in past)
 * - Cancelled items (status: cancelled)
 * - Uncaptured ideas (status: captured)
 * - Parent-child task relationships
 * - Mixed project associations
 *
 * @param db - SQLite database connection to seed
 */
export function seedDemoData(db: Database): void {
  /**
   * ROLES
   * Creates four roles representing different life areas with varying activity levels
   * and balance targets. Demonstrates both active and inactive roles.
   */
  // ===== ROLLER =====
  const roles = [
    {
      name: 'Systemutvecklare',
      type: 'work',
      description: 'Utveckling och underhåll av mjukvarusystem',
      responsibilities: JSON.stringify([
        'Kodgranskning',
        'Systemarkitektur',
        'Mentorskap',
      ]),
      status: 'active',
      balance_target: 0.5,
    },
    {
      name: 'Förälder',
      type: 'personal',
      description: 'Föräldraansvar och familjeliv',
      responsibilities: JSON.stringify([
        'Daglig omvårdnad',
        'Skolstöd',
        'Fritidsaktiviteter',
      ]),
      status: 'active',
      balance_target: 0.3,
    },
    {
      name: 'Hobbyutvecklare',
      type: 'hobby',
      description: 'Sidoprojekt och experimenterande',
      responsibilities: JSON.stringify([
        'Open source-bidrag',
        'Prototyper',
        'Lärande',
      ]),
      status: 'active',
      balance_target: 0.15,
    },
    {
      name: 'Föreningsordförande',
      type: 'civic',
      description: 'Lokal bostadsrättsförening',
      responsibilities: JSON.stringify(['Styrelsemöten', 'Beslut', 'Ekonomi']),
      status: 'inactive',
      balance_target: 0.05,
    },
  ];

  const roleIds: number[] = [];
  for (const role of roles) {
    const result = db
      .query(
        `INSERT INTO roles (name, type, description, responsibilities, status, balance_target)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        role.name,
        role.type,
        role.description,
        role.responsibilities,
        role.status,
        role.balance_target
      ) as { id: number };
    roleIds.push(result.id);
  }

  /**
   * PROJECTS
   * Creates three projects with different statuses and finish criteria.
   * Each project is associated with a specific role and contains varying completion states.
   */
  // ===== PROJEKT =====
  const projects = [
    {
      name: 'AIDA - AI Digital Assistant',
      role_id: roleIds[2], // Hobbyutvecklare
      status: 'active',
      description:
        'Personlig AI-assistent för produktivitet och kognitiv förstärkning',
      finish_criteria: JSON.stringify([
        { criterion: 'Query-layer komplett', done: false },
        { criterion: 'Grundläggande kommandon fungerar', done: false },
        { criterion: 'Daglig användning i 1 vecka', done: false },
      ]),
    },
    {
      name: 'Migrera legacy-system till mikroservices',
      role_id: roleIds[0], // Systemutvecklare
      status: 'active',
      description: 'Modernisera gamla monoliten',
      finish_criteria: JSON.stringify([
        { criterion: 'Auth-service extraherad', done: true },
        { criterion: 'User-service extraherad', done: false },
        { criterion: 'Payment-service extraherad', done: false },
      ]),
    },
    {
      name: 'Sommarlov 2025',
      role_id: roleIds[1], // Förälder
      status: 'active',
      description: 'Planera och genomföra sommarlovsaktiviteter',
      finish_criteria: JSON.stringify([
        { criterion: 'Bokade semesterveckor', done: true },
        { criterion: 'Planerade aktiviteter', done: false },
      ]),
    },
  ];

  const projectIds: number[] = [];
  for (const project of projects) {
    const result = db
      .query(
        `INSERT INTO projects (name, role_id, status, description, finish_criteria)
         VALUES (?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        project.name,
        project.role_id,
        project.status,
        project.description,
        project.finish_criteria
      ) as { id: number };
    projectIds.push(result.id);
  }

  /**
   * TASKS
   * Creates 11 diverse tasks demonstrating all status states and edge cases.
   * Includes overdue items, future deadlines, parent-child relationships, and various energy requirements.
   */
  // ===== TASKS =====
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const lastMonth = new Date(now);
  lastMonth.setMonth(now.getMonth() - 1);

  const tasks = [
    // AIDA-projekt tasks
    {
      title: 'Implementera query-funktioner för tasks',
      notes: 'Börja med getTaskById och searchTasks',
      status: 'planned',
      priority: 3,
      energy_requirement: 'high',
      time_estimate: 120,
      role_id: roleIds[2],
      project_id: projectIds[0],
      start_date: now.toISOString().split('T')[0],
      deadline: tomorrow.toISOString().split('T')[0],
      remind_date: now.toISOString().split('T')[0],
    },
    {
      title: 'Skriv tester för role-queries',
      notes: null,
      status: 'ready',
      priority: 2,
      energy_requirement: 'medium',
      time_estimate: 60,
      role_id: roleIds[2],
      project_id: projectIds[0],
      start_date: tomorrow.toISOString().split('T')[0],
      deadline: nextWeek.toISOString().split('T')[0],
      remind_date: null,
    },
    {
      title: 'Dokumentera API för project-queries',
      notes: 'JSDoc + README',
      status: 'clarified',
      priority: 1,
      energy_requirement: 'low',
      time_estimate: 30,
      role_id: roleIds[2],
      project_id: projectIds[0],
      start_date: null,
      deadline: null,
      remind_date: null,
    },
    {
      title: 'Idé: Lägg till voice-interface',
      notes: 'Kolla på Web Speech API',
      status: 'captured',
      priority: 0,
      energy_requirement: null,
      time_estimate: null,
      role_id: roleIds[2],
      project_id: projectIds[0],
      start_date: null,
      deadline: null,
      remind_date: null,
    },

    // Legacy migration tasks
    {
      title: 'Skapa User-service spec',
      notes: 'API endpoints och datamodell',
      status: 'done',
      priority: 3,
      energy_requirement: 'high',
      time_estimate: 180,
      role_id: roleIds[0],
      project_id: projectIds[1],
      start_date: lastMonth.toISOString().split('T')[0],
      deadline: lastMonth.toISOString().split('T')[0],
      remind_date: null,
    },
    {
      title: 'Code review för Auth-service',
      notes: 'Försenad - deadline var igår!',
      status: 'ready',
      priority: 3,
      energy_requirement: 'high',
      time_estimate: 90,
      role_id: roleIds[0],
      project_id: projectIds[1],
      start_date: yesterday.toISOString().split('T')[0],
      deadline: yesterday.toISOString().split('T')[0],
      remind_date: now.toISOString().split('T')[0],
    },

    // Förälder tasks
    {
      title: 'Boka läger för barnen',
      notes: 'Sportlov vecka 9',
      status: 'planned',
      priority: 2,
      energy_requirement: 'low',
      time_estimate: 15,
      role_id: roleIds[1],
      project_id: projectIds[2],
      start_date: now.toISOString().split('T')[0],
      deadline: tomorrow.toISOString().split('T')[0],
      remind_date: null,
    },
    {
      title: 'Köp sommarskor',
      notes: null,
      status: 'ready',
      priority: 1,
      energy_requirement: 'medium',
      time_estimate: 45,
      role_id: roleIds[1],
      project_id: null,
      start_date: null,
      deadline: nextWeek.toISOString().split('T')[0],
      remind_date: null,
    },

    // Task med subtasks (parent)
    {
      title: 'Förbered årsmöte',
      notes: 'Stora uppgiften, se subtasks',
      status: 'ready',
      priority: 2,
      energy_requirement: 'medium',
      time_estimate: null,
      role_id: roleIds[3],
      project_id: null,
      start_date: now.toISOString().split('T')[0],
      deadline: nextWeek.toISOString().split('T')[0],
      remind_date: null,
    },

    // Avbruten task
    {
      title: 'Starta podcast',
      notes: 'Beslutade att inte göra detta',
      status: 'cancelled',
      priority: 1,
      energy_requirement: 'high',
      time_estimate: 300,
      role_id: roleIds[2],
      project_id: null,
      start_date: null,
      deadline: null,
      remind_date: null,
    },
  ];

  const taskIds: number[] = [];
  for (const task of tasks) {
    const result = db
      .query(
        `INSERT INTO tasks (title, notes, status, priority, energy_requirement, time_estimate,
         role_id, project_id, start_date, deadline, remind_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        task.title,
        task.notes,
        task.status,
        task.priority,
        task.energy_requirement,
        task.time_estimate,
        task.role_id,
        task.project_id,
        task.start_date,
        task.deadline,
        task.remind_date
      ) as { id: number };
    taskIds.push(result.id);
  }

  /**
   * SUBTASKS
   * Creates 3 subtasks for the "Förbered årsmöte" parent task.
   * Demonstrates parent-child task relationships with mixed completion states.
   */
  // Subtasks för "Förbered årsmöte"
  const parentTaskId = taskIds[8];
  const subtasks = [
    {
      title: 'Skicka kallelse till alla medlemmar',
      status: 'done',
      priority: 3,
      parent_task_id: parentTaskId,
      role_id: roleIds[3],
    },
    {
      title: 'Sammanställ årsredovisning',
      status: 'ready',
      priority: 3,
      parent_task_id: parentTaskId,
      role_id: roleIds[3],
    },
    {
      title: 'Boka lokal',
      status: 'done',
      priority: 2,
      parent_task_id: parentTaskId,
      role_id: roleIds[3],
    },
  ];

  for (const subtask of subtasks) {
    db.query(
      `INSERT INTO tasks (title, status, priority, role_id, parent_task_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      subtask.title,
      subtask.status,
      subtask.priority,
      subtask.role_id,
      subtask.parent_task_id
    );
  }

  /**
   * JOURNAL ENTRIES
   * Creates 6 journal entries covering all entry types for different roles and contexts.
   * Includes checkins, task reflections, ideas, events, and personal notes.
   */
  // ===== JOURNAL =====
  const journalEntries = [
    {
      entry_type: 'checkin',
      content: 'Morgon check-in: Känner mig pigg och redo att koda',
      related_role_id: roleIds[2],
    },
    {
      entry_type: 'task',
      content: 'Slutförde specen för User-service - tog längre tid än förväntat',
      related_task_id: taskIds[4],
      related_project_id: projectIds[1],
      related_role_id: roleIds[0],
    },
    {
      entry_type: 'reflection',
      content:
        'Reflekterar över balansen mellan arbete och familj - behöver prioritera bättre',
      related_role_id: roleIds[1],
    },
    {
      entry_type: 'idea',
      content: 'Idé: Integrera AIDA med Obsidian via plugin',
      related_project_id: projectIds[0],
      related_role_id: roleIds[2],
    },
    {
      entry_type: 'event',
      content: 'Styrelsemöte flyttades till nästa vecka',
      related_role_id: roleIds[3],
    },
    {
      entry_type: 'note',
      content: 'Kom ihåg: Barnen behöver nya cyklar till sommaren',
      related_role_id: roleIds[1],
    },
  ];

  for (const entry of journalEntries) {
    db.query(
      `INSERT INTO journal_entries (entry_type, content, related_task_id, related_project_id, related_role_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      entry.entry_type,
      entry.content,
      (entry as any).related_task_id ?? null,
      (entry as any).related_project_id ?? null,
      (entry as any).related_role_id ?? null
    );
  }
}
