/* ============================================================
   RIFLAN MOHAMED — "Developer Universe" (Three.js r128)
   Quantum Computing Core · thousands of orbiting particles ·
   floating tech icons · energy trails · mouse-orbit camera ·
   volumetric glow · scroll-triggered transformations.
   Theme-aware · all devices (adaptive quality).
   Hooks: window.__setSceneTheme(isDark), window.__setSceneScroll(p)
   ============================================================ */
(function () {
  'use strict';

  window.__setSceneTheme = window.__setSceneTheme || function () {};
  window.__setSceneScroll = window.__setSceneScroll || function () {};

  function shouldInit() {
    return typeof window.THREE !== 'undefined' && !!document.getElementById('bg-canvas');
  }

  window.addEventListener('load', function () { if (shouldInit()) init(); });

  function init() {
    var THREE = window.THREE;
    var canvas = document.getElementById('bg-canvas');
    var W = window.innerWidth, H = window.innerHeight;

    /* ---- adaptive quality ---- */
    var tier = W < 600 ? 'low' : (W < 1024 ? 'mid' : 'high');
    var CFG = {
      high: { particles: 2200, dpr: Math.min(window.devicePixelRatio, 2) },
      mid:  { particles: 1300, dpr: Math.min(window.devicePixelRatio, 1.75) },
      low:  { particles: 700,  dpr: Math.min(window.devicePixelRatio, 1.5) }
    }[tier];

    /* ---- theme palette ---- */
    var THEME = {
      dark:  { particle: 0xf3ecd6, core: 0xd4af37, ring: 0xffffff, trail: 0xd4af37, glow: 0xd4af37, fog: 0x0a0a0a, particleOpacity: 0.62, blend: THREE.AdditiveBlending },
      light: { particle: 0x33312b, core: 0xc9a227, ring: 0x111111, trail: 0xc9a227, glow: 0xc9a227, fog: 0xffffff, particleOpacity: 0.5, blend: THREE.NormalBlending }
    };
    var themeName = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    var P = THEME[themeName];

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(CFG.dpr);
    renderer.setSize(W, H);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(P.fog, 0.028);

    var camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var keyLight = new THREE.PointLight(0xffffff, 1.1, 60); keyLight.position.set(6, 5, 8); scene.add(keyLight);
    var coreLight = new THREE.PointLight(P.core, 1.4, 30); scene.add(coreLight);

    /* universe group — scroll transforms the whole thing */
    var universe = new THREE.Group();
    scene.add(universe);

    /* ============================================================
       AI NEURAL NETWORK SPHERE (central model)
       nodes distributed on a sphere + neural connection lines + core glow
       ============================================================ */
    var core = new THREE.Group();
    universe.add(core);
    var isDarkTheme = themeName === 'dark';

    var NEURAL_N = tier === 'low' ? 40 : (tier === 'mid' ? 72 : 110);
    var NEURAL_R = 1.75;
    var npos = new Float32Array(NEURAL_N * 3);
    var nodePts = [];
    var GOLDEN = Math.PI * (3 - Math.sqrt(5));
    for (var k = 0; k < NEURAL_N; k++) {
      var yk = 1 - (k / (NEURAL_N - 1)) * 2;          // -1..1
      var rad = Math.sqrt(Math.max(0, 1 - yk * yk));
      var th = k * GOLDEN;
      var vx = Math.cos(th) * rad, vy = yk, vz = Math.sin(th) * rad;
      npos[k * 3] = vx * NEURAL_R; npos[k * 3 + 1] = vy * NEURAL_R; npos[k * 3 + 2] = vz * NEURAL_R;
      nodePts.push(new THREE.Vector3(vx * NEURAL_R, vy * NEURAL_R, vz * NEURAL_R));
    }
    var neuralGeo = new THREE.BufferGeometry();
    neuralGeo.setAttribute('position', new THREE.BufferAttribute(npos, 3));
    var neuralPointsMat = new THREE.PointsMaterial({ color: P.glow, size: 0.09, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
    var neuralPoints = new THREE.Points(neuralGeo, neuralPointsMat);
    core.add(neuralPoints);

    // neural connections — link nearby nodes
    var segPos = [];
    var LINK = NEURAL_R * 0.62;
    for (var a = 0; a < NEURAL_N; a++) {
      for (var b = a + 1; b < NEURAL_N; b++) {
        if (nodePts[a].distanceTo(nodePts[b]) < LINK) {
          segPos.push(nodePts[a].x, nodePts[a].y, nodePts[a].z, nodePts[b].x, nodePts[b].y, nodePts[b].z);
        }
      }
    }
    var linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segPos), 3));
    var neuralLinesMat = new THREE.LineBasicMaterial({ color: P.core, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false });
    var neuralLines = new THREE.LineSegments(linesGeo, neuralLinesMat);
    core.add(neuralLines);

    // faint sphere shell for structure
    var shellMat = new THREE.MeshBasicMaterial({ color: P.ring, wireframe: true, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false });
    var coreShell = new THREE.Mesh(new THREE.SphereGeometry(NEURAL_R, 20, 20), shellMat);
    core.add(coreShell);

    // central glow nucleus
    var nucleusMat = new THREE.MeshBasicMaterial({ color: P.glow, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    var nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), nucleusMat);
    core.add(nucleus);

    /* ============================================================
       THOUSANDS OF ORBITING PARTICLES (two counter-rotating shells)
       ============================================================ */
    function makeCloud(count, rMin, rMax) {
      var pos = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        var r = rMin + Math.random() * (rMax - rMin);
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;            // flattened disc-ish
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var m = new THREE.PointsMaterial({ color: P.particle, size: 0.035, transparent: true, opacity: P.particleOpacity, depthWrite: false, blending: P.blend });
      return new THREE.Points(g, m);
    }
    var cloudA = makeCloud(Math.round(CFG.particles * 0.6), 3.2, 7.5);
    var cloudB = makeCloud(Math.round(CFG.particles * 0.4), 4.5, 9.5);
    universe.add(cloudA); universe.add(cloudB);

    /* ============================================================
       FLOATING TECH ICONS  (canvas-texture sprites — no external files)
       ============================================================ */
    function iconTexture(label, color) {
      var c = document.createElement('canvas'); c.width = c.height = 256;
      var x = c.getContext('2d');
      var g = x.createRadialGradient(128, 128, 8, 128, 128, 128);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 0.4; x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.globalAlpha = 1;
      x.beginPath(); x.arc(128, 128, 74, 0, Math.PI * 2); x.lineWidth = 5; x.strokeStyle = color; x.stroke();
      x.beginPath(); x.arc(128, 128, 70, 0, Math.PI * 2); x.fillStyle = 'rgba(12,12,12,0.72)'; x.fill();
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '600 ' + (label.length > 7 ? 26 : 32) + 'px "DM Sans", system-ui, sans-serif';
      x.fillText(label, 128, 128);
      var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
    }
    var ALL_ICONS = [
      { l: 'React', c: '#61DAFB' }, { l: 'Flutter', c: '#54C5F8' },
      { l: 'Firebase', c: '#FFCA28' }, { l: 'Node.js', c: '#83CD29' },
      { l: 'OpenAI', c: '#10A37F' }, { l: 'Python', c: '#4B8BBE' },
      { l: 'TypeScript', c: '#3178C6' }, { l: 'Java', c: '#E76F00' },
      { l: 'MySQL', c: '#00758F' }, { l: 'Pinecone', c: '#5B8DEF' },
      { l: 'Tailwind', c: '#38BDF8' }, { l: 'Git', c: '#F05032' }
    ];
    var ICONS = tier === 'low' ? ALL_ICONS.slice(0, 6) : (tier === 'mid' ? ALL_ICONS.slice(0, 9) : ALL_ICONS);
    var icons = [];
    var trails = [];
    var trailMat = new THREE.LineBasicMaterial({ color: P.trail, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
    ICONS.forEach(function (ic, i) {
      var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(ic.l, ic.c), transparent: true, depthWrite: false, opacity: 0.92 }));
      spr.scale.set(0.9, 0.9, 1);
      spr.userData = { r: 3.3 + (i % 3) * 0.85, off: (i / ICONS.length) * Math.PI * 2, sp: 0.14 + (i % 4) * 0.04, yph: i * 0.9, yamp: 0.5 + (i % 3) * 0.4 };
      universe.add(spr); icons.push(spr);

      // energy trail from core (origin) to the icon
      var tg = new THREE.BufferGeometry();
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      var line = new THREE.Line(tg, trailMat.clone());
      universe.add(line); trails.push(line);
    });

    /* ============================================================
       VOLUMETRIC GLOW (radial sprite + two slow light beams)
       ============================================================ */
    function glowTexture(color) {
      var c = document.createElement('canvas'); c.width = c.height = 256;
      var x = c.getContext('2d');
      var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, color); g.addColorStop(0.4, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }
    var glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(201,162,75,0.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
    glowSprite.scale.set(8, 8, 1);
    universe.add(glowSprite);

    var beams = new THREE.Group();
    var beamMat = new THREE.MeshBasicMaterial({ color: P.glow, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (var b = 0; b < 2; b++) {
      var beam = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 22), beamMat.clone());
      beam.rotation.z = b * Math.PI / 2.2;
      beam.userData = { sp: 0.05 + b * 0.03 };
      beams.add(beam);
    }
    universe.add(beams);

    /* ============================================================
       Theme switching — recolor everything
       ============================================================ */
    window.__setSceneTheme = function (isDark) {
      isDarkTheme = isDark;
      var t = isDark ? THEME.dark : THEME.light;
      var blend = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;  // additive glows on black; normal reads on white
      scene.fog.color.set(t.fog);
      neuralPointsMat.color.set(t.glow); neuralPointsMat.blending = blend; neuralPointsMat.needsUpdate = true;
      neuralLinesMat.color.set(t.core); neuralLinesMat.blending = blend; neuralLinesMat.needsUpdate = true;
      shellMat.color.set(t.ring); shellMat.blending = blend; shellMat.opacity = isDark ? 0.05 : 0.12; shellMat.needsUpdate = true;
      nucleusMat.color.set(t.glow); nucleusMat.blending = blend; nucleusMat.opacity = isDark ? 0.4 : 0.8; nucleusMat.needsUpdate = true;
      coreLight.color.set(t.core);
      [cloudA, cloudB].forEach(function (cl) { cl.material.color.set(t.particle); cl.material.opacity = t.particleOpacity; cl.material.blending = t.blend; cl.material.needsUpdate = true; });
      trails.forEach(function (ln) { ln.material.color.set(t.trail); ln.material.blending = blend; ln.material.needsUpdate = true; });
      beams.children.forEach(function (bm) { bm.material.color.set(t.glow); bm.material.blending = blend; bm.material.needsUpdate = true; });
      glowSprite.material.blending = blend; glowSprite.material.opacity = isDark ? 0.4 : 0.2; glowSprite.material.needsUpdate = true;
    };

    /* ---- mouse-controlled camera (orbit) ---- */
    var mx = 0, my = 0, azT = 0, elT = 0, az = 0, el = 0, queued = false, px = 0, py = 0;
    function applyMouse() { queued = false; azT = mx * 0.6; elT = my * 0.45; }
    window.addEventListener('mousemove', function (e) { px = e.clientX; py = e.clientY; mx = px / window.innerWidth - 0.5; my = py / window.innerHeight - 0.5; if (!queued) { queued = true; requestAnimationFrame(applyMouse); } }, { passive: true });
    // touch drag also orbits (mobile)
    window.addEventListener('touchmove', function (e) { if (!e.touches[0]) return; var tt = e.touches[0]; mx = tt.clientX / window.innerWidth - 0.5; my = tt.clientY / window.innerHeight - 0.5; if (!queued) { queued = true; requestAnimationFrame(applyMouse); } }, { passive: true });

    /* ---- scroll transforms ---- */
    var scrollP = 0;
    window.__setSceneScroll = function (p) { scrollP = p || 0; };

    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    var rT; window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(onResize, 150); });

    /* ============================================================
       Animation loop
       ============================================================ */
    var clock = new THREE.Clock();
    var tmp = new THREE.Vector3();
    (function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      var dt = Math.min(clock.getDelta(), 0.05);

      /* AI neural network sphere */
      core.rotation.y += 0.0018 + scrollP * 0.008;
      core.rotation.x = Math.sin(t * 0.15) * 0.16;
      coreShell.rotation.y -= 0.0009;
      nucleus.scale.setScalar(1 + 0.2 * Math.sin(t * 2.6));
      // pulsing "neural activity"
      neuralPointsMat.opacity = 0.7 + 0.3 * Math.abs(Math.sin(t * 1.6));
      neuralLinesMat.opacity = (isDarkTheme ? 0.26 : 0.42) * (0.55 + 0.45 * Math.sin(t * 2.2));
      coreLight.position.set(0, 0, 0);

      /* particle shells (counter-rotating) + scroll expansion */
      var pscale = 1 + scrollP * 0.7;
      cloudA.rotation.y += 0.0009; cloudA.rotation.x = Math.sin(t * 0.1) * 0.1;
      cloudB.rotation.y -= 0.0006; cloudB.rotation.z += 0.0003;
      cloudA.scale.setScalar(pscale); cloudB.scale.setScalar(pscale);
      cloudA.material.opacity = P.particleOpacity * (0.85 + 0.15 * Math.sin(t));

      /* floating icons + energy trails */
      icons.forEach(function (spr, i) {
        var a = t * spr.userData.sp + spr.userData.off;
        var R = spr.userData.r;
        spr.position.set(Math.cos(a) * R, Math.sin(t * 0.5 + spr.userData.yph) * spr.userData.yamp, Math.sin(a) * R);
        var s = 0.95 * (1 - scrollP * 0.5);                 // shrink/fade on scroll
        spr.scale.set(s, s, 1);
        spr.material.opacity = Math.max(0, 0.95 - scrollP * 1.2);
        // update trail endpoints (core -> icon)
        var arr = trails[i].geometry.attributes.position.array;
        arr[0] = 0; arr[1] = 0; arr[2] = 0;
        arr[3] = spr.position.x; arr[4] = spr.position.y; arr[5] = spr.position.z;
        trails[i].geometry.attributes.position.needsUpdate = true;
        trails[i].material.opacity = (0.12 + 0.12 * Math.abs(Math.sin(t * 2 + i))) * (1 - scrollP);
      });

      /* volumetric glow */
      glowSprite.scale.setScalar(8 + Math.sin(t * 1.2) * 0.6);
      glowSprite.material.opacity = 0.4 + 0.12 * Math.sin(t * 1.2);
      beams.rotation.z += 0.0009;
      beams.children.forEach(function (bm, i) { bm.material.opacity = 0.04 + 0.025 * Math.sin(t + i); });

      /* whole-universe scroll transform */
      universe.rotation.y = scrollP * 0.8;
      universe.rotation.x = scrollP * 0.25;

      /* mouse-orbit camera + scroll dolly */
      az += (azT - az) * 0.05; el += (elT - el) * 0.05;
      var radius = 9 + scrollP * 7;
      camera.position.x = Math.sin(az) * radius * Math.cos(el);
      camera.position.z = Math.cos(az) * radius * Math.cos(el);
      camera.position.y = Math.sin(el) * radius - scrollP * 2.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    })();

    // apply initial theme colors
    window.__setSceneTheme(themeName === 'dark');
  }
})();
