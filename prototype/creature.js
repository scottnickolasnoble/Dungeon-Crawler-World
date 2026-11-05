// Sculpted goblin: signed-distance anatomy -> surface nets mesh -> PBR skin.
import * as THREE from './node_modules/three/build/three.module.js';

// ---------- noise ----------
function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
}
const fbm = (x, y, z) => vnoise(x, y, z) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 4.3) * 0.1;

// ---------- SDF primitives ----------
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
function ell(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx, y = (py - cy) / ry, z = (pz - cz) / rz;
  const k0 = Math.sqrt(x * x + y * y + z * z);
  const x1 = x / rx, y1 = y / ry, z1 = z / rz;
  const k1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  return k1 === 0 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
}
// tapered capsule from a (radius ra) to b (radius rb)
function rcone(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}
const sph = (px, py, pz, cx, cy, cz, r) => Math.hypot(px - cx, py - cy, pz - cz) - r;

// ---------- anatomy ----------
// units: metres, feet at y=0, facing +z. Right side is -x.
export const EYE = { y: 1.618, z: 0.243, x: 0.056, r: 0.027 };
export const RIGHT_HAND = [-0.33, 1.02, 0.36];

function limb(px, py, pz, pts, rad) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    d = smin(d, rcone(px, py, pz, a[0], a[1], a[2], b[0], b[1], b[2], rad[i], rad[i + 1]), 0.04);
  }
  return d;
}
function fingers(px, py, pz, base, dirs, len, r) {
  let d = 1e9;
  for (const f of dirs) {
    const m = [base[0] + f[0] * len * 0.5, base[1] + f[1] * len * 0.5, base[2] + f[2] * len * 0.5];
    const t = [base[0] + f[0] * len + f[3], base[1] + f[1] * len + f[4], base[2] + f[2] * len + f[5]];
    d = Math.min(d, rcone(px, py, pz, base[0], base[1], base[2], m[0], m[1], m[2], r, r * 0.85));
    d = Math.min(d, rcone(px, py, pz, m[0], m[1], m[2], t[0], t[1], t[2], r * 0.85, r * 0.55));
  }
  return d;
}

