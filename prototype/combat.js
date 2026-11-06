// Combat demo: environment and ink-outline pipeline from scene.js, plus a timeline-driven fight.
import * as THREE from './node_modules/three/build/three.module.js';
import { caveTroll } from './monsters/troll.js';

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

// ---------- the troll ----------
const T = caveTroll();
const troll = T.group; troll.position.set(0.1, 0, 1.4); scene.add(troll);
const TROLL_MAX = 620;

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

// ---------- timeline ----------
// attacks: [start, move, duration, impact fraction, damage, crit]
const ATTACKS = [
  [1.05, 'slashL', 0.6, 0.55, 24, false],
  [1.8, 'chop', 0.65, 0.6, 31, false],
  [2.6, 'thrust', 0.55, 0.55, 46, true],
  [4.75, 'slashL', 0.42, 0.55, 22, false],
  [5.17, 'slashR', 0.42, 0.55, 25, false],
  [5.59, 'chop', 0.45, 0.6, 34, false],
  [6.15, 'charge', 0.7, 2, 0, false],
  [6.85, 'cleave', 0.6, 0.35, 142, true],
];
const ATTACK_INTERVAL = (t) => (t > 4.4 && t < 9 ? 0.42 : 0.75); // Battle Fury speeds attacks up
const SLAM = { raise: 3.25, hit: 3.95, end: 4.5 };
const DEATH = 7.25;
const FURY = 4.45;
const hits = ATTACKS.filter((a) => a[4] > 0).map((a) => ({ t: a[0] + a[2] * a[3], dmg: a[4], crit: a[5], cleave: a[1] === 'cleave' }));

function trollHP(t) { let hp = TROLL_MAX; for (const h of hits) if (t >= h.t) hp -= h.dmg; return Math.max(0, hp); }
function playerHP(t) { let hp = 100; if (t >= SLAM.hit) hp -= 32; if (t > SLAM.hit) hp += Math.min(8, (t - SLAM.hit) * 2.5); return hp; }
function activeAttack(t) { for (const a of ATTACKS) if (t >= a[0] && t < a[0] + a[2]) return a; return null; }

// ---------- effects ----------
const fx = []; // hidden during the outline pass
const additive = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const TRAIL_N = 16;
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 2 * 3), 3));
trailGeo.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 2), 1));
const idx = []; for (let i = 0; i < TRAIL_N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } trailGeo.setIndex(idx);
const trailMat = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color('#cfe6ff') } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 color; varying float vA; void main(){ gl_FragColor = vec4(color * vA, vA); }' });
const trail = new THREE.Mesh(trailGeo, trailMat); trail.frustumCulled = false; scene.add(trail); fx.push(trail);

const slamRing = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 64), additive('#ff2a1a', 0.7)); slamRing.rotation.x = -Math.PI / 2; slamRing.position.set(0.05, 0.03, 3.55); scene.add(slamRing); fx.push(slamRing);
const slamFill = new THREE.Mesh(new THREE.CircleGeometry(1.0, 64), additive('#ff2a1a', 0.18)); slamFill.rotation.x = -Math.PI / 2; slamFill.position.copy(slamRing.position); scene.add(slamFill); fx.push(slamFill);
const shock = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), additive('#ffd08a', 0.9)); shock.rotation.x = Math.PI / 2; shock.position.set(0.05, 0.08, 3.55); scene.add(shock); fx.push(shock);
const lootBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 7, 20, 1, true), additive('#b07cff', 0.5)); lootBeam.position.set(0.1, 3.4, 0.2); scene.add(lootBeam); fx.push(lootBeam);
const lootLight = new THREE.PointLight('#a06cf0', 0, 6); lootLight.position.set(0.1, 1.2, 0.5); scene.add(lootLight);
const swordGlow = new THREE.PointLight('#ff9a2a', 0, 2.5); hand.add(swordGlow); swordGlow.position.set(0, 0.6, 0);

