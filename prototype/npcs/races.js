// Race bodies + role outfits for NPCs. raceBody() returns a sculpted body with race features;
// poolNPC() dresses it for a settlement role. Every combination is valid, so any settlement gets its own mix.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';

const C = (h) => new THREE.Color(h);
export const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
export const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
export const P = (geo, mat, pos, rot = [0, 0, 0], sc) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); if (sc) m.scale.set(...sc); return m; };

// race definitions: body proportions, skin palette, features
export const RACES = {
  human: { body: { height: 1.75, bulk: 0.95, nose: 'flat', ears: 'round' }, skin: ['#c8987a', '#8a5a44'], skins: [['#e8c0a8', '#b88a78'], ['#a87050', '#6a4030'], ['#6a4434', '#3a2418'], ['#d8a888', '#9a6a5a']] },
  gutterkin: { body: { height: 1.4, bulk: 0.8, hunch: 1.0, nose: 'none', ears: 'none', head: 1.12 }, skin: ['#6a5a52', '#2a2220'], snout: 'rat', ears: 'round', tail: 'rat' },
  stoneblood: { body: { height: 2.0, bulk: 1.5, belly: 0.3, shoulders: 1.2, nose: 'flat', ears: 'none', jaw: 'heavy', legBulk: 1.4, skinNoise: 2.2 }, skin: ['#8a8680', '#4a4642'], cracks: '#ff8a2a' },
  fennix: { body: { height: 1.6, bulk: 0.8, nose: 'none', ears: 'none', head: 1.05 }, skin: ['#d8742a', '#7a3a10'], snout: 'fox', ears: 'fox', tail: 'fox', muzzle: '#f4ece0' },
  ogrekin: { body: { height: 2.35, bulk: 1.8, belly: 1.0, shoulders: 1.3, head: 0.9, nose: 'flat', ears: 'round', jaw: 'heavy', legBulk: 1.6 }, skin: ['#9a8a6a', '#5a4a32'], tusks: true },
  lumen: { body: { height: 1.8, bulk: 0.75, nose: 'flat', ears: 'point', head: 1.05, skinNoise: 0.2 }, skin: ['#c8e8ff', '#7aa8d8'], glow: '#9ad8ff' },
  bogling: { body: { height: 1.45, bulk: 1.0, belly: 0.7, head: 1.35, nose: 'none', ears: 'none', jaw: 'heavy', skinNoise: 0.5 }, skin: ['#6a9a3a', '#2a4a1a'], spots: '#c8d040', bigEyes: true, wet: true },
  clanker: { body: { height: 1.85, bulk: 1.0, nose: 'none', ears: 'none', jaw: 'normal', skinNoise: 0 }, skin: ['#8a8c92', '#4a4c52'], metal: true, glow: '#3affea' },
  grimhide: { body: { height: 1.95, bulk: 1.35, shoulders: 1.15, nose: 'flat', ears: 'point', jaw: 'underbite', legBulk: 1.2 }, skin: ['#6a7a4a', '#3a4a24'], tusks: true },
};
export const ROLE_COLORS = { trader: ['#6a3a1a', '#c8a040'], cook: ['#e8e4dc', '#c82a2a'], guard: ['#4a4e58', '#a8281e'], gossip: ['#7a3a6a', '#e8c0d8'], healer: ['#e8e0c8', '#2a8a5a'], quest: ['#2a3a6a', '#d8b040'] };

