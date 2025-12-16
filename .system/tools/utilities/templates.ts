/**
 * Template Loading and Rendering for AIDA
 *
 * Provides utilities for loading and rendering markdown templates for journal logs and daily plans.
 * Supports simple Mustache-style syntax for variable interpolation and section rendering.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SWEDISH_MONTHS, SWEDISH_WEEKDAYS } from './time.js';

/**
 * Path to the templates directory
 * Uses import.meta.dir for stable path resolution regardless of working directory
 */
const PROJECT_ROOT = join(import.meta.dir, '../../..');
const TEMPLATES_DIR = join(PROJECT_ROOT, '.system', 'templates');

/**
 * Template names available in the system
 */
export type TemplateName = 'journal-log' | 'daily-plan';

/**
 * Load a template file from the templates directory
 * @param name - Name of the template (without .md extension)
 * @returns Template content as string
 * @throws Error if template file doesn't exist
 */
export function loadTemplate(name: TemplateName): string {
  const templatePath = join(TEMPLATES_DIR, `${name}.md`);

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return readFileSync(templatePath, 'utf-8');
}

/**
 * Format a date for Swedish display
 * @param date - Date to format
 * @returns Object with formatted date parts
 */
export function formatSwedishDate(date: Date) {
  const day = date.getDate();
  const month = SWEDISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const weekday = SWEDISH_WEEKDAYS[date.getDay()];

  return {
    day,
    month_name: month,
    month_number: date.getMonth() + 1,
    year,
    weekday,
    weekday_lowercase: weekday.toLowerCase(),
    date_short: `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    date_long: `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  };
}

/**
 * Simple template renderer using Mustache-style syntax
 * Supports: {{variable}}, {{#section}}...{{/section}}, {{^section}}...{{/section}}
 * @param template - Template string
 * @param data - Data object to render
 * @returns Rendered template
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;

  // Handle sections {{#key}}...{{/key}} FIRST (before simple variables)
  result = result.replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const trimmedKey = key.trim();
    const value = data[trimmedKey];

    if (!value) return '';

    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const itemData = typeof item === 'object' ? { ...item, index: index + 1 } : { value: item, index: index + 1 };
        return renderTemplate(content, itemData);
      }).join('');
    }

    if (typeof value === 'object') {
      return renderTemplate(content, value);
    }

    return value ? content : '';
  });

  // Handle inverted sections {{^key}}...{{/key}}
  result = result.replace(/\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const trimmedKey = key.trim();
    const value = data[trimmedKey];

    if (!value || (Array.isArray(value) && value.length === 0)) {
      return content;
    }

    return '';
  });

  // Replace simple variables {{variable}} LAST (after sections)
  result = result.replace(/\{\{([^#^\/][^}]*)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : '';
  });

  return result;
}

/**
 * Check if a template exists
 * @param name - Template name
 * @returns True if template exists
 */
export function templateExists(name: TemplateName): boolean {
  const templatePath = join(TEMPLATES_DIR, `${name}.md`);
  return existsSync(templatePath);
}
