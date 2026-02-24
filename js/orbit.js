/* ═══════════════════════════════════════
   orbit.js — Celestial holarchy diagram
   Concentric orbits: Star → Planet → Moon
   Matches the flat, line-based diagram style
   of rings.js and flow.js
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

    // Celestial bodies — flat outlined shapes on orbit paths
    this.bodies = [
      {
        label: 'Star',
        tier: 'I',
        orbit: 0,        // center
        angle: 0,
        speed: 0,
        size: 14,
        shape: 'circle',
      },
      {
        label: 'Planet',
        tier: 'II',
        orbit: 0.28,     // ratio of canvas size
        angle: 0.4,
        speed: 0.0003,
        size: 10,
        shape: 'circle',
      },
      {
        label: 'Moon',
        tier: 'III',
        orbit: 0.14,     // orbits the planet
        angle: 2.2,
        speed: 0.0009,
        size: 6,
        shape: 'circle',
        parent: 1,
      },
      {
        label: 'Zome',
        tier: 'IV',
        orbit: 0.07,
        angle: 4.5,
        speed: 0.002,
        size: 3.5,
        shape: 'diamond',
        parent: 2,
      },
    ];

    // Orbit ring style — dashed, breathing
    this.orbitRings = [
      { bodyIdx: 1, dash: [4, 6], opacity: 0.25 },
      { bodyIdx: 2, dash: [3, 5], opacity: 0.20 },
      { bodyIdx: 3, dash: [2, 3], opacity: 0.15 },
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !this.revealed) {
          this.revealed = true;
          this.animateReveal();
        }
      });
    }, { threshold: 0.25 });
    obs.observe(canvas);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 400);
    this.size = size;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  animateReveal() {
    const dur = 2000;
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
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
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

    // Draw orbit paths — concentric dashed rings
    this.orbitRings.forEach((ring, i) => {
      const ringP = Math.max(0, Math.min(1, (rp * (this.orbitRings.length + 2) - i) / 2));
      if (ringP <= 0) return;

      const body = this.bodies[ring.bodyIdx];

      // Get parent position for this orbit
      let parentX = cx, parentY = cy;
      if (body.parent !== undefined) {
        const pp = this.getBodyPos(this.bodies[body.parent], t);
        parentX = pp.x;
        parentY = pp.y;
      }

      const orbitR = body.orbit * size;

      // Breathing
      const breathAmp = isLooping ? 0.015 : 0;
      const breathScale = 1 + Math.sin(t * 0.0005 + i * 1.5) * breathAmp;
      const r = orbitR * breathScale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(parentX, parentY, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringP);
      ctx.strokeStyle = `rgba(0,51,70,${ring.opacity * ringP * 1.3})`;
      ctx.lineWidth = 1;
      ctx.setLineDash(ring.dash);
      ctx.lineDashOffset = isLooping ? -(t * 0.008 * (i % 2 === 0 ? 1 : -1)) : 0;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Draw bodies
    this.bodies.forEach((body, i) => {
      const bodyP = Math.max(0, Math.min(1, rp * 3 - i * 0.3));
      if (bodyP <= 0) return;

      const pos = this.getBodyPos(body, t);
      const s = body.size * bodyP;

      // Inner fill
      this.drawShape(ctx, pos.x, pos.y, body.shape, s);
      ctx.fillStyle = `rgba(255,55,0,${0.08 * bodyP})`;
      ctx.fill();

      // Outer shape — outlined
      this.drawShape(ctx, pos.x, pos.y, body.shape, s);
      ctx.strokeStyle = `rgba(0,51,70,${0.55 * bodyP})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center dot for Star
      if (i === 0 && bodyP > 0.5) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,51,70,${0.4 * bodyP})`;
        ctx.fill();
      }

      // Label
      if (bodyP > 0.6) {
        const labelA = (bodyP - 0.6) * 2.5;
        ctx.fillStyle = `rgba(0,51,70,${Math.min(labelA, 0.8)})`;
        ctx.font = `400 ${Math.max(9, size * 0.028)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(body.label, pos.x, pos.y + s + 14);
      }

      // Tier numeral — small, offset
      if (bodyP > 0.8) {
        const tierA = (bodyP - 0.8) * 5;
        ctx.fillStyle = `rgba(0,51,70,${Math.min(tierA, 0.5)})`;
        ctx.font = `400 ${Math.max(7, size * 0.02)}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(body.tier, pos.x + s + 6, pos.y - s + 2);
      }
    });

    // Connection lines — faint lines from parent center to child
    if (rp > 0.5) {
      const lineAlpha = Math.min(1, (rp - 0.5) * 2) * 0.08;
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
        ctx.strokeStyle = `rgba(0,51,70,${lineAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
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
