/**
 * Validation Module Entry Point
 *
 * Re-exports all validation schemas, validator, and registry.
 */

// Schemas
export * from './schemas/common';
export * from './schemas/todoist-tasks';
export * from './schemas/todoist-tags';
export * from './schemas/journal';
export * from './schemas/roles';
export * from './schemas/projects';
export * from './schemas/plan';
export * from './schemas/profile';

// Validator
export * from './validator';

// Registry
export { schemaRegistry } from './registry';
