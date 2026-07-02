const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { createMenu } = require('./menu');
const { registerMediaShortcuts } = require('./shortcuts');
const { registerFileHandlers } = require('./ipc/files');
const { registerMetadataHandlers } = require('./ipc/metadata');
const { registerStoreHandlers } = require('./ipc/store');

let mainWindow = null;
let miniWindow = null;
let floatingLyricsWindow = null;
let store = null;

function getStore() {
  if (!store) {
    const Store = require('electron-store');
    store = new Store({
      defaults: {
        playlist: [],
        theme: 'dark',
        volume: 0.8,
        eqPreset: 'Flat',
        eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        history: [],
        windowBounds: { width: 1200, height: 800 },
        playMode: 'sequential', // sequential, shuffle, repeat-one, repeat-all
        favorites: [],
      },
    });
  }
  return store;
}

function createMainWindow() {
  const bounds = getStore().get('windowBounds');

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 900,
    minHeight: 600,
    title: 'Music Player',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'renderer', 'assets', 'icon.png'),
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', () => {
    const [width, height] = mainWindow.getSize();
    getStore().set('windowBounds', { width, height });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMiniPlayerWindow() {
  if (miniWindow) return;

  miniWindow = new BrowserWindow({
    width: 400,
    height: 80,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'renderer', 'assets', 'icon.png'),
  });

  miniWindow.loadFile(path.join(__dirname, '..', 'renderer', 'mini-player.html'));

  miniWindow.on('closed', () => {
    miniWindow = null;
  });
}

function createFloatingLyricsWindow() {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) return;

  floatingLyricsWindow = new BrowserWindow({
    width: 500,
    height: 400,
    minWidth: 300,
    minHeight: 200,
    resizable: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'renderer', 'assets', 'icon.png'),
  });

  floatingLyricsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'floating-lyrics.html'));

  floatingLyricsWindow.on('closed', () => {
    floatingLyricsWindow = null;
    // Notify main window that floating lyrics was closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lyrics:float-closed');
    }
  });
}

// IPC: toggle floating lyrics
ipcMain.handle('window:toggle-floating-lyrics', () => {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) {
    floatingLyricsWindow.close();
    return false;
  } else {
    createFloatingLyricsWindow();
    return true;
  }
});

// IPC: update floating lyrics content
ipcMain.handle('window:update-floating-lyrics', (_event, data) => {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) {
    floatingLyricsWindow.webContents.send('lyrics:update', data);
  }
});

// IPC: close floating lyrics
ipcMain.handle('window:close-floating-lyrics', () => {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) {
    floatingLyricsWindow.close();
  }
});

// IPC: get floating lyrics window bounds (for resize)
ipcMain.handle('window:get-floating-bounds', () => {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) {
    return floatingLyricsWindow.getBounds();
  }
  return null;
});

// IPC: set floating lyrics window bounds (for resize)
ipcMain.handle('window:set-floating-bounds', (_event, bounds) => {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) {
    floatingLyricsWindow.setBounds(bounds);
  }
});

// Close floating lyrics when main window closes
app.on('before-quit', () => {
  if (floatingLyricsWindow && !floatingLyricsWindow.isDestroyed()) {
    floatingLyricsWindow.close();
  }
});

// IPC: toggle mini player
ipcMain.handle('window:toggle-mini', () => {
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.close();
    mainWindow.show();
    return 'main';
  } else {
    mainWindow.hide();
    createMiniPlayerWindow();
    return 'mini';
  }
});

// IPC: get current track info for mini player sync
ipcMain.handle('window:get-player-state', () => {
  // The renderer will send track info, mini window requests it
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('media:request-state');
  }
});

// IPC: close mini player and show main
ipcMain.handle('window:close-mini', () => {
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.close();
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// IPC: send update from main to mini
ipcMain.handle('window:update-mini', (_event, data) => {
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.webContents.send('media:state-update', data);
  }
});

// IPC: update main window title
ipcMain.handle('window:set-title', (_event, title) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(title || 'Music Player');
  }
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.setTitle(title || 'Music Player');
  }
});

// IPC: Mini player action polling — mini window sets action, main window polls and executes
const { app: electronApp } = require('electron');

app.whenReady().then(() => {
  getStore();
  registerFileHandlers(ipcMain);
  registerMetadataHandlers(ipcMain);
  registerStoreHandlers(ipcMain, getStore);
  createMainWindow();
  // Must create menu after mainWindow exists
  createMenu(mainWindow, getStore);
  registerMediaShortcuts(mainWindow);

  // Mini-player action bridge: check for actions set by mini window
  let miniActionInterval = null;
  miniActionInterval = setInterval(() => {
    const action = getStore().get('_mini_action');
    if (action && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('media:shortcut', action);
      getStore().set('_mini_action', null);
    }
  }, 300);
  // Keep reference alive
  app.on('will-quit', () => {
    clearInterval(miniActionInterval);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});