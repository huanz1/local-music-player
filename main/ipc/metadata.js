const path = require('path');
const fs = require('fs');

let mm = null;

async function getMusicMetadata() {
  if (!mm) {
    mm = await import('music-metadata');
  }
  return mm;
}

function registerMetadataHandlers(ipcMain) {
  ipcMain.handle('metadata:read', async (_event, filePath) => {
    try {
      const metadata = await getMusicMetadata();
      const result = await metadata.parseFile(filePath);
      const { common, format } = result;

      return {
        path: filePath,
        title: common.title || path.basename(filePath, path.extname(filePath)),
        artist: common.artist || 'Unknown Artist',
        album: common.album || 'Unknown Album',
        year: common.year || null,
        track: common.track?.no || null,
        genre: common.genre?.[0] || null,
        duration: format.duration || 0,
        bitrate: format.bitrate || null,
        sampleRate: format.sampleRate || null,
        codec: format.codec || null,
        hasCover: !!common.picture?.length,
      };
    } catch (err) {
      // Fallback: use filename as title
      return {
        path: filePath,
        title: path.basename(filePath, path.extname(filePath)),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        year: null,
        track: null,
        genre: null,
        duration: 0,
        bitrate: null,
        sampleRate: null,
        codec: null,
        hasCover: false,
      };
    }
  });

  ipcMain.handle('metadata:read-batch', async (_event, filePaths) => {
    const results = [];
    for (const filePath of filePaths) {
      const meta = await ipcMain.emit('metadata:read', _event, filePath);
      // Actually handle it inline
      try {
        const metadata = await getMusicMetadata();
        const result = await metadata.parseFile(filePath);
        const { common, format } = result;

        results.push({
          path: filePath,
          title: common.title || path.basename(filePath, path.extname(filePath)),
          artist: common.artist || 'Unknown Artist',
          album: common.album || 'Unknown Album',
          year: common.year || null,
          track: common.track?.no || null,
          genre: common.genre?.[0] || null,
          duration: format.duration || 0,
          bitrate: format.bitrate || null,
          sampleRate: format.sampleRate || null,
          codec: format.codec || null,
          hasCover: !!common.picture?.length,
        });
      } catch (err) {
        results.push({
          path: filePath,
          title: path.basename(filePath, path.extname(filePath)),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          year: null,
          track: null,
          genre: null,
          duration: 0,
          bitrate: null,
          sampleRate: null,
          codec: null,
          hasCover: false,
        });
      }
    }
    return results;
  });

  ipcMain.handle('metadata:cover', async (_event, filePath) => {
    try {
      const metadata = await getMusicMetadata();
      const result = await metadata.parseFile(filePath);
      const { common } = result;

      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        const mimeType = picture.format || 'image/jpeg';
        const base64 = picture.data.toString('base64');
        return `data:${mimeType};base64,${base64}`;
      }
      return null;
    } catch (err) {
      return null;
    }
  });

  ipcMain.handle('metadata:write', async (_event, filePath, tags) => {
    try {
      const metadata = await getMusicMetadata();
      // music-metadata can write basic tags
      // For more comprehensive writing, we'd use node-id3 or similar
      // For now, return success for music-metadata supported formats
      await metadata.writeFile(filePath, {
        title: tags.title,
        artist: tags.artist,
        album: tags.album,
        year: tags.year,
        genre: tags.genre ? [tags.genre] : undefined,
        track: tags.track ? { no: tags.track } : undefined,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerMetadataHandlers };