// Boss fight demo (Ulti-Max): environment and ink-outline pipeline from scene.js, plus a timeline-driven fight.
import * as THREE from './node_modules/three/build/three.module.js';
import { ultiMax } from './monsters/ultimax.js';

const W = 1280, H = 720;
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

const scratchTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#8a8d92'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd() < 0.6 ? 40 : 200},${rnd() < 0.6 ? 34 : 200},${rnd() < 0.6 ? 30 : 205},${rnd() * 0.25})`; g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 30, 1 + rnd() * 1.5); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(110,50,20,${0.2 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * 512, rnd() * 512, 3 + rnd() * 18, 0, 7); g.fill(); } // rust
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
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

// =====================================================================
// COMBAT DEMO: first-person sword vs. a Cave Troll, driven by a timeline.
// window.renderAt(t) renders the exact frame for time t (seconds).
// =====================================================================
camera.position.set(0, 1.7, 4.6);
const CAM0 = camera.position.clone();
const LOOK = new THREE.Vector3(0, 1.9, 0.6);
camera.lookAt(LOOK);
const CAMQ = camera.quaternion.clone();

scene.add(new THREE.DirectionalLight('#8fb4ff', 1.6).translateX(-2).translateY(3).translateZ(-6));
const faceLight = new THREE.SpotLight('#ffd2a8', 22, 9, 0.6, 0.6, 1.3); faceLight.position.set(1.4, 3.4, 4.4); faceLight.target.position.set(0, 1.9, 1.4); scene.add(faceLight, faceLight.target);

// ---------- the player's sword ----------
const swordSteel = new THREE.MeshPhysicalMaterial({ map: scratchTex, metalness: 0.95, roughness: 0.22, clearcoat: 0.4, emissive: new THREE.Color('#ff9a2a'), emissiveIntensity: 0 });
const leather = new THREE.MeshPhysicalMaterial({ color: '#3a2416', roughness: 0.8, sheen: 0.5, sheenColor: new THREE.Color('#7a5a40') });
const brass = new THREE.MeshStandardMaterial({ color: '#b8923a', metalness: 1, roughness: 0.3 });
const sword = new THREE.Group();
{
  const shape = new THREE.Shape(); shape.moveTo(-0.028, 0); shape.lineTo(0.028, 0); shape.lineTo(0.022, 0.86); shape.lineTo(0, 0.95); shape.lineTo(-0.022, 0.86); shape.closePath();
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 2 }), swordSteel); blade.position.set(0, 0.12, -0.004); sword.add(blade);
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.6, 0.018), new THREE.MeshStandardMaterial({ color: '#6a6c70', metalness: 1, roughness: 0.3 })); fuller.position.y = 0.45; sword.add(fuller);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.035), brass); guard.position.y = 0.11; sword.add(guard);
  for (const sx of [-1, 1]) { const q = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), brass); q.position.set(sx * 0.11, 0.11, 0); sword.add(q); }
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.17, 12), leather); grip.position.y = 0.015; sword.add(grip);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 12), brass); pommel.position.y = -0.08; sword.add(pommel);
}
const gauntlet = new THREE.Group();
{
  const steel = new THREE.MeshPhysicalMaterial({ map: scratchTex, metalness: 0.9, roughness: 0.35 });
  // armoured fist wrapped round the grip, with a short cuff running down the forearm (local -y)
  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), steel); fist.scale.set(1.15, 1.25, 1.05); fist.position.y = 0.015; gauntlet.add(fist);
  for (let i = 0; i < 4; i++) { const k = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.03, 4, 8), steel); k.rotation.z = Math.PI / 2; k.position.set(0, 0.055 - i * 0.026, 0.038); gauntlet.add(k); }
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.16, 18), steel); cuff.position.set(0, -0.13, -0.01); gauntlet.add(cuff);
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.05, 0.12, 18), new THREE.MeshPhysicalMaterial({ color: '#3a2a52', roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color('#6a5a8a') })); wrist.position.set(0, -0.26, -0.02); gauntlet.add(wrist);
}
const hand = new THREE.Group(); hand.add(sword, gauntlet); camera.add(hand);
// The gauntlet hangs behind the grip in hand space; the sword's long axis is local +y.
hand.scale.setScalar(0.85);

// ---------- poses: [x, y, z, rx, ry, rz] in camera space ----------
const REST = [0.36, -0.38, -0.72, -0.35, 0.25, -0.4];
const MOVES = {
  slashL: [[0, REST], [0.35, [0.62, -0.12, -0.55, -1.25, 1.15, -0.35]], [0.55, [0.08, -0.2, -0.8, -1.45, 0.05, -0.1]], [0.75, [-0.55, -0.3, -0.58, -1.3, -1.15, 0.25]], [1, REST]],
  slashR: [[0, REST], [0.3, [-0.55, -0.15, -0.55, -1.3, -1.15, 0.3]], [0.55, [0.0, -0.22, -0.82, -1.45, 0.0, 0.05]], [0.75, [0.6, -0.32, -0.6, -1.25, 1.15, -0.3]], [1, REST]],
  chop: [[0, REST], [0.38, [0.22, 0.12, -0.42, 0.7, 0.1, -0.05]], [0.6, [0.12, -0.5, -0.78, -1.95, 0.05, 0.0]], [0.8, [0.18, -0.55, -0.7, -1.8, 0.1, -0.1]], [1, REST]],
  thrust: [[0, REST], [0.35, [0.3, -0.3, -0.3, -1.5, 0.08, 0.0]], [0.55, [0.05, -0.2, -1.12, -1.56, 0.0, 0.0]], [0.75, [0.08, -0.22, -1.0, -1.56, 0.0, 0.0]], [1, REST]],
  charge: [[0, REST], [0.5, [0.55, -0.22, -0.42, -1.15, 1.45, -0.45]], [1, [0.58, -0.2, -0.4, -1.12, 1.5, -0.45]]],
  cleave: [[0, [0.58, -0.2, -0.4, -1.12, 1.5, -0.45]], [0.35, [0.05, -0.18, -0.95, -1.5, 0.0, 0.0]], [0.6, [-0.65, -0.3, -0.5, -1.25, -1.4, 0.35]], [1, REST]],
};
const ease = (x) => x * x * (3 - 2 * x);
function poseAt(move, p) {
  const k = MOVES[move]; let i = 0; while (i < k.length - 2 && p > k[i + 1][0]) i++;
  const [t0, a] = k[i], [t1, b] = k[i + 1]; const u = ease(Math.min(1, Math.max(0, (p - t0) / (t1 - t0))));
  return a.map((v, j) => v + (b[j] - v) * u);
}

