import * as THREE from './node_modules/three/build/three.module.js';
import { makeGoblin } from './creature.js';

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

// corridor
const L = 50;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, L), toon('#ffffff', { map: floorTex }));
floor.rotation.x = -Math.PI / 2; floor.position.z = -L / 2 + 8; scene.add(floor);
const wallMat = toon('#ffffff', { map: brickTex('#3a2c45', [10, 2]) });
for (const sx of [-1, 1]) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, L), wallMat);
  wall.position.set(sx * 4.3, 2.5, -L / 2 + 8); scene.add(wall);
}
const ceil = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, L), toon('#ffffff', { map: brickTex('#2c2236', [2, 10]) }));
ceil.position.set(0, 5.2, -L / 2 + 8); scene.add(ceil);
const end = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 0.5), wallMat);
end.position.set(0, 2.5, -L + 8); scene.add(end);

// pillars, arches, torches
const stoneMat = toon('#ffffff', { map: brickTex('#4a3d55', [1, 3]) });
for (let z = 2; z > -36; z -= 7) {
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5, 0.9), stoneMat);
    p.position.set(sx * 3.75, 2.5, z); scene.add(p);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), toon('#5c4f66'));
    cap.position.set(sx * 3.75, 0.18, z); scene.add(cap);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 0.9), stoneMat);
  beam.position.set(0, 4.75, z); scene.add(beam);
  if (z < 0) {
    const sx = (Math.round(z / 7) % 2) ? 1 : -1;
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8), toon('#2a2a2a'));
    bracket.position.set(sx * 3.25, 2.6, z + 0.6); bracket.rotation.z = sx * 0.5; scene.add(bracket);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8), new THREE.MeshBasicMaterial({ color: '#ffb02e' }));
    flame.position.set(sx * 3.1, 3.05, z + 0.6); scene.add(flame);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 8), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
    core.position.set(sx * 3.1, 2.98, z + 0.6); scene.add(core);
    const light = new THREE.PointLight('#ff8a2a', 26, 11, 1.6);
    light.position.set(sx * 2.9, 3.0, z + 0.8); scene.add(light);
  }
}

scene.add(new THREE.HemisphereLight('#8f7fb8', '#3a2418', 0.9));
const key = new THREE.DirectionalLight('#ffd9a8', 1.1); key.position.set(3, 6, 4); scene.add(key);

// props
const crate = (x, y, z, s, r) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), toon('#ffffff', { map: woodTex }));
  m.position.set(x, y + s / 2, z); m.rotation.y = r; scene.add(m); return m;
};
crate(2.9, 0, -2.2, 1.1, 0.3); crate(2.95, 1.1, -2.3, 0.75, -0.2); crate(-3.0, 0, -9.0, 0.9, 0.1);
crate(3.0, 0, -13, 1.0, 0.5);
const barrel = (x, z) => {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 1.1, 14), toon('#7a4a2a'));
  b.position.set(x, 0.55, z); scene.add(b);
  for (const y of [0.2, 0.9]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.04, 6, 18), toon('#3a3a3a')); r.rotation.x = Math.PI / 2; r.position.set(x, y, z); scene.add(r); }
};
barrel(3.0, -4.6); barrel(2.3, -5.2); barrel(-3.0, -15);
// bones
for (let i = 0; i < 6; i++) {
  const bone = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.5, 4, 8), toon('#e9e1c8'));
  bone.position.set(-1.5 + rnd() * 3, 0.06, -4 - rnd() * 6); bone.rotation.set(Math.PI / 2, 0, rnd() * 3); scene.add(bone);
}
const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), toon('#e9e1c8'));
skull.position.set(1.4, 0.16, -6.5); scene.add(skull);

