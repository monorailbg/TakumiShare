import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (!canvas) throw new Error('hero-canvas not found');

// ── Renderer ─────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;

// ── Scene ─────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05101e);
scene.fog = new THREE.FogExp2(0x1e3d62, 0.00080);

// ── Gradient Sky Dome ─────────────────────────────────────────
(function buildSky() {
  const geo = new THREE.SphereGeometry(2800, 48, 32);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const stops = [
    [0.00, 0.72, 0.82, 0.88],
    [0.28, 0.48, 0.65, 0.82],
    [0.44, 0.20, 0.42, 0.70],
    [0.56, 0.08, 0.22, 0.50],
    [0.68, 0.04, 0.12, 0.34],
    [0.82, 0.03, 0.08, 0.22],
    [1.00, 0.02, 0.05, 0.14],
  ];
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, (pos.getY(i) + 2800) / 5600));
    let r = 0, g = 0, b = 0;
    for (let j = 1; j < stops.length; j++) {
      if (t <= stops[j][0]) {
        const s0 = stops[j - 1], s1 = stops[j];
        const tt = (t - s0[0]) / (s1[0] - s0[0]);
        r = s0[1] + (s1[1] - s0[1]) * tt;
        g = s0[2] + (s1[2] - s0[2]) * tt;
        b = s0[3] + (s1[3] - s0[3]) * tt;
        break;
      }
    }
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
})();

// Horizon warm glow ring
const horizonGlowMesh = new THREE.Mesh(
  new THREE.RingGeometry(300, 2200, 64),
  new THREE.MeshBasicMaterial({
    color: 0xff7744, transparent: true, opacity: 0.07,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  })
);
horizonGlowMesh.rotation.x = -Math.PI / 2;
horizonGlowMesh.position.y = 2;
scene.add(horizonGlowMesh);

// ── Camera ────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.5, 4000);
camera.position.set(-18, 68, 380);
camera.lookAt(85, 145, -42);

// ── Lights ────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x3a5fa0, 2.2));

const sunLight = new THREE.DirectionalLight(0xffd4a0, 1.8);
sunLight.position.set(350, 500, 100);
scene.add(sunLight);

const skyFill = new THREE.DirectionalLight(0x7ab5d8, 0.75);
skyFill.position.set(-300, 400, 200);
scene.add(skyFill);

const towerGlow    = new THREE.PointLight(0xff6622, 5.0, 750);
const towerGlowBot = new THREE.PointLight(0xff4400, 2.8, 320);
towerGlow.position.set(100, 210, -20);
towerGlowBot.position.set(100, 55, -15);
scene.add(towerGlow, towerGlowBot);

const cityLight = new THREE.PointLight(0xff9944, 1.3, 950);
cityLight.position.set(60, 10, 80);
scene.add(cityLight);

// Distant city horizon glows
[[-250, -560], [0, -500], [250, -520], [400, -580], [500, -620]].forEach(([x, z], i) => {
  const gl = new THREE.PointLight([0xff9944, 0xff8833, 0xffaa55, 0xff7722, 0xff9966][i], 0.6, 800);
  gl.position.set(x, 5, z);
  scene.add(gl);
});

// ── Bar helper: cylinder aligned between two 3-D points ───────
function bar(group, p1, p2, rTop, rBot, mat, segs = 5) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 0.05) return;
  const mid  = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, segs), mat);
  mesh.position.copy(mid);
  const norm = dir.clone().normalize();
  const up   = new THREE.Vector3(0, 1, 0);
  if (Math.abs(norm.dot(up)) < 0.9999) {
    mesh.quaternion.setFromUnitVectors(up, norm);
  } else if (norm.y < 0) {
    mesh.rotation.z = Math.PI;
  }
  group.add(mesh);
}