function body(px, py, pz) {
  const ax = Math.abs(px);
  // torso (hunched forward)
  let d = ell(px, py, pz, 0, 0.86, 0.0, 0.17, 0.13, 0.13);
  d = smin(d, ell(px, py, pz, 0, 1.0, 0.045, 0.165, 0.15, 0.15), 0.08);
  d = smin(d, ell(px, py, pz, 0, 1.2, 0.02, 0.215, 0.17, 0.15), 0.1);
  d = smin(d, ell(ax, py, pz, 0.095, 1.25, 0.12, 0.095, 0.065, 0.05), 0.04); // pecs
  d = smin(d, ell(ax, py, pz, 0.24, 1.3, 0.0, 0.085, 0.08, 0.085), 0.06);   // delts
  d = smin(d, ell(ax, py, pz, 0.1, 1.33, -0.06, 0.11, 0.06, 0.08), 0.07);   // traps
  // ribs on flanks
  for (let i = 0; i < 4; i++) {
    const y = 1.17 - i * 0.045;
    d = smin(d, rcone(ax, py, pz, 0.11, y, 0.135, 0.18, y - 0.025, 0.06, 0.011, 0.009), 0.025);
  }
  // abs + navel crease
  for (let i = 0; i < 3; i++) d = smin(d, ell(ax, py, pz, 0.045, 1.08 - i * 0.055, 0.17, 0.04, 0.025, 0.02), 0.02);
  // spine knobs
  for (let i = 0; i < 7; i++) d = smin(d, sph(px, py, pz, 0, 1.36 - i * 0.065, -0.115 + Math.sin(i * 0.6) * 0.01, 0.022), 0.03);
  // collarbones
  d = smin(d, rcone(ax, py, pz, 0.03, 1.34, 0.09, 0.2, 1.36, 0.03, 0.013, 0.012), 0.025);
  // neck, jutting forward
  d = smin(d, rcone(px, py, pz, 0, 1.33, 0.0, 0, 1.5, 0.08, 0.09, 0.07), 0.07);
  d = smin(d, rcone(ax, py, pz, 0.05, 1.47, 0.05, 0.15, 1.35, -0.02, 0.035, 0.05), 0.05); // neck/shoulder muscle
  d = smin(d, rcone(ax, py, pz, 0.03, 1.48, 0.12, 0.075, 1.36, 0.06, 0.012, 0.014), 0.03); // neck tendons

  // arms. right arm raised with club, left reaching forward with claws
  d = smin(d, limb(px, py, pz, [[-0.25, 1.3, 0], [-0.36, 1.05, 0.12], [-0.33, 1.02, 0.34]], [0.062, 0.048, 0.034]), 0.05);
  d = smin(d, ell(px, py, pz, -0.31, 1.18, 0.07, 0.05, 0.08, 0.05), 0.04);  // r bicep
  d = smin(d, ell(px, py, pz, -0.35, 1.04, 0.22, 0.045, 0.04, 0.08), 0.04); // r forearm
  d = smin(d, limb(px, py, pz, [[0.25, 1.3, 0], [0.37, 1.02, 0.06], [0.34, 0.92, 0.3]], [0.062, 0.048, 0.034]), 0.05);
  d = smin(d, ell(px, py, pz, 0.32, 1.16, 0.03, 0.05, 0.08, 0.05), 0.04);
  d = smin(d, ell(px, py, pz, 0.36, 0.98, 0.16, 0.045, 0.04, 0.08), 0.04);
  // hands
  d = smin(d, ell(px, py, pz, -0.33, 1.02, 0.37, 0.04, 0.05, 0.04), 0.03);
  d = smin(d, fingers(px, py, pz, [-0.33, 1.02, 0.39], [[0.4, 0.2, 0.6, 0.03, -0.03, -0.04], [0.5, 0.0, 0.55, 0.03, -0.04, -0.03], [0.5, -0.2, 0.5, 0.03, -0.04, -0.03], [0.4, -0.4, 0.45, 0.02, -0.03, -0.02]], 0.07, 0.013), 0.012);
  d = smin(d, ell(px, py, pz, 0.34, 0.91, 0.33, 0.04, 0.035, 0.05), 0.03);
  d = smin(d, fingers(px, py, pz, [0.34, 0.91, 0.36], [[-0.25, -0.1, 1, 0, -0.02, 0.01], [0, -0.15, 1, 0, -0.03, 0.01], [0.25, -0.2, 0.95, 0, -0.03, 0], [0.5, -0.1, 0.8, 0, -0.02, 0]], 0.11, 0.012), 0.012);

  // legs: squat, knees bent outward
  d = smin(d, limb(ax, py, pz, [[0.1, 0.82, 0], [0.17, 0.46, 0.11], [0.15, 0.09, -0.03]], [0.095, 0.062, 0.04]), 0.05);
  d = smin(d, ell(ax, py, pz, 0.15, 0.66, 0.06, 0.085, 0.14, 0.085), 0.05); // quads
  d = smin(d, ell(ax, py, pz, 0.165, 0.32, -0.01, 0.055, 0.09, 0.06), 0.04); // calves
  d = smin(d, sph(ax, py, pz, 0.175, 0.47, 0.14, 0.035), 0.03); // kneecap
  d = smin(d, ell(ax, py, pz, 0.155, 0.045, 0.06, 0.055, 0.04, 0.11), 0.04); // feet
  d = smin(d, fingers(ax, py, pz, [0.155, 0.035, 0.13], [[-0.3, 0, 1, 0, -0.015, 0], [0, 0, 1, 0, -0.015, 0], [0.3, 0, 1, 0, -0.015, 0]], 0.08, 0.016), 0.015);
  return d;
}

