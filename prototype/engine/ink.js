// Shared comic-ink renderer: toon materials, hand-painted canvas textures, and the ink-outline post-process.
// Used by every walkable floor. Resizes with the window; the outline pass can be toggled for slower machines.
import * as THREE from '../node_modules/three/build/three.module.js';

let seed = 7;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const seeded = (i, k = 1) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

function ramp(steps) {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const RAMP = ramp([70, 150, 255]);
export const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: RAMP, ...opts });
export function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function inkLine(g, x1, y1, x2, y2, wdt) { g.lineWidth = wdt; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2 + (rnd() - 0.5) * 6, (y1 + y2) / 2 + (rnd() - 0.5) * 6, x2, y2); g.stroke(); }
export const woodTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8a5a32'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = `hsl(28, 45%, ${30 + rnd() * 10}%)`; g.fillRect(0, i * 64 + 4, w, 56); g.strokeStyle = '#0d0b12'; inkLine(g, 0, i * 64, w, i * 64, 6); g.strokeStyle = 'rgba(13,11,18,0.6)'; for (let k = 0; k < 3; k++) { const y = i * 64 + 12 + rnd() * 40; inkLine(g, rnd() * 40, y, w - rnd() * 40, y + (rnd() - 0.5) * 8, 1.5); } }
  g.strokeStyle = '#0d0b12'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
});

export function createInk(container, { fov = 70 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(DPR); renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 600); scene.add(camera);
  const normalMat = new THREE.MeshNormalMaterial();
  const mk = () => { const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }); rt.depthTexture = new THREE.DepthTexture(4, 4); return rt; };
  const colorRT = mk(), normalRT = mk(); colorRT.samples = 4;
  const post = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: colorRT.texture }, tNormal: { value: normalRT.texture }, tDepth: { value: normalRT.depthTexture }, res: { value: new THREE.Vector2(4, 4) }, px: { value: 1.6 * DPR }, near: { value: camera.near }, far: { value: camera.far } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tColor, tNormal, tDepth; uniform vec2 res; uniform float px, near, far; varying vec2 vUv;
      float lin(vec2 uv){ float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return (2.0*near*far)/(far+near - z*(far-near)); }
      void main(){
        vec2 o = px / res; float d = lin(vUv);
        float dEdge = abs(lin(vUv-vec2(o.x,0.)) + lin(vUv+vec2(o.x,0.)) + lin(vUv+vec2(0.,o.y)) + lin(vUv-vec2(0.,o.y)) - 4.0*d) / max(d, 0.5);
        vec3 nl = texture2D(tNormal, vUv-vec2(o.x,0.)).xyz, nr = texture2D(tNormal, vUv+vec2(o.x,0.)).xyz, nu = texture2D(tNormal, vUv+vec2(0.,o.y)).xyz, nd = texture2D(tNormal, vUv-vec2(0.,o.y)).xyz;
        float edge = max(smoothstep(0.025, 0.07, dEdge), smoothstep(0.45, 0.9, length(nl-nr)+length(nu-nd)));
        edge *= 1.0 - smoothstep(25.0, 60.0, d) * 0.6;
        vec3 col = texture2D(tColor, vUv).rgb; float g = dot(col, vec3(0.333)); col = mix(vec3(g), col, 1.12);
        col = mix(col, vec3(0.003,0.002,0.004), edge);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const postScene = new THREE.Scene(); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fx = []; // objects hidden from the outline pass (glows, particles, transparent effects)
  const state = { outline: true, scale: 1 };
  function resize() {
    const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    const W = Math.floor(w * DPR * state.scale), H = Math.floor(h * DPR * state.scale);
    for (const rt of [colorRT, normalRT]) { rt.setSize(W, H); rt.depthTexture.image.width = W; rt.depthTexture.image.height = H; }
    post.uniforms.res.value.set(W, H);
  }
  window.addEventListener('resize', resize); resize();
  const rigged = new Set();
  function render() {
    post.uniforms.near.value = camera.near; post.uniforms.far.value = camera.far;
    if (!state.outline) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
    renderer.setRenderTarget(colorRT); renderer.render(scene, camera);
    const vis = fx.map((o) => o.visible); fx.forEach((o) => { o.visible = false; });
    // animated (rigged) meshes render their outline normals with their own deforming material, in a second pass on layer 2
    const rv = []; for (const m of rigged) { rv.push(m.visible); m.visible = false; }
    scene.overrideMaterial = normalMat; const fog = scene.fog; scene.fog = null;
    renderer.setRenderTarget(normalRT); renderer.render(scene, camera);
    scene.overrideMaterial = null;
    if (rigged.size) { let i = 0; const mats = []; for (const m of rigged) { m.visible = rv[i++]; mats.push(m.material); m.material = m.userData.normalMat; } const ac = renderer.autoClear; renderer.autoClear = false; camera.layers.set(2); renderer.render(scene, camera); camera.layers.set(0); renderer.autoClear = ac; i = 0; for (const m of rigged) m.material = mats[i++]; }
    scene.fog = fog; fx.forEach((o, i) => { o.visible = vis[i]; });
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }
  return { THREE, renderer, scene, camera, render, resize, fx, state, rigged };
}