// ── Ultra-Realistic Tokyo Tower ───────────────────────────────
function buildTokyoTower() {
  const grp = new THREE.Group();

  const RED = new THREE.MeshStandardMaterial({
    color: 0xe04000, emissive: 0x801400, emissiveIntensity: 0.32,
    roughness: 0.36, metalness: 0.72,
  });
  const WHITE = new THREE.MeshStandardMaterial({
    color: 0xddd5b5, emissive: 0x3a2210, emissiveIntensity: 0.08,
    roughness: 0.72, metalness: 0.22,
  });
  const GLASS = new THREE.MeshStandardMaterial({
    color: 0x88aacc, emissive: 0x183060, emissiveIntensity: 0.65,
    roughness: 0.06, metalness: 0.88, transparent: true, opacity: 0.86,
  });
  const GLOWADD = new THREE.MeshBasicMaterial({
    color: 0xff5511, transparent: true, opacity: 0.17,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const WARN = new THREE.MeshBasicMaterial({ color: 0xff2200 });

  // ─── BASE: 4 converging legs (y = 0–120) ────────────────────
  const FEET = [
    new THREE.Vector3( 38, 0,  38),
    new THREE.Vector3( 38, 0, -38),
    new THREE.Vector3(-38, 0, -38),
    new THREE.Vector3(-38, 0,  38),
  ];
  const APEX = [
    new THREE.Vector3( 5.5, 120,  5.5),
    new THREE.Vector3( 5.5, 120, -5.5),
    new THREE.Vector3(-5.5, 120, -5.5),
    new THREE.Vector3(-5.5, 120,  5.5),
  ];
  const legAt = (i, t) => new THREE.Vector3().lerpVectors(FEET[i], APEX[i], t);

  // 4 main tapered legs
  for (let i = 0; i < 4; i++) {
    bar(grp, FEET[i], APEX[i], 1.15, 5.5, RED, 7);
  }

  // Concrete footings
  for (const f of FEET) {
    const footing = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 14), WHITE);
    footing.position.set(f.x, 2.25, f.z);
    grp.add(footing);
  }

  // Cross-bracing lattice — adjacent face pairs
  const ADJ  = [[0, 1], [1, 2], [2, 3], [3, 0]];
  const OPP  = [[0, 2], [1, 3]];
  const LVLS = [0, 12, 24, 36, 50, 64, 78, 92, 106, 120];

  for (let k = 0; k < LVLS.length - 1; k++) {
    const y0 = LVLS[k], y1 = LVLS[k + 1];
    const t0 = y0 / 120, t1 = y1 / 120;
    const midT = (t0 + t1) / 2;
    const br = 0.58 * (1 - t0 * 0.48);

    for (const [i, j] of ADJ) {
      const li0 = legAt(i, t0), li1 = legAt(i, t1);
      const lj0 = legAt(j, t0), lj1 = legAt(j, t1);
      // X-brace diagonals
      bar(grp, li0, lj1, br, br, RED);
      bar(grp, lj0, li1, br, br, RED);
      // Horizontal tie at base of segment (alternates colour for realism)
      bar(grp, li0, lj0, br * 0.80, br * 0.80, k % 2 === 0 ? RED : WHITE);
    }

    // Inner diagonal cross at mid-level (connects opposite legs)
    for (const [i, j] of OPP) {
      bar(grp, legAt(i, midT), legAt(j, midT), br * 0.58, br * 0.58, RED);
    }
  }

  // Final ring at top of base section
  for (const [i, j] of ADJ) {
    bar(grp, legAt(i, 1), legAt(j, 1), 0.55, 0.55, WHITE);
  }

  // ─── TRANSITION SHAFT (120 – 147) ───────────────────────────
  bar(grp, new THREE.Vector3(0, 120, 0), new THREE.Vector3(0, 147, 0), 6.0, 7.8, RED, 8);
  [126, 133, 140].forEach(y => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(8.5 - (y - 120) * 0.14, 0.55, 7, 28), WHITE);
    ring.position.y = y;
    grp.add(ring);
  });

  // ─── MAIN OBSERVATION DECK 1 (~150 m) ───────────────────────
  const dk1base = new THREE.Mesh(new THREE.BoxGeometry(32, 4, 32), WHITE);
  dk1base.position.y = 149;
  grp.add(dk1base);

  const dk1glass = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 11, 36), GLASS);
  dk1glass.position.y = 155;
  grp.add(dk1glass);

  const dk1top = new THREE.Mesh(new THREE.BoxGeometry(30, 3.5, 30), RED);
  dk1top.position.y = 161;
  grp.add(dk1top);

  // Railings (4 sides)
  for (let a = 0; a < 4; a++) {
    const ang  = a * Math.PI * 0.5 + Math.PI * 0.25;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(22, 1.5, 1), WHITE);
    rail.position.set(Math.cos(ang) * 15, 163, Math.sin(ang) * 15);
    rail.rotation.y = ang;
    grp.add(rail);
  }

  // Soft glow halo around Deck 1
  const halo1 = new THREE.Mesh(new THREE.SphereGeometry(22, 14, 10), GLOWADD.clone());
  halo1.position.y = 155;
  grp.add(halo1);

  // ─── UPPER SHAFT (164 – 234): red/white bands ────────────────
  const shaftBands = [
    [164, 180, RED,   7.5, 5.8],
    [180, 188, WHITE, 5.8, 5.2],
    [188, 205, RED,   5.2, 4.0],
    [205, 213, WHITE, 4.0, 3.6],
    [213, 228, RED,   3.6, 2.8],
    [228, 234, WHITE, 2.8, 2.5],
  ];
  for (const [y0, y1, mat, r0, r1] of shaftBands) {
    bar(grp, new THREE.Vector3(0, y0, 0), new THREE.Vector3(0, y1, 0), r1, r0, mat, 9);
  }
  [172, 188, 204, 220].forEach(y => {
    const r    = 5.8 - (y - 164) * 0.047;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 1.2, 0.48, 7, 28), RED);
    ring.position.y = y;
    grp.add(ring);
  });

  // ─── TOP OBSERVATION DECK 2 (~250 m) ────────────────────────
  bar(grp, new THREE.Vector3(0, 234, 0), new THREE.Vector3(0, 247, 0), 2.8, 2.8, RED, 8);

  const dk2base = new THREE.Mesh(new THREE.BoxGeometry(20, 3.5, 20), WHITE);
  dk2base.position.y = 248.5;
  grp.add(dk2base);

  const dk2glass = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 12.5, 9, 32), GLASS);
  dk2glass.position.y = 253.5;
  grp.add(dk2glass);

  const dk2top = new THREE.Mesh(new THREE.BoxGeometry(18, 2.8, 18), RED);
  dk2top.position.y = 259;
  grp.add(dk2top);

  // Glow halo on Deck 2
  const halo2 = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 8), GLOWADD.clone());
  halo2.position.y = 254;
  grp.add(halo2);

  // ─── ANTENNA (260 – 333) ─────────────────────────────────────
  const antBands = [
    [260, 278, 1.90, 1.40, RED],
    [278, 292, 1.40, 1.00, WHITE],
    [292, 308, 1.00, 0.65, RED],
    [308, 320, 0.65, 0.42, WHITE],
    [320, 333, 0.42, 0.12, RED],
  ];
  for (const [y0, y1, r0, r1, mat] of antBands) {
    bar(grp, new THREE.Vector3(0, y0, 0), new THREE.Vector3(0, y1, 0), r1, r0, mat, 7);
  }

  // ─── Aviation warning lights ──────────────────────────────────
  const warnMats = [];
  [152, 253, 333].forEach(y => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(2.0, 10, 8), WARN.clone());
    dot.position.y = y;
    grp.add(dot);
    warnMats.push(dot.material);
  });

  return { grp, warnMats };
}

