const { globalShortcut } = require('electron');

function registerMediaShortcuts(mainWindow) {
  // Media keys - only if supported
  const sendShortcut = (action) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('media:shortcut', action);
    }
  };

  const shortcuts = [
    { key: 'MediaPlayPause', action: 'play-pause' },
    { key: 'MediaStop', action: 'stop' },
    { key: 'MediaNextTrack', action: 'next' },
    { key: 'MediaPreviousTrack', action: 'previous' },
  ];

  for (const { key, action } of shortcuts) {
    try {
      globalShortcut.register(key, () => sendShortcut(action));
    } catch (err) {
      // Media keys may not be available on all systems
      console.log(`Could not register global shortcut: ${key}`);
    }
  }
}

module.exports = { registerMediaShortcuts };