// Floor scenery for Floors 2-6, built with the shared detail kit: jittered placement (no lattice), varied buildings
// with real roofs and trim, and layers of themed clutter so the space between landmarks never reads as empty.
// Every piece is instanced through a batch; anything big enough to block a path gets collision.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex } from '../engine/ink.js';
import { createKit, createBatch, jgrid } from './detail.js';

const G = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), sph: new THREE.SphereGeometry(1, 12, 9), cone: new THREE.ConeGeometry(1, 1, 10), rock: new THREE.DodecahedronGeometry(1, 0), torus: new THREE.TorusGeometry(1, 0.12, 6, 18) };
const M = (c, o) => toon(c, o); const glow = (c, k = 1.6) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
const skipper = (H, pad = 0) => (x, z) => H.inZone(x, z, pad) || Math.abs(x) > H.SIZE / 2 - 6 || Math.abs(z) > H.SIZE / 2 - 6;
const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];

// ======================= FLOOR 2 · SPIN CITY =======================
export function sceneryF2(H) {
  const B = createBatch(H.add); const S = H.seeded; const free = skipper(H, 2);
  const front = canvasTex(128, 128, (g) => { g.fillStyle = '#e8ece8'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c8ccd0'; g.fillRect(0, 0, 128, 22); for (let k = 0; k < 3; k++) { g.fillStyle = ['#e8402a', '#3ad84a', '#2a8ae8'][k]; g.fillRect(12 + k * 14, 8, 8, 6); } g.fillStyle = '#2a3a4a'; g.beginPath(); g.arc(64, 74, 38, 0, 7); g.fill(); g.strokeStyle = '#9aa0a8'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#5ab8d8'; g.beginPath(); g.arc(64, 74, 27, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(54, 64, 8, 0, 7); g.fill(); g.strokeStyle = '#0d0b12'; g.lineWidth = 5; g.strokeRect(0, 0, 128, 128); });
  const top = canvasTex(128, 128, (g) => { g.fillStyle = '#d8dce0'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#b8bcc0'; g.fillRect(14, 14, 100, 100); g.fillStyle = '#e8402a'; g.fillRect(90, 6, 26, 6); g.strokeStyle = '#0d0b12'; g.lineWidth = 5; g.strokeRect(0, 0, 128, 128); });
  const washM = [M('#ffffff', { map: front }), M('#f0e8d8', { map: front }), M('#d8e4ec', { map: front })], topM = M('#ffffff', { map: top }), bigM = M('#b8c0c8', { map: front });
  const clothM = ['#c83a3a', '#3a6ac8', '#e8c040', '#5ab85a', '#e88ac8', '#f0f0f0', '#7a5ac8'].map((c) => M(c)), basketM = M('#e8e0c8'), tableM = M('#a8a098'), legM = M('#4a4a50'), bottleM = ['#ff8a2a', '#2ac8e8', '#e83a8a', '#8ae83a'].map((c) => M(c)), signM = M('#f5c518'), colM = M('#b0b8b4'), cartM = M('#9aa0a8'), lineM = M('#3a3a3a');
  // washer banks: rows of 2-6 machines at any angle, some knocked over, some back to back; big industrial dryers
  jgrid(H.SIZE, 12, 201, (x, z, r, k) => {
    const ry = S(k, 202) * Math.PI; const c = Math.cos(ry), s = Math.sin(ry);
    if (r < 0.12) { B.put('big', G.box, bigM, x, 1.6, z, ry, 3.2, 3.2, 2.8); H.col.box(x, z, 1.6, 1.4, -ry); H.map.cars.push([x, z]); return; }
    if (r < 0.62) { const n = 2 + Math.floor(S(k, 203) * 5), dbl = S(k, 204) < 0.3; for (let j = 0; j < n; j++) for (let b = 0; b < (dbl ? 2 : 1); b++) { const lx = (j - (n - 1) / 2) * 2.05, lz = b * -1.85; const px = x + lx * c + lz * s, pz = z - lx * s + lz * c; const tipped = S(k * 7 + j, 205) < 0.08;
        if (tipped) B.put('w' + (j % 3), G.box, washM[j % 3], px, 0.9, pz, ry + 0.4, 2, 1.8, 1.9, 0, Math.PI / 2); else B.put('w' + ((j + k) % 3), G.box, washM[(j + k) % 3], px, 0.95, pz, ry + (b ? Math.PI : 0), 2, 1.9, 1.8);
        if (!tipped && S(k * 5 + j, 206) < 0.3) B.put('top', G.box, topM, px, 1.92, pz, ry, 1.9, 0.05, 1.7); }
      const hl = n * 1.03 + 0.1, hd = dbl ? 1.85 : 0.95; H.col.box(x + (dbl ? -0.92 * s : 0), z + (dbl ? -0.92 * c : 0), hl, hd, -ry); H.map.cars.push([x, z]);
      // a heap of dropped laundry and a detergent bottle at the end of the row
      const ex = x + (hl + 1.2) * c, ez = z - (hl + 1.2) * s; for (let q = 0; q < 4; q++) B.put('cs' + q, G.sph, clothM[(k + q) % clothM.length], ex + (S(k, 210 + q) - 0.5) * 1.4, 0.2, ez + (S(k, 220 + q) - 0.5) * 1.4, S(k, 230 + q) * 3, 0.6, 0.25, 0.5);
      B.put('bt' + (k % 4), G.box, bottleM[k % 4], ex - 0.8 * s, 0.35, ez - 0.8 * c, ry, 0.35, 0.7, 0.25); return; }
    if (r < 0.75) { B.put('table', G.box, tableM, x, 0.95, z, ry, 3, 0.12, 1.4); for (const [a, b] of [[-1.3, -0.55], [1.3, -0.55], [-1.3, 0.55], [1.3, 0.55]]) B.put('leg', G.box, legM, x + a * c + b * s, 0.45, z - a * s + b * c, ry, 0.08, 0.9, 0.08); for (let q = 0; q < 3; q++) B.put('cb' + q, G.box, clothM[(k + q) % clothM.length], x + (q - 1) * 0.9 * c, 1.08 + q * 0.04, z - (q - 1) * 0.9 * s, ry + q * 0.2, 0.7, 0.12, 0.6); H.col.box(x, z, 1.5, 0.7, -ry); return; }
    if (r < 0.86) { for (let q = 0; q < 3; q++) { const px = x + (S(k, 240 + q) - 0.5) * 3, pz = z + (S(k, 250 + q) - 0.5) * 3; B.put('basket', G.cyl, basketM, px, 0.35, pz, 0, 0.5, 0.7, 0.4); B.put('cs' + q, G.sph, clothM[(k + q * 2) % clothM.length], px, 0.72, pz, q, 0.45, 0.2, 0.38); H.col.circle(px, pz, 0.5); } return; }
    if (r < 0.93) { B.put('cart', G.box, cartM, x, 0.8, z, ry, 1.4, 0.9, 0.9); B.put('cs0', G.sph, clothM[k % clothM.length], x, 1.3, z, ry, 0.6, 0.3, 0.4); H.col.box(x, z, 0.7, 0.45, -ry); return; }
    B.put('sign', G.cone, signM, x, 0.45, z, ry, 0.35, 0.9, 0.35); // wet-floor sign
  }, { skip: free, jitter: 0.38 });
  // support columns to the ceiling with laundry lines strung between neighbours
  const cols = []; jgrid(H.SIZE, 46, 260, (x, z) => { cols.push([x, z]); B.put('col', G.cyl, colM, x, H.CEIL / 2, z, 0, 0.9, H.CEIL, 0.9); H.col.circle(x, z, 1); H.map.pillars.push([x, z]); }, { skip: skipper(H, 4), jitter: 0.2 });
  cols.forEach(([x, z], i) => { const o = cols[i + 1]; if (!o || Math.hypot(o[0] - x, o[1] - z) > 70) return; const dx = o[0] - x, dz = o[1] - z, L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz); B.put('line', G.box, lineM, (x + o[0]) / 2, 6.5, (z + o[1]) / 2, ry, 0.04, 0.04, L);
    for (let q = 2; q < L - 2; q += 2.2 + H.seeded(i, q) * 1.5) { const t = q / L; B.put('cb' + (q | 0) % 7, G.box, clothM[(i + (q | 0)) % clothM.length], x + dx * t, 5.9, z + dz * t, ry + Math.PI / 2, 1.1, 1.2, 0.04); } });
  // a few lost socks and lint balls everywhere
  jgrid(H.SIZE, 5, 270, (x, z, r, k) => { if (r < 0.5) return; if (r < 0.8) B.put('cb' + (k % 7), G.box, clothM[k % 7], x, 0.03, z, r * 9, 0.25, 0.05, 0.6); else B.put('lint', G.sph, M('#b8b0b8'), x, 0.15, z, 0, 0.3 + r * 0.2, 0.18, 0.3); }, { skip: free, jitter: 0.5 });
  B.flush();
}

// ======================= FLOOR 3 · THE SOUP DISTRICT =======================
const F3PAL = [{ base: '#8a4a32', trim: '#e8d8b8', style: 'brick' }, { base: '#7a3a2a', trim: '#d8c8a0', style: 'brick' }, { base: '#9a5a3a', trim: '#f0e0c0', style: 'brick' }, { base: '#b89a7a', trim: '#5a3a2a', style: 'stucco' }, { base: '#6a5a4a', trim: '#e8d8b8', style: 'brick' }, { base: '#a88a6a', trim: '#3a2a24', style: 'stucco' }];
const F3SIGNS = ['SOUP', 'BROTH & CO', 'NOODLES', 'PAWN', 'LADLES', 'DUMPLINGS', 'CHOWDER', 'GOULASH', 'BAKERY', 'BONE BROTH', 'TAILOR', 'BOWLS 4 LESS'];
export function sceneryF3(H) {
  const kit = createKit(H.add, F3PAL, { roofCols: ['#3a3a42', '#4a2a24', '#2a2a2e', '#5a3a2a'], signs: F3SIGNS }); const B = kit.B; const S = H.seeded; const free = skipper(H, 3);
  const lampM = M('#2a2a2e'), bulbM = glow('#ffd890', 2), binM = M('#4a5a4a'), crateM = M('#9a7a4a'), barrelM = M('#6a4a2a'), potM = M('#2a2a2e'), soupM = glow('#c86a2a', 1.2), cartM = M('#7a5a3a'), awnM = ['#a8281e', '#2a6a4a', '#c8a020'].map((c) => M(c)), steamM = new THREE.MeshBasicMaterial({ color: '#d8d0c8', transparent: true, opacity: 0.25, depthWrite: false });
  // city blocks: each cell is a cluster of 2-4 buildings around a courtyard, leaving alleys between clusters
  jgrid(H.SIZE, 30, 301, (x, z, r, k) => {
    if (r < 0.1) { // a small square: a soup pot on a fire and a market cart
      B.put('pot', G.sph, potM, x, 1, z, 0, 1.6, 1.1, 1.6); B.put('soup', G.cyl, soupM, x, 1.75, z, 0, 1.4, 0.05, 1.4); H.col.circle(x, z, 1.7); const st = H.add(new THREE.Mesh(G.sph, steamM)); st.position.set(x, 3.2, z); st.scale.set(1.6, 1.4, 1.6); H.fx.push(st);
      for (let q = 0; q < 2; q++) { const cx = x + (q ? 5 : -5), cz = z + (S(k, 302 + q) - 0.5) * 4; B.put('cart', G.box, cartM, cx, 0.8, cz, q, 2.2, 0.9, 1.2); B.put('aw' + q, G.box, awnM[(k + q) % 3], cx, 2.4, cz, q, 2.6, 0.08, 1.6, 0.15); H.col.box(cx, cz, 1.1, 0.6, -q); } return; }
    const base = (Math.floor(S(k, 303) * 4)) * Math.PI / 2 + (S(k, 304) - 0.5) * 0.25; const n = 2 + Math.floor(S(k, 305) * 3); const c = Math.cos(base), s = Math.sin(base);
    for (let j = 0; j < n; j++) { const a = j * (Math.PI * 2 / n) + S(k, 306); const off = 6.5 + S(k * 3 + j, 307) * 2.5; const lx = Math.cos(a) * off, lz = Math.sin(a) * off * 0.8; const bx = x + lx * c + lz * s, bz = z - lx * s + lz * c;
      const w = 7 + S(k * 3 + j, 308) * 6, d = 6 + S(k * 3 + j, 309) * 4, h = 6 + S(k * 3 + j, 310) * 8; const ry = base + (j % 2 ? Math.PI / 2 : 0) + (S(k * 3 + j, 311) > 0.5 ? Math.PI : 0);
      if (H.inZone(bx, bz, 4)) continue; kit.building(bx, bz, ry, w, d, Math.min(h, H.CEIL - 4.5), S(k * 3 + j, 312)); H.col.box(bx, bz, w / 2, d / 2, -ry); H.map.cars.push([bx, bz]); }
    // street furniture around the cluster
    for (let q = 0; q < 4; q++) { const a = q * 1.57 + S(k, 320 + q), d = 13 + S(k, 330 + q) * 2; const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (H.col.blocked(px, pz, 0.8) || free(px, pz)) continue; const t = S(k, 340 + q);
      if (t < 0.35) { B.put('lamp', G.cyl, lampM, px, 2.2, pz, 0, 0.08, 4.4, 0.08); B.put('bulb', G.sph, bulbM, px, 4.5, pz, 0, 0.25, 0.25, 0.25); H.col.circle(px, pz, 0.2); }
      else if (t < 0.6) { B.put('bin', G.cyl, binM, px, 0.5, pz, 0, 0.4, 1, 0.4); H.col.circle(px, pz, 0.45); }
      else if (t < 0.85) { B.put('crate', G.box, crateM, px, 0.45, pz, a, 0.9, 0.9, 0.9); B.put('crate', G.box, crateM, px + 0.3, 1.2, pz, a + 0.3, 0.6, 0.6, 0.6); H.col.circle(px, pz, 0.6); }
      else { B.put('barrel', G.cyl, barrelM, px, 0.5, pz, 0, 0.4, 1, 0.4); H.col.circle(px, pz, 0.45); } }
  }, { skip: free, jitter: 0.22 });
  // overhead pipes run under the ceiling (kept from the old district, now at varied heights)
  const pipeM = M('#8a5a3a'); for (let i = 0; i < 30; i++) B.put('pipe', G.cyl, pipeM, 0, H.CEIL - 1.5 - (i % 3) * 0.9, -H.SIZE / 2 + 12 + i * 24, 0, 0.6, H.SIZE, 0.6, 0, Math.PI / 2);
  kit.flush();
}

// ======================= FLOOR 4 · THE ENDLESS MALL =======================
const F4PAL = [{ base: '#e8dcd0', trim: '#e83a8a', style: 'panel' }, { base: '#d0dce8', trim: '#3a8ae8', style: 'panel' }, { base: '#f0e8c8', trim: '#c89a20', style: 'panel' }, { base: '#dcd0e8', trim: '#7a3ac8', style: 'panel' }, { base: '#d8e8d8', trim: '#3a9a5a', style: 'panel' }];
export function sceneryF4(H, SHOPNAMES) {
  const kit = createKit(H.add, F4PAL, { roofCols: ['#8a8a92', '#9a9aa2'], signs: SHOPNAMES }); const B = kit.B; const S = H.seeded; const free = skipper(H, 3);
  const benchM = M('#7a5a3a'), planterM = M('#8a7a6a'), leafM = M('#3a8a4a'), trunkM = M('#5a4a3a'), fountM = M('#c8c8d0'), waterM = new THREE.MeshPhysicalMaterial({ color: '#4ab8e8', roughness: 0.05, clearcoat: 1 }), kioskM = ['#e83a8a', '#3a8ae8', '#e8c020', '#5ad86a'].map((c) => M(c)), colM = M('#e8e4e0'), mannM = M('#e8e0d8'), binM = M('#5a5a62'), railM = M('#c8ccd0'), stepM = M('#8a8a92'), skyM = glow('#e8f4ff', 1.6);
  // store rows: 2-4 joined storefronts facing a corridor, at the four mall headings with a little skew
  jgrid(H.SIZE, 30, 401, (x, z, r, k) => {
    const ry = Math.floor(S(k, 402) * 4) * Math.PI / 2 + (S(k, 403) - 0.5) * 0.08; const c = Math.cos(ry), s = Math.sin(ry);
    if (r < 0.15) { // a fountain court with benches
      B.put('fount', G.cyl, fountM, x, 0.45, z, 0, 3.2, 0.9, 3.2); B.put('water', G.cyl, waterM, x, 0.92, z, 0, 2.8, 0.05, 2.8); B.put('fount', G.cyl, fountM, x, 1.6, z, 0, 0.4, 2.4, 0.4); H.col.circle(x, z, 3.3);
      for (let q = 0; q < 4; q++) { const a = q * 1.57 + 0.78, bx = x + Math.cos(a) * 6, bz = z + Math.sin(a) * 6; B.put('bench', G.box, benchM, bx, 0.45, bz, -a, 2.2, 0.12, 0.7); B.put('bench', G.box, benchM, bx, 0.2, bz, -a, 2.0, 0.4, 0.15); H.col.box(bx, bz, 1.1, 0.4, a); } return; }
    if (r < 0.25) { // an escalator ramp between levels (scenery) with rails
      B.put('esc', G.box, stepM, x, 2.2, z, ry, 2.4, 0.4, 12, -0.38); for (const sd of [-1, 1]) B.put('rail', G.box, railM, x + sd * 1.3 * c, 3.2, z - sd * 1.3 * s, ry, 0.12, 1, 12.2, -0.38); H.col.box(x, z, 1.4, 6, -ry); H.map.cars.push([x, z]); return; }
    const n = 2 + Math.floor(S(k, 404) * 3); let off = -((n - 1) * 8) / 2;
    for (let j = 0; j < n; j++) { const w = 7 + S(k * 4 + j, 405) * 3; const lx = off; off += w + 0.02; const bx = x + lx * c, bz = z - lx * s; if (H.inZone(bx, bz, 4)) continue; kit.building(bx, bz, ry, w, 7, 6.5 + S(k * 4 + j, 406) * 2, S(k * 4 + j, 407), { shop: true, roof: 'flat', rows: 1 }); H.col.box(bx, bz, w / 2, 3.5, -ry); H.map.cars.push([bx, bz]); }
    // in the corridor in front: a kiosk, planters with trees, benches, a mannequin, a bin
    const fx = x + 9 * s, fz = z + 9 * c; const t = S(k, 408);
    if (t < 0.35) { const ki = k % 4; B.put('kiosk' + ki, G.box, kioskM[ki], fx, 0.6, fz, ry, 2.4, 1.2, 1.4); B.put('kroof' + ki, G.box, kioskM[ki], fx, 2.6, fz, ry, 3, 0.15, 2); for (const [a, b] of [[-1.3, -0.8], [1.3, 0.8]]) B.put('rail', G.box, railM, fx + a * c + b * s, 1.6, fz - a * s + b * c, 0, 0.08, 2, 0.08); H.col.box(fx, fz, 1.3, 0.8, -ry); }
    else if (t < 0.7) { for (const sd of [-4, 4]) { const px = fx + sd * c, pz = fz - sd * s; B.put('planter', G.cyl, planterM, px, 0.5, pz, 0, 1.0, 1, 1.0); B.put('trunk', G.cyl, trunkM, px, 1.8, pz, 0, 0.12, 1.8, 0.12); B.put('leaf', G.sph, leafM, px, 3.2, pz, 0, 1.2, 1.4, 1.2); H.col.circle(px, pz, 1.05); } B.put('bench', G.box, benchM, fx, 0.45, fz, ry, 2.2, 0.12, 0.7); H.col.box(fx, fz, 1.1, 0.35, -ry); }
    else { B.put('mann', G.cyl, mannM, fx, 0.95, fz, ry, 0.22, 1.5, 0.22); B.put('mann', G.sph, mannM, fx, 1.9, fz, 0, 0.18, 0.22, 0.18); B.put('bin', G.cyl, binM, fx + 2 * c, 0.5, fz - 2 * s, 0, 0.35, 1, 0.35); H.col.circle(fx, fz, 0.4); }
  }, { skip: free, jitter: 0.18 });
  // structural columns and skylights
  jgrid(H.SIZE, 36, 420, (x, z) => { if (H.col.blocked(x, z, 1.2)) return; B.put('col', G.cyl, colM, x, H.CEIL / 2, z, 0, 0.7, H.CEIL, 0.7); H.col.circle(x, z, 0.8); H.map.pillars.push([x, z]); }, { skip: skipper(H, 4), jitter: 0.1 });
  jgrid(H.SIZE, 30, 430, (x, z) => B.put('sky', G.box, skyM, x, H.CEIL - 0.2, z, 0, 8, 0.2, 8), { jitter: 0 });
  kit.flush();
}

// ======================= FLOOR 5 · SUBURBIA INFINITE =======================
const F5PAL = [{ base: '#f0e8d8', trim: '#ffffff', style: 'siding' }, { base: '#c8d8e8', trim: '#ffffff', style: 'siding' }, { base: '#e8d0c0', trim: '#5a3a2a', style: 'stucco' }, { base: '#d8e0c8', trim: '#ffffff', style: 'siding' }, { base: '#a86a4a', trim: '#f0e8d8', style: 'brick' }, { base: '#e8e0b8', trim: '#4a5a6a', style: 'siding' }];
export function sceneryF5(H) {
  const kit = createKit(H.add, F5PAL, { roofCols: ['#7a3a2a', '#4a4a52', '#3a4a5a', '#6a5a4a', '#2a3a2a'] }); const B = kit.B; const S = H.seeded; const free = skipper(H, 3);
  const leafM = ['#3a8a3a', '#4a9a3a', '#2a7a4a', '#5a8a2a'].map((c) => M(c)), pineM = M('#2a5a3a'), trunkM = M('#6a4a2a'), hedgeM = M('#3a7a3a'), fenceM = M('#f4f0e8'), driveM = M('#8a8a88'), carM = ['#c83a3a', '#3a5ac8', '#e8e8e8', '#2a2a2e', '#c8a020'].map((c) => M(c)), glassM = M('#2a3a4a'), boxM = M('#3a3a42'), gnomeM = M('#c81a1a'), swingM = M('#c8a020'), shedM = M('#8a6a4a');
  jgrid(H.SIZE, 26, 501, (x, z, r, k) => {
    const ry = Math.floor(S(k, 502) * 4) * Math.PI / 2 + (S(k, 503) - 0.5) * 0.2; const c = Math.cos(ry), s = Math.sin(ry); const L = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    if (r < 0.08) { // a pocket park: trees and a swing set
      for (let q = 0; q < 5; q++) { const [px, pz] = L((S(k, 510 + q) - 0.5) * 16, (S(k, 520 + q) - 0.5) * 16); tree(px, pz, S(k, 530 + q)); }
      const [sx, sz] = L(0, 0); B.put('swing', G.box, swingM, sx, 2.2, sz, ry, 4, 0.15, 0.15); for (const a of [-1.9, 1.9]) { const [px, pz] = L(a, 0); B.put('swing', G.box, swingM, px, 1.1, pz, ry, 0.12, 2.3, 1.6); } H.col.box(sx, sz, 2, 0.8, -ry); return; }
    // a house on its lot, set back from the street side (local +z), with a driveway, car, mailbox, fence or hedge
    const w = 8 + S(k, 504) * 4, d = 7 + S(k, 505) * 2.5, h = S(k, 506) < 0.45 ? 6.2 + S(k, 507) : 3.6 + S(k, 507) * 0.8; const [hx, hz] = L((S(k, 508) - 0.5) * 3, -2);
    kit.building(hx, hz, ry, w, d, h, S(k, 509), { roof: S(k, 511) < 0.6 ? 'gable' : 'hip', shop: false }); H.col.box(hx, hz, w / 2, d / 2, -ry); H.map.cars.push([hx, hz]);
    if (S(k, 512) < 0.45) { const [gx, gz] = L(w / 2 + 2.6, -1.5); kit.building(gx, gz, ry, 4.6, 6, 3, S(k, 513), { roof: 'gable', palette: Math.floor(S(k, 509) * F5PAL.length) }); H.col.box(gx, gz, 2.3, 3, -ry); }
    const [dx, dz] = L(w / 2 + 2.6, 6.5); B.put('drive', G.box, driveM, dx, 0.03, dz, ry, 3.6, 0.04, 7);
    if (S(k, 514) < 0.6) { const ci = k % carM.length; const [cx, cz] = L(w / 2 + 2.6, 5.5); B.put('car' + ci, G.box, carM[ci], cx, 0.65, cz, ry, 1.9, 0.9, 4.2); B.put('cab', G.box, glassM, cx, 1.35, cz, ry, 1.7, 0.6, 2.2); for (const [a, b] of [[-0.95, -1.3], [0.95, -1.3], [-0.95, 1.3], [0.95, 1.3]]) { const [wx, wz] = L(w / 2 + 2.6 + a, 5.5 + b); B.put('tyre', G.cyl, boxM, wx, 0.35, wz, ry, 0.35, 0.25, 0.35, 0, Math.PI / 2); } H.col.box(cx, cz, 1, 2.1, -ry); }
    const [mx, mz] = L(-w / 2 + 0.5, 10.5); B.put('mpost', G.box, trunkM, mx, 0.55, mz, ry, 0.1, 1.1, 0.1); B.put('mbox', G.box, boxM, mx, 1.15, mz, ry, 0.35, 0.3, 0.55);
    // property line at the front: picket fence or hedge, with a gap for the path
    const hedge = S(k, 515) < 0.5; for (const sd of [-1, 1]) { const [fx, fz] = L(sd * (w / 4 + 1.6) - 1.5, 11); if (hedge) B.put('hedge', G.box, hedgeM, fx, 0.6, fz, ry, w / 2 - 1.2, 1.2, 0.9); else B.put('fence', G.box, fenceM, fx, 0.45, fz, ry, w / 2 - 1.2, 0.9, 0.1); H.col.box(fx, fz, w / 4 - 0.6, 0.45, -ry); }
    // backyard and side trees, a shed, gnomes on the lawn
    for (let q = 0; q < 2 + Math.floor(S(k, 516) * 3); q++) { const [tx, tz] = L((S(k, 540 + q) - 0.5) * 20, -9 + S(k, 550 + q) * 4); tree(tx, tz, S(k, 560 + q)); }
    if (S(k, 517) < 0.3) { const [sx, sz] = L(-w / 2 - 1, -9); B.put('shed', G.box, shedM, sx, 1.1, sz, ry, 2.4, 2.2, 2); H.col.box(sx, sz, 1.2, 1, -ry); }
    for (let q = 0; q < Math.floor(S(k, 518) * 3); q++) { const [gx, gz] = L(-w / 2 + 1 + q * 1.2, 8); B.put('gnome', G.cone, gnomeM, gx, 0.3, gz, 0, 0.18, 0.6, 0.18); }
  }, { skip: free, jitter: 0.12 });
  function tree(x, z, r) { if (free(x, z) || H.col.blocked(x, z, 0.8)) return; const h = 2.5 + r * 3; B.put('trunk', G.cyl, trunkM, x, h / 2, z, 0, 0.22, h, 0.22); if (r < 0.35) B.put('pine', G.cone, pineM, x, h + 1.8, z, r, 1.6 + r, 4.5, 1.6 + r); else { const li = Math.floor(r * 40) % leafM.length; B.put('leaf' + li, G.sph, leafM[li], x, h + 1.4, z, r * 6, 1.8 + r, 1.6 + r * 0.6, 1.8 + r); B.put('leaf' + ((li + 1) % 4), G.sph, leafM[(li + 1) % 4], x + 0.8, h + 0.9, z + 0.5, 0, 1.2, 1.1, 1.2); } H.col.circle(x, z, 0.35); }
  const sun = H.add(new THREE.Mesh(new THREE.SphereGeometry(18, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4c0').multiplyScalar(1.4), fog: false }))); sun.position.set(200, 32, -300);
  kit.flush();
}

// ======================= FLOOR 6 · THE CANOPY =======================
export function sceneryF6(H) {
  const B = createBatch(H.add); const S = H.seeded; const free = skipper(H, 2);
  const barkM = ['#4a3424', '#5a3e2a', '#3e2c1e'].map((c) => M(c)), rootM = M('#3a2a1a'), canopyM = ['#1a4a2a', '#22552e', '#163e22'].map((c) => M(c)), bushM = ['#2a5a2a', '#3a6a2a', '#1e4a28'].map((c) => M(c)), fernM = M('#4a8a3a'), rockM = ['#5a5a54', '#6a665e'].map((c) => M(c)), logM = M('#5a3e28'), mossM = M('#4a7a2a'), shroomM = M('#e8d8c0'), capM = M('#c83a2a'), fungM = glow('#5affc8', 1.6), vineM = M('#2a5a2a');
  // giant trunks, leaning a little, with buttress roots, several canopy blobs and glowing fungus
  jgrid(H.SIZE, 26, 601, (x, z, r, k) => {
    if (r < 0.12) return; const R = 2.4 + r * 4.2, tl = (S(k, 602) - 0.5) * 0.08, tr = (S(k, 603) - 0.5) * 0.08, bi = k % 3;
    B.put('trunk' + bi, G.cyl, barkM[bi], x, 20, z, S(k, 604) * 6, R, 40, R * (0.9 + S(k, 605) * 0.2), tl, tr); H.col.circle(x, z, R + 0.3); H.map.pillars.push([x, z]);
    for (let q = 0; q < 3 + Math.floor(S(k, 606) * 3); q++) { const ci = (k + q) % 3; B.put('can' + ci, G.sph, canopyM[ci], x + (S(k, 610 + q) - 0.5) * R * 6, 30 + S(k, 620 + q) * 8, z + (S(k, 630 + q) - 0.5) * R * 6, 0, R * (2 + S(k, 640 + q) * 2), 4 + S(k, 650 + q) * 4, R * (2 + S(k, 660 + q) * 2)); }
    const nr = 4 + Math.floor(S(k, 607) * 3); for (let q = 0; q < nr; q++) { const a = q * (6.28 / nr) + r * 3; B.put('root', G.box, rootM, x + Math.cos(a) * R, 0.7, z + Math.sin(a) * R, -a, 1 + S(k, 670 + q) * 0.8, 1.4, R * (1.2 + S(k, 680 + q) * 0.8), 0, 0.25); }
    for (let q = 0; q < 3; q++) { const a = q * 2 + r; B.put('fung', G.cyl, fungM, x + Math.cos(a) * (R + 0.3), 1 + q * 0.9 + S(k, 690 + q) * 2, z + Math.sin(a) * (R + 0.3), 0, 0.6 + q * 0.2, 0.12, 0.6 + q * 0.2); }
    for (let q = 0; q < 2; q++) { const a = S(k, 695 + q) * 6.28; B.put('vine', G.cyl, vineM, x + Math.cos(a) * R * 2.5, 18, z + Math.sin(a) * R * 2.5, 0, 0.06, 24, 0.06); }
  }, { skip: free, jitter: 0.35 });
  // undergrowth: bushes, ferns, boulders, fallen logs, mushroom rings. Bushes and ferns are walk-through.
  jgrid(H.SIZE, 7, 640, (x, z, r, k) => {
    if (H.col.blocked(x, z, 1.2)) return;
    if (r < 0.32) { const bi = k % 3; B.put('bush' + bi, G.sph, bushM[bi], x, 0.5, z, r * 9, 1.2 + r * 2, 0.9 + r, 1.1 + r * 2); }
    else if (r < 0.52) { for (let q = 0; q < 3; q++) B.put('fern', G.cone, fernM, x + (q - 1) * 0.6, 0.45, z + (q % 2) * 0.5, q, 0.5, 0.9, 0.18, 0.5 * (q - 1), 0); }
    else if (r < 0.6) { const ri = k % 2, sz = 0.8 + r * 1.6; B.put('rock' + ri, G.rock, rockM[ri], x, sz * 0.5, z, r * 7, sz * 1.3, sz, sz * 1.1); B.put('moss', G.sph, mossM, x, sz * 0.95, z, 0, sz * 0.9, 0.18, sz * 0.8); H.col.circle(x, z, sz); }
    else if (r < 0.65) { const ry = r * 40, L = 5 + r * 4; B.put('log', G.cyl, logM, x, 0.55, z, ry, 0.55, L, 0.55, Math.PI / 2, 0); H.col.box(x, z, 0.6, L / 2, -ry); }
    else if (r < 0.71) { for (let q = 0; q < 5; q++) { const a = q * 1.26, px = x + Math.cos(a) * 1.2, pz = z + Math.sin(a) * 1.2; B.put('stem', G.cyl, shroomM, px, 0.2, pz, 0, 0.07, 0.4, 0.07); B.put('cap', G.sph, capM, px, 0.42, pz, 0, 0.22, 0.12, 0.22); } }
  }, { skip: free, jitter: 0.45 });
  // rope bridges strung between trunks overhead
  const plankM = M('#8a6a3a'); for (let i = 0; i < 40; i++) { const x = (S(i, 91) - 0.5) * H.SIZE * 0.9, z = (S(i, 92) - 0.5) * H.SIZE * 0.9, ry = S(i, 94) * 3, y = 14 + S(i, 93) * 10; B.put('plank', G.box, plankM, x, y, z, ry, 2, 0.2, 30); for (const sd of [-1, 1]) B.put('rope', G.box, rootM, x + sd * Math.cos(ry), y + 1, z - sd * Math.sin(ry), ry, 0.05, 0.05, 30); }
  B.flush();
}
