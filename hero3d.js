import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (!canvas) throw new Error('hero-canvas not found');

// ── Renderer ───────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

// ── Scene ──────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030507);
scene.fog = new THREE.FogExp2(0x030507, 0.022);

// ── Camera ─────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  62, window.innerWidth / window.innerHeight, 0.1, 120
);
camera.position.set(0, 3.2, 18);
camera.lookAt(0, 7, -30);

// ── Lights ─────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x0a0f1e, 2.8));

const moonDir = new THREE.DirectionalLight(0xbbd0ff, 1.5);
moonDir.position.set(-10, 40, 15);
scene.add(moonDir);

// Vermilion gate glows (near the front gates)
const glowA = new THREE.PointLight(0xff3300, 5.5, 16);
glowA.position.set(0, 8.5, 12);
scene.add(glowA);

const glowB = new THREE.PointLight(0xff2200, 3.5, 12);
glowB.position.set(0, 7.8, 4);
scene.add(glowB);

// Mouse-following fill light
const fill = new THREE.PointLight(0x2244aa, 3, 28);
fill.position.set(0, 5, 10);
scene.add(fill);

// ── Dark Water Surface ─────────────────────────────────────────
const GW = 32, GD = 100, GCX = 64, GCZ = 100;
const wGeo = new THREE.PlaneGeometry(GW, GD, GCX - 1, GCZ - 1);
wGeo.rotateX(-Math.PI / 2);

const wVerts  = wGeo.attributes.position.array;
const wCount  = wVerts.length / 3;
const wColors = new Float32Array(wCount * 3);
wGeo.setAttribute('color', new THREE.BufferAttribute(wColors, 3));

const waterMesh = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.08,
  metalness: 0.88,
}));
waterMesh.position.set(0, -0.5, -32);
scene.add(waterMesh);

// Pre-allocated buffers to avoid GC churn
const hBuf  = new Float32Array(wCount);
const tempC = new THREE.Color();

// Water color stops: deep black → dark indigo → mid indigo → vermilion peak
const C0 = new THREE.Color(0x020305);
const C1 = new THREE.Color(0x060d25);
const C2 = new THREE.Color(0x112048);
const C3 = new THREE.Color(0x8B2635);

// ── Torii Gate Materials ───────────────────────────────────────
const matRed = new THREE.MeshStandardMaterial({
  color: 0x6b1010,
  roughness: 0.60,
  metalness: 0.08,
  emissive: new THREE.Color(0x8B2635),
  emissiveIntensity: 0.75,
});
const matBlack = new THREE.MeshStandardMaterial({
  color: 0x0b0808,
  roughness: 0.85,
  metalness: 0.12,
  emissive: new THREE.Color(0x180505),
  emissiveIntensity: 0.18,
});

function makeTorii(w, h, worldZ, xOff) {
  const g = new THREE.Group();
  const s = 0.36;

  // Left & right pillars
  const pGeo = new THREE.BoxGeometry(s, h, s);
  const lp   = new THREE.Mesh(pGeo, matBlack);
  lp.position.set(-w * 0.5, h * 0.5, 0);
  const rp   = new THREE.Mesh(pGeo, matBlack);
  rp.position.set( w * 0.5, h * 0.5, 0);
  g.add(lp, rp);

  // Nuki — inner horizontal tie beam
  const nuki = new THREE.Mesh(
    new THREE.BoxGeometry(w + s * 1.4, 0.26, 0.28), matBlack
  );
  nuki.position.set(0, h * 0.80, 0);
  g.add(nuki);

  // Kasagi — main vermilion lintel
  const kasagi = new THREE.Mesh(
    new THREE.BoxGeometry(w + s * 3.2, 0.44, 0.58), matRed
  );
  kasagi.position.set(0, h * 0.93, 0);
  g.add(kasagi);

  // Shimagi — top cap, slightly wider
  const shimagi = new THREE.Mesh(
    new THREE.BoxGeometry(w + s * 4.5, 0.22, 0.76), matRed
  );
  shimagi.position.set(0, h, 0);
  g.add(shimagi);

  g.position.set(xOff, 0, worldZ);
  return g;
}

// 10 gates in a corridor, shrinking with distance [width, height, z, xOffset]
const GATE_DEFS = [
  [6.2, 9.2,  12,  0.00],
  [5.9, 8.8,   3,  0.35],
  [5.6, 8.4,  -6, -0.28],
  [5.3, 8.0, -15,  0.42],
  [5.0, 7.6, -24, -0.32],
  [4.7, 7.2, -33,  0.24],
  [4.4, 6.8, -42, -0.38],
  [4.1, 6.4, -51,  0.18],
  [3.8, 6.0, -60, -0.22],
  [3.5, 5.6, -69,  0.12],
];

GATE_DEFS.forEach(([w, h, z, x]) => scene.add(makeTorii(w, h, z, x)));

// ── Moon & Glow Halo ───────────────────────────────────────────
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(4, 48, 32),
  new THREE.MeshBasicMaterial({ color: 0xccd8f0 })
);
moonMesh.position.set(1.5, 22, -80);
scene.add(moonMesh);