const { grp: towerGroup, warnMats } = buildTokyoTower();
towerGroup.position.set(100, 0, -40);
scene.add(towerGroup);

// ── Tokyo Skytree (background) ────────────────────────────────
(function buildSkytree() {
  const grp = new THREE.Group();
  const stMat = new THREE.MeshStandardMaterial({
    color: 0x6a8aa8, emissive: 0x0c1828, emissiveIntensity: 0.28,
    roughness: 0.35, metalness: 0.72,
  });
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x4a6e88, emissive: 0x081520, emissiveIntensity: 0.38,
    roughness: 0.22, metalness: 0.82,
  });

  // Tripod base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 30, 108, 3), stMat);
  base.position.y = 54;
  grp.add(base);

  // Mid shaft
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6, 138, 8), stMat);
  mid.position.y = 177;
  grp.add(mid);

  // Tembo Deck 1
  const d1 = new THREE.Mesh(new THREE.CylinderGeometry(21, 21, 15, 32), deckMat);
  d1.position.y = 350;
  grp.add(d1);
  const d1rim = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 3.5, 32), deckMat);
  d1rim.position.y = 360;
  grp.add(d1rim);

  // Upper shaft
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 185, 8), stMat);
  upper.position.y = 340;
  grp.add(upper);

  // Tembo Galleria 2
  const d2 = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 11, 32), deckMat);
  d2.position.y = 450;
  grp.add(d2);

  // Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.0, 168, 8), stMat);
  mast.position.y = 544;
  grp.add(mast);

  // Aviation lights
  [352, 453, 628].forEach(y => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2200 }));
    dot.position.y = y;
    grp.add(dot);
  });

  grp.position.set(295, 0, -142);
  scene.add(grp);
})();

