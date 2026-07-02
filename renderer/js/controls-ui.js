// ===== Player Controls UI =====

class ControlsUI {
  constructor() {
    this.btnPlay = document.getElementById('btn-play');
    this.btnPrev = document.getElementById('btn-prev');
    this.btnNext = document.getElementById('btn-next');
    this.btnShuffle = document.getElementById('btn-shuffle');
    this.btnRepeat = document.getElementById('btn-repeat');
    this.btnFavorite = document.getElementById('btn-favorite');
    this.modeIcon = document.getElementById('playback-mode-icon');

    this.seekBarTrack = document.getElementById('seek-bar-container');
    this.seekBarProgress = document.getElementById('seek-bar-progress');
    this.seekBarThumb = document.getElementById('seek-bar-thumb');
    this.timeCurrent = document.getElementById('time-current');
    this.timeTotal = document.getElementById('time-total');

    this.volumeTrack = document.getElementById('volume-slider-container');
    this.volumeProgress = document.getElementById('volume-progress');
    this.volumeThumb = document.getElementById('volume-thumb');
    this.volumeIcon = document.getElementById('volume-icon');

    this.nowPlayingTitle = document.getElementById('now-playing-title');
    this.nowPlayingArtist = document.getElementById('now-playing-artist');
    this.nowPlayingAlbum = document.getElementById('now-playing-album');
    this.coverArt = document.getElementById('cover-art');
    this.miniTitle = document.getElementById('mini-title');
    this.miniArtist = document.getElementById('mini-artist');

    this._isSeeking = false;
    this._isAdjustingVolume = false;

    this._bindEvents();
    this._setupAudioCallbacks();
    this._updateModeIcon();
    this._updateVolumeUI();
  }

  _bindEvents() {
    // Play/Pause
    this.btnPlay.addEventListener('click', () => {
      if (audioEngine.isPlaying) {
        audioEngine.pause();
      } else {
        if (playlist.currentTrack) {
          audioEngine.play();
        }
      }
    });

    // Previous
    this.btnPrev.addEventListener('click', () => {
      this._playPrevious();
    });

    // Next
    this.btnNext.addEventListener('click', () => {
      this._playNext();
    });

    // Shuffle (toggle independently)
    this.btnShuffle.addEventListener('click', () => {
      playlist.toggleShuffle();
      this._updateModeIcon();
    });

    // Repeat (cycle: sequential → repeat-all → repeat-one → sequential)
    this.btnRepeat.addEventListener('click', () => {
      playlist.cycleRepeatMode();
      this._updateModeIcon();
    });

    // Favorite
    this.btnFavorite.addEventListener('click', () => {
      if (playlist.currentIndex >= 0) {
        const isFav = playlist.toggleFavorite(playlist.currentIndex);
        this.btnFavorite.textContent = isFav ? '❤️' : '🤍';
      }
    });

    // Seek bar
    this.seekBarTrack.addEventListener('mousedown', (e) => {
      this._isSeeking = true;
      this._seekFromEvent(e);
    });
    document.addEventListener('mousemove', (e) => {
      if (this._isSeeking) this._seekFromEvent(e);
      if (this._isAdjustingVolume) this._volumeFromEvent(e);
    });
    document.addEventListener('mouseup', () => {
      this._isSeeking = false;
      this._isAdjustingVolume = false;
    });

    // Volume
    this.volumeTrack.addEventListener('mousedown', (e) => {
      this._isAdjustingVolume = true;
      this._volumeFromEvent(e);
    });
    this.volumeIcon.addEventListener('click', () => {
      // Toggle mute
      if (audioEngine.getVolume() > 0) {
        this._lastVolume = audioEngine.getVolume();
        audioEngine.setVolume(0);
      } else {
        audioEngine.setVolume(this._lastVolume || 0.8);
      }
      this._updateVolumeUI();
    });
  }

