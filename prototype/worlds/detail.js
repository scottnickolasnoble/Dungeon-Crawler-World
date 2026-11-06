// Shared scenery kit for towns and floors: varied building facades (brick, siding, stucco, panels, shopfronts),
// buildings with real roofs and trim (gable, hip or flat with parapet, chimneys, water towers, AC units, awnings,
// steps, fire escapes, drainpipes), a jittered placement grid (no rigid lattice), and an instancing batch so a few
// thousand pieces still draw in a handful of calls.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex, seeded } from '../engine/ink.js';

// ---------- instancing batch: put() pieces by (geometry, material) key, flush() once ----------
const TILE = 64; const TILES = [];
// hide scenery tiles beyond the view distance (call once per frame with the camera position)
export function cullTiles(p, view) { const lim = view + TILE; for (let i = 0; i < TILES.length; i++) { const im = TILES[i]; const s = im.boundingSphere; if (!s) continue; im.visible = Math.hypot(s.center.x - p.x, s.center.z - p.z) - s.radius < lim; } }
export function resetTiles() { TILES.length = 0; }
const DM = new THREE.Object3D();
export function createBatch(add) {
  const groups = new Map();
  function put(key, geo, mat, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
    let g = groups.get(key); if (!g) { g = { geo, mat, list: [] }; groups.set(key, g); }
    DM.position.set(x, y, z); DM.rotation.set(rx, ry, rz); DM.scale.set(sx, sy, sz); DM.updateMatrix(); g.list.push(DM.matrix.clone());
  }
  // a piece placed in a building's local frame (origin at ground centre, rotated ry about y)
  function local(key, geo, mat, ox, oz, ry, lx, y, lz, lry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
    const c = Math.cos(ry), s = Math.sin(ry); put(key, geo, mat, ox + lx * c + lz * s, y, oz - lx * s + lz * c, ry + lry, sx, sy, sz, rx, rz);
  }
  // split each group into TILE-sized map tiles: frustum culling then skips what's behind you, and cullTiles() hides
  // tiles past the view distance (big savings on weak GPUs)
  function flush() { const v = new THREE.Vector3();
    for (const g of groups.values()) { const tiles = new Map(); for (const m of g.list) { v.setFromMatrixPosition(m); const k = Math.floor(v.x / TILE) + ':' + Math.floor(v.z / TILE); if (!tiles.has(k)) tiles.set(k, []); tiles.get(k).push(m); }
      for (const list of tiles.values()) { const im = add(new THREE.InstancedMesh(g.geo, g.mat, list.length)); list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); TILES.push(im); } }
    groups.clear(); }
  return { put, local, flush };
}

// ---------- jittered grid: one candidate per cell, nudged and rotated so nothing lines up ----------
export function jgrid(size, step, seed, fn, { jitter = 0.32, skip = () => false } = {}) {
  let i = 0;
  for (let gx = -size / 2 + step / 2; gx < size / 2; gx += step) for (let gz = -size / 2 + step / 2; gz < size / 2; gz += step) {
    const k = i++; const x = gx + (seeded(k, seed) - 0.5) * step * jitter * 2, z = gz + (seeded(k, seed + 1) - 0.5) * step * jitter * 2;
    if (skip(x, z)) continue; fn(x, z, seeded(k, seed + 2), k);
  }
}

