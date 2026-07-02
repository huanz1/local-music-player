// ===== Main Application Initialization =====
// This file loads LAST, after all modules are defined

(function initApp() {
  'use strict';

  // Load saved state
  async function loadSavedState() {
    try {
      // Load playlist
      const savedPlaylist = await window.electronAPI.storeGet('playlist');
      if (savedPlaylist && savedPlaylist.tracks && savedPlaylist.tracks.length > 0) {
        playlist.fromJSON(savedPlaylist);
        playlistUI.render();
      }

      // Load volume
      const savedVolume = await window.electronAPI.storeGet('volume');
      if (savedVolume !== null && savedVolume !== undefined) {
        audioEngine.setVolume(savedVolume);
        controlsUI._updateVolumeUI();
      }

      controlsUI._updateModeIcon();

      // Load favorites
      const savedFavorites = await window.electronAPI.storeGet('favorites');
      if (Array.isArray(savedFavorites)) {
        playlist.setFavorites(savedFavorites);
        playlistUI.render();
      }
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  }

  // Persistence on changes
  async function persistVolume() {
    try {
      await window.electronAPI.storeSet('volume', audioEngine.getVolume());
    } catch (e) {
      // ignore
    }
  }

  // Watch for state changes (auto-persist volume and play mode)
  audioEngine._stateChangeCallbacks.add((state) => {
    if (state === 'volume') {
      persistVolume();
    }
  });

  // Persist volume periodically
  setInterval(persistVolume, 5000);

  // Wire up import/export buttons
  document.getElementById('btn-import').addEventListener('click', async () => {
    await importExport.importPlaylist();
  });

  document.getElementById('btn-export').addEventListener('click', async () => {
    await importExport.exportPlaylist();
  });

  // Wire up add files button
  document.getElementById('btn-add-files').addEventListener('click', async () => {
    const paths = await window.electronAPI.openFiles();
    if (paths.length > 0) {
      await playlistUI._addFilesByPaths(paths);
    }
  });

  // Wire up add folder button
  document.getElementById('btn-add-folder').addEventListener('click', async () => {
    const paths = await window.electronAPI.openFolder();
    if (paths.length > 0) {
      await playlistUI._addFilesByPaths(paths);
    }
  });

  // Wire up clear playlist button
  document.getElementById('btn-clear-playlist').addEventListener('click', () => {
    if (playlist.length === 0) return;
    if (confirm(i18nManager.t('playlist.clearConfirm'))) {
      playlist.clear();
      playlistUI.render();
      audioEngine.stop();
    }
  });

  // Wire up mini player toggle
  document.getElementById('btn-toggle-mini').addEventListener('click', async () => {
    await window.electronAPI.toggleMiniPlayer();
  });

  // Wire up floating lyrics toggle
  document.getElementById('btn-float-lyrics').addEventListener('click', async () => {
    const isOpen = await window.electronAPI.toggleFloatingLyrics();
    document.getElementById('btn-float-lyrics').classList.toggle('active', isOpen);
  });

  // Listen for floating lyrics window closed by user (e.g., close button)
  window.electronAPI.onFloatLyricsClosed(() => {
    document.getElementById('btn-float-lyrics').classList.remove('active');
  });

  // Language toggle button in header
  document.getElementById('btn-language').addEventListener('click', () => {
    const newLang = i18nManager.getLanguage() === 'zh-CN' ? 'en' : 'zh-CN';
    i18nManager.setLanguage(newLang);
  });

  // When language changes, re-render dynamic UI
  i18nManager.onLanguageChange = (lang) => {
    // Re-render playlist count and empty state
    playlistUI.render(playlistUI.searchInput.value);
    // Re-render lyrics empty state if no lyrics loaded
    if (lyricsDisplay.lyricsLines.length === 0) {
      lyricsDisplay.clear();
    }
    // Re-render mode icon titles
    controlsUI._updateModeIcon();
    // Re-render context menu text
    document.querySelectorAll('#context-menu .context-menu-item').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = i18nManager.t(key);
    });
    // Re-render tag editor labels if visible
    document.querySelectorAll('#tag-editor-dialog [data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = i18nManager.t(key);
    });
    // Re-render now-playing info if no track
    if (!playlist.currentTrack) {
      controlsUI._updateNowPlaying();
    }
    // Re-render history dropdown label
    historyManager._rebuildDropdown();
    // Re-render equalizer title
    const eqTitle = document.querySelector('#equalizer-panel .eq-header h4');
    if (eqTitle) eqTitle.textContent = i18nManager.t('eq.title');
  };

  // Initialize i18n (load saved language and apply translations)
  i18nManager.init();

  // Load state and start
  loadSavedState().then(() => {
    console.log('Music Player initialized');
    console.log(`Loaded ${playlist.length} tracks`);
  });

  // Handle keyboard shortcut for seeking with J/K (vim-style) and L
  // Also handle global shortcuts relayed via menu
  window.electronAPI.onMediaShortcut(async (action) => {
    const km = keyboardManager;
    if (km && km._handleMediaAction) {
      km._handleMediaAction(action);
    }
  });

  console.log('🎵 Music Player ready');
})();