function applyPose(pose) { hand.position.set(pose[0], pose[1], pose[2]); hand.rotation.set(pose[3], pose[4], pose[5], 'YXZ'); }

// =====================================================================
// BOSS FIGHT: Ulti-Max (Neighbourhood boss). Faster attacks, blocks, parry, dodge, magic, phases.
// =====================================================================
const LOOK0 = new THREE.Vector3(0, 1.65, 0.8);
camera.position.copy(CAM0); camera.lookAt(LOOK0); const CAMQ0 = camera.quaternion.clone();
const RIGHT = new THREE.Vector3(1, 0, 0);

// ---------- boss ----------
const U = ultiMax();
scene.add(U.root);
const BOSS_MAX = 760;
const crystals = new THREE.Group(); scene.add(crystals); // frost crystals (re-attached to joints)
const iceM = new THREE.MeshPhysicalMaterial({ color: '#bfe8ff', roughness: 0.05, transmission: 0.6, thickness: 0.2, clearcoat: 1, emissive: new THREE.Color('#3a8acc'), emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
const iceParts = [];
for (const [jt, n] of [[U.torso, 8], [U.arms.L.el, 3], [U.arms.R.el, 3], [U.legs.L.knee, 3], [U.legs.R.knee, 3], [U.head, 2]]) for (let i = 0; i < n; i++) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.03 + rnd() * 0.04, 0.12 + rnd() * 0.2, 5), iceM);
  c.position.set((rnd() - 0.5) * 0.4, rnd() * 0.6 - 0.2, (rnd() - 0.2) * 0.3); c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); jt.add(c); iceParts.push(c);
}