// particle pools (deterministic, driven by time since spawn)
const P = [];
function burst(t0, origin, n, color, speed, size, life, gravity = 6, seed0 = 1) {
  const mat = additive(color, 1);
  for (let i = 0; i < n; i++) {
    const s = Math.sin((i + 1) * 12.9898 * seed0) * 43758.5453, r1 = s - Math.floor(s), r2 = (s * 1.7) % 1, r3 = (s * 3.1) % 1;
    const m = new THREE.Mesh(new THREE.SphereGeometry(size * (0.5 + Math.abs(r3)), 6, 4), mat); m.visible = false; scene.add(m); fx.push(m);
    const dir = new THREE.Vector3(Math.abs(r1) - 0.5, Math.abs(r2) * 0.9, Math.abs(r3) * 0.9 + 0.2).normalize().multiplyScalar(speed * (0.5 + Math.abs(r2)));
    P.push({ m, t0, origin: origin.clone(), v: dir, life: life * (0.6 + Math.abs(r1) * 0.6), g: gravity });
  }
}
const blood = (t0, o, k) => burst(t0, o, 22, '#a0140c', 3.2, 0.022, 0.7, 7, k);
hits.forEach((h, i) => { const o = new THREE.Vector3(0.1 + (i % 2 ? -0.25 : 0.25), 1.7 + (i % 3) * 0.15, 2.0); blood(h.t, o, i + 1); burst(h.t, o, 10, '#fff2c0', 4.5, 0.012, 0.25, 0, i + 7); h.at = o; });
burst(SLAM.hit, new THREE.Vector3(0.05, 0.1, 3.5), 60, '#c8a878', 3.6, 0.05, 0.9, 5, 33); // debris from the slam
burst(DEATH + 0.9, new THREE.Vector3(0.1, 0.1, -0.6), 70, '#a8987a', 2.4, 0.07, 1.4, 1.5, 51); // dust when the troll lands
for (let i = 0; i < 26; i++) burst(6.15 + i * 0.025, new THREE.Vector3(0, 0, 0), 1, '#ffb040', 0.6, 0.012, 0.5, -1, 70 + i); // charge sparks (repositioned per frame)
const chargeSparks = P.slice(-26);

// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
const host = [
  [0.1, 3.0, 'A Cave Troll! Fun fact: they are 60% rock and 40% grudge.'],
  [3.3, 4.4, 'Oh, he is winding up. You may want to not be there.'],
  [4.45, 6.1, 'Battle Fury! Swinging faster will not fix your life, but it might fix this troll.'],
  [7.1, 10, 'Whirlwind Cleave. The troll has been cancelled. Our sponsors are thrilled.'],
];
const dmgEls = hits.map((h) => { const e = document.createElement('div'); e.className = 'dmg' + (h.crit ? ' crit' : '') + (h.cleave ? ' huge' : ''); e.textContent = (h.crit ? 'CRIT ' : '') + h.dmg; $('hud').appendChild(e); return e; });
const v3 = new THREE.Vector3();
function project(p) { v3.copy(p).project(camera); return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H]; }

// ---------- per-frame update ----------
const tipLocal = new THREE.Vector3(0, 1.05, 0), midLocal = new THREE.Vector3(0, 0.45, 0);
function swordPose(t) {
  const a = activeAttack(t);
  let pose = REST, move = null, p = 0;
  if (a) { move = a[1]; p = (t - a[0]) / a[2]; pose = poseAt(move, p); }
  // idle sway
  const sway = Math.sin(t * 2.2) * 0.01;
  return { pose: [pose[0] + sway, pose[1] + Math.cos(t * 2.2) * 0.008, pose[2], pose[3], pose[4], pose[5]], move, p };
}
function applyPose(pose) { hand.position.set(pose[0], pose[1], pose[2]); hand.rotation.set(pose[3], pose[4], pose[5], 'YXZ'); }

