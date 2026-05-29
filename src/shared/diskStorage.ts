import { 
    writeTextFile, 
    readTextFile, 
    mkdir, 
    exists, 
    BaseDirectory,
    remove
} from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import { message } from '@tauri-apps/plugin-dialog';

const JLJ_DATA_DIR = 'JLJData';

/**
 * Ensures the JLJData directory exists in the Documents folder.
 */
export const ensureDataDir = async (): Promise<string> => {
    try {
        const docDir = await documentDir();
        const dataPath = await join(docDir, JLJ_DATA_DIR);
        console.log(`[DiskStorage] Document dir: ${docDir}, Data path: ${dataPath}`);
        
        const dirExists = await exists(dataPath);
        if (!dirExists) {
            console.log(`[DiskStorage] Creating directory: ${dataPath}`);
            await mkdir(dataPath, { 
                recursive: true 
            });
        }
        return dataPath;
    } catch (error: any) {
        console.error('[DiskStorage] Error in ensureDataDir:', error);
        await message(`Failed to access Documents folder: ${error.message || error}`, { title: 'Storage Error', kind: 'error' });
        throw error;
    }
};

/**
 * Saves a JSON object to a file in the JLJData directory.
 * @param fileName Name of the file (without .json extension)
 * @param data Data to save
 */
export const saveToDisk = async (fileName: string, data: any): Promise<void> => {
    try {
        const dataPath = await ensureDataDir();
        const path = await join(dataPath, `${fileName}.json`);
        const content = JSON.stringify(data, null, 2);
        await writeTextFile(path, content);
        console.log(`[DiskStorage] Saved successfully to: ${path}`);
    } catch (error: any) {
        console.error(`[DiskStorage] Error saving ${fileName}:`, error);
        await message(`Failed to save ${fileName}: ${error.message || error}`, { title: 'Save Error', kind: 'error' });
    }
};

/**
 * Loads a JSON object from a file in the JLJData directory.
 * @param fileName Name of the file (without .json extension)
 */
export const loadFromDisk = async <T>(fileName: string): Promise<T | null> => {
    try {
        const dataPath = await ensureDataDir();
        const path = await join(dataPath, `${fileName}.json`);
        const fileExists = await exists(path);
        if (!fileExists) return null;
        
        const content = await readTextFile(path);
        return JSON.parse(content) as T;
    } catch (error: any) {
        console.error(`Error loading ${fileName} from disk:`, error);
        await message(`Failed to load ${fileName}: ${error.message || error}`, { title: 'Load Error', kind: 'error' });
        return null;
    }
};

/**
 * Removes a file from the JLJData directory.
 */
export const removeFromDisk = async (fileName: string): Promise<void> => {
    try {
        const dataPath = await ensureDataDir();
        const path = await join(dataPath, `${fileName}.json`);
        const fileExists = await exists(path);
        if (fileExists) {
            await remove(path);
            console.log(`[DiskStorage] Removed: ${path}`);
        }
    } catch (error: any) {
        console.error(`Error removing ${fileName} from disk:`, error);
        await message(`Failed to remove file: ${error.message || error}`, { title: 'Delete Error', kind: 'error' });
    }
};

/**
 * Migration helper to move data from localStorage to disk.
 * Should be called once on app startup.
 */
export const migrateLocalStorageToDisk = async (keys: string[]): Promise<void> => {
    if (typeof window === 'undefined') return;
    console.log('[DiskStorage] Starting migration from localStorage...', keys);
    
    for (const key of keys) {
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                const parsedData = JSON.parse(localData);
                const diskData = await loadFromDisk(key);
                
                if (!diskData) {
                    await saveToDisk(key, parsedData);
                    console.info(`[DiskStorage] Migrated ${key} to disk storage.`);
                } else {
                    console.log(`[DiskStorage] ${key} already exists on disk, skipping migration.`);
                }
            } catch (error) {
                console.error(`[DiskStorage] Migration failed for ${key}:`, error);
            }
        }
    }
    console.log('[DiskStorage] Migration check finished.');
};