// ---------- facades ----------
const shade = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
// style: brick | siding | stucco | panel | shop.  cols/rows: windows across / floors.
export function facadeTex({ base, trim = '#e8e0d0', style = 'brick', cols = 3, rows = 2, door = true, lit = 0.35, sign = null, signCol = '#1a1210' }) {
  const W = cols > 4 ? 512 : 256, Hh = 256;
  return canvasTex(W, Hh, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    if (style === 'brick') { for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < w; x += 16) { g.fillStyle = shade(base, (Math.random() - 0.5) * 0.08); g.fillRect(x + 1, y + 1, 14, 6); } }
    else if (style === 'siding') { for (let y = 0; y < h; y += 9) { g.fillStyle = shade(base, -0.05); g.fillRect(0, y + 7, w, 2); g.fillStyle = shade(base, 0.04); g.fillRect(0, y, w, 2); } }
    else if (style === 'panel') { g.strokeStyle = shade(base, -0.08); g.lineWidth = 2; for (let x = 0; x < w; x += w / Math.max(2, cols)) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += h / rows) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
    else { for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }
    // cornice band and a darker plinth
    g.fillStyle = shade(trim, -0.1); g.fillRect(0, 0, w, 7); g.fillStyle = shade(base, -0.14); g.fillRect(0, h - 14, w, 14);
    const fh = (h - 20) / rows, cw = w / cols; const curtains = ['#a83a3a', '#3a6a8a', '#d8c070', '#6a8a4a', '#8a5a8a'];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ground = r === rows - 1; const x = c * cw + cw * 0.22, ww = cw * 0.56, y = 12 + r * fh + fh * 0.18, wh = fh * (ground && style === 'shop' ? 0.72 : 0.55);
      if (ground && door && c === Math.floor(cols / 2)) { g.fillStyle = shade(trim, -0.25); g.fillRect(x - 4, y - 4, ww + 8, h - y - 10); g.fillStyle = ['#5a2a1a', '#2a3a5a', '#3a5a3a', '#7a2a2a'][Math.floor(Math.random() * 4)]; g.fillRect(x + ww * 0.12, y + fh * 0.08, ww * 0.76, h - y - fh * 0.08 - 14); g.fillStyle = '#e8c060'; g.fillRect(x + ww * 0.7, y + fh * 0.5, 4, 4); continue; }
      if (style === 'shop' && ground) { g.fillStyle = '#2a3a4a'; g.fillRect(x - cw * 0.15, y, ww + cw * 0.3, wh); g.fillStyle = 'rgba(255,230,170,.35)'; g.fillRect(x - cw * 0.12, y + 3, ww + cw * 0.24, wh - 6); g.strokeStyle = trim; g.lineWidth = 4; g.strokeRect(x - cw * 0.15, y, ww + cw * 0.3, wh); continue; }
      const on = Math.random() < lit; g.fillStyle = trim; g.fillRect(x - 3, y - 3, ww + 6, wh + 6);
      g.fillStyle = on ? '#ffd58a' : ['#1e2632', '#26303e', '#1a1e28'][Math.floor(Math.random() * 3)]; g.fillRect(x, y, ww, wh);
      if (!on) { g.fillStyle = 'rgba(160,190,220,.18)'; g.beginPath(); g.moveTo(x, y + wh); g.lineTo(x + ww * 0.5, y); g.lineTo(x + ww * 0.75, y); g.lineTo(x + ww * 0.25, y + wh); g.fill(); }
      if (Math.random() < 0.4) { g.fillStyle = curtains[Math.floor(Math.random() * curtains.length)]; g.fillRect(x, y, ww * 0.22, wh); g.fillRect(x + ww * 0.78, y, ww * 0.22, wh); }
      g.fillStyle = trim; g.fillRect(x + ww / 2 - 1, y, 2, wh); g.fillRect(x, y + wh / 2 - 1, ww, 2); // mullions
      g.fillStyle = shade(trim, -0.15); g.fillRect(x - 5, y + wh + 2, ww + 10, 5); // sill
      if ((style === 'siding' || style === 'stucco') && Math.random() < 0.55) { g.fillStyle = shade(base, -0.28); g.fillRect(x - 3 - ww * 0.3, y, ww * 0.26, wh); g.fillRect(x + ww + 3 + ww * 0.04, y, ww * 0.26, wh); }
      if (Math.random() < 0.15) { g.fillStyle = '#4a7a3a'; g.fillRect(x - 2, y + wh - 4, ww + 4, 6); for (let k = 0; k < 4; k++) { g.fillStyle = ['#e85a7a', '#f0d040', '#ffffff'][k % 3]; g.fillRect(x + k * ww / 4 + 2, y + wh - 8, 5, 5); } }
    }
    if (sign) { g.fillStyle = signCol; g.fillRect(w * 0.12, h - fh - 6, w * 0.76, 22); g.fillStyle = '#f4eedc'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.fillText(sign, w / 2, h - fh + 11, w * 0.7); }
    // grime: streaks from the sills and a darker base
    for (let k = 0; k < 10; k++) { const x = Math.random() * w; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(x, Math.random() * h * 0.5, 3 + Math.random() * 6, h); }
    const gb = g.createLinearGradient(0, h * 0.7, 0, h); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,0.22)'); g.fillStyle = gb; g.fillRect(0, h * 0.7, w, h * 0.3);
    g.strokeStyle = '#0d0b12'; g.lineWidth = 4; g.strokeRect(0, 0, w, h);
  });
}

