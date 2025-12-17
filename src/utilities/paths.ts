import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';

/**
 * AIDA path configuration structure
 */
export interface AidaPathsConfig {
  _meta: { version: string };
  paths: {
    pkm_root: string;
    local_root: string;
  };
}

/**
 * Cache för config och roots
 */
let configCache: AidaPathsConfig | null | undefined = undefined;
let localRootCache: string | undefined = undefined;
let pkmRootCache: string | undefined = undefined;

/**
 * Återställer alla caches (endast för tester)
 * @internal
 */
export function resetCache(): void {
  configCache = undefined;
  localRootCache = undefined;
  pkmRootCache = undefined;
}

/**
 * Expanderar ~ och miljövariabler i en sökväg
 *
 * @param path - Sökväg som kan innehålla ~ eller miljövariabler
 * @returns Expanderad absolut sökväg
 */
export function expandPath(path: string): string {
  if (!path) return path;

  // Expandera ~ till home-katalog (cross-platform)
  if (path.startsWith('~')) {
    path = join(homedir(), path.slice(1));
  }

  // Ersätt miljövariabler som $HOME, %USERPROFILE%, etc.
  // Windows: %VARNAME%
  if (process.platform === 'win32') {
    path = path.replace(/%([^%]+)%/g, (_, varName) => {
      return process.env[varName] || `%${varName}%`;
    });
  }

  // Unix: $VARNAME eller ${VARNAME}
  path = path.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    return process.env[varName] || `\${${varName}}`;
  });
  path = path.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, varName) => {
    return process.env[varName] || `$${varName}`;
  });

  return path;
}

/**
 * Hämtar config-filens sökväg
 *
 * @returns Absolut sökväg till config-filen
 */
export function getConfigPath(): string {
  const PROJECT_ROOT = join(import.meta.dir, '../..');
  return join(PROJECT_ROOT, 'config/aida-paths.json');
}

/**
 * Läser och parsar config-filen
 *
 * @returns Config-objektet, eller null om config-filen saknas (legacy mode)
 */
export function getConfig(): AidaPathsConfig | null {
  // Returnera cached värde om det finns
  if (configCache !== undefined) {
    return configCache;
  }

  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    configCache = null;
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as AidaPathsConfig;

    // Validera config-struktur
    if (!config.paths || !config.paths.pkm_root || !config.paths.local_root) {
      throw new Error('Invalid config structure: missing required paths');
    }

    configCache = config;
    return config;
  } catch (error) {
    throw new Error(`Failed to read config file at ${configPath}: ${error}`);
  }
}

/**
 * Kontrollerar om systemet körs i legacy mode (alla filer i samma mapp)
 *
 * @returns true om config saknas, false annars
 */
export function isLegacyMode(): boolean {
  return getConfig() === null;
}

/**
 * Hämtar LOCAL root (Git-repo root)
 *
 * @returns Absolut sökväg till Git-repot
 */
export function getLocalRoot(): string {
  if (localRootCache) {
    return localRootCache;
  }

  const config = getConfig();

  if (config === null) {
    // Legacy mode: använd project root
    localRootCache = join(import.meta.dir, '../..');
  } else {
    // Separated mode: läs från config
    localRootCache = expandPath(config.paths.local_root);
  }

  return localRootCache;
}

/**
 * Hämtar PKM root (OneDrive eller legacy)
 *
 * @returns Absolut sökväg till PKM-mappen
 */
export function getPkmRoot(): string {
  if (pkmRootCache) {
    return pkmRootCache;
  }

  const config = getConfig();

  if (config === null) {
    // Legacy mode: PKM finns i samma mapp som LOCAL
    pkmRootCache = getLocalRoot();
  } else {
    // Separated mode: läs från config
    pkmRootCache = expandPath(config.paths.pkm_root);
  }

  return pkmRootCache;
}

// ============================================================================
// PKM-sökvägar (i OneDrive under .aida/)
// ============================================================================

/**
 * Hämtar sökväg till .aida/ katalogen i PKM
 *
 * @returns Absolut sökväg till .aida/
 */
export function getAidaDir(): string {
  if (isLegacyMode()) {
    // Legacy mode: använd .system som aida-katalog
    return join(getPkmRoot(), '.system');
  }
  return join(getPkmRoot(), '.aida');
}

/**
 * Hämtar sökväg till databas-filen
 *
 * @returns Absolut sökväg till aida.db
 */
export function getDatabasePath(): string {
  return join(getAidaDir(), 'data/aida.db');
}

/**
 * Hämtar sökväg till context-katalogen
 *
 * @returns Absolut sökväg till context/
 */
export function getContextDir(): string {
  return join(getAidaDir(), 'context');
}

/**
 * Hämtar sökväg till profil-filen
 *
 * @returns Absolut sökväg till personal-profile.json
 */
export function getProfilePath(): string {
  return join(getContextDir(), 'personal-profile.json');
}

// ============================================================================
// PKM-sökvägar (i OneDrive root)
// ============================================================================

/**
 * Hämtar sökväg till journal-katalogen
 *
 * @returns Absolut sökväg till 0-JOURNAL/
 */
export function getJournalDir(): string {
  return join(getPkmRoot(), '0-JOURNAL');
}

/**
 * Hämtar sökväg till dagliga journal-katalogen
 *
 * @returns Absolut sökväg till 0-JOURNAL/1-DAILY/
 */
export function getDailyJournalDir(): string {
  return join(getJournalDir(), '1-DAILY');
}

/**
 * Hämtar sökväg till plan-filen
 *
 * @returns Absolut sökväg till 0-JOURNAL/PLAN.md
 */
export function getPlanFilePath(): string {
  return join(getJournalDir(), 'PLAN.md');
}

/**
 * Hämtar sökväg till inbox-katalogen
 *
 * @returns Absolut sökväg till 0-INBOX/
 */
export function getInboxDir(): string {
  return join(getPkmRoot(), '0-INBOX');
}

/**
 * Hämtar sökväg till shared-katalogen
 *
 * @returns Absolut sökväg till 0-SHARED/
 */
export function getSharedDir(): string {
  return join(getPkmRoot(), '0-SHARED');
}

// ============================================================================
// LOCAL-sökvägar (i Git-repo)
// ============================================================================

/**
 * Hämtar sökväg till templates-katalogen
 *
 * @returns Absolut sökväg till .system/templates/
 */
export function getTemplatesDir(): string {
  return join(getLocalRoot(), 'templates');
}

/**
 * Hämtar sökväg till databas-schema-filen
 *
 * @returns Absolut sökväg till .system/data/schema/db_schema.sql
 */
export function getSchemaPath(): string {
  return join(getLocalRoot(), 'data/schema/db_schema.sql');
}