function trollPose(t) {
  const L = T.arms.L, R = T.arms.R;
  troll.position.set(0.1, 0, 1.4); troll.rotation.set(0, 0, 0);
  let lx = -0.15 + Math.sin(t * 1.7) * 0.05, rx = -0.25 + Math.sin(t * 1.7 + 1) * 0.05, lz = 0.1, rz = -0.1;
  // roar: arms flung up and out
  if (t < 1.0) { const u = Math.sin(Math.min(1, t / 0.9) * Math.PI); lx -= u * 1.4; rx -= u * 1.2; lz += u * 0.7; rz -= u * 0.7; troll.position.x += Math.sin(t * 60) * 0.01 * u; }
  // ground slam with the club arm
  if (t >= SLAM.raise && t < SLAM.end) {
    const up = ease(Math.min(1, (t - SLAM.raise) / 0.55)), down = ease(Math.min(1, Math.max(0, (t - (SLAM.hit - 0.15)) / 0.15)));
    rx = rx + (-2.9 - rx) * up + (2.9 - 1.15) * down; rz -= 0.15 * up;
    lx -= 0.6 * up; troll.rotation.x = -0.08 * up + 0.22 * down;
  }
  // flinch on every hit
  for (const h of hits) { const dt = t - h.t; if (dt >= 0 && dt < 0.3) { const k = Math.sin((dt / 0.3) * Math.PI) * (h.cleave ? 2.5 : 1); troll.rotation.x -= 0.06 * k; troll.rotation.y += (h.dmg % 2 ? 0.07 : -0.07) * k; troll.position.z -= 0.05 * k; } }
  // knocked back and toppling after the cleave
  if (t >= DEATH) { const u = Math.min(1, (t - DEATH) / 0.95); troll.position.z = 1.4 - ease(u) * 1.6; troll.rotation.x = -ease(u) * 1.45 * (u < 1 ? 1 : 1); troll.position.y = Math.sin(u * Math.PI) * 0.1; lx = -2.2 * ease(u); rx = -2.4 * ease(u); }
  L.rotation.set(lx, 0, lz); R.rotation.set(rx, 0, rz);
  // red hit flash
  let flash = 0; for (const h of hits) { const dt = t - h.t; if (dt >= 0 && dt < 0.12) flash = Math.max(flash, 1 - dt / 0.12); }
  T.skinMat.emissive.setRGB(0.7 * flash, 0.05 * flash, 0.02 * flash);
}

function updateTrail(t) {
  const pos = trailGeo.attributes.position.array, al = trailGeo.attributes.alpha.array;
  const a = activeAttack(t); const live = a && a[1] !== 'charge';
  trail.visible = !!live;
  if (!live) return;
  const cleave = a[1] === 'cleave', fury = t >= FURY;
  trailMat.uniforms.color.value.set(cleave ? '#ffb040' : fury ? '#ffcf8a' : '#cfe6ff');
  const m = new THREE.Matrix4();
  for (let i = 0; i < TRAIL_N; i++) {
    const tt = t - i * (cleave ? 0.014 : 0.011);
    const { pose } = swordPose(Math.max(a[0], tt));
    applyPose(pose); hand.updateMatrixWorld(true);
    const tip = tipLocal.clone().applyMatrix4(sword.matrixWorld), mid = midLocal.clone().applyMatrix4(sword.matrixWorld);
    pos.set([tip.x, tip.y, tip.z], i * 6); pos.set([mid.x, mid.y, mid.z], i * 6 + 3);
    const speed = i === 0 ? 1 : 1 - i / TRAIL_N; const inSwing = (tt - a[0]) / a[2] > 0.3 && (tt - a[0]) / a[2] < 0.82 ? 1 : 0.0;
    al[i * 2] = speed * inSwing * (cleave ? 1 : 0.75); al[i * 2 + 1] = speed * inSwing * 0.15;
  }
  trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.alpha.needsUpdate = true;
}

function updateParticles(t) {
  const tipW = tipLocal.clone().applyMatrix4(sword.matrixWorld);
  for (const p of P) {
    const dt = t - p.t0; p.m.visible = dt >= 0 && dt < p.life;
    if (!p.m.visible) continue;
    const o = chargeSparks.includes(p) ? tipW : p.origin;
    p.m.position.set(o.x + p.v.x * dt, o.y + p.v.y * dt - 0.5 * p.g * dt * dt, o.z + p.v.z * dt);
    if (p.m.position.y < 0.02) p.m.position.y = 0.02;
    p.m.material.opacity = 1 - dt / p.life;
  }
}

