// Floor 1 open-world chunk: comic-ink environment pipeline from scene.js plus the Undercroft level.
import * as THREE from './node_modules/three/build/three.module.js';
import { makeGoblin } from './creature.js';
import { martaVance, pickles } from './npcs/floor1to3.js';
import { sergeantPylon } from './monsters/bosses1.js';

const W = 1440, H = 810;
const DPR = window.devicePixelRatio || 1;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(DPR);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);

// deterministic random
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2b1e33');
scene.fog = new THREE.Fog('#2b1e33', 14, 46);

const camera = new THREE.PerspectiveCamera(62, W / H, 0.05, 120);
camera.position.set(0, 1.7, 4.6);
camera.lookAt(0.3, 1.45, -6);
scene.add(camera);

// 3-band toon ramp
function ramp(steps) {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => { data.set([v, v, v, 255], i * 4); });
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const RAMP = ramp([70, 150, 255]);
const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: RAMP, ...opts });

// hand-painted textures with baked ink lines
function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function inkLine(g, x1, y1, x2, y2, wdt) {
  g.lineWidth = wdt; g.beginPath(); g.moveTo(x1, y1);
  const mx = (x1 + x2) / 2 + (rnd() - 0.5) * 6, my = (y1 + y2) / 2 + (rnd() - 0.5) * 6;
  g.quadraticCurveTo(mx, my, x2, y2); g.stroke();
}
const brickTex = (base, rep) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const rows = 8, bh = h / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * 64;
    for (let x = -off; x < w; x += 128) {
      const l = 0.75 + rnd() * 0.4;
      g.fillStyle = `hsl(${270 + rnd() * 20}, 18%, ${24 * l}%)`;
      g.fillRect(x + 4, r * bh + 4, 120, bh - 8);
      // painted highlight band on top of each brick
      g.fillStyle = 'rgba(255,230,200,0.10)'; g.fillRect(x + 8, r * bh + 6, 110, 8);
      g.strokeStyle = '#120c16';
      for (let k = 0; k < 2; k++) if (rnd() < 0.5) {
        const sx = x + 10 + rnd() * 100, sy = r * bh + 10 + rnd() * (bh - 20);
        inkLine(g, sx, sy, sx + (rnd() - 0.5) * 40, sy + (rnd() - 0.5) * 30, 2);
      }
    }
    g.strokeStyle = '#0d0b12';
    inkLine(g, 0, r * bh, w, r * bh, 6);
    for (let x = -off; x < w + 128; x += 128) inkLine(g, x, r * bh, x, r * bh + bh, 5);
  }
  // hatching strokes in corners
  g.strokeStyle = 'rgba(13,11,18,0.55)';
  for (let i = 0; i < 70; i++) {
    const x = rnd() * w, y = rnd() * h;
    for (let j = 0; j < 4; j++) inkLine(g, x + j * 6, y, x + j * 6 + 14, y - 14, 1.6);
  }
}, rep);
const floorTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5a4433'; g.fillRect(0, 0, w, h);
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = `hsl(${24 + rnd() * 10}, 28%, ${22 + rnd() * 10}%)`;
    g.fillRect(i * s + 5, j * s + 5, s - 10, s - 10);
    g.strokeStyle = '#120c16';
    if (rnd() < 0.6) inkLine(g, i * s + rnd() * s, j * s + rnd() * s, i * s + rnd() * s, j * s + rnd() * s, 2.5);
  }
  g.strokeStyle = '#0d0b12';
  for (let i = 0; i <= n; i++) { inkLine(g, i * s, 0, i * s, h, 7); inkLine(g, 0, i * s, w, i * s, 7); }
  g.strokeStyle = 'rgba(13,11,18,0.5)';
  for (let i = 0; i < 90; i++) { const x = rnd() * w, y = rnd() * h; inkLine(g, x, y, x + 12, y + 12, 1.5); }
}, [4, 20]);
const woodTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8a5a32'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = `hsl(28, 45%, ${30 + rnd() * 10}%)`; g.fillRect(0, i * 64 + 4, w, 56);
    g.strokeStyle = '#0d0b12'; inkLine(g, 0, i * 64, w, i * 64, 6);
    g.strokeStyle = 'rgba(13,11,18,0.6)';
    for (let k = 0; k < 3; k++) { const y = i * 64 + 12 + rnd() * 40; inkLine(g, rnd() * 40, y, w - rnd() * 40, y + (rnd() - 0.5) * 8, 1.5); }
  }
  g.strokeStyle = '#0d0b12'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.lineWidth = 12; g.stroke();
});

