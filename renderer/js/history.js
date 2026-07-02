// ===== Playback History =====

class HistoryManager {
  constructor() {
    this.entries = [];
    this.maxEntries = 200;
    this.selectEl = document.getElementById('history-select');
    this._bindEvents();
    this._loadSaved();
  }

  _bindEvents() {
    this.selectEl.addEventListener('change', () => {
      const value = this.selectEl.value;
      if (value && value !== '') {
        const entry = this.entries.find(e => e.path === value);
        if (entry) {
          this._playHistoryEntry(entry);
        }
        this.selectEl.value = '';
      }
    });
  }

  _rebuildDropdown() {
    // Show last 20 entries
    const recent = this.entries.slice(0, 20);
    this.selectEl.innerHTML = '<option value="">— History —</option>';
    for (const entry of recent) {
      const time = new Date(entry.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const label = `${entry.title} — ${entry.artist} (${time})`;
      this.selectEl.innerHTML += `<option value="${this._escapeAttr(entry.path)}">${this._escapeHtml(label)}</option>`;
    }
  }

  addEntry(track) {
    if (!track) return;

    // Remove existing entry for same track
    this.entries = this.entries.filter(e => e.path !== track.path);

    // Add to front
    this.entries.unshift({
      path: track.path,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      playedAt: Date.now(),
    });

    // Trim
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    this._rebuildDropdown();
    this._save();
  }

  async _playHistoryEntry(entry) {
    // Find or add the track to playlist
    let idx = playlist.tracks.findIndex(t => t.path === entry.path);
    if (idx < 0) {
      const meta = await window.electronAPI.readMetadata(entry.path);
      playlist.addTracks([meta]);
      idx = playlist.tracks.length - 1;
    }
    playlist.setCurrent(idx);
    playlistUI.render();
    await audioEngine.loadTrack(playlist.currentTrack);
    await audioEngine.play();
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async _loadSaved() {
    try {
      const data = await window.electronAPI.storeGet('history');
      if (Array.isArray(data)) {
        this.entries = data;
        this._rebuildDropdown();
      }
    } catch (e) {
      // ignore
    }
  }

  async _save() {
    try {
      await window.electronAPI.storeSet('history', this.entries);
    } catch (e) {
      // ignore
    }
  }
}

const historyManager = new HistoryManager();