// Build a race body. `outfit(u, x, y, z) -> colour | null` paints clothes (u = normalised height).
export function raceBody(race, { arms = ['down', 'down'], outfit = null, variant = 0, bodyOver = {} } = {}) {
  const R = RACES[race];
  const g = new THREE.Group();
  const B = humanoid({ armL: arms[0], armR: arms[1], jaw: 'normal', ...R.body, ...bodyOver });
  const s = B.scale, hc = B.headCenter, hs = B.headScale;
  const skin = R.skins ? R.skins[variant % R.skins.length] : R.skin;
  const parts = [];
  if (R.snout) { const L = R.snout === 'fox' ? 0.24 : 0.3; const tip = [hc[0], hc[1] - 0.06 * hs, hc[2] + L * hs]; parts.push((x, y, z) => rcone(x, y, z, hc[0], hc[1] - 0.02 * hs, hc[2] + 0.1 * hs, tip[0], tip[1], tip[2], 0.08 * hs, 0.025 * hs)); B.snoutTip = tip; }
  if (R.ears === 'round') parts.push((x, y, z) => { let d = 1e9; for (const sx of [-1, 1]) d = Math.min(d, ell(x, y, z, hc[0] + sx * 0.12 * hs, hc[1] + 0.12 * hs, hc[2] - 0.02, 0.07 * hs, 0.08 * hs, 0.02 * hs)); return d; });
  if (R.ears === 'fox') parts.push((x, y, z) => { let d = 1e9; for (const sx of [-1, 1]) d = Math.min(d, rcone(x, y, (z - hc[2]) * 2.5 + hc[2], hc[0] + sx * 0.08 * hs, hc[1] + 0.1 * hs, hc[2], hc[0] + sx * 0.13 * hs, hc[1] + 0.3 * hs, hc[2] - 0.02, 0.06 * hs, 0.008)); return d; });
  if (R.tail === 'rat') parts.push((x, y, z) => chain(x, y, z, [[0, 0.82 * s, -0.12 * s], [0.08, 0.5 * s, -0.4 * s], [0.25, 0.15 * s, -0.5 * s], [0.4, 0.04, -0.35 * s]], [0.035, 0.025, 0.015, 0.008], 0.02));
  if (R.tail === 'fox') parts.push((x, y, z) => chain(x, y, z, [[0, 0.82 * s, -0.12 * s], [0.05, 0.62 * s, -0.42 * s], [0.18, 0.35 * s, -0.58 * s], [0.3, 0.2 * s, -0.5 * s]], [0.06, 0.12, 0.1, 0.03], 0.05));
  const extra = (x, y, z) => { let d = 1e9; for (const f of parts) d = Math.min(d, f(x, y, z)); return d; };
  const sdf = (x, y, z) => { let d = parts.length ? smin(B.sdf(x, y, z), extra(x, y, z), 0.02) : B.sdf(x, y, z); if (R.cracks && Math.abs(d) < 0.03) d += Math.abs(vnoise(x * 6, y * 6, z * 6)) < 0.04 ? 0.008 : 0; return d; };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const u = y / s;
    c.copy(C(skin[0])).lerp(C(skin[1]), clamp01(fbm(x * (R.metal ? 4 : 14), y * (R.metal ? 4 : 14), z * (R.metal ? 4 : 14)) + 0.4));
    if (R.spots && vnoise(x * 18, y * 18, z * 18) > 0.4) c.lerp(C(R.spots), 0.6);
    if (R.muzzle && (z > hc[2] + 0.1 * hs && y < hc[1]) || (R.muzzle && ny < -0.4 && u > 1.1)) c.lerp(C(R.muzzle), 0.8);
    if (R.cracks && Math.abs(vnoise(x * 6, y * 6, z * 6)) < 0.04) c.copy(C(R.cracks)).multiplyScalar(1.6);
    if (R.metal && Math.abs(Math.sin(y * 28)) < 0.05) c.multiplyScalar(0.4); // panel seams
    if (B.snoutTip && Math.hypot(x - B.snoutTip[0], y - B.snoutTip[1], z - B.snoutTip[2]) < 0.04) c.copy(C(race === 'fennix' ? '#1a1410' : '#d88a8a'));
    if (outfit) { const o = outfit(u, x / s, y / s, z / s, c); if (o) c.copy(o); }
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[2] -= R.tail ? 0.5 : 0.05; mx[2] += R.snout ? 0.2 : 0.05; mx[1] += R.ears === 'fox' ? 0.2 : 0.02; mn[0] -= 0.05; mx[0] += 0.05;
  const mat = R.metal ? new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.85, roughness: 0.32, clearcoat: 0.4 }) : skinMaterial({ roughness: R.wet ? 0.25 : 0.62, clearcoat: R.wet ? 1 : 0.15, sheen: race === 'fennix' || race === 'gutterkin' ? 1 : 0.3, sheenColor: '#c8b8a8', pore: R.wet ? 0.3 : 0.6 });
  if (R.glow && !R.metal) { mat.emissive = C(R.glow); mat.emissiveIntensity = 0.3; }
  const step = Math.max(0.0068, 0.0068 * s) * (globalThis.__NPC_STEP || 1);
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, step, col), mat));
  // eyes
  if (R.metal) for (const p of B.eyes) g.add(P(new THREE.SphereGeometry(B.eyeR * 0.8, 10, 8), glow(R.glow, 3.5), p));
  else if (race === 'gutterkin') for (const p of B.eyes) g.add(P(new THREE.SphereGeometry(B.eyeR * 0.7, 10, 8), new THREE.MeshPhysicalMaterial({ color: '#050505', roughness: 0.03, clearcoat: 1 }), [p[0] * 1.15, p[1], p[2]]));
  else { const tex = eyeTexture({ sclera: race === 'lumen' ? '#e8f4ff' : '#f0ece4', iris: race === 'bogling' ? ['#ffd020', '#c88a00', '#6a4000', '#000'] : race === 'fennix' ? ['#ffb020', '#c86a00', '#5a2a00', '#000'] : race === 'lumen' ? ['#ffffff', '#9ad8ff', '#3a8ac8', '#000'] : ['#6a4a2a', '#4a3018', '#2a1a0a', '#000'], pupil: race === 'fennix' || race === 'bogling' ? 'slit' : 'round', irisR: race === 'bogling' ? 100 : 62, veins: 10 }); for (const p of B.eyes) { const e = eyeMesh(tex, B.eyeR * (R.bigEyes ? 1.7 : 0.85), race === 'lumen' ? 0.5 : 0.02, '#9ad8ff'); e.position.set(p[0] * (R.bigEyes ? 1.25 : 1), p[1] + (R.bigEyes ? 0.02 : 0), p[2] - (R.bigEyes ? 0.01 : 0)); g.add(e); } }
  if (R.tusks) { const tm = toothMat(); for (const sx of [-1, 1]) g.add(P(new THREE.ConeGeometry(0.014 * hs, 0.06 * hs, 8), tm, [sx * 0.06 * hs, B.mouth[1] + 0.025 * hs, B.mouth[2] - 0.02 * hs], [-0.3, 0, -sx * 0.3])); }
  if (R.glow && !R.metal) { const l = new THREE.PointLight(R.glow, 1.5, 2); l.position.set(0, 1.2 * s, 0.5); g.add(l); }
  if (race === 'gutterkin') { const wh = new THREE.MeshStandardMaterial({ color: '#e8e0d8' }); for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) g.add(P(new THREE.CylinderGeometry(0.0012, 0.0006, 0.14, 3), wh, [B.snoutTip[0] + sx * 0.05, B.snoutTip[1] - i * 0.008, B.snoutTip[2] - 0.05], [0, 0, sx * (1.3 + i * 0.1)])); }
  return { g, B, s };
}