// ---------- boss poses ----------
const Z3 = [0, 0, 0];
const BASE = { rootY: 0, tX: 0, tY: 0, tZ: 0, hX: 0, hY: 0, shL: [-0.35, 0, 0.22], elL: -1.1, shR: [-0.35, 0, -0.22], elR: -1.1, hipL: 0, kneeL: 0, hipR: 0, kneeR: 0, blade: 1 };
const mk = (o) => ({ ...BASE, ...o });
const GUARD = mk({ rootY: -0.065, tX: 0.1, shL: [-0.8, 0.2, 0.35], elL: -1.3, shR: [-0.8, -0.2, -0.35], elR: -1.3, hipL: -0.35, kneeL: 0.7, hipR: -0.35, kneeR: 0.7 });
const POSES = {
  IDLE: mk({ blade: 0.15 }),
  GUARD,
  XWIND: { ...GUARD, tX: -0.2, shL: [-2.7, 0, 0.5], elL: -0.6, shR: [-2.7, 0, -0.5], elR: -0.6 },
  XSLASH: { ...GUARD, tX: 0.4, shL: [-1.0, 0, -0.35], elL: -0.2, shR: [-1.0, 0, 0.35], elR: -0.2 },
  WINDR: { ...GUARD, tY: 0.55, shR: [-2.4, 0.3, -0.9], elR: -0.9 },
  SLASHR: { ...GUARD, tY: -0.5, tX: 0.25, shR: [-1.1, 0, 0.6], elR: -0.2 },
  WINDL: { ...GUARD, tY: -0.55, shL: [-2.4, -0.3, 0.9], elL: -0.9 },
  SLASHL: { ...GUARD, tY: 0.5, tX: 0.25, shL: [-1.1, 0, -0.6], elL: -0.2 },
  THRUSTWIND: { ...GUARD, tY: 0.45, shR: [-1.3, 0, -0.3], elR: -1.9 },
  THRUST: { ...GUARD, tY: -0.35, tX: 0.25, shR: [-1.57, 0, 0.05], elR: 0, hipL: -0.6, kneeL: 0.5, hipR: 0.2, kneeR: 0.3 },
  STUN: { ...GUARD, tX: -0.35, tZ: 0.18, hX: -0.35, hY: 0.3, shL: [0.15, 0, 0.55], elL: -0.3, shR: [0.15, 0, -0.55], elR: -0.3 },
  NETFIRE: { ...GUARD, tY: -0.3, shL: [-1.55, 0, 0.05], elL: 0 },
  CROUCH: { ...GUARD, rootY: -0.3, hipL: -1.0, kneeL: 1.7, hipR: -1.0, kneeR: 1.7, tX: 0.5, shL: [0.3, 0, 0.4], shR: [0.3, 0, -0.4], elL: -0.6, elR: -0.6 },
  LEAP: { ...GUARD, rootY: 0, hipL: -1.3, kneeL: 2.0, hipR: -1.3, kneeR: 2.0, tX: -0.1, shL: [-2.9, 0, 0.4], elL: -0.3, shR: [-2.9, 0, -0.4], elR: -0.3 },
  SLAMLAND: { ...GUARD, rootY: -0.42, hipL: -1.1, kneeL: 1.9, hipR: -1.1, kneeR: 1.9, tX: 0.65, shL: [-0.7, 0, 0.15], elL: -0.6, shR: [-0.7, 0, -0.15], elR: -0.6 },
  FLINCH: { ...GUARD, tX: -0.25, hX: -0.25, shL: [-0.4, 0, 0.6], shR: [-0.4, 0, -0.6] },
  COLLAPSE: { ...GUARD, rootY: -0.6, hipL: -1.45, kneeL: 2.35, hipR: -1.3, kneeR: 2.2, tX: 0.55, tZ: 0.45, hX: 0.6, shL: [0.25, 0, 0.35], elL: -0.1, shR: [0.2, 0, -0.3], elR: -0.1 },
};
// keyframes [time, pose]
const BK = [[0, 'IDLE'], [0.75, 'IDLE'], [1.0, 'GUARD'], [1.25, 'GUARD'], [1.43, 'XWIND'], [1.62, 'XSLASH'], [1.88, 'GUARD'], [2.2, 'WINDR'], [2.4, 'SLASHR'], [2.55, 'WINDL'], [2.73, 'SLASHL'], [2.95, 'THRUSTWIND'], [3.17, 'THRUST'], [3.32, 'STUN'], [4.3, 'STUN'], [4.5, 'GUARD'], [4.75, 'NETFIRE'], [5.05, 'NETFIRE'], [5.22, 'GUARD'], [5.42, 'WINDR'], [5.53, 'SLASHR'], [5.63, 'WINDL'], [5.73, 'SLASHL'], [5.83, 'WINDR'], [5.93, 'SLASHR'], [6.03, 'WINDL'], [6.13, 'SLASHL'], [6.35, 'GUARD'], [6.6, 'GUARD'], [7.8, 'GUARD'], [7.92, 'FLINCH'], [8.05, 'CROUCH'], [8.2, 'LEAP'], [8.5, 'LEAP'], [8.65, 'SLAMLAND'], [9.0, 'SLAMLAND'], [9.25, 'GUARD'], [10.45, 'GUARD'], [10.6, 'STUN'], [11.0, 'STUN'], [11.5, 'COLLAPSE'], [14, 'COLLAPSE']];
const BZ = [[0, -1.0], [1.05, -1.0], [1.4, 2.45], [3.05, 2.45], [3.2, 2.65], [3.35, 2.5], [4.4, 2.5], [4.62, 1.4], [5.22, 1.4], [5.4, 2.45], [8.05, 2.45], [8.65, 2.75], [10.6, 2.55], [11.4, 2.0], [14, 2.0]];
const BY = [[0, 0], [4.4, 0], [4.5, 0.25], [4.62, 0], [8.15, 0], [8.42, 1.5], [8.55, 1.1], [8.65, 0], [14, 0]];
const lerpK = (K, t) => { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const [t0, a] = K[i], [t1, b] = K[i + 1]; const u = ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))); return a + (b - a) * u; };
function bossPose(t) {
  let i = 0; while (i < BK.length - 2 && t > BK[i + 1][0]) i++;
  const [t0, an] = BK[i], [t1, bn] = BK[i + 1]; const u = ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
  const a = POSES[an], b = POSES[bn], out = {};
  for (const k in a) out[k] = Array.isArray(a[k]) ? a[k].map((v, j) => v + (b[k][j] - v) * u) : a[k] + (b[k] - a[k]) * u;
  return out;
}
function applyBoss(t) {
  const p = bossPose(t);
  const dashing = (t > 1.05 && t < 1.4) || (t > 5.22 && t < 5.4);
  const stride = dashing ? Math.sin(t * 38) * 0.75 : 0;
  U.root.position.set(0, lerpK(BY, t), lerpK(BZ, t)); U.root.rotation.set(0, 0, 0);
  U.pelvis.position.y = 1.12 + p.rootY;
  U.torso.rotation.set(p.tX, p.tY, p.tZ); U.head.rotation.set(p.hX, p.hY, 0);
  U.arms.L.sh.rotation.set(...p.shL); U.arms.L.el.rotation.set(p.elL, 0, 0);
  U.arms.R.sh.rotation.set(...p.shR); U.arms.R.el.rotation.set(p.elR, 0, 0);
  U.legs.L.hip.rotation.set(p.hipL + stride, 0, 0); U.legs.L.knee.rotation.set(p.kneeL + Math.max(0, -stride) * 0.9, 0, 0);
  U.legs.R.hip.rotation.set(p.hipR - stride, 0, 0); U.legs.R.knee.rotation.set(p.kneeR + Math.max(0, stride) * 0.9, 0, 0);
  const ext = t < 0.4 ? 0.15 : Math.min(1, 0.15 + (t - 0.4) / 0.3 * 0.85);
  U.arms.L.blade.scale.y = U.arms.R.blade.scale.y = ext;
  // flinch on player hits
  for (const h of PH) { const dt = t - h.t; if (dt >= 0 && dt < 0.25) { const k = Math.sin((dt / 0.25) * Math.PI) * (h.big ? 2 : 1); U.torso.rotation.x -= 0.12 * k; U.root.position.z -= 0.06 * k; } }
  // head pops off on overload
  const hp = t - 11.0; if (hp > 0) { U.neck.position.set(0, 0.8 + Math.min(1, hp * 2) * 0, 0); U.head.position.set(0.25 * Math.min(hp, 1), 0.14 + hp * 2.2 - 4.9 * hp * hp * 0.6, 0.4 * Math.min(hp, 1)); if (U.head.position.y < -1.5) U.head.position.y = -1.5; U.head.rotation.set(hp * 6, hp * 3, 0); } else U.head.position.set(0, 0.14, 0);
}