// ── Mt Fuji ───────────────────────────────────────────────────
(function buildFuji() {
  const grp = new THREE.Group();
  const fujiMat = new THREE.MeshStandardMaterial({
    color: 0x181c28, emissive: 0x060810, emissiveIntensity: 0.12, roughness: 1,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xeae6f5, emissive: 0x4855a0, emissiveIntensity: 0.14, roughness: 0.94,
  });

  const body = new THREE.Mesh(new THREE.ConeGeometry(420, 300, 52), fujiMat);
  body.position.y = 150;
  grp.add(body);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(74, 98, 32), snowMat);
  cap.position.y = 266;
  grp.add(cap);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(108, 78, 20, 32), snowMat);
  skirt.position.y = 212;
  grp.add(skirt);

  grp.position.set(-200, -142, -800);
  scene.add(grp);
})();

// ── Ground ────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3200, 3200),
  new THREE.MeshStandardMaterial({
    color: 0x0a1525, emissive: 0x0d1e38, emissiveIntensity: 0.55,
    roughness: 0.72, metalness: 0.28,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
scene.add(ground);

// ── Window texture helper ─────────────────────────────────────
function windowTex(cols, rows) {
  const sz  = 256;
  const cv  = document.createElement('canvas');
  cv.width  = sz; cv.height = sz;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, sz, sz);
  const cw = sz / cols, rh = sz / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.66) {
        const warm  = Math.random() > 0.35;
        const alpha = (0.6 + Math.random() * 0.38).toFixed(2);
        ctx.fillStyle = warm
          ? `rgba(255,${Math.floor(165 + Math.random() * 60)},${Math.floor(60 + Math.random() * 70)},${alpha})`
          : `rgba(${Math.floor(120 + Math.random() * 90)},${Math.floor(168 + Math.random() * 55)},255,${alpha})`;
        ctx.fillRect(c * cw + cw * 0.1, r * rh + rh * 0.1, cw * 0.8, rh * 0.8);
      }
    }
  }
  return new THREE.CanvasTexture(cv);
}

// ── Buildings ─────────────────────────────────────────────────
const rng      = (a, b) => Math.random() * (b - a) + a;
const skyPalette = [0x0c1522, 0x101828, 0x0e1620, 0x131e2c, 0x0a1420, 0x0f1a2a];

function makeBuilding(x, z, w, d, h) {
  const grp    = new THREE.Group();
  const cols   = Math.max(3, Math.floor(w / 7));
  const rows   = Math.max(4, Math.floor(h / 10));
  const wt     = windowTex(cols, rows);
  const pick   = () => skyPalette[Math.floor(Math.random() * skyPalette.length)];
  const winMat = new THREE.MeshStandardMaterial({
    color: pick(), emissiveMap: wt, emissive: 0xffffff,
    emissiveIntensity: 0.95, roughness: 0.55, metalness: 0.35,
  });
  const sideMat = new THREE.MeshStandardMaterial({ color: pick(), roughness: 0.82, metalness: 0.22 });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    [sideMat, sideMat, sideMat, sideMat, winMat, winMat]
  );
  body.position.y = h / 2;
  grp.add(body);

  if (Math.random() > 0.38) {
    const antH = rng(7, 26);
    const ant  = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.65, antH, 5), sideMat);
    ant.position.y = h + antH / 2;
    grp.add(ant);
  }

  grp.position.set(x, 0, z);
  grp.rotation.y = rng(-0.12, 0.12);
  return grp;
}