// goblin with traffic-cone helmet
function goblin(x, z, s, ry) {
  const g = new THREE.Group();
  const skin = toon('#7fbf3f'), dark = toon('#4f7f25');
  const legs = [-0.22, 0.22].map(dx => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 8), dark); l.position.set(dx, 0.4, 0); return l; });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.55, 6, 12), skin); body.position.y = 1.15; body.scale.set(1.1, 1, 0.85);
  const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.5, 0.5, 12), toon('#9c4a24')); vest.position.y = 1.0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), skin); head.position.y = 1.95; head.scale.set(1.1, 0.95, 1);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.3), dark); jaw.position.set(0, 1.74, 0.28);
  for (const dx of [-0.13, 0.13]) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), toon('#fff6dc')); t.position.set(dx, 1.88, 0.42); g.add(t); }
  const ears = [-1, 1].map(sx => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), skin); e.position.set(sx * 0.5, 2.02, 0); e.rotation.z = -sx * 1.25; return e; });
  const eyes = [-0.15, 0.15].map(dx => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd400' })); e.position.set(dx, 2.0, 0.37); return e; });
  const pupils = [-0.15, 0.15].map(dx => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#0d0b12' })); e.position.set(dx, 2.0, 0.44); return e; });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.75, 16), toon('#ff6a10')); cone.position.y = 2.55; cone.rotation.z = 0.15;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.25, 0.14, 16), toon('#ffffff')); stripe.position.set(-0.03, 2.55, 0); stripe.rotation.z = 0.15;
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), toon('#ff6a10')); brim.position.y = 2.2; brim.rotation.z = 0.15;
  const arms = [-1, 1].map(sx => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), skin); a.position.set(sx * 0.6, 1.2, 0.15); a.rotation.set(-0.6, 0, sx * 0.5); return a; });
  const club = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.1, 8), toon('#7a4a2a')); shaft.position.y = 0.4;
  const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.4, 8), toon('#8a5a32')); nail.position.y = 0.95;
  club.add(shaft, nail); club.position.set(0.85, 1.0, 0.4); club.rotation.set(-0.7, 0, -0.6);
  g.add(...legs, body, vest, head, jaw, ...ears, ...eyes, ...pupils, cone, stripe, brim, ...arms, club);
  g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = ry; scene.add(g); return g;
}
const place = (x, z, s, ry) => { const g = makeGoblin(); g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = ry; scene.add(g); return g; };
place(0.35, 1.7, 1.15, -0.25);
place(-1.6, -6.5, 1.1, 0.45);
place(1.7, -11, 1.05, -0.5);
// cool rim light so the creatures separate from the warm corridor
const rim = new THREE.DirectionalLight('#8fb4ff', 1.6); rim.position.set(-2, 3, -6); scene.add(rim);
const faceLight = new THREE.SpotLight('#ffd2a8', 14, 7, 0.5, 0.6, 1.4); faceLight.position.set(1.4, 2.8, 4.2); faceLight.target.position.set(0.35, 1.5, 1.7); scene.add(faceLight, faceLight.target);

// loot chest + beam
const chest = new THREE.Group();
const cbase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.75), toon('#ffffff', { map: woodTex }));
cbase.position.y = 0.3;
const lid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.75), toon('#a06cf0')); lid.position.set(0, 0.85, -0.3); lid.rotation.x = -1.1;
const lock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.06), toon('#f5c518')); lock.position.set(0, 0.5, 0.39);
chest.add(cbase, lid, lock); chest.position.set(-2.3, 0, -6.2); chest.rotation.y = 0.6; scene.add(chest);
const beamMat = new THREE.MeshBasicMaterial({ color: '#b07cff', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
const lootBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 6, 16, 1, true), beamMat);
lootBeam.position.set(-2.3, 3.3, -6.2); scene.add(lootBeam);
const chestLight = new THREE.PointLight('#a06cf0', 14, 5, 1.5); chestLight.position.set(-2.1, 1.2, -5.8); scene.add(chestLight);