// --- outline + hatching post-process ---
const rtOpts = { type: THREE.HalfFloatType, samples: 4 };
const colorRT = new THREE.WebGLRenderTarget(W * DPR, H * DPR, rtOpts);
colorRT.depthTexture = new THREE.DepthTexture(W * DPR, H * DPR);
const normalRT = new THREE.WebGLRenderTarget(W * DPR, H * DPR, { type: THREE.HalfFloatType });
normalRT.depthTexture = new THREE.DepthTexture(W * DPR, H * DPR);
const normalMat = new THREE.MeshNormalMaterial();

const post = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: colorRT.texture }, tNormal: { value: normalRT.texture }, tDepth: { value: normalRT.depthTexture },
    res: { value: new THREE.Vector2(W * DPR, H * DPR) }, px: { value: 2.0 * DPR },
    near: { value: camera.near }, far: { value: camera.far },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    uniform sampler2D tColor, tNormal, tDepth; uniform vec2 res; uniform float px, near, far;
    varying vec2 vUv;
    float lin(vec2 uv){ float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return (2.0*near*far)/(far+near - z*(far-near)); }
    void main(){
      vec2 o = px / res;
      float d = lin(vUv);
      float dl = lin(vUv - vec2(o.x,0.)), dr = lin(vUv + vec2(o.x,0.)), du = lin(vUv + vec2(0.,o.y)), dd = lin(vUv - vec2(0.,o.y));
      float dEdge = abs(dl + dr + du + dd - 4.0*d) / max(d, 0.5);
      vec3 n = texture2D(tNormal, vUv).xyz;
      vec3 nl = texture2D(tNormal, vUv - vec2(o.x,0.)).xyz, nr = texture2D(tNormal, vUv + vec2(o.x,0.)).xyz;
      vec3 nu = texture2D(tNormal, vUv + vec2(0.,o.y)).xyz, nd = texture2D(tNormal, vUv - vec2(0.,o.y)).xyz;
      float nEdge = length(nl - nr) + length(nu - nd);
      float edge = max(smoothstep(0.025, 0.07, dEdge), smoothstep(0.45, 0.9, nEdge));
      // second ring for a thicker, brushy line
      vec2 o2 = o * 1.8;
      float d2 = abs(lin(vUv - vec2(o2.x,0.)) + lin(vUv + vec2(o2.x,0.)) + lin(vUv + vec2(0.,o2.y)) + lin(vUv - vec2(0.,o2.y)) - 4.0*d) / max(d, 0.5);
      edge = max(edge, smoothstep(0.06, 0.16, d2) * 0.9);
      edge *= 1.0 - smoothstep(22.0, 45.0, d) * 0.5;
      vec4 c = texture2D(tColor, vUv);
      vec3 col = c.rgb;
      // ink hatching in shadow
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      vec2 p = vUv * res / ${'${DPR}'.replace('${DPR}', '1.0')};
      float hatch = step(0.82, fract((p.x + p.y) / (5.0 * px)));
      float hatch2 = step(0.85, fract((p.x - p.y) / (6.0 * px)));
      float shade = (1.0 - smoothstep(0.035, 0.07, lum)) * hatch + (1.0 - smoothstep(0.015, 0.035, lum)) * hatch2;
      // (screen hatching removed: hatching lives in the painted textures)
      // slight saturation punch
      float g = dot(col, vec3(0.333));
      col = mix(vec3(g), col, 1.12);
      col = mix(col, vec3(0.003,0.002,0.004), edge);
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
const postScene = new THREE.Scene(); postScene.add(quad);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// =====================================================================
// FLOOR 1 — THE UNDERCROFT: an open-world chunk of the parking-garage floor.
// 360 m x 360 m slice around Stairwell Camp, with Pylon Point and three landmarks.
// =====================================================================
const q = new URLSearchParams(location.search);
const VIEW = q.get('view') || 'ground';
scene.background = new THREE.Color('#1c1622');
scene.fog = new THREE.Fog('#1c1622', 18, 150);
camera.far = 600; camera.updateProjectionMatrix();
const SIZE = 360, CEIL = 9.5, GRID = 10;
const seeded = (i, k = 1) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
const inZone = (x, z) => {
  if (Math.hypot(x, z) < 26) return 'camp';
  if (Math.hypot(x - 75, z + 62) < 24) return 'pylon';
  if (Math.hypot(x + 92, z - 40) < 16) return 'spiral';
  if (Math.hypot(x - 42, z - 74) < 12) return 'bus';
  return null;
};

// ---------- concrete floor with painted bays ----------
const bayTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5a5654'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? 20 : 120},${rnd() < 0.5 ? 18 : 115},${rnd() < 0.5 ? 16 : 110},${rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 20, 2 + rnd() * 20); }
  for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(20,16,12,${0.15 + rnd() * 0.25})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); } // oil stains
  g.strokeStyle = '#e8dca0'; g.lineWidth = 7; for (let x = 0; x <= w; x += w / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * 0.42); g.moveTo(x, h * 0.58); g.lineTo(x, h); g.stroke(); }
  g.fillStyle = '#e8dca0'; g.font = 'bold 40px sans-serif'; for (let i = 0; i < 4; i++) g.fillText('B' + (i + 1), i * w / 4 + 30, 60);
  g.strokeStyle = '#0d0b12'; for (let i = 0; i < 14; i++) { const x = rnd() * w, y = rnd() * h; inkLine(g, x, y, x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 70, 2); } // short cracks
}, [SIZE / 20, SIZE / 20]);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon('#ffffff', { map: bayTex })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const ceilTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a3638'; g.fillRect(0, 0, w, h); g.strokeStyle = '#0d0b12'; for (let i = 0; i <= 4; i++) { inkLine(g, i * 64, 0, i * 64, h, 6); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.2})`; g.fillRect(rnd() * w, rnd() * h, 4, 4); } }, [SIZE / 10, SIZE / 10]);
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon('#ffffff', { map: ceilTex })); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = CEIL; scene.add(ceiling);

