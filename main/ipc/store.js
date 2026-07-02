function registerStoreHandlers(ipcMain, getStore) {
  ipcMain.handle('store:get', (_event, key) => {
    const store = getStore();
    return store.get(key);
  });

  ipcMain.handle('store:set', (_event, key, value) => {
    const store = getStore();
    store.set(key, value);
    return true;
  });
}

module.exports = { registerStoreHandlers };