// first-person arm + forged pipe wrench (PBR)
const scratchTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#8a8d92'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd() < 0.6 ? 40 : 200},${rnd() < 0.6 ? 34 : 200},${rnd() < 0.6 ? 30 : 205},${rnd() * 0.25})`; g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 30, 1 + rnd() * 1.5); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(110,50,20,${0.2 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * 512, rnd() * 512, 3 + rnd() * 18, 0, 7); g.fill(); } // rust
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const steel = new THREE.MeshPhysicalMaterial({ map: scratchTex, metalness: 0.9, roughness: 0.38, clearcoat: 0.2 });
const redPaint = new THREE.MeshPhysicalMaterial({ color: '#8c1c14', roughness: 0.5, clearcoat: 0.5, map: scratchTex });
const gloveMat = new THREE.MeshPhysicalMaterial({ color: '#4a3424', roughness: 0.75, sheen: 0.4, sheenColor: new THREE.Color('#8a6a50') });
const sleeveMat = new THREE.MeshPhysicalMaterial({ color: '#2c3a52', roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color('#5a6a8a') });
const fp = new THREE.Group();
const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.6, 20), sleeveMat); sleeve.rotation.x = Math.PI / 2 - 0.2; sleeve.position.set(0, -0.07, 0.34);
const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 10, 24), gloveMat); cuff.position.set(0, -0.035, 0.08); cuff.rotation.x = -0.2;
const fist = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 18), gloveMat); fist.scale.set(1.0, 0.95, 1.25); fist.position.set(0, 0, -0.02);
fp.add(sleeve, cuff, fist);
for (let i = 0; i < 4; i++) { const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.05, 6, 10), gloveMat); k.rotation.z = Math.PI / 2; k.position.set(-0.035, 0.035 - i * 0.026, -0.075); fp.add(k); }
const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.05, 6, 10), gloveMat); thumb.position.set(0.05, 0.03, -0.06); thumb.rotation.set(0.4, 0, -0.6); fp.add(thumb);
const wrench = new THREE.Group();
const handle = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.5, 0.022), redPaint); handle.position.y = 0.05;
const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 16), steel); shank.position.y = 0.38;
const nut = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.009, 10, 20), steel); nut.rotation.x = Math.PI / 2; nut.position.y = 0.36;
const hook = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.03), steel); hook.position.set(0.035, 0.49, 0);
const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.035, 0.028), steel); jaw.position.set(0.045, 0.42, 0);
for (let i = 0; i < 4; i++) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.03), steel); tooth.position.set(0.06 + i * 0.012, 0.462, 0); wrench.add(tooth); }
const blood = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshPhysicalMaterial({ color: '#3a0805', roughness: 0.2, clearcoat: 1 })); blood.scale.set(2, 0.6, 0.6); blood.position.set(0.04, 0.5, 0.012);
wrench.add(handle, shank, nut, hook, jaw, blood); wrench.position.set(0, -0.02, -0.03); wrench.rotation.x = -0.15;
fp.add(wrench);
fp.scale.setScalar(0.72); fp.position.set(0.33, -0.27, -0.5); fp.rotation.set(0.25, -0.35, -0.42); camera.add(fp);

// reflections for PBR materials (toon materials ignore this)
const envScene = new THREE.Scene(); envScene.background = new THREE.Color('#1a1222');
for (const [x, z] of [[-3, -2], [3, -5], [2, 4]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff8a2a').multiplyScalar(6) })); p.position.set(x, 1.5, z); envScene.add(p); }
const top = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: '#3a3058', side: THREE.DoubleSide })); top.position.y = 4; top.rotation.x = Math.PI / 2; envScene.add(top);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.04).texture;

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

function frame() {
  renderer.setRenderTarget(colorRT); renderer.render(scene, camera);
  lootBeam.visible = false; scene.overrideMaterial = normalMat; const fog = scene.fog; scene.fog = null;
  renderer.setRenderTarget(normalRT); renderer.render(scene, camera);
  scene.overrideMaterial = null; scene.fog = fog; lootBeam.visible = true;
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
frame();
window.__ready = true;
