import { describe, expect, test, afterEach } from 'bun:test';
import { unlinkSync, existsSync } from 'fs';
import {
  generateJournalMarkdown,
  writeJournalMarkdown,
  regenerateJournalMarkdown,
  journalFileExists,
  getJournalFilePath
} from '../journal-markdown';
import { createEntry } from '../../database/queries/journal';

describe('Journal Markdown Generation', () => {

  afterEach(() => {
    // Clean up generated files
    const today = new Date().toISOString().split('T')[0];
    const filePath = getJournalFilePath(today);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  });

  test('should generate markdown with date header', () => {
    const today = new Date().toISOString().split('T')[0];
    const markdown = generateJournalMarkdown(today);

    expect(markdown).toContain(`# ${today}`);
    expect(markdown.length).toBeGreaterThan(0);
  });

  test('should handle date with no entries', () => {
    const futureDate = '2099-01-01';
    const markdown = generateJournalMarkdown(futureDate);

    expect(markdown).toContain('# 2099-01-01');
    expect(markdown).toContain('_Inga journalposter för denna dag_');
  });

  test('should write markdown to file', () => {
    const today = new Date().toISOString().split('T')[0];
    const content = '# Test content';
    const filePath = writeJournalMarkdown(today, content);

    expect(existsSync(filePath)).toBe(true);
    expect(journalFileExists(today)).toBe(true);
  });

  test('should regenerate markdown from database entries', () => {
    const today = new Date().toISOString().split('T')[0];
    const filePath = regenerateJournalMarkdown(today);

    expect(existsSync(filePath)).toBe(true);
  });

  test('should auto-regenerate on createEntry', () => {
    const testDate = new Date().toISOString().split('T')[0];

    // Create a new entry
    createEntry({
      entry_type: 'note',
      content: 'Test note for auto-regen',
      timestamp: new Date().toISOString()
    });

    // File should exist due to auto-regeneration
    expect(journalFileExists(testDate)).toBe(true);

    // Clean up
    const filePath = getJournalFilePath(testDate);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  });
});
