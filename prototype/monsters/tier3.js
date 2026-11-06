// Tier 3 monsters (Floors 7-9: The Undercity).
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid, quadruped } from '../anatomy.js';

const C = (h) => new THREE.Color(h);
const pickV = (v, arr, k = 0) => arr[(v + k * 7) % arr.length];
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const water = () => new THREE.MeshPhysicalMaterial({ color: '#0e140c', roughness: 0.12, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.2, transparent: true, opacity: 0.8, specularIntensity: 0.3 });

// ============ SEWER WYRM ============
export function sewerWyrm({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const spine = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; spine.push([Math.sin(t * 5 + 1) * 0.5 * (1 - t * 0.6), 0.05 + Math.max(0, t - 0.55) * 1.6 + Math.sin(t * 9) * 0.05, -2.2 + t * 2.6]); }
  const R = spine.map((_, i) => 0.18 + Math.sin((i / 16) * 2.6) * 0.1);
  const H = spine[16];
  const sdf = (x, y, z) => {
    let d = chain(x, y, z, spine, R, 0.12);
    const lx = x - H[0], ly = y - H[1], lz = z - H[2], ax = Math.abs(lx);
    d = smin(d, ell(lx, ly, lz, 0, 0.02, 0.1, 0.2, 0.15, 0.24), 0.1); // skull
    d = smin(d, rcone(lx, ly, lz, 0, 0.04, 0.2, 0, 0.0, 0.72, 0.13, 0.07), 0.08); // upper snout
    d = smin(d, rcone(lx, ly, lz, 0, -0.1, 0.15, 0, -0.24, 0.66, 0.1, 0.055), 0.06); // lower jaw, open
    d = smax(d, -rcone(lx, ly, lz, 0, -0.07, 0.3, 0, -0.12, 0.7, 0.03, 0.035), 0.03); // gape
    d = smin(d, sph(ax, ly, lz, 0.1, 0.12, 0.22, 0.06), 0.04); // eye bosses
    d = smax(d, -sph(ax, ly, lz, 0.105, 0.13, 0.27, 0.03), 0.01);
    for (let i = 0; i < 12; i++) { const p = spine[2 + i]; d = smin(d, rcone(x, y, z, p[0], p[1] + R[2 + i] * 0.8, p[2], p[0], p[1] + R[2 + i] + 0.09, p[2] - 0.05, 0.035, 0.005), 0.03); } // dorsal spikes
    if (Math.abs(d) < 0.04) { const sc = Math.abs(Math.sin(x * 40) * Math.sin(z * 40)); d += (sc - 0.5) * 0.006 + fbm(x * 5, y * 5, z * 5) * 0.02; } // scales + lumps
    return d;
  };
  const hide = pickV(variant, [['#4a5a3a', '#1a2414'], ['#5a5a4a', '#2a2a1a'], ['#3a4a4a', '#141c1c']]);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C(hide[0])).lerp(C(hide[1]), clamp01(ny * 0.6 + 0.3 + fbm(x * 4, y * 4, z * 4) * 0.4));
    if (ny < -0.3) c.lerp(C('#8a8a6a'), 0.5); // pale belly
    if (vnoise(x * 7, y * 7, z * 7) > 0.55) c.lerp(C('#4a3a1a'), 0.6); // sewage algae
    const lx = x - H[0], ly = y - H[1], lz = z - H[2];
    if (lz > 0.25 && Math.abs(lx) < 0.06 && ly < -0.05 && ly > -0.2) c.copy(C('#6a2a2a')); // mouth interior
    if (y < 0.08) c.lerp(C('#1a2010'), 0.6); // waterline grime
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-1.1, -0.35, -2.6], [1.1, 1.35, 1.35], 0.016, col), skinMaterial({ roughness: 0.35, clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.2, sheenColor: '#5a6a4a', pore: 0.7, poreScale: 0.5 })));
  const et = eyeTexture({ sclera: '#c8a000', iris: ['#ffd000', '#d8a000', '#8a6000', '#201000'], pupil: 'slit', irisR: 150, veins: 0 });
  for (const sx of [-1, 1]) { const e = eyeMesh(et, 0.032, 0.3, '#ffcc00'); e.position.set(H[0] + sx * 0.105, H[1] + 0.13, H[2] + 0.265); e.rotation.y = -sx * 0.6; g.add(e); }
  const tm = toothMat();
  for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) {
    const t = i / 8, up = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.06 + (i % 3) * 0.02, 6), tm);
    up.position.set(H[0] + sx * (0.08 - t * 0.04), H[1] - 0.03 - t * 0.02, H[2] + 0.3 + t * 0.38); up.rotation.x = Math.PI; g.add(up);
    const lo = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 6), tm); lo.position.set(H[0] + sx * (0.07 - t * 0.035), H[1] - 0.12 - t * 0.12, H[2] + 0.28 + t * 0.36); g.add(lo);
  }
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), water()); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.1, -0.6); g.add(pool);
  return shadowAll(g);
}
sewerWyrm.variants = true;

