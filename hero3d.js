import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (!canvas) throw new Error('hero-canvas not found');

// ── Renderer ────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// ── Scene / Camera ──────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04040f);
scene.fog = new THREE.FogExp2(0x06060f, 0.0015);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 55, 380);
camera.lookAt(0, 130, -40);

// ── Lights ──────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x0d1a33, 1.2));

const moonLight = new THREE.DirectionalLight(0x3a5fa0, 0.7);
moonLight.position.set(-300, 500, 200);
scene.add(moonLight);

const towerGlow = new THREE.PointLight(0xff5522, 3.5, 500);
towerGlow.position.set(0, 160, -30);
scene.add(towerGlow);

const cityLight = new THREE.PointLight(0xff8833, 0.9, 700);
cityLight.position.set(0, -10, 100);
scene.add(cityLight);

const fillLight = new THREE.PointLight(0x1144aa, 0.5, 600);
fillLight.position.set(250, 100, -100);
scene.add(fillLight);

// ── Materials ────────────────────────────────────────────────
const redMat = new THREE.MeshStandardMaterial({
  color: 0xc0392b, emissive: 0x7a1508, emissiveIntensity: 0.35,
  roughness: 0.55, metalness: 0.45,
});
const whiteMat = new THREE.MeshStandardMaterial({
  color: 0xe8e0cc, roughness: 0.8, metalness: 0.1,
});

// ── Helpers ──────────────────────────────────────────────────
const rng = (a, b) => Math.random() * (b - a) + a;

// Canvas window texture
function windowTex(cols, rows) {
  const sz = 256;
  const cv = document.createElement('canvas');
  cv.width = sz; cv.height = sz;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#04090f';
  ctx.fillRect(0, 0, sz, sz);
  const cw = sz / cols, rh = sz / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.60) {
        const warm = Math.random() > 0.4;
        const alpha = (0.55 + Math.random() * 0.4).toFixed(2);
        if (warm) {
          const g = Math.floor(170 + Math.random() * 50);
          const b = Math.floor(70 + Math.random() * 60);
          ctx.fillStyle = `rgba(255,${g},${b},${alpha})`;
        } else {
          const r2 = Math.floor(130 + Math.random() * 80);
          const g2 = Math.floor(170 + Math.random() * 50);
          ctx.fillStyle = `rgba(${r2},${g2},255,${alpha})`;
        }
        ctx.fillRect(c * cw + cw * 0.1, r * rh + rh * 0.1, cw * 0.8, rh * 0.8);
      }
    }
  }
  return new THREE.CanvasTexture(cv);
}

// ── Ground ───────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({ color: 0x060b14, emissive: 0x0b1628, emissiveIntensity: 0.6, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
scene.add(ground);

// ── Tokyo Tower ──────────────────────────────────────────────
const tower = new THREE.Group();

// Tapered 4-sided column
function column(rBot, rTop, height, mat, yBase) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, height, 4);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = Math.PI / 4;
  mesh.position.y = yBase + height / 2;
  return mesh;
}

// Horizontal accent ring
function ring(y, radius, mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 4, 16), mat);
  mesh.position.y = y;
  return mesh;
}

// Four base legs — quaternion-aligned
const legApex = new THREE.Vector3(0, 78, 0);
[[32, 32], [-32, 32], [-32, -32], [32, -32]].forEach(([lx, lz]) => {
  const foot  = new THREE.Vector3(lx, 0, lz);
  const dir   = new THREE.Vector3().subVectors(legApex, foot);
  const len   = dir.length();
  const mid   = new THREE.Vector3().addVectors(foot, legApex).multiplyScalar(0.5);
  const mesh  = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 5.5, len, 6), redMat);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  tower.add(mesh);
});

// Lower body 0 → 115
tower.add(column(22, 8, 115, redMat, 0));

// Stripe bands on lower body
[18, 34, 50, 66, 82].forEach((y, i) =>
  tower.add(ring(y, 21 - i * 2.5, i % 2 === 0 ? whiteMat : redMat))
);

// First observation deck y=120
const deck1 = new THREE.Mesh(new THREE.BoxGeometry(28, 10, 28), whiteMat);
deck1.position.y = 120;
tower.add(deck1);

// Upper body 125 → 232
tower.add(column(7.5, 2.8, 107, redMat, 125));

