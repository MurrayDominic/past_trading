// SaveManager - Abstracts storage between Electron (file-based) and browser (localStorage)
// In Electron: saves JSON files to %APPDATA%/Second Chance at a Billion/saves/
// In browser: falls back to localStorage for development/testing

class SaveManager {
  constructor() {
    this.isElectron = !!(window.electronAPI && window.electronAPI.isElectron);
  }

  load(key) {
    try {
      if (this.isElectron) {
        const raw = window.electronAPI.readSave(key + '.json');
        return raw ? JSON.parse(raw) : null;
      } else {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch (e) {
      console.warn(`Failed to load save "${key}":`, e);
      return null;
    }
  }

  save(key, data) {
    try {
      const json = JSON.stringify(data);
      if (this.isElectron) {
        window.electronAPI.writeSave(key + '.json', json);
      } else {
        localStorage.setItem(key, json);
      }
    } catch (e) {
      console.warn(`Failed to save "${key}":`, e);
    }
  }

  remove(key) {
    try {
      if (this.isElectron) {
        window.electronAPI.deleteSave(key + '.json');
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Failed to remove save "${key}":`, e);
    }
  }

  // One-time migration: import localStorage data into file saves
  migrateFromLocalStorage() {
    if (!this.isElectron) return;

    const keys = ['pastTrading_progression', 'pastTrading_leaderboards'];
    for (const key of keys) {
      // Check if file save already exists
      const existing = window.electronAPI.readSave(key + '.json');
      if (existing) continue;

      // Check localStorage for old data
      try {
        const old = localStorage.getItem(key);
        if (old) {
          window.electronAPI.writeSave(key + '.json', old);
          console.log(`Migrated ${key} from localStorage to file`);
        }
      } catch (e) {
        console.warn(`Migration failed for ${key}:`, e);
      }
    }
  }
}

// Global instance
const saveManager = new SaveManager();