// ---------- timeline ----------
// player attacks [start, move, duration, impact fraction, damage, crit, tag]
const PATT = [
  [1.82, 'slashL', 0.42, 0.55, 38, false, ''], [3.35, 'chop', 0.5, 0.6, 96, true, 'RIPOSTE'], [3.9, 'slashR', 0.42, 0.55, 41, false, ''],
  [6.8, 'chop', 0.55, 0.6, 160, true, 'SHATTER'], [7.42, 'thrust', 0.45, 0.55, 52, false, ''],
  [9.32, 'slashL', 0.4, 0.55, 64, false, 'CHAIN'], [9.77, 'slashR', 0.4, 0.55, 70, false, 'CHAIN'], [10.22, 'thrust', 0.5, 0.55, 239, true, 'OVERLOAD'],
];
const PH = PATT.map((a) => ({ t: a[0] + a[2] * a[3], dmg: a[4], crit: a[5], tag: a[6], big: a[4] > 90 }));
const BLOCKS = [[1.28, 1.76], [3.0, 3.3], [5.36, 5.72], [5.85, 6.02]];
const PARRY_T = 3.2;
// boss hits on the player: [time, damage, result]
const BH = [[1.65, 6, 'BLOCKED'], [2.45, 14, 'HIT'], [2.75, 0, 'DODGE'], [3.2, 0, 'PARRY'], [5.55, 0, 'BLOCKED'], [5.75, 18, 'HIT'], [5.95, 0, 'BLOCKED'], [6.15, 22, 'HIT'], [8.65, 9, 'SHOCK']];
const DODGES = [[2.55, 3.05, -0.95, 0], [8.33, 8.8, 0, 0.95]]; // [start, end, x offset, z offset]
const NET = { fire: 4.95, hit: 5.06, free: 6.55 };
const OVERCLOCK = 5.0, FROST = { start: 6.28, cast: 6.55, end: 7.8 }, SHATTER_T = PH[3].t, PHASE2 = 7.9, BRAND = { start: 8.9, live: 9.3 }, DEATH = 10.72;
const bossHP = (t) => Math.max(0, BOSS_MAX - PH.reduce((s, h) => s + (t >= h.t ? h.dmg : 0), 0));
const playerHP = (t) => 100 - BH.reduce((s, [ht, d]) => s + (t >= ht ? d : 0), 0);
const activeP = (t) => PATT.find((a) => t >= a[0] && t < a[0] + a[2]) || null;
const blocking = (t) => BLOCKS.find(([a, b]) => t >= a && t < b);

// ---------- player pose (adds block + cast on top of attacks) ----------
const BLOCK_POSE = [0.12, -0.14, -0.62, 0.05, 0.0, 1.38];
function playerSwordPose(t) {
  const a = activeP(t);
  if (a) return poseAt(a[1], (t - a[0]) / a[2]);
  const b = blocking(t);
  if (b) { const u = Math.min(1, (t - b[0]) / 0.09, (b[1] - t) / 0.09); return REST.map((v, j) => v + (BLOCK_POSE[j] - v) * ease(Math.max(0, Math.min(1, u)))); }
  return REST.map((v, j) => v + (j === 0 ? Math.sin(t * 2.2) * 0.01 : j === 1 ? Math.cos(t * 2.2) * 0.008 : 0));
}
// off-hand for spellcasting
const offHand = new THREE.Group(); camera.add(offHand);
{
  const steel = new THREE.MeshPhysicalMaterial({ map: scratchTex, metalness: 0.9, roughness: 0.35 });
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), steel); palm.scale.set(1.2, 0.6, 1.3); offHand.add(palm);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.06, 4, 8), steel); f.position.set(-0.035 + i * 0.023, 0.0, -0.085); f.rotation.x = Math.PI / 2 - 0.3; offHand.add(f); }
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.2, 18), steel); cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.14; offHand.add(cuff);
}
const frostOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9ae8ff').multiplyScalar(2.5), transparent: true, opacity: 0.9 })); offHand.add(frostOrb); frostOrb.position.set(0, 0.06, -0.1);
const frostLight = new THREE.PointLight('#7ad8ff', 0, 3); offHand.add(frostLight);
function offHandPose(t) {
  const u = t >= FROST.start && t < FROST.cast + 0.35 ? Math.min(1, (t - FROST.start) / 0.15, (FROST.cast + 0.35 - t) / 0.15) : 0;
  const e = ease(Math.max(0, Math.min(1, u)));
  offHand.position.set(-0.45 + e * 0.2, -0.75 + e * 0.5, -0.7 + (t > FROST.cast && t < FROST.cast + 0.2 ? -0.15 : 0));
  offHand.rotation.set(-0.3 - e * 0.9, 0.2, 0.3);
  frostOrb.visible = e > 0.1 && t < FROST.cast + 0.05; frostOrb.scale.setScalar(0.5 + Math.min(1, (t - FROST.start) / 0.27) * 0.8);
  frostLight.intensity = frostOrb.visible ? 4 : 0;
}

// ---------- effects ----------
const FX = []; const addFx = (o) => { scene.add(o); FX.push(o); return o; };
const add = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
// ribbon trail sampler: fn(t) -> [tipVec3, baseVec3]
function makeTrail(n, color) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); geo.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(n * 2), 1));
  const ix = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(ix);
  const mat = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(color) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 color; varying float vA; void main(){ gl_FragColor = vec4(color * vA, vA); }' });
  const m = addFx(new THREE.Mesh(geo, mat)); m.frustumCulled = false;
  return { m, mat, n, update(samples) { const p = geo.attributes.position.array, al = geo.attributes.alpha.array; samples.forEach(([tip, base, a], i) => { p.set([tip.x, tip.y, tip.z], i * 6); p.set([base.x, base.y, base.z], i * 6 + 3); al[i * 2] = a; al[i * 2 + 1] = a * 0.12; }); geo.attributes.position.needsUpdate = geo.attributes.alpha.needsUpdate = true; } };
}
const pTrail = makeTrail(16, '#cfe6ff');
const bTrailL = makeTrail(14, '#ff3a2a'), bTrailR = makeTrail(14, '#ff3a2a'); bTrailL.boss = bTrailR.boss = true;
const swingWindows = [[1.43, 1.66], [2.2, 2.42], [2.55, 2.75], [2.95, 3.2], [5.42, 5.56], [5.63, 5.76], [5.83, 5.96], [6.03, 6.16], [8.5, 8.66]];
const bladeTip = new THREE.Vector3(0, -0.8, 0), bladeMid = new THREE.Vector3(0, -0.55, 0);

