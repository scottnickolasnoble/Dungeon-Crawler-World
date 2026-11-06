// Tier 5 monsters (Floors 13-15: The Deep Archive).
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';

const C = (h) => new THREE.Color(h);
const pickV = (v, arr, k = 0) => arr[(v + k * 7) % arr.length];
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glowMat = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });

// Book with a coloured leather cover and cream page block.
const bookCovers = ['#5a1a14', '#1a3a2a', '#1a2a5a', '#4a3a14', '#3a1a3a'].map((c) => new THREE.MeshPhysicalMaterial({ map: grimeTex(c, { rust: 15, scratches: 600 }), roughness: 0.6, clearcoat: 0.3 }));
const pages = new THREE.MeshPhysicalMaterial({ color: '#e8dcc0', roughness: 0.9 });
function book(w = 0.16, h = 0.22, d = 0.05, k = 0) {
  const b = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bookCovers[k % bookCovers.length]); b.add(cover);
  const pg = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, h * 0.94, d * 0.8), pages); pg.position.x = w * 0.03; b.add(pg);
  return b;
}
// Paper with lines of fake text.
const textTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#ece2c8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(30,20,10,0.75)'; for (let y = 14; y < h; y += 12) { let x = 10; while (x < w - 20) { const ww = 6 + rnd() * 26; c.fillRect(x, y, ww, 3); x += ww + 5; } } for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(120,80,30,${rnd() * 0.15})`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 4 + rnd() * 20, 0, 7); c.fill(); } });