const haloMesh = new THREE.Mesh(
  new THREE.CircleGeometry(18, 64),
  new THREE.MeshBasicMaterial({
    color: 0x8899cc,
    transparent: true,
    opacity: 0.032,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
haloMesh.position.set(1.5, 22, -79);
scene.add(haloMesh);

// ── Horizon Indigo Glow ────────────────────────────────────────
const horizMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 10),
  new THREE.MeshBasicMaterial({
    color: 0x1a2f6e,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
horizMesh.position.set(0, 4.5, -78);
scene.add(horizMesh);

// ── Spirit Particles (rising through the gates) ────────────────
const PC   = 2400;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PC * 3);
const pSpd = new Float32Array(PC);
const pPhs = new Float32Array(PC);

for (let i = 0; i < PC; i++) {
  pPos[i * 3]     = (Math.random() - 0.5) * 14;
  pPos[i * 3 + 1] = Math.random() * 12;
  pPos[i * 3 + 2] = Math.random() * -84 + 14;
  pSpd[i]         = 0.011 + Math.random() * 0.022;
  pPhs[i]         = Math.random() * Math.PI * 2;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

const spirits = new THREE.Points(pGeo, new THREE.PointsMaterial({
  color: 0xf5e6d3,
  size: 0.085,
  transparent: true,
  opacity: 0.72,
  sizeAttenuation: true,
}));
scene.add(spirits);

// ── Mouse ──────────────────────────────────────────────────────
let mx = 0, my = 0;
window.addEventListener('mousemove', e => {
  mx = (e.clientX / window.innerWidth)  * 2 - 1;
  my = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

// ── Resize ─────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// ── Animation Loop ─────────────────────────────────────────────
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let t = 0;

function tick() {
  requestAnimationFrame(tick);
  if (window.__heroVisible === false) return;
  t += 0.007;

  if (!noMotion) {
    // Subtle camera lean with mouse
    camera.position.x += (mx * 2.8  - camera.position.x) * 0.032;
    camera.position.y += (-my * 1.5 + 3.2 - camera.position.y) * 0.032;
    camera.lookAt(camera.position.x * 0.35, 7, -30);

    // Fill light drifts with mouse
    fill.position.x = mx * 16;
    fill.position.z = 10 - my * 5;

    // ── Water wave animation ────────────────────────────────
    let minH = Infinity, maxH = -Infinity;
    for (let i = 0; i < wCount; i++) {
      const x = wVerts[i * 3];
      const z = wVerts[i * 3 + 2];
      const h =
        Math.sin(x * 0.32 + t * 1.25) * 0.28 +
        Math.sin(z * 0.20 + t * 0.88) * 0.32 +
        Math.sin((x - z * 0.55) * 0.18 + t * 0.65) * 0.22 +
        Math.cos(x * 0.12 + z * 0.21 + t * 1.10) * 0.18;
      // Mouse-driven ripple near the front of the corridor
      const rx = mx * 13;
      const d  = Math.sqrt((x - rx) ** 2 + (z - 36) ** 2 + 0.01);
      hBuf[i]  = h + Math.sin(d * 0.52 - t * 5) * Math.exp(-d * 0.08) * 0.28;
      if (hBuf[i] < minH) minH = hBuf[i];
      if (hBuf[i] > maxH) maxH = hBuf[i];
    }
    const range = maxH - minH || 1;
    for (let i = 0; i < wCount; i++) {
      wVerts[i * 3 + 1] = hBuf[i];
      const nt = (hBuf[i] - minH) / range;
      if      (nt < 0.45) tempC.copy(C0).lerp(C1, nt / 0.45);
      else if (nt < 0.82) tempC.copy(C1).lerp(C2, (nt - 0.45) / 0.37);
      else                tempC.copy(C2).lerp(C3, (nt - 0.82) / 0.18);
      wColors[i * 3]     = tempC.r;
      wColors[i * 3 + 1] = tempC.g;
      wColors[i * 3 + 2] = tempC.b;
    }
    wGeo.attributes.position.needsUpdate = true;
    wGeo.attributes.color.needsUpdate    = true;
    wGeo.computeVertexNormals();

    // ── Spirit particles float upward ────────────────────────
    for (let i = 0; i < PC; i++) {
      pPos[i * 3 + 1] += pSpd[i];
      pPos[i * 3]     += Math.sin(t * 0.9 + pPhs[i]) * 0.0035;
      if (pPos[i * 3 + 1] > 13) {
        pPos[i * 3 + 1] = 0.1;
        pPos[i * 3]     = (Math.random() - 0.5) * 14;
        pPos[i * 3 + 2] = Math.random() * -84 + 14;
      }
    }
    pGeo.attributes.position.needsUpdate = true;

    // ── Vermilion pulse ──────────────────────────────────────
    matRed.emissiveIntensity = 0.65 + Math.sin(t * 1.4) * 0.22;
    glowA.intensity = 5.0 + Math.sin(t * 1.3) * 1.8;
    glowB.intensity = 3.0 + Math.cos(t * 1.1) * 1.0;

    // ── Moon gentle sway ─────────────────────────────────────
    moonMesh.position.x = 1.5 + Math.sin(t * 0.2) * 0.4;
    haloMesh.position.x = moonMesh.position.x;
  }

  renderer.render(scene, camera);
}

tick();