  _setupAudioCallbacks() {
    audioEngine.onTimeUpdate = (currentTime, duration) => {
      if (!this._isSeeking) {
        const progress = duration > 0 ? currentTime / duration : 0;
        this.seekBarProgress.style.width = `${progress * 100}%`;
        this.seekBarThumb.style.left = `${progress * 100}%`;
        this.timeCurrent.textContent = formatTime(currentTime);
        this.timeTotal.textContent = formatTime(duration);
      }

      // Lyrics sync is handled independently by lyrics.js
    };

    audioEngine.onStateChange = (state) => {
      switch (state) {
        case 'play':
          this.btnPlay.textContent = '⏸️';
          this._updateNowPlaying();
          break;
        case 'pause':
          this.btnPlay.textContent = '▶️';
          break;
        case 'ended':
          this.btnPlay.textContent = '▶️';
          // Track auto-advance is handled by onTrackEnd —
          // calling _playNext() here would double-advance and skip tracks.
          break;
        case 'volume':
          this._updateVolumeUI();
          break;
      }
      this._updateMiniPlayer();
    };

    audioEngine.onTrackEnd = () => {
      if (playlist.playMode === 'repeat-one') {
        // Loop the current track
        audioEngine.seek(0);
        audioEngine.play();
      } else if (playlist.playMode === 'repeat-all') {
        // Play next track (wraps around to first)
        this._playNext();
      } else {
        // Sequential: auto-pause, don't advance
        audioEngine.seek(0);
        playlistUI.render();
      }
    };

    playlist.onCurrentChange = (track, index) => {
      this._updateNowPlaying();
      this._updateFavoriteBtn();
      this._updateMiniPlayer();
      playlistUI._highlightCurrent();
      if (track) {
        lyricsDisplay.loadLyricsForTrack(track);
        this._addToHistory(track);
      }
    };
  }

  async _playNext() {
    // Sequential mode: stop at end of playlist
    if (playlist.playMode === 'sequential' && playlist.currentIndex >= playlist.length - 1) {
      return;
    }
    const nextIndex = playlist.getNextIndex();
    if (nextIndex >= 0 && nextIndex < playlist.length) {
      playlist.setCurrent(nextIndex);
      audioEngine.stop();
      await audioEngine.loadTrack(playlist.currentTrack);
      await audioEngine.play();
      playlistUI.render();
    }
  }

  async _playPrevious() {
    // Sequential mode: stop at beginning of playlist
    if (playlist.playMode === 'sequential' && playlist.currentIndex <= 0) {
      return;
    }
    const prevIndex = playlist.getPreviousIndex();
    if (prevIndex >= 0 && prevIndex < playlist.length) {
      playlist.setCurrent(prevIndex);
      audioEngine.stop();
      await audioEngine.loadTrack(playlist.currentTrack);
      await audioEngine.play();
      playlistUI.render();
    }
  }

  _seekFromEvent(e) {
    const rect = this.seekBarTrack.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const progress = x / rect.width;
    const duration = audioEngine.getDuration();
    audioEngine.seek(progress * duration);
    this.seekBarProgress.style.width = `${progress * 100}%`;
    this.seekBarThumb.style.left = `${progress * 100}%`;
    this.timeCurrent.textContent = formatTime(progress * duration);
  }

  _volumeFromEvent(e) {
    const rect = this.volumeTrack.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const volume = x / rect.width;
    audioEngine.setVolume(volume);
    this._updateVolumeUI();
  }

  _updateVolumeUI() {
    const vol = audioEngine.getVolume();
    this.volumeProgress.style.width = `${vol * 100}%`;
    this.volumeThumb.style.left = `${vol * 100}%`;

    if (vol === 0) {
      this.volumeIcon.textContent = '🔇';
    } else if (vol < 0.5) {
      this.volumeIcon.textContent = '🔉';
    } else {
      this.volumeIcon.textContent = '🔊';
    }
  }

