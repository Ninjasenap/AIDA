import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'fs';
import { homedir } from 'os';
import {
  expandPath,
  getConfig,
  getLocalRoot,
  getPkmRoot,
  getDatabasePath,
  getProfilePath,
  getContextDir,
  getAidaDir,
  getJournalDir,
  getDailyJournalDir,
  getPlanFilePath,
  getInboxDir,
  getSharedDir,
  getTemplatesDir,
  getSchemaPath,
  getConfigPath,
  resetCache,
} from '../paths';

describe('paths.ts', () => {
  const CONFIG_PATH = getConfigPath();
  const CONFIG_DIR = join(CONFIG_PATH, '..');
  let originalConfigExists = false;
  let originalConfigContent: string;

  beforeEach(async () => {
    // Spara befintlig config om den finns
    if (existsSync(CONFIG_PATH)) {
      originalConfigExists = true;
      originalConfigContent = await Bun.file(CONFIG_PATH).text();
    }

    // Rensa cache
    resetCache();
  });

  afterEach(() => {
    // Återställ config
    if (originalConfigExists && originalConfigContent) {
      writeFileSync(CONFIG_PATH, originalConfigContent);
    } else if (existsSync(CONFIG_PATH)) {
      unlinkSync(CONFIG_PATH);
    }
  });

  describe('expandPath', () => {
    test('expanderar ~ till home-katalog', () => {
      const path = '~/test/path';
      const expanded = expandPath(path);
      expect(expanded).toBe(join(homedir(), 'test/path'));
    });

    test('hanterar sökvägar utan ~', () => {
      const path = '/absolute/path';
      const expanded = expandPath(path);
      expect(expanded).toBe('/absolute/path');
    });

    test('hanterar tom sträng', () => {
      const expanded = expandPath('');
      expect(expanded).toBe('');
    });

    test('expanderar $HOME på Unix-system', () => {
      if (process.platform !== 'win32') {
        const originalHome = process.env.HOME;
        process.env.HOME = '/Users/testuser';

        const path = '$HOME/test/path';
        const expanded = expandPath(path);
        expect(expanded).toBe('/Users/testuser/test/path');

        if (originalHome) {
          process.env.HOME = originalHome;
        }
      }
    });
  });

  describe('getConfig', () => {
    test('kastar fel om config-fil saknas', () => {
      // Ta bort config om den finns
      if (existsSync(CONFIG_PATH)) {
        unlinkSync(CONFIG_PATH);
      }

      expect(() => getConfig()).toThrow();
    });

    test('läser giltig config-fil', () => {
      const testConfig = {
        _meta: { version: '1.0' },
        paths: {
          pkm_root: '/test/pkm',
          local_root: '/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      const config = getConfig();
      expect(config).not.toBeNull();
      expect(config?.paths.pkm_root).toBe('/test/pkm');
      expect(config?.paths.local_root).toBe('/test/local');
    });

    test('kastar fel vid ogiltig config-struktur', () => {
      const invalidConfig = {
        _meta: { version: '1.0' },
        paths: {
          // pkm_root saknas
          local_root: '/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(invalidConfig, null, 2));

      expect(() => getConfig()).toThrow();
    });
  });

  describe('getLocalRoot och getPkmRoot', () => {
    test('returnerar olika roots', () => {
      const testConfig = {
        _meta: { version: '1.0' },
        paths: {
          pkm_root: '/test/pkm',
          local_root: '/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      const localRoot = getLocalRoot();
      const pkmRoot = getPkmRoot();

      expect(localRoot).toBe('/test/local');
      expect(pkmRoot).toBe('/test/pkm');
    });

    test('expanderar ~ i config-sökvägar', () => {
      const testConfig = {
        _meta: { version: '1.0' },
        paths: {
          pkm_root: '~/test/pkm',
          local_root: '~/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      const localRoot = getLocalRoot();
      const pkmRoot = getPkmRoot();

      expect(localRoot).toBe(join(homedir(), 'test/local'));
      expect(pkmRoot).toBe(join(homedir(), 'test/pkm'));
    });
  });

  describe('PKM-sökvägar', () => {
    test('genererar korrekta PKM-sökvägar', () => {
      const testConfig = {
        _meta: { version: '1.0' },
        paths: {
          pkm_root: '/test/pkm',
          local_root: '/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      const aidaDir = getAidaDir();
      const dbPath = getDatabasePath();
      const profilePath = getProfilePath();
      const contextDir = getContextDir();
      const journalDir = getJournalDir();
      const dailyJournalDir = getDailyJournalDir();
      const planPath = getPlanFilePath();

      expect(aidaDir).toBe('/test/pkm/.aida');
      expect(dbPath).toBe('/test/pkm/.aida/data/aida.db');
      expect(profilePath).toBe('/test/pkm/.aida/context/personal-profile.json');
      expect(contextDir).toBe('/test/pkm/.aida/context');
      expect(journalDir).toBe('/test/pkm/0-JOURNAL');
      expect(dailyJournalDir).toBe('/test/pkm/0-JOURNAL/1-DAILY');
      expect(planPath).toBe('/test/pkm/0-JOURNAL/PLAN.md');
    });
  });

  describe('LOCAL-sökvägar', () => {
    test('genererar korrekta LOCAL-sökvägar', () => {
      const testConfig = {
        _meta: { version: '1.0' },
        paths: {
          pkm_root: '/test/pkm',
          local_root: '/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      const templatesDir = getTemplatesDir();
      const schemaPath = getSchemaPath();

      expect(templatesDir).toBe('/test/local/templates');
      expect(schemaPath).toBe('/test/local/data/schema/db_schema.sql');
    });
  });

  describe('Alla PKM-mappar', () => {
    test('returnerar alla PKM-kataloger korrekt', () => {
      const testConfig = {
        _meta: { version: '1.0' },
        paths: {
          pkm_root: '/test/pkm',
          local_root: '/test/local',
        },
      };

      // Skapa config-katalog om den inte finns
      if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
      }

      writeFileSync(CONFIG_PATH, JSON.stringify(testConfig, null, 2));

      expect(getInboxDir()).toBe('/test/pkm/0-INBOX');
      expect(getSharedDir()).toBe('/test/pkm/0-SHARED');
      expect(getJournalDir()).toBe('/test/pkm/0-JOURNAL');
    });
  });
});
