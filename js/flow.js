/* ═══════════════════════════════════════
   flow.js — Data flow between holons
   Particles traveling between nodes
   ═══════════════════════════════════════ */

import { observeCanvas, prefersReducedMotion } from './main.js';

class FlowAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.time = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.particles = [];
    this.revealed = false;
    this.revealProgress = 0;

    // Nodes — positioned as ratios
    this.nodes = [
      { x: 0.12, y: 0.50, label: 'Holochain', shape: 'hex' },
      { x: 0.35, y: 0.28, label: 'Ethereum',  shape: 'circle' },
      { x: 0.50, y: 0.65, label: 'OASIS API', shape: 'square' },
      { x: 0.65, y: 0.35, label: 'MongoDB',   shape: 'circle' },
      { x: 0.88, y: 0.50, label: 'IPFS',      shape: 'hex' },
    ];

    // Connections between nodes (index pairs)
    this.edges = [
      [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [2, 4]
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Reveal observer
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
    this.w = rect.width;
    this.h = Math.min(rect.width * 0.4, 280);
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  animateReveal() {
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      this.revealProgress = Math.min((now - start) / dur, 1);
      this.revealProgress = 1 - Math.pow(1 - this.revealProgress, 3);
      if (this.revealProgress < 1) requestAnimationFrame(step);
      else this.start();
    };
    requestAnimationFrame(step);
    this.start();
  }

  spawnParticle() {
    const edge = this.edges[Math.floor(Math.random() * this.edges.length)];
    const reverse = Math.random() > 0.5;
    this.particles.push({
      from: reverse ? edge[1] : edge[0],
      to: reverse ? edge[0] : edge[1],
      t: 0,
      speed: 0.003 + Math.random() * 0.004,
      size: 1.5 + Math.random() * 1.5,
    });
  }

  nodePos(i) {
    const n = this.nodes[i];
    return { x: n.x * this.w, y: n.y * this.h };
  }

  drawShape(ctx, x, y, shape, size) {
    ctx.beginPath();
    if (shape === 'hex') {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (shape === 'square') {
      ctx.rect(x - size * 0.8, y - size * 0.8, size * 1.6, size * 1.6);
    } else {
      ctx.arc(x, y, size, 0, Math.PI * 2);
    }
  }

  draw(t) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const rp = this.revealProgress;

    // Draw edges
    this.edges.forEach(([a, b], i) => {
      const edgeP = Math.max(0, Math.min(1, (rp * (this.edges.length + 2) - i) / 2));
      if (edgeP <= 0) return;

      const pa = this.nodePos(a);
      const pb = this.nodePos(b);
      const mx = pa.x + (pb.x - pa.x) * edgeP;
      const my = pa.y + (pb.y - pa.y) * edgeP;

      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * edgeP})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw nodes
    this.nodes.forEach((node, i) => {
      const nodeP = Math.max(0, Math.min(1, rp * 3 - i * 0.15));
      if (nodeP <= 0) return;

      const { x, y } = this.nodePos(i);
      const size = 8;

      // Shape
      this.drawShape(ctx, x, y, node.shape, size * nodeP);
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * nodeP})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      if (nodeP > 0.5) {
        const labelA = (nodeP - 0.5) * 2;
        ctx.fillStyle = `rgba(255,255,255,${0.85 * labelA})`;
        ctx.font = '400 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + size + 16);
      }
    });

    // Update & draw particles
    if (rp >= 1) {
      // Spawn occasionally
      if (Math.random() < 0.04) this.spawnParticle();

      this.particles = this.particles.filter(p => p.t <= 1);

      this.particles.forEach(p => {
        p.t += p.speed;
        const from = this.nodePos(p.from);
        const to = this.nodePos(p.to);

        // Ease in-out
        const ease = p.t < 0.5
          ? 2 * p.t * p.t
          : 1 - Math.pow(-2 * p.t + 2, 2) / 2;

        const px = from.x + (to.x - from.x) * ease;
        const py = from.y + (to.y - from.y) * ease;

        // Fade in/out at ends
        const alpha = Math.min(p.t * 5, 1, (1 - p.t) * 5);

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.8 * alpha})`;
        ctx.fill();
      });
    }
  }

  loop = (timestamp) => {
    if (!this.running) return;
    this.time = timestamp;
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
  const canvas = document.getElementById('flowCanvas');
  if (!canvas) return;

  const flow = new FlowAnimation(canvas);

  if (prefersReducedMotion) {
    flow.revealProgress = 1;
    flow.draw(0);
  } else {
    observeCanvas(canvas, () => { if (flow.revealed) flow.start(); }, () => flow.stop());
  }
});
