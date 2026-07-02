// ===== Audio Engine: Web Audio API core =====

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioElement = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.eqFilters = [];
    this.isPlaying = false;
    this.currentTrack = null;
    this.volume = 0.8;

    // Callbacks — use Sets so multiple modules can subscribe
    this._timeUpdateCallbacks = new Set();
    this._trackEndCallbacks = new Set();
    this._stateChangeCallbacks = new Set();
    this._errorCallbacks = new Set();

    // Legacy assignment-based API: audioEngine.onTimeUpdate = fn
    Object.defineProperty(this, 'onTimeUpdate', {
      set: (fn) => { if (fn) this._timeUpdateCallbacks.add(fn); },
      get: () => null,
      configurable: true,
    });
    Object.defineProperty(this, 'onTrackEnd', {
      set: (fn) => { if (fn) this._trackEndCallbacks.add(fn); },
      get: () => null,
      configurable: true,
    });
    Object.defineProperty(this, 'onStateChange', {
      set: (fn) => { if (fn) this._stateChangeCallbacks.add(fn); },
      get: () => null,
      configurable: true,
    });
    Object.defineProperty(this, 'onError', {
      set: (fn) => { if (fn) this._errorCallbacks.add(fn); },
      get: () => null,
      configurable: true,
    });

    this._init();
  }

  _init() {
    this.audioElement = document.getElementById('audio-element');
    this.audioElement.addEventListener('timeupdate', () => {
      for (const cb of this._timeUpdateCallbacks) {
        cb(this.audioElement.currentTime, this.audioElement.duration);
      }
    });
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      for (const cb of this._stateChangeCallbacks) cb('ended');
      for (const cb of this._trackEndCallbacks) cb();
    });
    this.audioElement.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      for (const cb of this._errorCallbacks) cb(e);
    });
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.currentTrack) {
        this.currentTrack.duration = this.audioElement.duration || 0;
      }
    });
  }

  _fireState(state) {
    for (const cb of this._stateChangeCallbacks) cb(state);
  }

  _ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  async loadTrack(track) {
    this.stop();
    this.currentTrack = track;

    this.audioElement.src = `file:///${track.path.replace(/\\/g, '/')}`;
    if (track.duration && track.duration > 0) {
      // Pre-set duration from metadata
    }

    // Wait for metadata to load
    return new Promise((resolve) => {
      this.audioElement.addEventListener('loadedmetadata', function handler() {
        track.duration = this.audioElement.duration || 0;
        this.audioElement.removeEventListener('loadedmetadata', handler);
        resolve();
      }.bind(this), { once: true });
      // Timeout fallback
      setTimeout(() => {
        if (!track.duration) {
          track.duration = this.audioElement.duration || 0;
        }
        resolve();
      }, 2000);
    });
  }

  async play() {
    if (!this.currentTrack) return;
    const ctx = this._ensureContext();

    // Only setup nodes once or on source change
    if (!this.sourceNode || this.sourceNode.mediaElement !== this.audioElement) {
      if (this.sourceNode) {
        try { this.sourceNode.disconnect(); } catch (e) { /* ignore */ }
      }
      this.sourceNode = ctx.createMediaElementSource(this.audioElement);

      // Setup analyser
      if (this.analyserNode) {
        try { this.analyserNode.disconnect(); } catch (e) { /* ignore */ }
      }
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Chain: source → eq filters → analyser → gain → destination
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);

      // Rebuild EQ chain (connect through filters)
      this._rebuildEQChain();
    }

    try {
      await this.audioElement.play();
      this.isPlaying = true;
      this._fireState('play');
    } catch (err) {
      console.error('Playback error:', err);
      for (const cb of this._errorCallbacks) cb(err);
    }
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
    this._fireState('pause');
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isPlaying = false;
    // IMPORTANT: Do NOT disconnect or null sourceNode here.
    // A MediaElementSourceNode can only be created ONCE per
    // HTMLMediaElement — even after disconnecting, recreating it
    // throws InvalidStateError. The sourceNode is reused on
    // subsequent play() calls.
  }

  seek(seconds) {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration || 0));
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
    this._fireState('volume');
  }

  adjustVolume(delta) {
    this.setVolume(this.volume + delta);
  }

  getVolume() {
    return this.volume;
  }

  getCurrentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  getDuration() {
    return this.audioElement ? (this.audioElement.duration || this.currentTrack?.duration || 0) : 0;
  }

  getProgress() {
    const dur = this.getDuration();
    if (!dur) return 0;
    return this.getCurrentTime() / dur;
  }

  // ===== Equalizer =====

  setEQBand(index, gainValue) {
    // Store for later; actual chain updated in _rebuildEQChain
    if (!this._eqValues) {
      this._eqValues = new Array(10).fill(0);
    }
    this._eqValues[index] = gainValue;
    if (this.sourceNode) {
      this._rebuildEQChain();
    }
  }

  setEQValues(values) {
    this._eqValues = [...values];
    if (this.sourceNode) {
      this._rebuildEQChain();
    }
  }

  _rebuildEQChain() {
    if (!this.sourceNode || !this.gainNode) return;

    // Disconnect old filters
    for (const filter of this.eqFilters) {
      try { filter.disconnect(); } catch (e) { /* ignore */ }
    }
    this.eqFilters = [];

    if (!this._eqValues || this._eqValues.every(v => v === 0)) {
      // No EQ: source → analyser → gain → destination
      try { this.sourceNode.disconnect(); } catch (e) { /* ignore */ }
      this.sourceNode.connect(this.analyserNode);
      return;
    }

    const ctx = this.audioContext;
    const eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    // Build filter chain
    let prevNode = this.sourceNode;
    for (let i = 0; i < eqFrequencies.length; i++) {
      const gain = this._eqValues[i] || 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = eqFrequencies[i];
      filter.Q.value = 1.0;
      filter.gain.value = gain;
      prevNode.connect(filter);
      prevNode = filter;
      this.eqFilters.push(filter);
    }

    // Last filter → analyser
    prevNode.connect(this.analyserNode);
  }

  // ===== Analyser data for visualizer =====

  getFrequencyData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData() {
    if (!this.analyserNode) return new Uint8Array(0);
    const bufferLength = this.analyserNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Global singleton
const audioEngine = new AudioEngine();