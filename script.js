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

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis && !REDUCED) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    // When GSAP is present, gsap.ticker drives lenis.raf (below) — avoid double-driving here.
    if (!hasGSAP) { (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0); }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) { var t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0 }); } }
      });
    });
  }

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

    /* Reveal-on-scroll with 3D tilt-in (everything except hero + project cards) */
    var revealEls = gsap.utils.toArray('.reveal:not(.project-card)');
    gsap.set(revealEls, { y: 48, rotateX: 8, transformPerspective: 800, transformOrigin: '50% 100%' });
    ScrollTrigger.batch(revealEls, {
      start: 'top 86%',
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.09, ease: 'power3.out', overwrite: true }); }
    });

    /* Project cards: dedicated scale/lift reveal, then clear transform so the
       3D hover-tilt handler starts from a clean slate (no conflict). */
    var cardEls = gsap.utils.toArray('.project-card');
    gsap.set(cardEls, { y: 60, scale: 0.94 });
    ScrollTrigger.batch(cardEls, {
      start: 'top 88%',
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true, clearProps: 'transform' }); }
    });

    /* Section dividers draw out */
    gsap.utils.toArray('.section-divider').forEach(function (d) {
      gsap.to(d, { scaleX: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: d, start: 'top 90%' } });
    });

    /* Language bars */
    ScrollTrigger.create({ trigger: '.languages', start: 'top 82%', once: true, onEnter: fillBars });

    /* ---- Parallax ---- */
    gsap.fromTo('.hero-photo', { yPercent: 0 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.utils.toArray('.section-title').forEach(function (t) {
      gsap.fromTo(t, { y: 30 }, { y: -22, ease: 'none', scrollTrigger: { trigger: t, start: 'top 92%', end: 'top 38%', scrub: 1 } });
    });
    gsap.utils.toArray('.section-index').forEach(function (s) {
      gsap.fromTo(s, { y: 12 }, { y: -24, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'top top', scrub: true } });
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    fillBars();
  }

  /* Hero plays after the loader; without GSAP just run counters */
  function playHero() { if (heroTL) heroTL.play(0); else startCounters(); }

  /* ============================================================
     SMOOTH LOADER — software-engineer "compile" sequence
     ============================================================ */
  var loaderEl = document.getElementById('loader');
  var loaderEnded = false;
  function endLoader() {
    if (loaderEnded) return;
    loaderEnded = true;
    if (loaderEl) loaderEl.classList.add('done');
    document.body.classList.remove('loading');
    if (lenis) lenis.start();
    if (hasGSAP) ScrollTrigger.refresh();
    playHero();
    if (loaderEl) setTimeout(function () { if (loaderEl.parentNode) loaderEl.remove(); }, 800);
  }
  if (loaderEl) {
    if (lenis) lenis.stop();
    var fill = document.getElementById('loaderFill');
    var pctEl = document.getElementById('loaderPct');
    var txtEl = document.getElementById('loaderText');
    if (REDUCED) {
      if (fill) fill.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      setTimeout(endLoader, 250);
    } else {
      var pct = 0;
      var msgs = [[0, 'INITIALIZING'], [28, 'COMPILING MODULES'], [55, 'RENDERING SCENE'], [82, 'OPTIMIZING'], [100, 'READY']];
      var iv = setInterval(function () {
        pct += Math.random() * 13 + 5;
        if (pct >= 100) { pct = 100; clearInterval(iv); }
        if (fill) fill.style.width = pct + '%';
        if (pctEl) pctEl.textContent = Math.floor(pct) + '%';
        if (txtEl) { for (var i = msgs.length - 1; i >= 0; i--) { if (pct >= msgs[i][0]) { txtEl.textContent = msgs[i][1]; break; } } }
        if (pct >= 100) setTimeout(endLoader, 320);
      }, 130);
    }
  } else {
    playHero();
  }
  /* Hard failsafe: never leave the page locked behind the loader */
  setTimeout(endLoader, 4500);

  /* ============================================================
     MAGNETIC buttons / controls
     ============================================================ */
  if (FINE && !REDUCED) {
    document.querySelectorAll('.btn, .theme-toggle, .nav-logo, .contact-links a').forEach(function (el) {
      el.style.willChange = 'transform';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - (r.left + r.width / 2)) * 0.35) + 'px,' + ((e.clientY - (r.top + r.height / 2)) * 0.35) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = 'translate(0,0)'; });
    });
  }

  /* ============================================================
     GENERIC TILT (non-project cards) + glass photo-card tilt
     ============================================================ */
  if (FINE && !REDUCED) {
    document.querySelectorAll('[data-tilt]:not(.project-card)').forEach(function (el) {
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (px * 7) + 'deg) rotateX(' + (-py * 7) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateY(0)'; });
    });

    var card = document.getElementById('photoCard');
    var hero = document.getElementById('hero');
    if (card && hero) {
      var gloss = card.querySelector('.pv-gloss');
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateY(' + (px * 18) + 'deg) rotateX(' + (-py * 18) + 'deg)';
        if (gloss) gloss.style.setProperty('--gloss', (px * 100 + 50) + '%');
      });
      hero.addEventListener('mouseleave', function () { card.style.transform = 'rotateY(0) rotateX(0)'; });
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

  /* ============================================================
     MAGNETIC CURSOR
     ============================================================ */
  if (FINE) {
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (dot && ring) {
      root.classList.add('cursor-enabled');
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2, rx = cx, ry = cy;
      window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; dot.style.left = cx + 'px'; dot.style.top = cy + 'px'; }, { passive: true });
      if (REDUCED) {
        window.addEventListener('mousemove', function (e) { ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; }, { passive: true });
      } else {
        (function loop() { rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
      }
      document.querySelectorAll('a, button').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('cursor-hover'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('cursor-hover'); });
      });

      /* Contextual label (e.g. "View" over project cards) */
      var label = document.getElementById('cursorLabel');
      document.querySelectorAll('[data-cursor]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { if (label) label.textContent = el.getAttribute('data-cursor'); ring.classList.add('cursor-label-on'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('cursor-label-on'); });
      });

      window.addEventListener('mousedown', function () { dot.classList.add('cursor-down'); ring.classList.add('cursor-down'); });
      window.addEventListener('mouseup', function () { dot.classList.remove('cursor-down'); ring.classList.remove('cursor-down'); });
    }
  }
});
