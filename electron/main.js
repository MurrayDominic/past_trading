const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const isDev = !!process.env.ELECTRON_DEV;

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
      sandbox: false,
      devTools: isDev
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    backgroundColor: '#000000',
    show: false
  });

  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  // Show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the game
  mainWindow.loadFile('index.html');

  // Open DevTools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // F11 fullscreen toggle, Escape to exit fullscreen
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'Escape' && input.type === 'keyDown' && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
      event.preventDefault();
    }
  });

  // Throttle when window loses focus (reduce CPU in background)
  mainWindow.on('blur', () => {
    if (mainWindow.webContents) {
      mainWindow.webContents.setFrameRate(15);
    }
  });
  mainWindow.on('focus', () => {
    if (mainWindow.webContents) {
      mainWindow.webContents.setFrameRate(60);
    }
  });

  return mainWindow;
}

// ---- App Lifecycle ----

app.whenReady().then(() => {
  // Suppress console.log in production
  if (!isDev) {
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

  ipcMain.handle('toggle-borderless', () => {
    if (mainWindow) {
      mainWindow.setSimpleFullScreen(!mainWindow.isSimpleFullScreen());
    }
  });

  ipcMain.handle('get-fullscreen-state', () => {
    if (mainWindow) {
      return {
        fullscreen: mainWindow.isFullScreen(),
        borderless: mainWindow.isSimpleFullScreen()
      };
    }
    return { fullscreen: false, borderless: false };
  });

  ipcMain.handle('quit-app', () => {
    app.quit();
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
