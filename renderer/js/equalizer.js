// ===== Equalizer =====

const EQ_PRESETS = {
  Flat:       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock:       [5, 4, 0, -2, -1, 2, 5, 6, 6, 7],
  Pop:        [-2, 0, 3, 4, 3, -1, -1, 0, 1, 2],
  Jazz:       [4, 3, 0, -1, -2, 0, 2, 4, 5, 5],
  Classical:  [4, 3, 2, 0, -1, -1, 0, 2, 3, 4],
  'Hip-Hop':  [6, 5, 2, 0, -1, 0, 3, 4, 3, 2],
  Electronic: [4, 3, 0, -3, -4, 0, 3, 5, 5, 4],
  Custom:     null,
};

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

class EqualizerUI {
  constructor() {
    this.panel = document.getElementById('equalizer-panel');
    this.slidersContainer = document.getElementById('eq-sliders-container');
    this.presetSelect = document.getElementById('eq-preset-select');
    this.visible = false;
    this.currentPreset = 'Flat';

    this._buildSliders();
    this._bindEvents();
    this._loadSaved();
  }

  _buildSliders() {
    this.slidersContainer.innerHTML = '';
    for (let i = 0; i < EQ_FREQUENCIES.length; i++) {
      const freq = EQ_FREQUENCIES[i];
      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

      const band = document.createElement('div');
      band.className = 'eq-band';
      band.innerHTML = `
        <span class="eq-band-value">0 dB</span>
        <div class="eq-slider-container">
          <input type="range" class="eq-slider" orient="vertical"
                 min="-12" max="12" value="0" step="0.5"
                 data-index="${i}">
        </div>
        <span class="eq-band-label">${label}</span>
      `;
      this.slidersContainer.appendChild(band);
    }

    // Bind slider events
    this.slidersContainer.querySelectorAll('.eq-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const index = parseInt(slider.dataset.index);
        const value = parseFloat(slider.value);
        slider.parentElement.parentElement.querySelector('.eq-band-value').textContent =
          `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
        audioEngine.setEQBand(index, value);

        // Check if custom
        if (this.currentPreset !== 'Custom') {
          this.presetSelect.value = 'Custom';
          this.currentPreset = 'Custom';
        }
        this._saveEQ();
      });
    });
  }

  _bindEvents() {
    this.presetSelect.addEventListener('change', () => {
      const preset = this.presetSelect.value;
      this.applyPreset(preset);
    });

    document.getElementById('btn-toggle-eq').addEventListener('click', () => {
      this.toggle();
    });

    document.getElementById('btn-reset-eq').addEventListener('click', () => {
      this.applyPreset('Flat');
    });
  }

  applyPreset(presetName) {
    if (!EQ_PRESETS[presetName] && presetName !== 'Custom') return;

    this.currentPreset = presetName;
    this.presetSelect.value = presetName;

    const values = presetName === 'Custom'
      ? this._getCurrentValues()
      : EQ_PRESETS[presetName];

    audioEngine.setEQValues(values);

    this.slidersContainer.querySelectorAll('.eq-slider').forEach(slider => {
      const index = parseInt(slider.dataset.index);
      const value = values[index] || 0;
      slider.value = value;
      slider.parentElement.parentElement.querySelector('.eq-band-value').textContent =
        `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
    });

    this._saveEQ();
  }

  _getCurrentValues() {
    const values = [];
    this.slidersContainer.querySelectorAll('.eq-slider').forEach(slider => {
      values.push(parseFloat(slider.value) || 0);
    });
    return values;
  }

  toggle() {
    this.visible = !this.visible;
    this.panel.classList.toggle('hidden', !this.visible);
    document.getElementById('btn-toggle-eq').classList.toggle('active', this.visible);
  }

  async _loadSaved() {
    try {
      const preset = await window.electronAPI.storeGet('eqPreset');
      const bands = await window.electronAPI.storeGet('eqBands');
      if (preset && preset !== 'Custom') {
        this.applyPreset(preset);
      } else if (bands && bands.length === 10) {
        this.applyPreset('Custom');
        audioEngine.setEQValues(bands);
        this.slidersContainer.querySelectorAll('.eq-slider').forEach(slider => {
          const index = parseInt(slider.dataset.index);
          const value = bands[index] || 0;
          slider.value = value;
          slider.parentElement.parentElement.querySelector('.eq-band-value').textContent =
            `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
        });
      }
    } catch (e) {
      // No saved EQ
    }
  }

  async _saveEQ() {
    try {
      await window.electronAPI.storeSet('eqPreset', this.currentPreset);
      await window.electronAPI.storeSet('eqBands', this._getCurrentValues());
    } catch (e) {
      // Store may not be ready
    }
  }
}

const equalizerUI = new EqualizerUI();