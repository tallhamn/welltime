import {
  exists,
  create,
  readTextFile,
  writeTextFile,
  readDir,
} from '@tauri-apps/plugin-fs';
import { homeDir } from '@tauri-apps/api/path';
import type { AppState, Snapshot } from './types';
import { serializeToMarkdown, parseMarkdown } from './markdown';
import {
  APP_DIR_NAME,
  CURRENT_MD_FILE,
  CURRENT_JSON_FILE,
  HISTORY_DIR,
} from './constants';

/**
 * Initialize storage directory structure
 */
export async function initializeStorage(): Promise<void> {
  const home = await homeDir();
  const appDir = `${home}${APP_DIR_NAME}`;

  try {
    // Create main app directory
    const appDirExists = await exists(appDir);
    if (!appDirExists) {
      await create(appDir);
    }

    // Create history directory
    const historyDir = `${appDir}/${HISTORY_DIR}`;
    const historyDirExists = await exists(historyDir);
    if (!historyDirExists) {
      await create(historyDir);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    throw error;
  }
}

/**
 * Check if the app has been initialized (has data files)
 */
export async function isInitialized(): Promise<boolean> {
  try {
    const home = await homeDir();
    const jsonPath = `${home}${APP_DIR_NAME}/${CURRENT_JSON_FILE}`;
    return await exists(jsonPath);
  } catch {
    return false;
  }
}

/**
 * Save current state to both Markdown and JSON files
 */
export async function saveCurrentState(state: AppState): Promise<void> {
  const home = await homeDir();
  const appDir = `${home}${APP_DIR_NAME}`;

  try {
    // Save as Markdown (human-readable)
    const markdown = serializeToMarkdown(state.habits, state.tasks);
    await writeTextFile(`${appDir}/${CURRENT_MD_FILE}`, markdown);

    // Save as JSON (fast loading)
    const json = JSON.stringify(state, null, 2);
    await writeTextFile(`${appDir}/${CURRENT_JSON_FILE}`, json);
  } catch (error) {
    console.error('Error saving current state:', error);
    throw error;
  }
}

/**
 * Load current state from JSON file (fast) or Markdown file (fallback)
 */
export async function loadCurrentState(): Promise<AppState | null> {
  const home = await homeDir();
  const appDir = `${home}${APP_DIR_NAME}`;

  try {
    // Try to load from JSON first (faster)
    const jsonPath = `${appDir}/${CURRENT_JSON_FILE}`;
    const jsonExists = await exists(jsonPath);

    if (jsonExists) {
      const json = await readTextFile(jsonPath);
      return JSON.parse(json) as AppState;
    }

    // Fallback to Markdown
    const mdPath = `${appDir}/${CURRENT_MD_FILE}`;
    const mdExists = await exists(mdPath);

    if (mdExists) {
      const markdown = await readTextFile(mdPath);
      return parseMarkdown(markdown);
    }

    return null;
  } catch (error) {
    console.error('Error loading current state:', error);
    return null;
  }
}

/**
 * Create a snapshot of the current state
 */
export async function createSnapshot(
  state: AppState,
  reason: string
): Promise<Snapshot> {
  const home = await homeDir();
  const historyDir = `${home}${APP_DIR_NAME}/${HISTORY_DIR}`;

  const timestamp = new Date().toISOString();
  const filename = `${timestamp.replace(/[:.]/g, '-')}_${reason}.md`;

  const snapshot: Snapshot = {
    timestamp,
    reason,
    markdown: serializeToMarkdown(state.habits, state.tasks),
    data: state,
  };

  try {
    // Save snapshot
    await writeTextFile(`${historyDir}/${filename}`, snapshot.markdown);

    // Prune old snapshots
    await pruneSnapshots();

    return snapshot;
  } catch (error) {
    console.error('Error creating snapshot:', error);
    throw error;
  }
}

/**
 * Prune old snapshots, keeping only the most recent MAX_SNAPSHOTS
 */
async function pruneSnapshots(): Promise<void> {
  const home = await homeDir();
  const historyDir = `${home}${APP_DIR_NAME}/${HISTORY_DIR}`;

  try {
    const entries = await readDir(historyDir);
    // Sort by name (timestamp) descending
    entries
      .filter((entry) => !entry.isDirectory && entry.name.endsWith('.md'))
      .sort((a, b) => b.name.localeCompare(a.name));

    // TODO: Delete files beyond MAX_SNAPSHOTS
    // Note: Tauri plugin-fs doesn't have a delete function in the stable API yet
    // This will need to be implemented when the API is available
  } catch (error) {
    console.error('Error pruning snapshots:', error);
  }
}

/**
 * Get list of available snapshots
 */
export async function getSnapshots(): Promise<string[]> {
  const home = await homeDir();
  const historyDir = `${home}${APP_DIR_NAME}/${HISTORY_DIR}`;

  try {
    const entries = await readDir(historyDir);
    return entries
      .filter((entry) => !entry.isDirectory && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error getting snapshots:', error);
    return [];
  }
}

/**
 * Load a specific snapshot
 */
export async function loadSnapshot(filename: string): Promise<AppState | null> {
  const home = await homeDir();
  const historyDir = `${home}${APP_DIR_NAME}/${HISTORY_DIR}`;

  try {
    const markdown = await readTextFile(`${historyDir}/${filename}`);
    return parseMarkdown(markdown);
  } catch (error) {
    console.error('Error loading snapshot:', error);
    return null;
  }
}