// ---------- pillar forest (the reason you get lost) ----------
const pillarTex = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#7a7470'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 10, 3 + rnd() * 10); } g.fillStyle = '#e8c020'; for (let y = h * 0.82; y < h; y += 26) { for (let x = -40; x < w; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.lineTo(x + 40, y + 20); g.lineTo(x + 20, y + 20); g.fill(); } } g.fillStyle = '#2a5ac8'; g.fillRect(40, h * 0.3, w - 80, 110); g.fillStyle = '#f0f0f0'; g.font = 'bold 72px sans-serif'; g.fillText('B' + (1 + Math.floor(rnd() * 9)), 80, h * 0.3 + 84); g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); });
const pGeo = new THREE.BoxGeometry(1.1, CEIL, 1.1), pMat = toon('#ffffff', { map: pillarTex }); // one shared texture keeps the instanced draw cheap
const pillarPos = [];
for (let x = -SIZE / 2 + 5; x < SIZE / 2; x += GRID) for (let z = -SIZE / 2 + 5; z < SIZE / 2; z += GRID) { if (inZone(x, z)) continue; pillarPos.push([x, z]); }
const pillars = new THREE.InstancedMesh(pGeo, pMat, pillarPos.length); const dm = new THREE.Object3D();
pillarPos.forEach(([x, z], i) => { dm.position.set(x, CEIL / 2, z); dm.rotation.set(0, 0, 0); dm.updateMatrix(); pillars.setMatrixAt(i, dm.matrix); }); scene.add(pillars);
// ceiling beams
const beamMat = toon('#5a5456');
for (let x = -SIZE / 2 + 5; x < SIZE / 2; x += GRID * 2) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, SIZE), beamMat); b.position.set(x, CEIL - 0.45, 0); scene.add(b); }

