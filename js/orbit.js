/* ═══════════════════════════════════════
   orbit.js — Celestial holarchy diagram
   Full-width dramatic orrery on dark bg
   Star (orange core) → Planet → Moon → Zome
   ═══════════════════════════════════════ */

import { observeCanvas, prefersReducedMotion } from './main.js';

class OrbitAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.revealed = false;
    this.revealProgress = 0;

    this.bodies = [
      {
        label: 'Star',
        tier: 'I',
        orbit: 0,
        angle: 0,
        speed: 0,
        size: 24,
        shape: 'circle',
      },
      {
        label: 'Planet',
        tier: 'II',
        orbit: 0.30,
        angle: 0.8,
        speed: 0.00025,
        size: 12,
        shape: 'circle',
      },
      {
        label: 'Moon',
        tier: 'III',
        orbit: 0.10,
        angle: 2.5,
        speed: 0.0012,
        size: 7,
        shape: 'circle',
        parent: 1,
      },
      {
        label: 'Zome',
        tier: 'IV',
        orbit: 0.05,
        angle: 4.8,
        speed: 0.003,
        size: 4,
        shape: 'diamond',
        parent: 2,
      },
    ];

    this.orbitRings = [
      { bodyIdx: 1, dash: [6, 8],  opacity: 0.30, lw: 1.2 },
      { bodyIdx: 2, dash: [4, 6],  opacity: 0.22, lw: 0.9 },
      { bodyIdx: 3, dash: [2, 4],  opacity: 0.16, lw: 0.7 },
    ];

    // Trailing particles on orbits
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        ringIdx: Math.floor(Math.random() * 3),
        angle: Math.random() * Math.PI * 2,
        speed: (0.0002 + Math.random() * 0.0004) * (Math.random() > 0.5 ? 1 : -1),
        size: 0.6 + Math.random() * 1.2,
        alpha: 0.1 + Math.random() * 0.25,
      });
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !this.revealed) {
          this.revealed = true;
          this.animateReveal();
        }
      });
    }, { threshold: 0.15 });
    obs.observe(canvas);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, 680);
    this.size = size;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  animateReveal() {
    const dur = 2400;
    const start = performance.now();
    const step = (now) => {
      this.revealProgress = Math.min((now - start) / dur, 1);
      this.revealProgress = 1 - Math.pow(1 - this.revealProgress, 3);
      this.draw(now);
      if (this.revealProgress < 1) {
        requestAnimationFrame(step);
      } else {
        this.start();
      }
    };
    requestAnimationFrame(step);
  }

  getBodyPos(body, t) {
    const cx = this.size / 2;
    const cy = this.size / 2;

    if (body.orbit === 0) return { x: cx, y: cy };

    let parentX = cx, parentY = cy;
    if (body.parent !== undefined) {
      const parent = this.bodies[body.parent];
      const pp = this.getBodyPos(parent, t);
      parentX = pp.x;
      parentY = pp.y;
    }

    const orbitR = body.orbit * this.size;
    const angle = body.angle + t * body.speed;
    return {
      x: parentX + Math.cos(angle) * orbitR,
      y: parentY + Math.sin(angle) * orbitR,
    };
  }

  drawShape(ctx, x, y, shape, size) {
    ctx.beginPath();
    if (shape === 'diamond') {
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.7, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.7, y);
      ctx.closePath();
    } else {
      ctx.arc(x, y, size, 0, Math.PI * 2);
    }
  }

  draw(t) {
    const { ctx, size } = this;
    const cx = size / 2;
    const cy = size / 2;
    const rp = this.revealProgress;
    const isLooping = this.revealed && rp >= 1;

    ctx.clearRect(0, 0, size, size);

    // ── Subtle radial glow behind center ──
    if (rp > 0.1) {
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
      glow.addColorStop(0, `rgba(255,55,0,${0.06 * rp})`);
      glow.addColorStop(0.3, `rgba(255,55,0,${0.02 * rp})`);
      glow.addColorStop(1, 'rgba(255,55,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);
    }

    // ── Orbit rings ──
    this.orbitRings.forEach((ring, i) => {
      const ringP = Math.max(0, Math.min(1, (rp * (this.orbitRings.length + 2) - i) / 2));
      if (ringP <= 0) return;

      const body = this.bodies[ring.bodyIdx];

      let parentX = cx, parentY = cy;
      if (body.parent !== undefined) {
        const pp = this.getBodyPos(this.bodies[body.parent], t);
        parentX = pp.x;
        parentY = pp.y;
      }

      const orbitR = body.orbit * size;
      const breathAmp = isLooping ? 0.01 : 0;
      const breathScale = 1 + Math.sin(t * 0.0004 + i * 1.8) * breathAmp;
      const r = orbitR * breathScale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(parentX, parentY, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringP);
      ctx.strokeStyle = `rgba(254,218,179,${ring.opacity * ringP})`;
      ctx.lineWidth = ring.lw;
      ctx.setLineDash(ring.dash);
      ctx.lineDashOffset = isLooping ? -(t * 0.008 * (i % 2 === 0 ? 1 : -1)) : 0;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // ── Floating particles on orbit paths ──
    if (isLooping) {
      this.particles.forEach(p => {
        const ring = this.orbitRings[p.ringIdx];
        const body = this.bodies[ring.bodyIdx];

        let parentX = cx, parentY = cy;
        if (body.parent !== undefined) {
          const pp = this.getBodyPos(this.bodies[body.parent], t);
          parentX = pp.x;
          parentY = pp.y;
        }

        const orbitR = body.orbit * size;
        const angle = p.angle + t * p.speed;
        const px = parentX + Math.cos(angle) * orbitR;
        const py = parentY + Math.sin(angle) * orbitR;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254,218,179,${p.alpha})`;
        ctx.fill();
      });
    }

    // ── Connection lines — faint radials ──
    if (rp > 0.4) {
      const lineAlpha = Math.min(1, (rp - 0.4) * 1.5) * 0.06;
      for (let i = 1; i < this.bodies.length; i++) {
        const body = this.bodies[i];
        const pos = this.getBodyPos(body, t);

        let parentX = cx, parentY = cy;
        if (body.parent !== undefined) {
          const pp = this.getBodyPos(this.bodies[body.parent], t);
          parentX = pp.x;
          parentY = pp.y;
        }

        ctx.beginPath();
        ctx.moveTo(parentX, parentY);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = `rgba(254,218,179,${lineAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // ── Draw bodies ──
    this.bodies.forEach((body, i) => {
      const bodyP = Math.max(0, Math.min(1, rp * 3 - i * 0.4));
      if (bodyP <= 0) return;

      const pos = this.getBodyPos(body, t);
      const s = body.size * bodyP;

      if (i === 0) {
        // ── Star — bold orange core with glow ──
        const starGlow = ctx.createRadialGradient(pos.x, pos.y, s * 0.2, pos.x, pos.y, s * 2.5);
        starGlow.addColorStop(0, `rgba(255,55,0,${0.35 * bodyP})`);
        starGlow.addColorStop(0.5, `rgba(255,55,0,${0.08 * bodyP})`);
        starGlow.addColorStop(1, 'rgba(255,55,0,0)');
        ctx.fillStyle = starGlow;
        ctx.fillRect(pos.x - s * 3, pos.y - s * 3, s * 6, s * 6);

        // Solid core
        const coreGrad = ctx.createRadialGradient(
          pos.x - s * 0.15, pos.y - s * 0.15, 0,
          pos.x, pos.y, s
        );
        coreGrad.addColorStop(0, `rgba(255,80,20,${0.95 * bodyP})`);
        coreGrad.addColorStop(1, `rgba(255,55,0,${0.98 * bodyP})`);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, s, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // Subtle rim highlight
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, s, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,120,60,${0.4 * bodyP})`;
        ctx.lineWidth = 1;
        ctx.stroke();

      } else {
        // ── Planet / Moon / Zome — outlined with inner glow ──
        // Inner fill — warm tint
        this.drawShape(ctx, pos.x, pos.y, body.shape, s);
        ctx.fillStyle = `rgba(255,55,0,${0.12 * bodyP})`;
        ctx.fill();

        // Outer stroke — peach
        this.drawShape(ctx, pos.x, pos.y, body.shape, s);
        ctx.strokeStyle = `rgba(254,218,179,${0.65 * bodyP})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Subtle glow for larger bodies
        if (body.size > 5) {
          const bodyGlow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, s * 2);
          bodyGlow.addColorStop(0, `rgba(254,218,179,${0.08 * bodyP})`);
          bodyGlow.addColorStop(1, 'rgba(254,218,179,0)');
          ctx.fillStyle = bodyGlow;
          ctx.fillRect(pos.x - s * 2, pos.y - s * 2, s * 4, s * 4);
        }
      }

      // ── Label — white on dark bg ──
      if (bodyP > 0.5) {
        const labelA = Math.min(1, (bodyP - 0.5) * 2);
        const fontSize = Math.max(10, size * 0.022);
        ctx.fillStyle = `rgba(255,255,255,${0.85 * labelA})`;
        ctx.font = `500 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(body.label, pos.x, pos.y + s + 10);
      }

      // ── Tier numeral ──
      if (bodyP > 0.7) {
        const tierA = Math.min(1, (bodyP - 0.7) * 3.3);
        const tierSize = Math.max(8, size * 0.017);
        ctx.fillStyle = `rgba(255,55,0,${0.7 * tierA})`;
        ctx.font = `600 ${tierSize}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(body.tier, pos.x + s + 8, pos.y - s + 2);
      }
    });
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
  const canvas = document.getElementById('orbitCanvas');
  if (!canvas) return;

  const orbit = new OrbitAnimation(canvas);

  if (prefersReducedMotion) {
    orbit.revealProgress = 1;
    orbit.revealed = true;
    orbit.draw(0);
  } else {
    observeCanvas(canvas, () => { if (orbit.revealed) orbit.start(); }, () => orbit.stop());
  }
});
