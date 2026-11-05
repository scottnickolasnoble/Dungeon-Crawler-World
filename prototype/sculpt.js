// Shared sculpting toolkit: noise, SDF primitives, surface-nets mesher, PBR materials.
import * as THREE from './node_modules/three/build/three.module.js';

// ---------- noise ----------
function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
}
export const fbm = (x, y, z) => vnoise(x, y, z) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 4.3) * 0.1;
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
let seed = 11;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const reseed = (s) => { seed = s; };

// ---------- SDF primitives ----------
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
export const smax = (a, b, k) => -smin(-a, -b, k);
export function ell(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = (px - cx) / rx, y = (py - cy) / ry, z = (pz - cz) / rz;
  const k0 = Math.sqrt(x * x + y * y + z * z);
  const x1 = x / rx, y1 = y / ry, z1 = z / rz;
  const k1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  return k1 === 0 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
}
export function rcone(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}
export const sph = (px, py, pz, cx, cy, cz, r) => Math.hypot(px - cx, py - cy, pz - cz) - r;
export function rbox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
  const qx = Math.abs(px - cx) - hx + r, qy = Math.abs(py - cy) - hy + r, qz = Math.abs(pz - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
// chain of tapered capsules through pts with radii
export function chain(px, py, pz, pts, rad, k = 0.03) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    d = smin(d, rcone(px, py, pz, a[0], a[1], a[2], b[0], b[1], b[2], rad[i], rad[i + 1]), k);
  }
  return d;
}

// ---------- surface nets ----------
export function surfaceNets(f, min, max, step) {
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
  const quad = (a, b, c, d) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; ind.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = vals[idx(i, j, k)] < 0;
    if (v0 !== (vals[idx(i + 1, j, k)] < 0)) quad(cell[idx(i, j, k)], cell[idx(i, j - 1, k)], cell[idx(i, j - 1, k - 1)], cell[idx(i, j, k - 1)]);
    if (v0 !== (vals[idx(i, j + 1, k)] < 0)) quad(cell[idx(i, j, k)], cell[idx(i, j, k - 1)], cell[idx(i - 1, j, k - 1)], cell[idx(i - 1, j, k)]);
    if (v0 !== (vals[idx(i, j, k + 1)] < 0)) quad(cell[idx(i, j, k)], cell[idx(i - 1, j, k)], cell[idx(i - 1, j - 1, k)], cell[idx(i, j - 1, k)]);
  }
  return { pos: new Float32Array(pos), ind };
}

// Mesh an SDF. colorFn(x,y,z,nx,ny,nz,ao,color) writes the vertex colour.
export function buildMesh(f, min, max, step, colorFn) {
  const t0 = performance.now();
  const { pos, ind } = surfaceNets(f, min, max, step);
  const n = pos.length / 3, nor = new Float32Array(pos.length), col = new Float32Array(pos.length);
  const e = step * 0.3, c = new THREE.Color();
  for (let v = 0; v < n; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e);
    const L = Math.hypot(gx, gy, gz) || 1; gx /= L; gy /= L; gz /= L;
    nor[v * 3] = gx; nor[v * 3 + 1] = gy; nor[v * 3 + 2] = gz;
    let occ = 0;
    for (let i = 1; i <= 4; i++) { const hh = step * 1.4 * i; occ += (hh - f(x + gx * hh, y + gy * hh, z + gz * hh)) / (1 << i); }
    const ao = Math.min(1, Math.max(0.18, 1 - occ * (9 * 0.0085 / step)));
    c.setRGB(0.5, 0.5, 0.5); colorFn(x, y, z, gx, gy, gz, ao, c);
    col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
  }
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
  console.log(`mesh: ${n} verts, ${(ind.length / 3) | 0} tris, ${(performance.now() - t0) | 0}ms`);
  return geo;
}

