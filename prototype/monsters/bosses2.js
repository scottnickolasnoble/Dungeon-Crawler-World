// Floor 4-6 bosses: six Neighbourhood bosses (Tier 2 mobs), six Borough bosses, three City bosses.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid, quadruped } from '../anatomy.js';
import * as T2 from './tier2.js';

const C = (h) => new THREE.Color(h);
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
const textTex = (txt, bg, fg, w = 512, h = 128, size = 64) => canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = `bold ${size}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, w / 2, h / 2 + 4); });
const plate = (txt, bg, fg, w, h, size) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: textTex(txt, bg, fg, 512, Math.round(512 * h / w), size), roughness: 0.5, side: THREE.DoubleSide }));
const P = (geo, mat, pos, rot = [0, 0, 0], sc) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); if (sc) m.scale.set(...sc); return m; };
function addLight(g, col, i, d, pos) { const l = new THREE.PointLight(col, i, d); l.position.set(...pos); g.add(l); return l; }

// ============ CAPTAIN KEVLAR (Mall-Cop Ogre boss) ============
export function captainKevlar() {
  const g = new THREE.Group(); const o = T2.mallCopOgre({ variant: 2 }); g.add(o); // variant 2 = bare head, so the riot helmet fits
  const dark = new THREE.MeshPhysicalMaterial({ color: '#1a1e26', roughness: 0.35, clearcoat: 0.8 });
  const helm = P(new THREE.SphereGeometry(0.3, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), dark, [0, 2.36, 0.33]); g.add(helm);
  const visor = P(new THREE.SphereGeometry(0.31, 28, 18, -0.9, 1.8, Math.PI * 0.35, Math.PI * 0.3), new THREE.MeshPhysicalMaterial({ color: '#304050', transmission: 0.6, roughness: 0.05, transparent: true, opacity: 0.55, side: THREE.DoubleSide }), [0, 2.32, 0.33]); g.add(visor);
  // riot shield
  const shield = P(new THREE.BoxGeometry(0.75, 1.3, 0.03), new THREE.MeshPhysicalMaterial({ color: '#a8c0d0', transmission: 0.7, roughness: 0.15, thickness: 0.03, transparent: true, opacity: 0.6, clearcoat: 1 }), [0.62, 1.35, 0.85], [0, -0.25, 0]); g.add(shield);
  const lab = plate('SECURITY', '#00000000', '#f0f0f0', 0.6, 0.12, 80); lab.position.set(0.62, 1.7, 0.87); lab.rotation.y = -0.25; lab.material.transparent = true; g.add(lab);
  // shoulder strobes red/blue
  for (const [x, c] of [[-0.55, '#ff2a2a'], [0.55, '#2a6aff']]) { g.add(P(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 14), glow(c, 3), [x, 2.05, 0.15])); addLight(g, c, 4, 4, [x, 2.2, 0.4]); }
  // stun baton in the right hand
  const bat = P(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 10), dark, [-0.68, 1.0, 0.45], [0.9, 0, 0]); g.add(bat);
  g.add(P(new THREE.SphereGeometry(0.04, 10, 8), glow('#9ad8ff', 3), [-0.68, 1.3, 0.78]));
  g.scale.setScalar(1.3);
  return shadowAll(g);
}

// ============ MR. FETCH (Cul-de-Sac Hound boss) ============
export function mrFetch() {
  const g = new THREE.Group(); const h = T2.culDeSacHound({ variant: 1 }); g.add(h);
  // a spiked collar, and a stolen sword clamped in its jaws
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#4a4440', { rust: 80 }), metalness: 0.85, roughness: 0.5 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const s = P(new THREE.ConeGeometry(0.012, 0.05, 6), iron, [0, 0.92 + Math.sin(a) * 0.09, 0.6 + Math.cos(a) * 0.09]); s.lookAt(0, 0.92 + Math.sin(a) * 0.5, 0.6 + Math.cos(a) * 0.5); s.rotateX(Math.PI / 2); g.add(s); }
  const sword = new THREE.Group(); sword.add(P(new THREE.BoxGeometry(0.9, 0.04, 0.008), new THREE.MeshStandardMaterial({ color: '#c8ccd4', metalness: 1, roughness: 0.2 }), [0.2, 0, 0])); sword.add(P(new THREE.BoxGeometry(0.02, 0.16, 0.03), new THREE.MeshStandardMaterial({ color: '#b8923a', metalness: 1, roughness: 0.3 }), [-0.26, 0, 0])); sword.add(P(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8), new THREE.MeshPhysicalMaterial({ color: '#3a2416' }), [-0.34, 0, 0], [0, 0, Math.PI / 2]));
  sword.position.set(0, 0.86, 1.05); sword.rotation.y = 0.2; g.add(sword);
  const bones = new THREE.MeshPhysicalMaterial({ color: '#e0d4b8', roughness: 0.5 });
  for (let i = 0; i < 18; i++) { const b = P(new THREE.CapsuleGeometry(0.03, 0.3, 4, 8), bones, [(rnd() - 0.5) * 2.2, 0.03, (rnd() - 0.5) * 1.8], [Math.PI / 2, 0, rnd() * 6]); g.add(b); }
  g.scale.setScalar(2.1);
  return shadowAll(g);
}

// ============ AUNTIE SLUDGE (Gutter Hag boss) ============
export function auntieSludge() {
  const g = new THREE.Group(); const hg = T2.gutterHag({ variant: 0 }); g.add(hg);
  // bandolier of glowing ingredient jars, and a crown of bent ladles
  const cols = ['#9aff3a', '#ff3a9a', '#3ac8ff', '#ffd03a', '#c83aff'];
  for (let i = 0; i < 9; i++) { const t = i / 8; const j = P(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), new THREE.MeshPhysicalMaterial({ color: cols[i % 5], transmission: 0.5, roughness: 0.05, emissive: C(cols[i % 5]), emissiveIntensity: 0.8, transparent: true, opacity: 0.85 }), [-0.22 + t * 0.44, 1.32 - Math.sin(t * Math.PI) * 0.0 - t * 0.35, 0.33 + Math.sin(t * Math.PI) * 0.04]); g.add(j); }
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#6a6a6a', { rust: 60 }), metalness: 0.9, roughness: 0.4 });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const l = P(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 6), iron, [Math.cos(a) * 0.13, 1.92, 0.25 + Math.sin(a) * 0.13], [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]); g.add(l); }
  // two more cauldrons: one of water (thirst), one of stew (hunger) that she swaps
  for (const [x, col, em] of [[-0.75, '#3a8ac8', '#1a4a8a'], [0.2, '#8a5a1a', '#5a3000']]) {
    const pot = P(new THREE.SphereGeometry(0.33, 24, 16, 0, Math.PI * 2, 0.5, Math.PI - 0.5), iron, [x, 0.32, 0.65]); pot.material = iron.clone(); pot.material.side = THREE.DoubleSide; g.add(pot);
    const brew = P(new THREE.CircleGeometry(0.29, 24), new THREE.MeshPhysicalMaterial({ color: col, emissive: C(em), emissiveIntensity: 0.7, roughness: 0.1, clearcoat: 1 }), [x, 0.6, 0.65], [-Math.PI / 2, 0, 0]); g.add(brew);
  }
  g.scale.setScalar(1.6);
  return shadowAll(g);
}

// ============ THE BIRTHDAY BLOB (Bounce-House Slime boss) ============
export function birthdayBlob() {
  const g = new THREE.Group(); const b = T2.bounceHouseSlime({ variant: 0 }); g.add(b);
  const hats = ['#ff3a8a', '#3ac8ff', '#ffd020'];
  for (let i = 0; i < 3; i++) { const h = P(new THREE.ConeGeometry(0.12, 0.35, 16), new THREE.MeshPhysicalMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = hats[i]; c.fillRect(0, 0, 128, 128); c.fillStyle = '#fff'; for (let y = 0; y < 128; y += 24) for (let x = (y / 24) % 2 * 12; x < 128; x += 24) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); } }), roughness: 0.4 }), [-0.4 + i * 0.4, 1.08 + (i === 1 ? 0.12 : 0), 0.3]); h.rotation.z = (i - 1) * -0.3; g.add(h); }
  // candles on top, lit
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const x = Math.cos(a) * 0.35, z = Math.sin(a) * 0.3; g.add(P(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 10), new THREE.MeshPhysicalMaterial({ color: ['#ff6aa8', '#6ad8ff', '#a8ff6a'][i % 3], roughness: 0.5 }), [x, 1.12, z])); g.add(P(new THREE.SphereGeometry(0.025, 8, 6), glow('#ffd060', 3), [x, 1.26, z], [0, 0, 0], [0.7, 1.4, 0.7])); }
  addLight(g, '#ffd060', 3, 3, [0, 1.6, 0.4]);
  // balloons on strings
  const bc = ['#e81a3a', '#1a8ae8', '#e8c81a', '#2ac85a', '#c81ae8'];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, top = new THREE.Vector3(Math.cos(a) * 1.0, 2.2 + Math.sin(i * 3) * 0.3, Math.sin(a) * 0.8); g.add(P(new THREE.SphereGeometry(0.16, 20, 16), new THREE.MeshPhysicalMaterial({ color: bc[i % 5], roughness: 0.15, clearcoat: 1 }), top.toArray(), [0, 0, 0], [1, 1.2, 1])); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([top.clone().add(new THREE.Vector3(0, -0.19, 0)), new THREE.Vector3(Math.cos(a) * 0.6, 1.4, Math.sin(a) * 0.5), new THREE.Vector3(Math.cos(a) * 0.5, 0.9, Math.sin(a) * 0.45)]), 12, 0.003, 4), new THREE.MeshStandardMaterial({ color: '#e8e8e8' }))); }
  // gift boxes stacked around it
  for (let i = 0; i < 7; i++) { const s = 0.2 + rnd() * 0.25, a = rnd() * Math.PI * 2; const bx = P(new THREE.BoxGeometry(s, s, s), new THREE.MeshPhysicalMaterial({ color: bc[i % 5], roughness: 0.4, clearcoat: 0.5 }), [Math.cos(a) * 1.3, s / 2, Math.sin(a) * 1.1], [0, rnd() * 3, 0]); g.add(bx); g.add(P(new THREE.BoxGeometry(s * 1.02, s * 1.02, s * 0.15), new THREE.MeshPhysicalMaterial({ color: '#f0f0f0', roughness: 0.3 }), bx.position.toArray(), [0, bx.rotation.y, 0])); }
  g.scale.setScalar(2.2);
  return shadowAll(g);
}

// ============ THE GNOME POPE (Lawn Gnome Cult boss) ============
export function gnomePope() {
  const g = new THREE.Group(); const p = T2.lawnGnome({ variant: 0 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d8b040', metalness: 1, roughness: 0.25 });
  // papal mitre over the pointed hat, a gnome-headed crozier
  const mitreM = new THREE.MeshPhysicalMaterial({ map: canvasTex(128, 256, (c) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, 128, 256); c.fillStyle = '#c8a040'; c.fillRect(54, 0, 20, 256); c.fillRect(0, 230, 128, 26); c.fillStyle = '#b01818'; c.fillRect(48, 90, 32, 12); c.fillRect(58, 70, 12, 50); }), roughness: 0.5, clearcoat: 0.5 });
  const mitre = P(new THREE.ConeGeometry(0.15, 0.5, 4), mitreM, [0.0, 0.88, 0.0], [0, Math.PI / 4, 0], [1, 1, 0.55]); p.add(mitre);
  const croz = new THREE.Group(); croz.add(P(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 8), gold, [0, 0.5, 0])); croz.add(P(new THREE.TorusGeometry(0.08, 0.015, 8, 20, Math.PI * 1.4), gold, [0.05, 1.05, 0]));
  croz.add(P(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#e8b898', roughness: 0.4, clearcoat: 0.8 }), [0.12, 1.0, 0])); croz.add(P(new THREE.ConeGeometry(0.04, 0.09, 10), new THREE.MeshPhysicalMaterial({ color: '#c81a1a', roughness: 0.4 }), [0.12, 1.07, 0]));
  croz.position.set(0.2, 0.0, 0.12); p.add(croz);
  p.scale.setScalar(3.0); g.add(p);
  // congregation of gnomes kneeling in rings, and a stone altar
  for (let i = 0; i < 10; i++) { const a = -0.9 + (i / 9) * 1.8 + Math.PI / 2, r = 1.6 + (i % 2) * 0.5; const n = T2.lawnGnome({ variant: i }); n.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); n.lookAt(0, 0, 0); n.rotateX(0.25); g.add(n); }
  g.add(P(new THREE.CylinderGeometry(1.1, 1.3, 0.25, 32), new THREE.MeshStandardMaterial({ map: grimeTex('#8a8478', { rust: 20 }), roughness: 0.8 }), [0, 0.12, 0]));
  addLight(g, '#ff3a1a', 3, 5, [0, 2.5, 1.2]);
  g.children.forEach((c) => { if (c === p) c.position.y = 0.25; });
  return shadowAll(g);
}

// ============ THE FINAL NOTICE (Coupon Leech boss) ============
export function finalNotice() {
  const g = new THREE.Group(); const l = T2.couponLeech({ variant: 0 }); l.scale.setScalar(2.6); g.add(l);
  const env = canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b01010'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#b01010'; c.font = 'bold 34px sans-serif'; c.fillText('FINAL', 60, 70); c.fillText('NOTICE', 50, 112); });
  const em = new THREE.MeshPhysicalMaterial({ map: env, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 40; i++) { const e = P(new THREE.PlaneGeometry(0.3, 0.19), em, [(rnd() - 0.5) * 4, 0.01 + rnd() * 0.02, (rnd() - 0.3) * 3.5], [-Math.PI / 2 + (rnd() - 0.5) * 0.3, 0, rnd() * 6]); g.add(e); }
  for (let s = 0; s < 6; s++) { const x = (rnd() - 0.5) * 3.2, z = -1.5 + rnd() * 0.6; for (let k = 0; k < 10 + s * 3; k++) g.add(P(new THREE.BoxGeometry(0.3, 0.02, 0.22), new THREE.MeshPhysicalMaterial({ color: k % 2 ? '#f0ece0' : '#e8d8b8', roughness: 0.9 }), [x + (rnd() - 0.5) * 0.04, 0.01 + k * 0.021, z], [0, rnd() * 0.3, 0])); }
  const coin = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.2 });
  for (let i = 0; i < 9; i++) g.add(P(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 28), coin, [(rnd() - 0.5) * 3, 0.15 + rnd() * 0.3, 1 + rnd()], [rnd() * 1.4, 0, rnd()]));
  const stamp = plate('PAST DUE', '#b01010', '#f0f0f0', 1.4, 0.35, 110); stamp.position.set(0, 1.6, -1.2); stamp.rotation.z = 0.12; g.add(stamp);
  return shadowAll(g);
}

// ============ THE HOA PRESIDENT (Borough boss, Floor 4) ============
export function hoaPresident() {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.8, bulk: 0.8, belly: -0.1, shoulders: 1.0, head: 1.05, hunch: -0.1, armL: 'forward', armR: 'raised', nose: 'flat', ears: 'round', jaw: 'normal', legBulk: 0.8, skinNoise: 0.15 });
  const s = B.scale, hc = B.headCenter, hs = B.headScale;
  const helmetHair = (x, y, z) => { const lx = (x - hc[0]) / hs, ly = (y - hc[1]) / hs, lz = (z - hc[2]) / hs; let d = ell(lx, ly, lz, 0, 0.04, -0.02, 0.165, 0.16, 0.175); d = Math.max(d, -(ly + 0.02 - Math.max(0, lz - 0.05) * 1.2)); d = Math.max(d, -ell(lx, ly, lz, 0, -0.03, 0.12, 0.13, 0.11, 0.1)); return d * hs; };
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), helmetHair(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const u = y / s;
    if (helmetHair(x, y, z) < B.sdf(x, y, z)) c.copy(C('#d8c090')).lerp(C('#a88a50'), clamp01(Math.sin(y * 300) * 0.3 + 0.3)); // lacquered blonde helmet hair
    else if (u > 1.47) c.copy(C('#f0d8c8')).lerp(C('#d8a8a0'), clamp01(fbm(x * 18, y * 18, z * 18) + 0.4));
    else if (u > 0.1) { c.copy(C('#4a5a7a')).lerp(C('#2a3248'), clamp01(vnoise(x * 20, y * 20, z * 20) * 0.5 + 0.2)); if (Math.abs(x / s) < 0.05 && u > 1.0 && u < 1.42 && z > 0) c.copy(C('#f0f0f0')); if (Math.abs(x / s) < 0.02 && u > 1.05 && u < 1.4 && z > 0) c.copy(C('#5a8a5a')); if (Math.abs(x / s) > 0.33 && u > 0.95 && u < 1.12) c.copy(C('#e8c8b0')); } // beige power suit, green tie
    else c.copy(C('#3a2a1a'));
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mx[1] += 0.2;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.012, col), skinMaterial({ roughness: 0.5, clearcoat: 0.3, sheen: 0.4, sheenColor: '#e8e0d0', pore: 0.3 })));
  for (const p of B.eyes) { const e = eyeMesh(eyeTexture({ sclera: '#f4f0e8', iris: ['#2a8a4a', '#1a5a2a', '#0a2a10', '#000'], pupil: 'round', irisR: 50, veins: 0 }), B.eyeR * 0.85, 0.15, '#3aff6a'); e.position.set(...p); g.add(e); }
  const wire = new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.2 });
  for (const sx of [-1, 1]) g.add(P(new THREE.TorusGeometry(0.05 * hs, 0.005, 6, 20), wire, [hc[0] + sx * 0.056 * hs, B.eyes[0][1], B.eyes[0][2] + 0.03]));
  // giant clipboard of violations, a measuring stick sceptre
  const cb = new THREE.Group(); cb.add(P(new THREE.BoxGeometry(0.55, 0.75, 0.03), new THREE.MeshPhysicalMaterial({ color: '#7a5a3a', roughness: 0.6 }), [0, 0, 0]));
  const sheet = canvasTex(256, 352, (c, w, h) => { c.fillStyle = '#f4f0e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#b01010'; c.font = 'bold 30px sans-serif'; c.fillText('VIOLATIONS', 34, 40); c.fillStyle = '#222'; c.font = '18px sans-serif'; ['Running', 'Bleeding on lawn', 'Breathing loudly', 'Existing', 'Unapproved hat', 'Survived'].forEach((t, i) => { c.fillText('☐ ' + t, 20, 90 + i * 40); }); });
  cb.add(P(new THREE.PlaneGeometry(0.5, 0.68), new THREE.MeshPhysicalMaterial({ map: sheet, roughness: 0.8 }), [0, -0.02, 0.017])); cb.position.set(...B.handL); cb.position.y += 0.2; cb.rotation.x = -0.3; g.add(cb);
  const rulerT = canvasTex(512, 32, (c) => { c.fillStyle = '#e8c020'; c.fillRect(0, 0, 512, 32); c.fillStyle = '#111'; for (let x = 0; x < 512; x += 16) c.fillRect(x, 0, 2, x % 64 ? 10 : 20); });
  g.add(P(new THREE.BoxGeometry(0.05, 1.6, 0.02), new THREE.MeshPhysicalMaterial({ map: rulerT, roughness: 0.4 }), [B.handR[0], B.handR[1] + 0.6, B.handR[2]], [0, 0, 0.1]));
  // perfect lawn + white picket fence
  g.add(P(new THREE.CircleGeometry(2.4, 40), new THREE.MeshStandardMaterial({ color: '#3a8a2a', roughness: 0.9 }), [0, 0.01, 0], [-Math.PI / 2, 0, 0]));
  const white = new THREE.MeshPhysicalMaterial({ color: '#f4f4f0', roughness: 0.5 });
  for (let i = 0; i < 40; i++) { const a = Math.PI * 0.15 + (i / 40) * Math.PI * 1.3 + Math.PI * 0.6; g.add(P(new THREE.BoxGeometry(0.08, 0.7, 0.03), white, [Math.cos(a) * 2.4, 0.35, Math.sin(a) * 2.4], [0, -a + Math.PI / 2, 0])); }
  for (const y of [0.25, 0.5]) g.add(P(new THREE.TorusGeometry(2.4, 0.02, 4, 60, Math.PI * 1.3), white, [0, y, 0], [Math.PI / 2, 0, Math.PI * 0.6 + 0.47]));
  return shadowAll(g);
}

// ============ OFFICER BRICK (Borough boss, Floor 4) ============
export function officerBrick() {
  const g = new THREE.Group(); const o = T2.mallCopOgre({ variant: 0 }); o.position.y = 0.32; g.add(o);
  const blk = new THREE.MeshPhysicalMaterial({ color: '#1a1a1e', roughness: 0.4, clearcoat: 0.6 });
  g.add(P(new THREE.BoxGeometry(0.9, 0.12, 0.6), blk, [0, 0.28, 0.1]));
  for (const sx of [-1, 1]) { g.add(P(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 28), new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.7 }), [sx * 0.55, 0.28, 0.1], [0, 0, Math.PI / 2])); g.add(P(new THREE.CylinderGeometry(0.16, 0.16, 0.19, 20), new THREE.MeshStandardMaterial({ color: '#c8c8d0', metalness: 1, roughness: 0.3 }), [sx * 0.55, 0.28, 0.1], [0, 0, Math.PI / 2])); }
  g.add(P(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 10), blk, [0, 0.95, 0.42], [-0.2, 0, 0]));
  g.add(P(new THREE.BoxGeometry(0.55, 0.06, 0.06), blk, [0, 1.6, 0.55]));
  for (const [x, c] of [[-0.12, '#ff2a2a'], [0.12, '#2a6aff']]) { g.add(P(new THREE.BoxGeometry(0.16, 0.06, 0.08), glow(c, 3), [x, 1.67, 0.55])); addLight(g, c, 5, 5, [x, 1.9, 0.8]); }
  const tag = plate('OFFICER BRICK', '#1a2a4a', '#f0d040', 0.55, 0.12, 70); tag.position.set(0, 0.28, 0.41); g.add(tag);
  g.scale.setScalar(1.3);
  return shadowAll(g);
}

// ============ FOOD COURT KRAKEN (Borough boss, Floor 5) ============
export function foodCourtKraken() {
  const g = new THREE.Group();
  const tentacles = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2, pts = []; for (let k = 0; k <= 7; k++) { const t = k / 7, r = 0.6 + t * 2.4; pts.push([Math.cos(a + t * 0.9 * (i % 2 ? 1 : -1)) * r, 0.5 + Math.sin(t * Math.PI) * (i % 3 === 0 ? 2.4 : 0.9) - t * 0.4, Math.sin(a + t * 0.9 * (i % 2 ? 1 : -1)) * r]); } tentacles.push(pts); }
  const sdf = (x, y, z) => {
    let d = ell(x, y, z, 0, 2.0, -0.2, 1.1, 1.5, 1.2); // mantle
    d = smin(d, ell(x, y, z, 0, 1.0, 0.2, 1.0, 0.7, 0.9), 0.4);
    for (const t of tentacles) d = smin(d, chain(x, y, z, t, [0.32, 0.28, 0.24, 0.19, 0.14, 0.1, 0.07, 0.04], 0.15), 0.25);
    for (const sx of [-1, 1]) d = smax(d, -sph(x, y, z, sx * 0.45, 1.5, 0.95, 0.2), 0.05); // eye sockets
    if (Math.abs(d) < 0.08) d += fbm(x * 3, y * 3, z * 3) * 0.04 + (Math.abs(vnoise(x * 18, y * 18, z * 18)) - 0.3) * 0.008;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#c86a3a')).lerp(C('#6a2a1a'), clamp01(fbm(x * 2, y * 2, z * 2) + 0.4 + ny * 0.2)); if (ny < -0.4) c.lerp(C('#f0c8a0'), 0.6); if (vnoise(x * 9, y * 9, z * 9) > 0.5) c.lerp(C('#e8b030'), 0.5); c.multiplyScalar(ao); }; // fried-batter skin
  g.add(new THREE.Mesh(buildMesh(sdf, [-3.4, -0.3, -3.4], [3.4, 3.8, 3.4], 0.04, col), skinMaterial({ roughness: 0.35, clearcoat: 0.9, clearcoatRoughness: 0.15, sheen: 0.4, sheenColor: '#ffd090', pore: 0.8, poreScale: 0.25 })));
  const et = eyeTexture({ sclera: '#f0e070', iris: ['#ff2a00', '#c81a00', '#600800', '#100000'], pupil: 'goat', irisR: 110 });
  for (const sx of [-1, 1]) { const e = eyeMesh(et, 0.2, 0.3, '#ff6a00'); e.position.set(sx * 0.45, 1.5, 0.92); g.add(e); }
  // food-court trays, soda cups and a mall fountain around it
  const tray = new THREE.MeshPhysicalMaterial({ color: '#c82a2a', roughness: 0.3, clearcoat: 0.8 });
  tentacles.forEach((t, i) => { const p = t[5]; const tr = P(new THREE.BoxGeometry(0.55, 0.03, 0.4), tray, [p[0], p[1] + 0.12, p[2]], [0, i, 0.1]); g.add(tr); g.add(P(new THREE.CylinderGeometry(0.06, 0.05, 0.2, 12), new THREE.MeshPhysicalMaterial({ color: ['#2a6ac8', '#f0f0f0', '#e8c020'][i % 3], roughness: 0.4 }), [p[0] + 0.12, p[1] + 0.24, p[2]])); g.add(P(new THREE.BoxGeometry(0.16, 0.1, 0.12), new THREE.MeshPhysicalMaterial({ color: '#e8b040', roughness: 0.6 }), [p[0] - 0.1, p[1] + 0.19, p[2]])); });
  const stone = new THREE.MeshStandardMaterial({ map: grimeTex('#c8c0b0', { rust: 20 }), roughness: 0.6 });
  g.add(P(new THREE.CylinderGeometry(3.6, 3.7, 0.5, 48, 1, true), stone, [0, 0.25, 0]).translateY(0)); g.children[g.children.length - 1].material.side = THREE.DoubleSide;
  g.add(P(new THREE.CircleGeometry(3.55, 48), new THREE.MeshPhysicalMaterial({ color: '#2a5a6a', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.8 }), [0, 0.3, 0], [-Math.PI / 2, 0, 0]));
  const sign = plate('FOOD COURT', '#c81a1a', '#ffe070', 3, 0.6, 90); sign.position.set(0, 4.6, -1.8); g.add(sign);
  addLight(g, '#ffd080', 8, 9, [0, 4, 2]);
  return shadowAll(g);
}

// ============ THE SPRINKLER LORD (Borough boss, Floor 5) ============
export function sprinklerLord() {
  const g = new THREE.Group();
  const hose = new THREE.MeshPhysicalMaterial({ color: '#2a8a3a', roughness: 0.3, clearcoat: 0.8 });
  // a towering figure wound from garden hose: coils form legs, torso, arms
  const coil = (cx, cz, y0, y1, r0, r1, turns, rad) => { const pts = []; const n = Math.floor(turns * 24); for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t; pts.push(new THREE.Vector3(cx + Math.cos(a) * r, y0 + (y1 - y0) * t, cz + Math.sin(a) * r)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, rad, 10), hose)); };
  for (const sx of [-1, 1]) coil(sx * 0.35, 0, 0.0, 1.6, 0.22, 0.26, 10, 0.06);
  coil(0, 0, 1.6, 3.0, 0.55, 0.7, 12, 0.075);
  for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(sx * (0.7 + t * 1.1) + Math.cos(t * 30) * 0.12, 2.8 - t * 0.6 + Math.sin(t * 30) * 0.12, Math.sin(t * 30) * 0.12 + t * 0.4)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.07, 10), hose)); }
  // brass rotary-sprinkler head with a single glaring nozzle eye
  const brass = new THREE.MeshStandardMaterial({ color: '#c89a3a', metalness: 1, roughness: 0.25 });
  g.add(P(new THREE.CylinderGeometry(0.35, 0.5, 0.4, 24), brass, [0, 3.2, 0]));
  g.add(P(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 12), brass, [0, 3.55, 0], [0, 0, Math.PI / 2]));
  for (const sx of [-1, 1]) g.add(P(new THREE.ConeGeometry(0.08, 0.2, 12), brass, [sx * 0.85, 3.55, 0], [0, 0, -sx * Math.PI / 2]));
  const eye = eyeMesh(eyeTexture({ sclera: '#c8f0ff', iris: ['#3ac8ff', '#1a8ac8', '#0a3a5a', '#000'], pupil: 'round', irisR: 120 }), 0.16, 0.5, '#3ac8ff'); eye.position.set(0, 3.25, 0.42); g.add(eye);
  // water spray arcs
  const water = new THREE.MeshPhysicalMaterial({ color: '#c8ecff', transmission: 0.6, roughness: 0.05, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push(new THREE.Vector3(Math.cos(a) * (0.9 + t * 3.2), 3.55 + t * 1.4 - t * t * 4.8, Math.sin(a) * (0.9 + t * 3.2))); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.02, 6), water)); }
  for (let i = 0; i < 160; i++) { const a = rnd() * Math.PI * 2, r = 1 + rnd() * 3.5; g.add(P(new THREE.SphereGeometry(0.02 + rnd() * 0.02, 6, 4), water, [Math.cos(a) * r, 0.2 + rnd() * 3.5, Math.sin(a) * r])); }
  g.add(P(new THREE.CircleGeometry(4.5, 48), new THREE.MeshStandardMaterial({ color: '#3a8a2a', roughness: 0.85 }), [0, 0.01, 0], [-Math.PI / 2, 0, 0]));
  return shadowAll(g);
}

// ============ THE ICE CREAM TRUCK (Borough boss, Floor 6) ============
export function iceCreamTruck() {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ map: canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#f4e8f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff8ac8'; c.fillRect(0, h * 0.7, w, h * 0.12); c.fillStyle = '#8ad8ff'; c.fillRect(0, h * 0.82, w, h * 0.06); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(80,50,30,${rnd() * 0.25})`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 2 + rnd() * 8, 0, 7); c.fill(); } }), roughness: 0.35, clearcoat: 0.8 });
  g.add(P(new THREE.BoxGeometry(2.4, 2.4, 5.6), paint, [0, 1.6, -0.6]));
  g.add(P(new THREE.BoxGeometry(2.3, 1.4, 1.6), paint, [0, 1.1, 2.6]));
  // headlight eyes glaring, a grille of fangs, a serving-window mouth with a tongue lolling out
  const et = eyeTexture({ sclera: '#fff8c0', iris: ['#ff2a8a', '#c81a6a', '#600a30', '#000'], pupil: 'slit', irisR: 100 });
  for (const sx of [-1, 1]) { const e = eyeMesh(et, 0.22, 0.6, '#ffe0a0'); e.position.set(sx * 0.75, 1.25, 3.42); g.add(e); addLight(g, '#ffe8c0', 6, 8, [sx * 0.75, 1.3, 3.8]); }
  const tm = toothMat(); tm.color = C('#f0f0f0');
  for (let i = 0; i < 9; i++) { const t = P(new THREE.ConeGeometry(0.06, 0.32, 6), tm, [-0.8 + i * 0.2, 0.75, 3.43], [Math.PI, 0, 0]); g.add(t); }
  g.add(P(new THREE.BoxGeometry(1.8, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: '#c8c8d0', metalness: 1, roughness: 0.2 }), [0, 0.5, 3.42]));
  g.add(P(new THREE.BoxGeometry(0.1, 1.1, 2.6), new THREE.MeshBasicMaterial({ color: '#1a0408' }), [1.21, 2.0, -0.5]));
  const tongue = new THREE.Mesh(buildMesh((x, y, z) => chain(x, y, z, [[1.15, 1.75, -0.5], [1.6, 1.45, -0.4], [1.75, 0.8, -0.2], [1.6, 0.25, 0.1]], [0.35, 0.32, 0.26, 0.2], 0.2) + vnoise(x * 10, y * 10, z * 10) * 0.01, [0.6, -0.1, -1.2], [2.3, 2.3, 0.7], 0.025, (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#ff6a9a')).lerp(C('#8a1a3a'), clamp01(vnoise(x * 10, y * 10, z * 10) + 0.3)); c.multiplyScalar(ao); }), skinMaterial({ roughness: 0.2, clearcoat: 1, sheen: 0.4, sheenColor: '#ffaaaa', pore: 0.5 }));
  g.add(tongue);
  // giant ice-cream cone horns and a menu sign
  const cone = new THREE.MeshPhysicalMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#d89a4a'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#8a5a2a'; c.lineWidth = 4; for (let i = -128; i < 256; i += 18) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); } }), roughness: 0.7 });
  for (const [x, sc] of [[-0.7, '#ff8ac8'], [0.7, '#8ad8ff']]) { g.add(P(new THREE.ConeGeometry(0.3, 1.0, 20), cone, [x, 3.3, 1.2], [Math.PI, 0, x * -0.3])); g.add(P(new THREE.SphereGeometry(0.34, 20, 16), new THREE.MeshPhysicalMaterial({ color: sc, roughness: 0.6, sheen: 0.5 }), [x * 0.85, 3.95, 1.2])); }
  const menu = plate('SOFT SERVE ★ 1 SOUL', '#ff8ac8', '#1a1a3a', 2.4, 0.45, 56); menu.position.set(-1.22, 2.5, -0.6); menu.rotation.y = -Math.PI / 2; g.add(menu);
  for (const [x, z] of [[-1.15, 1.9], [1.15, 1.9], [-1.15, -2.4], [1.15, -2.4]]) g.add(P(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24), new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: 0.7 }), [x, 0.42, z], [0, 0, Math.PI / 2]));
  // the speaker horn that plays the jingle
  g.add(P(new THREE.ConeGeometry(0.2, 0.4, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#c8c8d0', metalness: 1, roughness: 0.3, side: THREE.DoubleSide }), [0, 3.0, -2.4], [Math.PI / 2, 0, 0]));
  g.scale.setScalar(1.15);
  return shadowAll(g);
}

// ============ DOG PARK MATRIARCH (Borough boss, Floor 6) ============
export function dogParkMatriarch() {
  const g = new THREE.Group(); const m = T2.culDeSacHound({ variant: 3 }); m.scale.setScalar(2.9); g.add(m);
  for (let i = 0; i < 4; i++) { const p = T2.culDeSacHound({ variant: i }); p.scale.setScalar(0.65); const a = -0.8 + i * 0.55; p.position.set(Math.cos(a) * 2.2 + 0.4, 0, Math.sin(a) * 1.6 + 1.6); p.rotation.y = -a + 0.5; g.add(p); }
  // dog-house throne, bone mountain
  const wood = new THREE.MeshPhysicalMaterial({ map: grimeTex('#8a3a2a', { rust: 30 }), roughness: 0.7 });
  g.add(P(new THREE.BoxGeometry(2.6, 2.0, 2.4), wood, [-0.2, 1.0, -2.4]));
  g.add(P(new THREE.ConeGeometry(2.0, 1.2, 4), new THREE.MeshPhysicalMaterial({ color: '#4a2a1a', roughness: 0.8 }), [-0.2, 2.6, -2.4], [0, Math.PI / 4, 0]));
  g.add(P(new THREE.CircleGeometry(0.75, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#0a0606' }), [-0.2, 0.01, -1.19]));
  const name = plate('MAMA', '#e8d8a8', '#5a1a10', 1.0, 0.3, 120); name.position.set(-0.2, 2.25, -1.18); g.add(name);
  const bone = new THREE.MeshPhysicalMaterial({ color: '#e0d4b8', roughness: 0.5 });
  for (let i = 0; i < 90; i++) { const a = rnd() * Math.PI * 2, r = rnd() * 1.4; g.add(P(new THREE.CapsuleGeometry(0.04, 0.35, 4, 8), bone, [2.4 + Math.cos(a) * r, 0.05 + (1.4 - r) * 0.55 * rnd(), -1.6 + Math.sin(a) * r], [rnd() * 3, rnd() * 3, rnd() * 3])); }
  return shadowAll(g);
}

// ============ THE MALL MOTHER (City boss, Floor 4) ============
export function mallMother() {
  const g = new THREE.Group();
  // a colossal beating heart fused into the mall's atrium, with arteries running into the ceiling
  const arteries = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([Math.cos(a) * (1.2 + t * 3.5), 4.5 + t * 4 + Math.sin(t * 4 + i) * 0.4, Math.sin(a) * (1.2 + t * 3.0)]); } arteries.push(pts); }
  const sdf = (x, y, z) => {
    let d = ell(x, y, z, 0, 3.6, 0, 2.4, 3.0, 2.1); // ventricles
    d = smin(d, ell(x, y, z, -1.0, 5.2, 0.1, 1.4, 1.3, 1.3), 0.6); d = smin(d, ell(x, y, z, 1.1, 5.0, -0.1, 1.3, 1.2, 1.2), 0.6); // atria
    d = smin(d, rcone(x, y, z, 0.2, 5.5, 0, 0.6, 9.0, 0.2, 0.7, 0.5), 0.4); // aorta to the ceiling
    for (const a of arteries) d = smin(d, chain(x, y, z, a, [0.45, 0.38, 0.32, 0.27, 0.22, 0.18, 0.15], 0.3), 0.3);
    for (let i = 0; i < 14; i++) { const a = i * 1.7, h = 1.5 + (i % 5) * 0.9; d = smin(d, rcone(x, y, z, Math.cos(a) * 2.2, h, Math.sin(a) * 1.9, Math.cos(a) * 2.5, h - 1.5, Math.sin(a) * 2.2, 0.12, 0.05), 0.2); } // veins
    d = smin(d, ell(x, y, z, 0, 0.3, 0, 3.6, 0.6, 3.2), 0.8); // root mass spreading over the floor
    if (Math.abs(d) < 0.12) d += fbm(x * 1.5, y * 1.5, z * 1.5) * 0.08 + (Math.abs(vnoise(x * 8, y * 8, z * 8)) - 0.3) * 0.02;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#a81a2a')).lerp(C('#3a0610'), clamp01(fbm(x, y, z) + 0.4 - ny * 0.2)); const v = Math.abs(vnoise(x * 3, y * 3, z * 3)); if (v < 0.06) c.lerp(C('#2a3a8a'), 0.8); if (y < 0.7) c.lerp(C('#4a2a2a'), 0.5); c.multiplyScalar(ao); };
  const heartM = skinMaterial({ roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.5, sheenColor: '#ff6a7a', pore: 0.8, poreScale: 0.2 }); heartM.emissive = C('#3a0008'); heartM.emissiveIntensity = 0.5;
  g.add(new THREE.Mesh(buildMesh(sdf, [-5.5, -0.3, -5.0], [5.5, 9.5, 5.0], 0.06, col), heartM));
  // the mall grown into it: escalators, neon shop signs, a food-court table, a coin fountain
  const metal = new THREE.MeshStandardMaterial({ color: '#b8bcc4', metalness: 1, roughness: 0.3 });
  for (const sx of [-1, 1]) { const esc = P(new THREE.BoxGeometry(1.2, 0.2, 7), metal, [sx * 4.3, 2.5, 1.5], [-0.55, sx * 0.3, 0]); g.add(esc); for (let k = 0; k < 20; k++) g.add(P(new THREE.BoxGeometry(1.1, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.6 }), [sx * 4.3 + sx * Math.sin(0.3) * (k * 0.33 - 3.2) * 0.3, 2.5 + Math.sin(0.55) * (k * 0.33 - 3.2) * -1 + 0.15, 1.5 + (k * 0.33 - 3.2) * Math.cos(0.55)], [-0.55, sx * 0.3, 0])); }
  const neon = [['SALE', '#ff3a8a'], ['50% OFF', '#3affea'], ['OPEN 24/7/365', '#ffd03a'], ['FOREVER 1', '#9a6aff']];
  neon.forEach(([t, c], i) => { const a = -1.2 + i * 0.8; const n = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), new THREE.MeshBasicMaterial({ map: textTex(t, '#0a0610', c, 512, 140, 80), color: new THREE.Color(1.8, 1.8, 1.8) })); n.position.set(Math.sin(a) * 2.7, 2.6 + (i % 2) * 2.4, Math.cos(a) * 2.4); n.lookAt(n.position.clone().multiplyScalar(2)); g.add(n); addLight(g, c, 3, 5, [Math.sin(a) * 3.6, 2.6 + (i % 2) * 2.4, Math.cos(a) * 3.3]); });
  const heartGlow = addLight(g, '#ff2a3a', 12, 14, [0, 3.6, 3.5]);
  return shadowAll(g);
}

// ============ MAYOR ETERNAL (City boss, Floor 5) ============
export function mayorEternal() {
  const g = new THREE.Group();
  const B = humanoid({ height: 3.6, bulk: 0.85, belly: 0.4, shoulders: 1.1, head: 1.0, hunch: 0.3, armL: 'raised', armR: 'forward', nose: 'none', ears: 'none', jaw: 'normal', legBulk: 0.8, skinNoise: 0.4 });
  const s = B.scale, hc = B.headCenter, hs = B.headScale;
  const skull = (x, y, z) => { const lx = (x - hc[0]) / hs, ly = (y - hc[1]) / hs, lz = (z - hc[2]) / hs, ax = Math.abs(lx); let d = ell(lx, ly, lz, 0, 0.02, -0.02, 0.13, 0.14, 0.15); d = smin(d, ell(lx, ly, lz, 0, -0.08, 0.05, 0.09, 0.07, 0.08), 0.04); d = smax(d, -sph(ax, ly, lz, 0.048, 0.0, 0.12, 0.038), 0.01); d = smax(d, -ell(lx, ly, lz, 0, -0.065, 0.14, 0.015, 0.028, 0.03), 0.006); d = smax(d, -sph(ax, ly, lz, 0.1, -0.06, 0.06, 0.04), 0.03); return d * hs; };
  const suit = (x, y, z) => { const ux = x / s, uy = y / s; let d = B.sdf(x, y, z) / s - 0.015; d = Math.max(d, 0.1 - uy); d = Math.max(d, uy - 1.42); return d * s; };
  const sdf = (x, y, z) => Math.min(suit(x, y, z), skull(x, y, z), B.sdf(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const ds = suit(x, y, z), dk = skull(x, y, z);
    if (dk < ds - 0.002) c.copy(C('#e0d4b0')).lerp(C('#7a6a4a'), clamp01(fbm(x * 15, y * 15, z * 15) * 0.8 + 0.3));
    else if (ds <= dk) { c.copy(C('#1a1a24')); if (Math.abs(Math.sin(x * 70)) < 0.06) c.lerp(C('#4a4a5a'), 0.5); const u = y / s; if (z > 0.1 * s && Math.abs(x / s) < 0.05 && u > 1.0 && u < 1.42) c.copy(C('#f0f0e8')); }
    else c.copy(C('#c8b8a0')).lerp(C('#5a4a3a'), 0.5);
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.014, col), skinMaterial({ roughness: 0.55, clearcoat: 0.2, sheen: 0.6, sheenColor: '#6a6a7a', pore: 0.5 })));
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR * 0.6, 10, 8), glow('#7aff9a', 4)); e.position.set(p[0] * 0.85, p[1] + 0.01, p[2] - 0.02); g.add(e); }
  // top hat, sash, gold chain of office, a podium with a microphone, campaign posters
  const blk = new THREE.MeshPhysicalMaterial({ color: '#141418', roughness: 0.4, clearcoat: 0.6 });
  g.add(P(new THREE.CylinderGeometry(0.17 * hs, 0.17 * hs, 0.42 * hs, 24), blk, [hc[0], hc[1] + 0.32 * hs, hc[2] - 0.02]));
  g.add(P(new THREE.CylinderGeometry(0.28 * hs, 0.28 * hs, 0.02, 24), blk, [hc[0], hc[1] + 0.12 * hs, hc[2] - 0.02]));
  const sash = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3 * s, 1.38 * s, 0.02), new THREE.Vector3(-0.05 * s, 1.18 * s, 0.2 * s), new THREE.Vector3(0.18 * s, 0.95 * s, 0.18 * s), new THREE.Vector3(0.28 * s, 0.86 * s, 0)]), 30, 0.035, 4), new THREE.MeshPhysicalMaterial({ color: '#c81a2a', roughness: 0.5, sheen: 0.6 })); sash.scale.z = 1; g.add(sash);
  const gold = new THREE.MeshStandardMaterial({ color: '#d8b040', metalness: 1, roughness: 0.2 });
  for (let i = 0; i < 26; i++) { const a = -1.3 + i * 0.104; g.add(P(new THREE.TorusGeometry(0.03, 0.01, 6, 12), gold, [Math.sin(a) * 0.24 * s, 1.37 * s - Math.cos(a) * 0.12 * s + 0.08, (0.15 + Math.cos(a) * 0.08) * s], [0, a, 0])); }
  g.add(P(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), gold, [0, 1.17 * s, 0.25 * s], [Math.PI / 2 - 0.3, 0, 0]));
  const pod = new THREE.Group(); pod.add(P(new THREE.BoxGeometry(1.1, 1.3, 0.6), new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a3a1a', { rust: 10 }), roughness: 0.5, clearcoat: 0.5 }), [0, 0.65, 0]));
  const seal = plate('RE-ELECT', '#1a2a6a', '#f0d040', 0.9, 0.3, 90); seal.position.set(0, 0.8, 0.31); pod.add(seal);
  pod.add(P(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8), blk, [0.2, 1.5, 0.1], [0.4, 0, 0])); pod.add(P(new THREE.SphereGeometry(0.04, 12, 8), blk, [0.2, 1.7, 0.2]));
  pod.position.set(0.1, 0, 1.4); g.add(pod);
  for (let i = 0; i < 4; i++) { const p = plate(['VOTE ETERNAL', 'FOREVER MAYOR', 'NO TERM LIMITS', 'DEATH IS NO EXCUSE'][i], '#f0ece0', '#b01010', 1.3, 0.8, 52); p.position.set(-2.8 + i * 1.9, 2.2 + (i % 2) * 0.4, -2.0); p.rotation.z = (rnd() - 0.5) * 0.15; g.add(p); }
  addLight(g, '#7aff9a', 3, 4, [0, 3.6, 1]);
  return shadowAll(g);
}

