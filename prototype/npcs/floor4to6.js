// Floor 4-6 hub NPCs. All original characters (see the doc's settlement table).
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, ell, rcone, sph, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex } from '../sculpt.js';
import { humanoid } from '../anatomy.js';
import { raceBody, roleOutfit, shadowAll, glow, P, RACES } from './races.js';

const C = (h) => new THREE.Color(h);
const label = (t, bg, fg, w = 512, h = 128, size = 60) => canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = `bold ${size}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, h / 2 + 3); });
const steel = () => new THREE.MeshStandardMaterial({ map: grimeTex('#8a8c92', { rust: 40 }), metalness: 0.9, roughness: 0.35 });
const wood = () => new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a4a2a', { rust: 5 }), roughness: 0.6, clearcoat: 0.3 });
const gold = () => new THREE.MeshStandardMaterial({ color: '#d8b040', metalness: 1, roughness: 0.22 });

// ============ MADAME PRICKLE — Quillback auctioneer, Food Court Free State (Floor 4) ============
export function madamePrickle() {
  const g = new THREE.Group();
  RACES.quillback = { body: { height: 1.3, bulk: 1.1, belly: 1.0, hunch: 0.6, nose: 'none', ears: 'none', head: 1.1 }, skin: ['#8a6a4a', '#4a3424'], snout: 'rat', ears: 'round', muzzle: '#d8c0a0' };
  const { g: body, B, s } = raceBody('quillback', { arms: ['raised', 'forward'], outfit: (u, x, y, z) => (u < 1.42 && u > 0.45 && z > -0.02 ? C('#6a1a3a').lerp(C('#2a0a18'), clamp01(vnoise(x * 20, y * 20, z * 20) * 0.4)) : null) });
  g.add(body);
  // quills: hundreds of spines over the back and head
  const quill = new THREE.MeshPhysicalMaterial({ color: '#d8c8a8', roughness: 0.4, clearcoat: 0.5 });
  const qGeo = new THREE.ConeGeometry(0.008, 0.14, 5); qGeo.translate(0, 0.07, 0);
  const qs = new THREE.InstancedMesh(qGeo, quill, 520); const dm = new THREE.Object3D(); let n = 0;
  for (let i = 0; i < 2000 && n < 520; i++) { const a = rnd() * Math.PI * 2, el = rnd() * Math.PI - Math.PI / 2; const dir = new THREE.Vector3(Math.cos(el) * Math.sin(a), Math.sin(el), Math.cos(el) * Math.cos(a)); if (dir.z > 0.15) continue; const cy = dir.y > 0.2 ? 1.25 * s : 1.0 * s; const p = new THREE.Vector3(0, cy, -0.02).addScaledVector(dir, 0.22 * s); dm.position.copy(p); dm.lookAt(p.clone().add(dir).add(new THREE.Vector3(0, 0.3, -0.4))); dm.rotateX(Math.PI / 2); dm.updateMatrix(); qs.setMatrixAt(n++, dm.matrix); }
  qs.count = n; g.add(qs);
  // feathered hat, pearl monocle, an auction gavel, a podium with lot cards
  const hc = B.headCenter, hs = B.headScale;
  g.add(P(new THREE.CylinderGeometry(0.16 * hs, 0.16 * hs, 0.012, 24), new THREE.MeshPhysicalMaterial({ color: '#1a1018', roughness: 0.5 }), [hc[0], hc[1] + 0.13 * hs, hc[2]]));
  g.add(P(new THREE.CylinderGeometry(0.09 * hs, 0.1 * hs, 0.1 * hs, 20), new THREE.MeshPhysicalMaterial({ color: '#1a1018', roughness: 0.5 }), [hc[0], hc[1] + 0.18 * hs, hc[2]]));
  g.add(P(new THREE.CapsuleGeometry(0.012, 0.25, 4, 8), new THREE.MeshPhysicalMaterial({ color: '#c83a8a', roughness: 0.8, sheen: 1 }), [hc[0] + 0.08, hc[1] + 0.3 * hs, hc[2] - 0.05], [0.3, 0, -0.5]));
  g.add(P(new THREE.TorusGeometry(0.025, 0.004, 6, 20), gold(), [B.eyes[0][0] * 1.15, B.eyes[0][1], B.eyes[0][2] + 0.01]));
  const gav = new THREE.Group(); gav.add(P(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8), wood(), [0, -0.1, 0])); gav.add(P(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 14), wood(), [0, 0.0, 0], [0, 0, Math.PI / 2])); gav.position.set(...B.handL); gav.position.y += 0.1; g.add(gav);
  const pod = P(new THREE.BoxGeometry(0.6, 0.75, 0.4), wood(), [0.75, 0.375, 0.25], [0, -0.5, 0]); g.add(pod);
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.22), new THREE.MeshPhysicalMaterial({ map: label('LOT 41 · ???', '#e8dcc0', '#5a1a10'), roughness: 0.7 })); lot.position.set(0.86, 0.55, 0.43); lot.rotation.y = -0.5; g.add(lot);
  return shadowAll(g);
}

// ============ SUNNY THE SPONSOR REP — Hollow Crew mascot costume (Floor 4) ============
export function sunnySponsorRep() {
  const g = new THREE.Group();
  const { g: body, B, s } = raceBody('human', { arms: ['raised', 'forward'], bodyOver: { height: 1.9, bulk: 1.5, belly: 1.2, skinNoise: 0, detail: 0, nose: 'none', ears: 'none' }, outfit: (u, x, y, z) => (u > 1.45 ? null : C('#f0c020').lerp(C('#c88a10'), clamp01(vnoise(x * 6, y * 6, z * 6) * 0.4 + 0.1))) });
  body.children[0].material = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.95, sheen: 1, sheenColor: C('#fff0a0') }); // plush fur
  g.add(body);
  // the giant sun head with a fixed grin, and nothing inside the neck hole
  const hc = B.headCenter;
  const face = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#ffd030'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1010'; c.beginPath(); c.ellipse(w * 0.21, h * 0.42, 22, 34, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(w * 0.29, h * 0.42, 22, 34, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(w * 0.21 - 6, h * 0.38, 7, 0, 7); c.fill(); c.beginPath(); c.arc(w * 0.29 - 6, h * 0.38, 7, 0, 7); c.fill(); c.fillStyle = '#8a1a1a'; c.beginPath(); c.arc(w * 0.25, h * 0.56, 46, 0.05, Math.PI - 0.05); c.fill(); c.fillStyle = '#ff8a8a'; c.beginPath(); c.ellipse(w * 0.15, h * 0.58, 18, 10, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(w * 0.35, h * 0.58, 18, 10, 0, 0, 7); c.fill(); });
  const head = P(new THREE.SphereGeometry(0.38, 32, 24), new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.9, sheen: 1, sheenColor: C('#fff4b0') }), [hc[0], hc[1] + 0.15, hc[2]]); head.rotation.y = -Math.PI / 2 + Math.PI; g.add(head);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const r = P(new THREE.ConeGeometry(0.07, 0.24, 10), new THREE.MeshPhysicalMaterial({ color: '#ff8a1a', roughness: 0.9, sheen: 1 }), [hc[0] + Math.cos(a) * 0.46, hc[1] + 0.15 + Math.sin(a) * 0.46, hc[2] - 0.05], [0, 0, a - Math.PI / 2]); g.add(r); }
  g.add(P(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ color: '#000' }), [hc[0], hc[1] - 0.24, hc[2] + 0.08], [-Math.PI / 2 + 0.6, 0, 0])); // empty neck hole
  for (const h of [B.handL, B.handR]) g.add(P(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#f4f0e8', roughness: 0.9, sheen: 1 }), h, [0, 0, 0], [1, 1.1, 0.8]));
  const contract = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshPhysicalMaterial({ map: canvasTex(256, 340, (c, w, h) => { c.fillStyle = '#f4f0e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#c81a1a'; c.font = 'bold 30px sans-serif'; c.fillText('SPONSOR', 50, 44); c.fillText('DEAL!', 80, 80); c.fillStyle = '#333'; for (let y = 110; y < 300; y += 9) c.fillRect(16, y, 220 * (0.5 + rnd() * 0.5), 2); c.fillText('X______', 20, 330); }), roughness: 0.8, side: THREE.DoubleSide }));
  contract.position.set(B.handR[0], B.handR[1] + 0.15, B.handR[2] + 0.1); contract.rotation.x = -0.3; g.add(contract);
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), new THREE.MeshPhysicalMaterial({ map: label('HI!', '#3ac8ff', '#fff', 128, 128, 64), roughness: 0.4 })); badge.position.set(0.15, 1.3 * s, 0.33 * s); g.add(badge);
  return shadowAll(g);
}

// ============ BIG DEB — Grimhide hardware seller, Fort Cul-de-Sac (Floor 5) ============
export function bigDeb() {
  const g = new THREE.Group();
  const { g: body, B, s } = raceBody('grimhide', { arms: ['hip', 'forward'], bodyOver: { height: 2.05, bulk: 1.5, belly: 0.6 }, outfit: (u, x, y, z) => { if (u < 1.38 && u > 0.55 && z > 0.02 && Math.abs(x) < 0.27) return C('#c87a1a').lerp(C('#4a2a10'), clamp01(vnoise(x * 15, y * 15, z * 15) * 0.5 + 0.2)); if (u < 1.42 && u > 0.86 && !(Math.abs(x) > 0.3 && u < 1.15)) return C('#3a5a8a').lerp(C('#1a2a4a'), clamp01(Math.abs(Math.sin(x * 40 + y * 40)) * 0.6)); if (u <= 0.86 && u > 0.1) return C('#2a3048'); return null; } }); // plaid shirt, work apron, jeans
  g.add(body);
  // tool belt, pencil behind the ear, sledgehammer on her shoulder, a crate of nails
  const s1 = s;
  const belt = P(new THREE.TorusGeometry(1, 0.035, 8, 40), new THREE.MeshPhysicalMaterial({ color: '#3a2414', roughness: 0.7 }), [0, 0.88 * s1, 0.03], [Math.PI / 2, 0, 0], [0.3 * s1, 0.24 * s1, 1]); g.add(belt);
  for (const [x, len] of [[-0.18, 0.16], [0.2, 0.12], [0.28, 0.2]]) g.add(P(new THREE.CylinderGeometry(0.012, 0.012, len, 8), steel(), [x * s1, 0.82 * s1, 0.2 * s1]));
  g.add(P(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), new THREE.MeshPhysicalMaterial({ color: '#e8c020' }), [B.headCenter[0] + 0.15 * B.headScale, B.headCenter[1] + 0.02, B.headCenter[2]], [0, 0, 1.2]));
  const ham = new THREE.Group(); ham.add(P(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 10), wood(), [0, 0.5, 0])); ham.add(P(new THREE.BoxGeometry(0.28, 0.14, 0.14), steel(), [0, 1.0, 0])); ham.position.set(...B.handR); ham.rotation.set(-1.0, 0, 0.3); g.add(ham);
  const crate = P(new THREE.BoxGeometry(0.6, 0.4, 0.45), wood(), [0.75, 0.2, 0.4]); g.add(crate);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), new THREE.MeshPhysicalMaterial({ map: label("BIG DEB'S", '#c81a1a', '#ffe070'), roughness: 0.6 })); sign.position.set(0.75, 0.25, 0.63); g.add(sign);
  return shadowAll(g);
}

// ============ THE NEIGHBOURHOOD WATCH — council of three (Floor 5) ============
export function neighbourhoodWatch() {
  const g = new THREE.Group();
  const vest = (u, x, y, z) => (u < 1.4 && u > 0.95 && !(Math.abs(x) > 0.3 && u < 1.15) ? C('#d8f020').lerp(C('#a8b818'), clamp01(Math.abs(u - 1.12) < 0.03 ? 0 : 0.2)) : null);
  const members = [
    ['human', { arms: ['down', 'forward'], variant: 2, outfit: vest }, -1.0, 0.3],
    ['stoneblood', { arms: ['hip', 'down'], outfit: vest }, 0, -0.2],
    ['grimhide', { arms: ['forward', 'hip'], outfit: vest }, 1.05, 0.25],
  ];
  members.forEach(([race, opts, x, r]) => { const { g: m, B, s } = raceBody(race, opts); m.position.x = x; m.rotation.y = r; g.add(m); members[members.indexOf(members.find((q) => q[2] === x))].B = B; });
  // flashlight, binoculars, whistle; a "WATCH" sign on a post
  const fl = P(new THREE.CylinderGeometry(0.03, 0.025, 0.25, 12), new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.6 }), [-1.0 - 0.32, 1.0, 0.35], [Math.PI / 2, 0, 0.3]); g.add(fl);
  const beam = new THREE.SpotLight('#fff4d0', 10, 5, 0.3, 0.5, 1.2); beam.position.set(-1.3, 1.0, 0.5); beam.target.position.set(-1.5, 0, 2.5); g.add(beam, beam.target);
  for (const sx of [-1, 1]) g.add(P(new THREE.CylinderGeometry(0.03, 0.035, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.5 }), [sx * 0.04, 1.75, 0.55], [Math.PI / 2, 0, 0]));
  const post = P(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), new THREE.MeshStandardMaterial({ color: '#7a7a7a', metalness: 0.8 }), [1.9, 1.1, -0.4]); g.add(post);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshPhysicalMaterial({ map: canvasTex(256, 192, (c) => { c.fillStyle = '#f0f0e8'; c.fillRect(0, 0, 256, 192); c.strokeStyle = '#1a1a1a'; c.lineWidth = 8; c.strokeRect(6, 6, 244, 180); c.fillStyle = '#1a1a1a'; c.font = 'bold 30px sans-serif'; c.fillText('NEIGHBOURHOOD', 12, 60); c.fillStyle = '#c81a1a'; c.font = 'bold 56px sans-serif'; c.fillText('WATCH', 34, 130); c.fillStyle = '#1a1a1a'; c.font = '18px sans-serif'; c.fillText('we see you', 80, 170); }), roughness: 0.5, side: THREE.DoubleSide })); sign.position.set(1.9, 2.0, -0.37); g.add(sign);
  return shadowAll(g);
}

// ============ MOTHWINGS: Gusset (tailor) and Elder Lantern (blind elder), The Treehouse (Floor 6) ============
function mothWings(g, s, col1, col2, span = 1) {
  const tex = canvasTex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.save(); c.beginPath(); c.moveTo(10, 260); c.bezierCurveTo(120, 30, 400, 20, 500, 80); c.bezierCurveTo(470, 260, 360, 420, 220, 470); c.bezierCurveTo(100, 470, 30, 360, 10, 270); c.closePath(); c.clip(); const gr = c.createLinearGradient(0, 260, w, 260); gr.addColorStop(0, col2); gr.addColorStop(0.6, col1); gr.addColorStop(1, col2); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? 40 : 230},${rnd() < 0.5 ? 30 : 220},${rnd() < 0.5 ? 20 : 200},${rnd() * 0.15})`; c.fillRect(rnd() * w, rnd() * h, 2, 1 + rnd() * 3); } c.strokeStyle = 'rgba(30,20,10,0.5)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(15, 260); c.quadraticCurveTo(200, 240 + i * 10, 480, 60 + i * 50); c.stroke(); } for (const [r, cc] of [[40, '#1a1208'], [30, '#e8d8a0'], [14, '#0a0604']]) { c.fillStyle = cc; c.beginPath(); c.arc(320, 230, r, 0, 7); c.fill(); } c.restore(); });
  const m = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, sheen: 1, sheenColor: C('#f0e8d8') });
  for (const sx of [-1, 1]) { const geo = new THREE.PlaneGeometry(0.9 * span * s, 0.9 * span * s, 8, 8); geo.translate(0.45 * span * s, 0, 0); const w = new THREE.Mesh(geo, m); w.position.set(sx * 0.05, 1.3 * s, -0.16 * s); w.scale.x = sx; w.rotation.set(0.1, sx * -0.5, sx * 0.25); g.add(w); }
}
function antennae(g, B, col) { const hc = B.headCenter, hs = B.headScale, m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.8, sheen: 1 }); for (const sx of [-1, 1]) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(hc[0] + sx * 0.04, hc[1] + 0.12 * hs, hc[2] + 0.05), new THREE.Vector3(hc[0] + sx * 0.1, hc[1] + 0.3 * hs, hc[2] + 0.12), new THREE.Vector3(hc[0] + sx * 0.2, hc[1] + 0.4 * hs, hc[2] + 0.1)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 16, 0.005, 6), m)); for (let i = 3; i < 16; i++) { const p = cv.getPoint(i / 16); for (const sd of [-1, 1]) g.add(P(new THREE.CylinderGeometry(0.0015, 0.0008, 0.04, 3), m, [p.x, p.y + sd * 0.012, p.z - 0.01], [sd * 0.9, 0, 0])); } } }
export function gusset() {
  const g = new THREE.Group();
  RACES.mothwing = { body: { height: 1.7, bulk: 0.7, nose: 'none', ears: 'none', head: 1.0, skinNoise: 0.3 }, skin: ['#b8a888', '#6a5a48'] };
  const { g: body, B, s } = raceBody('mothwing', { arms: ['forward', 'forward'], outfit: (u, x, y, z) => (u < 1.42 && u > 0.1 && !(Math.abs(x) > 0.3 && u > 0.9 && u < 1.15) ? C('#3a6a7a').lerp(C('#1a2a3a'), clamp01(vnoise(x * 40, y * 40, z * 40) * 0.5 + 0.2)) : null) });
  g.add(body); mothWings(g, s, '#c8b890', '#6a5a40'); antennae(g, B, '#8a7a5a');
  // tape measure, pincushion bracelet, a bolt of glowing silk
  const tape = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.15 * s, 1.0 * s, 0.17 * s), new THREE.Vector3(-0.12 * s, 1.35 * s, 0.12 * s), new THREE.Vector3(0, 1.43 * s, -0.05 * s), new THREE.Vector3(0.12 * s, 1.35 * s, 0.12 * s), new THREE.Vector3(0.15 * s, 1.0 * s, 0.17 * s)]), 40, 0.008, 4), new THREE.MeshPhysicalMaterial({ color: '#e8d040', roughness: 0.5 })); tape.scale.set(1, 1, 1); g.add(tape);
  g.add(P(new THREE.SphereGeometry(0.04, 14, 10), new THREE.MeshPhysicalMaterial({ color: '#c81a3a', roughness: 0.8 }), [B.handL[0], B.handL[1] + 0.05, B.handL[2] - 0.06]));
  const bolt = P(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 20), new THREE.MeshPhysicalMaterial({ color: '#e8f0ff', roughness: 0.3, sheen: 1, sheenColor: C('#9ad8ff'), emissive: C('#4a8aff'), emissiveIntensity: 0.4 }), [(B.handL[0] + B.handR[0]) / 2, B.handL[1] + 0.05, (B.handL[2] + B.handR[2]) / 2 + 0.05], [0, 0, Math.PI / 2]); g.add(bolt);
  const l = new THREE.PointLight('#9ad8ff', 1.5, 1.5); l.position.copy(bolt.position).add(new THREE.Vector3(0, 0.1, 0.2)); g.add(l);
  return shadowAll(g);
}
export function elderLantern() {
  const g = new THREE.Group();
  RACES.mothwing = { body: { height: 1.85, bulk: 0.8, hunch: 0.9, nose: 'none', ears: 'none', head: 1.08, skinNoise: 0.5 }, skin: ['#e8e4d8', '#a8a090'] };
  const { g: body, B, s } = raceBody('mothwing', { arms: ['down', 'forward'], outfit: (u, x, y, z) => (u < 1.4 && u > 0.05 ? C('#5a2a4a').lerp(C('#2a1020'), clamp01(vnoise(x * 12, y * 12, z * 12) * 0.5 + 0.2)) : null) });
  g.add(body); mothWings(g, s, '#f4f0e8', '#b8b0a0', 1.25); antennae(g, B, '#d8d0c0');
  // cloudy blind eyes (milky overlays), a lantern on a crooked staff
  for (const p of B.eyes) g.add(P(new THREE.SphereGeometry(B.eyeR * 0.95, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#e8ecf0', roughness: 0.4, transmission: 0.3, transparent: true, opacity: 0.85 }), p));
  const staff = new THREE.Group(); staff.add(P(new THREE.CylinderGeometry(0.018, 0.022, 2.1, 8), wood(), [0, -0.1, 0]));
  staff.add(P(new THREE.TorusGeometry(0.12, 0.018, 8, 16, Math.PI), wood(), [0.12, 0.95, 0]));
  const lamp = new THREE.Group(); lamp.add(P(new THREE.CylinderGeometry(0.07, 0.08, 0.18, 6, 1, true), new THREE.MeshPhysicalMaterial({ color: '#fff4d0', transmission: 0.6, roughness: 0.2, transparent: true, opacity: 0.6, side: THREE.DoubleSide }), [0, 0, 0])); lamp.add(P(new THREE.SphereGeometry(0.035, 10, 8), glow('#ffd070', 3.5), [0, 0, 0])); lamp.add(P(new THREE.ConeGeometry(0.09, 0.07, 6), gold(), [0, 0.12, 0]));
  lamp.position.set(0.24, 0.82, 0); staff.add(lamp); const ll = new THREE.PointLight('#ffd070', 4, 4); ll.position.set(0.24, 0.82, 0.2); staff.add(ll);
  staff.position.set(...B.handR); g.add(staff);
  return shadowAll(g);
}
