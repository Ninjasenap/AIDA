/**
 * CLI Argument Validator
 *
 * Validates CLI arguments against registered schemas and returns
 * structured errors for AI self-correction.
 */
import { z } from 'zod';
import { schemaRegistry } from './registry';

export interface ValidationResult {
  success: boolean;
  data?: unknown[];  // Always an array for spreading to function calls
  error?: CLIValidationError;
}

export interface CLIValidationError {
  message: string;
  module: string;
  function: string;
  details: FieldError[];
  suggestion: string;
}

export interface FieldError {
  field: string;
  received: unknown;
  expected: string;
  message: string;
}

/**
 * Validates CLI arguments against registered schemas.
 * Returns validated data or structured error for AI self-correction.
 */
export function validateCLIArgs(
  module: string,
  func: string,
  args: unknown[]
): ValidationResult {
  const moduleRegistry = schemaRegistry[module];

  if (!moduleRegistry) {
    return {
      success: false,
      error: {
        message: `Unknown module: ${module}`,
        module,
        function: func,
        details: [],
        suggestion: `Available modules: ${Object.keys(schemaRegistry).join(', ')}`,
      },
    };
  }

  const entry = moduleRegistry[func];

  if (!entry) {
    return {
      success: false,
      error: {
        message: `Unknown function: ${module}.${func}`,
        module,
        function: func,
        details: [],
        suggestion: `Available functions in ${module}: ${Object.keys(moduleRegistry).join(', ')}`,
      },
    };
  }

  const { schema, argMode } = entry;

  // Handle different argument modes
  switch (argMode) {
    case 'none':
      return { success: true, data: [] };

    case 'positional-id':
      return validatePositionalId(schema, args, module, func);

    case 'single-object':
      return validateSingleObject(schema, args, module, func);

    default:
      return { success: true, data: args };
  }
}

function validatePositionalId(
  schema: z.ZodSchema,
  args: unknown[],
  module: string,
  func: string
): ValidationResult {
  // Allow no args for optional schemas
  if (args.length === 0 && schema instanceof z.ZodOptional) {
    return { success: true, data: [] };
  }

  if (args.length !== 1 && !(schema instanceof z.ZodOptional)) {
    return {
      success: false,
      error: {
        message: `${module}.${func} requires exactly 1 argument`,
        module,
        function: func,
        details: [],
        suggestion: `Usage: ${module} ${func} <id>`,
      },
    };
  }

  const result = schema.safeParse(args[0]);

  if (!result.success) {
    return {
      success: false,
      error: formatZodError(result.error, module, func, args[0]),
    };
  }

  return { success: true, data: [result.data] };
}

function validateSingleObject(
  schema: z.ZodSchema,
  args: unknown[],
  module: string,
  func: string
): ValidationResult {
  // Allow optional schemas with no args
  if (args.length === 0 && schema instanceof z.ZodOptional) {
    return { success: true, data: [] };
  }

  if (args.length !== 1) {
    return {
      success: false,
      error: {
        message: `${module}.${func} requires a single JSON object argument`,
        module,
        function: func,
        details: [],
        suggestion: `Usage: ${module} ${func} '{"field": "value"}'`,
      },
    };
  }

  const input = args[0];

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      success: false,
      error: {
        message: `${module}.${func} expected object, got ${Array.isArray(input) ? 'array' : typeof input}`,
        module,
        function: func,
        details: [
          {
            field: 'input',
            received: input,
            expected: 'object',
            message: 'Argument must be a JSON object',
          },
        ],
        suggestion: `Usage: ${module} ${func} '{"field": "value"}'`,
      },
    };
  }

  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: formatZodError(result.error, module, func, input),
    };
  }

  return { success: true, data: [result.data] };
}

function formatZodError(
  error: z.ZodError,
  module: string,
  func: string,
  received: unknown
): CLIValidationError {
  const details: FieldError[] = error.issues.map((issue) => ({
    field: issue.path.join('.') || 'input',
    received: getValueAtPath(received, issue.path),
    expected: getExpectedFromIssue(issue),
    message: issue.message,
  }));

  // Generate helpful suggestion
  // Missing required fields show as "expected X, received undefined" or contain "Required"
  const missingRequired = details.filter((d) =>
    d.message.includes('Required') ||
    (d.message.includes('expected') && d.received === undefined)
  );
  const invalidValues = details.filter((d) =>
    !d.message.includes('Required') &&
    !(d.message.includes('expected') && d.received === undefined)
  );

  let suggestion = '';

  if (missingRequired.length > 0) {
    suggestion = `Missing required fields: ${missingRequired.map((d) => d.field).join(', ')}. `;
  }

  if (invalidValues.length > 0) {
    suggestion += `Invalid values: ${invalidValues
      .map((d) => `${d.field} should be ${d.expected}`)
      .join('; ')}`;
  }

  return {
    message: `Validation failed for ${module}.${func}`,
    module,
    function: func,
    details,
    suggestion: suggestion || 'Check the function signature in docs/query-reference.md',
  };
}

function getValueAtPath(obj: unknown, path: (string | number)[]): unknown {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function getExpectedFromIssue(issue: z.ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.expected;
    case 'invalid_enum_value':
      return `one of: ${(issue as any).options?.join(', ') || 'valid enum value'}`;
    case 'too_small':
      return `minimum ${(issue as any).minimum}`;
    case 'too_big':
      return `maximum ${(issue as any).maximum}`;
    case 'invalid_string':
      if ((issue as any).validation === 'regex') {
        return 'valid format';
      }
      return 'valid string';
    default:
      return 'valid value';
  }
}
