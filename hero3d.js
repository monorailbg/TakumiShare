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
scene.fog = new THREE.FogExp2(0x06060f, 0.0012);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(-20, 55, 380);
// Look toward the right where the tower and Skytree are
camera.lookAt(100, 130, -40);

// ── Lights ──────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x0d1a33, 1.2));

const moonLight = new THREE.DirectionalLight(0x3a5fa0, 0.7);
moonLight.position.set(-300, 500, 200);
scene.add(moonLight);

// Tokyo Tower warm glow
const towerGlow = new THREE.PointLight(0xff5522, 3.5, 500);
towerGlow.position.set(100, 160, -30);
scene.add(towerGlow);

// Skytree cool glow
const skytreeGlow = new THREE.PointLight(0x4488dd, 2.0, 450);
skytreeGlow.position.set(290, 300, -120);
scene.add(skytreeGlow);

// City warmth
const cityLight = new THREE.PointLight(0xff8833, 0.9, 700);
cityLight.position.set(50, -10, 100);
scene.add(cityLight);

// Fill light from the left (moonlight on Fuji side)
const fujiLight = new THREE.DirectionalLight(0x334466, 0.4);
fujiLight.position.set(-400, 300, -600);
scene.add(fujiLight);

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
          ctx.fillStyle = `rgba(255,${Math.floor(170 + Math.random() * 50)},${Math.floor(70 + Math.random() * 60)},${alpha})`;
        } else {
          ctx.fillStyle = `rgba(${Math.floor(130 + Math.random() * 80)},${Math.floor(170 + Math.random() * 50)},255,${alpha})`;
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

// ── Tokyo Tower (shifted right so text doesn't overlap) ───────
const tower = new THREE.Group();

function column(rBot, rTop, height, mat, yBase) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, height, 4), mat);
  mesh.rotation.y = Math.PI / 4;
  mesh.position.y = yBase + height / 2;
  return mesh;
}

function ring(y, radius, mat) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 4, 16), mat);
  mesh.position.y = y;
  return mesh;
}

// Quaternion-aligned base legs
const legApex = new THREE.Vector3(0, 78, 0);
[[32, 32], [-32, 32], [-32, -32], [32, -32]].forEach(([lx, lz]) => {
  const foot = new THREE.Vector3(lx, 0, lz);
  const dir  = new THREE.Vector3().subVectors(legApex, foot);
  const len  = dir.length();
  const mid  = new THREE.Vector3().addVectors(foot, legApex).multiplyScalar(0.5);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 5.5, len, 6), redMat);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  tower.add(mesh);
});

tower.add(column(22, 8, 115, redMat, 0));
[18, 34, 50, 66, 82].forEach((y, i) =>
  tower.add(ring(y, 21 - i * 2.5, i % 2 === 0 ? whiteMat : redMat))
);

const deck1 = new THREE.Mesh(new THREE.BoxGeometry(28, 10, 28), whiteMat);
deck1.position.y = 120;
tower.add(deck1);

tower.add(column(7.5, 2.8, 107, redMat, 125));
[148, 168, 188].forEach(y => tower.add(ring(y, 5.5, whiteMat)));

const deck2 = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), whiteMat);
deck2.position.y = 235;
tower.add(deck2);

tower.add(column(1.6, 0.25, 86, redMat, 239));

[124, 238, 325].forEach(y => {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
  dot.position.y = y;
  tower.add(dot);
});

tower.position.set(100, 0, -40);
scene.add(tower);

// ── Tokyo Skytree ────────────────────────────────────────────
const skytree = new THREE.Group();

const stMat = new THREE.MeshStandardMaterial({
  color: 0x7a9ab8, emissive: 0x0d1e30, emissiveIntensity: 0.3,
  roughness: 0.4, metalness: 0.7,
});
const stDeckMat = new THREE.MeshStandardMaterial({
  color: 0x5a7e99, emissive: 0x0a1828, emissiveIntensity: 0.4,
  roughness: 0.25, metalness: 0.8,
});

// Distinctive 3-sided tapered base (tripod silhouette)
const stBase = new THREE.Mesh(new THREE.CylinderGeometry(7, 32, 110, 3), stMat);
stBase.position.y = 55;
skytree.add(stBase);

// Transition shaft (110–250)
const stMid = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 140, 8), stMat);
stMid.position.y = 180;
skytree.add(stMid);

// Tembo Deck 1 at ~350m
const std1 = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 16, 32), stDeckMat);
std1.position.y = 352;
skytree.add(std1);
const std1rim = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 4, 32), stDeckMat);
std1rim.position.y = 362;
skytree.add(std1rim);