function updateHUD(t) {
  const thp = trollHP(t), php = playerHP(t);
  $('tHp').style.width = (thp / TROLL_MAX * 100).toFixed(1) + '%';
  $('tHpGhost').style.width = (trollHP(t - 0.45) / TROLL_MAX * 100).toFixed(1) + '%';
  $('tHpTxt').textContent = `${Math.round(thp)} / ${TROLL_MAX}`;
  $('trollBar').style.opacity = t > DEATH + 1.2 ? Math.max(0, 1 - (t - DEATH - 1.2) * 2) : 1;
  $('pHp').style.width = php + '%'; $('pHpTxt').textContent = `${Math.round(php)} / 100`;
  const stam = 100 - ATTACKS.filter((a) => t >= a[0]).reduce((s, a) => s + (a[1] === 'cleave' ? 35 : a[1] === 'charge' ? 0 : 9), 0) + Math.max(0, t - 1) * 6;
  $('pSt').style.width = Math.max(5, Math.min(100, stam)) + '%';
  const mana = t < FURY ? 80 : 80 - 30 + Math.min(10, (t - FURY) * 2); $('pMp').style.width = mana + '%';
  // attack-speed ring: refills after each swing
  let last = -9; for (const a of ATTACKS) if (t >= a[0]) last = a[0];
  const cd = Math.min(1, (t - last) / ATTACK_INTERVAL(t));
  $('cdRing').style.strokeDashoffset = (138 * (1 - cd)).toFixed(1);
  $('cdRing').style.stroke = cd >= 1 ? '#F5C518' : '#F4EEDC';
  // hotbar highlights
  const a = activeAttack(t);
  for (const [id, moves] of [['k1', ['slashL', 'slashR']], ['k2', ['chop']], ['k3', ['thrust']], ['k4', ['charge', 'cleave']]]) $(id).classList.toggle('on', !!a && moves.includes(a[1]));
  $('k4cd').style.height = t >= 6.15 ? Math.max(0, 100 - (t - 6.15) * 0) + '%' : '0%';
  // buffs and debuffs
  $('bFury').style.display = t >= FURY ? 'flex' : 'none';
  $('bFuryT').textContent = Math.max(0, Math.ceil(12 - (t - FURY))) + 's';
  const stag = t >= SLAM.hit && t < SLAM.hit + 2.2; $('dStag').style.display = stag ? 'flex' : 'none'; $('dStagT').textContent = Math.ceil(SLAM.hit + 2.2 - t) + 's';
  const bleed = t >= SLAM.hit && t < SLAM.hit + 4; $('dBleed').style.display = bleed ? 'flex' : 'none'; $('dBleedT').textContent = Math.ceil(SLAM.hit + 4 - t) + 's';
  $('tEnr').style.display = t >= SLAM.raise && t < DEATH ? 'inline-flex' : 'none';
  $('vign').style.opacity = t >= SLAM.hit && t < SLAM.hit + 0.6 ? (1 - (t - SLAM.hit) / 0.6) * 0.85 : 0;
  $('furyFlash').style.opacity = t >= FURY && t < FURY + 0.5 ? (1 - (t - FURY) / 0.5) * 0.5 : 0;
  // telegraph text
  $('warn').style.opacity = t >= SLAM.raise && t < SLAM.hit ? 1 : 0;
  $('furyTxt').style.opacity = t >= FURY && t < FURY + 1.1 ? 1 : 0;
  $('cleaveTxt').style.opacity = t >= 6.15 && t < 7.4 ? 1 : 0;
  $('cleaveTxt').textContent = t < 6.85 ? 'CHARGING WHIRLWIND CLEAVE...' : 'WHIRLWIND CLEAVE!';
  // combo counter
  const combo = hits.filter((h) => t >= h.t && h.t > 4.4).length;
  $('combo').style.opacity = combo >= 2 && t < DEATH + 1 ? 1 : 0; $('comboN').textContent = combo + 'x';
  // damage numbers
  hits.forEach((h, i) => { const dt = t - h.t, e = dmgEls[i]; if (dt < 0 || dt > 0.95) { e.style.opacity = 0; return; } const [x, y] = project(h.at); e.style.opacity = dt < 0.7 ? 1 : 1 - (dt - 0.7) / 0.25; e.style.transform = `translate(${x - 40 + (i % 2 ? -30 : 30)}px, ${y - 40 - dt * 90}px) scale(${1 + Math.max(0, 0.25 - dt) * 2})`; });
  $('pDmg').style.opacity = t >= SLAM.hit && t < SLAM.hit + 0.9 ? 1 - Math.max(0, t - SLAM.hit - 0.6) / 0.3 : 0;
  $('pDmg').style.transform = `translateY(${-(t - SLAM.hit) * 60}px)`;
  // host commentary
  const line = host.find(([a0, a1]) => t >= a0 && t < a1); $('host').style.opacity = line ? 1 : 0; if (line) $('hostTxt').textContent = line[2];
  // kill + loot
  const dead = t >= DEATH + 1.0; $('kill').style.opacity = dead ? Math.min(1, (t - DEATH - 1.0) * 3) : 0;
  $('loot').style.opacity = t >= DEATH + 1.4 ? Math.min(1, (t - DEATH - 1.4) * 3) : 0;
}

