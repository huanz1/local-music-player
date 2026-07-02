// ===== Playlist Model =====

class Playlist {
  constructor() {
    this.tracks = [];
    this.currentIndex = -1;
    this.playMode = 'sequential'; // sequential | repeat-all | repeat-one
    this.shuffleEnabled = false;
    this.shuffleOrder = [];
    this.shuffleIndex = -1;
    this.favorites = new Set();

    // Callbacks
    this.onChange = null;
    this.onCurrentChange = null;
  }

  get length() {
    return this.tracks.length;
  }

  get currentTrack() {
    if (this.currentIndex < 0 || this.currentIndex >= this.tracks.length) return null;
    return this.tracks[this.currentIndex];
  }

  addTracks(tracks) {
    const existingPaths = new Set(this.tracks.map(t => t.path));
    const newTracks = tracks.filter(t => !existingPaths.has(t.path));
    this.tracks.push(...newTracks);
    this._rebuildShuffle();
    if (this.onChange) this.onChange('add', newTracks);
    return newTracks.length;
  }

  removeTrack(index) {
    if (index < 0 || index >= this.tracks.length) return null;
    const removed = this.tracks.splice(index, 1)[0];
    this.favorites.delete(removed.path);

    if (this.currentIndex === index) {
      // Current track was removed
      this.currentIndex = -1;
    } else if (this.currentIndex > index) {
      this.currentIndex--;
    }

    this._rebuildShuffle();
    if (this.onChange) this.onChange('remove', [removed]);
    return removed;
  }

  removeTracks(indices) {
    const removed = [];
    for (const idx of indices.sort((a, b) => b - a)) {
      const track = this.removeTrack(idx);
      if (track) removed.push(track);
    }
    return removed;
  }

  clear() {
    this.tracks = [];
    this.currentIndex = -1;
    this.shuffleOrder = [];
    this.shuffleIndex = -1;
    this.favorites.clear();
    if (this.onChange) this.onChange('clear', []);
  }

  moveTrack(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.tracks.length) return;
    if (toIndex < 0 || toIndex > this.tracks.length) return;

    const [track] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, track);

    // Update currentIndex
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    this._rebuildShuffle();
    if (this.onChange) this.onChange('reorder', []);
  }

  setCurrent(index) {
    if (index < 0 || index >= this.tracks.length) return null;
    this.currentIndex = index;
    this._synchShuffleToCurrent();
    if (this.onCurrentChange) this.onCurrentChange(this.tracks[index], index);
    return this.tracks[index];
  }

  getNextIndex() {
    if (this.tracks.length === 0) return -1;

    // repeat-one takes priority: always stay on current track
    if (this.playMode === 'repeat-one') {
      return this.currentIndex >= 0 ? this.currentIndex : 0;
    }

    // shuffle uses randomized order (wraps around)
    if (this.shuffleEnabled) {
      if (this.shuffleOrder.length === 0) this._rebuildShuffle();
      this.shuffleIndex = (this.shuffleIndex + 1) % this.shuffleOrder.length;
      return this.shuffleOrder[this.shuffleIndex];
    }

    // sequential: don't wrap past the end
    if (this.playMode === 'sequential') {
      if (this.currentIndex >= this.tracks.length - 1) return -1;
      return this.currentIndex + 1;
    }

    // repeat-all: advance and wrap around
    return (this.currentIndex + 1) % this.tracks.length;
  }

  getPreviousIndex() {
    if (this.tracks.length === 0) return -1;

    // repeat-one takes priority: always stay on current track
    if (this.playMode === 'repeat-one') {
      return this.currentIndex >= 0 ? this.currentIndex : 0;
    }

    // shuffle uses randomized order (wraps around)
    if (this.shuffleEnabled) {
      if (this.shuffleOrder.length === 0) this._rebuildShuffle();
      this.shuffleIndex = (this.shuffleIndex - 1 + this.shuffleOrder.length) % this.shuffleOrder.length;
      return this.shuffleOrder[this.shuffleIndex];
    }

    // sequential: don't wrap past the beginning
    if (this.playMode === 'sequential') {
      if (this.currentIndex <= 0) return -1;
      return this.currentIndex - 1;
    }

    // repeat-all: linear, wrap around
    return (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
  }

  setPlayMode(mode) {
    const validModes = ['sequential', 'repeat-one', 'repeat-all'];
    if (validModes.includes(mode)) {
      this.playMode = mode;
      if (this.onChange) this.onChange('mode', []);
    }
  }

  cycleRepeatMode() {
    const modes = ['sequential', 'repeat-all', 'repeat-one'];
    const idx = modes.indexOf(this.playMode);
    this.setPlayMode(modes[(idx + 1) % modes.length]);
    return this.playMode;
  }

  toggleShuffle() {
    this.shuffleEnabled = !this.shuffleEnabled;
    if (this.shuffleEnabled) this._rebuildShuffle();
    if (this.onChange) this.onChange('mode', []);
    return this.shuffleEnabled;
  }

  // Legacy: kept for compatibility, now just cycles repeat mode
  cyclePlayMode() {
    return this.cycleRepeatMode();
  }

  toggleFavorite(index) {
    if (index < 0 || index >= this.tracks.length) return false;
    const track = this.tracks[index];
    if (this.favorites.has(track.path)) {
      this.favorites.delete(track.path);
      if (this.onChange) this.onChange('unfavorite', [track]);
      return false;
    } else {
      this.favorites.add(track.path);
      if (this.onChange) this.onChange('favorite', [track]);
      return true;
    }
  }

  isFavorite(index) {
    if (index < 0 || index >= this.tracks.length) return false;
    return this.favorites.has(this.tracks[index].path);
  }

  getFavoritePaths() {
    return new Set(this.favorites);
  }

  setFavorites(paths) {
    this.favorites = new Set(paths);
  }

  _rebuildShuffle() {
    this.shuffleOrder = this.tracks.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
    }
    // Keep current track first in shuffle
    if (this.currentIndex >= 0) {
      const currIdx = this.shuffleOrder.indexOf(this.currentIndex);
      if (currIdx > 0) {
        [this.shuffleOrder[0], this.shuffleOrder[currIdx]] = [this.shuffleOrder[currIdx], this.shuffleOrder[0]];
      }
      this.shuffleIndex = 0;
    }
  }

  _synchShuffleToCurrent() {
    if (this.shuffleEnabled && this.currentIndex >= 0) {
      const idx = this.shuffleOrder.indexOf(this.currentIndex);
      if (idx >= 0) this.shuffleIndex = idx;
    }
  }

  toJSON() {
    return {
      tracks: this.tracks,
      favorites: [...this.favorites],
      currentIndex: this.currentIndex,
      playMode: this.playMode,
      shuffleEnabled: this.shuffleEnabled,
    };
  }

  fromJSON(data) {
    if (data.tracks) this.tracks = data.tracks;
    if (data.favorites) this.favorites = new Set(data.favorites);
    if (data.currentIndex !== undefined) this.currentIndex = data.currentIndex;
    if (data.playMode) this.playMode = data.playMode;
    if (data.shuffleEnabled !== undefined) this.shuffleEnabled = data.shuffleEnabled;
    if (this.shuffleEnabled) this._rebuildShuffle();
    if (this.onChange) this.onChange('load', []);
  }

  search(query) {
    if (!query.trim()) return this.tracks.map((_, i) => i);
    const q = query.toLowerCase();
    return this.tracks
      .map((t, i) => ({ track: t, index: i }))
      .filter(({ track }) =>
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.album.toLowerCase().includes(q)
      )
      .map(({ index }) => index);
  }
}

const playlist = new Playlist();