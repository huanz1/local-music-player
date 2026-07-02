// ===== Playlist UI =====

class PlaylistUI {
  constructor() {
    this.container = document.getElementById('playlist-container');
    this.searchInput = document.getElementById('playlist-search-input');
    this.countDisplay = document.getElementById('playlist-count');
    this.contextMenu = document.getElementById('context-menu');
    this.ctxMenuTrackIndex = -1;

    // Drag and drop state
    this.dragIndex = -1;
    this.dropIndex = -1;

    this._init();
    this._bindEvents();
  }

  _init() {
    playlist.onChange = (action, affected) => {
      this.render();
      this._persistPlaylist();
    };
  }

  _bindEvents() {
    // Search
    this.searchInput.addEventListener('input', () => {
      this.render(this.searchInput.value);
    });

    // Context menu
    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this._hideContextMenu();
      }
    });

    this.contextMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-menu-item');
      if (!item) return;
      const action = item.dataset.action;
      this._handleContextAction(action, this.ctxMenuTrackIndex);
      this._hideContextMenu();
    });

    // Drag & drop files from OS
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      const files = [...e.dataTransfer.files].filter(f => {
        const ext = '.' + f.name.split('.').pop().toLowerCase();
        return AUDIO_EXTS.includes(ext);
      });
      if (files.length > 0) {
        const paths = files.map(f => f.path);
        await this._addFilesByPaths(paths);
      }
    });
  }

  async _addFilesByPaths(paths) {
    if (paths.length === 0) return;
    try {
      const metadata = await window.electronAPI.readMetadataBatch(paths);
      const added = playlist.addTracks(metadata);
      if (added > 0 && playlist.currentIndex < 0) {
        playlist.setCurrent(0);
        await this._playCurrent();
      }
    } catch (err) {
      console.error('Failed to add files:', err);
    }
  }

  async _playCurrent() {
    const track = playlist.currentTrack;
    if (!track) return;
    try {
      await audioEngine.loadTrack(track);
      await audioEngine.play();
    } catch (err) {
      console.error('Failed to play:', err);
    }
  }

  render(filter = '') {
    const indices = filter ? playlist.search(filter) : playlist.tracks.map((_, i) => i);

    if (playlist.length === 0) {
      this.container.innerHTML = `
        <div class="playlist-empty">
          <div class="empty-icon">🎶</div>
          <p>${i18nManager.t('playlist.empty.title')}</p>
          <p class="empty-hint">${i18nManager.t('playlist.empty.hint')}</p>
        </div>`;
      this.countDisplay.textContent = i18nManager.t('playlist.count.zero');
      return;
    }

    let html = '';
    for (const index of indices) {
      const track = playlist.tracks[index];
      const isActive = index === playlist.currentIndex;
      const isFav = playlist.isFavorite(index);
      const dur = formatTime(track.duration);

      html += `
        <div class="track-item ${isActive ? (audioEngine.isPlaying ? 'playing' : 'active') : ''}"
             data-index="${index}"
             draggable="true">
          <span class="track-index">${isActive && audioEngine.isPlaying ? '' : index + 1}</span>
          <div class="track-details">
            <span class="track-title">${this._escapeHtml(track.title)}</span>
            <span class="track-artist">${this._escapeHtml(track.artist)}</span>
          </div>
          <span class="track-duration">${dur}</span>
          <span class="track-favorite ${isFav ? 'favorited' : ''}" data-action="favorite" data-index="${index}">${isFav ? '♥' : '♡'}</span>
        </div>`;
    }

    this.container.innerHTML = html;
    this.countDisplay.textContent = i18nManager.t('playlist.count', { count: playlist.length });
    this._bindTrackEvents();
  }

  _highlightCurrent() {
    const items = this.container.querySelectorAll('.track-item');
    items.forEach(item => {
      const idx = parseInt(item.dataset.index);
      item.classList.toggle('playing', idx === playlist.currentIndex && audioEngine.isPlaying);
      item.classList.toggle('active', idx === playlist.currentIndex && !audioEngine.isPlaying);
    });
  }

  _bindTrackEvents() {
    const items = this.container.querySelectorAll('.track-item');

    items.forEach(item => {
      const index = parseInt(item.dataset.index);

      // Click to select
      item.addEventListener('click', async (e) => {
        // Don't trigger on favorite click
        if (e.target.closest('[data-action="favorite"]')) return;
        playlist.setCurrent(index);
        await this._playCurrent();
      });

      // Double click to play from start
      item.addEventListener('dblclick', async (e) => {
        if (e.target.closest('[data-action="favorite"]')) return;
        audioEngine.seek(0);
        await audioEngine.play();
      });

      // Right-click context menu
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.ctxMenuTrackIndex = index;
        this._showContextMenu(e.clientX, e.clientY);
      });

      // Drag & drop reorder
      item.addEventListener('dragstart', (e) => {
        this.dragIndex = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        item.classList.add('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.dropIndex = index;
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (this.dragIndex >= 0 && this.dragIndex !== index) {
          playlist.moveTrack(this.dragIndex, index);
        }
        this.dragIndex = -1;
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        document.querySelectorAll('.track-item').forEach(i => i.classList.remove('drag-over'));
      });
    });

    // Favorite button clicks
    this.container.querySelectorAll('.track-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        playlist.toggleFavorite(idx);
        this.render(this.searchInput.value);
      });
    });
  }

  _showContextMenu(x, y) {
    this.contextMenu.classList.remove('hidden');
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;

    // Adjust to stay within viewport
    const rect = this.contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.contextMenu.style.top = `${y - rect.height}px`;
    }
  }

  _hideContextMenu() {
    this.contextMenu.classList.add('hidden');
    this.ctxMenuTrackIndex = -1;
  }

  async _handleContextAction(action, index) {
    switch (action) {
      case 'play':
        playlist.setCurrent(index);
        audioEngine.seek(0);
        await this._playCurrent();
        break;
      case 'remove':
        playlist.removeTrack(index);
        break;
      case 'show-in-folder':
        if (index >= 0 && index < playlist.length) {
          const dir = getDirFromPath(playlist.tracks[index].path);
          window.electronAPI.storeSet('_show_in_folder', dir);
          // Shell.openPath doesn't exist in renderer; we'd need IPC
          // For now, just log it
          console.log('Show in folder:', dir);
        }
        break;
      case 'edit-tags':
        this._showTagEditor(index);
        break;
      case 'add-to-favorites':
        playlist.toggleFavorite(index);
        this.render(this.searchInput.value);
        break;
    }
  }

  _showTagEditor(index) {
    const track = playlist.tracks[index];
    if (!track) return;

    const dialog = document.getElementById('tag-editor-dialog');
    document.getElementById('edit-title').value = track.title;
    document.getElementById('edit-artist').value = track.artist;
    document.getElementById('edit-album').value = track.album;
    document.getElementById('edit-year').value = track.year || '';
    document.getElementById('edit-genre').value = track.genre || '';
    document.getElementById('edit-track').value = track.track || '';

    dialog.classList.remove('hidden');
    dialog._editIndex = index;

    document.getElementById('btn-cancel-edit').onclick = () => {
      dialog.classList.add('hidden');
    };

    document.getElementById('btn-save-edit').onclick = async () => {
      const tags = {
        title: document.getElementById('edit-title').value,
        artist: document.getElementById('edit-artist').value,
        album: document.getElementById('edit-album').value,
        year: parseInt(document.getElementById('edit-year').value) || null,
        genre: document.getElementById('edit-genre').value,
        track: parseInt(document.getElementById('edit-track').value) || null,
      };

      const result = await window.electronAPI.writeMetadata(track.path, tags);
      if (result.success) {
        Object.assign(track, tags);
        this.render(this.searchInput.value);
      }
      dialog.classList.add('hidden');
    };
  }

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async _persistPlaylist() {
    try {
      await window.electronAPI.storeSet('playlist', playlist.toJSON());
    } catch (e) {
      // Store may not be ready yet
    }
  }

  async loadSavedPlaylist() {
    try {
      const data = await window.electronAPI.storeGet('playlist');
      if (data && data.tracks && data.tracks.length > 0) {
        playlist.fromJSON(data);
        this.render();
      }
    } catch (e) {
      // No saved playlist
    }
  }
}

const playlistUI = new PlaylistUI();