// particles: deterministic bursts
const PS = [];
function burst(t0, origin, n, color, speed, size, life, g = 6, seed = 1, follow = null) {
  const mat = add(color, 1);
  for (let i = 0; i < n; i++) {
    const s = Math.sin((i + 1) * 12.9898 * seed + seed * 3.3) * 43758.5453, r1 = s - Math.floor(s), r2 = Math.abs((s * 1.7) % 1), r3 = Math.abs((s * 3.1) % 1);
    const m = addFx(new THREE.Mesh(new THREE.SphereGeometry(size * (0.5 + r3), 6, 4), mat)); m.visible = false;
    const dir = new THREE.Vector3(r1 - 0.5, r2 - 0.2, r3 - 0.5).normalize().multiplyScalar(speed * (0.4 + r2));
    PS.push({ m, t0, origin: origin.clone(), v: dir, life: life * (0.5 + r1 * 0.7), g, follow });
  }
}
const camPoint = (d, x = 0, y = 0) => CAM0.clone().add(new THREE.Vector3(x, y, -d));
// block/parry sparks in front of the sword, player hits on the boss, frost shatter, slam debris
BH.forEach(([t, d, r], i) => { if (r === 'BLOCKED') burst(t, camPoint(0.75, 0.1, -0.15), 24, '#ffd890', 4, 0.012, 0.35, 3, 10 + i); if (r === 'PARRY') { burst(t, camPoint(0.75, 0.1, -0.15), 70, '#fff4c0', 6, 0.014, 0.5, 2, 20); } if (r === 'DODGE') burst(t, new THREE.Vector3(0.3, 0.05, 3.6), 30, '#ffb060', 3, 0.012, 0.4, 7, 30); });
PH.forEach((h, i) => { h.at = new THREE.Vector3((i % 2 ? -0.2 : 0.2), 1.6 + (i % 3) * 0.12, 2.75); burst(h.t, h.at, h.tag === 'OVERLOAD' ? 90 : 26, '#ffcf7a', 4.5, 0.013, 0.45, 5, 40 + i); burst(h.t, h.at, 10, '#3a3a3a', 1.5, 0.03, 0.8, -0.5, 60 + i); });
burst(SHATTER_T, new THREE.Vector3(0, 1.5, 2.7), 70, '#bfe8ff', 4, 0.025, 0.9, 6, 80);
burst(8.65, new THREE.Vector3(0, 0.05, 3.4), 80, '#c8a878', 4, 0.04, 0.9, 6, 90);
burst(11.0, new THREE.Vector3(0, 2.1, 2.5), 60, '#ffd060', 5, 0.012, 0.7, 6, 95);
for (let i = 0; i < 40; i++) burst(5.0 + i * 0.12, new THREE.Vector3(0, 0, 0), 1, '#e8e8e8', 0.6, 0.045, 0.9, -1.2, 100 + i, 'vent'); // overclock steam
const lightningSparks = []; for (let i = 0; i < 30; i++) burst(BRAND.start + i * 0.05, new THREE.Vector3(), 1, '#9ad8ff', 1.2, 0.01, 0.35, 0, 140 + i, 'blade');

const slamRing = addFx(new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 64), add('#ff2a1a', 0.7))); slamRing.rotation.x = -Math.PI / 2; slamRing.position.set(0, 0.03, 3.55);
const shock = addFx(new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), add('#ffd08a', 0.9))); shock.rotation.x = Math.PI / 2; shock.position.set(0, 0.08, 3.3);
const frostRing = addFx(new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 64), add('#9ae8ff', 0.9))); frostRing.position.set(0, 1.6, 4.0);
const net = addFx(new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), new THREE.MeshBasicMaterial({ color: '#c8b890', wireframe: true })));
const parryFlash = addFx(new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), add('#fff6d0', 0.8))); parryFlash.position.copy(camPoint(0.8, 0.1, -0.12)); parryFlash.lookAt(CAM0);
const lootBeam = addFx(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 7, 20, 1, true), add('#5a9aff', 0.5))); lootBeam.position.set(0, 3.4, 2.0);
const lootLight = new THREE.PointLight('#5a9aff', 0, 6); lootLight.position.set(0, 1.2, 2.2); scene.add(lootLight);
const swordGlow = new THREE.PointLight('#7ac8ff', 0, 2.5); hand.add(swordGlow); swordGlow.position.set(0, 0.6, 0);
// lightning arcs: rebuilt per frame from seeded jagged polylines
const arcMat = add('#bfe8ff', 1), arcGroup = new THREE.Group(); scene.add(arcGroup); FX.push(arcGroup);
function arc(a, b, seed, jag = 0.08, r = 0.008) {
  const pts = []; const n = 9;
  for (let i = 0; i <= n; i++) { const u = i / n, p = a.clone().lerp(b, u); if (i > 0 && i < n) { const s = Math.sin(seed * 91.7 + i * 17.3) * 43758.5; p.add(new THREE.Vector3((s % 1) - 0.5, ((s * 1.3) % 1) - 0.5, ((s * 2.1) % 1) - 0.5).multiplyScalar(jag * 2)); } pts.push(p); }
  const path = new THREE.CurvePath(); for (let i = 0; i < n; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  arcGroup.add(new THREE.Mesh(new THREE.TubeGeometry(path, n * 2, r, 4), arcMat));
}

// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
const BANNERS = [
  [0.15, 1.1, 'NEIGHBOURHOOD BOSS', '#F5C518', 46, 120], [1.62, 1.95, 'BLOCKED', '#F4EEDC', 40, 170], [2.4, 2.75, 'HIT!', '#ff4a4a', 40, 170],
  [2.7, 3.0, 'DODGE', '#7BE38A', 46, 170], [3.2, 3.75, 'PERFECT PARRY!', '#F5C518', 60, 150], [3.55, 4.1, 'RIPOSTE', '#ff9a2a', 44, 215],
  [4.75, 5.15, 'NET INCOMING!', '#ff4a4a', 44, 150], [5.1, 5.9, 'ROOTED · CAN\'T DODGE', '#ff7a7a', 36, 210], [5.0, 5.6, 'OVERCLOCK: +60% ATTACK SPEED', '#ff4a3a', 40, 120],
  [6.3, 6.9, 'FROST NOVA', '#9ae8ff', 54, 150], [6.6, 7.2, 'FROZEN · NET SHATTERED', '#bfe8ff', 34, 215], [SHATTER_T, SHATTER_T + 0.55, 'SHATTER!', '#bfe8ff', 70, 150],
  [7.9, 8.6, 'PHASE 2 · ADAPTING: FROST IMMUNE', '#ff4a3a', 40, 120], [8.15, 8.65, '! DIVE SLAM !', '#ff4a3a', 48, 170],
  [8.9, 9.6, 'LIGHTNING BRAND', '#9ad8ff', 54, 150], [9.45, 9.9, 'CHAIN LIGHTNING', '#bfe8ff', 34, 215], [10.33, 11.0, 'OVERLOAD!', '#9ad8ff', 76, 150],
  [11.4, 14, 'NEIGHBOURHOOD BOSS DEFEATED', '#F5C518', 54, 130],
];
const bannerEls = BANNERS.map(([, , txt, col, size, top]) => { const e = document.createElement('div'); e.className = 'banner'; e.textContent = txt; e.style.color = col; e.style.fontSize = size + 'px'; e.style.top = top + 'px'; $('hud').appendChild(e); return e; });
const HOST = [[0.1, 1.9, 'Ulti-Max! He upgrades himself after every fight. You have never upgraded anything.'], [3.25, 4.7, 'A perfect parry! The audience gasps. One of them choked on a snack.'], [5.0, 6.3, 'He is overclocking. That is robot for "about to ruin your day".'], [6.55, 7.9, 'Frost Nova! Cold, refreshing, and a little bit murdery.'], [7.9, 9.3, 'Phase two! He is adapting. Adapt faster.'], [10.5, 14, 'Lightning versus robot. Science wins again. The sponsors are ecstatic.']];
const dmg = [...PH.map((h) => ({ t: h.t, txt: (h.crit ? 'CRIT ' : '') + h.dmg, cls: 'dmg' + (h.crit ? ' crit' : '') + (h.tag === 'OVERLOAD' ? ' huge' : ''), at: h.at }))];
const dmgEls = dmg.map((d) => { const e = document.createElement('div'); e.className = d.cls; e.textContent = d.txt; $('hud').appendChild(e); return e; });
const pdmg = BH.filter(([, d]) => d > 0).map(([t, d]) => { const e = document.createElement('div'); e.className = 'pdmg'; e.textContent = '-' + d; $('hud').appendChild(e); return { t, e }; });
const v3 = new THREE.Vector3(); const project = (p) => { v3.copy(p).project(camera); return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H]; };
const vis = (id, on) => { $(id).style.display = on ? '' : 'none'; };

