/* ═══════════════════════════════════════
   kernel.js — OASIS Kernel Architecture
   Concentric constraint → freedom diagram
   Light-on-dark (teal bg), orbiting dots
   ═══════════════════════════════════════ */

import { observeCanvas, prefersReducedMotion } from './main.js';

class KernelDiagram {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.revealed = false;
    this.revealProgress = 0;

    this.dots = [
      { ring: 0, angle: 0,          speed:  0.0007,  size: 2.2 },
      { ring: 0, angle: Math.PI,    speed:  0.0007,  size: 1.6 },
      { ring: 1, angle: 0.8,        speed: -0.0005,  size: 2.0 },
      { ring: 1, angle: 3.5,        speed: -0.0005,  size: 1.4 },
      { ring: 2, angle: 1.5,        speed:  0.00035, size: 1.8 },
      { ring: 2, angle: 4.2,        speed:  0.00035, size: 1.2 },
      { ring: 3, angle: 0.3,        speed: -0.0003,  size: 1.5 },
      { ring: 3, angle: 2.7,        speed: -0.0003,  size: 1.0 },
      { ring: 3, angle: 5.0,        speed: -0.0003,  size: 1.3 },
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.min(rect.width, 960);
    const h = w * 0.72;
    this.w = w;
    this.h = h;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  animateReveal() {
    if (this.revealed) return;
    this.revealed = true;
    const dur = 2400;
    const start = performance.now();
    const step = (now) => {
      this.revealProgress = Math.min((now - start) / dur, 1);
      this.revealProgress = 1 - Math.pow(1 - this.revealProgress, 3);
      this.draw(now);
      if (this.revealProgress < 1) requestAnimationFrame(step);
      else { this.revealProgress = 1; this.start(); }
    };
    requestAnimationFrame(step);
  }

  draw(t) {
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h * 0.46;
    const rp = this.revealProgress;
    const loop = this.revealed && rp >= 1;
    const S = w * 0.44;

    ctx.clearRect(0, 0, w, h);

    // Ring definitions — light strokes for dark teal bg
    const rings = [
      { r: S * 0.16, dash: [0, 0],  lw: 0,   dir:  1, opacity: 0,    breathOff: 0 },
      { r: S * 0.38, dash: [0, 0],  lw: 1.8, dir:  1, opacity: 0.40, breathOff: 0 },
      { r: S * 0.60, dash: [6, 5],  lw: 1.2, dir: -1, opacity: 0.30, breathOff: 1500 },
      { r: S * 0.80, dash: [4, 8],  lw: 0.8, dir:  1, opacity: 0.22, breathOff: 3000 },
      { r: S * 0.97, dash: [2, 6],  lw: 0.5, dir: -1, opacity: 0.15, breathOff: 4500 },
    ];

    // ── Draw rings ──
    for (let i = rings.length - 1; i >= 1; i--) {
      const ring = rings[i];
      const ringP = this.ringP(rp, i);
      if (ringP <= 0) continue;

      const breathAmp = loop ? 0.008 : 0;
      const breathScale = 1 + Math.sin((t + ring.breathOff) * 0.0005) * breathAmp;
      const r = ring.r * breathScale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringP);
      ctx.strokeStyle = `rgba(254,218,179,${ring.opacity * ringP})`;
      ctx.lineWidth = ring.lw;
      if (ring.dash[0] > 0) {
        ctx.setLineDash(ring.dash);
        ctx.lineDashOffset = loop ? -(t * 0.006 * ring.dir) : 0;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ── Orbiting dots ──
    if (loop) {
      this.dots.forEach(dot => {
        const ring = rings[dot.ring];
        const breathAmp = 0.008;
        const breathScale = 1 + Math.sin((t + ring.breathOff) * 0.0005) * breathAmp;
        const r = ring.r * breathScale;
        const angle = dot.angle + t * dot.speed;
        const dx = cx + Math.cos(angle) * r;
        const dy = cy + Math.sin(angle) * r;

        const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dot.size * 3.5);
        grad.addColorStop(0, 'rgba(254,218,179,0.35)');
        grad.addColorStop(1, 'rgba(254,218,179,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(dx - dot.size * 4, dy - dot.size * 4, dot.size * 8, dot.size * 8);

        ctx.beginPath();
        ctx.arc(dx, dy, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254,218,179,${0.6 + Math.sin(t * 0.002 + dot.angle) * 0.15})`;
        ctx.fill();
      });
    }

    // ── Labels (light on dark) ──

    // Invariants — cardinal
    const e1 = this.ringP(rp, 1);
    if (e1 > 0.65) {
      const lp = Math.min(1, (e1 - 0.65) * 2.8);
      const r1 = rings[1].r;
      const inv = [
        { text: 'Self-Containment', a: -Math.PI / 2 },
        { text: 'Persistence',      a: 0 },
        { text: 'Interoperability',  a: Math.PI / 2 },
        { text: 'Observability',     a: Math.PI },
      ];
      inv.forEach(({ text, a }) => {
        const d = r1 + 16;
        const lx = cx + Math.cos(a) * d;
        const ly = cy + Math.sin(a) * d;
        ctx.fillStyle = `rgba(255,255,255,${0.88 * lp})`;
        ctx.font = `500 ${this.fs(0.019)}px Inter, sans-serif`;
        ctx.textAlign = this.alignFor(a);
        ctx.textBaseline = a === -Math.PI / 2 ? 'bottom' : a === Math.PI / 2 ? 'top' : 'middle';
        ctx.fillText(text, lx + this.xOff(a), ly);
      });
    }

    // Rules — diagonal
    const e2 = this.ringP(rp, 2);
    if (e2 > 0.65) {
      const lp = Math.min(1, (e2 - 0.65) * 2.8);
      const r2 = rings[2].r;
      const rules = [
        { text: 'Identity vs Commitments',  a: -Math.PI * 0.25 },
        { text: 'Reconciliation',            a:  Math.PI * 0.25 },
        { text: 'Explicit Ambiguity',        a:  Math.PI * 0.75 },
        { text: 'Attributable Resolution',   a: -Math.PI * 0.75 },
      ];
      rules.forEach(({ text, a }) => {
        const d = r2 + 14;
        const lx = cx + Math.cos(a) * d;
        const ly = cy + Math.sin(a) * d;
        ctx.fillStyle = `rgba(254,218,179,${0.6 * lp})`;
        ctx.font = `400 ${this.fs(0.016)}px Inter, sans-serif`;
        ctx.textAlign = this.alignFor(a);
        ctx.textBaseline = 'middle';
        ctx.fillText(text, lx + this.xOff(a), ly);
      });
    }

    // Interfaces — bottom arc
    const e3 = this.ringP(rp, 3);
    if (e3 > 0.6) {
      const lp = Math.min(1, (e3 - 0.6) * 2.5);
      const r3 = rings[3].r;
      const items = ['SDK', 'API', 'CLI', 'Visualizers', 'Indexers'];
      items.forEach((label, i) => {
        const angle = Math.PI * 0.15 + (Math.PI * 0.70 / (items.length - 1)) * i;
        const lx = cx + Math.cos(angle) * (r3 + 14);
        const ly = cy + Math.sin(angle) * (r3 + 14);
        ctx.fillStyle = `rgba(254,218,179,${0.5 * lp})`;
        ctx.font = `400 ${this.fs(0.014)}px Inter, sans-serif`;
        ctx.textAlign = angle < Math.PI * 0.4 ? 'left' : angle > Math.PI * 0.6 ? 'right' : 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lx, ly);
      });
    }

    // Environments — pill nodes
    const e4 = this.ringP(rp, 4);
    if (e4 > 0.55) {
      const lp = Math.min(1, (e4 - 0.55) * 2.2);
      const r4 = rings[4].r;
      const envs = ['Blockchains', 'Databases', 'Clouds', 'Storage', 'Runtimes'];
      envs.forEach((label, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i / envs.length);
        const drift = loop ? Math.sin(t * 0.0001 + i * 1.3) * 0.006 : 0;
        const na = a + drift;
        const nx = cx + Math.cos(na) * r4;
        const ny = cy + Math.sin(na) * r4;
        const fontSize = this.fs(0.014);
        ctx.font = `400 ${fontSize}px Inter, sans-serif`;
        const tw = ctx.measureText(label).width;
        const pw = tw + 14;
        const ph = fontSize + 8;
        this.drawPill(ctx, nx - pw / 2, ny - ph / 2, pw, ph, ph / 2,
          `rgba(0,51,70,${0.85 * lp})`, `rgba(254,218,179,${0.35 * lp})`);
        ctx.fillStyle = `rgba(255,254,223,${0.8 * lp})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, nx, ny + 0.5);
      });
    }

    // ── Core ──
    const e0 = this.ringP(rp, 0);
    if (e0 > 0) {
      const cr = rings[0].r * Math.min(1, e0 * 1.4);
      const grad = ctx.createRadialGradient(cx - cr * 0.1, cy - cr * 0.1, 0, cx, cy, cr);
      grad.addColorStop(0, `rgba(255,55,0,${0.95 * e0})`);
      grad.addColorStop(1, `rgba(255,55,0,${0.98 * e0})`);
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (e0 > 0.4) {
        const lp = Math.min(1, (e0 - 0.4) * 1.7);
        ctx.fillStyle = `rgba(255,255,255,${0.95 * lp})`;
        ctx.font = `600 ${this.fs(0.024)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HOLON', cx, cy);
      }
    }

    // ── Caption ──
    const ec = this.ringP(rp, 5);
    if (ec > 0.2) {
      const captionY = cy + rings[4].r + 36;
      const fontSize = this.fs(0.016);
      const lineH = fontSize * 1.9;
      const lines = [
        { t: 'Constraint is highest at the center and decreases outward.', italic: false },
        { t: 'The kernel enforces invariants, not outcomes.', italic: false },
        { t: 'Everything beyond the kernel is optional.', italic: true },
      ];
      lines.forEach((line, i) => {
        const a = Math.min(1, ec) * (0.6 - i * 0.1);
        ctx.fillStyle = `rgba(254,218,179,${a})`;
        ctx.font = `${line.italic ? 'italic ' : ''}400 ${fontSize}px ${line.italic ? 'Newsreader, serif' : 'Inter, sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(line.t, cx, captionY + i * lineH);
      });
    }
  }

  ringP(rp, ring) {
    const delay = ring * 0.12;
    return Math.max(0, Math.min(1, (rp - delay) / 0.3));
  }

  fs(ratio) { return Math.max(9, this.w * ratio); }

  alignFor(a) {
    const n = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (n > Math.PI * 0.15 && n < Math.PI * 0.85) return 'left';
    if (n > Math.PI * 1.15 && n < Math.PI * 1.85) return 'right';
    return 'center';
  }

  xOff(a) {
    const al = this.alignFor(a);
    return al === 'left' ? 5 : al === 'right' ? -5 : 0;
  }

  drawPill(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  loop = (ts) => {
    if (!this.running) return;
    this.draw(ts);
    requestAnimationFrame(this.loop);
  }

  start() { if (this.running) return; this.running = true; requestAnimationFrame(this.loop); }
  stop() { this.running = false; }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('kernelCanvas');
  if (!canvas) return;
  const kernel = new KernelDiagram(canvas);
  if (prefersReducedMotion) {
    kernel.revealProgress = 1;
    kernel.revealed = true;
    kernel.draw(0);
  } else {
    const section = canvas.closest('.reveal');
    if (section) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && !kernel.revealed) {
            kernel.animateReveal();
            obs.unobserve(section);
          }
        });
      }, { threshold: 0.15 });
      obs.observe(section);
    }
    observeCanvas(canvas, () => { if (kernel.revealed) kernel.start(); }, () => kernel.stop());
  }
});
