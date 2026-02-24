/* ═══════════════════════════════════════
   main.js — Scroll reveals & init
   ═══════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Scroll reveal observer ──
function initReveals() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('is-visible');
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .stagger').forEach(el => obs.observe(el));
}

// ── Visibility observer for canvases (pause when off-screen) ──
function observeCanvas(canvas, onVisible, onHidden) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) onVisible();
      else onHidden();
    });
  }, { threshold: 0.05 });
  obs.observe(canvas);
}

// ── Smooth nav hide/show on scroll ──
function initNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 100 && y > lastY) {
      nav.style.transform = 'translateY(-100%)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastY = y;
  }, { passive: true });

  nav.style.transition = 'transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.4s';
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initNav();
});

export { observeCanvas, prefersReducedMotion };
