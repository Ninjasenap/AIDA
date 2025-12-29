/**
 * Schema Registry
 *
 * Mapping from module.function to validation schema and argument mode.
 * Populated incrementally as each module is migrated.
 */
import { z } from 'zod';
import { PositiveIntSchema, ISODateSchema } from './schemas/common';
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  SetTaskStatusInputSchema,
  SearchTasksInputSchema,
  GetTasksByRoleInputSchema,
  GetWeekTasksInputSchema,
  GetStaleTasksInputSchema,
  GetTasksWithSubtasksInputSchema,
} from './schemas/tasks';
import {
  CreateEntryInputSchema,
  GetEntriesByTypeInputSchema,
  GetEntriesByDateRangeInputSchema,
} from './schemas/journal';
import {
  CreateRoleInputSchema,
  UpdateRoleInputSchema,
  SetRoleStatusInputSchema,
  GetRolesByTypeInputSchema,
} from './schemas/roles';
import {
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
  SetProjectStatusInputSchema,
  UpdateFinishCriteriaInputSchema,
  SearchProjectsInputSchema,
} from './schemas/projects';
import {
  CreateDailyPlanInputSchema,
} from './schemas/plan';
import {
  UpdateAttributeInputSchema,
  AddObservationInputSchema,
} from './schemas/profile';

type SchemaEntry = {
  schema: z.ZodSchema;
  argMode: 'single-object' | 'positional-id' | 'none';
};

/**
 * Registry mapping module.function to validation schema and argument mode.
 *
 * Argument modes:
 * - 'single-object': Function expects single JSON object argument
 * - 'positional-id': Function expects (id) as first positional arg
 * - 'none': No arguments or no validation needed
 */
