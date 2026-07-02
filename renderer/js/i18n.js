// ===== Internationalization (i18n) Manager =====

class I18nManager {
  constructor() {
    this._current = 'zh-CN'; // default
    this._translations = this._buildTranslations();
  }

  _buildTranslations() {
    return {
      'zh-CN': {
        // App
        'app.logo': '🎵 音乐播放器',

        // Playback Modes (title attributes)
        'mode.sequential': '顺序播放',
        'mode.shuffle_on': '随机播放：开（点击关闭）',
        'mode.shuffle_off': '随机播放：关（点击开启）',
        'mode.loop_one': '单曲循环（重复当前歌曲）',
        'mode.loop_all': '列表循环（重复整个列表）',
        'mode.loop_off': '循环关闭（点击切换：单曲循环 / 列表循环）',
        'mode.shuffle_repeat_one': '随机 + 单曲循环',
        'mode.shuffle_repeat_all': '随机 + 列表循环',
        'mode.shuffle_label': '随机播放',
        'mode.sequential_label': '顺序播放（每首结束自动暂停）',
        'mode.repeat_one_label': '单曲循环（重复当前歌曲）',
        'mode.repeat_all_label': '列表循环（重复整个列表）',

        // Buttons (title attributes)
        'btn.equalizer': '均衡器',
        'btn.lyrics': '歌词',
        'btn.theme': '切换主题',
        'btn.mini-player': '迷你播放器',
        'btn.language': '语言切换',
        'btn.add-files': '添加文件 (Ctrl+O)',
        'btn.add-folder': '添加文件夹 (Ctrl+Shift+O)',
        'btn.clear-playlist': '清空播放列表',
        'btn.load-lrc': '加载歌词文件 (LRC/TXT)',
        'btn.float-lyrics': '浮动歌词',
        'btn.shuffle': '随机播放',
        'btn.previous': '上一首',
        'btn.play-pause': '播放 / 暂停 (空格)',
        'btn.next': '下一首',
        'btn.repeat.off': '循环播放',
        'btn.favorite': '收藏',

        // Buttons (text)
        'btn.import': '导入',
        'btn.export': '导出',
        'btn.cancel': '取消',
        'btn.save': '保存',

        // Playlist
        'playlist.title': '播放列表',
        'playlist.count.zero': '0 首歌曲',
        'playlist.count': '{count} 首歌曲',
        'playlist.empty.title': '未添加歌曲',
        'playlist.empty.hint': '拖放音乐文件至此，或点击 📂 浏览',
        'playlist.clearConfirm': '确定要清空整个播放列表吗？',

        // History
        'history.label': '— 播放历史 —',

        // Now Playing
        'now-playing.no-track': '未播放歌曲',
        'now-playing.select-track': '选择歌曲开始播放',
        'player.no-track': '暂无歌曲',

        // Equalizer
        'eq.title': '均衡器',

        // Lyrics
        'lyrics.title': '歌词',
        'lyrics.empty.title': '暂无歌词',
        'lyrics.empty.hint': '加载 .lrc / .txt 歌词文件或自动检测',
        'lyrics.floating.empty': '暂无歌词加载',

        // Context Menu
        'ctx.play': '▶ 播放',
        'ctx.remove': '🗑️ 移除',
        'ctx.show-in-folder': '📂 在文件夹中显示',
        'ctx.edit-tags': '✏️ 编辑标签',
        'ctx.add-to-favorites': '🤍 添加到收藏',

        // Dialog
        'dialog.edit-title': '编辑歌曲信息',
        'label.title': '标题',
        'label.artist': '艺术家',
        'label.album': '专辑',
        'label.year': '年份',
        'label.genre': '流派',
        'label.track-number': '曲目编号',

        // Search
        'search.placeholder': '🔍 搜索播放列表...',
      },

      'en': {
        // App
        'app.logo': '🎵 Music Player',

        // Playback Modes (title attributes)
        'mode.sequential': 'Sequential',
        'mode.shuffle_on': 'Shuffle On (click to turn off)',
        'mode.shuffle_off': 'Shuffle Off (click to turn on)',
        'mode.loop_one': 'Loop One (replay current song)',
        'mode.loop_all': 'Loop All (replay entire playlist)',
        'mode.loop_off': 'Loop Off (click to toggle: Loop One / Loop All)',
        'mode.shuffle_repeat_one': 'Shuffle + Repeat One',
        'mode.shuffle_repeat_all': 'Shuffle + Repeat All',
        'mode.shuffle_label': 'Shuffle',
        'mode.sequential_label': 'Sequential (auto-pause after each song)',
        'mode.repeat_one_label': 'Repeat One (loop current song)',
        'mode.repeat_all_label': 'Repeat All (loop entire playlist)',

        // Buttons (title attributes)
        'btn.equalizer': 'Equalizer',
        'btn.lyrics': 'Lyrics',
        'btn.theme': 'Toggle Theme',
        'btn.mini-player': 'Mini Player',
        'btn.language': 'Language',
        'btn.add-files': 'Add Files (Ctrl+O)',
        'btn.add-folder': 'Add Folder (Ctrl+Shift+O)',
        'btn.clear-playlist': 'Clear Playlist',
        'btn.load-lrc': 'Load Lyrics File (LRC/TXT)',
        'btn.float-lyrics': 'Floating Lyrics',
        'btn.shuffle': 'Shuffle',
        'btn.previous': 'Previous',
        'btn.play-pause': 'Play / Pause (Space)',
        'btn.next': 'Next',
        'btn.repeat.off': 'Repeat',
        'btn.favorite': 'Favorite',

        // Buttons (text)
        'btn.import': 'Import',
        'btn.export': 'Export',
        'btn.cancel': 'Cancel',
        'btn.save': 'Save',

        // Playlist
        'playlist.title': 'Playlist',
        'playlist.count.zero': '0 tracks',
        'playlist.count': '{count} tracks',
        'playlist.empty.title': 'No tracks added',
        'playlist.empty.hint': 'Drag & drop music files here, or click 📂 to browse',
        'playlist.clearConfirm': 'Clear the entire playlist?',

        // History
        'history.label': '— History —',

        // Now Playing
        'now-playing.no-track': 'No track playing',
        'now-playing.select-track': 'Select a track to start',
        'player.no-track': 'No track',

        // Equalizer
        'eq.title': 'Equalizer',

        // Lyrics
        'lyrics.title': 'Lyrics',
        'lyrics.empty.title': 'No lyrics available',
        'lyrics.empty.hint': 'Load a .lrc / .txt lyrics file or auto-detect',
        'lyrics.floating.empty': 'No lyrics loaded',

        // Context Menu
        'ctx.play': '▶ Play',
        'ctx.remove': '🗑️ Remove',
        'ctx.show-in-folder': '📂 Show in Folder',
        'ctx.edit-tags': '✏️ Edit Tags',
        'ctx.add-to-favorites': '🤍 Add to Favorites',

        // Dialog
        'dialog.edit-title': 'Edit Track Info',
        'label.title': 'Title',
        'label.artist': 'Artist',
        'label.album': 'Album',
        'label.year': 'Year',
        'label.genre': 'Genre',
        'label.track-number': 'Track Number',

        // Search
        'search.placeholder': '🔍 Search playlist...',
      },
    };
  }