  _updateModeIcon() {
    const mode = playlist.playMode;
    const shuffle = playlist.shuffleEnabled;

    // Update shuffle button
    this.btnShuffle.classList.toggle('active', shuffle);
    this.btnShuffle.title = shuffle
      ? i18nManager.t('mode.shuffle_on')
      : i18nManager.t('mode.shuffle_off');

    // Update repeat button
    const repeatActive = mode === 'repeat-one' || mode === 'repeat-all';
    this.btnRepeat.classList.toggle('active', repeatActive);
    switch (mode) {
      case 'repeat-one':
        this.btnRepeat.textContent = '🔂';
        this.btnRepeat.title = i18nManager.t('mode.loop_one');
        break;
      case 'repeat-all':
        this.btnRepeat.textContent = '🔁';
        this.btnRepeat.title = i18nManager.t('mode.loop_all');
        break;
      default:
        this.btnRepeat.textContent = '🔁';
        this.btnRepeat.title = i18nManager.t('mode.loop_off');
        break;
    }

    // Update mode indicator in header center
    if (shuffle && repeatActive) {
      if (mode === 'repeat-one') {
        this.modeIcon.textContent = '🔀🔂'; this.modeIcon.title = i18nManager.t('mode.shuffle_repeat_one');
      } else {
        this.modeIcon.textContent = '🔀🔁'; this.modeIcon.title = i18nManager.t('mode.shuffle_repeat_all');
      }
    } else if (shuffle) {
      this.modeIcon.textContent = '🔀'; this.modeIcon.title = i18nManager.t('mode.shuffle_label');
    } else {
      switch (mode) {
        case 'sequential': this.modeIcon.textContent = '▶️'; this.modeIcon.title = i18nManager.t('mode.sequential_label'); break;
        case 'repeat-one': this.modeIcon.textContent = '🔂'; this.modeIcon.title = i18nManager.t('mode.repeat_one_label'); break;
        case 'repeat-all': this.modeIcon.textContent = '🔁'; this.modeIcon.title = i18nManager.t('mode.repeat_all_label'); break;
      }
    }
  }

  _updateFavoriteBtn() {
    if (playlist.currentIndex >= 0) {
      this.btnFavorite.textContent = playlist.isFavorite(playlist.currentIndex) ? '❤️' : '🤍';
    }
  }

  _updateNowPlaying() {
    const track = playlist.currentTrack;
    if (!track) {
      this.nowPlayingTitle.textContent = i18nManager.t('now-playing.no-track');
      this.nowPlayingArtist.textContent = i18nManager.t('now-playing.select-track');
      this.nowPlayingAlbum.textContent = '';
      this.coverArt.textContent = '🎵';
      this.miniTitle.textContent = i18nManager.t('player.no-track');
      this.miniArtist.textContent = '—';
      window.electronAPI.setTitle('Music Player');
      return;
    }

    this.nowPlayingTitle.textContent = track.title;
    this.nowPlayingArtist.textContent = track.artist;
    this.nowPlayingAlbum.textContent = track.album || '';
    this.miniTitle.textContent = track.title;
    this.miniArtist.textContent = track.artist;
    window.electronAPI.setTitle(`${track.title} — ${track.artist}`);

    // Try loading cover art
    if (track.hasCover) {
      window.electronAPI.getCoverArt(track.path).then(cover => {
        if (cover) {
          this.coverArt.innerHTML = `<img src="${cover}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
          this.coverArt.style.fontSize = '0';
        }
      });
    } else {
      this.coverArt.textContent = '🎵';
      this.coverArt.style.fontSize = '72px';
    }
  }

  _updateMiniPlayer() {
    const track = playlist.currentTrack;
    window.electronAPI.updateMiniPlayer({
      title: track?.title || i18nManager.t('player.no-track'),
      artist: track?.artist || '—',
      isPlaying: audioEngine.isPlaying,
      cover: track?.hasCover,
    });
  }

  async _addToHistory(track) {
    if (typeof historyManager !== 'undefined') {
      historyManager.addEntry(track);
    }
  }
}

const controlsUI = new ControlsUI();