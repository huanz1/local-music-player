// ===== Floating Lyrics Window Script =====

class FloatingLyrics {
  constructor() {
    this.lines = [];
    this.activeIndex = -1;
    this._lastRendered = -1;

    this.contentEl = document.getElementById('floating-lyrics-content');

    this._setupIPCListeners();
    this._setupCloseButton();
    this._setupResizeHandles();
  }

  _setupIPCListeners() {
    window.electronAPI.onLyricsUpdate((data) => {
      if (data && data.lines) {
        this.lines = data.lines;
        this.activeIndex = data.activeIndex;
        this._render();
      }
    });

    window.electronAPI.onLyricsClear(() => {
      this.lines = [];
      this.activeIndex = -1;
      this._render();
    });
  }

  _setupCloseButton() {
    document.querySelector('.floating-close-btn').addEventListener('click', () => {
      window.electronAPI.closeFloatingLyrics();
    });
  }

  _setupResizeHandles() {
    document.querySelectorAll('.resize-handle').forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
        this._onResizeStart(e, handle.dataset.dir);
      });
    });
  }

  async _onResizeStart(e, direction) {
    e.preventDefault();
    const target = e.target;
    const pointerId = e.pointerId;
    target.setPointerCapture(pointerId);

    const bounds = await window.electronAPI.getFloatingBounds();
    if (!bounds) return;

    const startX = e.screenX;
    const startY = e.screenY;
    const minW = 300;
    const minH = 200;
    let raf = null;
    let lastMoveEvent = null;

    const applyResize = () => {
      raf = null;
      if (!lastMoveEvent) return;
      const me = lastMoveEvent;
      const dx = me.screenX - startX;
      const dy = me.screenY - startY;

      let { x, y, width, height } = bounds;

      if (direction.includes('e')) {
        width = Math.max(minW, bounds.width + dx);
      }
      if (direction.includes('w')) {
        width = Math.max(minW, bounds.width - dx);
        x = bounds.x + bounds.width - width;
      }
      if (direction.includes('s')) {
        height = Math.max(minH, bounds.height + dy);
      }
      if (direction.includes('n')) {
        height = Math.max(minH, bounds.height - dy);
        y = bounds.y + bounds.height - height;
      }

      window.electronAPI.setFloatingBounds({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    const onMove = (e) => {
      lastMoveEvent = e;
      if (!raf) {
        raf = requestAnimationFrame(applyResize);
      }
    };

    const onUp = () => {
      if (raf) cancelAnimationFrame(raf);
      try { target.releasePointerCapture(pointerId); } catch (_) {}
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  _render() {
    if (this.activeIndex === this._lastRendered && this.lines.length > 0) return;

    this.contentEl.innerHTML = '';

    if (this.lines.length === 0) {
      this.contentEl.innerHTML = '<div class="lyrics-empty-floating">No lyrics loaded</div>';
      this._lastRendered = -1;
      return;
    }

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const div = document.createElement('div');
      div.className = 'lyrics-floating-line';
      div.textContent = line.text;

      if (i === this.activeIndex) {
        div.classList.add('active');
      } else if (i < this.activeIndex) {
        div.classList.add('past');
      }

      this.contentEl.appendChild(div);
    }

    this._scrollToActive();
    this._lastRendered = this.activeIndex;
  }

  _scrollToActive() {
    const activeEl = this.contentEl.querySelector('.lyrics-floating-line.active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FloatingLyrics();
});
