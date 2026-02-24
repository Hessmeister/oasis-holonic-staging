/* ═══════════════════════════════════════
   rings.js — Concentric holon circles
   Draw on reveal, orbit dots, counter-rotate
   ═══════════════════════════════════════ */

import { observeCanvas, prefersReducedMotion } from './main.js';

class RingsAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.time = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.drawProgress = 0;
    this.revealed = false;

    // More rings, alternating rotation direction
    this.rings = [
      { r: 0.44, dash: [6, 8],  speed: 0.00012,  dir:  1, breathDelay: 0,     opacity: 0.18 },
      { r: 0.36, dash: [3, 5],  speed: 0.00025,  dir: -1, breathDelay: -1500,  opacity: 0.30 },
      { r: 0.28, dash: [5, 6],  speed: 0.00018,  dir:  1, breathDelay: -3000,  opacity: 0.40 },
      { r: 0.20, dash: [2, 4],  speed: 0.00030,  dir: -1, breathDelay: -4500,  opacity: 0.50 },
      { r: 0.11, dash: [0, 0],  speed: 0,         dir:  1, breathDelay: -6000,  opacity: 0.60, fill: true },
    ];

    // Orbiting dots — small particles that ride along rings
    this.dots = [
      { ring: 0, angle: 0,      speed: 0.0006,  size: 2.0 },
      { ring: 0, angle: Math.PI, speed: 0.0006,  size: 1.5 },
      { ring: 1, angle: 1.2,    speed: -0.0008, size: 2.0 },
      { ring: 1, angle: 3.8,    speed: -0.0008, size: 1.2 },
      { ring: 2, angle: 0.5,    speed: 0.001,   size: 2.2 },
      { ring: 2, angle: 2.8,    speed: 0.001,   size: 1.4 },
      { ring: 3, angle: 2.0,    speed: -0.0014, size: 1.8 },
      { ring: 3, angle: 5.0,    speed: -0.0014, size: 1.0 },
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !this.revealed) {
          this.revealed = true;
          this.animateDrawIn();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(canvas);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 280);
    this.size = size;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  animateDrawIn() {
    const duration = 2200;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      this.drawProgress = Math.min(elapsed / duration, 1);
      this.drawProgress = 1 - Math.pow(1 - this.drawProgress, 3);
      this.draw(now);

      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        this.drawProgress = 1;
        this.start();
      }
    };

    requestAnimationFrame(step);
  }

  draw(t) {
    const { ctx, size } = this;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    const isLooping = this.revealed && this.drawProgress >= 1;

    // Draw rings
    this.rings.forEach((ring, i) => {
      const ringProgress = Math.max(0, Math.min(1, (this.drawProgress * (this.rings.length + 1) - i) / 2));
      if (ringProgress <= 0) return;

      // Breathing — each ring at its own phase
      const breathAmp = isLooping ? 0.025 : 0;
      const breathScale = 1 + Math.sin((t + ring.breathDelay) * 0.0006) * breathAmp;

      const r = ring.r * size * breathScale;

      // Rotation offset
      const rotation = isLooping ? t * ring.speed * ring.dir : 0;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * ringProgress));

      if (ring.fill && ringProgress >= 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fill();
      }

      ctx.strokeStyle = `rgba(0,51,70,${ring.opacity * ringProgress})`;
      ctx.lineWidth = ring.r > 0.35 ? 0.5 : 1;
      if (ring.dash[0] > 0) {
        ctx.setLineDash(ring.dash);
        ctx.lineDashOffset = -(t || 0) * 0.01 * ring.dir;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    });

    // Draw orbiting dots
    if (isLooping) {
      this.dots.forEach(dot => {
        const ring = this.rings[dot.ring];
        const breathAmp = 0.025;
        const breathScale = 1 + Math.sin((t + ring.breathDelay) * 0.0006) * breathAmp;
        const r = ring.r * size * breathScale;

        // Dot angle includes ring rotation + its own orbit
        const ringRotation = t * ring.speed * ring.dir;
        const angle = dot.angle + t * dot.speed + ringRotation;

        const dx = cx + Math.cos(angle) * r;
        const dy = cy + Math.sin(angle) * r;

        // Soft glow
        const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dot.size * 3);
        grad.addColorStop(0, `rgba(0,51,70,0.3)`);
        grad.addColorStop(1, `rgba(0,51,70,0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(dx - dot.size * 3, dy - dot.size * 3, dot.size * 6, dot.size * 6);

        // Dot core
        ctx.beginPath();
        ctx.arc(dx, dy, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,51,70,${0.5 + Math.sin(t * 0.002 + dot.angle) * 0.2})`;
        ctx.fill();
      });
    }

    // Center label
    if (this.drawProgress > 0.75) {
      const labelAlpha = Math.min(1, (this.drawProgress - 0.75) / 0.25) * 0.7;
      ctx.fillStyle = `rgba(0,51,70,${labelAlpha})`;
      ctx.font = `500 ${size * 0.035}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0.1em';
      ctx.fillText('HOLON', cx, cy);
    }
  }

  loop = (timestamp) => {
    if (!this.running) return;
    this.draw(timestamp);
    requestAnimationFrame(this.loop);
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.loop);
  }

  stop() { this.running = false; }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('ringsCanvas');
  if (!canvas) return;

  const rings = new RingsAnimation(canvas);

  if (prefersReducedMotion) {
    rings.drawProgress = 1;
    rings.revealed = true;
    rings.draw(0);
  } else {
    observeCanvas(canvas, () => { if (rings.revealed) rings.start(); }, () => rings.stop());
  }
});