// Simple tunic/apron/robe painted onto the body, by role.
export function roleOutfit(role, variant = 0) {
  const [main, accent] = ROLE_COLORS[role];
  const m = C(main), a = C(accent), dark = C('#1a1612');
  return (u, x, y, z, base) => {
    const sleeve = Math.abs(x) > 0.3 && u > 0.9 && u < 1.15;
    if (role === 'healer' || role === 'quest') { if (u < 1.42 && u > 0.05 && !sleeve) { const c = m.clone(); if (Math.abs(x) < 0.04 && z > 0.1) c.copy(a); if (u < 0.12) c.copy(a); return c.lerp(dark, clamp01(vnoise(x * 20, y * 20, z * 20) * 0.4 + 0.1)); } return null; } // long robe
    if (u < 1.42 && u > 0.86 && !sleeve) { const c = m.clone(); if (Math.abs(u - 0.9) < 0.04) c.copy(a); return c.lerp(dark, clamp01(vnoise(x * 20, y * 20, z * 20) * 0.4 + 0.1)); } // tunic
    if (u <= 0.86 && u > 0.1) { if (role === 'cook' && z > 0.05 && Math.abs(x) < 0.22 && u > 0.4) return C('#f0ece4'); return C(['#3a3024', '#2a2a32', '#3a2a2a'][variant % 3]).lerp(dark, clamp01(vnoise(x * 20, y * 20, z * 20) * 0.4)); } // trousers
    if (u <= 0.1) return C('#241a12');
    return null;
  };
}