function head(px, py, pz) {
  const ax = Math.abs(px);
  let d = ell(px, py, pz, 0, 1.63, 0.1, 0.14, 0.135, 0.155);                     // cranium
  d = smin(d, rcone(ax, py, pz, 0.0, 1.665, 0.225, 0.1, 1.655, 0.19, 0.03, 0.022), 0.035); // heavy brow
  d = smin(d, sph(ax, py, pz, 0.088, 1.585, 0.195, 0.038), 0.035);               // cheekbones
  d = smin(d, ell(px, py, pz, 0, 1.51, 0.19, 0.105, 0.065, 0.1), 0.06);         // muzzle
  d = smin(d, ell(px, py, pz, 0, 1.465, 0.2, 0.085, 0.04, 0.09), 0.04);         // underbite jaw
  // long hooked nose
  d = smin(d, rcone(px, py, pz, 0, 1.635, 0.245, 0, 1.565, 0.318, 0.022, 0.03), 0.03);
  d = smin(d, ell(px, py, pz, 0, 1.55, 0.315, 0.032, 0.022, 0.022), 0.02);
  d = smax(d, -sph(ax, py, pz, 0.017, 1.538, 0.322, 0.011), 0.008);               // nostrils
  // eye sockets
  d = smax(d, -sph(ax, py, pz, EYE.x, EYE.y, EYE.z + 0.002, 0.03), 0.012);
  // eyelids: hooded shell over upper half of eye
  const lid = sph(ax, py, pz, EYE.x, EYE.y, EYE.z - 0.001, 0.0305);
  d = smin(d, Math.max(lid, -(py - (EYE.y + 0.003 - (ax - EYE.x) * 0.25))), 0.008); // hooded upper lid
  d = smin(d, Math.max(lid, (py - (EYE.y - 0.016))), 0.006); // lower lid
  // mouth slit with snarl
  d = smax(d, -ell(px, py, pz, 0, 1.492 + ax * 0.2 - Math.max(0, 0.03 - ax) * 0.15, 0.285, 0.072, 0.0105, 0.05), 0.008);
  // jowls / nasolabial folds
  d = smin(d, rcone(ax, py, pz, 0.035, 1.56, 0.27, 0.07, 1.49, 0.25, 0.014, 0.018), 0.02);
  // big ears sweeping back, flattened
  {
    const ex = ax - 0.13, ey = py - 1.645, ez = pz - 0.06;
    const fx = ex, fy = ey * 1.0, fz = ez * 2.6; // squash thickness
    let e = rcone(fx, fy, fz, 0, 0, 0, 0.26, 0.09, -0.2, 0.055, 0.006);
    e = smin(e, rcone(fx, fy + 0.03, fz - 0.01, 0.02, 0, 0, 0.24, 0.1, -0.18, 0.018, 0.003), 0.02); // ear ridge
    d = smin(d, e, 0.03);
  }
  return d;
}

export function goblinSDF(px, py, pz) {
  let d = smin(body(px, py, pz), head(px, py, pz), 0.05);
  if (d < 0.03 && d > -0.03) {
    // lumpy, wrinkled hide
    d += fbm(px * 9, py * 9, pz * 9) * 0.006;
    d += (Math.abs(vnoise(px * 38, py * 55, pz * 38)) - 0.3) * 0.0026;
    // warts
    const w = vnoise(px * 26 + 11, py * 26, pz * 26 - 7);
    if (w > 0.62) d -= (w - 0.62) * 0.03;
  }
  return d;
}

