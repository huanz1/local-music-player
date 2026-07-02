const { dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a',
  '.opus', '.wv', '.ape', '.aiff', '.alac', '.dsf', '.dff',
]);

function isAudioFile(filePath) {
  return AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function scanDirectory(dirPath) {
  const results = [];
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subResults = await scanDirectory(fullPath);
      results.push(...subResults);
    } else if (entry.isFile() && isAudioFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function registerFileHandlers(ipcMain) {
  ipcMain.handle('files:open', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Music Files',
      filters: [
        {
          name: 'Audio Files',
          extensions: ['mp3', 'flac', 'wav', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'wv', 'ape', 'aiff'],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });

    if (result.canceled) return [];
    return result.filePaths;
  });

  ipcMain.handle('files:open-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Music Folder',
      properties: ['openDirectory'],
    });

    if (result.canceled) return [];
    const folderPath = result.filePaths[0];
    return await scanDirectory(folderPath);
  });

  ipcMain.handle('files:scan-folder', async (_event, folderPath) => {
    return await scanDirectory(folderPath);
  });

  ipcMain.handle('files:open-lyrics', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Lyrics File',
      filters: [
        { name: 'Lyrics Files', extensions: ['lrc', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('files:read-text', async (_event, filePath) => {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (e) {
      return null;
    }
  });

  const lyricsDir = path.join(app.getPath('userData'), 'lyrics');

  ipcMain.handle('lyrics:save', async (_event, audioPath, content, type) => {
    await fs.promises.mkdir(lyricsDir, { recursive: true });
    const hash = crypto.createHash('md5').update(audioPath).digest('hex');
    const ext = type === 'txt' ? '.txt' : '.lrc';
    await fs.promises.writeFile(path.join(lyricsDir, hash + ext), content, 'utf-8');
    return true;
  });

  ipcMain.handle('lyrics:load', async (_event, audioPath) => {
    const hash = crypto.createHash('md5').update(audioPath).digest('hex');
    for (const ext of ['.lrc', '.txt']) {
      const filePath = path.join(lyricsDir, hash + ext);
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return { content, type: ext === '.lrc' ? 'lrc' : 'txt' };
      } catch (e) {
        // not found, try next
      }
    }
    return null;
  });
}

module.exports = { registerFileHandlers };