// ---------- sodium lights: emissive strips everywhere, a few real lights near the action ----------
const lampOn = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb24a').multiplyScalar(2.2) });
const lampOff = new THREE.MeshBasicMaterial({ color: '#4a4030' });
const lampGeo = new THREE.BoxGeometry(1.6, 0.12, 0.4);
const onPos = [], offPos = [];
for (let x = -SIZE / 2 + 10; x < SIZE / 2; x += GRID) for (let z = -SIZE / 2 + 10; z < SIZE / 2; z += GRID) (seeded(x * 3 + z, 4) > 0.35 ? onPos : offPos).push([x, z]);
for (const [arr, mat] of [[onPos, lampOn], [offPos, lampOff]]) { const im = new THREE.InstancedMesh(lampGeo, mat, arr.length); arr.forEach(([x, z], i) => { dm.position.set(x, CEIL - 0.15, z); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); scene.add(im); }
scene.add(new THREE.HemisphereLight('#c8a878', '#2a2028', 1.1));
const key = new THREE.DirectionalLight('#ffcf8a', 0.7); key.position.set(30, 60, 20); scene.add(key);
const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };

// ---------- abandoned cars (instanced, colour varieties) ----------
const carColors = ['#a8281e', '#2a4aa0', '#d8d0c0', '#2a2a2e', '#3a7a4a', '#c8a020', '#7a7a80', '#6a3a8a'];
const carBody = new THREE.BoxGeometry(1.9, 0.75, 4.3); carBody.translate(0, 0.62, 0);
const carCab = new THREE.BoxGeometry(1.7, 0.6, 2.2); carCab.translate(0, 1.27, -0.2);
const carWin = new THREE.BoxGeometry(1.72, 0.42, 2.0); carWin.translate(0, 1.3, -0.2);
const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14); wheelGeo.rotateZ(Math.PI / 2);
const carSlots = [];
for (let x = -SIZE / 2 + 7; x < SIZE / 2 - 5; x += 2.6) for (let z = -SIZE / 2 + 2; z < SIZE / 2; z += GRID) {
  const k = x * 7 + z * 3; if (seeded(k, 1) > 0.42) continue; if (inZone(x, z)) continue;
  const flipped = seeded(k, 2) > 0.93, burnt = seeded(k, 3) > 0.88;
  carSlots.push({ x, z: z + 2.5, ry: Math.PI / 2 * 0 + (seeded(k, 5) - 0.5) * 0.25, col: burnt ? 8 : Math.floor(seeded(k, 6) * carColors.length), flipped });
}
const carMats = [...carColors.map((c) => toon(c)), toon('#2a2220')];
const byCol = carMats.map(() => []); carSlots.forEach((c) => byCol[c.col].push(c));
const winMat = new THREE.MeshPhysicalMaterial({ color: '#1a2a3a', roughness: 0.1, metalness: 0.3, clearcoat: 1 });
const tyre = toon('#141414');
byCol.forEach((list, ci) => {
  if (!list.length) return;
  const body = new THREE.InstancedMesh(carBody, carMats[ci], list.length), cab = new THREE.InstancedMesh(carCab, carMats[ci], list.length), win = new THREE.InstancedMesh(carWin, winMat, list.length);
  list.forEach((c, i) => { dm.position.set(c.x, c.flipped ? 1.9 : 0, c.z); dm.rotation.set(0, c.ry, c.flipped ? Math.PI : 0); dm.updateMatrix(); body.setMatrixAt(i, dm.matrix); cab.setMatrixAt(i, dm.matrix); win.setMatrixAt(i, dm.matrix); });
  scene.add(body, cab, win);
});
const wheels = new THREE.InstancedMesh(wheelGeo, tyre, carSlots.length * 4); let wi = 0;
carSlots.forEach((c) => { for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) { const p = new THREE.Vector3(wx, c.flipped ? 1.6 : 0.36, wz).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.ry); dm.position.set(c.x + p.x, p.y, c.z + p.z); dm.rotation.set(0, c.ry, 0); dm.updateMatrix(); wheels.setMatrixAt(wi++, dm.matrix); } });
wheels.count = wi; scene.add(wheels);

