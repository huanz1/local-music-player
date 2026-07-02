// ===== Theme Manager =====

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.btnToggle = document.getElementById('btn-toggle-theme');
    this._bindEvents();
    this._loadSaved();
  }

  _bindEvents() {
    this.btnToggle.addEventListener('click', () => {
      this.toggle();
    });
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this._apply();
    this._save();
  }

  setTheme(name) {
    if (name === 'dark' || name === 'light') {
      this.currentTheme = name;
      this._apply();
      this._save();
    }
  }

  _apply() {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${this.currentTheme}`);
    this.btnToggle.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
  }

  async _loadSaved() {
    try {
      const theme = await window.electronAPI.storeGet('theme');
      if (theme && (theme === 'dark' || theme === 'light')) {
        this.currentTheme = theme;
      } else {
        // Auto-detect OS preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          this.currentTheme = 'light';
        }
      }
    } catch (e) {
      // default dark
    }
    this._apply();
  }

  async _save() {
    try {
      await window.electronAPI.storeSet('theme', this.currentTheme);
    } catch (e) {
      // ignore
    }
  }
}

const themeManager = new ThemeManager();