window.renderAt = (t) => {
  // camera: shake on the slam and on the cleave impact, small push on each hit
  camera.position.copy(CAM0); camera.quaternion.copy(CAMQ);
  const sh = (t0, dur, amp) => { const dt = t - t0; return dt >= 0 && dt < dur ? amp * (1 - dt / dur) : 0; };
  const amp = sh(SLAM.hit, 0.5, 0.09) + sh(hits[hits.length - 1].t, 0.35, 0.05) + hits.reduce((s, h) => s + sh(h.t, 0.12, 0.012), 0);
  camera.position.x += Math.sin(t * 87) * amp; camera.position.y += Math.cos(t * 71) * amp;
  if (t >= SLAM.hit && t < SLAM.hit + 2.2) camera.rotateZ(Math.sin((t - SLAM.hit) * 3) * 0.03 * (1 - (t - SLAM.hit) / 2.2)); // staggered wobble
  if (t >= 6.85 && t < 7.45) camera.rotateZ(-Math.sin(((t - 6.85) / 0.6) * Math.PI) * 0.12); // lean into the cleave
  camera.updateMatrixWorld(true);

  trollPose(t);
  updateTrail(t); // evaluates past poses; restore the current one afterwards
  const { pose } = swordPose(t); applyPose(pose); hand.updateMatrixWorld(true);
  // blade glow: fury tint, charge build-up
  const charge = t >= 6.15 && t < 7.1 ? Math.min(1, (t - 6.15) / 0.7) : 0;
  swordSteel.emissiveIntensity = Math.max(t >= FURY ? 0.15 : 0, charge * 1.6); swordGlow.intensity = charge * 6 + (t >= FURY ? 0.8 : 0);
  // slam telegraph + shockwave
  const tel = t >= SLAM.raise && t < SLAM.hit ? (t - SLAM.raise) / (SLAM.hit - SLAM.raise) : 0;
  slamRing.visible = slamFill.visible = tel > 0; slamRing.scale.setScalar(0.3 + tel * 0.9); slamFill.scale.setScalar(tel * 1.2); slamFill.material.opacity = 0.1 + tel * 0.2;
  const sw = t - SLAM.hit; shock.visible = sw >= 0 && sw < 0.55; shock.scale.setScalar(0.3 + sw * 5); shock.material.opacity = 1 - sw / 0.55;
  // loot
  const lt = t - (DEATH + 1.3); lootBeam.visible = lt > 0; lootBeam.material.opacity = Math.min(0.5, lt * 1.2); lootLight.intensity = lt > 0 ? Math.min(14, lt * 30) : 0;
  updateParticles(t);
  updateHUD(t);
  // render: colour, then normals/depth for the ink outline, then composite
  renderer.setRenderTarget(colorRT); renderer.render(scene, camera);
  const vis = fx.map((o) => o.visible); fx.forEach((o) => { o.visible = false; });
  scene.overrideMaterial = normalMat; const fog = scene.fog; scene.fog = null;
  renderer.setRenderTarget(normalRT); renderer.render(scene, camera);
  scene.overrideMaterial = null; scene.fog = fog; fx.forEach((o, i) => { o.visible = vis[i]; });
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
};
window.DURATION = 9.6;
window.renderAt(0);
window.__ready = true;
