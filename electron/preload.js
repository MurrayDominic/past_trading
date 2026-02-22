const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Get paths from main process
const userDataPath = ipcRenderer.sendSync('get-user-data-path');
const appPath = ipcRenderer.sendSync('get-app-path');
const resourcesPath = ipcRenderer.sendSync('get-resources-path');

// Suppress renderer console in production (keep errors/warnings for crash diagnostics)
if (!process.env.ELECTRON_DEV) {
  const noop = () => {};
  window.addEventListener('DOMContentLoaded', () => {
    console.log = noop;
    console.debug = noop;
    console.info = noop;
  });
}

// Sanitize paths to prevent directory traversal attacks
function safePath(input) {
  const normalized = path.normalize(input);
  if (normalized.includes('..')) return null;
  if (path.isAbsolute(normalized)) return null;
  return normalized;
}

function safeFilename(input) {
  const base = path.basename(input);
  if (base !== input || base.includes('..')) return null;
  return base;
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  isDev: !!process.env.ELECTRON_DEV,
  platform: process.platform,

  // ---- File Reading (game assets) ----

  readFile: (relativePath) => {
    const safe = safePath(relativePath);
    if (!safe) return null;
    const devPath = path.join(appPath, safe);
    if (fs.existsSync(devPath)) {
      return fs.readFileSync(devPath, 'utf-8');
    }
    const prodPath = path.join(resourcesPath, 'app', safe);
    if (fs.existsSync(prodPath)) {
      return fs.readFileSync(prodPath, 'utf-8');
    }
    return null;
  },

  readFileBuffer: (relativePath) => {
    const safe = safePath(relativePath);
    if (!safe) return null;
    const devPath = path.join(appPath, safe);
    if (fs.existsSync(devPath)) {
      const buf = fs.readFileSync(devPath);
      return new Uint8Array(buf);
    }
    const prodPath = path.join(resourcesPath, 'app', safe);
    if (fs.existsSync(prodPath)) {
      const buf = fs.readFileSync(prodPath);
      return new Uint8Array(buf);
    }
    return null;
  },

  fileExists: (relativePath) => {
    const safe = safePath(relativePath);
    if (!safe) return false;
    const devPath = path.join(appPath, safe);
    if (fs.existsSync(devPath)) return true;
    const prodPath = path.join(resourcesPath, 'app', safe);
    return fs.existsSync(prodPath);
  },

  // ---- Compressed Data (Phase 3) ----

  readCompressedFile: (compressedRelPath, cacheFilePath) => {
    const safeRel = safePath(compressedRelPath);
    if (!safeRel) return null;
    // Validate cache path stays within userData
    const resolvedCache = path.resolve(cacheFilePath);
    if (!resolvedCache.startsWith(path.resolve(userDataPath))) return null;

    // Check if decompressed cache exists
    if (fs.existsSync(resolvedCache)) {
      return fs.readFileSync(resolvedCache, 'utf-8');
    }

    // Find the compressed file
    let compressedFullPath = path.join(appPath, safeRel);
    if (!fs.existsSync(compressedFullPath)) {
      // Try extraResources location (packaged app)
      compressedFullPath = path.join(resourcesPath, 'market_data_archives',
        safeRel.replace('assets/market_data/compressed/', '').replace('assets\\market_data\\compressed\\', ''));
    }
    if (!fs.existsSync(compressedFullPath)) return null;

    // Decompress
    const compressed = fs.readFileSync(compressedFullPath);
    const decompressed = zlib.gunzipSync(compressed);
    const text = decompressed.toString('utf-8');

    // Cache to userData for future loads
    const cacheDir = path.dirname(resolvedCache);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(resolvedCache, text, 'utf-8');

    return text;
  },

  getCachePath: (category, filename) => {
    return path.join(userDataPath, 'market_data_cache', category, filename);
  },

  // ---- Save System ----

  readSave: (filename) => {
    const safe = safeFilename(filename);
    if (!safe) return null;
    const filePath = path.join(userDataPath, 'saves', safe);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  },

  writeSave: (filename, data) => {
    const safe = safeFilename(filename);
    if (!safe) return;
    const saveDir = path.join(userDataPath, 'saves');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    fs.writeFileSync(path.join(saveDir, safe), data, 'utf-8');
  },

  deleteSave: (filename) => {
    const safe = safeFilename(filename);
    if (!safe) return;
    const filePath = path.join(userDataPath, 'saves', safe);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },

  // ---- Steam (via IPC to main process) ----

  steam: {
    unlockAchievement: (id) => ipcRenderer.invoke('steam-unlock-achievement', id),
    isInitialized: () => ipcRenderer.invoke('steam-is-initialized'),
  },

  // ---- Window Controls ----

  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  toggleBorderless: () => ipcRenderer.invoke('toggle-borderless'),
  getFullscreenState: () => ipcRenderer.invoke('get-fullscreen-state'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
});