function updateHUD(t) {
  const bh = bossHP(t), ph = playerHP(t);
  $('bHp').style.width = (bh / BOSS_MAX * 100) + '%'; $('bHpGhost').style.width = (bossHP(t - 0.45) / BOSS_MAX * 100) + '%'; $('bHpTxt').textContent = `${bh} / ${BOSS_MAX}`;
  $('bossBar').style.opacity = t > DEATH + 1.2 ? Math.max(0, 1 - (t - DEATH - 1.2) * 2) : 1;
  vis('tOver', t >= OVERCLOCK && t < DEATH); vis('tFroz', t >= FROST.cast && t < FROST.end); vis('tStun', t >= 3.2 && t < 4.3 || t >= 10.5 && t < DEATH); vis('tP2', t >= PHASE2 && t < DEATH); vis('tShock', t >= 9.5 && t < DEATH + 0.6);
  $('pHp').style.width = ph + '%'; $('pHpTxt').textContent = `${ph} / 100`;
  const st = 100 - BH.filter(([bt, , r]) => t >= bt && r === 'BLOCKED').length * 12 - DODGES.filter(([a]) => t >= a).length * 20 - PATT.filter((a) => t >= a[0]).length * 6 + t * 5; $('pSt').style.width = Math.max(8, Math.min(100, st)) + '%';
  const mp = 90 - (t >= FROST.cast ? 35 : 0) - (t >= BRAND.start ? 30 : 0) + Math.max(0, t - 6.6) * 1.5; $('pMp').style.width = Math.min(100, mp) + '%';
  vis('dRoot', t >= NET.hit && t < NET.free); $('dRootT').textContent = Math.max(1, Math.ceil(NET.free - t)) + 's';
  vis('bBrand', t >= BRAND.live && t < 11.5); vis('bHaste', t >= 3.2 && t < 4.4);
  $('netOv').style.opacity = t >= NET.hit && t < NET.free ? 1 : (t >= NET.free && t < NET.free + 0.25 ? 1 - (t - NET.free) / 0.25 : 0);
  $('frostOv').style.opacity = t >= FROST.cast && t < FROST.cast + 0.7 ? 1 - (t - FROST.cast) / 0.7 : 0;
  $('vign').style.opacity = BH.reduce((m, [bt, d]) => (d > 0 && t >= bt && t < bt + 0.45 ? Math.max(m, (1 - (t - bt) / 0.45) * 0.85) : m), 0);
  $('bright').style.opacity = t >= PARRY_T && t < PARRY_T + 0.2 ? (1 - (t - PARRY_T) / 0.2) * 0.3 : 0;
  // attack ring
  let last = -9; for (const a of PATT) if (t >= a[0]) last = a[0]; const cd = Math.min(1, (t - last) / (t >= 3.2 && t < 4.4 ? 0.35 : 0.5));
  $('cdRing').style.strokeDashoffset = (138 * (1 - cd)).toFixed(1); $('cdRing').style.stroke = cd >= 1 ? '#F5C518' : '#F4EEDC';
  const a = activeP(t), b = blocking(t), d = DODGES.find(([s, e]) => t >= s && t < e);
  $('k1').classList.toggle('on', !!a && !a[6].includes('OVERLOAD')); $('k2').classList.toggle('on', !!b); $('k3').classList.toggle('on', !!d);
  $('k4').classList.toggle('on', t >= FROST.start && t < FROST.cast + 0.3); $('k5').classList.toggle('on', t >= BRAND.start && t < BRAND.live + 0.2 || (a && a[6] === 'OVERLOAD'));
  $('k4cd').style.height = t >= FROST.cast ? Math.max(0, 100 - (t - FROST.cast) * 8) + '%' : '0%';
  $('k5cd').style.height = t >= BRAND.live ? Math.max(0, 100 - (t - BRAND.live) * 4) + '%' : '0%';
  BANNERS.forEach(([a0, a1], i) => { const on = t >= a0 && t < a1; const k = on ? Math.min(1, (t - a0) / 0.06) : 0; bannerEls[i].style.opacity = on ? Math.min(1, (a1 - t) / 0.15) : 0; bannerEls[i].style.transform = `scale(${1 + (1 - k) * 0.4})`; });
  const hl = HOST.find(([a0, a1]) => t >= a0 && t < a1); $('host').style.opacity = hl ? 1 : 0; if (hl) $('hostTxt').textContent = hl[2];
  dmg.forEach((dd, i) => { const dt = t - dd.t, e = dmgEls[i]; if (dt < 0 || dt > 0.95) { e.style.opacity = 0; return; } const [x, y] = project(dd.at); e.style.opacity = dt < 0.7 ? 1 : 1 - (dt - 0.7) / 0.25; e.style.transform = `translate(${x - 40 + (i % 2 ? -40 : 40)}px, ${y - 60 - dt * 90}px) scale(${1 + Math.max(0, 0.25 - dt) * 2})`; });
  pdmg.forEach(({ t: pt, e }) => { const dt = t - pt; e.style.opacity = dt >= 0 && dt < 0.9 ? 1 - Math.max(0, dt - 0.6) / 0.3 : 0; e.style.transform = `translateY(${-dt * 60}px)`; });
  const combo = PH.filter((h) => t >= h.t && h.t > 9).length; $('combo').style.opacity = combo >= 2 && t < 11.6 ? 1 : 0; $('comboN').textContent = combo + 'x';
  $('loot').style.opacity = t >= 11.8 ? Math.min(1, (t - 11.8) * 3) : 0;
  $('map').style.opacity = t >= 12.2 ? Math.min(1, (t - 12.2) * 3) : 0;
}