// ---------- surface nets ----------
function surfaceNets(f, min, max, step) {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1, ny = Math.ceil((max[1] - min[1]) / step) + 1, nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const vals = new Float32Array(nx * ny * nz);
  const idx = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
    vals[idx(i, j, k)] = f(min[0] + i * step, min[1] + j * step, min[2] + k * step);
  const cell = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const o = corners[c]; cv[c] = vals[idx(i + o[0], j + o[1], k + o[2])]; if (cv[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]), A = corners[a], B = corners[b];
      sx += A[0] + (B[0] - A[0]) * t; sy += A[1] + (B[1] - A[1]) * t; sz += A[2] + (B[2] - A[2]) * t; n++;
    }
    cell[idx(i, j, k)] = pos.length / 3;
    pos.push(min[0] + (i + sx / n) * step, min[1] + (j + sy / n) * step, min[2] + (k + sz / n) * step);
  }
  const ind = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) ind.push(a, c, b, a, d, c); else ind.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = vals[idx(i, j, k)] < 0;
    if (v0 !== (vals[idx(i + 1, j, k)] < 0)) quad(cell[idx(i, j, k)], cell[idx(i, j - 1, k)], cell[idx(i, j - 1, k - 1)], cell[idx(i, j, k - 1)], v0);
    if (v0 !== (vals[idx(i, j + 1, k)] < 0)) quad(cell[idx(i, j, k)], cell[idx(i, j, k - 1)], cell[idx(i - 1, j, k - 1)], cell[idx(i - 1, j, k)], v0);
    if (v0 !== (vals[idx(i, j, k + 1)] < 0)) quad(cell[idx(i, j, k)], cell[idx(i - 1, j, k)], cell[idx(i - 1, j - 1, k)], cell[idx(i, j - 1, k)], v0);
  }
  return { pos: new Float32Array(pos), ind };
}

// ---------- textures ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const eyeTex = canvasTex(1024, 512, (g, w, h) => {
  // bloodshot yellowed sclera
  g.fillStyle = '#d8c79a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(150,20,20,0.75)';
  for (let i = 0; i < 70; i++) {
    let x = w * 0.25 + (rnd() - 0.5) * w * 0.5, y = h * 0.5 + (rnd() - 0.5) * h * 0.8;
    g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (w * 0.25 - x) * 0.18 + (rnd() - 0.5) * 18; y += (h * 0.5 - y) * 0.18 + (rnd() - 0.5) * 18; g.lineTo(x, y); }
    g.stroke();
  }
  const cx = w * 0.25, cy = h * 0.5, R = 78;
  const gr = g.createRadialGradient(cx, cy, 6, cx, cy, R);
  gr.addColorStop(0, '#ff3d00'); gr.addColorStop(0.35, '#ffb300'); gr.addColorStop(0.8, '#c77800'); gr.addColorStop(1, '#3a1d00');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.strokeStyle = 'rgba(60,25,0,0.5)'; g.lineWidth = 1.2;
  for (let a = 0; a < 6.28; a += 0.09) { g.beginPath(); g.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); g.lineTo(cx + Math.cos(a) * R * (0.8 + rnd() * 0.2), cy + Math.sin(a) * R * (0.8 + rnd() * 0.2)); g.stroke(); }
  g.fillStyle = '#050302'; g.beginPath(); g.ellipse(cx, cy, 10, 56, 0, 0, 7); g.fill(); // slit pupil
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 7; g.strokeStyle = 'rgba(30,10,0,0.9)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
});
const coneTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#e8590c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#eeeae0'; g.fillRect(0, h * 0.35, w, h * 0.14); g.fillRect(0, h * 0.62, w, h * 0.09);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${40 + rnd() * 40},${25 + rnd() * 20},10,${rnd() * 0.25})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 14, 1 + rnd() * 3); }
  g.strokeStyle = 'rgba(255,235,210,0.5)';
  for (let i = 0; i < 140; i++) { g.lineWidth = rnd() * 1.4; g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 10); g.stroke(); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,25,10,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const barkTex = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#4a3020'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${20 + rnd() * 50},${12 + rnd() * 25},5,0.8)`; g.lineWidth = 1 + rnd() * 4; const x = rnd() * w; g.beginPath(); g.moveTo(x, rnd() * h); g.lineTo(x + (rnd() - 0.5) * 8, rnd() * h); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(90,10,5,0.35)'; g.beginPath(); g.arc(rnd() * w, h * 0.7 + rnd() * h * 0.3, 4 + rnd() * 14, 0, 7); g.fill(); } // old blood
});
const leatherTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3d2a1c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? 10 : 90},${rnd() < 0.5 ? 6 : 60},4,${rnd() * 0.3})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
});
leatherTex.wrapS = leatherTex.wrapT = THREE.RepeatWrapping;

