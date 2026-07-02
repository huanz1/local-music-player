// ===== Spectrum Visualizer =====

class Visualizer {
  constructor() {
    this.canvas = document.getElementById('visualizer-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    this.active = true;
    this.mode = 'bars'; // bars | vortex | waveform

    this._resize();
    this._startLoop();
    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    // Click to cycle visualization mode
    this.canvas.addEventListener('click', () => {
      const modes = ['bars', 'vortex', 'waveform'];
      const idx = modes.indexOf(this.mode);
      this.mode = modes[(idx + 1) % modes.length];
    });
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  _startLoop() {
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      if (!this.active) {
        this._drawSilent();
        return;
      }
      if (!audioEngine.isPlaying) {
        this._drawSilent();
        return;
      }
      switch (this.mode) {
        case 'bars': this._drawBars(); break;
        case 'vortex': this._drawVortex(); break;
        case 'waveform': this._drawWaveform(); break;
      }
    };
    this.animationId = requestAnimationFrame(draw);
  }

  _drawSilent() {
    const { width, height, ctx } = this;
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, width, height);
  }

  _drawBars() {
    const { width, height, ctx } = this;
    ctx.clearRect(0, 0, width, height);

    const dataArray = audioEngine.getFrequencyData();
    if (!dataArray.length) return;

    const barCount = 64;
    const barWidth = (width / barCount) * 0.8;
    const gap = (width / barCount) * 0.2;
    const step = Math.floor(dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = value * height * 0.85;

      // Gradient per bar based on frequency
      const hue = 240 + (i / barCount) * 240; // 240 (blue) → 480 (red-pink)
      ctx.fillStyle = `hsl(${hue % 360}, 80%, ${40 + value * 30}%)`;

      const x = i * (barWidth + gap);
      const y = height - barHeight;

      // Rounded top bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
      ctx.fill();
    }

    // Reflection effect
    ctx.globalAlpha = 0.15;
    ctx.scale(1, -1);
    ctx.translate(0, -height);
    // Redraw bars for reflection
    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = value * height * 0.85;
      const x = i * (barWidth + gap);
      ctx.fillStyle = `hsl(260, 70%, 50%)`;
      ctx.beginPath();
      ctx.roundRect(x, 0, barWidth, barHeight * 0.5, [barWidth / 2, barWidth / 2, 0, 0]);
      ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  _drawVortex() {
    const { width, height, ctx } = this;
    ctx.clearRect(0, 0, width, height);

    const dataArray = audioEngine.getFrequencyData();
    if (!dataArray.length) return;

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;
    const barCount = 80;
    const step = Math.floor(dataArray.length / barCount);

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const angle = (i / barCount) * Math.PI * 2;
      const radius = maxRadius * 0.3 + value * maxRadius * 0.7;

      const x1 = Math.cos(angle) * (maxRadius * 0.1);
      const y1 = Math.sin(angle) * (maxRadius * 0.1);
      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;

      const hue = (i / barCount) * 360 + Date.now() * 0.05;
      ctx.strokeStyle = `hsl(${hue % 360}, 80%, ${40 + value * 30}%)`;
      ctx.lineWidth = 2 + value * 3;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawWaveform() {
    const { width, height, ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, width, height);

    const dataArray = audioEngine.getWaveformData();
    if (!dataArray.length) return;

    ctx.beginPath();
    ctx.strokeStyle = 'hsl(340, 80%, 55%)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'hsl(340, 80%, 55%)';
    ctx.shadowBlur = 8;

    const step = Math.floor(dataArray.length / width);
    const midY = height / 2;

    for (let x = 0; x < width; x++) {
      const value = (dataArray[x * step] / 128) - 1; // -1 to 1
      const y = midY + value * midY * 0.8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  setActive(active) {
    this.active = active;
  }
}

const visualizer = new Visualizer();