// ---------- frame ----------
const tmpM = new THREE.Matrix4();
function sampleTrail(tr, t, windows, sampler, n, step) {
  const w = windows.find(([a, b]) => t >= a && t < b + 0.06); tr.m.visible = !!w; if (!w) return;
  const out = []; for (let i = 0; i < n; i++) { const tt = Math.max(w[0], t - i * step); const [tip, base] = sampler(tt); const inS = tt <= w[1] ? 1 : Math.max(0, 1 - (tt - w[1]) / 0.06); out.push([tip, base, (1 - i / n) * inS * (tr.boss ? 0.45 : 0.85)]); } tr.update(out);
}
function bossBladeAt(tt, side) { applyBoss(tt); U.root.updateMatrixWorld(true); const bl = U.arms[side].blade; return [bladeTip.clone().applyMatrix4(bl.matrixWorld), bladeMid.clone().applyMatrix4(bl.matrixWorld)]; }
function playerBladeAt(tt) { const p = playerSwordPose(tt); applyPose(p); hand.updateMatrixWorld(true); return [new THREE.Vector3(0, 1.05, 0).applyMatrix4(sword.matrixWorld), new THREE.Vector3(0, 0.45, 0).applyMatrix4(sword.matrixWorld)]; }
const BW = { L: [[1.43, 1.66], [2.55, 2.75], [5.63, 5.76], [6.03, 6.16], [8.5, 8.66]], R: [[1.43, 1.66], [2.2, 2.42], [2.95, 3.2], [5.42, 5.56], [5.83, 5.96], [8.5, 8.66]] };