// ============ CLOCKWORK DEBT COLLECTOR ============
export function debtCollector({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ map: grimeTex('#a8823a', { rust: 40 }), metalness: 1, roughness: 0.32 });
  const steel = new THREE.MeshStandardMaterial({ map: grimeTex('#6a6c70', { rust: 60 }), metalness: 0.95, roughness: 0.4 });
  const black = new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: 0.5, clearcoat: 0.6 });
  const box = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
  const cyl = (r1, r2, h, m, x, y, z, rx = 0, ry = 0, rz = 0, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
  const gear = (r, teeth, th, m, x, y, z, rx, ry) => {
    const gg = new THREE.Group(); gg.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, th, 32), m));
    for (let i = 0; i < teeth; i++) { const a = (i / teeth) * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(r * 0.25, th, r * 0.22), m); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.y = -a; gg.add(t); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, th * 1.6, 16), steel); gg.add(hub);
    gg.position.set(x, y, z); gg.rotation.set(rx, ry, 0); g.add(gg); return gg;
  };
  // spindly digitigrade legs
  for (const sx of [-1, 1]) {
    cyl(0.035, 0.03, 0.5, steel, sx * 0.13, 0.85, 0.02, 0.25); cyl(0.05, 0.05, 0.08, brass, sx * 0.13, 0.6, 0.08, 0, 0, Math.PI / 2);
    cyl(0.028, 0.025, 0.5, steel, sx * 0.13, 0.36, 0.0, -0.35); box(0.1, 0.04, 0.22, brass, sx * 0.13, 0.04, 0.06);
  }
  // barrel torso with exposed clockwork window
  cyl(0.24, 0.2, 0.6, brass, 0, 1.38, 0, 0, 0, 0, 32);
  cyl(0.26, 0.26, 0.05, steel, 0, 1.69, 0); cyl(0.22, 0.22, 0.05, steel, 0, 1.08, 0);
  const win = new THREE.Mesh(new THREE.CircleGeometry(0.14, 32), new THREE.MeshPhysicalMaterial({ color: '#aabbbb', transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1 })); win.position.set(0, 1.4, 0.245); g.add(win);
  gear(0.08, 12, 0.02, brass, -0.04, 1.43, 0.2, Math.PI / 2, 0); gear(0.05, 9, 0.02, steel, 0.07, 1.36, 0.21, Math.PI / 2, 0); gear(0.04, 8, 0.02, brass, 0.02, 1.3, 0.19, Math.PI / 2, 0);
  gear(0.18, 16, 0.03, brass, 0, 1.45, -0.24, Math.PI / 2, 0); // big winding gear on the back
  const key = new THREE.Group(); const kb = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 20), brass); kb.position.y = 0.12; key.add(kb, new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), brass)); key.position.set(0, 1.45, -0.36); key.rotation.x = Math.PI / 2; g.add(key);
  // arms: one holding a ledger, one a stamp
  for (const sx of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), brass); sh.position.set(sx * 0.27, 1.62, 0); g.add(sh);
    cyl(0.025, 0.025, 0.38, steel, sx * 0.32, 1.44, 0.07, 0.4, 0, sx * 0.15);
    cyl(0.022, 0.02, 0.34, steel, sx * 0.33, 1.25, 0.28, 1.2, 0, 0);
  }
  const ledger = box(0.24, 0.32, 0.05, new THREE.MeshPhysicalMaterial({ map: grimeTex('#3a1a14', { rust: 10 }), roughness: 0.7 }), 0.33, 1.2, 0.46, -0.4, 0.2, 0);
  box(0.22, 0.3, 0.052, new THREE.MeshPhysicalMaterial({ color: '#e8dcc0', roughness: 0.9 }), 0.335, 1.2, 0.462, -0.4, 0.2, 0).scale.set(1, 1, 0.9);
  cyl(0.05, 0.06, 0.06, black, -0.33, 1.18, 0.45, 1.2); const ink = cyl(0.052, 0.052, 0.01, new THREE.MeshStandardMaterial({ color: '#a01010' }), -0.33, 1.15, 0.47, 1.2);
  // head: a clock face with glowing hands, and a stovepipe hat
  cyl(0.06, 0.08, 0.1, steel, 0, 1.75, 0);
  const face = cyl(0.17, 0.17, 0.08, brass, 0, 1.95, 0.0, Math.PI / 2, 0, 0, 40);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), new THREE.MeshPhysicalMaterial({ map: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.font = 'bold 26px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; c.fillText(['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][i - 1], w / 2 + Math.cos(a) * 100, h / 2 + Math.sin(a) * 100); } for (let i = 0; i < 200; i++) { c.fillStyle = `rgba(80,50,20,${rnd() * 0.2})`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 10); } }), roughness: 0.5 }));
  dial.position.set(0, 1.95, 0.042); g.add(dial);
  const handM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3a1a').multiplyScalar(2) });
  for (const [len, a] of [[0.12, 0.4 + variant], [0.08, 2.2 + variant * 0.7]]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.012, len, 0.006), handM); h.geometry.translate(0, len / 2, 0); h.position.set(0, 1.95, 0.05); h.rotation.z = a; g.add(h); }
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), handM); e.position.set(sx * 0.06, 2.0, 0.048); g.add(e); }
  { const fl = new THREE.PointLight('#ff4a2a', 1.2, 1.2); fl.position.set(0, 1.95, 0.2); g.add(fl); }
  cyl(0.14, 0.14, 0.32, black, 0, 2.28, -0.01); cyl(0.22, 0.22, 0.02, black, 0, 2.12, -0.01);
  cyl(0.142, 0.142, 0.05, new THREE.MeshPhysicalMaterial({ color: pickV(variant, ['#7a1a14', '#1a3a7a', '#2a5a2a']), roughness: 0.5 }), 0, 2.16, -0.01);
  // steam vents
  const steam = new THREE.MeshBasicMaterial({ color: '#d8d8d8', transparent: true, opacity: 0.18, depthWrite: false });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.04 + i * 0.015, 10, 8), steam); p.position.set(0.18 + i * 0.03, 1.72 + i * 0.07, -0.1); g.add(p); }
  return shadowAll(g);
}
debtCollector.variants = true;