const grime = (base, o = {}) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rnd() < 0.6 ? 30 : 220},${rnd() < 0.6 ? 26 : 215},20,${rnd() * 0.22})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 16, 1 + rnd() * 1.5); }
  for (let i = 0; i < (o.rust ?? 25); i++) { g.fillStyle = `rgba(110,50,20,${0.15 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 2 + rnd() * 10, 0, 7); g.fill(); }
});

// ---------- build ----------
let cachedGeo = null;
function buildSkinGeometry() {
  if (cachedGeo) return cachedGeo;
  const t0 = performance.now();
  const step = 0.0085;
  const { pos, ind } = surfaceNets(goblinSDF, [-0.52, -0.02, -0.34], [0.52, 1.84, 0.5], step);
  const n = pos.length / 3, nor = new Float32Array(pos.length), col = new Float32Array(pos.length);
  const e = 0.0025;
  const base = new THREE.Color('#566a34'), belly = new THREE.Color('#8a8a52'), flush = new THREE.Color('#8a4a3a'), dark = new THREE.Color('#2a3018'), vein = new THREE.Color('#3b4a52');
  const c = new THREE.Color();
  for (let v = 0; v < n; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let gx = goblinSDF(x + e, y, z) - goblinSDF(x - e, y, z), gy = goblinSDF(x, y + e, z) - goblinSDF(x, y - e, z), gz = goblinSDF(x, y, z + e) - goblinSDF(x, y, z - e);
    const L = Math.hypot(gx, gy, gz) || 1; gx /= L; gy /= L; gz /= L;
    nor.set([gx, gy, gz], v * 3);
    // ambient occlusion from the distance field
    let occ = 0;
    for (let i = 1; i <= 4; i++) { const hh = 0.012 * i; occ += (hh - goblinSDF(x + gx * hh, y + gy * hh, z + gz * hh)) / (1 << i); }
    const ao = Math.min(1, Math.max(0.2, 1 - occ * 9));
    // skin colour: mottled, paler belly, flushed extremities, dark veins on limbs
    c.copy(base);
    const mott = fbm(x * 14, y * 14, z * 14);
    c.lerp(dark, Math.max(0, mott) * 0.55);
    if (z > 0.08 && y > 0.85 && y < 1.3) c.lerp(belly, Math.max(0, Math.min(1, (z - 0.08) * 7)) * 0.45);
    const ax = Math.abs(x);
    const cl = (v) => Math.min(1, Math.max(0, v));
    if (y > 1.58) c.lerp(flush, cl((ax - 0.2) * 5) * 0.5);                               // ear tips
    c.lerp(flush, cl(1 - Math.hypot(x, y - 1.555, z - 0.31) / 0.07) * 0.55);             // nose
    c.lerp(flush, cl(1 - Math.hypot(x * 0.6, y - 1.49, z - 0.27) / 0.05) * 0.3);          // lips
    const vn = Math.abs(vnoise(x * 22, y * 9, z * 22));
    if (vn < 0.05 && ax > 0.2 && y < 1.32) c.lerp(vein, (0.05 - vn) * 14);
    const spots = vnoise(x * 60, y * 60, z * 60);
    if (spots > 0.7) c.lerp(dark, 0.5);
    if (y < 0.45) c.lerp(new THREE.Color('#2e2418'), Math.min(1, (0.45 - y) * 3.2) * 0.7); // dried mud
    const sc = Math.abs((x * 0.8 + y * 0.6) * 90 % 1 - 0.5);
    if (x < -0.05 && x > -0.16 && y > 1.1 && y < 1.26 && z > 0.1 && sc < 0.05) c.lerp(new THREE.Color('#9a6a58'), 0.6); // scars
    c.multiplyScalar(ao);
    col.set([c.r, c.g, c.b], v * 3);
  }
  // make every triangle face along the distance-field gradient
  for (let t = 0; t < ind.length; t += 3) {
    const i0 = ind[t] * 3, i1 = ind[t + 1] * 3, i2 = ind[t + 2] * 3;
    const ux = pos[i1] - pos[i0], uy = pos[i1 + 1] - pos[i0 + 1], uz = pos[i1 + 2] - pos[i0 + 2];
    const vx = pos[i2] - pos[i0], vy = pos[i2 + 1] - pos[i0 + 1], vz = pos[i2 + 2] - pos[i0 + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const ax = nor[i0] + nor[i1] + nor[i2], ay = nor[i0 + 1] + nor[i1 + 1] + nor[i2 + 1], az = nor[i0 + 2] + nor[i1 + 2] + nor[i2 + 2];
    if (fx * ax + fy * ay + fz * az < 0) { const tmp = ind[t + 1]; ind[t + 1] = ind[t + 2]; ind[t + 2] = tmp; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(ind);
  console.log(`goblin mesh: ${n} verts, ${ind.length / 3} tris, ${(performance.now() - t0) | 0}ms`);
  cachedGeo = geo; return geo;
}

function skinMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.58, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35,
    sheen: 0.18, sheenColor: new THREE.Color('#8a3a28'), sheenRoughness: 0.6,
  });
  // fine pores / micro wrinkles in the shader
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vObjPos; uniform mat4 modelMatrix;
      float h3(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float skinH(vec3 p){ return n3(p*260.0)*0.5 + n3(p*120.0)*0.35 + abs(n3(p*70.0)-0.5)*0.6; }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        float e = 0.0012; float h0 = skinH(vObjPos);
        vec3 g = vec3(skinH(vObjPos+vec3(e,0,0))-h0, skinH(vObjPos+vec3(0,e,0))-h0, skinH(vObjPos+vec3(0,0,e))-h0);
        vec3 gv = (viewMatrix * modelMatrix * vec4(g, 0.0)).xyz;
        normal = normalize(normal - (gv - dot(gv, normal)*normal) * 0.9);
      }`);
  };
  return m;
}