// ---------- scenery: shopping carts, ticket machines, puddles, debris ----------
const steel = toon('#9a9ca0');
for (let i = 0; i < 70; i++) { const x = (seeded(i, 11) - 0.5) * SIZE * 0.9, z = (seeded(i, 12) - 0.5) * SIZE * 0.9; if (inZone(x, z)) continue; const cartG = new THREE.Group(); const basket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.9, 3, 3, 4), new THREE.MeshBasicMaterial({ color: '#8a8c90', wireframe: true })); basket.position.y = 0.75; cartG.add(basket); const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), steel); handle.rotation.z = Math.PI / 2; handle.position.set(0, 1.05, -0.5); cartG.add(handle); for (const [cx, cz] of [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), tyre); w.rotation.z = Math.PI / 2; w.position.set(cx, 0.06, cz); cartG.add(w); } cartG.position.set(x, 0, z); cartG.rotation.y = seeded(i, 13) * 6; if (seeded(i, 14) > 0.7) { cartG.rotation.z = Math.PI / 2; cartG.position.y = 0.3; } scene.add(cartG); }
const ticketTex = canvasTex(128, 256, (g) => { g.fillStyle = '#c8a020'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#0d0b12'; g.fillRect(14, 30, 100, 60); g.fillStyle = '#3affea'; g.font = 'bold 16px monospace'; g.fillText('RIDDLE?', 24, 66); g.fillStyle = '#0d0b12'; g.fillRect(40, 120, 48, 10); g.font = 'bold 20px sans-serif'; g.fillText('PAY HERE', 14, 200); });
for (let i = 0; i < 14; i++) { const x = (seeded(i, 21) - 0.5) * SIZE * 0.8, z = (seeded(i, 22) - 0.5) * SIZE * 0.8; if (inZone(x, z)) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.5), toon('#ffffff', { map: ticketTex })); m.position.set(x, 0.8, z); m.rotation.y = seeded(i, 23) * 6; scene.add(m); }
const water = new THREE.MeshPhysicalMaterial({ color: '#1a3038', roughness: 0.03, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.85 });
for (const [x, z, rx, rz] of [[-60, -30, 22, 14], [30, 30, 10, 6], [-20, 90, 30, 18], [110, 20, 18, 26], [-120, -90, 26, 20], [10, -110, 14, 9]]) { const w = new THREE.Mesh(new THREE.CircleGeometry(1, 40), water); w.rotation.x = -Math.PI / 2; w.scale.set(rx, rz, 1); w.position.set(x, 0.03, z); scene.add(w); }
const debris = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.25, 0), toon('#6a6460'), 500);
for (let i = 0; i < 500; i++) { dm.position.set((seeded(i, 31) - 0.5) * SIZE, 0.1, (seeded(i, 32) - 0.5) * SIZE); dm.rotation.set(seeded(i, 33) * 6, seeded(i, 34) * 6, 0); dm.scale.setScalar(0.3 + seeded(i, 35) * 1.4); dm.updateMatrix(); debris.setMatrixAt(i, dm.matrix); } scene.add(debris); dm.scale.setScalar(1);