// ============ LIBRARIAN LICH ============
export function librarianLich({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.0, bulk: 0.55, belly: -0.3, shoulders: 0.95, head: 0.95, hunch: 0.5, armL: 'forward', armR: 'raised', nose: 'none', ears: 'none', legBulk: 0.5, skinNoise: 0.4 });
  const s = B.scale, hc = B.headCenter, hsc = B.headScale;
  // long robe over the skeleton
  const robe = (x, y, z) => {
    const ux = x / s, uy = y / s, uz = z / s;
    let d = rcone(ux, uy, uz, 0, 0.02, 0.0, 0, 1.38, 0.06, 0.36, 0.2);
    d = smin(d, ell(ux, uy, uz, 0, 1.33, 0.04, 0.3, 0.12, 0.17), 0.08);
    d = Math.max(d, -rcone(ux, uy, uz, 0, -0.05, 0.0, 0, 1.3, 0.06, 0.33, 0.17));
    d = smin(d, ell(ux, uy, uz, 0, 1.58, -0.04, 0.2, 0.18, 0.16), 0.05); // raised hood behind the skull
    d = Math.max(d, -ell(ux, uy, uz, 0, 1.6, 0.1, 0.16, 0.2, 0.14));
    if (Math.abs(d) < 0.03) d += Math.sin(Math.atan2(ux, uz) * 16 + uy * 3) * 0.006 + vnoise(ux * 30, uy * 30, uz * 30) * 0.003;
    return d * s;
  };
  const skull = (x, y, z) => {
    const lx = (x - hc[0]) / hsc, ly = (y - hc[1]) / hsc, lz = (z - hc[2]) / hsc, ax = Math.abs(lx);
    let d = ell(lx, ly, lz, 0, 0.02, -0.02, 0.12, 0.13, 0.14);
    d = smin(d, ell(lx, ly, lz, 0, -0.07, 0.04, 0.085, 0.07, 0.08), 0.04);
    d = smax(d, -sph(ax, ly, lz, 0.045, 0.0, 0.11, 0.035), 0.01);
    d = smax(d, -ell(lx, ly, lz, 0, -0.06, 0.13, 0.014, 0.025, 0.03), 0.006);
    d = smin(d, rcone(ax, ly, lz, 0.07, -0.08, -0.0, 0.035, -0.17, 0.08, 0.017, 0.015), 0.015);
    return d * hsc;
  };
  const sdf = (x, y, z) => Math.min(smin(B.sdf(x, y, z) + 0.004, skull(x, y, z), 0.02), robe(x, y, z));
  const rc = pickV(variant, ['#3a2a5a', '#2a3a2a', '#5a1a1a']);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    if (robe(x, y, z) < Math.min(B.sdf(x, y, z), skull(x, y, z))) { c.copy(C(rc)).lerp(C('#0a0810'), clamp01(fbm(x * 8, y * 8, z * 8) + 0.4)); if (Math.abs(Math.sin(y * 30)) < 0.05 && y < 0.3 * s) c.copy(C('#c8a040')); } // gold hem
    else c.copy(C('#d8cca8')).lerp(C('#6a5a40'), clamp01(fbm(x * 18, y * 18, z * 18) * 0.8 + 0.3)); // old bone
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[0] -= 0.15; mx[0] += 0.15;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.008, col), skinMaterial({ roughness: 0.7, clearcoat: 0.15, sheen: 0.4, sheenColor: '#8a7aaa', pore: 0.5 })));
  // eyes: cold blue pinpricks behind half-moon reading glasses
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), glowMat('#7ac8ff', 4)); e.position.set(p[0] * 0.8, p[1] + 0.005, p[2] - 0.01); g.add(e); }
  const wire = new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.25 });
  for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.003, 6, 20, Math.PI), wire); r.position.set(sx * 0.045 * hsc + hc[0], hc[1] - 0.02, hc[2] + 0.14 * hsc); r.rotation.z = Math.PI; g.add(r); }
  // floating books orbiting the raised hand, and a lantern-like spell glow
  const hand = B.handR;
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, b = book(0.14, 0.19, 0.04, i); b.position.set(hand[0] + Math.cos(a) * 0.4, hand[1] + Math.sin(i * 1.7) * 0.15, hand[2] + Math.sin(a) * 0.4); b.rotation.set(rnd() * 0.8, a, rnd() * 0.8); g.add(b); }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), glowMat('#7ac8ff', 3)); orb.position.set(...hand); orb.position.y += 0.08; g.add(orb);
  { const l = new THREE.PointLight('#7ac8ff', 3, 3); l.position.copy(orb.position); g.add(l); }
  // an open tome in the other hand
  const tome = book(0.24, 0.3, 0.06, 1); tome.position.set(...B.handL); tome.rotation.set(-1.2, 0, 0); g.add(tome);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshPhysicalMaterial({ map: textTex, roughness: 0.9 })); sheet.position.set(B.handL[0], B.handL[1] + 0.035, B.handL[2]); sheet.rotation.x = -Math.PI / 2 + 0.37; g.add(sheet);
  return shadowAll(g);
}
librarianLich.variants = true;

