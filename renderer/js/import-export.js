// ===== Playlist Import/Export =====

class ImportExport {
  constructor() {
    // Buttons bound in app.js / playlist panel
  }

  // Export to M3U format
  exportM3U() {
    const lines = ['#EXTM3U'];
    for (const track of playlist.tracks) {
      lines.push(`#EXTINF:${Math.round(track.duration || 0)},${track.artist} - ${track.title}`);
      lines.push(track.path);
    }
    return lines.join('\n');
  }

  // Parse M3U content
  parseM3U(content) {
    const lines = content.split(/\r?\n/);
    const paths = [];
    let currentTitle = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#EXTINF:')) {
        // #EXTINF:duration,Artist - Title
        const commaIdx = trimmed.indexOf(',');
        if (commaIdx > 0) {
          currentTitle = trimmed.substring(commaIdx + 1).trim();
        }
      } else if (trimmed && !trimmed.startsWith('#')) {
        // File path
        paths.push({ path: trimmed, titleFromM3u: currentTitle });
        currentTitle = '';
      }
    }

    return paths;
  }

  // Export to JSON format
  exportJSON() {
    return JSON.stringify(playlist.toJSON(), null, 2);
  }

  // Parse JSON playlist
  parseJSON(content) {
    const data = JSON.parse(content);
    return {
      tracks: data.tracks || [],
      favorites: data.favorites || [],
      playMode: data.playMode || 'sequential',
    };
  }

  async exportPlaylist() {
    // We need to save the content to a file
    // In Electron renderer, we use a Blob + anchor download approach
    // But for desktop integration, we'll use the clipboard or suggest M3U
    // For now: generate and save via a hidden link
    const format = 'm3u'; // Could make this configurable
    let content, extension;

    if (format === 'm3u') {
      content = this.exportM3U();
      extension = '.m3u';
    } else {
      content = this.exportJSON();
      extension = '.json';
    }

    this._downloadFile(`playlist${extension}`, content);
  }

  async importPlaylist() {
    const paths = await window.electronAPI.openFiles();
    const m3uFile = paths.find(p =>
      p.toLowerCase().endsWith('.m3u') || p.toLowerCase().endsWith('.m3u8')
    );

    if (!m3uFile) {
      // Try JSON
      const jsonFile = paths.find(p => p.toLowerCase().endsWith('.json'));
      if (jsonFile) {
        try {
          const response = await fetch(`file:///${jsonFile.replace(/\\/g, '/')}`);
          const content = await response.text();
          const data = this.parseJSON(content);
          if (data.tracks) {
            playlist.fromJSON(data);
            playlistUI.render();
            return;
          }
        } catch (e) {
          console.error('Failed to import JSON playlist:', e);
        }
      }
      return;
    }

    try {
      const response = await fetch(`file:///${m3uFile.replace(/\\/g, '/')}`);
      const content = await response.text();
      const entries = this.parseM3U(content);

      // Filter to valid paths and read metadata
      const validPaths = entries.filter(e => {
        try {
          // In Electron, we can't easily check existence from renderer
          // Just trust the path for now
          return true;
        } catch (err) {
          return false;
        }
      });

      if (validPaths.length > 0) {
        const pathsOnly = validPaths.map(e => e.path);
        await playlistUI._addFilesByPaths(pathsOnly);
      }
    } catch (e) {
      console.error('Failed to import M3U:', e);
    }
  }

  _downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

const importExport = new ImportExport();