// ============ FUNGAL CHOIR ============
export function fungalChoir({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const shrooms = [[0, 0, 0.9, 0.42, 0], [-0.55, 0.15, 0.65, 0.32, 0.25], [0.5, -0.1, 0.55, 0.28, -0.3], [-0.2, -0.45, 0.4, 0.22, 0.1], [0.3, 0.45, 0.35, 0.2, -0.15], [-0.75, -0.35, 0.28, 0.16, 0.3], [0.8, 0.25, 0.25, 0.14, -0.4]];
  const sdf = (x, y, z) => {
    let d = 1e9;
    for (const [sx, sz, h, r, tilt] of shrooms) {
      const lx = x - sx, lz = z - sz;
      const bend = Math.sin(y * 2) * tilt * 0.3;
      let s = rcone(lx - bend, y, lz, 0, 0, 0, 0, h, 0, r * 0.32, r * 0.22); // stalk
      s = smin(s, ell(lx - bend * 1.4, y, lz, 0, h, 0, r, r * 0.5, r), r * 0.3); // cap
      s = smax(s, -ell(lx - bend * 1.4, y, lz, 0, h - r * 0.38, 0, r * 0.92, r * 0.2, r * 0.92), 0.02); // hollow underside (gills)
      // singing mouth on the stalk + two eye pits
      s = smax(s, -ell(lx - bend, y, lz, 0, h * 0.55, r * 0.3, r * 0.12, r * 0.18, r * 0.12), 0.02);
      s = smax(s, -sph(Math.abs(lx - bend), y, lz, r * 0.1, h * 0.75, r * 0.26, r * 0.06), 0.01);
      d = smin(d, s, 0.05);
    }
    d = smin(d, ell(x, y, z, 0, -0.05, 0, 1.2, 0.12, 0.9), 0.15); // mycelium mound
    if (Math.abs(d) < 0.03) d += fbm(x * 10, y * 10, z * 10) * 0.008 + (Math.abs(vnoise(x * 40, y * 40, z * 40)) - 0.3) * 0.003;
    return d;
  };
  const capC = pickV(variant, [['#c84a2a', '#e8d8b0'], ['#6a2a8a', '#c8b8e8'], ['#2a6a8a', '#d0e8f0']]);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#d8cca8')).lerp(C('#8a7a5a'), clamp01(fbm(x * 8, y * 8, z * 8) + 0.3)); // pale stalk
    for (const [sx, sz, h, r] of shrooms) {
      if (Math.hypot(x - sx, z - sz) < r * 1.05 && y > h - r * 0.1 && ny > -0.2) { c.copy(C(capC[0])).lerp(C('#2a0a0a'), clamp01(vnoise(x * 12, y * 12, z * 12) * 0.5 + 0.2));
        if (vnoise(x * 30, y * 30, z * 30) > 0.45) c.copy(C(capC[1])); } // spots
      if (Math.hypot(x - sx, z - sz) < r && y < h && y > h - r * 0.5 && ny < -0.3) c.copy(C('#e8c8a0')).lerp(C('#9aff8a'), 0.4); // glowing gills
    }
    if (y < 0.08) c.copy(C('#3a2a1a')).lerp(C('#e8e0c8'), clamp01(vnoise(x * 30, 0, z * 30))); // mycelium
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-1.3, -0.15, -1.0], [1.3, 1.25, 1.0], 0.01, col), skinMaterial({ roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: '#ffe8c8', pore: 0.6, poreScale: 0.7 })));
  // spore cloud + glow
  const spore = new THREE.MeshBasicMaterial({ color: new THREE.Color('#c8ff9a').multiplyScalar(2), transparent: true, opacity: 0.7 });
  for (let i = 0; i < 160; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.006 + rnd() * 0.006, 6, 4), spore); p.position.set((rnd() - 0.5) * 2.2, 0.3 + rnd() * 1.3, (rnd() - 0.5) * 1.6); g.add(p); }
  for (const [sx, sz, h] of shrooms.slice(0, 3)) { const l = new THREE.PointLight('#9aff7a', 1.4, 1.6); l.position.set(sx, h - 0.15, sz); g.add(l); }
  return shadowAll(g);
}
fungalChoir.variants = true;