window.renderAt = (t) => {
  // camera: dodges, shakes, hit kicks
  camera.position.copy(CAM0); camera.quaternion.copy(CAMQ0);
  for (const [s, e, dx, dz] of DODGES) if (t >= s && t < e) { const u = Math.sin(((t - s) / (e - s)) * Math.PI); camera.position.x += dx * u; camera.position.z += dz * u; camera.rotateZ(-Math.sign(dx || 0.0001) * u * 0.25 * (dx ? 1 : 0)); }
  const sh = (t0, dur, amp) => { const dt = t - t0; return dt >= 0 && dt < dur ? amp * (1 - dt / dur) : 0; };
  let amp = sh(8.65, 0.5, 0.09) + sh(PH[7].t, 0.4, 0.06) + sh(SHATTER_T, 0.3, 0.04) + sh(PARRY_T, 0.2, 0.03);
  for (const [bt, d, r] of BH) amp += r === 'HIT' ? sh(bt, 0.25, 0.05) : r === 'BLOCKED' ? sh(bt, 0.15, 0.025) : 0;
  for (const h of PH) amp += sh(h.t, 0.1, 0.01);
  camera.position.x += Math.sin(t * 87) * amp; camera.position.y += Math.cos(t * 71) * amp;
  if (t >= NET.hit && t < NET.free) camera.rotateZ(Math.sin(t * 9) * 0.008);
  camera.updateMatrixWorld(true);

  // trails first (they re-pose things at past times), then the current pose
  sampleTrail(bTrailL, t, BW.L, (tt) => bossBladeAt(tt, 'L'), 14, 0.012);
  sampleTrail(bTrailR, t, BW.R, (tt) => bossBladeAt(tt, 'R'), 14, 0.012);
  const pw = PATT.map((a) => [a[0] + a[2] * 0.3, a[0] + a[2] * 0.82]);
  pTrail.mat.uniforms.color.value.set(t >= BRAND.live ? '#9ad8ff' : '#cfe6ff');
  sampleTrail(pTrail, t, pw, playerBladeAt, 16, 0.011);
  applyBoss(t); U.root.updateMatrixWorld(true);
  applyPose(playerSwordPose(t)); hand.updateMatrixWorld(true);
  offHandPose(t);

  // boss materials: overclock glow, frost, hit flash
  const frozen = t >= FROST.cast && t < FROST.end; const fz = frozen ? Math.min(1, (t - FROST.cast) / 0.15) : 0;
  const oc = t >= OVERCLOCK && t < DEATH ? (0.35 + Math.sin(t * 14) * 0.15) * (1 - fz) : 0;
  let flash = 0; for (const h of PH) { const dt = t - h.t; if (dt >= 0 && dt < 0.1) flash = Math.max(flash, 1 - dt / 0.1); }
  const fl = flash * (t > 9 ? 0.45 : 0.8); U.mats.paint.emissive.setRGB(oc + fl, oc * 0.15 + fl * 0.75 + fz * 0.3, fl * 0.5 + fz * 0.6); U.mats.plate.emissive.setRGB(fl * 0.7, fl * 0.7 + fz * 0.35, fl * 0.6 + fz * 0.6);
  U.coreLight.intensity = 2 + oc * 8; U.eyeLight.intensity = t < DEATH ? 1.5 + oc * 4 : Math.max(0, 1.5 - (t - DEATH) * 3);
  U.eyeM.color.setRGB(t < DEATH ? 3 : Math.max(0.1, 3 - (t - DEATH) * 6), 0.3, 0.2); U.coreM.color.setRGB(t < 11 ? 2.5 : 0.2, t < 11 ? 1 : 0.05, 0.1);
  iceParts.forEach((c) => { c.visible = frozen && t < SHATTER_T; c.scale.setScalar(fz); });
  // net projectile: from launcher to the camera
  if (t >= NET.fire && t < NET.hit) { U.muzzle.updateMatrixWorld(true); const from = new THREE.Vector3().setFromMatrixPosition(U.muzzle.matrixWorld); const u = (t - NET.fire) / (NET.hit - NET.fire); net.position.lerpVectors(from, camPoint(0.4), u); net.scale.setScalar(0.4 + u * 2.5); net.rotation.set(t * 8, t * 5, 0); net.visible = true; } else net.visible = false;
  // telegraphs and rings
  const tel = t >= 8.15 && t < 8.65 ? (t - 8.15) / 0.5 : 0; slamRing.visible = tel > 0; slamRing.scale.setScalar(0.4 + tel);
  const sw = t - 8.65; shock.visible = sw >= 0 && sw < 0.5; shock.scale.setScalar(0.3 + sw * 5); shock.material.opacity = 1 - sw / 0.5;
  const fr = t - FROST.cast; frostRing.visible = fr >= 0 && fr < 0.35; frostRing.position.set(0, 1.6, 4.2 - fr * 4.5); frostRing.scale.setScalar(0.3 + fr * 3); frostRing.material.opacity = 1 - fr / 0.35;
  parryFlash.visible = t >= PARRY_T && t < PARRY_T + 0.15; parryFlash.scale.setScalar(1 + (t - PARRY_T) * 5);
  const lt = t - 11.6; lootBeam.visible = lt > 0; lootBeam.material.opacity = Math.min(0.5, lt * 1.2); lootLight.intensity = lt > 0 ? Math.min(14, lt * 30) : 0;
  // lightning: blade crackle while branded, chains on hits, overload over the boss body
  arcGroup.children.forEach((c) => c.geometry.dispose()); arcGroup.clear();
  const fs = Math.floor(t * 30);
  const tipW = new THREE.Vector3(0, 1.0, 0).applyMatrix4(sword.matrixWorld), hiltW = new THREE.Vector3(0, 0.15, 0).applyMatrix4(sword.matrixWorld);
  if (t >= BRAND.start && t < 11.2) for (let k = 0; k < 3; k++) { const u1 = ((fs * 7 + k * 13) % 10) / 10, u2 = Math.min(1, u1 + 0.25); arc(hiltW.clone().lerp(tipW, u1), hiltW.clone().lerp(tipW, u2), fs + k * 5, 0.025, 0.004); }
  for (const h of PH.filter((h) => h.tag === 'CHAIN' || h.tag === 'OVERLOAD')) if (t >= h.t && t < h.t + 0.25) for (let k = 0; k < 3; k++) arc(tipW, h.at.clone().add(new THREE.Vector3(0, k * 0.15 - 0.15, 0)), fs + k * 3, 0.12, 0.009);
  if (t >= PH[7].t && t < 11.6) { const bodyPts = [U.torso, U.head, U.arms.L.el, U.arms.R.el, U.legs.L.knee, U.legs.R.knee].map((j) => new THREE.Vector3().setFromMatrixPosition(j.matrixWorld)); for (let k = 0; k < 5; k++) arc(bodyPts[(fs + k) % 6], bodyPts[(fs * 3 + k * 2 + 1) % 6], fs * 2 + k, 0.12, 0.007); }
  swordGlow.intensity = t >= BRAND.start && t < 11.2 ? 3 + Math.sin(t * 40) * 1.5 : 0; swordSteel.emissive.set('#5ab8ff'); swordSteel.emissiveIntensity = t >= BRAND.start && t < 11.2 ? 0.5 : 0;
  // particles
  U.torso.updateMatrixWorld(true);
  const ventW = new THREE.Vector3(0.16, 0.85, -0.3).applyMatrix4(U.torso.matrixWorld);
  for (const p of PS) { const dt = t - p.t0; p.m.visible = dt >= 0 && dt < p.life && !(p.follow === 'vent' && t > DEATH); if (!p.m.visible) continue; const o = p.follow === 'vent' ? ventW : p.follow === 'blade' ? hiltW.clone().lerp(tipW, (p.t0 * 7) % 1) : p.origin; p.m.position.set(o.x + p.v.x * dt, o.y + p.v.y * dt - 0.5 * p.g * dt * dt, o.z + p.v.z * dt); if (p.m.position.y < 0.02) p.m.position.y = 0.02; p.m.material.opacity = 1 - dt / p.life; }
  updateHUD(t);
  renderer.setRenderTarget(colorRT); renderer.render(scene, camera);
  const vv = FX.map((o) => o.visible); FX.forEach((o) => { o.visible = false; });
  scene.overrideMaterial = normalMat; const fog = scene.fog; scene.fog = null;
  renderer.setRenderTarget(normalRT); renderer.render(scene, camera);
  scene.overrideMaterial = null; scene.fog = fog; FX.forEach((o, i) => { o.visible = vv[i]; });
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
};
window.DURATION = 13.5;
window.renderAt(0);
window.__ready = true;