[
  [-42, -82, 34, 28, 95],   [-88, -56, 30, 24, 72],  [-26, -142, 40, 34, 82],
  [-122, 18, 28, 22, 60],   [-72, -152, 36, 28, 108],
  [160, -72, 42, 36, 140],  [212, -56, 38, 30, 102], [142, -142, 44, 36, 87],
  [232, 12, 34, 26, 72],    [178, -158, 40, 34, 115], [242, -116, 55, 42, 162],
  [62, -162, 52, 44, 98],   [22, -202, 38, 32, 124],  [102, -192, 42, 34, 112],
  [-202, -142, 65, 50, 178], [282, -132, 60, 48, 168], [-178, -232, 52, 40, 142],
  [268, -222, 56, 44, 158],  [62, -282, 75, 55, 92],   [-92, -262, 46, 36, 130],
  [158, -268, 48, 38, 128],  [-272, -82, 68, 52, 138], [348, -72, 65, 50, 148],
  [-52, 63, 28, 22, 62],    [172, 58, 30, 24, 68],
  [-32, 88, 26, 20, 52],    [192, 83, 28, 22, 58],
  [20, -100, 35, 28, 88],   [-10, -120, 32, 26, 76], [130, -100, 38, 30, 118],
].forEach(([x, z, w, d, h]) => scene.add(makeBuilding(x, z, w, d, h)));

// ── Stars ─────────────────────────────────────────────────────
(function buildStars() {
  const N   = 1200;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = rng(-1400, 1400);
    pos[i * 3 + 1] = rng(90, 750);
    pos[i * 3 + 2] = rng(-1400, -60);
    const warm       = Math.random() > 0.5;
    col[i * 3]     = warm ? 1.00 : 0.80;
    col[i * 3 + 1] = warm ? 0.95 : 0.88;
    col[i * 3 + 2] = warm ? 0.82 : 1.00;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    vertexColors: true, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.82,
  })));
})();

// ── Mouse / Touch parallax ────────────────────────────────────
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
  mx = (e.clientX / window.innerWidth  - 0.5) * 2;
  my = (e.clientY / window.innerHeight - 0.5) * 2;
});
document.addEventListener('touchmove', e => {
  if (e.touches.length) {
    mx = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
    my = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
  }
}, { passive: true });

// ── Resize ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// ── Animation loop ────────────────────────────────────────────
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let t = 0, warnPhase = 0;

function tick() {
  requestAnimationFrame(tick);
  t          += 0.012;
  warnPhase  += 0.018;

  if (!noMotion) {
    camera.position.x += (mx * 32 - 18 - camera.position.x) * 0.032;
    camera.position.y += (-my * 18 + 68 - camera.position.y) * 0.032;
    camera.position.x += Math.sin(t * 0.17) * 0.04;
    camera.position.y += Math.cos(t * 0.13) * 0.025;
  }
  camera.lookAt(85, 145, -42);

  // Tower glow heartbeat
  towerGlow.intensity    = 4.2 + Math.sin(t * 1.15) * 0.9;
  towerGlowBot.intensity = 2.2 + Math.sin(t * 1.05 + 0.5) * 0.6;

  // Aviation lights blink
  const warnOn = Math.sin(warnPhase * 4.0) > 0.7;
  for (const mat of warnMats) {
    mat.color.set(warnOn ? 0xff2200 : 0x550800);
  }

  // Horizon glow breathes subtly
  horizonGlowMesh.material.opacity = 0.06 + Math.sin(t * 0.35) * 0.015;

  renderer.render(scene, camera);
}

tick();