// ============ TUNNEL MOLE-KIN ============
export function moleKin({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.35, bulk: 1.45, belly: 0.6, shoulders: 1.15, head: 1.05, hunch: 0.8, armL: 'forward', armR: 'hip', nose: 'none', ears: 'none', jaw: 'normal', legBulk: 1.2 });
  const s = B.scale, hc = B.headCenter, hsc = B.headScale;
  const sdf = (x, y, z) => {
    let d = B.sdf(x, y, z);
    // long fleshy star-snout
    const tip = [hc[0], hc[1] - 0.06 * hsc, hc[2] + 0.3 * hsc];
    d = smin(d, rcone(x, y, z, hc[0], hc[1] - 0.03 * hsc, hc[2] + 0.12 * hsc, tip[0], tip[1], tip[2], 0.06 * hsc, 0.04 * hsc), 0.03);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; d = smin(d, rcone(x, y, z, tip[0], tip[1], tip[2], tip[0] + Math.cos(a) * 0.05 * hsc, tip[1] + Math.sin(a) * 0.05 * hsc, tip[2] + 0.04 * hsc, 0.012 * hsc, 0.006 * hsc), 0.01); }
    // huge spade claws on both hands
    for (const h of [B.handL, B.handR]) d = smin(d, ell(x, y, z, h[0], h[1], h[2], 0.09 * s, 0.04 * s, 0.09 * s), 0.03);
    if (Math.abs(d) < 0.02) d += (Math.abs(vnoise(x * 120, y * 120, z * 120)) - 0.3) * 0.004; // velvet fur
    return d;
  };
  const fur = pickV(variant, ['#3a3430', '#5a4a3a', '#2a2a30']);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C(fur)).lerp(C('#141210'), clamp01(fbm(x * 12, y * 12, z * 12) + 0.3));
    if (z > hc[2] + 0.14 * hsc && y > hc[1] - 0.15 && y < hc[1] + 0.05) c.copy(C('#d88a8a')).lerp(C('#8a3a3a'), clamp01(vnoise(x * 60, y * 60, z * 60) + 0.3)); // pink snout
    for (const h of [B.handL, B.handR]) if (Math.hypot(x - h[0], y - h[1], z - h[2]) < 0.1 * s) c.copy(C('#c89a8a'));
    if (y < 0.86 * s && y > 0.45 * s) c.lerp(C('#4a3a24'), 0.5); // leather apron
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[0] -= 0.1; mx[0] += 0.1; mx[2] += 0.25;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.0075, col), skinMaterial({ roughness: 0.85, clearcoat: 0.05, sheen: 1, sheenColor: '#8a7a6a', pore: 0.4 })));
  // tiny beady eyes
  const bead = new THREE.MeshPhysicalMaterial({ color: '#050505', roughness: 0.05, clearcoat: 1 });
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR * 0.45, 12, 8), bead); e.position.set(...p); g.add(e); }
  const cm = clawMat(); cm.color = C('#d8c8a0');
  for (const h of [B.handL, B.handR]) for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.09, 6), cm); c.position.set(h[0] + (i - 1.5) * 0.04, h[1] - 0.02, h[2] + 0.1); c.rotation.x = Math.PI / 2 + 0.4; g.add(c); }
  // mining helmet with a lamp, and a pickaxe at the hip
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.17 * hsc, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: grimeTex(pickV(variant, ['#c8a020', '#c84a1a', '#e8e8e0']), { rust: 40 }), roughness: 0.45, clearcoat: 0.5 }));
  helm.position.set(hc[0], hc[1] + 0.03, hc[2] - 0.01); g.add(helm);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.05, 16), new THREE.MeshStandardMaterial({ color: '#555', metalness: 0.9, roughness: 0.3 })); lamp.rotation.x = Math.PI / 2; lamp.position.set(hc[0], hc[1] + 0.1, hc[2] + 0.17 * hsc); g.add(lamp);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4c0').multiplyScalar(3) })); lens.position.set(hc[0], hc[1] + 0.1, hc[2] + 0.17 * hsc + 0.026); g.add(lens);
  const sl = new THREE.SpotLight('#fff0c0', 8, 5, 0.4, 0.4, 1.2); sl.position.copy(lens.position); sl.target.position.set(hc[0], 0, hc[2] + 2); g.add(sl, sl.target);
  const pick = new THREE.Group(); const wood = new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a4a2a', { rust: 5 }), roughness: 0.8 });
  pick.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 8), wood)); const head = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.005, 0.45, 8), new THREE.MeshStandardMaterial({ map: grimeTex('#5a5a5a'), metalness: 0.9, roughness: 0.5 })); head.rotation.z = Math.PI / 2; head.position.y = 0.33; pick.add(head);
  pick.position.set(-0.3 * s, 0.5 * s, -0.05); pick.rotation.z = 0.3; g.add(pick);
  return shadowAll(g);
}
moleKin.variants = true;