// ============ INDEX SPIDER ============
export function indexSpider({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const Y = 0.55;
  const legs = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.6, base = [sx * 0.12, Y, 0.1 - i * 0.07];
    legs.push([base, [sx * (0.45 + i * 0.03), Y + 0.35, base[2] + Math.sin(a) * 0.35 + 0.1], [sx * (0.85 + i * 0.05), 0.02, base[2] + Math.sin(a) * 0.7]]);
  }
  const sdf = (x, y, z) => {
    let d = ell(x, y, z, 0, Y, 0.12, 0.17, 0.12, 0.17); // cephalothorax
    d = smin(d, ell(x, y, z, 0, Y + 0.1, -0.32, 0.32, 0.27, 0.36), 0.06); // ink-sac abdomen
    for (const L of legs) d = smin(d, chain(x, y, z, L, [0.04, 0.028, 0.008], 0.02), 0.03);
    for (const sx of [-1, 1]) d = smin(d, chain(x, y, z, [[sx * 0.05, Y - 0.04, 0.27], [sx * 0.06, Y - 0.14, 0.33], [sx * 0.03, Y - 0.2, 0.31]], [0.03, 0.02, 0.008], 0.01), 0.02); // fangs
    if (Math.abs(d) < 0.03) d += (Math.abs(vnoise(x * 90, y * 90, z * 90)) - 0.3) * 0.004; // bristles
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#1a1410')).lerp(C('#4a3a2a'), clamp01(vnoise(x * 30, y * 30, z * 30) + 0.2));
    if (z < -0.05 && y > Y) { const m = vnoise(x * 8, y * 8, z * 8); if (m > 0.1) c.copy(C('#e8dcc0')).lerp(C('#1a1410'), clamp01(1 - (m - 0.1) * 4)); } // parchment markings on the abdomen
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-1.0, -0.02, -0.75], [1.0, 1.0, 0.5], 0.008, col), skinMaterial({ roughness: 0.45, clearcoat: 0.6, sheen: 0.4, sheenColor: '#8a7a6a', pore: 0.5 })));
  // eight glossy eyes
  const em = new THREE.MeshPhysicalMaterial({ color: '#0a0000', roughness: 0.03, clearcoat: 1, emissive: C('#3a0000'), emissiveIntensity: 0.6 });
  for (const [x, y, z, r] of [[0.04, 0.06, 0.26, 0.025], [-0.04, 0.06, 0.26, 0.025], [0.09, 0.07, 0.23, 0.015], [-0.09, 0.07, 0.23, 0.015], [0.06, 0.1, 0.21, 0.012], [-0.06, 0.1, 0.21, 0.012], [0.11, 0.05, 0.2, 0.01], [-0.11, 0.05, 0.2, 0.01]]) { const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), em); e.position.set(x, Y + y, z); g.add(e); }
  // web strung with paper strips and index cards
  const silk = new THREE.MeshPhysicalMaterial({ color: '#e8e4d8', roughness: 0.4, transparent: true, opacity: 0.6, sheen: 1 });
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI; const p1 = new THREE.Vector3(Math.cos(a) * 1.4, 0.02 + Math.sin(a) * 1.4, -0.9); const pts = [new THREE.Vector3(0, 0.75, -0.9), p1]; g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, 0.002, 4), silk)); }
  for (let r = 0.3; r < 1.4; r += 0.22) { const pts = []; for (let k = 0; k <= 30; k++) { const a = (k / 30) * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * r, 0.75 + Math.sin(a) * r * 0.8 - 0.35 * (r / 1.4), -0.9)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0018, 4), silk)); }
  const card = new THREE.MeshPhysicalMaterial({ map: textTex, roughness: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), card); const a = rnd() * Math.PI, r = 0.3 + rnd() * 1.0; c.position.set(Math.cos(a) * r, 0.75 + Math.sin(a) * r * 0.7 - 0.2, -0.89); c.rotation.z = rnd() - 0.5; g.add(c); }
  return shadowAll(g);
}
indexSpider.variants = true;

