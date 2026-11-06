// Floor 7-9 bosses (The Undercity): six Neighbourhood, six Borough, three City.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid, quadruped } from '../anatomy.js';
import * as T3 from './tier3.js';

const C = (h) => new THREE.Color(h);
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
const P = (geo, mat, pos, rot = [0, 0, 0], sc) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); if (sc) m.scale.set(...sc); return m; };
const L = (g, c, i, d, pos) => { const l = new THREE.PointLight(c, i, d); l.position.set(...pos); g.add(l); return l; };
const txt = (t, bg, fg, w = 512, h = 128, size = 64) => canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = `bold ${size}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, h / 2 + 3); });
const plate = (t, bg, fg, w, h, size) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: txt(t, bg, fg, 512, Math.round(512 * h / w), size), roughness: 0.5, side: THREE.DoubleSide }));
const brass = () => new THREE.MeshStandardMaterial({ map: grimeTex('#b88a3a', { rust: 40 }), metalness: 1, roughness: 0.3 });
const steel = () => new THREE.MeshStandardMaterial({ map: grimeTex('#7a7c84', { rust: 60 }), metalness: 0.95, roughness: 0.35 });
const tint = (g, hex) => g.traverse((o) => { if (o.isMesh && o.material && o.material.vertexColors) { o.material = o.material.clone(); o.material.color = C(hex); } });
let ratCache = null;
function rat(scale = 1) {
  if (!ratCache) { const Q = quadruped({ height: 0.16, length: 1.25, bulk: 1.3, gaunt: 0.3, snout: 1.25, ears: 'round', tail: false, mouthOpen: 0.3, legs: 0.38 }); const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#5a4a42')).lerp(C('#1a1614'), clamp01(fbm(x * 40, y * 40, z * 40) + 0.3 - ny * 0.2)); if (z > Q.snoutTip[2] - 0.02) c.copy(C('#c88a8a')); c.multiplyScalar(ao); }; const [mn, mx] = Q.bbox; ratCache = { geo: buildMesh(Q.sdf, mn, mx, 0.0028, col), Q, mat: skinMaterial({ roughness: 0.7, sheen: 1, sheenColor: '#a89888', pore: 0.4, poreScale: 2 }) }; }
  const g = new THREE.Group(); g.add(new THREE.Mesh(ratCache.geo, ratCache.mat));
  for (const p of ratCache.Q.eyes) g.add(P(new THREE.SphereGeometry(ratCache.Q.eyeR * 0.8, 8, 6), glow('#ff2020', 2), p));
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.07, -0.18), new THREE.Vector3(0.05, 0.03, -0.32), new THREE.Vector3(-0.04, 0.01, -0.45)]), 12, 0.008, 5), new THREE.MeshPhysicalMaterial({ color: '#b08a80', roughness: 0.5 })); g.add(tail);
  g.scale.setScalar(scale); return g;
}

// ============ OLD LADY BATHWATER (Sewer Wyrm boss) ============
export function oldLadyBathwater() {
  const g = new THREE.Group(); const w = T3.sewerWyrm({ variant: 1 }); tint(w, '#f4e8e0'); w.scale.setScalar(1.7); g.add(w);
  const H = [0, 1.37 * 1.7 + 0.1, 0.4 * 1.7]; // approx head position after scale
  const cap = P(new THREE.SphereGeometry(0.42, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: canvasTex(256, 128, (c) => { c.fillStyle = '#f0a8c8'; c.fillRect(0, 0, 256, 128); for (let i = 0; i < 40; i++) { c.fillStyle = ['#ffffff', '#ffd040', '#a8f0c8'][i % 3]; c.beginPath(); c.arc(rnd() * 256, rnd() * 128, 6 + rnd() * 6, 0, 7); c.fill(); } }), roughness: 0.4, clearcoat: 0.6 }), [0, 2.75, 0.55], [-0.2, 0, 0], [1.1, 0.6, 1.3]); g.add(cap);
  const frill = P(new THREE.TorusGeometry(0.42, 0.06, 8, 32), new THREE.MeshPhysicalMaterial({ color: '#f8c8d8', roughness: 0.6 }), [0, 2.75, 0.55], [Math.PI / 2 - 0.2, 0, 0], [1.1, 1.3, 1]); g.add(frill);
  const duck = new THREE.MeshPhysicalMaterial({ color: '#ffd020', roughness: 0.3, clearcoat: 1 });
  for (let i = 0; i < 9; i++) { const d = new THREE.Group(); d.add(P(new THREE.SphereGeometry(0.12, 14, 10), duck, [0, 0, 0], [0, 0, 0], [1, 0.8, 1.3])); d.add(P(new THREE.SphereGeometry(0.075, 12, 8), duck, [0, 0.11, 0.08])); d.add(P(new THREE.ConeGeometry(0.03, 0.07, 8), new THREE.MeshPhysicalMaterial({ color: '#ff7a1a' }), [0, 0.1, 0.17], [Math.PI / 2, 0, 0])); const a = (i / 9) * Math.PI * 2; d.position.set(Math.cos(a) * 3.2, 0.25, Math.sin(a) * 2.4 - 0.8); d.rotation.y = -a; g.add(d); }
  const egg = new THREE.MeshPhysicalMaterial({ color: '#d8e0a0', transmission: 0.55, roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1 });
  for (let i = 0; i < 20; i++) { const a = rnd() * Math.PI * 2, r = 2 + rnd() * 2; g.add(P(new THREE.SphereGeometry(0.15 + rnd() * 0.1, 12, 10), egg, [Math.cos(a) * r, 0.2, Math.sin(a) * r - 1.0], [0, 0, 0], [1, 1.25, 1])); }
  return shadowAll(g);
}

// ============ REPOSSESSOR MK. IX (Clockwork Debt Collector boss) ============
export function repossessorMk9() {
  const g = new THREE.Group(); const c = T3.debtCollector({ variant: 0 }); g.add(c);
  const st = steel();
  // four extra hooked arms on gimbals
  for (const [sx, y] of [[-1, 1.55], [1, 1.55], [-1, 1.3], [1, 1.3]]) { const arm = new THREE.Group(); arm.add(P(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), st, [0, -0.35, 0])); const hook = P(new THREE.TorusGeometry(0.1, 0.025, 8, 16, Math.PI * 1.4), st, [0, -0.75, 0]); arm.add(hook); arm.position.set(sx * 0.25, y, -0.05); arm.rotation.set(-0.6, 0, sx * 1.1); g.add(arm); }
  // tow winch with a chain on its back, warning beacons
  g.add(P(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 16), st, [0, 1.75, -0.32], [0, 0, Math.PI / 2]));
  for (let i = 0; i < 26; i++) g.add(P(new THREE.TorusGeometry(0.03, 0.01, 6, 10), st, [Math.sin(i * 0.3) * 0.05, 1.7 - i * 0.06, -0.38 - i * 0.012], [0, i % 2 ? Math.PI / 2 : 0, 0]));
  for (const sx of [-1, 1]) { g.add(P(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), glow('#ffb020', 3), [sx * 0.18, 2.48, 0])); L(g, '#ffb020', 2, 3, [sx * 0.18, 2.6, 0.2]); }
  // pile of repossessed things
  const junk = [new THREE.MeshPhysicalMaterial({ color: '#2a2a2a', roughness: 0.4, clearcoat: 0.6 }), new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a3a2a'), roughness: 0.8 }), new THREE.MeshPhysicalMaterial({ color: '#c8c8c0', roughness: 0.5 })];
  g.add(P(new THREE.BoxGeometry(0.9, 0.6, 0.15), junk[0], [-1.2, 0.3, -0.6], [0, 0.4, 0.1])); g.add(P(new THREE.PlaneGeometry(0.8, 0.5), glow('#3a6aaa', 0.8), [-1.18, 0.32, -0.52], [0, 0.4, 0.1]));
  g.add(P(new THREE.BoxGeometry(1.8, 0.5, 0.8), junk[1], [1.2, 0.25, -0.8], [0, -0.3, 0])); g.add(P(new THREE.BoxGeometry(1.8, 0.6, 0.2), junk[1], [1.15, 0.6, -1.15], [0, -0.3, 0]));
  g.add(P(new THREE.BoxGeometry(0.6, 1.4, 0.6), junk[2], [-1.6, 0.7, -1.2], [0, 0.2, 0]));
  const tag = plate('REPOSSESSED', '#b01010', '#f0f0f0', 1.2, 0.25, 70); tag.position.set(1.2, 0.95, -0.7); tag.rotation.y = -0.3; g.add(tag);
  g.scale.setScalar(1.55);
  return shadowAll(g);
}

// ============ THE SOLOIST (Fungal Choir boss) ============
export function theSoloist() {
  const g = new THREE.Group(); const ch = T3.fungalChoir({ variant: 1 }); ch.scale.setScalar(0.7); ch.position.set(0, 0, -1.2); g.add(ch);
  // one enormous diva mushroom, mouth wide open, with a spore microphone
  const sdf = (x, y, z) => { let d = rcone(x - Math.sin(y * 0.8) * 0.15, y, z, 0, 0, 0, 0, 3.2, 0, 0.55, 0.42); d = smin(d, ell(x, y, z, 0.2, 3.4, 0, 1.8, 0.75, 1.7), 0.4); d = smax(d, -ell(x, y, z, 0.2, 2.9, 0, 1.65, 0.3, 1.55), 0.06); d = smax(d, -ell(x, y, z, 0.05, 1.9, 0.45, 0.2, 0.32, 0.25), 0.04); d = smax(d, -sph(Math.abs(x - 0.05), y, z, 0.18, 2.45, 0.42, 0.08), 0.02); d = smin(d, ell(x, y, z, 0, 0.1, 0, 1.0, 0.25, 1.0), 0.3); if (Math.abs(d) < 0.04) d += fbm(x * 5, y * 5, z * 5) * 0.015; return d; };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#e8d8b8')).lerp(C('#8a7a5a'), clamp01(fbm(x * 4, y * 4, z * 4) + 0.3)); if (y > 3.0 && ny > -0.2) { c.copy(C('#8a2a8a')).lerp(C('#3a0a3a'), clamp01(vnoise(x * 4, y * 4, z * 4) * 0.5 + 0.2)); if (vnoise(x * 8, y * 8, z * 8) > 0.45) c.copy(C('#f0d8f8')); } if (y < 3.0 && y > 2.7 && ny < -0.3) c.copy(C('#c8ffb0')); if (Math.hypot(x - 0.05, y - 1.9, z - 0.5) < 0.3) c.copy(C('#3a0a10')); c.multiplyScalar(ao); };
  g.add(new THREE.Mesh(buildMesh(sdf, [-2.2, -0.1, -2.0], [2.4, 4.3, 2.0], 0.03, col), skinMaterial({ roughness: 0.45, clearcoat: 0.6, sheen: 0.5, sheenColor: '#ffd8ff', pore: 0.6, poreScale: 0.3 })));
  for (const sx of [-1, 1]) g.add(P(new THREE.SphereGeometry(0.05, 10, 8), glow('#c8ff9a', 4), [0.05 + sx * 0.18, 2.45, 0.45]));
  const stand = new THREE.Group(); stand.add(P(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8), steel(), [0, 0.9, 0])); stand.add(P(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 16), steel(), [0, 0.02, 0])); stand.add(P(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshPhysicalMaterial({ color: '#2a2a2a', roughness: 0.6 }), [0, 1.85, 0.1]));
  stand.position.set(0.1, 0, 1.2); g.add(stand);
  const spot = new THREE.SpotLight('#ff9af0', 40, 12, 0.4, 0.4, 1.2); spot.position.set(0, 8, 3); spot.target.position.set(0, 2, 0); g.add(spot, spot.target);
  const notes = glow('#c8ff9a', 3); for (let i = 0; i < 8; i++) { const n = new THREE.Group(); n.add(P(new THREE.SphereGeometry(0.06, 8, 6), notes, [0, 0, 0], [0, 0, 0], [1.3, 1, 0.5])); n.add(P(new THREE.BoxGeometry(0.015, 0.22, 0.015), notes, [0.07, 0.11, 0])); n.position.set(0.5 + i * 0.28, 2.2 + Math.sin(i) * 0.4 + i * 0.12, 0.8 + i * 0.1); n.rotation.z = Math.sin(i) * 0.3; g.add(n); }
  return shadowAll(g);
}

// ============ CHIEF GRUBTOOTH (Mole-Kin boss) ============
export function chiefGrubtooth() {
  const g = new THREE.Group(); const m = T3.moleKin({ variant: 1 }); m.scale.setScalar(1.45); g.add(m);
  const br = brass(), st = steel();
  // headdress of drill bits, a gem necklace, a huge drill gauntlet
  for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3; const bit = P(new THREE.ConeGeometry(0.05, 0.38, 6), i % 2 ? br : st, [Math.sin(a) * 0.22, 1.98 + Math.cos(a) * 0.16, -0.1 + Math.cos(a) * 0.05], [-0.2, 0, -a * 0.8]); g.add(bit); }
  const gems = ['#e83a5a', '#3ac8ff', '#5ad86a', '#ffd020', '#b46cff'];
  for (let i = 0; i < 11; i++) { const a = -1.1 + i * 0.22; g.add(P(new THREE.OctahedronGeometry(0.04, 0), new THREE.MeshPhysicalMaterial({ color: gems[i % 5], roughness: 0.05, clearcoat: 1, emissive: C(gems[i % 5]), emissiveIntensity: 0.3 }), [Math.sin(a) * 0.32, 1.62 - Math.cos(a) * 0.08, 0.3 + Math.cos(a) * 0.12])); }
  const drill = new THREE.Group(); const cone = P(new THREE.ConeGeometry(0.22, 0.9, 6), st, [0, 0.45, 0]); drill.add(cone); for (let i = 0; i < 6; i++) drill.add(P(new THREE.TorusGeometry(0.19 - i * 0.03, 0.02, 6, 16), br, [0, 0.1 + i * 0.13, 0], [Math.PI / 2, 0, 0]));
  drill.add(P(new THREE.CylinderGeometry(0.18, 0.2, 0.3, 16), br, [0, -0.1, 0])); drill.position.set(0.5, 1.2, 0.85); drill.rotation.x = Math.PI / 2 - 0.3; g.add(drill);
  // throne of ore crates and a trade stall: fight him or bargain
  const crate = new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a4a2a', { rust: 10 }), roughness: 0.7 });
  for (const [x, y, z, s] of [[-1.3, 0.35, -0.8, 0.7], [-1.3, 1.05, -0.8, 0.7], [1.4, 0.3, -0.9, 0.6], [-1.9, 0.3, 0.1, 0.6]]) g.add(P(new THREE.BoxGeometry(s, s, s), crate, [x, y, z], [0, rnd(), 0]));
  const ore = new THREE.MeshPhysicalMaterial({ color: '#c8a040', metalness: 0.8, roughness: 0.3 });
  for (let i = 0; i < 14; i++) g.add(P(new THREE.DodecahedronGeometry(0.08 + rnd() * 0.06, 0), ore, [1.4 + (rnd() - 0.5) * 0.5, 0.65, -0.9 + (rnd() - 0.5) * 0.4]));
  const sign = plate('TRADE OR FIGHT', '#3a2a1a', '#f0d040', 1.4, 0.3, 64); sign.position.set(-1.3, 1.65, -0.42); g.add(sign);
  L(g, '#ffd080', 4, 5, [0.6, 2.4, 1.2]);
  return shadowAll(g);
}

// ============ THE DEEP FRYER (Grease Golem boss) ============
export function deepFryer() {
  const g = new THREE.Group(); const gg = T3.greaseGolem({ variant: 0 }); gg.scale.setScalar(1.25); gg.position.y = 0.9; g.add(gg);
  const st = steel();
  // its lower half is an industrial fryer vat on burners
  g.add(P(new THREE.BoxGeometry(2.6, 1.0, 2.0), st, [0, 0.5, 0.2]));
  g.add(P(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshPhysicalMaterial({ color: '#8a5a10', roughness: 0.05, clearcoat: 1, emissive: C('#5a2a00'), emissiveIntensity: 0.8 }), [0, 1.01, 0.2], [-Math.PI / 2, 0, 0]));
  for (let i = 0; i < 10; i++) g.add(P(new THREE.ConeGeometry(0.12, 0.45, 8), glow(i % 2 ? '#ff6a1a' : '#3a8aff', 2.5), [-1.0 + i * 0.22, 0.08, 1.25]));
  for (const sx of [-1, 1]) { const bk = P(new THREE.BoxGeometry(0.7, 0.45, 0.5, 4, 3, 3), new THREE.MeshStandardMaterial({ color: '#9a9a9a', metalness: 1, roughness: 0.35, wireframe: true }), [sx * 0.9, 3.3, 0.2], [0, 0, sx * 0.5]); g.add(bk); }
  const dial = plate('400°', '#1a1a1a', '#ff3a1a', 0.5, 0.2, 90); dial.position.set(0.9, 0.7, 1.21); g.add(dial);
  L(g, '#ff8a2a', 10, 7, [0, 1.6, 1.8]);
  return shadowAll(g);
}

// ============ THE RAT THRONE (Ratking Choir boss) ============
export function ratThrone() {
  const g = new THREE.Group();
  // a throne built entirely from living rats: seat, back, armrests
  const spots = [];
  for (let i = 0; i < 26; i++) spots.push([(rnd() - 0.5) * 1.4, 0.15 + (i % 3) * 0.22, (rnd() - 0.5) * 1.0, rnd() * 6]); // seat mass
  for (let i = 0; i < 40; i++) spots.push([(rnd() - 0.5) * 1.5, 0.7 + rnd() * 2.0, -0.55 + rnd() * 0.15, rnd() * 6]); // back
  for (const sx of [-1, 1]) for (let i = 0; i < 10; i++) spots.push([sx * (0.72 + rnd() * 0.12), 0.7 + rnd() * 0.25, (rnd() - 0.5) * 1.0, rnd() * 6]); // arms
  for (const [x, y, z, r] of spots) { const rt = rat(2.4); rt.position.set(x, y, z); rt.rotation.set((rnd() - 0.5) * 1.5, r, (rnd() - 0.5) * 1.5); g.add(rt); }
  // the king himself, crowned, seated on top
  const king = rat(6); king.position.set(0, 0.85, -0.05); king.rotation.set(-0.5, 0, 0); g.add(king);
  const gold = new THREE.MeshStandardMaterial({ color: '#d8b040', metalness: 1, roughness: 0.2 });
  const crown = new THREE.Group(); crown.add(P(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16, 1, true), gold, [0, 0, 0])); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; crown.add(P(new THREE.ConeGeometry(0.025, 0.08, 6), gold, [Math.cos(a) * 0.12, 0.07, Math.sin(a) * 0.12])); }
  crown.position.set(0, 1.62, 0.95); g.add(crown);
  // a knot of tangled tails at the base
  const tm = new THREE.MeshPhysicalMaterial({ color: '#b08a80', roughness: 0.5 }); for (let i = 0; i < 14; i++) { const pts = []; for (let k = 0; k <= 6; k++) pts.push(new THREE.Vector3(Math.sin(i + k) * 0.5, 0.1 + Math.abs(Math.sin(k + i)) * 0.2, Math.cos(i * 2 + k) * 0.5)); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.02, 5), tm)); }
  L(g, '#ff3a2a', 3, 5, [0, 2, 1.5]);
  return shadowAll(g);
}

// ============ THE LANDLORD (Borough boss, Floor 7) ============
export function theLandlord() {
  const g = new THREE.Group(); const br = brass(), st = steel();
  // an apartment block for a torso, on clockwork legs
  const bTex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = '#8a4a3a'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 * 16; x < w; x += 32) { c.fillStyle = `hsl(10,40%,${25 + rnd() * 10}%)`; c.fillRect(x, y, 30, 14); } for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) { c.fillStyle = rnd() > 0.4 ? '#ffd080' : '#1a1a24'; c.fillRect(30 + k * 75, 30 + r * 80, 45, 55); c.strokeStyle = '#0d0b12'; c.lineWidth = 4; c.strokeRect(30 + k * 75, 30 + r * 80, 45, 55); } });
  g.add(P(new THREE.BoxGeometry(2.6, 3.8, 2.0), new THREE.MeshPhysicalMaterial({ map: bTex, roughness: 0.8, emissiveMap: bTex, emissive: C('#ffffff'), emissiveIntensity: 0.15 }), [0, 4.4, 0]));
  for (const sx of [-1, 1]) { g.add(P(new THREE.CylinderGeometry(0.22, 0.18, 2.4, 12), st, [sx * 0.8, 1.2, 0])); g.add(P(new THREE.SphereGeometry(0.3, 16, 12), br, [sx * 0.8, 2.4, 0])); g.add(P(new THREE.BoxGeometry(0.7, 0.25, 1.1), st, [sx * 0.8, 0.12, 0.2])); }
  for (let i = 0; i < 4; i++) { const gear = new THREE.Group(); gear.add(P(new THREE.CylinderGeometry(0.4 - i * 0.06, 0.4 - i * 0.06, 0.08, 24), br, [0, 0, 0])); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; gear.add(P(new THREE.BoxGeometry(0.1, 0.08, 0.1), br, [Math.cos(a) * (0.42 - i * 0.06), 0, Math.sin(a) * (0.42 - i * 0.06)])); } gear.position.set(-1.0 + i * 0.6, 2.65, 1.02); gear.rotation.x = Math.PI / 2; g.add(gear); }
  // arms holding a giant key and an eviction notice
  for (const sx of [-1, 1]) g.add(P(new THREE.CylinderGeometry(0.14, 0.12, 2.2, 10), st, [sx * 1.6, 4.6, 0.4], [0.6, 0, sx * 0.6]));
  const key = new THREE.Group(); key.add(P(new THREE.TorusGeometry(0.4, 0.08, 10, 24), br, [0, 1.2, 0])); key.add(P(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 10), br, [0, 0.2, 0])); for (let i = 0; i < 3; i++) key.add(P(new THREE.BoxGeometry(0.3, 0.12, 0.08), br, [0.15, -0.5 + i * 0.25, 0])); key.position.set(-2.3, 4.0, 1.2); key.rotation.z = 0.4; g.add(key);
  const notice = plate('EVICTION', '#f0e8d0', '#b01010', 1.3, 0.9, 80); notice.position.set(2.3, 3.8, 1.3); notice.rotation.y = -0.4; g.add(notice);
  // chimney stovepipe "hat" with smoke and a RENT DUE sign
  g.add(P(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 20), new THREE.MeshPhysicalMaterial({ color: '#141418', roughness: 0.4 }), [0, 7.0, 0])); g.add(P(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 20), new THREE.MeshPhysicalMaterial({ color: '#141418' }), [0, 6.33, 0]));
  const rent = plate('RENT DUE', '#b01010', '#f0f0f0', 1.6, 0.4, 90); rent.position.set(0, 6.6, 1.02); g.add(rent);
  for (const sx of [-1, 1]) { g.add(P(new THREE.SphereGeometry(0.12, 12, 8), glow('#ff3a1a', 3), [sx * 0.6, 5.9, 1.02])); }
  L(g, '#ff5a2a', 6, 6, [0, 5.8, 2.2]);
  const smoke = new THREE.MeshBasicMaterial({ color: '#4a4448', transparent: true, opacity: 0.25, depthWrite: false }); for (let i = 0; i < 8; i++) g.add(P(new THREE.SphereGeometry(0.4 + i * 0.12, 10, 8), smoke, [Math.sin(i) * 0.3, 7.9 + i * 0.45, -i * 0.15]));
  return shadowAll(g);
}

// ============ PIPE ORGAN WYRM (Borough boss, Floor 7) ============
export function pipeOrganWyrm() {
  const g = new THREE.Group(); const br = brass();
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(Math.sin(t * 7) * 2.2 * (1 - t * 0.5), Math.sin(t * Math.PI) * 4.5 + t * 1.5, -4 + t * 7)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  // the body: rings of organ pipes of varying lengths along a serpentine spine
  for (let i = 0; i < 60; i++) { const t = i / 60, p = curve.getPoint(t), tan = curve.getTangent(t); const r = 0.7 * (1 - t * 0.4) + 0.2;
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; const len = 0.4 + Math.abs(Math.sin(k * 1.7 + i)) * 0.7; const pipe = P(new THREE.CylinderGeometry(0.07, 0.07, len, 8), br, [0, 0, 0]); const off = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); off.applyQuaternion(q); pipe.position.copy(p).add(off); pipe.lookAt(p.clone().add(off.clone().multiplyScalar(2))); pipe.rotateX(Math.PI / 2); g.add(pipe); } }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.55, 12), new THREE.MeshPhysicalMaterial({ map: grimeTex('#4a2a1a', { rust: 10 }), roughness: 0.4, clearcoat: 0.5 })));
  // head: an organ console with a keyboard jaw, pipe teeth and stop-knob eyes
  const end = curve.getPoint(1), head = new THREE.Group(); head.position.copy(end); head.lookAt(end.clone().add(curve.getTangent(1)).add(new THREE.Vector3(0, -0.5, 0)));
  const wood = new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a2a1a', { rust: 10 }), roughness: 0.4, clearcoat: 0.7 });
  head.add(P(new THREE.BoxGeometry(2.0, 1.0, 1.6), wood, [0, 0.3, 0])); const jaw = P(new THREE.BoxGeometry(1.9, 0.25, 1.4), wood, [0, -0.5, 0.25], [0.5, 0, 0]); head.add(jaw);
  const keys = canvasTex(512, 64, (c) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, 512, 64); c.fillStyle = '#111'; for (let i = 0; i < 36; i++) { c.fillRect(i * 14.2, 0, 1.5, 64); if ([1, 3, 6, 8, 10].includes(i % 12)) c.fillRect(i * 14.2 + 8, 0, 9, 38); } });
  head.add(P(new THREE.PlaneGeometry(1.8, 0.22), new THREE.MeshPhysicalMaterial({ map: keys, roughness: 0.3 }), [0, -0.37, 0.93], [-1.07, 0, 0]));
  for (let i = 0; i < 10; i++) head.add(P(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8), br, [-0.85 + i * 0.19, -0.05, 0.75], [Math.PI, 0, 0]));
  for (const sx of [-1, 1]) { head.add(P(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), glow('#ff3a2a', 2.5), [sx * 0.55, 0.55, 0.81], [Math.PI / 2, 0, 0])); }
  g.add(head); L(g, '#ff7a3a', 6, 8, end.clone().add(new THREE.Vector3(0, 0, 2)).toArray());
  return shadowAll(g);
}

// ============ DRILL PROPHET (Borough boss, Floor 8) ============
export function drillProphet() {
  const g = new THREE.Group(); const br = brass(), st = steel();
  // a giant drill rig: tracked base, a towering spiral bit
  g.add(P(new THREE.BoxGeometry(3.4, 0.9, 2.6), st, [0, 0.45, 0]));
  for (const sx of [-1, 1]) g.add(P(new THREE.BoxGeometry(0.6, 0.8, 3.0), new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.8 }), [sx * 1.9, 0.4, 0]));
  const bit = new THREE.Group(); bit.add(P(new THREE.ConeGeometry(1.0, 4.4, 8), st, [0, 2.2, 0])); for (let i = 0; i < 18; i++) bit.add(P(new THREE.TorusGeometry(0.95 - i * 0.05, 0.08, 6, 20, Math.PI * 1.2), br, [0, 0.2 + i * 0.22, 0], [Math.PI / 2, 0, i * 0.7]));
  bit.position.set(0, 0.9, -0.2); g.add(bit);
  // the prophet: a robed mole-kin elder at the controls with a drill staff
  const m = T3.moleKin({ variant: 2 }); m.scale.setScalar(1.15); m.position.set(1.1, 0.9, 0.6); m.rotation.y = -0.4; g.add(m);
  const robe = P(new THREE.ConeGeometry(0.55, 1.2, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: '#c8a020', roughness: 0.8, side: THREE.DoubleSide, sheen: 0.6 }), [1.1, 1.55, 0.6]); g.add(robe);
  const staff = new THREE.Group(); staff.add(P(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), br, [0, 0.95, 0])); staff.add(P(new THREE.ConeGeometry(0.1, 0.35, 6), st, [0, 2.0, 0])); staff.position.set(1.6, 0.9, 0.9); staff.rotation.z = -0.15; g.add(staff);
  const banner = plate('THE DRILL PROVIDES', '#3a1a10', '#f0d040', 2.2, 0.45, 56); banner.position.set(0, 1.4, 1.32); g.add(banner);
  L(g, '#ffd080', 6, 7, [1.2, 3.2, 2]);
  return shadowAll(g);
}

// ============ THE FRYER BARON (Borough boss, Floor 8) ============
export function fryerBaron() {
  const g = new THREE.Group();
  const B = humanoid({ height: 3.0, bulk: 1.8, belly: 1.6, shoulders: 1.3, head: 0.95, hunch: 0.3, armL: 'raised', armR: 'forward', nose: 'flat', ears: 'round', jaw: 'heavy', legBulk: 1.6 });
  const s = B.scale;
  const col = (x, y, z, nx, ny, nz, ao, c) => { const u = y / s; c.copy(C('#c89a6a')).lerp(C('#8a5a3a'), clamp01(fbm(x * 9, y * 9, z * 9) + 0.4)); if (u < 1.45 && u > 0.1 && !(Math.abs(x / s) > 0.33 && u > 0.9 && u < 1.15)) { c.copy(C('#f4f0e8')).lerp(C('#c8a050'), clamp01(vnoise(x * 6, y * 6, z * 6) * 0.6 + 0.1)); if (Math.abs(x / s) < 0.12 && u > 1.0 && u < 1.4 && z > 0) { if (Math.abs(Math.sin(u * 30)) < 0.15) c.copy(C('#2a2a2a')); } } if (u <= 0.1) c.copy(C('#1a1a1a')); c.multiplyScalar(ao); };
  const [mn, mx] = B.bbox; g.add(new THREE.Mesh(buildMesh(B.sdf, mn, mx, 0.016, col), skinMaterial({ roughness: 0.55, clearcoat: 0.6, sheen: 0.4, sheenColor: '#ffd8a0', pore: 0.8, poreScale: 0.55 })));
  for (const p of B.eyes) { const e = eyeMesh(eyeTexture({ sclera: '#f0e8c0', iris: ['#ffa020', '#c86a00', '#5a2a00', '#000'], pupil: 'round', irisR: 50 }), B.eyeR * 0.8, 0.2); e.position.set(...p); g.add(e); }
  const st = steel();
  const hat = new THREE.Group(); hat.add(P(new THREE.BoxGeometry(0.5, 0.4, 0.4, 4, 3, 3), new THREE.MeshStandardMaterial({ color: '#b8b8b8', metalness: 1, roughness: 0.3, wireframe: true }), [0, 0, 0])); hat.add(P(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), new THREE.MeshPhysicalMaterial({ color: '#2a2a2a' }), [0.4, 0.05, 0], [0, 0, Math.PI / 2]));
  hat.position.set(B.headTop[0], B.headTop[1] + 0.15, B.headTop[2]); g.add(hat);
  const pan = new THREE.Group(); pan.add(P(new THREE.CylinderGeometry(0.55, 0.45, 0.12, 28), st, [0, 0, 0])); pan.add(P(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), new THREE.MeshPhysicalMaterial({ color: '#2a2a2a' }), [0, 0, -0.95], [Math.PI / 2, 0, 0]));
  pan.position.set(...B.handL); pan.position.y += 0.2; pan.rotation.x = -1.0; g.add(pan);
  g.add(P(new THREE.BoxGeometry(0.35, 0.03, 0.5), st, [B.handR[0], B.handR[1], B.handR[2] + 0.45]));
  for (let i = 0; i < 4; i++) { const a = 0.6 + i * 0.5; g.add(P(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 20), new THREE.MeshPhysicalMaterial({ map: grimeTex(['#3a6a3a', '#c83a1a', '#3a3a6a', '#c8a020'][i], { rust: 80 }), roughness: 0.5, metalness: 0.5 }), [Math.cos(a) * 2.2, 0.5, -Math.sin(a) * 1.4 - 0.5])); }
  const sign = plate('BARON OF FRY', '#c81a1a', '#ffe070', 2.0, 0.45, 70); sign.position.set(0, 4.1, -1.2); g.add(sign);
  return shadowAll(g);
}

// ============ THE RAT SENATE (Borough boss, Floor 9) ============
export function ratSenate() {
  const g = new THREE.Group(); const marble = new THREE.MeshPhysicalMaterial({ map: grimeTex('#e8e4dc', { rust: 15 }), roughness: 0.3, clearcoat: 0.6 });
  const toga = new THREE.MeshPhysicalMaterial({ color: '#f0ece0', roughness: 0.9, side: THREE.DoubleSide, sheen: 0.5 }), purple = new THREE.MeshPhysicalMaterial({ color: '#6a1a6a', roughness: 0.8 });
  // a semicircle of marble podiums, a rat senator on each in a toga
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI, r = 3.2; const x = Math.cos(a) * r, z = -Math.sin(a) * r * 0.7 - 1.0; g.add(P(new THREE.CylinderGeometry(0.4, 0.45, 1.0 + (i % 2) * 0.4, 16), marble, [x, 0.5 + (i % 2) * 0.2, z]));
    const rt = rat(3.2); rt.position.set(x, 1.0 + (i % 2) * 0.4, z); rt.rotation.set(-1.0, Math.atan2(-x, 1.5 - z), 0); g.add(rt); g.add(P(new THREE.ConeGeometry(0.25, 0.55, 12, 1, true), toga, [x, 1.25 + (i % 2) * 0.4, z])); g.add(P(new THREE.BoxGeometry(0.06, 0.5, 0.02), purple, [x + 0.1, 1.25 + (i % 2) * 0.4, z + 0.22], [0, 0, 0.4])); }
  // the Speaker: a huge rat in a purple toga with a laurel and a gavel
  const sp = rat(8); sp.position.set(0, 1.1, 0.6); sp.rotation.set(-1.15, 0, 0); g.add(sp);
  g.add(P(new THREE.ConeGeometry(0.75, 1.5, 20, 1, true), purple, [0, 1.6, 0.75]));
  const laurel = new THREE.MeshPhysicalMaterial({ color: '#c8a040', metalness: 0.8, roughness: 0.3 }); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 1.6 - 0.3; g.add(P(new THREE.SphereGeometry(0.05, 8, 6), laurel, [Math.cos(a) * 0.22, 2.95, 1.25 + Math.sin(a) * 0.22], [0, 0, 0], [1, 0.5, 2])); }
  g.add(P(new THREE.BoxGeometry(1.6, 1.1, 0.8), marble, [0, 0.55, 1.6]));
  const sign = plate('S.P.Q.R. — Senatus Populusque Rattus', '#e8e4dc', '#3a1a3a', 1.55, 0.25, 32); sign.position.set(0, 0.85, 2.01); g.add(sign);
  L(g, '#ffd8a0', 8, 8, [0, 4, 3]);
  return shadowAll(g);
}

// ============ LOCKJAW (Borough boss, Floor 9) ============
export function lockjaw() {
  const g = new THREE.Group(); const st = steel(), br = brass();
  // a living bank vault: a steel block on stubby legs, its round vault door hanging open like a jaw
  g.add(P(new THREE.BoxGeometry(3.2, 3.0, 3.0), st, [0, 2.0, 0]));
  for (const [x, z] of [[-1.2, -1.1], [1.2, -1.1], [-1.2, 1.1], [1.2, 1.1]]) g.add(P(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 12), st, [x, 0.3, z]));
  g.add(P(new THREE.CylinderGeometry(1.15, 1.15, 0.1, 40), new THREE.MeshBasicMaterial({ color: '#100808' }), [0, 2.0, 1.51], [Math.PI / 2, 0, 0]));
  const door = new THREE.Group(); door.add(P(new THREE.CylinderGeometry(1.2, 1.2, 0.35, 40), st, [0, 0, 0], [Math.PI / 2, 0, 0])); for (let i = 0; i < 4; i++) door.add(P(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), br, [0, 0, 0.25], [0, 0, (i / 4) * Math.PI])); door.add(P(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), br, [0, 0, 0.28], [Math.PI / 2, 0, 0]));
  door.position.set(1.25, 2.0, 2.4); door.rotation.y = -1.2; g.add(door);
  // gold teeth around the opening and a tongue of gold coins
  const gold = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.2 });
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; g.add(P(new THREE.ConeGeometry(0.1, 0.35, 6), gold, [Math.cos(a) * 1.05, 2.0 + Math.sin(a) * 1.05, 1.55], [0, 0, a + Math.PI / 2])); }
  for (let i = 0; i < 90; i++) g.add(P(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), gold, [(rnd() - 0.5) * 1.4, 1.2 + rnd() * 0.3 - (rnd()) * 0.1, 1.6 + rnd() * 1.8 - Math.max(0, rnd() - 0.5)], [rnd(), 0, rnd()]));
  // combination-dial eyes
  for (const sx of [-1, 1]) { g.add(P(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24), br, [sx * 0.9, 3.15, 1.52], [Math.PI / 2, 0, 0])); g.add(P(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 16), glow('#ff3a1a', 2.5), [sx * 0.9, 3.15, 1.56], [Math.PI / 2, 0, 0])); }
  const sign = plate('FIRST NATIONAL VAULT', '#1a2a1a', '#e0c060', 2.6, 0.35, 56); sign.position.set(0, 3.7, 1.52); g.add(sign);
  L(g, '#ffd060', 8, 6, [0, 1.6, 3.2]);
  return shadowAll(g);
}

// ============ THE SANITATION KING (City boss, Floor 7) ============
export function sanitationKing() {
  const g = new THREE.Group();
  // a titan built of garbage bags and bins, 7 m tall
  const B = humanoid({ height: 7.0, bulk: 2.2, belly: 1.2, shoulders: 1.5, head: 0.75, hunch: 0.8, armL: 'forward', armR: 'down', nose: 'none', ears: 'none', jaw: 'heavy', legBulk: 2.0, detail: 0, skinNoise: 0 });
  const sdf = (x, y, z) => { let d = B.sdf(x, y, z); d -= Math.max(0, vnoise(x * 1.6, y * 1.6, z * 1.6)) * 0.25; d += Math.abs(vnoise(x * 4, y * 4, z * 4)) * 0.05; return d; };
  const col = (x, y, z, nx, ny, nz, ao, c) => { const v = vnoise(x * 1.6, y * 1.6, z * 1.6); c.copy(v > 0.2 ? C('#1a1a1e') : v > -0.2 ? C('#2a4a2a') : C('#5a5a62')); c.lerp(C('#8a6a2a'), clamp01(vnoise(x * 5, y * 5, z * 5) - 0.3)); c.multiplyScalar(ao); };
  const [mn, mx] = B.bbox; g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.06, col), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 })));
  for (const p of B.eyes) g.add(P(new THREE.SphereGeometry(0.16, 12, 8), glow('#9aff3a', 3.5), p));
  // crown of trash-can lids, a garbage truck for a right fist, flies
  const tin = new THREE.MeshStandardMaterial({ map: grimeTex('#8a8c90', { rust: 50 }), metalness: 0.9, roughness: 0.4 });
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; g.add(P(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 20), tin, [B.headTop[0] + Math.cos(a) * 0.5, B.headTop[1] + 0.2, B.headTop[2] + Math.sin(a) * 0.5], [Math.PI / 2 - 0.3, -a, 0])); }
  const truck = new THREE.Group(); truck.add(P(new THREE.BoxGeometry(2.0, 2.0, 3.6), new THREE.MeshPhysicalMaterial({ map: grimeTex('#2a7a3a', { rust: 60 }), roughness: 0.5 }), [0, 0, 0])); truck.add(P(new THREE.BoxGeometry(1.9, 1.4, 1.2), new THREE.MeshPhysicalMaterial({ color: '#e8e8e0', roughness: 0.5 }), [0, -0.3, 2.3]));
  truck.position.set(B.handR[0], B.handR[1] - 0.6, B.handR[2] + 0.6); g.add(truck);
  const fly = new THREE.MeshBasicMaterial({ color: '#111' }); for (let i = 0; i < 80; i++) g.add(P(new THREE.SphereGeometry(0.03, 4, 3), fly, [(rnd() - 0.5) * 6, 1 + rnd() * 7, (rnd() - 0.5) * 4]));
  L(g, '#9aff3a', 8, 10, [0, 6, 3]);
  return shadowAll(g);
}

// ============ BIG MOMMA MOLD (City boss, Floor 8) ============
export function bigMommaMold() {
  const g = new THREE.Group();
  const sdf = (x, y, z) => {
    let d = ell(x, y, z, 0, 1.5, 0, 6.0, 2.5, 5.0); // spreading mound
    d = smin(d, ell(x, y, z, 0, 4.5, -1, 2.6, 3.2, 2.4), 1.2); // central mass
    d = smin(d, sph(x, y, z, 0, 7.6, -0.6, 1.4), 0.8); // "head" bulb
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; d = smin(d, chain(x, y, z, [[Math.cos(a) * 2, 4, Math.sin(a) * 2], [Math.cos(a) * 4.5, 6.5, Math.sin(a) * 4], [Math.cos(a) * 6, 9, Math.sin(a) * 5]], [0.6, 0.4, 0.2], 0.4), 0.6); } // tendrils to the ceiling
    if (Math.abs(d) < 0.3) d += fbm(x * 0.8, y * 0.8, z * 0.8) * 0.25 + (Math.abs(vnoise(x * 3, y * 3, z * 3)) - 0.3) * 0.06;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#6a8a3a')).lerp(C('#1a2a10'), clamp01(fbm(x * 0.6, y * 0.6, z * 0.6) + 0.4)); const v = vnoise(x * 1.5, y * 1.5, z * 1.5); if (v > 0.3) c.lerp(C('#e8f0a0'), 0.6); if (Math.abs(vnoise(x * 0.9, y * 0.9, z * 0.9)) < 0.05) c.copy(C('#c8ff7a')).multiplyScalar(1.5); c.multiplyScalar(0.4 + ao * 0.6); };
  const m = skinMaterial({ roughness: 0.6, clearcoat: 0.4, sheen: 0.8, sheenColor: '#e8ffb0', pore: 1.2, poreScale: 0.15 }); m.emissive = C('#2a4a10'); m.emissiveIntensity = 0.4;
  g.add(new THREE.Mesh(buildMesh(sdf, [-7.5, -0.2, -6.5], [7.5, 10.5, 6.5], 0.1, col), m));
  // a ring of mushrooms and infected (fungus-crowned) silhouettes
  const cap = new THREE.MeshPhysicalMaterial({ color: '#c84a2a', roughness: 0.4, clearcoat: 0.6 }), stalk = new THREE.MeshPhysicalMaterial({ color: '#e8d8b8', roughness: 0.6 });
  for (let i = 0; i < 30; i++) { const a = rnd() * Math.PI * 2, r = 4 + rnd() * 3, h = 0.5 + rnd() * 1.5; g.add(P(new THREE.CylinderGeometry(0.1 * h, 0.15 * h, h, 10), stalk, [Math.cos(a) * r, h / 2, Math.sin(a) * r])); g.add(P(new THREE.SphereGeometry(0.4 * h, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap, [Math.cos(a) * r, h, Math.sin(a) * r])); }
  const eyeT = eyeTexture({ sclera: '#e8f0a0', iris: ['#ff3a00', '#c81a00', '#5a0800', '#000'], pupil: 'slit', irisR: 120 });
  for (const [x, y, z, r] of [[0, 7.7, 0.7, 0.35], [-0.8, 5.5, 1.3, 0.25], [0.9, 5.0, 1.4, 0.22], [0.2, 3.8, 2.3, 0.18]]) { const e = eyeMesh(eyeT, r, 0.5, '#ff6a00'); e.position.set(x, y, z); g.add(e); }
  const spore = glow('#c8ff9a', 2); for (let i = 0; i < 300; i++) g.add(P(new THREE.SphereGeometry(0.03, 4, 3), spore, [(rnd() - 0.5) * 14, rnd() * 10, (rnd() - 0.5) * 12]));
  L(g, '#9aff6a', 14, 18, [0, 6, 5]);
  return shadowAll(g);
}

// ============ THE UNDERMAYOR (City boss, Floor 9) ============
export function undermayor() {
  const g = new THREE.Group();
  const B = humanoid({ height: 4.2, bulk: 0.7, belly: -0.2, shoulders: 1.0, head: 0.95, hunch: 0.6, armL: 'forward', armR: 'raised', nose: 'long', ears: 'point', jaw: 'normal', legBulk: 0.6 });
  const s = B.scale;
  const cloak = (x, y, z) => { const ux = x / s, uy = y / s, uz = z / s; let d = rcone(ux, uy, uz, 0, 0.0, -0.05, 0, 1.42, 0.03, 0.55, 0.24); d = Math.max(d, -rcone(ux, uy, uz, 0, -0.05, -0.05, 0, 1.38, 0.03, 0.52, 0.21)); d = Math.max(d, 0.02 - uy); d = smax(d, -rcone(ux, uy, uz, 0, 1.4, 0.3, 0, 0.0, 0.5, 0.12, 0.45), 0.05); if (Math.abs(d) < 0.03) d += Math.sin(Math.atan2(ux, uz) * 15) * 0.006; return d * s; };
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), cloak(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => { if (cloak(x, y, z) < B.sdf(x, y, z)) { c.copy(C('#1a1a24')).lerp(C('#3a2a4a'), clamp01(vnoise(x * 4, y * 4, z * 4) + 0.2)); } else { c.copy(C('#8a9a8a')).lerp(C('#3a4a3a'), clamp01(fbm(x * 8, y * 8, z * 8) + 0.4)); if (y / s < 1.42 && y / s > 0.1) c.copy(C('#2a2a3a')); } c.multiplyScalar(ao); };
  const [mn, mx] = B.bbox; mn[0] -= 0.4; mx[0] += 0.4; g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.022, col), skinMaterial({ roughness: 0.6, sheen: 0.6, sheenColor: '#6a5a8a', pore: 0.6 })));
  for (const p of B.eyes) g.add(P(new THREE.SphereGeometry(B.eyeR * 0.7, 10, 8), glow('#ffd040', 3.5), p));
  const blk = new THREE.MeshPhysicalMaterial({ color: '#141418', roughness: 0.4, clearcoat: 0.6 });
  g.add(P(new THREE.CylinderGeometry(0.17 * B.headScale, 0.19 * B.headScale, 0.55 * B.headScale, 20), blk, [B.headTop[0], B.headTop[1] + 0.25, B.headTop[2]]));
  g.add(P(new THREE.CylinderGeometry(0.32 * B.headScale, 0.32 * B.headScale, 0.03, 20), blk, [B.headTop[0], B.headTop[1] + 0.0, B.headTop[2]]));
  const sash = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.28 * s, 1.38 * s, 0.03), new THREE.Vector3(0, 1.15 * s, 0.2 * s), new THREE.Vector3(0.26 * s, 0.88 * s, 0.05)]), 20, 0.05, 4), new THREE.MeshPhysicalMaterial({ color: '#5a8a2a', roughness: 0.5 })); g.add(sash);
  // a lantern, a cloak trailing living rats, and a throne of pipes behind
  const lantern = new THREE.Group(); lantern.add(P(new THREE.CylinderGeometry(0.1, 0.12, 0.25, 6, 1, true), new THREE.MeshPhysicalMaterial({ color: '#fff4c0', transparent: true, opacity: 0.5, side: THREE.DoubleSide }), [0, 0, 0])); lantern.add(P(new THREE.SphereGeometry(0.06, 10, 8), glow('#9aff3a', 3.5), [0, 0, 0]));
  lantern.position.set(...B.handR); lantern.position.y += 0.2; g.add(lantern); L(g, '#9aff3a', 6, 7, [B.handR[0], B.handR[1] + 0.3, B.handR[2] + 0.3]);
  for (let i = 0; i < 16; i++) { const rt = rat(2.6); const a = Math.PI * 0.6 + rnd() * Math.PI * 0.8; rt.position.set(Math.cos(a) * 1.2, 0, Math.sin(a) * 0.9 - 0.3); rt.rotation.y = rnd() * 6; g.add(rt); }
  const pipe = new THREE.MeshStandardMaterial({ map: grimeTex('#5a6a5a', { rust: 120 }), metalness: 0.8, roughness: 0.5 });
  for (let i = 0; i < 9; i++) g.add(P(new THREE.CylinderGeometry(0.15, 0.15, 3 + Math.abs(i - 4) * -0.3 + 1.5, 12), pipe, [-1.6 + i * 0.4, (4.5 - Math.abs(i - 4) * 0.3) / 2, -1.2]));
  const sign = plate('UNDERMAYOR', '#1a2a1a', '#9aff3a', 2.6, 0.4, 80); sign.position.set(0, 4.6, -1.1); g.add(sign);
  return shadowAll(g);
}
