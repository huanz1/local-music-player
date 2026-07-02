const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFiles: () => ipcRenderer.invoke('files:open'),
  openFolder: () => ipcRenderer.invoke('files:open-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('files:scan-folder', folderPath),
  openLyricsFile: () => ipcRenderer.invoke('files:open-lyrics'),
  readTextFile: (filePath) => ipcRenderer.invoke('files:read-text', filePath),
  saveLyrics: (audioPath, content, type) => ipcRenderer.invoke('lyrics:save', audioPath, content, type),
  loadLyrics: (audioPath) => ipcRenderer.invoke('lyrics:load', audioPath),

  // Metadata operations
  readMetadata: (filePath) => ipcRenderer.invoke('metadata:read', filePath),
  readMetadataBatch: (filePaths) => ipcRenderer.invoke('metadata:read-batch', filePaths),
  writeMetadata: (filePath, tags) => ipcRenderer.invoke('metadata:write', filePath, tags),
  getCoverArt: (filePath) => ipcRenderer.invoke('metadata:cover', filePath),

  // Store operations
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),

  // Window operations
  toggleMiniPlayer: () => ipcRenderer.invoke('window:toggle-mini'),
  updateMiniPlayer: (data) => ipcRenderer.invoke('window:update-mini', data),
  closeMiniPlayer: () => ipcRenderer.invoke('window:close-mini'),
  setTitle: (title) => ipcRenderer.invoke('window:set-title', title),

  // Floating lyrics window operations
  toggleFloatingLyrics: () => ipcRenderer.invoke('window:toggle-floating-lyrics'),
  updateFloatingLyrics: (data) => ipcRenderer.invoke('window:update-floating-lyrics', data),
  closeFloatingLyrics: () => ipcRenderer.invoke('window:close-floating-lyrics'),
  getFloatingBounds: () => ipcRenderer.invoke('window:get-floating-bounds'),
  setFloatingBounds: (bounds) => ipcRenderer.invoke('window:set-floating-bounds', bounds),

  // Floating lyrics events from main process
  onFloatLyricsClosed: (callback) => {
    ipcRenderer.on('lyrics:float-closed', () => callback());
    return () => ipcRenderer.removeAllListeners('lyrics:float-closed');
  },
  onLyricsUpdate: (callback) => {
    ipcRenderer.on('lyrics:update', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('lyrics:update');
  },
  onLyricsClear: (callback) => {
    ipcRenderer.on('lyrics:clear', () => callback());
    return () => ipcRenderer.removeAllListeners('lyrics:clear');
  },

  // Media events from main process
  onMediaShortcut: (callback) => {
    ipcRenderer.on('media:shortcut', (_event, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('media:shortcut');
  },
  onRequestState: (callback) => {
    ipcRenderer.on('media:request-state', () => callback());
    return () => ipcRenderer.removeAllListeners('media:request-state');
  },
  onStateUpdate: (callback) => {
    ipcRenderer.on('media:state-update', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('media:state-update');
  },
});