// ============ REDACTED THING ============
export function redactedThing({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.4, bulk: 0.7, belly: -0.2, shoulders: 1.1, head: 1.15, hunch: 0.9, armL: 'reach', armR: 'forward', nose: 'none', ears: 'none', legBulk: 0.6, skinNoise: 0 });
  const s = B.scale;
  const sdf = (x, y, z) => {
    let d = B.sdf(x, y, z);
    // its outline is wrong: blocky slabs jut out of it at odd angles
    const q = Math.floor(y * 9);
    d = Math.min(d, rbox(x, y, z, Math.sin(q * 3.1) * 0.15, (q + 0.5) / 9, 0.05 + Math.cos(q * 2.3) * 0.1, 0.18 + Math.abs(Math.sin(q * 1.7)) * 0.2, 0.035, 0.12, 0.005) + (Math.sin(q * 5.3) > 0.3 ? 0.0 : 1));
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.setRGB(0.012, 0.012, 0.014); if (vnoise(x * 4, y * 20, z * 4) > 0.55) c.setRGB(0.06, 0.06, 0.07); };
  const [mn, mx] = B.bbox; mn[0] -= 0.25; mx[0] += 0.25; mn[2] -= 0.2; mx[2] += 0.2;
  const matte = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, sheen: 0 });
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.012, col), matte));
  // floating black redaction bars and torn "CLASSIFIED" stamps around it
  const bar = new THREE.MeshBasicMaterial({ color: '#000000' });
  for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.25 + rnd() * 0.6, 0.06 + rnd() * 0.05, 0.01), bar); b.position.set((rnd() - 0.5) * 1.4, 0.3 + rnd() * 2.2, (rnd() - 0.5) * 0.9); b.rotation.set(0, rnd() - 0.5, (rnd() - 0.5) * 0.15); g.add(b); }
  const stamp = canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b01010'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#b01010'; c.font = 'bold 38px monospace'; c.fillText('[REDACTED]', 14, 62); });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.11), new THREE.MeshPhysicalMaterial({ map: stamp, roughness: 0.8, side: THREE.DoubleSide })); p.position.set((rnd() - 0.5) * 1.6, 0.4 + rnd() * 2, 0.4 + rnd() * 0.3); p.rotation.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5); g.add(p); }
  // a single white eye where a face should be
  const eye = eyeMesh(eyeTexture({ sclera: '#f4f4f4', iris: ['#000', '#000', '#111', '#000'], pupil: 'round', irisR: 60, veins: 0 }), 0.07, 0.8, '#ffffff');
  eye.position.set(B.headCenter[0], B.headCenter[1], B.headCenter[2] + 0.17 * B.headScale); g.add(eye);
  { const l = new THREE.PointLight('#ffffff', 1.5, 2); l.position.set(B.headCenter[0], B.headCenter[1], B.headCenter[2] + 0.5); g.add(l); }
  return shadowAll(g);
}
redactedThing.variants = true;

// ============ PAPER GOLEM ============
export function paperGolem({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.3, bulk: 1.6, belly: 0.2, shoulders: 1.3, head: 0.75, hunch: 0.5, armL: 'forward', armR: 'down', nose: 'none', ears: 'none', legBulk: 1.5, detail: 0, skinNoise: 0 });
  const s = B.scale;
  // the body is a crumpled paper core; its bulk is made of stacked books and sheets
  const sdf = (x, y, z) => B.sdf(x, y, z) + 0.04 + Math.abs(vnoise(x * 14, y * 14, z * 14)) * 0.02;
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#e8dcc0')).lerp(C('#8a7a5a'), clamp01(vnoise(x * 10, y * 10, z * 10) + 0.3)); c.multiplyScalar(ao); };
  const [mn, mx] = B.bbox;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.02, col), skinMaterial({ roughness: 0.95, clearcoat: 0, sheen: 0.4, sheenColor: '#fff4dc', pore: 1.2, poreScale: 0.6 })));
  // bricks of books laid along the limbs and torso
  const placeAlong = (a, b, n, w) => { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; const bk = book(w * (0.8 + rnd() * 0.4), 0.06 + rnd() * 0.03, w * (0.7 + rnd() * 0.4), Math.floor(rnd() * 5)); bk.position.set(...p); bk.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4); g.add(bk); } };
  const S = (p) => p.map((q) => q * s);
  placeAlong(S([0, 0.9, 0.05]), S([0, 1.42, 0.08]), 9, 0.5 * s);
  for (const sx of [-1, 1]) { placeAlong(S([sx * 0.12, 0.85, 0]), S([sx * 0.17, 0.08, 0.03]), 8, 0.2 * s); placeAlong(S([sx * 0.27, 1.32, 0.03]), [B[sx < 0 ? 'handR' : 'handL'][0], B[sx < 0 ? 'handR' : 'handL'][1], B[sx < 0 ? 'handR' : 'handL'][2]], 6, 0.17 * s); }
  // loose sheets fluttering off it
  const sheet = new THREE.MeshPhysicalMaterial({ map: textTex, roughness: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < 40; i++) { const geo = new THREE.PlaneGeometry(0.14, 0.19, 4, 4); const p = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * 20 + i) * 0.01); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, sheet); const a = rnd() * Math.PI * 2, r = 0.25 + rnd() * 0.4; m.position.set(Math.cos(a) * r * s * 0.6, 0.2 + rnd() * 2.1, Math.sin(a) * r * s * 0.5); m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); g.add(m); }
  // origami-crane head and ink-drop eyes
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), new THREE.MeshPhysicalMaterial({ map: textTex, roughness: 0.8, flatShading: true })); head.position.set(...B.headCenter); head.scale.set(1, 1.2, 1.1); g.add(head);
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), glowMat('#ffb040', 3)); e.position.set(p[0], p[1], p[2] + 0.03); g.add(e); }
  return shadowAll(g);
}
paperGolem.variants = true;

