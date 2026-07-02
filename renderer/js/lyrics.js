// ===== Lyrics Display (LRC Parser) =====

class LyricsDisplay {
  constructor() {
    this.container = document.getElementById('lyrics-container');
    this.lyricsLines = []; // [{time: seconds, text: string}, ...]
    this.offsetSeconds = 0;
    this.autoDetect = true;
    this.lastActiveIndex = -1;

    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('btn-load-lrc').addEventListener('click', () => {
      this._loadLrcFromDialog();
    });

    document.getElementById('btn-lyrics-offset-minus').addEventListener('click', () => {
      this.offsetSeconds -= 0.5;
      this._updateOffsetDisplay();
    });

    document.getElementById('btn-lyrics-offset-plus').addEventListener('click', () => {
      this.offsetSeconds += 0.5;
      this._updateOffsetDisplay();
    });

    document.getElementById('btn-toggle-lyrics').addEventListener('click', () => {
      const panel = document.getElementById('lyrics-panel');
      panel.classList.toggle('hidden');
      document.getElementById('btn-toggle-lyrics').classList.toggle('active', !panel.classList.contains('hidden'));
    });

    // Listen to playback for sync
    audioEngine.onTimeUpdate = (() => {
      this._syncLyrics();
    });
  }

  _updateOffsetDisplay() {
    const sign = this.offsetSeconds >= 0 ? '+' : '';
    document.getElementById('lyrics-offset-display').textContent =
      `${sign}${this.offsetSeconds.toFixed(1)}s`;
  }

  async loadLyricsForTrack(track) {
    this.offsetSeconds = 0;
    this._updateOffsetDisplay();
    this.lastActiveIndex = -1;

    if (!track) {
      this.clear();
      return;
    }

    // 1. Try loading from saved lyrics library
    try {
      const saved = await window.electronAPI.loadLyrics(track.path);
      if (saved) {
        if (saved.type === 'txt') {
          this.parseTxt(saved.content);
        } else {
          this.parseLrc(saved.content);
        }
        return;
      }
    } catch (e) {
      // library not available
    }

    // 2. Try auto-detect .lrc/.txt next to audio file
    if (this.autoDetect) {
      const dir = getDirFromPath(track.path);
      const baseName = getFileName(track.path).replace(/\.[^.]+$/, '');

      const lrcPath = `${dir}/${baseName}.lrc`;
      const lrcContent = await this._tryReadLrcFile(lrcPath);
      if (lrcContent) {
        this.parseLrc(lrcContent);
        return;
      }

      const txtPath = `${dir}/${baseName}.txt`;
      const txtContent = await this._tryReadLrcFile(txtPath);
      if (txtContent) {
        this.parseTxt(txtContent);
        return;
      }
    }

    this.clear();
  }

  async _tryReadLrcFile(filePath) {
    try {
      return await window.electronAPI.readTextFile(filePath);
    } catch (e) {
      return null;
    }
  }

  parseTxt(content) {
    this.lyricsLines = [];
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const text = line.trim();
      if (!text) continue;
      this.lyricsLines.push({ time: -1, text });
    }

    this.render();
  }

  parseLrc(content) {
    this.lyricsLines = [];
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      // Match [mm:ss.xx] or [mm:ss.xxx] tags
      const timeMatch = line.match(/\[(\d{1,3}):(\d{2})(?:\.(\d{2,3}))?\]/g);
      if (!timeMatch) continue;

      const text = line.replace(/\[(\d{1,3}):(\d{2})(?:\.(\d{2,3}))?\]/g, '').trim();
      if (!text) continue;

      for (const tm of timeMatch) {
        const parts = tm.slice(1, -1).split(':');
        const mins = parseInt(parts[0]);
        const secsParts = parts[1].split('.');
        const secs = parseInt(secsParts[0]);
        let millis = 0;
        if (secsParts[1]) {
          millis = secsParts[1].length === 2
            ? parseInt(secsParts[1]) * 10
            : parseInt(secsParts[1]);
        }
        const timeSeconds = mins * 60 + secs + millis / 1000;
        this.lyricsLines.push({ time: timeSeconds, text });
      }
    }

    // Sort by time
    this.lyricsLines.sort((a, b) => a.time - b.time);
    this.render();
  }

  render() {
    if (this.lyricsLines.length === 0) {
      this.container.innerHTML = `
        <div class="lyrics-empty">
          <div class="empty-icon">🎤</div>
          <p>${i18nManager.t('lyrics.empty.title')}</p>
          <p class="empty-hint">${i18nManager.t('lyrics.empty.hint')}</p>
        </div>`;
      return;
    }

    let html = '';
    for (let i = 0; i < this.lyricsLines.length; i++) {
      const line = this.lyricsLines[i];
      html += `<div class="lyrics-line" data-lyric-index="${i}" data-time="${line.time}">${this._escapeHtml(line.text)}</div>`;
    }
    this.container.innerHTML = html;

    // Click to seek
    this.container.querySelectorAll('.lyrics-line').forEach(el => {
      el.addEventListener('click', () => {
        const time = parseFloat(el.dataset.time);
        audioEngine.seek(time + this.offsetSeconds);
      });
    });

    // Push initial lyrics data to floating window
    this._pushToFloating(-1);
  }

  _syncLyrics() {
    if (this.lyricsLines.length === 0) return;

    const currentTime = audioEngine.getCurrentTime() - this.offsetSeconds;

    // Find active lyric line
    let activeIndex = -1;
    for (let i = 0; i < this.lyricsLines.length; i++) {
      if (currentTime >= this.lyricsLines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex === this.lastActiveIndex) return;
    this.lastActiveIndex = activeIndex;

    // Update classes
    const lines = this.container.querySelectorAll('.lyrics-line');
    lines.forEach((el, i) => {
      el.classList.remove('active', 'past');
      if (i === activeIndex) {
        el.classList.add('active');
        // Auto-scroll to active
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (i < activeIndex) {
        el.classList.add('past');
      }
    });

    // Push to floating lyrics window if open
    this._pushToFloating(activeIndex);
  }

  _pushToFloating(activeIndex) {
    try {
      window.electronAPI.updateFloatingLyrics({
        lines: this.lyricsLines,
        activeIndex: activeIndex,
      });
    } catch (e) {
      // Floating lyrics window not supported or not open
    }
  }

  clear() {
    this.lyricsLines = [];
    this.lastActiveIndex = -1;
    this.container.innerHTML = `
      <div class="lyrics-empty">
        <div class="empty-icon">🎤</div>
        <p>${i18nManager.t('lyrics.empty.title')}</p>
        <p class="empty-hint">${i18nManager.t('lyrics.empty.hint')}</p>
      </div>`;
    // Notify floating lyrics window
    this._pushToFloating(-1);
  }

  async _loadLrcFromDialog() {
    const filePath = await window.electronAPI.openLyricsFile();
    if (!filePath) return;

    const content = await this._tryReadLrcFile(filePath);
    if (!content) return;

    const type = filePath.toLowerCase().endsWith('.txt') ? 'txt' : 'lrc';

    if (type === 'txt') {
      this.parseTxt(content);
    } else {
      this.parseLrc(content);
    }

    // Save to lyrics library for future auto-loading
    const currentTrack = playlist.currentTrack;
    if (currentTrack) {
      try {
        await window.electronAPI.saveLyrics(currentTrack.path, content, type);
      } catch (e) {
        // save failed, non-critical
      }
    }
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

const lyricsDisplay = new LyricsDisplay();