/**
 * JSON serialization utilities for CLI output
 *
 * Provides utilities for converting complex JavaScript types (like Map)
 * to JSON-serializable formats.
 */

/**
 * Custom JSON replacer that converts Map objects to plain objects.
 *
 * Required because JSON.stringify() serializes Map to {} by default.
 * This replacer converts Maps using Object.fromEntries() to preserve
 * all key-value pairs.
 *
 * @param _key - The key being stringified (unused, required by replacer signature)
 * @param value - The value being stringified
 * @returns The value to be stringified (Map converted to object, others unchanged)
 *
 * @example
 * const data = { tasks: new Map([['ready', []], ['done', []]]) };
 * JSON.stringify(data, mapReplacer);
 * // Returns: '{"tasks":{"ready":[],"done":[]}}'
 */
export function mapReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

/**
 * Serialize value to formatted JSON with Map support.
 *
 * Convenience function that combines JSON.stringify with the mapReplacer
 * to handle Map objects correctly. Output is formatted with 2-space indentation.
 *
 * @param value - The value to serialize
 * @returns Formatted JSON string with Maps converted to objects
 *
 * @example
 * const tasks = new Map([['ready', []], ['done', []]]);
 * serializeWithMaps({ tasks });
 * // Returns formatted JSON with tasks as a plain object
 */
export function serializeWithMaps(value: unknown): string {
  return JSON.stringify(value, mapReplacer, 2);
}