// Skin with micro-detail bump in the shader.
export function skinMaterial({ roughness = 0.58, clearcoat = 0.35, clearcoatRoughness = 0.35, sheen = 0.18, sheenColor = '#8a3a28', pore = 1, poreScale = 1, emissive } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness, metalness: 0, clearcoat, clearcoatRoughness, sheen, sheenColor: new THREE.Color(sheenColor), sheenRoughness: 0.6 });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 1; }
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vObjPos; uniform mat4 modelMatrix;
      float h3(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float skinH(vec3 p){ p *= ${poreScale.toFixed(3)}; return n3(p*260.0)*0.5 + n3(p*120.0)*0.35 + abs(n3(p*70.0)-0.5)*0.6; }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        float e = 0.0012; float h0 = skinH(vObjPos);
        vec3 g = vec3(skinH(vObjPos+vec3(e,0,0))-h0, skinH(vObjPos+vec3(0,e,0))-h0, skinH(vObjPos+vec3(0,0,e))-h0);
        vec3 gv = (viewMatrix * modelMatrix * vec4(g, 0.0)).xyz;
        normal = normalize(normal - (gv - dot(gv, normal)*normal) * ${(0.9 * pore).toFixed(3)});
      }`);
  };
  return m;
}

export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}

// Eye texture: sclera colour, iris colours, pupil shape ('slit' | 'round' | 'goat').
export function eyeTexture({ sclera = '#d8c79a', iris = ['#ff3d00', '#ffb300', '#c77800', '#3a1d00'], pupil = 'slit', veins = 70, irisR = 78 } = {}) {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = sclera; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,20,20,0.7)';
    for (let i = 0; i < veins; i++) {
      let x = w * 0.25 + (rnd() - 0.5) * w * 0.5, y = h * 0.5 + (rnd() - 0.5) * h * 0.8;
      g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (w * 0.25 - x) * 0.18 + (rnd() - 0.5) * 18; y += (h * 0.5 - y) * 0.18 + (rnd() - 0.5) * 18; g.lineTo(x, y); }
      g.stroke();
    }
    const cx = w * 0.25, cy = h * 0.5, R = irisR;
    const gr = g.createRadialGradient(cx, cy, 6, cx, cy, R);
    gr.addColorStop(0, iris[0]); gr.addColorStop(0.35, iris[1]); gr.addColorStop(0.8, iris[2]); gr.addColorStop(1, iris[3]);
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = 'rgba(30,15,0,0.45)'; g.lineWidth = 1.2;
    for (let a = 0; a < 6.28; a += 0.09) { g.beginPath(); g.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); g.lineTo(cx + Math.cos(a) * R * (0.8 + rnd() * 0.2), cy + Math.sin(a) * R * (0.8 + rnd() * 0.2)); g.stroke(); }
    g.fillStyle = '#050302'; g.beginPath();
    if (pupil === 'slit') g.ellipse(cx, cy, R * 0.13, R * 0.72, 0, 0, 7);
    else if (pupil === 'goat') g.ellipse(cx, cy, R * 0.7, R * 0.18, 0, 0, 7);
    else g.arc(cx, cy, R * 0.35, 0, 7);
    g.fill();
    g.lineWidth = 7; g.strokeStyle = 'rgba(20,8,0,0.9)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  });
}
export function eyeMesh(tex, r, glow = 0.12, glowColor = '#ff8800') {
  const m = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.02, emissive: new THREE.Color(glowColor), emissiveIntensity: glow, emissiveMap: tex });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), m);
}
// a grime/scratch texture for hard-surface props
export function grimeTex(base, { rust = 60, scratches = 2500 } = {}) {
  return canvasTex(512, 512, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < scratches; i++) { g.fillStyle = `rgba(${rnd() < 0.6 ? 30 : 220},${rnd() < 0.6 ? 26 : 215},${rnd() < 0.6 ? 22 : 205},${rnd() * 0.2})`; g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 30, 1 + rnd() * 1.5); }
    for (let i = 0; i < rust; i++) { g.fillStyle = `rgba(110,50,20,${0.15 + rnd() * 0.4})`; g.beginPath(); g.arc(rnd() * 512, rnd() * 512, 3 + rnd() * 22, 0, 7); g.fill(); }
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,20,10,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  });
}
export const toothMat = () => new THREE.MeshPhysicalMaterial({ color: '#c9b27a', roughness: 0.42, clearcoat: 0.4 });
export const clawMat = () => new THREE.MeshPhysicalMaterial({ color: '#1e1a14', roughness: 0.3, clearcoat: 0.6 });