// Upper shaft (250–440)
const stUpper = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 190, 8), stMat);
stUpper.position.y = 345;
skytree.add(stUpper);

// Tembo Galleria 2 at ~450m
const std2 = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 12, 32), stDeckMat);
std2.position.y = 452;
skytree.add(std2);

// Top mast (460–630)
const stMast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.2, 170, 8), stMat);
stMast.position.y = 545;
skytree.add(stMast);

// Aviation lights
[355, 455, 630].forEach(y => {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
  dot.position.y = y;
  skytree.add(dot);
});

skytree.position.set(295, 0, -140);
scene.add(skytree);

// ── Mt. Fuji (far background, left side for balance) ─────────
const fujiGroup = new THREE.Group();

const fujiMat = new THREE.MeshStandardMaterial({
  color: 0x141620, emissive: 0x060810, emissiveIntensity: 0.15, roughness: 1,
});
const snowMat = new THREE.MeshStandardMaterial({
  color: 0xe8e4f2, emissive: 0x5055a0, emissiveIntensity: 0.12, roughness: 0.95,
});

// Mountain body
const fujiBody = new THREE.Mesh(new THREE.ConeGeometry(420, 300, 48), fujiMat);
fujiBody.position.y = 150;
fujiGroup.add(fujiBody);

// Snow cap — cone sitting at the summit
const snowCap = new THREE.Mesh(new THREE.ConeGeometry(75, 96, 32), snowMat);
snowCap.position.y = 265;
fujiGroup.add(snowCap);

// Snow skirt — flattened ring just below the cap for realistic snow line
const snowSkirt = new THREE.Mesh(new THREE.CylinderGeometry(110, 80, 18, 32), snowMat);
snowSkirt.position.y = 210;
fujiGroup.add(snowSkirt);

fujiGroup.position.set(-200, -140, -800);
scene.add(fujiGroup);

// ── Skyscrapers ──────────────────────────────────────────────
const skyColors = [0x0c1522, 0x101828, 0x0e1620, 0x131e2c, 0x0a1420];

function makeBuilding(x, z, w, d, h) {
  const group   = new THREE.Group();
  const cols    = Math.max(3, Math.floor(w / 7));
  const rows    = Math.max(4, Math.floor(h / 10));
  const wt      = windowTex(cols, rows);
  const pick    = () => skyColors[Math.floor(Math.random() * skyColors.length)];
  const winMat  = new THREE.MeshStandardMaterial({
    color: pick(), emissiveMap: wt, emissive: 0xffffff,
    emissiveIntensity: 0.85, roughness: 0.6, metalness: 0.3,
  });
  const sideMat = new THREE.MeshStandardMaterial({ color: pick(), roughness: 0.85, metalness: 0.2 });

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
  // Left/centre — still shows even though text is left
  [-40, -80, 34, 28, 95],  [-85, -55, 30, 24, 72],  [-25, -140, 40, 34, 80],
  [-120, 20, 28, 22, 58],  [-70, -150, 36, 28, 105],
  // Right cluster around tower & Skytree
  [160, -70, 42, 36, 138], [210, -55, 38, 30, 100], [140, -140, 44, 36, 85],
  [230, 14, 34, 26, 70],   [175, -155, 40, 34, 112], [240, -115, 55, 42, 158],
  // Centre back
  [60, -160, 52, 44, 96],  [20, -200, 38, 32, 120],  [100, -190, 42, 34, 108],
  // Far ring
  [-200, -140, 65, 50, 175], [280, -130, 60, 48, 165], [-175, -230, 52, 40, 138],
  [265, -220, 56, 44, 155],  [60, -280, 75, 55, 90],   [-90, -260, 46, 36, 128],
  [155, -265, 48, 38, 125],  [-270, -80, 68, 52, 135], [345, -70, 65, 50, 145],
  // Near sides
  [-50, 65, 28, 22, 60],   [170, 60, 30, 24, 65],
  [-30, 90, 26, 20, 50],   [190, 85, 28, 22, 55],
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
    camera.position.x += (mx * 35 - 20 - camera.position.x) * 0.035;
    camera.position.y += (-my * 20 + 55 - camera.position.y) * 0.035;
    camera.position.x += Math.sin(t * 0.18) * 0.05;
  }

  camera.lookAt(100, 130, -40);

  // Tower heartbeat
  towerGlow.intensity  = 3.0 + Math.sin(t * 1.1)  * 0.6;
  // Skytree slower pulse
  skytreeGlow.intensity = 1.8 + Math.sin(t * 0.7) * 0.4;

  renderer.render(scene, camera);
}

tick();