// White bands on upper body
[148, 168, 188].forEach(y => tower.add(ring(y, 5.5, whiteMat)));

// Second observation deck y=235
const deck2 = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), whiteMat);
deck2.position.y = 235;
tower.add(deck2);

// Top mast 239 → 325
tower.add(column(1.6, 0.25, 86, redMat, 239));

// Aviation warning lights
[124, 238, 325].forEach(y => {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2200 })
  );
  dot.position.y = y;
  tower.add(dot);
});

tower.position.set(0, 0, -40);
scene.add(tower);

// ── Skyscrapers ──────────────────────────────────────────────
const skyColors = [0x0c1522, 0x101828, 0x0e1620, 0x131e2c, 0x0a1420];

function makeBuilding(x, z, w, d, h) {
  const group  = new THREE.Group();
  const cols   = Math.max(3, Math.floor(w / 7));
  const rows   = Math.max(4, Math.floor(h / 10));
  const wt     = windowTex(cols, rows);
  const pick   = () => skyColors[Math.floor(Math.random() * skyColors.length)];

  const winMat = new THREE.MeshStandardMaterial({
    color: pick(), emissiveMap: wt, emissive: 0xffffff,
    emissiveIntensity: 0.85, roughness: 0.6, metalness: 0.3,
  });
  const sideMat = new THREE.MeshStandardMaterial({
    color: pick(), roughness: 0.85, metalness: 0.2,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    [sideMat, sideMat, sideMat, sideMat, winMat, winMat]
  );
  body.position.y = h / 2;
  group.add(body);

  if (Math.random() > 0.4) {
    const antH = rng(8, 28);
    const ant  = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.7, antH, 5), sideMat);
    ant.position.y = h + antH / 2;
    group.add(ant);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rng(-0.12, 0.12);
  return group;
}

[
  [-90, -75, 38, 32, 130], [-135, -55, 30, 26, 95],  [-68, -140, 44, 36, 82],
  [-158,  18, 34, 26, 72], [-108,-158, 38, 30, 102],  [-175,-118, 54, 40, 152],
  [  94, -70, 42, 34, 142],[  138,-54, 34, 28, 98],   [  73,-132, 46, 38, 87],
  [ 162,  14, 36, 26, 78], [  112,-152,40, 34, 108],  [ 188,-112, 56, 42, 162],
  [   0,-158, 54, 46, 98], [  -42,-198,40, 34, 122],  [  44,-192, 44, 36, 112],
  [-238,-138, 68, 52, 182],[  242,-132,62, 50, 168],  [-208,-228, 54, 42, 142],
  [ 212,-222, 58, 46, 158],[    0,-278,78, 58,  92],  [-118,-258, 48, 38, 132],
  [ 122,-262, 50, 40, 128],[ -298, -78,72, 56, 138],  [ 302, -72, 68, 52, 148],
  [ -78,  58, 30, 24,  62],[   82,  62,32, 26,  68],
  [ -54,  88, 28, 22,  52],[   58,  82,30, 24,  58],
].forEach(([x, z, w, d, h]) => scene.add(makeBuilding(x, z, w, d, h)));

// ── Stars ────────────────────────────────────────────────────
const starCount = 900;
const starPos   = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPos[i]     = rng(-1200, 1200);
  starPos[i + 1] = rng(80, 700);
  starPos[i + 2] = rng(-1200, -60);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xffffff, size: 1.5, sizeAttenuation: true, transparent: true, opacity: 0.7,
})));

// ── Mouse parallax ───────────────────────────────────────────
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
  mx = (e.clientX / window.innerWidth  - 0.5) * 2;
  my = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ── Resize ───────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

// ── Animate ──────────────────────────────────────────────────
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let t = 0;

function tick() {
  requestAnimationFrame(tick);
  t += 0.012;

  if (!noMotion) {
    camera.position.x += (mx * 45 - camera.position.x) * 0.035;
    camera.position.y += (-my * 20 + 55 - camera.position.y) * 0.035;
    camera.position.x += Math.sin(t * 0.18) * 0.06;
  }

  camera.lookAt(0, 130, -40);
  towerGlow.intensity = 3.0 + Math.sin(t * 1.1) * 0.6;
  renderer.render(scene, camera);
}

tick();