// ============ GREASE GOLEM ============
export function greaseGolem({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.3, bulk: 1.7, belly: 1.0, shoulders: 1.25, head: 0.85, hunch: 0.6, armL: 'forward', armR: 'reach', nose: 'none', ears: 'none', jaw: 'heavy', legBulk: 1.6, detail: 0, skinNoise: 0 });
  const s = B.scale;
  const sdf = (x, y, z) => {
    let d = B.sdf(x, y, z);
    // molten, sagging surface
    d += fbm(x * 3, y * 2, z * 3) * 0.06 + Math.sin(y * 18 + fbm(x * 4, 0, z * 4) * 4) * 0.008;
    // drips running off the arms and belly
    for (let i = 0; i < 9; i++) { const a = i * 2.3, rx = Math.sin(a) * 0.35 * s, rz = 0.1 + Math.cos(a) * 0.25 * s, top = (0.9 + (i % 3) * 0.25) * s; d = smin(d, rcone(x, y, z, rx, top, rz, rx * 1.05, top - 0.4 - (i % 2) * 0.3, rz + 0.02, 0.04, 0.015), 0.05); }
    d = smin(d, ell(x, y, z, 0, 0.0, 0.1, 0.75, 0.06, 0.7), 0.15); // pooled grease at its feet
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#6a3a08')).lerp(C('#140802'), clamp01(fbm(x * 4, y * 4, z * 4) + 0.6 - ny * 0.3));
    if (vnoise(x * 10, y * 10, z * 10) > 0.55) c.lerp(C('#e8a830'), 0.45); // hot glistening streaks
    c.multiplyScalar(0.5 + ao * 0.5);
  };
  const [mn, mx] = B.bbox; mn[0] -= 0.4; mx[0] += 0.4; mn[2] -= 0.4; mx[2] += 0.4;
  const oil = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, transmission: 0.12, thickness: 0.8, ior: 1.47, attenuationColor: C('#4a2004'), attenuationDistance: 0.4, sheen: 0.2, sheenColor: C('#ffd080') });
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.02, col), oil));
  // things floating in it: fries, a fry basket fused into its chest, bones
  const fry = new THREE.MeshPhysicalMaterial({ color: '#e8b040', roughness: 0.6 });
  for (let i = 0; i < 24; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), fry); f.position.set((rnd() - 0.5) * 0.7, 0.4 + rnd() * 1.3, (rnd() - 0.5) * 0.4 + 0.1); f.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); g.add(f); }
  const wire = new THREE.MeshStandardMaterial({ color: '#8a8a8a', metalness: 1, roughness: 0.35, wireframe: true });
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.25, 6, 4, 4), wire); basket.position.set(0.05, 1.35 * s, 0.32 * s); basket.rotation.set(0.2, 0.3, 0.1); g.add(basket);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.4 })); handle.position.set(0.3, 1.35 * s, 0.55 * s); handle.rotation.set(1.2, 0, -0.4); g.add(handle);
  // burning eyes
  const fire = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb020').multiplyScalar(3) });
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), fire); e.position.set(p[0], p[1], p[2] + 0.03); g.add(e); }
  const heat = new THREE.PointLight('#ff9a2a', 4, 3); heat.position.set(0, 1.5 * s, 0.6); g.add(heat);
  return shadowAll(g);
}
greaseGolem.variants = true;

