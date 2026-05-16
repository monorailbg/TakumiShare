(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  // ── Renderer ──────────────────────────────────────────────
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // ── Scene / Camera ────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04040f);
  scene.fog = new THREE.FogExp2(0x060614, 0.0015);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 3000);
  camera.position.set(0, 55, 380);
  camera.lookAt(0, 130, 0);

  // ── Lights ────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x0d1a33, 1.2));

  const moonLight = new THREE.DirectionalLight(0x3a5fa0, 0.7);
  moonLight.position.set(-300, 500, 200);
  scene.add(moonLight);

  const towerGlow = new THREE.PointLight(0xff5522, 3.5, 500);
  towerGlow.position.set(0, 160, -30);
  scene.add(towerGlow);

  const cityWarmth = new THREE.PointLight(0xff8833, 0.9, 700);
  cityWarmth.position.set(0, -10, 100);
  scene.add(cityWarmth);

  // extra fill from right
  scene.add(Object.assign(new THREE.PointLight(0x1144aa, 0.5, 600), { position: new THREE.Vector3(250, 100, -100) }));

  // ── Shared materials ──────────────────────────────────────
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xc0392b, emissive: 0x7a1508, emissiveIntensity: 0.35,
    roughness: 0.55, metalness: 0.45,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0cc, roughness: 0.8, metalness: 0.1,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2840, roughness: 0.05, metalness: 0.9,
    transparent: true, opacity: 0.85,
  });

  // ── Window texture factory ────────────────────────────────
  function windowTex(cols, rows) {
    const sz = 512;
    const cv = document.createElement('canvas');
    cv.width = sz; cv.height = sz;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#04090f';
    ctx.fillRect(0, 0, sz, sz);
    const cw = sz / cols, rh = sz / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.62) {
          const warm = Math.random() > 0.4;
          ctx.fillStyle = warm
            ? `rgba(255,${190 + Math.random() * 50 | 0},${80 + Math.random() * 60 | 0},${0.55 + Math.random() * 0.45})`
            : `rgba(${140 + Math.random() * 80 | 0},${180 + Math.random() * 50 | 0},255,${0.45 + Math.random() * 0.4})`;
          ctx.fillRect(c * cw + cw * 0.12, r * rh + rh * 0.12, cw * 0.76, rh * 0.76);
        }
      }
    }
    return new THREE.CanvasTexture(cv);
  }

  // ── Ground plane ──────────────────────────────────────────
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x060b14, emissive: 0x0b1628, emissiveIntensity: 0.6, roughness: 1,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  scene.add(ground);

  // ── Tokyo Tower ───────────────────────────────────────────
  const tower = new THREE.Group();

  // Tapered helper (4-sided frustum)
  function frustum(rBot, rTop, h, mat, yOff = 0) {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, 4);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = yOff + h / 2;
    m.rotation.y = Math.PI / 4;
    return m;
  }

  // Cross-brace stripe helper
  function stripe(y, r, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.5, r + 0.5, 4, 16), mat);
    m.position.y = y;
    return m;
  }

  // Four angled base legs
  [[28, 28], [-28, 28], [-28, -28], [28, -28]].forEach(([lx, lz]) => {
    const geo = new THREE.CylinderGeometry(1.0, 5, 75, 5);
    const leg = new THREE.Mesh(geo, redMat);
    leg.position.set(lx, 37, lz);
    leg.lookAt(new THREE.Vector3(0, 90, 0));
    leg.rotateX(-Math.PI / 2);
    tower.add(leg);
  });

  // Lower body (0→110)
  tower.add(frustum(22, 9, 110, redMat));

  // White stripes on lower body
  [20, 36, 52, 68, 84].forEach((y, i) =>
    tower.add(stripe(y, 22 - i * 2.6, i % 2 === 0 ? whiteMat : redMat))
  );

  // Deck 1 (110)
  const dk1 = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 26), whiteMat);
  dk1.position.y = 114;
  tower.add(dk1);
  tower.add(stripe(114, 9.5, glassMat));

  // Upper body (119→230)
  tower.add(frustum(8, 3, 111, redMat, 119));

  // White stripe mid-upper
  [145, 165, 185].forEach(y => tower.add(stripe(y, 6 - (y - 145) * 0.04, whiteMat)));

  // Deck 2 (232)
  const dk2 = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), whiteMat);
  dk2.position.y = 234;
  tower.add(dk2);

  // Top mast (238→325)
  tower.add(frustum(1.8, 0.3, 87, redMat, 238));

  // Aviation warning lights
  [240, 285, 325].forEach(y => {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2200 })
    );
    light.position.y = y;
    tower.add(light);
  });

  tower.position.set(0, 0, -40);
  scene.add(tower);

  // ── Skyscrapers ───────────────────────────────────────────
  function rng(a, b) { return Math.random() * (b - a) + a; }
  const skyColors = [0x0c1522, 0x101828, 0x0e1620, 0x131e2c, 0x0a1420];

  function building(x, z, w, d, h) {
    const grp = new THREE.Group();
    const wt = windowTex(Math.max(3, (w / 6) | 0), Math.max(4, (h / 9) | 0));
    const winM = new THREE.MeshStandardMaterial({
      color: skyColors[Math.random() * skyColors.length | 0],
      emissiveMap: wt, emissive: 0xffffff, emissiveIntensity: 0.9,
      roughness: 0.6, metalness: 0.3,
    });
    const sideM = new THREE.MeshStandardMaterial({
      color: skyColors[Math.random() * skyColors.length | 0],
      emissive: 0x060c18, emissiveIntensity: 0.35,
      roughness: 0.85, metalness: 0.2,
    });
    // 6 faces: +x,-x,+y,-y,+z,-z  →  right, left, top, bot, front, back
    const mats = [sideM, sideM, sideM, sideM, winM, winM];
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    body.position.y = h / 2;
    grp.add(body);

    // Rooftop antenna (random)
    if (Math.random() > 0.45) {
      const ant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.6, rng(8, 28), 5),
        sideM
      );
      ant.position.y = h + rng(4, 14);
      grp.add(ant);
    }

    // Glass top accent
    if (Math.random() > 0.6) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 3, d * 0.6), glassMat);
      top.position.y = h + 1.5;
      grp.add(top);
    }

    grp.position.set(x, 0, z);
    grp.rotation.y = rng(-0.15, 0.15);
    return grp;
  }

  const buildings = [
    // Left cluster
    [-95, -75,  38, 32, 130], [-135, -55, 30, 28,  95], [-70, -140, 45, 38,  85],
    [-160,  20, 34, 26,  75], [-110, -160, 38, 32, 105], [-180, -120, 55, 42, 155],
    // Right cluster
    [ 95, -70,  42, 36, 145], [ 140, -55, 34, 28, 100], [ 75, -135, 48, 40,  90],
    [ 165,  15, 36, 28,  80], [ 115, -155, 40, 34, 110], [ 190, -115, 58, 44, 165],
    // Centre back
    [  0, -160, 55, 48, 100], [ -40, -200, 42, 36, 125], [ 45, -195, 46, 38, 115],
    // Far ring
    [-240, -140, 70, 55, 185], [245, -135, 65, 52, 170], [-210, -230, 55, 45, 145],
    [ 215, -225, 60, 48, 160], [  0, -280, 80, 60,  95], [-120, -260, 50, 40, 135],
    [ 125, -265, 52, 42, 130], [-300,  -80, 75, 58, 140], [305, -75, 70, 55, 150],
    // Side wings
    [-80,   60, 30, 26,  65], [ 85,  65, 32, 28,  70], [-55,  90, 28, 24, 55],
    [ 60,   85, 30, 26,  60],
  ];

  buildings.forEach(args => scene.add(building(...args)));

  // ── Stars ─────────────────────────────────────────────────
  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3]     = rng(-1200, 1200);
    starPos[i * 3 + 1] = rng(80, 700);
    starPos[i * 3 + 2] = rng(-1200, -50);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 1.8, sizeAttenuation: true, transparent: true, opacity: 0.75,
  })));

  // ── Mouse parallax ────────────────────────────────────────
  let tx = 0, ty = 0;
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    heroEl.addEventListener('mousemove', e => {
      tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    heroEl.addEventListener('mouseleave', () => { tx = 0; ty = 0; });
  }

  // ── Resize ────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // ── Animate ───────────────────────────────────────────────
  let t = 0;
  const basePos = { x: 0, y: 55, z: 380 };

  // Respect prefers-reduced-motion
  const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  (function animate() {
    requestAnimationFrame(animate);
    t += 0.012;

    if (!noMotion) {
      camera.position.x += (tx * 45 - camera.position.x) * 0.035;
      camera.position.y += (-ty * 22 + basePos.y - camera.position.y) * 0.035;
      // subtle auto drift
      camera.position.x += Math.sin(t * 0.18) * 0.08;
    }

    camera.lookAt(0, 130, -40);

    // Tower light heartbeat
    towerGlow.intensity = 3.2 + Math.sin(t * 1.1) * 0.6;

    // Slow tower rotation
    if (!noMotion) tower.rotation.y = Math.sin(t * 0.07) * 0.04;

    renderer.render(scene, camera);
  })();
})();