  /**
   * Get a translated string by key.
   * Supports {key} interpolation, e.g. t('playlist.count', { count: 3 }) → "3 tracks"
   */
  t(key, params = {}) {
    const dict = this._translations[this._current] || this._translations['zh-CN'];
    let value = dict[key];
    if (value === undefined) {
      console.warn(`[i18n] Missing translation key: "${key}" for locale "${this._current}"`);
      return key;
    }
    // Interpolate {key} placeholders
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
    return value;
  }

  /**
   * Get the current language code.
   */
  getLanguage() {
    return this._current;
  }

  /**
   * Set the language and persist to store, then re-render all UI.
   */
  async setLanguage(locale) {
    if (locale === this._current) return;

    this._current = locale;
    document.documentElement.lang = locale;

    // Save to electron-store
    try {
      await window.electronAPI.storeSet('language', locale);
    } catch (e) {
      console.warn('[i18n] Failed to persist language:', e);
    }

    // Translate static DOM
    this.translateDOM();

    // Trigger re-render for dynamic components
    this._refreshUI();

    if (this.onLanguageChange) {
      this.onLanguageChange(locale);
    }
  }

  /**
   * Apply translations to all elements with data-i18n attributes in the DOM.
   */
  translateDOM() {
    // data-i18n → textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // data-i18n-title → title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.title = this.t(key);
      }
    });

    // data-i18n-placeholder → placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = this.t(key);
      }
    });
  }

  /**
   * Re-render dynamic UI components that generate HTML at runtime.
   */
  _refreshUI() {
    // Re-render playlist (which includes empty state, track count, context menu)
    if (typeof playlistUI !== 'undefined' && playlistUI.render) {
      playlistUI.render(playlistUI.searchInput?.value || '');
    }

    // Re-render mode and button tooltips
    if (typeof controlsUI !== 'undefined') {
      if (controlsUI._updateModeIcon) controlsUI._updateModeIcon();
      if (controlsUI._updateNowPlaying) controlsUI._updateNowPlaying();
    }

    // Re-render lyrics display
    if (typeof lyricsDisplay !== 'undefined') {
      if (lyricsDisplay.lyricsLines && lyricsDisplay.lyricsLines.length > 0) {
        lyricsDisplay.render();
      } else {
        lyricsDisplay.clear();
      }
    }

    // Re-render history dropdown
    if (typeof historyManager !== 'undefined') {
      if (historyManager._rebuildDropdown) historyManager._rebuildDropdown();
    }
  }

  /**
   * Initialize: load saved language from store and apply translations.
   */
  async init() {
    try {
      const saved = await window.electronAPI.storeGet('language');
      if (saved === 'zh-CN' || saved === 'en') {
        this._current = saved;
      }
    } catch (e) {
      // Use default 'zh-CN'
    }

    document.documentElement.lang = this._current;
    this.translateDOM();
  }
}

// Singleton
const i18nManager = new I18nManager();