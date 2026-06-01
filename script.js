/* ============================================================
   RIFLAN MOHAMED — Portfolio interactions
   GSAP + ScrollTrigger + Lenis · theme (syncs Three.js) · magnetic UI
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var root = document.documentElement;
  // NOTE: the owner explicitly wants the motion/3D, so we do NOT fully disable
  // on prefers-reduced-motion — we only calm infinite loops (marquee/glow) via CSS.
  var REDUCED = false;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Theme (persisted, syncs WebGL scene) ---------- */
  var themeToggle = document.getElementById('themeToggle');
  var saved = localStorage.getItem('theme')
    || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.setAttribute('data-theme', saved);
  if (window.__setSceneTheme) window.__setSceneTheme(saved === 'dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      if (window.__setSceneTheme) window.__setSceneTheme(next === 'dark');
    });
  }

  /* ---------- Scrolling: NATIVE on every device (smoothest, lowest overhead).
     Anchor jumps use CSS `scroll-behavior: smooth`. No scroll-hijack library. ---------- */
  var TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var lenis = null;

  /* ---------- Nav glass + progress + scene scroll ---------- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('scrollProgress');
  var scrim = document.getElementById('pageScrim');
  var SCRIM_MAX = 0.93;
  function handleScroll(y) {
    if (nav) nav.classList.toggle('scrolled', y > 60);
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? y / max : 0;
    if (progress) progress.style.width = (p * 100) + '%';
    if (window.__setSceneScroll) window.__setSceneScroll(p);
    // scrim: 0 across the hero, ramps to SCRIM_MAX as the hero scrolls away
    if (scrim) {
      var vh = window.innerHeight || 1;
      var s = Math.max(0, Math.min(1, (y - vh * 0.35) / (vh * 0.6)));
      scrim.style.opacity = (s * SCRIM_MAX).toFixed(3);
    }
  }
  if (lenis) lenis.on('scroll', function (e) { handleScroll(e.scroll); });
  else { var st = false; window.addEventListener('scroll', function () { if (!st) { st = true; requestAnimationFrame(function () { handleScroll(window.scrollY); st = false; }); } }, { passive: true }); }
  handleScroll(window.scrollY || 0);

  /* ---------- Hamburger drawer ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () { navLinks.classList.toggle('open'); navToggle.classList.toggle('open'); });
    navLinks.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { navLinks.classList.remove('open'); navToggle.classList.remove('open'); }); });
  }

  /* ---------- Counters ---------- */
  function countEl(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    if (hasGSAP) {
      var o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.5, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); }, onComplete: function () { el.textContent = target; } });
    } else {
      var start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / 1500, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
      })(start);
    }
  }
  function startCounters() { document.querySelectorAll('.stat-num').forEach(countEl); }

  function fillBars() {
    document.querySelectorAll('.bar i').forEach(function (i) { i.style.width = getComputedStyle(i).getPropertyValue('--w'); });
  }

  /* ============================================================
     GSAP ScrollTrigger — the single animation owner
     ============================================================ */
  var heroTL = null;

  if (hasGSAP) {
    root.classList.add('gsap-on');
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }

    /* Hero entrance timeline (paused — played when the loader finishes) */
    gsap.set('.hero-photo', { opacity: 1 });
    heroTL = gsap.timeline({ defaults: { ease: 'power4.out' }, paused: true });
    heroTL.from('.pv-card', { opacity: 0, scale: 0.9, rotateY: -18, z: -160, transformPerspective: 1000, duration: 1.2 })
      .from('.hero-eyebrow', { yPercent: 120, opacity: 0, duration: .7 }, '-=0.8')
      .from('.hero-name .ln > span', { yPercent: 120, opacity: 0, stagger: 0.12, duration: .9 }, '-=0.5')
      .from('.hero-desc', { y: 24, opacity: 0, duration: .6 }, '-=0.5')
      .from('.hero-cta .btn', { y: 20, opacity: 0, stagger: 0.1, duration: .5 }, '-=0.35')
      .from('.stat', { y: 24, opacity: 0, stagger: 0.1, duration: .5, onStart: startCounters }, '-=0.3');

    /* Content is shown immediately (no scroll-reveal hiding) so everything
       loads instantly and fast scrolling never leaves sections blank. */

    /* Language bars fill when reached (content is already visible regardless) */
    ScrollTrigger.create({ trigger: '.languages', start: 'top 85%', once: true, onEnter: fillBars });

    /* (Scroll-scrub parallax removed — reveals fire once on enter, nothing
       recomputes every scroll tick, so scrolling stays light and smooth.) */

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    fillBars();
  }

  /* Content shows immediately — no loader gate. Play the hero entrance now. */
  function playHero() { if (heroTL) heroTL.play(0); else startCounters(); }
  document.body.classList.remove('loading');
  playHero();

  /* ============================================================
     MAGNETIC buttons / controls
     ============================================================ */
  if (FINE && !REDUCED) {
    document.querySelectorAll('.btn, .theme-toggle, .nav-logo, .contact-links a').forEach(function (el) {
      var raf = 0, pending = null;
      el.addEventListener('mouseenter', function () { el.style.willChange = 'transform'; });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        pending = { x: (e.clientX - (r.left + r.width / 2)) * 0.35, y: (e.clientY - (r.top + r.height / 2)) * 0.35 };
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0; var p = pending; if (!p) return;
          el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
        });
      });
      el.addEventListener('mouseleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; } pending = null;
        el.style.transform = 'translate(0,0)';
        el.style.willChange = 'auto';
      });
    });
  }

  /* ============================================================
     GENERIC TILT (non-project cards) + glass photo-card tilt
     ============================================================ */
  if (FINE && !REDUCED) {
    document.querySelectorAll('[data-tilt]:not(.project-card)').forEach(function (el) {
      el.style.transformStyle = 'preserve-3d';
      var raf = 0, pending = null;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        pending = { px: (e.clientX - r.left) / r.width - 0.5, py: (e.clientY - r.top) / r.height - 0.5 };
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0; var p = pending; if (!p) return;
          el.style.transform = 'perspective(900px) rotateY(' + (p.px * 7) + 'deg) rotateX(' + (-p.py * 7) + 'deg) translateY(-4px)';
        });
      });
      el.addEventListener('mouseleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; } pending = null;
        el.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateY(0)';
      });
    });

    var card = document.getElementById('photoCard');
    var hero = document.getElementById('hero');
    if (card && hero) {
      var gloss = card.querySelector('.pv-gloss');
      var craf = 0, cpending = null;
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        cpending = { px: (e.clientX - r.left) / r.width - 0.5, py: (e.clientY - r.top) / r.height - 0.5 };
        if (!craf) craf = requestAnimationFrame(function () {
          craf = 0; var p = cpending; if (!p) return;
          card.style.transform = 'rotateY(' + (p.px * 18) + 'deg) rotateX(' + (-p.py * 18) + 'deg)';
          if (gloss) gloss.style.setProperty('--gloss', (p.px * 100 + 50) + '%');
        });
      });
      hero.addEventListener('mouseleave', function () {
        if (craf) { cancelAnimationFrame(craf); craf = 0; } cpending = null;
        card.style.transform = 'rotateY(0) rotateX(0)';
      });
    }
  }

  /* ============================================================
     PROJECT CARD 3D TILT (perspective 800px, 14deg, translateZ 12px)
     ============================================================ */
  if (FINE && !REDUCED) {
    document.querySelectorAll('.project-card').forEach(function (card) {
      var raf = 0, pending = null;
      card.addEventListener('mouseenter', function () { card.style.willChange = 'transform'; });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        pending = { x: x, y: y, mx: ((e.clientX - r.left) / r.width) * 100, my: ((e.clientY - r.top) / r.height) * 100 };
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0; var p = pending; if (!p) return;
          card.style.transition = 'none';
          card.style.transform = 'perspective(800px) rotateY(' + (p.x * 14) + 'deg) rotateX(' + (-p.y * 14) + 'deg) translateZ(12px)';
          card.style.setProperty('--mx', p.mx + '%'); card.style.setProperty('--my', p.my + '%');
        });
      });
      card.addEventListener('mouseleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; } pending = null;
        card.style.transition = 'transform .5s ease';
        card.style.transform = 'none';
        var clear = function (ev) { if (ev.propertyName === 'transform') { card.style.willChange = 'auto'; card.removeEventListener('transitionend', clear); } };
        card.addEventListener('transitionend', clear);
      });
    });
  }

  /* Custom cursor removed — using the normal system pointer. */
});
