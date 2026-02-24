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

// ── Nav: collapses to hamburger when scrolled past hero ──
function initNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const hamburger = nav.querySelector('.nav-hamburger');
  const heroSection = document.querySelector('.hero');
  const threshold = heroSection ? heroSection.offsetHeight * 0.5 : 300;

  // Toggle collapsed state based on scroll position
  function updateNav() {
    const y = window.scrollY;
    if (y > threshold) {
      nav.classList.add('nav-collapsed');
    } else {
      nav.classList.remove('nav-collapsed');
      nav.classList.remove('nav-open'); // close menu when scrolling back up
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav(); // initial check

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('nav-open');
    });
  }

  // Close menu when clicking a link
  nav.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav-open');
    });
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
      nav.classList.remove('nav-open');
    }
  });
}

// ── Build section: idea submission ──
function initBuildChat() {
  const input = document.getElementById('buildInput');
  const submit = document.getElementById('buildSubmit');
  const confirm = document.getElementById('buildConfirm');
  const chips = document.querySelectorAll('.build-chip');

  if (!input || !submit) return;

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  // Submit handler
  function submitIdea() {
    const text = input.value.trim();
    if (!text) return;

    // Store in localStorage (swap for API call later)
    const ideas = JSON.parse(localStorage.getItem('oasis-ideas') || '[]');
    ideas.push({ text, timestamp: new Date().toISOString() });
    localStorage.setItem('oasis-ideas', JSON.stringify(ideas));

    // Show confirmation
    input.value = '';
    input.style.height = 'auto';
    confirm.hidden = false;

    // Hide after a few seconds
    setTimeout(() => { confirm.hidden = true; }, 4000);
  }

  submit.addEventListener('click', submitIdea);

  // Submit on Enter (Shift+Enter for newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitIdea();
    }
  });

  // Chips fill the input
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent;
      input.focus();
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  });
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initNav();
  initBuildChat();
});

export { observeCanvas, prefersReducedMotion };