const wood = () => new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a4a2a', { rust: 5 }), roughness: 0.7 });
const steel = () => new THREE.MeshStandardMaterial({ map: grimeTex('#8a8c92', { rust: 40 }), metalness: 0.9, roughness: 0.35 });
// Props by role, placed relative to the body's hands.
export function roleProps(role, g, B, s) {
  const hl = B.handL, hr = B.handR;
  if (role === 'trader') { const pack = P(new THREE.BoxGeometry(0.4 * s, 0.5 * s, 0.25 * s), new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a3a1a'), roughness: 0.7 }), [0, 1.15 * s, -0.25 * s]); g.add(pack); g.add(P(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#8a6a3a', roughness: 0.8 }), [0.2 * s, 0.86 * s, 0.12 * s])); for (let i = 0; i < 3; i++) g.add(P(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 12), new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.25 }), [hr[0], hr[1] + 0.02 + i * 0.005, hr[2] + 0.03])); }
  if (role === 'cook') { const pan = new THREE.Group(); pan.add(P(new THREE.CylinderGeometry(0.13, 0.11, 0.04, 20), steel(), [0, 0, 0.14])); pan.add(P(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), wood(), [0, 0, 0], [Math.PI / 2, 0, 0])); pan.position.set(...hr); g.add(pan); const hat = P(new THREE.CylinderGeometry(0.13 * B.headScale, 0.11 * B.headScale, 0.2 * B.headScale, 16), new THREE.MeshPhysicalMaterial({ color: '#f4f0e8', roughness: 0.8 }), [B.headTop[0], B.headTop[1] + 0.05, B.headTop[2]]); g.add(hat); }
  if (role === 'guard') { g.add(P(new THREE.CylinderGeometry(0.014, 0.014, 2.0 * s * 0.9, 8), wood(), [hr[0], hr[1] + 0.3 * s, hr[2]])); g.add(P(new THREE.ConeGeometry(0.035, 0.2, 6), steel(), [hr[0], hr[1] + 1.2 * s, hr[2]])); g.add(P(new THREE.CylinderGeometry(0.28 * s, 0.28 * s, 0.03, 24), new THREE.MeshPhysicalMaterial({ map: grimeTex('#a8281e', { rust: 60 }), roughness: 0.4, metalness: 0.3 }), [hl[0] + 0.08, hl[1] + 0.05, hl[2] + 0.08], [Math.PI / 2, 0, 0])); g.add(P(new THREE.SphereGeometry(0.16 * B.headScale, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), steel(), [B.headCenter[0], B.headCenter[1] + 0.03, B.headCenter[2] - 0.01])); }
  if (role === 'gossip') { const cup = new THREE.Group(); cup.add(P(new THREE.CylinderGeometry(0.035, 0.025, 0.05, 16), new THREE.MeshPhysicalMaterial({ color: '#f0f0f0', roughness: 0.2, clearcoat: 1 }), [0, 0.025, 0])); cup.add(P(new THREE.CylinderGeometry(0.06, 0.06, 0.006, 16), new THREE.MeshPhysicalMaterial({ color: '#f0f0f0', roughness: 0.2, clearcoat: 1 }), [0, 0, 0])); cup.position.set(...hr); cup.position.y += 0.02; g.add(cup); g.add(P(new THREE.TorusGeometry(0.11 * s, 0.03, 8, 24), new THREE.MeshPhysicalMaterial({ color: '#e8b0c8', roughness: 0.9, sheen: 1 }), [0, 1.42 * s, 0.03], [Math.PI / 2 - 0.2, 0, 0])); }
  if (role === 'healer') { g.add(P(new THREE.CylinderGeometry(0.014, 0.016, 1.9 * s * 0.85, 8), wood(), [hr[0], hr[1] + 0.25 * s, hr[2]])); g.add(P(new THREE.BoxGeometry(0.03, 0.16, 0.03), glow('#7aff9a', 2.5), [hr[0], hr[1] + 1.1 * s, hr[2]])); g.add(P(new THREE.BoxGeometry(0.12, 0.03, 0.03), glow('#7aff9a', 2.5), [hr[0], hr[1] + 1.12 * s, hr[2]])); g.add(P(new THREE.BoxGeometry(0.22, 0.16, 0.08), new THREE.MeshPhysicalMaterial({ color: '#f0ece0', roughness: 0.7 }), [-0.24 * s, 0.85 * s, 0.05])); const l = new THREE.PointLight('#7aff9a', 1.2, 1.5); l.position.set(hr[0], hr[1] + 1.1 * s, hr[2] + 0.2); g.add(l); }
  if (role === 'quest') { const sc = new THREE.Group(); sc.add(P(new THREE.CylinderGeometry(0.03, 0.03, 0.26, 12), new THREE.MeshPhysicalMaterial({ color: '#e8dcc0', roughness: 0.8 }), [0, 0, 0], [0, 0, Math.PI / 2])); sc.add(P(new THREE.PlaneGeometry(0.24, 0.2), new THREE.MeshPhysicalMaterial({ color: '#e8dcc0', roughness: 0.8, side: THREE.DoubleSide }), [0, -0.1, 0.01])); sc.position.set(...hr); sc.position.y += 0.1; g.add(sc); const mark = P(new THREE.OctahedronGeometry(0.06, 0), glow('#F5C518', 3), [B.headTop[0], B.headTop[1] + 0.28, B.headTop[2]], [0, 0, 0], [0.6, 1.4, 0.6]); g.add(mark); }
}
export function poolNPC({ role = 'trader', race = 'human', variant = 0 } = {}) {
  const arms = { trader: ['down', 'forward'], cook: ['hip', 'forward'], guard: ['forward', 'forward'], gossip: ['hip', 'forward'], healer: ['down', 'forward'], quest: ['down', 'forward'] }[role];
  const { g, B, s } = raceBody(race, { arms, outfit: roleOutfit(role, variant), variant });
  roleProps(role, g, B, s);
  return shadowAll(g);
}
