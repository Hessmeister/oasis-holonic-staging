/* ═══════════════════════════════════════
   mesh.js — Arrival-inspired logogram
   Dense black ink ring on pale mist,
   living, breathing, smoky
   Cursor acts as gentle wind gusts
   ═══════════════════════════════════════ */

import { observeCanvas, prefersReducedMotion } from './main.js';

class MeshAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.time = 0;
    this.startTime = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.buffer = document.createElement('canvas');
    this.bCtx = this.buffer.getContext('2d');

    // Mouse tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.smoothX = 0;
    this.smoothY = 0;
    this.mouseVelX = 0;
    this.mouseVelY = 0;
    this.mouseInCanvas = false;

    // Ink ring strokes — many overlapping for density
    this.strokes = [];
    for (let i = 0; i < 12; i++) {
      this.strokes.push(this.createStroke(i));
    }

    // Ink marks — organic splotches branching off the ring
    this.marks = [];
    const markCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < markCount; i++) {
      this.marks.push(this.createMark(i, markCount));
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.mouseInCanvas = true;
    });
    canvas.addEventListener('mouseleave', () => {
      this.mouseInCanvas = false;
    });
  }

  createStroke(index) {
    const group = index < 5 ? 'core' : index < 9 ? 'mid' : 'outer';
    const baseRadius = group === 'core'
      ? 0.175 + Math.random() * 0.015
      : group === 'mid'
        ? 0.185 + Math.random() * 0.02
        : 0.20 + Math.random() * 0.025;

    const harmonics = [];
    const n = 3 + Math.floor(Math.random() * 5);
    for (let h = 0; h < n; h++) {
      harmonics.push({
        freq: 1 + Math.floor(Math.random() * 8),
        amp: group === 'core'
          ? 0.005 + Math.random() * 0.02
          : 0.01 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.0003,
      });
    }

    const thicknessHarmonics = [];
    for (let h = 0; h < 3; h++) {
      thicknessHarmonics.push({
        freq: 1 + Math.floor(Math.random() * 5),
        amp: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.0004,
      });
    }

    return {
      group,
      baseRadius,
      harmonics,
      thicknessHarmonics,
      baseThickness: group === 'core'
        ? 6 + Math.random() * 8
        : group === 'mid'
          ? 3 + Math.random() * 5
          : 1 + Math.random() * 2.5,
      opacity: group === 'core'
        ? 0.5 + Math.random() * 0.35
        : group === 'mid'
          ? 0.2 + Math.random() * 0.25
          : 0.06 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.0005,
      // Wind response — how much this stroke reacts to cursor gusts
      // Outer strokes are lighter, blow more easily
      windWeight: group === 'core' ? 0.3 + Math.random() * 0.3
        : group === 'mid' ? 0.6 + Math.random() * 0.4
        : 0.8 + Math.random() * 0.5,
      // Per-stroke displacement from wind (smoothed)
      windOffsetX: 0,
      windOffsetY: 0,
      windRotOffset: 0,
      bloom: 0,
      bloomTarget: 0.8 + Math.random() * 0.2,
      bloomSpeed: 0.0005 + Math.random() * 0.0005,
      bleed: 0,
      bleedRate: 0.0000012 + Math.random() * 0.0000015,
    };
  }

  createMark(index, total) {
    const angle = (index / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const outward = Math.random() > 0.2;

    const arcSpan = 0.15 + Math.random() * 0.5;
    const radiusOffset = outward
      ? 0.01 + Math.random() * 0.06
      : -(0.01 + Math.random() * 0.04);

    const harmonics = [];
    for (let h = 0; h < 2 + Math.floor(Math.random() * 3); h++) {
      harmonics.push({
        freq: 1 + Math.floor(Math.random() * 6),
        amp: 0.01 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.0004,
      });
    }

    const thicknessHarmonics = [];
    for (let h = 0; h < 2; h++) {
      thicknessHarmonics.push({
        freq: 1 + Math.floor(Math.random() * 4),
        amp: 0.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.0005,
      });
    }

    const type = Math.random();
    let taperIn, taperOut;
    if (type < 0.4) {
      taperIn = 0; taperOut = 1;
    } else if (type < 0.7) {
      taperIn = 1; taperOut = 1;
    } else {
      taperIn = 0.3; taperOut = 0.3;
    }

    return {
      angle,
      arcSpan,
      radiusBase: 0.19 + radiusOffset,
      harmonics,
      thicknessHarmonics,
      baseThickness: 2 + Math.random() * 6,
      opacity: 0.2 + Math.random() * 0.4,
      taperIn,
      taperOut,
      rotSpeed: (Math.random() - 0.5) * 0.000012,
      breathPhase: Math.random() * Math.PI * 2,
      breathSpeed: 0.00015 + Math.random() * 0.00025,
      breathAmp: 0.15 + Math.random() * 0.25,
      windWeight: 0.7 + Math.random() * 0.6,
      windOffsetX: 0,
      windOffsetY: 0,
      bloom: 0,
      bloomTarget: 0.8 + Math.random() * 0.2,
      bloomDelay: 2500 + Math.random() * 3500,
      bloomSpeed: 0.0004 + Math.random() * 0.0004,
    };
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.buffer.width = this.w * this.dpr;
    this.buffer.height = this.h * this.dpr;
    this.bCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  drawStrokePath(bCtx, points, thickness, alpha, color) {
    if (alpha < 0.005) return;
    bCtx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const a = p.angle;
      const nx = -Math.sin(a), ny = Math.cos(a);
      const ox = p.x + nx * p.thick * thickness * 0.5;
      const oy = p.y + ny * p.thick * thickness * 0.5;
      if (i === 0) bCtx.moveTo(ox, oy); else bCtx.lineTo(ox, oy);
    }
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      const a = p.angle;
      const nx = -Math.sin(a), ny = Math.cos(a);
      bCtx.lineTo(p.x - nx * p.thick * thickness * 0.5, p.y - ny * p.thick * thickness * 0.5);
    }
    bCtx.closePath();
    bCtx.fillStyle = `rgba(${color},${alpha})`;
    bCtx.fill();
  }

  drawMark(bCtx, mark, t, cx, cy, scale) {
    if (mark.bloom < 0.01) return;

    const breath = Math.sin(t * mark.breathSpeed + mark.breathPhase) * 0.5 + 0.5;
    const breathScale = 1 - mark.breathAmp + breath * mark.breathAmp;

    const r0 = mark.radiusBase * scale;
    const startAngle = mark.angle - mark.arcSpan * 0.5;
    const segments = Math.max(20, Math.floor(mark.arcSpan * 60));

    // Wind displacement for this mark
    const wdx = mark.windOffsetX;
    const wdy = mark.windOffsetY;

    const points = [];
    for (let i = 0; i <= segments; i++) {
      const frac = i / segments;
      const angle = startAngle + frac * mark.arcSpan;

      let deform = 0;
      mark.harmonics.forEach(harm => {
        deform += Math.sin(angle * harm.freq + harm.phase + t * harm.drift) * harm.amp;
      });

      const r = r0 * (1 + deform);

      let thickMod = 0.5;
      mark.thicknessHarmonics.forEach(th => {
        thickMod += Math.sin(angle * th.freq + th.phase + t * th.drift) * th.amp * 0.3;
      });

      let taper = 1;
      if (mark.taperIn > 0 && frac < 0.3) {
        taper *= Math.pow(frac / 0.3, mark.taperIn);
      }
      if (mark.taperOut > 0 && frac > 0.7) {
        taper *= Math.pow((1 - frac) / 0.3, mark.taperOut);
      }

      points.push({
        x: cx + Math.cos(angle) * r + wdx,
        y: cy + Math.sin(angle) * r + wdy,
        thick: Math.max(0.1, mark.baseThickness * thickMod * taper * mark.bloom * breathScale),
        angle,
      });
    }

    const alpha = mark.opacity * mark.bloom * breathScale;

    this.drawStrokePath(bCtx, points, 2.8, alpha * 0.12, '0,51,70');
    this.drawStrokePath(bCtx, points, 1.4, alpha * 0.4, '0,51,70');
    this.drawStrokePath(bCtx, points, 1.0, alpha, '0,51,70');
  }

  draw(t) {
    const { ctx, bCtx, w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h);
    const dt = this.time ? Math.min(t - this.time, 50) : 16;
    const elapsed = t - this.startTime;

    // ── Smooth mouse & compute velocity ──
    this.smoothX += (this.mouseX - this.smoothX) * 0.08;
    this.smoothY += (this.mouseY - this.smoothY) * 0.08;
    const mx = this.smoothX;
    const my = this.smoothY;

    // Mouse velocity — any movement creates wind, speed determines intensity
    this.mouseVelX = (mx - this.prevMouseX);
    this.mouseVelY = (my - this.prevMouseY);
    this.prevMouseX = mx;
    this.prevMouseY = my;

    const velMag = Math.hypot(this.mouseVelX, this.mouseVelY);
    const mouseDist = Math.hypot(mx - cx, my - cy);
    const ringR = 0.19 * scale;

    // ── Compute wind force ──
    // Any cursor movement near the ring creates wind. Speed = intensity.
    const proximityFalloff = Math.max(0, 1 - mouseDist / (ringR * 3));
    const gustStrength = this.mouseInCanvas ? velMag * proximityFalloff : 0;

    // Wind direction — even tiny movements have a direction
    const windDirX = velMag > 0.1 ? this.mouseVelX / velMag : 0;
    const windDirY = velMag > 0.1 ? this.mouseVelY / velMag : 0;

    // ── PALE BACKGROUND ──
    ctx.fillStyle = '#FFFEDF';
    ctx.fillRect(0, 0, w, h);

    // Light fog — strict palette colors only
    const fogs = [
      [0.30, 0.35, 0.45, 0.00010, 0.0, 254, 218, 179],
      [0.70, 0.30, 0.40, 0.00014, 2.1, 254, 218, 179],
      [0.50, 0.68, 0.42, 0.00012, 4.0, 204, 217, 216],
      [0.25, 0.60, 0.35, 0.00016, 1.5, 204, 217, 216],
    ];
    fogs.forEach(([fx, fy, fr, fs, fp, r, g, b]) => {
      const ox = Math.sin(t * fs + fp) * w * 0.03;
      const oy = Math.cos(t * fs * 0.7 + fp) * h * 0.02;
      const grad = ctx.createRadialGradient(fx * w + ox, fy * h + oy, 0, fx * w + ox, fy * h + oy, fr * scale);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    // ── INK ON BUFFER ──
    bCtx.clearRect(0, 0, w, h);

    // Ring strokes
    this.strokes.forEach((stroke, si) => {
      const bloomDelay = si * 400;
      if (elapsed > bloomDelay) {
        stroke.bloom = Math.min(stroke.bloom + dt * stroke.bloomSpeed, stroke.bloomTarget);
      }
      stroke.bleed += dt * stroke.bleedRate;

      // Wind accumulates — each gust adds displacement that decays very slowly
      // Like real smoke: once pushed, it drifts and only gradually settles
      const windForceX = windDirX * gustStrength * stroke.windWeight * 0.8;
      const windForceY = windDirY * gustStrength * stroke.windWeight * 0.8;
      stroke.windOffsetX += windForceX * 0.05;
      stroke.windOffsetY += windForceY * 0.05;
      // Very slow decay — smoke lingers
      stroke.windOffsetX *= 0.997;
      stroke.windOffsetY *= 0.997;
      // Soft cap so it doesn't fly off screen
      const maxDrift = ringR * 0.5;
      const driftMag = Math.hypot(stroke.windOffsetX, stroke.windOffsetY);
      if (driftMag > maxDrift) {
        stroke.windOffsetX *= maxDrift / driftMag;
        stroke.windOffsetY *= maxDrift / driftMag;
      }

      // Rotational wind — accumulates too
      const windTorque = (windDirX * 0.5 - windDirY * 0.5) * gustStrength * stroke.windWeight * 0.00008;
      stroke.windRotOffset += windTorque;
      stroke.windRotOffset *= 0.998; // slow decay

      stroke.rotation += (stroke.rotationSpeed + stroke.windRotOffset) * dt;

      if (stroke.bloom < 0.01) return;

      const r0 = (stroke.baseRadius + stroke.bleed) * scale;
      const segments = 180;

      // Per-point wind displacement: points closer to cursor get pushed more
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const frac = i / segments;
        const angle = frac * Math.PI * 2 + stroke.rotation;

        let deform = 0;
        stroke.harmonics.forEach(harm => {
          deform += Math.sin(angle * harm.freq + harm.phase + t * harm.drift) * harm.amp;
        });

        const breath = Math.sin(t * 0.0003 + si * 0.6) * 0.008;
        const r = r0 * (1 + deform + breath);

        // Point position before wind
        let px = cx + Math.cos(angle) * r;
        let py = cy + Math.sin(angle) * r;

        // Local wind push — points near cursor get displaced
        if (this.mouseInCanvas && gustStrength > 0.05) {
          const distToMouse = Math.hypot(px - mx, py - my);
          const localInfluence = Math.max(0, 1 - distToMouse / (ringR * 1.5));
          if (localInfluence > 0) {
            const localPush = localInfluence * localInfluence * gustStrength * stroke.windWeight * 1.2;
            px += windDirX * localPush;
            py += windDirY * localPush;
          }
        }

        // Global stroke displacement
        px += stroke.windOffsetX;
        py += stroke.windOffsetY;

        let thickMod = 0.5;
        stroke.thicknessHarmonics.forEach(th => {
          thickMod += Math.sin(angle * th.freq + th.phase + t * th.drift) * th.amp * 0.3;
        });

        points.push({
          x: px,
          y: py,
          thick: Math.max(0.3, stroke.baseThickness * thickMod * stroke.bloom),
          angle: angle + stroke.rotation,
        });
      }

      const alpha = stroke.opacity * stroke.bloom;

      this.drawStrokePath(bCtx, points, 2.8, alpha * 0.15, '0,51,70');
      this.drawStrokePath(bCtx, points, 1.4, alpha * 0.5, '0,51,70');
      this.drawStrokePath(bCtx, points, 1.0, alpha, '0,51,70');
    });

    // ── INK MARKS — logogram features ──
    this.marks.forEach(mark => {
      if (elapsed > mark.bloomDelay) {
        mark.bloom = Math.min(mark.bloom + dt * mark.bloomSpeed, mark.bloomTarget);
      }
      mark.angle += mark.rotSpeed * dt;

      // Wind on marks — accumulates, lingers
      mark.windOffsetX += windDirX * gustStrength * mark.windWeight * 0.06;
      mark.windOffsetY += windDirY * gustStrength * mark.windWeight * 0.06;
      mark.windOffsetX *= 0.996;
      mark.windOffsetY *= 0.996;
      // Soft cap
      const markDrift = Math.hypot(mark.windOffsetX, mark.windOffsetY);
      const markMax = ringR * 0.4;
      if (markDrift > markMax) {
        mark.windOffsetX *= markMax / markDrift;
        mark.windOffsetY *= markMax / markDrift;
      }

      this.drawMark(bCtx, mark, t, cx, cy, scale);
    });

    // ── COMPOSITE ──
    ctx.save();
    ctx.filter = `blur(${Math.max(4, scale * 0.008)}px)`;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(this.buffer, 0, 0, w * this.dpr, h * this.dpr, 0, 0, w, h);
    ctx.restore();

    ctx.drawImage(this.buffer, 0, 0, w * this.dpr, h * this.dpr, 0, 0, w, h);

    // ── VIGNETTE ──
    const vig = ctx.createRadialGradient(cx, cy, scale * 0.15, cx, cy, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,51,70,0.18)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // ── GRAIN ──
    ctx.save();
    ctx.globalAlpha = 0.018;
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
    }
    ctx.restore();

    this.time = t;
  }

  loop = (timestamp) => {
    if (!this.running) return;
    this.draw(timestamp);
    requestAnimationFrame(this.loop);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this.time = this.startTime;
    requestAnimationFrame(this.loop);
  }

  stop() { this.running = false; }
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('meshCanvas');
  if (!canvas) return;

  const mesh = new MeshAnimation(canvas);

  if (prefersReducedMotion) {
    mesh.startTime = 0;
    mesh.time = 0;
    mesh.strokes.forEach(s => { s.bloom = s.bloomTarget; });
    mesh.marks.forEach(m => { m.bloom = m.bloomTarget; });
    mesh.draw(3000);
  } else {
    observeCanvas(canvas, () => mesh.start(), () => mesh.stop());
    mesh.start();
  }
});
