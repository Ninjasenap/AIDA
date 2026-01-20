/**
 * Demo Data Seeding Module (Local SQLite)
 *
 * Seeds the local database with roles, projects, and journal entries.
 *
 * Note: Tasks are stored in Todoist and are not seeded here.
 */

import type { Database } from 'bun:sqlite';

export function seedDemoData(db: Database): void {
  // ---------------------------------------------------------------------------
  // Roles (stable IDs: 1..4)
  // ---------------------------------------------------------------------------
  const roles = [
    {
      name: 'Systemutvecklare',
      type: 'work',
      description: 'Utveckling och underhåll av mjukvarusystem',
      responsibilities: JSON.stringify(['Kodgranskning', 'Systemarkitektur', 'Mentorskap']),
      status: 'active',
      balance_target: 0.5,
    },
    {
      name: 'Förälder',
      type: 'personal',
      description: 'Föräldraansvar och familjeliv',
      responsibilities: JSON.stringify(['Daglig omvårdnad', 'Skolstöd', 'Fritidsaktiviteter']),
      status: 'active',
      balance_target: 0.3,
    },
    {
      name: 'Hobbyutvecklare',
      type: 'hobby',
      description: 'Sidoprojekt och experimenterande',
      responsibilities: JSON.stringify(['Open source-bidrag', 'Prototyper', 'Lärande']),
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
        `INSERT INTO roles (
          name,
          type,
          description,
          responsibilities,
          todoist_label_name,
          status,
          balance_target
        ) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        role.name,
        role.type,
        role.description,
        role.responsibilities,
        null,
        role.status,
        role.balance_target
      ) as { id: number };

    roleIds.push(result.id);
  }

  // ---------------------------------------------------------------------------
  // Projects (stable IDs: 1..3)
  // ---------------------------------------------------------------------------
  const projects = [
    {
      name: 'AIDA - AI Digital Assistant',
      role_id: roleIds[2],
      status: 'active',
      description: 'Personlig AI-assistent för produktivitet och kognitiv förstärkning',
      finish_criteria: JSON.stringify([
        { criterion: 'Query-layer komplett', done: false },
        { criterion: 'Grundläggande kommandon fungerar', done: false },
        { criterion: 'Daglig användning i 1 vecka', done: false },
      ]),
    },
    {
      name: 'Migrera legacy-system till mikroservices',
      role_id: roleIds[0],
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
      role_id: roleIds[1],
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
        `INSERT INTO projects (
          name,
          role_id,
          todoist_project_id,
          status,
          description,
          finish_criteria
        ) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
      )
      .get(
        project.name,
        project.role_id,
        null,
        project.status,
        project.description,
        project.finish_criteria
      ) as { id: number };

    projectIds.push(result.id);
  }

  // ---------------------------------------------------------------------------
  // Journal entries
  // ---------------------------------------------------------------------------
  db.query(
    `INSERT INTO journal_entries (
      entry_type,
      content,
      todoist_task_id,
      related_project_id,
      related_role_id
    ) VALUES (?, ?, ?, ?, ?)`
  ).run('checkin', 'Morgon: fokus på 1-3 viktiga saker', null, null, null);

  db.query(
    `INSERT INTO journal_entries (
      entry_type,
      content,
      todoist_task_id,
      related_project_id,
      related_role_id
    ) VALUES (?, ?, ?, ?, ?)`
  ).run('note', 'Test note', null, projectIds[0], roleIds[2]);

  db.query(
    `INSERT INTO journal_entries (
      entry_type,
      content,
      todoist_task_id,
      related_project_id,
      related_role_id
    ) VALUES (?, ?, ?, ?, ?)`
  ).run('idea', 'Idé: koppla Todoist tasks till roller', null, null, roleIds[2]);

  db.query(
    `INSERT INTO journal_entries (
      entry_type,
      content,
      todoist_task_id,
      related_project_id,
      related_role_id
    ) VALUES (?, ?, ?, ?, ?)`
  ).run('reflection', 'Kväll: vad funkade bra idag?', null, null, null);
}
