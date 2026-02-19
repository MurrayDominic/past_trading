const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Get paths from main process
const userDataPath = ipcRenderer.sendSync('get-user-data-path');
const appPath = ipcRenderer.sendSync('get-app-path');
const resourcesPath = ipcRenderer.sendSync('get-resources-path');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // ---- File Reading (game assets) ----

  readFile: (relativePath) => {
    // Try app path first (development), then resources path (packaged)
    const devPath = path.join(appPath, relativePath);
    if (fs.existsSync(devPath)) {
      return fs.readFileSync(devPath, 'utf-8');
    }
    const prodPath = path.join(resourcesPath, 'app', relativePath);
    if (fs.existsSync(prodPath)) {
      return fs.readFileSync(prodPath, 'utf-8');
    }
    return null;
  },

  readFileBuffer: (relativePath) => {
    const devPath = path.join(appPath, relativePath);
    if (fs.existsSync(devPath)) {
      const buf = fs.readFileSync(devPath);
      return new Uint8Array(buf);
    }
    const prodPath = path.join(resourcesPath, 'app', relativePath);
    if (fs.existsSync(prodPath)) {
      const buf = fs.readFileSync(prodPath);
      return new Uint8Array(buf);
    }
    return null;
  },

  fileExists: (relativePath) => {
    const devPath = path.join(appPath, relativePath);
    if (fs.existsSync(devPath)) return true;
    const prodPath = path.join(resourcesPath, 'app', relativePath);
    return fs.existsSync(prodPath);
  },

  // ---- Compressed Data (Phase 3) ----

  readCompressedFile: (compressedRelPath, cacheFilePath) => {
    // Check if decompressed cache exists
    if (fs.existsSync(cacheFilePath)) {
      return fs.readFileSync(cacheFilePath, 'utf-8');
    }

    // Find the compressed file
    let compressedFullPath = path.join(appPath, compressedRelPath);
    if (!fs.existsSync(compressedFullPath)) {
      // Try extraResources location (packaged app)
      compressedFullPath = path.join(resourcesPath, 'market_data_archives',
        compressedRelPath.replace('assets/market_data/compressed/', ''));
    }
    if (!fs.existsSync(compressedFullPath)) return null;

    // Decompress
    const compressed = fs.readFileSync(compressedFullPath);
    const decompressed = zlib.gunzipSync(compressed);
    const text = decompressed.toString('utf-8');

    // Cache to userData for future loads
    const cacheDir = path.dirname(cacheFilePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFilePath, text, 'utf-8');

    return text;
  },

  getCachePath: (category, filename) => {
    return path.join(userDataPath, 'market_data_cache', category, filename);
  },

  // ---- Save System ----

  readSave: (filename) => {
    const filePath = path.join(userDataPath, 'saves', filename);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  },

  writeSave: (filename, data) => {
    const saveDir = path.join(userDataPath, 'saves');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    fs.writeFileSync(path.join(saveDir, filename), data, 'utf-8');
  },

  deleteSave: (filename) => {
    const filePath = path.join(userDataPath, 'saves', filename);
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
});