// ============ THE CUL-DE-SAC (City boss, Floor 6) ============
export function culDeSac() {
  const g = new THREE.Group();
  // a whole street that has come alive: five houses with window eyes and door mouths, joined by the asphalt circle
  const road = P(new THREE.CircleGeometry(9, 60), new THREE.MeshStandardMaterial({ map: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#2a2a2e'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? 0 : 120},${rnd() < 0.5 ? 0 : 120},${rnd() < 0.5 ? 0 : 120},${rnd() * 0.15})`; c.fillRect(rnd() * w, rnd() * h, 2, 2); } c.strokeStyle = '#e8d060'; c.lineWidth = 6; c.setLineDash([24, 20]); c.beginPath(); c.arc(w / 2, h / 2, w * 0.3, 0, 7); c.stroke(); }), roughness: 0.9 }), [0, 0.01, 0], [-Math.PI / 2, 0, 0]); g.add(road);
  const houseCols = ['#e8d8c0', '#c8d8e8', '#e8c8c8', '#d8e8c8', '#e8e0b0'];
  const tm = toothMat(); tm.color = C('#f0ece0');
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 0.25 + (i / 4) * Math.PI * 1.5 + Math.PI, h = new THREE.Group();
    const wallM = new THREE.MeshPhysicalMaterial({ map: grimeTex(houseCols[i], { rust: 20, scratches: 800 }), roughness: 0.7 });
    h.add(P(new THREE.BoxGeometry(5, 4, 4), wallM, [0, 2, 0]));
    h.add(P(new THREE.ConeGeometry(4.0, 2.2, 4), new THREE.MeshPhysicalMaterial({ color: '#5a3a3a', roughness: 0.8 }), [0, 5.1, 0], [0, Math.PI / 4, 0], [1, 1, 0.8]));
    const et = eyeTexture({ sclera: '#fff6c0', iris: ['#ff2a00', '#c81a00', '#600800', '#100000'], pupil: 'slit', irisR: 120 });
    for (const sx of [-1, 1]) { h.add(P(new THREE.BoxGeometry(1.2, 1.1, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd080').multiplyScalar(1.6) }), [sx * 1.4, 2.9, 2.0])); const e = eyeMesh(et, 0.42, 0.6, '#ffaa40'); e.position.set(sx * 1.4, 2.9, 1.95); e.scale.set(1.3, 1, 0.3); h.add(e); h.add(P(new THREE.BoxGeometry(1.4, 0.25, 0.3), new THREE.MeshPhysicalMaterial({ color: '#5a3a3a' }), [sx * 1.4, 3.55, 2.05], [0, 0, sx * 0.25])); }
    h.add(P(new THREE.BoxGeometry(1.3, 1.6, 0.1), new THREE.MeshBasicMaterial({ color: '#1a0406' }), [0, 0.8, 2.01]));
    for (let k = 0; k < 6; k++) { h.add(P(new THREE.ConeGeometry(0.08, 0.35, 6), tm, [-0.5 + k * 0.2, 1.45, 2.06], [Math.PI, 0, 0])); h.add(P(new THREE.ConeGeometry(0.08, 0.3, 6), tm, [-0.5 + k * 0.2, 0.15, 2.06])); }
    const mb = new THREE.Group(); mb.add(P(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), new THREE.MeshStandardMaterial({ color: '#2a2a2a' }), [0, 0.55, 0])); mb.add(P(new THREE.BoxGeometry(0.3, 0.3, 0.55), new THREE.MeshPhysicalMaterial({ color: '#c81a1a', roughness: 0.4 }), [0, 1.2, 0])); mb.position.set(1.8, 0, 3.4); h.add(mb);
    h.add(P(new THREE.BoxGeometry(5, 0.05, 2.5), new THREE.MeshStandardMaterial({ color: '#3a8a2a' }), [0, 0.02, 3.2]));
    const lamp = addLight(h, '#ffb060', 5, 8, [0, 3, 3.5]);
    h.position.set(Math.sin(a) * 12, 0, Math.cos(a) * 12); h.rotation.y = a + Math.PI; g.add(h);
  }
  // street lamps bent like arms reaching toward the centre
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const pts = [new THREE.Vector3(Math.sin(a) * 8.5, 0, Math.cos(a) * 8.5), new THREE.Vector3(Math.sin(a) * 8.3, 4, Math.cos(a) * 8.3), new THREE.Vector3(Math.sin(a) * 6.8, 5.5, Math.cos(a) * 6.8)]; g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.09, 8), new THREE.MeshStandardMaterial({ color: '#3a3a3a', metalness: 0.8, roughness: 0.4 }))); g.add(P(new THREE.SphereGeometry(0.25, 12, 10), glow('#ffd080', 2.5), [Math.sin(a) * 6.6, 5.3, Math.cos(a) * 6.6])); }
  addLight(g, '#ffc080', 14, 22, [0, 7, 0]);
  return shadowAll(g);
}