// ---------- building kit ----------
// palette: [{ base, trim, style }] ; builds facade variants for 3 width classes x 3 floor counts
export function createKit(add, palette, { roofCols = ['#5a2a24', '#2a3a4a', '#3a3a42', '#6a3a1a', '#4a5a3a'], signs = null } = {}) {
  const B = createBatch(add);
  const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 12), cone4 = new THREE.ConeGeometry(0.75, 1, 4), cone = new THREE.ConeGeometry(1, 1, 12);
  const prism = new THREE.CylinderGeometry(1, 1, 1, 3); prism.rotateZ(Math.PI / 2); prism.rotateX(-Math.PI / 2); // ridge along x, apex up
  const roofM = roofCols.map((c) => toon(c)), darkM = toon('#3a3a40'), metalM = toon('#8a8e94'), stepM = toon('#8a8078'), woodM = toon('#6a4a2a');
  const awnM = ['#a8281e', '#2a6a4a', '#c8a020', '#2a4a8a', '#7a3a7a', '#e8e0d0'].map((c) => toon(c));
  const facades = new Map();
  const fmat = (pi, cols, rows, shop) => { const k = `${pi}:${cols}:${rows}:${shop ? 1 : 0}`; if (!facades.has(k)) { const p = palette[pi]; const variants = []; for (let v = 0; v < 2; v++) variants.push(toon('#ffffff', { map: facadeTex({ base: p.base, trim: p.trim, style: shop ? 'shop' : p.style, cols, rows, sign: shop && signs ? signs[Math.floor(Math.random() * signs.length)] : null }) })); facades.set(k, variants); } return facades.get(k); };
  const capM = palette.map((p) => toon(shade(p.base, -0.18)));
  // one building. r: a 0..1 seed that picks every variation. opts.roof forces gable|hip|flat.
  function building(x, z, ry, w, d, h, r, opts = {}) {
    const R = (k) => seeded(r * 1000 + k, 17);
    const pi = opts.palette ?? Math.floor(R(1) * palette.length); const rows = opts.rows || Math.max(1, Math.round(h / 3.2)); const cols = Math.max(1, Math.min(6, Math.round(w / 2.6)));
    const shop = opts.shop ?? (R(2) < 0.18 && rows >= 2); const mats = fmat(pi, cols, rows, shop); const fm = mats[Math.floor(R(3) * mats.length)];
    B.local(`f${pi}:${cols}:${rows}:${shop}:${mats.indexOf(fm)}`, box, fm, x, z, ry, 0, h / 2, 0, 0, w, h, d);
    const roof = opts.roof || (h > 9 ? 'flat' : R(4) < 0.55 ? 'gable' : R(4) < 0.8 ? 'hip' : 'flat'); const rc = Math.floor(R(5) * roofM.length);
    if (roof === 'gable') { const rh = 1.4 + R(6) * 1.4, sy = rh / 1.5, long = Math.max(w, d), short = Math.min(w, d); B.local('rg' + rc, prism, roofM[rc], x, z, ry, 0, h + 0.5 * sy - 0.02, 0, d > w ? Math.PI / 2 : 0, long + 0.7, sy, (short + 1.1) / 1.732); } // prism: 1.5 tall (-0.5..1), 1.732 wide
    else if (roof === 'hip') { const rh = 1.6 + R(6) * 1.4; B.local('rh' + rc, cone4, roofM[rc], x, z, ry, 0, h + rh / 2, 0, Math.PI / 4, (w + 0.8) * 0.95, rh, (d + 0.8) * 0.95); }
    else { B.local('cap' + pi, box, capM[pi], x, z, ry, 0, h + 0.1, 0, 0, w + 0.3, 0.2, d + 0.3); for (const [px, pz, sx, sz] of [[0, d / 2, w + 0.3, 0.25], [0, -d / 2, w + 0.3, 0.25], [w / 2, 0, 0.25, d], [-w / 2, 0, 0.25, d]]) B.local('cap' + pi, box, capM[pi], x, z, ry, px, h + 0.45, pz, 0, sx, 0.7, sz);
      if (R(7) < 0.5) B.local('ac', box, metalM, x, z, ry, (R(8) - 0.5) * w * 0.5, h + 0.6, (R(9) - 0.5) * d * 0.5, 0, 1.4, 0.9, 1.1);
      if (h > 8 && R(10) < 0.45) { const tx = (R(11) - 0.5) * w * 0.4, tz = (R(12) - 0.5) * d * 0.4; B.local('wt', cyl, woodM, x, z, ry, tx, h + 2.2, tz, 0, 1.3, 2.2, 1.3); B.local('wtr', cone, roofM[rc], x, z, ry, tx, h + 3.8, tz, 0, 1.45, 1.0, 1.45); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.local('leg', box, darkM, x, z, ry, tx + a * 0.9, h + 0.6, tz + b * 0.9, 0, 0.15, 1.2, 0.15); } }
    if (roof !== 'flat' && R(13) < 0.6) B.local('ch', box, darkM, x, z, ry, (R(14) > 0.5 ? 1 : -1) * w * 0.28, h + 1.4, -d * 0.12, 0, 0.7, 2.2, 0.7);
    // front: step, awning over the door, a lamp; side: drainpipe; tall ones get a fire escape
    B.local('step', box, stepM, x, z, ry, 0, 0.12, d / 2 + 0.45, 0, Math.min(2.2, w * 0.4), 0.24, 0.9);
    if (shop || R(15) < 0.45) { const ai = Math.floor(R(16) * awnM.length); B.local('aw' + ai, box, awnM[ai], x, z, ry, 0, Math.min(3.1, h * 0.55), d / 2 + 0.7, 0, shop ? w * 0.9 : Math.min(2.8, w * 0.5), 0.1, 1.4, 0.32); }
    B.local('pipe', cyl, darkM, x, z, ry, w / 2 - 0.15, h / 2, d / 2 + 0.12, 0, 0.09, h, 0.09);
    if (h > 7.5 && R(17) < 0.7) { const side = R(18) > 0.5 ? 1 : -1; for (let f = 1; f < rows; f++) { const y = f * (h / rows) + 0.1; B.local('fe', box, darkM, x, z, ry, side * w * 0.22, y, d / 2 + 0.55, 0, w * 0.32, 0.08, 1.0); B.local('fe', box, darkM, x, z, ry, side * w * 0.22, y + 0.55, d / 2 + 1.02, 0, w * 0.32, 0.05, 0.05); }
      B.local('fe', box, darkM, x, z, ry, side * w * 0.22, h * 0.55, d / 2 + 0.75, 0, 0.08, h * 0.9, 0.08, 0.35, 0); }
  }
  return { building, B, box, cyl, cone, prism, flush: () => B.flush() };
}