// Outfit variants: every goblin in a pack looks a little different.
const HEADGEAR = ['cone', 'coneYellow', 'bucket', 'hardhat', 'coneBroken', 'cone'];
const WEAPONS = ['club', 'pipe', 'stopSign', 'club'];
const SKIN_TINTS = ['#ffffff', '#e4f0cc', '#d6dcff', '#ffe4cc', '#c8d8b0'];
const CLOTH = ['#8a7058', '#5a6a7a', '#7a3a2a', '#4a5a3a'];
export function makeGoblin(opts = {}) {
  const v = opts.variant ?? 0;
  const pick = (arr, k) => arr[(v + k * 7) % arr.length]; // each attribute steps once per goblin, so pack-mates differ
  const g = new THREE.Group();
  const sm = skinMaterial(); sm.color = new THREE.Color(pick(SKIN_TINTS, 1));
  const skin = new THREE.Mesh(buildSkinGeometry(), sm);
  g.add(skin);
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: eyeTex, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.02, emissive: new THREE.Color('#ff8800'), emissiveIntensity: 0.12, emissiveMap: eyeTex });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(EYE.r, 32, 24), eyeMat);
    eye.position.set(sx * EYE.x, EYE.y, EYE.z); eye.rotation.y = -sx * 0.12; g.add(eye);
  }
  // rotten teeth and tusks
  const toothMat = new THREE.MeshPhysicalMaterial({ color: '#c9b27a', roughness: 0.45, clearcoat: 0.4 });
  const teeth = [[-0.05, 0.022, 0.09], [-0.028, 0.014, -0.05], [-0.01, 0.012, 0.15], [0.012, 0.013, -0.12], [0.032, 0.015, 0.05], [0.055, 0.024, -0.1]];
  for (const [x, hgt, tilt] of teeth) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.0075 + hgt * 0.15, hgt, 6), toothMat);
    t.position.set(x, 1.478 + Math.abs(x) * 0.15 + hgt * 0.5, 0.272 - Math.abs(x) * 0.6); t.rotation.z = tilt; g.add(t);
  }
  for (const sx of [-1, 1]) {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.05, 8), toothMat);
    tusk.position.set(sx * 0.058, 1.505, 0.262); tusk.rotation.set(-0.25, 0, -sx * 0.3); tusk.scale.set(1.2, 1.3, 1.2); g.add(tusk);
  }
  // claws
  const clawMat = new THREE.MeshPhysicalMaterial({ color: '#1e1a14', roughness: 0.3, clearcoat: 0.6 });
  const claw = (x, y, z, rx, rz) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.035, 6), clawMat); c.position.set(x, y, z); c.rotation.set(rx, 0, rz); g.add(c); };
  for (const [dx, dy] of [[-0.25, -0.1], [0, -0.15], [0.25, -0.2], [0.5, -0.1]]) claw(0.34 + dx * 0.11, 0.91 + dy * 0.11 - 0.02, 0.36 + 0.11 * 0.95 + 0.015, 1.9, 0);
  // traffic-cone helmet, real plastic
  const gear = pick(HEADGEAR, 2);
  const helmet = new THREE.Group();
  if (gear.startsWith('cone')) {
    const coneMat = new THREE.MeshPhysicalMaterial({ map: coneTex, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.6, color: gear === 'coneYellow' ? '#ffe070' : '#ffffff' });
    const h = gear === 'coneBroken' ? 0.22 : 0.36;
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(gear === 'coneBroken' ? 0.07 : 0.028, 0.15, h, 40, 1, true), coneMat); cone.position.y = h / 2;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.022, 0.31), new THREE.MeshPhysicalMaterial({ color: gear === 'coneYellow' ? '#c8a020' : '#c94a0a', roughness: 0.7 }));
    helmet.add(cone, brim);
    if (gear !== 'coneBroken') { const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 20), coneMat); tip.position.y = h; helmet.add(tip); }
  } else if (gear === 'bucket') {
    const tin = new THREE.MeshStandardMaterial({ map: grime('#8a8c90'), metalness: 0.85, roughness: 0.45 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.2, 32, 1, true), tin); b.position.y = 0.08; b.material.side = THREE.DoubleSide;
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), tin); top.rotation.x = -Math.PI / 2; top.position.y = 0.18;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.005, 6, 24, Math.PI), tin); handle.position.y = 0.02; handle.rotation.z = Math.PI;
    helmet.add(b, top, handle);
  } else {
    const plastic = new THREE.MeshPhysicalMaterial({ color: '#e8b400', roughness: 0.4, clearcoat: 0.6, map: grime('#e8b400') });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.145, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), plastic); dome.position.y = 0.0;
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 32, 1, false, -0.9, 1.8), plastic); peak.position.set(0, 0.0, 0.02);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.27), plastic); ridge.position.y = 0.13;
    helmet.add(dome, peak, ridge);
  }
  helmet.position.set(0.0, 1.70, 0.08); helmet.rotation.set(-0.18, 0, 0.12 * (v % 2 ? -1 : 1)); g.add(helmet);
  // hubcap shoulder armour on some goblins
  if (pick([0, 1, 0], 3)) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.025, 24), new THREE.MeshStandardMaterial({ map: grime('#b0b4ba'), metalness: 0.95, roughness: 0.3 }));
    cap.position.set(0.25, 1.36, 0.0); cap.rotation.set(0, 0, -0.9); g.add(cap);
  }
  // leather belt, straps and loincloth
  const leather = new THREE.MeshPhysicalMaterial({ map: leatherTex, roughness: 0.8, sheen: 0.3, sheenColor: new THREE.Color('#704a30') });
  const belt = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 10, 48), leather); belt.scale.set(0.185, 0.145, 1); belt.rotation.x = Math.PI / 2; belt.position.set(0, 0.9, 0.01);
  belt.scale.set(0.185, 0.15, 0.6); g.add(belt);
  const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 4), new THREE.MeshStandardMaterial({ color: '#8a7a5a', metalness: 0.9, roughness: 0.4 }));
  buckle.position.set(0.02, 0.9, 0.165); g.add(buckle);
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 1.34, -0.06), new THREE.Vector3(-0.12, 1.33, 0.1), new THREE.Vector3(0.0, 1.21, 0.175), new THREE.Vector3(0.13, 1.05, 0.19), new THREE.Vector3(0.18, 0.92, 0.15)]), 40, 0.018, 8), leather);
  strap.scale.set(1, 1, 1.02); g.add(strap);
  const cloth = new THREE.PlaneGeometry(0.22, 0.32, 20, 30); const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setZ(i, Math.sin(x * 60) * 0.008 + vnoise(x * 30, y * 20, 0) * 0.012 - (0.16 - y) * 0.1); if (y < -0.12) cp.setX(i, x + vnoise(x * 50, y * 50, 3) * 0.015); }
  cloth.computeVertexNormals();
  const rag = new THREE.Mesh(cloth, new THREE.MeshPhysicalMaterial({ map: leatherTex, color: pick(CLOTH, 4), roughness: 0.95, side: THREE.DoubleSide }));
  rag.position.set(0, 0.74, 0.16); g.add(rag);
  // weapon in the right hand
  const club = new THREE.Group();
  const weapon = pick(WEAPONS, 5);
  if (weapon === 'pipe') {
    const steel = new THREE.MeshStandardMaterial({ map: grime('#6a6c70'), metalness: 0.9, roughness: 0.5 });
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.75, 16), steel); p.position.y = 0.25; club.add(p);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.026, 10, 16, Math.PI / 2), steel); elbow.position.set(-0.05, 0.62, 0); club.add(elbow);
  } else if (weapon === 'stopSign') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 10), new THREE.MeshStandardMaterial({ map: grime('#7a7c80'), metalness: 0.8, roughness: 0.5 })); pole.position.y = 0.3; club.add(pole);
    const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 8), new THREE.MeshPhysicalMaterial({ map: grime('#b01810', { rust: 30 }), roughness: 0.5, metalness: 0.4 }));
    sign.rotation.x = Math.PI / 2; sign.position.set(0, 0.78, 0); club.add(sign);
    club.position.set(...RIGHT_HAND); club.rotation.set(-0.35, 0, 0.55); g.add(club);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  if (weapon === 'pipe') { club.position.set(...RIGHT_HAND); club.rotation.set(-0.35, 0, 0.55); g.add(club); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }
  const shaft = new THREE.CylinderGeometry(0.022, 0.05, 0.7, 14, 20); const sp = shaft.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i); const k = 1 + vnoise(x * 40, y * 12, z * 40) * 0.12; sp.setXYZ(i, x * k, y, z * k); }
  shaft.computeVertexNormals();
  const wood = new THREE.Mesh(shaft, new THREE.MeshPhysicalMaterial({ map: barkTex, roughness: 0.85 })); wood.position.y = 0.25;
  club.add(wood);
  const nailMat = new THREE.MeshStandardMaterial({ color: '#5d5248', metalness: 0.85, roughness: 0.55 });
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, y = 0.42 + (i % 6) * 0.04, r = 0.038 + (y - 0.3) * 0.04;
    const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.045, 6), nailMat);
    nail.position.set(Math.cos(a) * r, y, Math.sin(a) * r); nail.rotation.set(Math.sin(a) * 1.57, 0, -Math.cos(a) * 1.57); club.add(nail);
  }
  club.position.set(...RIGHT_HAND); club.position.x += 0.03; club.position.z += 0.02; club.rotation.set(-0.35, 0, 0.55); g.add(club);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
