// ===== Keyboard Shortcuts =====

class KeyboardManager {
  constructor() {
    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => {
      this._handleKey(e);
    });

    // Media shortcuts from main process
    window.electronAPI.onMediaShortcut((action) => {
      this._handleMediaAction(action);
    });
  }

  _handleKey(e) {
    // Don't capture when typing in inputs
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        audioEngine.toggle();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          this._playPrevious();
        } else {
          audioEngine.seek(audioEngine.getCurrentTime() - 5);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          this._playNext();
        } else {
          audioEngine.seek(audioEngine.getCurrentTime() + 5);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        audioEngine.adjustVolume(0.05);
        controlsUI._updateVolumeUI();
        break;
      case 'ArrowDown':
        e.preventDefault();
        audioEngine.adjustVolume(-0.05);
        controlsUI._updateVolumeUI();
        break;
      case 'KeyM':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this._toggleMini();
        }
        break;
      case 'KeyT':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          themeManager.toggle();
        }
        break;
      case 'KeyO':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            this._openFolder();
          } else {
            this._openFiles();
          }
        }
        break;
      case 'KeyI':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this._importPlaylist();
        }
        break;
      case 'KeyE':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this._exportPlaylist();
        }
        break;
      case 'Delete':
        e.preventDefault();
        if (playlist.currentIndex >= 0) {
          playlist.removeTrack(playlist.currentIndex);
          playlistUI.render();
        }
        break;
      case 'Escape':
        equalizerUI.panel.classList.add('hidden');
        equalizerUI.visible = false;
        document.getElementById('btn-toggle-eq').classList.remove('active');
        document.getElementById('tag-editor-dialog').classList.add('hidden');
        playlistUI._hideContextMenu();
        break;
    }
  }

  _handleMediaAction(action) {
    switch (action) {
      case 'play-pause':
        audioEngine.toggle();
        break;
      case 'stop':
        audioEngine.stop();
        break;
      case 'next':
        this._playNext();
        break;
      case 'previous':
        this._playPrevious();
        break;
      case 'open-files':
        this._openFiles();
        break;
      case 'open-folder':
        this._openFolder();
        break;
      case 'import-playlist':
        this._importPlaylist();
        break;
      case 'export-playlist':
        this._exportPlaylist();
        break;
      case 'toggle-mini':
        this._toggleMini();
        break;
      case 'toggle-theme':
        themeManager.toggle();
        break;
      case 'volume-up':
        audioEngine.adjustVolume(0.05);
        controlsUI._updateVolumeUI();
        break;
      case 'volume-down':
        audioEngine.adjustVolume(-0.05);
        controlsUI._updateVolumeUI();
        break;
      case 'set-language-zh':
        i18nManager.setLanguage('zh-CN');
        break;
      case 'set-language-en':
        i18nManager.setLanguage('en');
        break;
    }
  }

  async _openFiles() {
    const paths = await window.electronAPI.openFiles();
    if (paths.length > 0) {
      await playlistUI._addFilesByPaths(paths);
    }
  }

  async _openFolder() {
    const paths = await window.electronAPI.openFolder();
    if (paths.length > 0) {
      await playlistUI._addFilesByPaths(paths);
    }
  }

  async _playNext() {
    await controlsUI._playNext();
  }

  async _playPrevious() {
    await controlsUI._playPrevious();
  }

  async _toggleMini() {
    await window.electronAPI.toggleMiniPlayer();
  }

  async _importPlaylist() {
    await importExport.importPlaylist();
  }

  async _exportPlaylist() {
    await importExport.exportPlaylist();
  }
}

const keyboardManager = new KeyboardManager();