// ---------- STAIRWELL CAMP (hub town) ----------
const camp = new THREE.Group(); scene.add(camp);
// the stairwell tower in the middle: the only way down, locked until the floor boss falls
const stairTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#8a8480'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 4 + rnd() * 10, 4 + rnd() * 10); } g.strokeStyle = '#0d0b12'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); g.fillStyle = '#c81a1a'; g.font = 'bold 54px sans-serif'; g.fillText('STAIRWELL', 110, 120); g.fillStyle = '#2a2a2a'; g.fillRect(180, 260, 150, 252); g.strokeRect(180, 260, 150, 252); g.fillStyle = '#f0f0f0'; g.font = 'bold 30px sans-serif'; g.fillText('LOCKED', 196, 380); });
const tower = new THREE.Mesh(new THREE.BoxGeometry(8, CEIL, 8), toon('#ffffff', { map: stairTex })); tower.position.y = CEIL / 2; camp.add(tower);
const exitSign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 96, (g) => { g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#5aff7a'; g.font = 'bold 70px sans-serif'; g.fillText('EXIT', 50, 76); }), color: new THREE.Color(1.8, 1.8, 1.8) })); exitSign.position.set(0, 6.5, 4.15); camp.add(exitSign);
pl('#5aff7a', 6, 14, 0, 6, 6);
// a ring of tents, cookfire, market stalls, barricade of cars
const tentCols = ['#8a3a2a', '#3a6a4a', '#c8a050', '#4a5a8a', '#7a4a6a', '#a87a3a', '#5a7a7a'];
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2 + 0.1, r = 11 + (i % 3) * 3.2; if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0) continue; // keep the entrance open
  const t = new THREE.Group(); const col = tentCols[i % tentCols.length];
  const tentTex = canvasTex(128, 128, (g) => { g.fillStyle = col; g.fillRect(0, 0, 128, 128); for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.2})`; g.fillRect(rnd() * 128, rnd() * 128, 6 + rnd() * 20, 4 + rnd() * 10); } g.fillStyle = 'rgba(255,240,200,0.25)'; g.fillRect(40, 40, 30, 24); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128); });
  const body = new THREE.Mesh(new THREE.ConeGeometry(2.0 + seeded(i, 41), 2.4 + seeded(i, 42) * 0.8, 4), toon('#ffffff', { map: tentTex })); body.position.y = 1.25; body.rotation.y = Math.PI / 4; t.add(body);
  t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.y = -a; camp.add(t);
}
const fire = new THREE.Group(); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6), toon('#4a2a1a')); l.rotation.set(Math.PI / 2, (i / 6) * Math.PI, 0.3); l.position.y = 0.15; fire.add(l); }
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa020').multiplyScalar(2.5) })); flame.position.y = 0.8; fire.add(flame);
const fcore = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff0a0').multiplyScalar(3) })); fcore.position.y = 0.6; fire.add(fcore);
fire.position.set(9, 0, 3); camp.add(fire); pl('#ff9a3a', 30, 22, 9, 2.5, 3);
const stallTex = (txt, c) => canvasTex(256, 96, (g) => { g.fillStyle = c; g.fillRect(0, 0, 256, 96); g.fillStyle = '#f4eedc'; g.font = 'bold 40px sans-serif'; g.fillText(txt, 14, 62); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 96); });
for (const [x, z, ry, txt, c] of [[14, -6, -0.4, "PICKLES' JUNK", '#5a1a10'], [16, 9, 0.6, 'WATER 2c', '#1a4a6a'], [-14, 10, 2.4, 'MED TENT', '#8a1a1a'], [-6, -16, -2.6, 'INN', '#3a2a5a']]) {
  const s = new THREE.Group(); const counter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 1.2), toon('#ffffff', { map: woodTex })); counter.position.y = 0.5; s.add(counter);
  for (const sx of [-1.6, 1.6]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), toon('#4a3020')); post.position.set(sx, 1.3, -0.5); s.add(post); }
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 1.8), toon(c)); awning.position.set(0, 2.6, 0); awning.rotation.x = 0.2; s.add(awning);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: stallTex(txt, c) })); sign.position.set(0, 3.1, 0.6); s.add(sign);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd080').multiplyScalar(3) })); lamp.position.set(1.4, 2.4, 0.6); s.add(lamp);
  s.position.set(x, 0, z); s.rotation.y = ry; camp.add(s);
}
pl('#ffd080', 10, 14, 15, 2.6, -4); pl('#ffd080', 10, 14, -13, 2.6, 9);
// barricade ring of tipped cars and scaffolding, with a gate
for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; if (Math.abs(a - 0) < 0.25 || Math.abs(a - Math.PI * 2) < 0.25) continue; const c = new THREE.Group(); const b = new THREE.Mesh(carBody, carMats[i % 8]); const cb = new THREE.Mesh(carCab, carMats[i % 8]); c.add(b, cb); c.position.set(Math.cos(a) * 23.5, 0, Math.sin(a) * 23.5); c.rotation.set(0, -a, i % 3 === 0 ? 1.3 : 0); if (i % 3 === 0) c.position.y = 0.9; camp.add(c); }
const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#F5C518'; g.font = 'bold 60px sans-serif'; g.fillText('STAIRWELL CAMP', 18, 70); }) }));
gate.position.set(24.5, 4.2, 0); gate.rotation.y = -Math.PI / 2; camp.add(gate);
for (const sz of [-3, 3]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 0.3), toon('#4a3020')); p.position.set(24.5, 2.3, sz); camp.add(p); }
// strings of fairy lights over the camp
const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe8a0').multiplyScalar(3) });
for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; for (let i = 1; i < 14; i++) { const t = i / 14; const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), bulb); b.position.set(Math.cos(a) * (4.5 + t * 18), 7.5 - Math.sin(t * Math.PI) * 2.2, Math.sin(a) * (4.5 + t * 18)); camp.add(b); } }
// NPCs at their stalls + campers
const marta = martaVance(); marta.position.set(-12.5, 0, 12.2); marta.rotation.y = 2.4; camp.add(marta);
const pick = pickles(); pick.position.set(13.8, 0, -4.8); pick.rotation.y = -1.2; camp.add(pick);

// ---------- PYLON POINT (goblin encampment) ----------
const PX = 75, PZ = -62;
const pylon = new THREE.Group(); pylon.position.set(PX, 0, PZ); scene.add(pylon);
const coneTex = canvasTex(128, 128, (g) => { g.fillStyle = '#e8590c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#eeeae0'; g.fillRect(0, 45, 128, 18); g.fillRect(0, 80, 128, 12); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128); });
const coneM = toon('#ffffff', { map: coneTex });
const coneGeo = new THREE.ConeGeometry(0.33, 0.9, 12); coneGeo.translate(0, 0.45, 0);
const conePos = [];
for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; if (Math.abs(a - Math.PI) < 0.18) continue; for (let lvl = 0; lvl < 3; lvl++) conePos.push([Math.cos(a) * 19 + (lvl % 2) * 0.2, lvl * 0.75, Math.sin(a) * 19]); } // cone wall
for (const [tx, tz] of [[12, 12], [-12, 12], [12, -12], [-13, -11]]) for (let lvl = 0; lvl < 9; lvl++) for (let k = 0; k < 4; k++) conePos.push([tx + Math.cos(k * 1.57) * 0.8, lvl * 0.75, tz + Math.sin(k * 1.57) * 0.8]); // lookout towers
const cones = new THREE.InstancedMesh(coneGeo, coneM, conePos.length); conePos.forEach(([x, y, z], i) => { dm.position.set(x, y, z); dm.rotation.set(0, i * 0.7, 0); dm.updateMatrix(); cones.setMatrixAt(i, dm.matrix); }); pylon.add(cones);
for (const [tx, tz] of [[12, 12], [-12, 12], [12, -12], [-13, -11]]) { const plat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), toon('#ffffff', { map: woodTex })); plat.position.set(tx, 6.8, tz); pylon.add(plat); }
// crashed cars piled as inner walls, a cone-polishing pit, the sergeant's stage
for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; const c = new THREE.Group(); c.add(new THREE.Mesh(carBody, carMats[(i + 3) % 9]), new THREE.Mesh(carCab, carMats[(i + 3) % 9])); c.position.set(Math.cos(a) * 9, (i % 2) * 1.3, Math.sin(a) * 9); c.rotation.set((i % 2) * 0.4, -a + 1.57, (i % 3) * 0.3); pylon.add(c); }
const stage = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.8, 24), toon('#5a5450')); stage.position.y = 0.4; pylon.add(stage);
const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.4), new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (g) => { g.fillStyle = '#e8590c'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#0d0b12'; g.font = 'bold 76px sans-serif'; g.fillText('PYLON POINT', 30, 92); }), side: THREE.DoubleSide }));
banner.position.set(0, 5.5, -4); pylon.add(banner);
const sarge = sergeantPylon(); sarge.position.set(0, 0.8, 0); sarge.rotation.y = 0.6; pylon.add(sarge);
for (let i = 0; i < 9; i++) { const gob = makeGoblin({ variant: i }); const a = (i / 9) * Math.PI * 2 + 0.4, r = 5 + (i % 3) * 2.5; gob.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); gob.rotation.y = -a - Math.PI / 2 + (i % 2) * 0.8; pylon.add(gob); }
for (const [tx, tz] of [[12, 12], [-12, 12]]) { const gob = makeGoblin({ variant: 7 + tx }); gob.position.set(tx, 6.9, tz); gob.rotation.y = 2.4; pylon.add(gob); }
pl('#ffa040', 22, 30, PX, 5, PZ); const camp2 = new THREE.Group(); { const f2 = fire.clone(); f2.position.set(5, 0, 5); pylon.add(f2); pl('#ff8a2a', 14, 16, PX + 5, 2, PZ + 5); }

// ---------- LANDMARKS ----------
// The Ramp Spiral: a corkscrew ramp tower punching through the ceiling
const SX = -92, SZ = 40;
const rampMat = toon('#ffffff', { map: canvasTex(256, 64, (g) => { g.fillStyle = '#7a7470'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#e8c020'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 26, 16, 10); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 64); }) });
for (let i = 0; i < 90; i++) { const a = i * 0.21, y = i * 0.11; const seg = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 2.6), rampMat); seg.position.set(SX + Math.cos(a) * 9, y, SZ + Math.sin(a) * 9); seg.rotation.y = -a; scene.add(seg); }
const core = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, CEIL + 2, 24), toon('#6a6462')); core.position.set(SX, CEIL / 2, SZ); scene.add(core);
const hole = new THREE.Mesh(new THREE.CircleGeometry(13, 32), new THREE.MeshBasicMaterial({ color: '#06040a' })); hole.rotation.x = Math.PI / 2; hole.position.set(SX, CEIL - 0.02, SZ); scene.add(hole);
pl('#ffb24a', 16, 24, SX + 8, 6, SZ);
// The Burning Bus
const busTex = canvasTex(512, 128, (g) => { g.fillStyle = '#c8a020'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#1a1a1a'; for (let x = 20; x < 500; x += 62) g.fillRect(x, 18, 46, 46); g.fillStyle = '#2a1a10'; for (let i = 0; i < 80; i++) { g.globalAlpha = rnd() * 0.6; g.beginPath(); g.arc(rnd() * 512, rnd() * 128, 6 + rnd() * 20, 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#0d0b12'; g.font = 'bold 30px sans-serif'; g.fillText('SCHOOL BUS', 180, 110); });
const bus = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 11), toon('#ffffff', { map: busTex })); bus.position.set(42, 1.7, 74); bus.rotation.set(0, 0.6, 0.12); scene.add(bus);
for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.4 + seeded(i, 51) * 0.6, 1.6 + seeded(i, 52) * 2.2, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 3 ? '#ff7a1a' : '#ffd040').multiplyScalar(2.6) })); f.position.set(42 + (seeded(i, 53) - 0.5) * 5, 3.6 + seeded(i, 54), 74 + (seeded(i, 55) - 0.5) * 8); scene.add(f); }
pl('#ff7a1a', 50, 40, 42, 5, 74);
const smoke = new THREE.MeshBasicMaterial({ color: '#2a2422', transparent: true, opacity: 0.35, depthWrite: false });
for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1.2 + i * 0.25, 10, 8), smoke); s.position.set(42 + Math.sin(i) * 2, 5 + i * 0.3, 74 - i * 1.8); s.scale.y = 0.5; scene.add(s); }
// The Exit Sign That Never Gets Closer: a colossal glowing sign at the far end of the floor
const bigExit = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 192, (g) => { g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 512, 192); g.fillStyle = '#5aff7a'; g.font = 'bold 150px sans-serif'; g.fillText('EXIT', 80, 160); g.beginPath(); g.moveTo(420, 96); g.lineTo(480, 96); g.lineTo(460, 70); g.moveTo(480, 96); g.lineTo(460, 122); g.strokeStyle = '#5aff7a'; g.lineWidth = 16; g.stroke(); }), color: new THREE.Color(2, 2, 2), fog: false }));
bigExit.position.set(0, CEIL - 5, -SIZE / 2 + 2); scene.add(bigExit);
const farWall = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, CEIL), toon('#3a3436')); farWall.position.set(0, CEIL / 2, -SIZE / 2); scene.add(farWall);

// ---------- views ----------
const VIEWS = {
  ground: { p: [60, 1.75, 10], t: [-100, 3.0, 8] },
  camp: { p: [27, 3.4, 4], t: [0, 2.6, 0] },
  overlook: { p: [-80, 5.2, 33], t: [0, 1.5, -5] },
  pylon: { p: [PX - 22, 3.6, PZ + 15], t: [PX, 2.4, PZ] },
  bus: { p: [15, 2.0, 58], t: [42, 3.0, 74] },
  lost: { p: [-130, 1.7, -120], t: [0, 4.0, -180] },
};
const V = VIEWS[VIEW]; camera.position.set(...V.p); camera.lookAt(...V.t); camera.fov = VIEW === 'overlook' ? 70 : 62; camera.updateProjectionMatrix();

renderer.setRenderTarget(colorRT); renderer.render(scene, camera);
scene.overrideMaterial = normalMat; const fogSave = scene.fog; scene.fog = null;
renderer.setRenderTarget(normalRT); renderer.render(scene, camera);
scene.overrideMaterial = null; scene.fog = fogSave;
renderer.setRenderTarget(null); renderer.render(postScene, postCam);
window.__ready = true;