// Collision world: axis-aligned boxes and circles in a spatial hash, resolved against a player circle.
export class Collision {
  constructor(cell = 8) { this.cell = cell; this.map = new Map(); }
  key(x, z) { return `${Math.floor(x / this.cell)},${Math.floor(z / this.cell)}`; }
  _add(o, minX, maxX, minZ, maxZ) { for (let x = Math.floor(minX / this.cell); x <= Math.floor(maxX / this.cell); x++) for (let z = Math.floor(minZ / this.cell); z <= Math.floor(maxZ / this.cell); z++) { const k = `${x},${z}`; if (!this.map.has(k)) this.map.set(k, []); this.map.get(k).push(o); } }
  box(cx, cz, hx, hz, rot = 0, h = 99) { // rotated box -> store as oriented box
    const o = { t: 'box', cx, cz, hx, hz, c: Math.cos(rot), s: Math.sin(rot), h }; const r = Math.hypot(hx, hz); this._add(o, cx - r, cx + r, cz - r, cz + r); return o; }
  circle(x, z, r, h = 99) { const o = { t: 'circle', x, z, r, h }; this._add(o, x - r, x + r, z - r, z + r); return o; }
  blocked(x, z, radius = 0.4, y = 0.5) { const q = { x, z }; const v = { x, z }; this.resolve(v, radius, y); return Math.abs(v.x - x) + Math.abs(v.z - z) > 1e-4; }
  resolve(p, radius, y = 0) { // pushes p (Vector3) out of anything it overlaps
    const near = new Set(); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const a = this.map.get(`${Math.floor(p.x / this.cell) + dx},${Math.floor(p.z / this.cell) + dz}`); if (a) a.forEach((o) => near.add(o)); }
    for (const o of near) {
      if (y > o.h) continue;
      if (o.t === 'circle') { const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), m = o.r + radius; if (d < m && d > 1e-6) { p.x = o.x + (dx / d) * m; p.z = o.z + (dz / d) * m; } }
      else { const lx = (p.x - o.cx) * o.c + (p.z - o.cz) * o.s, lz = -(p.x - o.cx) * o.s + (p.z - o.cz) * o.c; const qx = Math.max(-o.hx, Math.min(o.hx, lx)), qz = Math.max(-o.hz, Math.min(o.hz, lz)); let dx = lx - qx, dz = lz - qz, d = Math.hypot(dx, dz);
        if (d < radius) { if (d < 1e-6) { // centre inside the box: push out along the shallowest axis
            const pushX = o.hx - Math.abs(lx) < o.hz - Math.abs(lz);
            const nlx = pushX ? Math.sign(lx || 1) * (o.hx + radius) : lx, nlz = pushX ? lz : Math.sign(lz || 1) * (o.hz + radius);
            p.x = o.cx + nlx * o.c - nlz * o.s; p.z = o.cz + nlx * o.s + nlz * o.c; }
          else { const nlx = qx + (dx / d) * radius, nlz = qz + (dz / d) * radius; p.x = o.cx + nlx * o.c - nlz * o.s; p.z = o.cz + nlx * o.s + nlz * o.c; } } }
    }
  }
}