// ============ OVERDUE REVENANT ============
export function overdueRevenant({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.9, bulk: 0.7, belly: -0.2, shoulders: 1.0, head: 1.0, hunch: 0.7, armL: 'reach', armR: 'reach', nose: 'hook', ears: 'none', legBulk: 0.6 });
  const s = B.scale;
  // spectral body fading below the waist into wisps
  const sdf = (x, y, z) => { let d = B.sdf(x, y, z); const fade = clamp01((0.95 * s - y) / (0.6 * s)); d += fade * 0.08 + fade * vnoise(x * 10, y * 4, z * 10) * 0.05; return d; };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#8ab8b0')).lerp(C('#1a3a3a'), clamp01(1 - y / (1.6 * s) + vnoise(x * 8, y * 8, z * 8) * 0.3)); c.multiplyScalar(0.5 + ao * 0.5); };
  const [mn, mx] = B.bbox;
  const ghost = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, transparent: true, opacity: 0.62, emissive: C('#2a8a7a'), emissiveIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  const body = new THREE.Mesh(buildMesh(sdf, mn, mx, 0.01, col), ghost); body.position.y = 0.2; g.add(body);
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR * 0.8, 10, 8), glowMat('#c8fff0', 4)); e.position.set(p[0], p[1] + 0.2, p[2]); g.add(e); }
  // iron chains wrapped round it, each ending in a heavy overdue book
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#3a3a3a', { rust: 120 }), metalness: 0.85, roughness: 0.6 });
  for (let c = 0; c < 3; c++) {
    const pts = []; for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * Math.PI * 4 + c * 2; pts.push(new THREE.Vector3(Math.cos(a) * (0.25 + t * 0.15) * s, (1.4 - t * 1.25 + c * 0.05) * s + 0.2, Math.sin(a) * 0.2 * s)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let k = 0; k < 70; k++) { const link = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12), iron); link.position.copy(curve.getPoint(k / 70)); link.lookAt(curve.getPoint(Math.min(1, k / 70 + 0.01))); if (k % 2) link.rotateZ(Math.PI / 2); g.add(link); }
    const end = curve.getPoint(1); const bk = book(0.2, 0.26, 0.07, c + 2); bk.position.copy(end).add(new THREE.Vector3(0, -0.1, 0)); bk.rotation.set(rnd(), rnd() * 3, rnd()); g.add(bk);
  }
  // a due-date card stamped red, hanging from the neck
  const card = canvasTex(192, 256, (cx, w, h) => { cx.fillStyle = '#e8dcc0'; cx.fillRect(0, 0, w, h); cx.strokeStyle = '#555'; for (let y = 40; y < h; y += 26) { cx.beginPath(); cx.moveTo(10, y); cx.lineTo(w - 10, y); cx.stroke(); } cx.fillStyle = '#b01010'; cx.font = 'bold 34px monospace'; cx.save(); cx.translate(30, 160); cx.rotate(-0.3); cx.fillText('OVERDUE', 0, 0); cx.restore(); });
  const cardM = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.19), new THREE.MeshPhysicalMaterial({ map: card, roughness: 0.8, side: THREE.DoubleSide })); cardM.position.set(0, 1.25 * s + 0.2, 0.25 * s); cardM.rotation.x = -0.2; g.add(cardM);
  { const l = new THREE.PointLight('#6affe0', 2, 3); l.position.set(0, 1.4 * s, 0.5); g.add(l); }
  return shadowAll(g);
}
overdueRevenant.variants = true;