export const schemaRegistry: Record<string, Record<string, SchemaEntry>> = {
  tasks: {
    // No-arg operations
    getTodayTasks: { schema: z.undefined(), argMode: 'none' },
    getOverdueTasks: { schema: z.undefined(), argMode: 'none' },

    // Simple positional ID queries
    getTaskById: { schema: PositiveIntSchema, argMode: 'positional-id' },
    getTasksByProject: { schema: PositiveIntSchema, argMode: 'positional-id' },

    // Object-based WRITE operations
    createTask: { schema: CreateTaskInputSchema, argMode: 'single-object' },
    updateTask: { schema: UpdateTaskInputSchema, argMode: 'single-object' },
    setTaskStatus: { schema: SetTaskStatusInputSchema, argMode: 'single-object' },

    // Object-based READ operations with filters
    searchTasks: { schema: SearchTasksInputSchema, argMode: 'single-object' },
    getTasksByRole: { schema: GetTasksByRoleInputSchema, argMode: 'single-object' },
    getWeekTasks: { schema: GetWeekTasksInputSchema, argMode: 'single-object' },
    getStaleTasks: { schema: GetStaleTasksInputSchema, argMode: 'single-object' },
    getTasksWithSubtasks: { schema: GetTasksWithSubtasksInputSchema, argMode: 'single-object' },
  },

  journal: {
    // No-arg
    getTodayEntries: { schema: z.undefined(), argMode: 'none' },

    // Simple positional
    getEntriesByTask: { schema: PositiveIntSchema, argMode: 'positional-id' },
    getEntriesByProject: { schema: PositiveIntSchema, argMode: 'positional-id' },
    getEntriesByRole: { schema: PositiveIntSchema, argMode: 'positional-id' },

    // Object-based WRITE operations
    createEntry: { schema: CreateEntryInputSchema, argMode: 'single-object' },

    // Object-based READ operations with filters
    getEntriesByType: { schema: GetEntriesByTypeInputSchema, argMode: 'single-object' },
    getEntriesByDateRange: { schema: GetEntriesByDateRangeInputSchema, argMode: 'single-object' },
  },

  roles: {
    // No-arg
    getActiveRoles: { schema: z.undefined(), argMode: 'none' },
    getInactiveRoles: { schema: z.undefined(), argMode: 'none' },

    // Simple positional
    getRoleById: { schema: PositiveIntSchema, argMode: 'positional-id' },

    // Object-based WRITE operations
    createRole: { schema: CreateRoleInputSchema, argMode: 'single-object' },
    updateRole: { schema: UpdateRoleInputSchema, argMode: 'single-object' },
    setRoleStatus: { schema: SetRoleStatusInputSchema, argMode: 'single-object' },

    // Object-based READ operations with filters
    getRolesByType: { schema: GetRolesByTypeInputSchema, argMode: 'single-object' },
  },

  projects: {
    // No-arg
    getAllProjects: { schema: z.undefined(), argMode: 'none' },
    getActiveProjects: { schema: z.undefined(), argMode: 'none' },
    getPausedProjects: { schema: z.undefined(), argMode: 'none' },

    // Simple positional
    getProjectById: { schema: PositiveIntSchema, argMode: 'positional-id' },
    getProjectsByRole: { schema: PositiveIntSchema, argMode: 'positional-id' },
    getProjectProgress: { schema: PositiveIntSchema, argMode: 'positional-id' },

    // Object-based WRITE operations
    createProject: { schema: CreateProjectInputSchema, argMode: 'single-object' },
    updateProject: { schema: UpdateProjectInputSchema, argMode: 'single-object' },
    setProjectStatus: { schema: SetProjectStatusInputSchema, argMode: 'single-object' },
    updateFinishCriteria: { schema: UpdateFinishCriteriaInputSchema, argMode: 'single-object' },

    // Object-based READ operations with filters
    searchProjects: { schema: SearchProjectsInputSchema, argMode: 'single-object' },
  },

  plan: {
    // No-arg
    getPlanPath: { schema: z.undefined(), argMode: 'none' },
    planHasContent: { schema: z.undefined(), argMode: 'none' },
    readDailyPlan: { schema: z.undefined(), argMode: 'none' },
    clearPlan: { schema: z.undefined(), argMode: 'none' },

    // Object-based WRITE operations
    createDailyPlan: { schema: CreateDailyPlanInputSchema, argMode: 'single-object' },

    // Simple positional (date string)
    archivePlanToLog: { schema: ISODateSchema, argMode: 'positional-id' },
  },

  profile: {
    // No-arg
    getProfile: { schema: z.undefined(), argMode: 'none' },
    getProfilePath: { schema: z.undefined(), argMode: 'none' },
    profileExists: { schema: z.undefined(), argMode: 'none' },
    getCurrentTimePeriod: { schema: z.undefined(), argMode: 'none' },
    getCurrentEnergyLevel: { schema: z.undefined(), argMode: 'none' },

    // Object-based WRITE operations
    updateAttribute: { schema: UpdateAttributeInputSchema, argMode: 'single-object' },
    addObservation: { schema: AddObservationInputSchema, argMode: 'single-object' },
  },

  journalMd: {
    // Simple positional (string dates)
    journalFileExists: { schema: z.string(), argMode: 'positional-id' },
    getJournalFilePath: { schema: z.string(), argMode: 'positional-id' },
    generateJournalMarkdown: { schema: z.string(), argMode: 'positional-id' },
    regenerateJournalMarkdown: { schema: z.string(), argMode: 'positional-id' },
  },

  time: {
    // Simple positional with optional string
    getTimeInfo: { schema: z.string().optional(), argMode: 'positional-id' },
  },

  paths: {
    // No-arg path utilities
    getPkmRoot: { schema: z.undefined(), argMode: 'none' },
    getLocalRoot: { schema: z.undefined(), argMode: 'none' },
    getAidaDir: { schema: z.undefined(), argMode: 'none' },
    getDatabasePath: { schema: z.undefined(), argMode: 'none' },
    getContextDir: { schema: z.undefined(), argMode: 'none' },
    getProfilePath: { schema: z.undefined(), argMode: 'none' },
    getJournalDir: { schema: z.undefined(), argMode: 'none' },
    getDailyJournalDir: { schema: z.undefined(), argMode: 'none' },
    getPlanFilePath: { schema: z.undefined(), argMode: 'none' },
    getInboxDir: { schema: z.undefined(), argMode: 'none' },
    getSharedDir: { schema: z.undefined(), argMode: 'none' },
    getTemplatesDir: { schema: z.undefined(), argMode: 'none' },
    getSchemaPath: { schema: z.undefined(), argMode: 'none' },
  },
};
