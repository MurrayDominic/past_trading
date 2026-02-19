const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Steam integration (loaded lazily after app is ready)
let steam = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Second Chance at a Billion',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    backgroundColor: '#000000',
    show: false
  });

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);

  // Show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the game
  mainWindow.loadFile('index.html');

  // Open DevTools in dev mode
  if (process.env.ELECTRON_DEV) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

// ---- App Lifecycle ----

app.whenReady().then(() => {
  // Suppress console.log in production
  if (!process.env.ELECTRON_DEV) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
  }

  // Register IPC handlers
  ipcMain.on('get-user-data-path', (event) => {
    event.returnValue = app.getPath('userData');
  });

  ipcMain.on('get-app-path', (event) => {
    event.returnValue = app.getAppPath();
  });

  ipcMain.on('get-resources-path', (event) => {
    event.returnValue = process.resourcesPath || path.join(__dirname, '..');
  });

  ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // Steam IPC handlers
  ipcMain.handle('steam-unlock-achievement', (event, achievementId) => {
    if (steam) return steam.unlockAchievement(achievementId);
    return false;
  });

  ipcMain.handle('steam-is-initialized', () => {
    if (steam) return steam.isInitialized();
    return false;
  });

  // Load and initialize Steam
  try {
    steam = require('./steam');
    steam.initSteam();
  } catch (e) {
    // Expected when not running through Steam
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