// ============ RATKING CHOIR ============
let ratGeo = null;
export function ratkingChoir({ variant = 0 } = {}) {
  const g = new THREE.Group();
  if (!ratGeo) {
    const Q = quadruped({ height: 0.16, length: 1.25, bulk: 1.3, gaunt: 0.3, snout: 1.25, ears: 'round', tail: false, mouthOpen: 0.5, legs: 0.38 });
    const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#5a4a42')).lerp(C('#1a1614'), clamp01(fbm(x * 40, y * 40, z * 40) + 0.3 - ny * 0.2)); if (vnoise(x * 50, y * 50, z * 50) > 0.45) c.lerp(C('#8a5a5a'), 0.6); if (z > Q.snoutTip[2] - 0.02) c.copy(C('#c88a8a')); c.multiplyScalar(ao); };
    const [mn, mx] = Q.bbox;
    ratGeo = { geo: buildMesh(Q.sdf, mn, mx, 0.0025, col), Q };
  }
  const mat = skinMaterial({ roughness: 0.7, clearcoat: 0.15, sheen: 1, sheenColor: '#a89888', pore: 0.4, poreScale: 2 });
  const et = eyeTexture({ sclera: '#1a0000', iris: ['#ff2020', '#a00000', '#500000', '#100000'], pupil: 'round', irisR: 160, veins: 0 });
  const tailMat = new THREE.MeshPhysicalMaterial({ color: '#b08a80', roughness: 0.5, clearcoat: 0.3 });
  const knot = new THREE.Vector3(0, 0.08, 0);
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rnd() * 0.3, rr = 0.28 + rnd() * 0.08;
    const rat = new THREE.Group(); rat.add(new THREE.Mesh(ratGeo.geo, mat));
    for (const p of ratGeo.Q.eyes) { const e = eyeMesh(et, ratGeo.Q.eyeR * 0.8, 0.6, '#ff2020'); e.position.set(...p); rat.add(e); }
    rat.position.set(Math.sin(a) * rr, (i % 3 === 0 ? 0.12 : 0), Math.cos(a) * rr); rat.rotation.y = a + (rnd() - 0.5) * 0.5;
    if (i % 3 === 0) rat.rotation.x = -0.4; // some climbing over the others
    rat.scale.setScalar(0.9 + rnd() * 0.25); g.add(rat);
    // tails run back into one tangled knot
    const tailStart = new THREE.Vector3(Math.sin(a) * (rr - 0.14), 0.07, Math.cos(a) * (rr - 0.14));
    const pts = [tailStart]; for (let k = 1; k <= 5; k++) { const t = k / 5; pts.push(tailStart.clone().lerp(knot, t).add(new THREE.Vector3(Math.sin(k * 2 + i) * 0.04, Math.sin(k * 3 + i) * 0.03, Math.cos(k * 2 + i) * 0.04))); }
    for (let k = 0; k < 3; k++) pts.push(knot.clone().add(new THREE.Vector3(Math.sin(i + k * 2.1) * 0.05, 0.02 * k, Math.cos(i + k * 2.1) * 0.05)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.009, 6), tailMat));
  }
  const crud = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#3a2a1a', roughness: 0.4, clearcoat: 0.8 })); crud.position.copy(knot); crud.scale.set(1.2, 0.6, 1.2); g.add(crud);
  return shadowAll(g);
}
ratkingChoir.variants = true;
