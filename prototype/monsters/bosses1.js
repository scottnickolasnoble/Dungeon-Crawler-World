// Floor 1-3 bosses: six Neighbourhood bosses (one per Tier 1 monster type) and three Borough bosses.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';
import { makeGoblin, RIGHT_HAND } from '../creature.js';
import * as T1 from './tier1.js';

const C = (h) => new THREE.Color(h);
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
const strip = (g, ...names) => names.forEach((n) => { const o = g.getObjectByName(n); if (o) o.parent.remove(o); });
const coneTexture = (base = '#e8590c') => canvasTex(256, 256, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); c.fillStyle = '#eeeae0'; c.fillRect(0, h * 0.35, w, h * 0.14); c.fillRect(0, h * 0.62, w, h * 0.09); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(40,25,10,${rnd() * 0.25})`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 1 + rnd() * 3); } });
const coneMat = (base) => new THREE.MeshPhysicalMaterial({ map: coneTexture(base), roughness: 0.5, clearcoat: 0.4 });
function trafficCone(h = 0.45, base) { const g = new THREE.Group(); const m = coneMat(base); const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.33, h, 24, 1, true), m); c.position.y = h / 2 + 0.02; g.add(c); const b = new THREE.Mesh(new THREE.BoxGeometry(h * 0.8, 0.03, h * 0.8), new THREE.MeshPhysicalMaterial({ color: '#c94a0a', roughness: 0.7 })); b.position.y = 0.015; g.add(b); return g; }
const hiVis = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#d8f020'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8c8c8'; c.fillRect(0, h * 0.3, w, h * 0.1); c.fillRect(0, h * 0.62, w, h * 0.1); for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(60,50,20,${rnd() * 0.25})`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 18, 1 + rnd() * 4); } });

// ============ SERGEANT PYLON (Traffic-Cone Goblin boss) ============
export function sergeantPylon() {
  const g = makeGoblin({ variant: 3 }); strip(g, 'helmet', 'weapon', 'hubcap');
  // five stacked cones as a helmet of rank
  for (let i = 0; i < 5; i++) { const c = trafficCone(0.36, i === 4 ? '#ffd020' : '#e8590c'); c.position.set(0, 1.7 + i * 0.09, 0.08); c.rotation.set(-0.18, i * 0.4, 0.05 * (i % 2 ? 1 : -1)); g.add(c); }
  // hi-vis vest with sergeant chevrons
  const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.45, 32, 1, true), new THREE.MeshPhysicalMaterial({ map: hiVis, roughness: 0.6, side: THREE.DoubleSide }));
  vest.position.set(0, 1.15, 0.03); vest.scale.z = 0.85; g.add(vest);
  const chev = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.5 });
  for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.01), chev); ch.position.set(sx * 0.03 + 0.13, 1.25 - i * 0.03, 0.215); ch.rotation.z = sx * 0.5; g.add(ch); }
  const whistle = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 8), new THREE.MeshStandardMaterial({ color: '#c8c8d0', metalness: 1, roughness: 0.2 })); whistle.position.set(-0.05, 1.33, 0.2); whistle.rotation.z = 1.4; g.add(whistle);
  // stop-sign shield in the left hand, a striped road barrier as a club in the right
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 8), new THREE.MeshPhysicalMaterial({ map: grimeTex('#b01810', { rust: 40 }), metalness: 0.4, roughness: 0.4 }));
  shield.rotation.set(Math.PI / 2, 0, Math.PI / 8); shield.position.set(0.38, 0.95, 0.42); g.add(shield);
  const stopTxt = canvasTex(256, 128, (c) => { c.fillStyle = '#b01810'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#f0f0f0'; c.font = 'bold 84px sans-serif'; c.fillText('STOP', 18, 98); });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshPhysicalMaterial({ map: stopTxt, roughness: 0.5 })); st.position.set(0.38, 0.95, 0.432); g.add(st);
  const barrierTex = canvasTex(512, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f0f0f0' : '#e8410c'; c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 64, 0); c.lineTo(i * 64 + 32, h); c.lineTo(i * 64 - 32, h); c.fill(); } });
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.04), new THREE.MeshPhysicalMaterial({ map: barrierTex, roughness: 0.5 }));
  barrier.position.set(RIGHT_HAND[0], RIGHT_HAND[1] + 0.4, RIGHT_HAND[2] + 0.05); barrier.rotation.set(-0.35, 0, 0.55); g.add(barrier);
  const flasher = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), glow('#ffb020', 3)); flasher.position.set(RIGHT_HAND[0] - 0.25, RIGHT_HAND[1] + 0.85, RIGHT_HAND[2] - 0.1); g.add(flasher);
  g.scale.setScalar(1.75);
  const gl = new THREE.PointLight('#ffb020', 3, 3); gl.position.set(-1.0, 3.2, 0.3); g.add(gl);
  return shadowAll(g);
}

// ============ THE BIG SUCKER (Drain Lamprey boss) ============
export function bigSucker() {
  const g = new THREE.Group();
  const l = T1.drainLamprey(); l.scale.setScalar(2.6); g.add(l);
  // egg clutch around the drain: translucent eggs with dark embryos curled inside
  const egg = new THREE.MeshPhysicalMaterial({ color: '#d8e0a0', roughness: 0.1, transmission: 0.55, thickness: 0.15, transparent: true, opacity: 0.85, clearcoat: 1 });
  const emb = new THREE.MeshPhysicalMaterial({ color: '#2a1a24', roughness: 0.4 });
  for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, r = 0.9 + rnd() * 0.7, s = 0.08 + rnd() * 0.06; const e = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 12), egg); e.position.set(Math.cos(a) * r, s * 0.8, Math.sin(a) * r - 0.6); e.scale.y = 1.25; g.add(e); const k = new THREE.Mesh(new THREE.TorusGeometry(s * 0.4, s * 0.15, 6, 12, 4.5), emb); k.position.copy(e.position); g.add(k); }
  const slime = new THREE.Mesh(new THREE.CircleGeometry(2.0, 40), new THREE.MeshPhysicalMaterial({ color: '#2a3020', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); slime.rotation.x = -Math.PI / 2; slime.position.set(0, 0.006, -0.6); g.add(slime);
  // a ring of broken pipe around the drain
  const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 12, 40, Math.PI * 1.6), new THREE.MeshStandardMaterial({ map: grimeTex('#4a4440', { rust: 140 }), metalness: 0.8, roughness: 0.6 })); pipe.rotation.x = Math.PI / 2; pipe.position.set(0.13, 0.08, -0.85); g.add(pipe);
  const gl = new THREE.PointLight('#9aff7a', 2, 4); gl.position.set(0, 0.6, -0.5); g.add(gl);
  return shadowAll(g);
}

// ============ HEAD CUSTODIAN EBB (Mop Wight boss) ============
export function headCustodianEbb() {
  const g = new THREE.Group();
  const w = T1.mopWight(); g.add(w);
  const cloth = new THREE.MeshPhysicalMaterial({ color: '#2a3a5a', roughness: 0.8 });
  const cap = new THREE.Group(); const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.105, 0.07, 24), cloth); const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.01, 24, 1, false, -1.1, 2.2), new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.3, clearcoat: 1 })); peak.position.set(0, -0.03, 0.03); cap.add(crown, peak); cap.position.set(0, 1.88, 0.0); cap.rotation.x = -0.15; g.add(cap);
  // name badge + giant keyring
  const badge = canvasTex(256, 96, (c) => { c.fillStyle = '#e8e0c8'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#1a2a4a'; c.font = 'bold 30px sans-serif'; c.fillText('HEAD CUSTODIAN', 8, 36); c.font = 'bold 44px sans-serif'; c.fillText('EBB', 80, 84); });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.045), new THREE.MeshPhysicalMaterial({ map: badge, roughness: 0.6 })); b.position.set(0.09, 1.42, 0.125); b.rotation.y = 0.2; g.add(b);
  const brass = new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 8, 32), brass); ring.position.set(-0.14, 1.1, 0.06); ring.rotation.y = 1.2; g.add(ring);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, k = new THREE.Group(); const sh = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.07, 0.003), brass); sh.position.y = -0.035; const hd = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 6, 12), brass); k.add(sh, hd); k.position.set(-0.14 + Math.cos(a) * 0.02, 1.1 + Math.sin(a) * 0.08 - 0.06, 0.06 + Math.sin(a) * 0.07); k.rotation.z = (rnd() - 0.5) * 0.6; g.add(k); }
  // a punch-clock strapped to his back, still ticking
  const clock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.1), new THREE.MeshStandardMaterial({ map: grimeTex('#6a6a5a', { rust: 50 }), metalness: 0.6, roughness: 0.5 })); clock.position.set(0, 1.4, -0.16); g.add(clock);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshBasicMaterial({ color: '#e8e0c8' })); face.position.set(0, 1.44, -0.212); face.rotation.y = Math.PI; g.add(face);
  // a ring of wet-floor signs around him
  const sign = canvasTex(128, 192, (c) => { c.fillStyle = '#f0c818'; c.fillRect(0, 0, 128, 192); c.fillStyle = '#111'; c.font = 'bold 26px sans-serif'; c.fillText('CAUTION', 10, 40); c.font = 'bold 22px sans-serif'; c.fillText('WET FLOOR', 4, 170); c.beginPath(); c.arc(64, 100, 26, 0, 7); c.fill(); });
  const sm = new THREE.MeshPhysicalMaterial({ map: sign, roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3, s = new THREE.Group(); for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.32), sm); p.position.set(0, 0.15, sx * 0.04); p.rotation.x = sx * 0.25; s.add(p); } s.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.75); s.rotation.y = -a; g.add(s); }
  g.scale.setScalar(1.55);
  return shadowAll(g);
}

// ============ THE BULB QUEEN (Fluorescent Moth boss) ============
export function bulbQueen() {
  const g = new THREE.Group();
  const m = T1.fluorescentMoth(); g.add(m);
  const Y = 1.15;
  // lampshade carapace over the thorax
  const shadeTex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#e8d8a8'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,80,40,0.5)'; for (let x = 0; x < w; x += 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(90,50,20,${rnd() * 0.3})`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 3 + rnd() * 10, 0, 7); c.fill(); } c.fillStyle = '#a07030'; c.fillRect(0, 0, w, 6); c.fillRect(0, h - 6, w, 6); });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 0.14, 32, 1, true), new THREE.MeshPhysicalMaterial({ map: shadeTex, roughness: 0.8, side: THREE.DoubleSide, transmission: 0.3, emissive: C('#ffb040'), emissiveIntensity: 0.4 }));
  shade.position.set(0, Y + 0.08, 0.0); g.add(shade);
  // crown of glowing bulbs on her head
  const bulbG = new THREE.MeshPhysicalMaterial({ color: '#fff8e0', transmission: 0.7, roughness: 0.05, emissive: C('#ffd060'), emissiveIntensity: 2.5 });
  for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4, b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), bulbG); b.scale.y = 1.4; b.position.set(Math.sin(a) * 0.05, Y + 0.08 + Math.cos(a) * 0.03, 0.15 + Math.cos(a) * 0.02); g.add(b); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), new THREE.MeshStandardMaterial({ color: '#b0a080', metalness: 1, roughness: 0.3 })); base.position.set(b.position.x, b.position.y - 0.025, b.position.z); g.add(base); }
  for (const [x, y, z] of [[0, Y + 0.15, 0.1], [0, Y - 0.15, -0.3]]) { const l = new THREE.PointLight('#ffd070', 3, 2.5); l.position.set(x, y, z); g.add(l); }
  // her court: small moths circling
  for (let i = 0; i < 8; i++) { const s = T1.fluorescentMoth(); s.scale.setScalar(0.28); const a = (i / 8) * Math.PI * 2; s.position.set(Math.cos(a) * 0.75, (Y - 0.3) * 0.28 + 0.8 + Math.sin(i * 2) * 0.3, Math.sin(a) * 0.6); s.rotation.y = -a; g.add(s); }
  g.scale.setScalar(2.6); g.position.y = -0.9;
  return shadowAll(g);
}

// ============ THE MACHINE THAT ATE DAVE (Vending Mimic boss) ============
export function machineThatAteDave() {
  const g = new THREE.Group();
  const main = T1.vendingMimic(); main.scale.setScalar(1.45); g.add(main);
  for (const sx of [-1, 1]) { const s = T1.vendingMimic(); s.scale.setScalar(1.0); s.position.set(sx * 1.25, 0, -0.35); s.rotation.y = -sx * 0.45; s.rotation.z = sx * 0.06; g.add(s); }
  // Dave's arm hanging out of the main mouth, still wearing his watch
  const sleeve = new THREE.MeshPhysicalMaterial({ color: '#4a6aa8', roughness: 0.9, sheen: 0.4 });
  const skin = new THREE.MeshPhysicalMaterial({ color: '#d8a888', roughness: 0.55, sheen: 0.3, sheenColor: C('#ff9a8a') });
  const arm = new THREE.Group();
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.45, 16), sleeve); s1.position.y = -0.22; arm.add(s1);
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.32, 14), skin); fore.position.y = -0.6; arm.add(fore);
  const watch = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 20), new THREE.MeshStandardMaterial({ color: '#c8c8d0', metalness: 1, roughness: 0.2 })); watch.rotation.x = Math.PI / 2; watch.position.y = -0.7; arm.add(watch);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), skin); hand.scale.set(1.0, 1.2, 0.6); hand.position.y = -0.82; arm.add(hand);
  for (let f = 0; f < 4; f++) { const fg = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.06, 4, 8), skin); fg.position.set(-0.03 + f * 0.02, -0.9, 0.0); fg.rotation.x = 0.3; arm.add(fg); }
  arm.position.set(0.25, 1.38, 0.62); arm.rotation.set(-0.5, 0, 0.25); g.add(arm);
  const coin = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.25 });
  for (let i = 0; i < 60; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.005, 12), coin); c.position.set((rnd() - 0.5) * 1.6, 0.004 + rnd() * 0.01, 0.6 + rnd() * 0.5); c.rotation.set(rnd() * 0.3, 0, rnd() * 0.3); g.add(c); }
  const tag = canvasTex(256, 64, (c) => { c.fillStyle = '#f0e8c8'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#b01010'; c.font = 'bold 34px sans-serif'; c.fillText('OUT OF ORDER', 10, 44); });
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.1), new THREE.MeshPhysicalMaterial({ map: tag, roughness: 0.8 })); t.position.set(-0.05, 0.62, 0.575); g.add(t);
  return shadowAll(g);
}

// ============ OLD MAN COO (Pigeon Ghoul boss) ============
export function oldManCoo() {
  const g = new THREE.Group();
  const p = T1.pigeonGhoul();
  // flat cap and a moth-eaten scarf, in the pigeon's local space
  const tweed = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#5a4a3a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 64; i += 4) { c.fillStyle = 'rgba(30,20,10,0.4)'; c.fillRect(i, 0, 2, h); c.fillRect(0, i, w, 2); } });
  const capM = new THREE.MeshPhysicalMaterial({ map: tweed, roughness: 0.9, sheen: 0.5 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), capM); cap.scale.set(1.1, 0.45, 1.25); cap.position.set(0, 0.85, 0.44); p.add(cap);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.008, 20, 1, false, -1, 2), capM); brim.position.set(0, 0.85, 0.49); p.add(brim);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.025, 10, 24), new THREE.MeshPhysicalMaterial({ map: grimeTex('#7a1a1a', { rust: 30 }), roughness: 0.95, sheen: 0.5 })); scarf.position.set(0, 0.68, 0.3); scarf.rotation.x = 1.0; p.add(scarf);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.01), scarf.material); tail.position.set(0.04, 0.58, 0.36); tail.rotation.z = 0.2; p.add(tail);
  p.scale.setScalar(2.7); g.add(p);
  // dry fountain he nests in
  const stone = new THREE.MeshStandardMaterial({ map: grimeTex('#7a7470', { rust: 20 }), roughness: 0.9 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.35, 40, 1, true), stone); basin.position.y = 0.17; basin.material.side = THREE.DoubleSide; g.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.09, 10, 48), stone); rim.rotation.x = Math.PI / 2; rim.position.y = 0.35; g.add(rim);
  const nest = new THREE.MeshPhysicalMaterial({ color: '#6a5a3a', roughness: 1 });
  for (let i = 0; i < 160; i++) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.3 + rnd() * 0.3, 4), nest); const a = rnd() * Math.PI * 2, r = 0.6 + rnd() * 0.8; tw.position.set(Math.cos(a) * r, 0.06 + rnd() * 0.1, Math.sin(a) * r); tw.rotation.set(Math.PI / 2 + (rnd() - 0.5) * 0.5, 0, a + 1.57 + (rnd() - 0.5)); g.add(tw); }
  const crumbs = new THREE.MeshStandardMaterial({ color: '#c8a060', roughness: 0.9 });
  for (let i = 0; i < 60; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), crumbs); c.position.set((rnd() - 0.5) * 3, 0.01, 1.2 + rnd() * 0.8); c.rotation.y = rnd() * 3; g.add(c); }
  return shadowAll(g);
}

// ============ THE CONE KING (Borough boss, Floor 1) ============
export function coneKing() {
  const g = new THREE.Group();
  const k = makeGoblin({ variant: 1 }); strip(k, 'helmet', 'weapon', 'hubcap');
  // crown: a ring of small cones around a gold band
  const gold = new THREE.MeshStandardMaterial({ color: '#d8b040', metalness: 1, roughness: 0.2 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32, 1, true), gold); band.position.set(0, 1.72, 0.08); band.material.side = THREE.DoubleSide; k.add(band);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, c = trafficCone(i % 3 === 0 ? 0.18 : 0.12); c.position.set(Math.cos(a) * 0.14, 1.73, 0.08 + Math.sin(a) * 0.14); k.add(c); }
  for (let i = 0; i < 5; i++) { const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.015), new THREE.MeshPhysicalMaterial({ color: ['#e81a1a', '#1a8ae8', '#1ae84a'][i % 3], roughness: 0.05, clearcoat: 1, emissive: C('#300'), emissiveIntensity: 0.2 })); const a = (i / 5) * Math.PI * 2; gem.position.set(Math.cos(a) * 0.152, 1.72, 0.08 + Math.sin(a) * 0.152); k.add(gem); }
  // royal cape of stitched-together hi-vis and red velvet
  const capeTex = canvasTex(256, 512, (c, w, h) => { for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { c.fillStyle = ((x + y) / 64) % 2 ? '#8a1020' : '#d8f020'; c.fillRect(x, y, 64, 64); } c.strokeStyle = '#1a1a1a'; c.lineWidth = 3; c.setLineDash([6, 6]); for (let y = 0; y < h; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } for (let x = 0; x < w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } });
  const capeG = new THREE.PlaneGeometry(0.9, 1.4, 16, 24); const cp = capeG.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setZ(i, -Math.sin((x / 0.9 + 0.5) * Math.PI) * 0.2 - Math.sin(x * 25) * 0.03 * (0.7 - y)); }
  capeG.computeVertexNormals();
  const cape = new THREE.Mesh(capeG, new THREE.MeshPhysicalMaterial({ map: capeTex, roughness: 0.8, sheen: 0.8, sheenColor: C('#ff8a8a'), side: THREE.DoubleSide })); cape.position.set(0, 0.68, -0.16); k.add(cape);
  // traffic-light sceptre
  const sc = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 10), new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.8, roughness: 0.4 })); pole.position.y = 0.3; sc.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.09), new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.4, roughness: 0.5 })); box.position.y = 1.0; sc.add(box);
  ['#ff2a1a', '#ffb020', '#2aff4a'].forEach((col, i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), glow(col, i === 0 ? 3 : 0.6)); l.position.set(0, 1.09 - i * 0.09, 0.046); sc.add(l); });
  sc.position.set(...RIGHT_HAND); sc.position.y -= 0.35; sc.rotation.set(-0.1, 0, 0.12); k.add(sc);
  const red = new THREE.PointLight('#ff2a1a', 2, 2); red.position.set(RIGHT_HAND[0], RIGHT_HAND[1] + 0.8, RIGHT_HAND[2] + 0.2); k.add(red);
  k.scale.setScalar(2.4); k.position.set(0, 0.6, 0.2); g.add(k);
  // a throne-dais built of hundreds of cones
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.6, 32), new THREE.MeshStandardMaterial({ map: grimeTex('#5a5450', { rust: 30 }), roughness: 0.9 })); dais.position.y = 0.3; g.add(dais);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 14 + r * 6; i++) { const a = (i / (14 + r * 6)) * Math.PI * 2; if (Math.sin(a) > 0.55 && r < 2) continue; const c = trafficCone(0.4 - r * 0.05, i % 5 === 0 ? '#ffd020' : '#e8590c'); c.position.set(Math.cos(a) * (1.75 + r * 0.35), r === 2 ? 0 : 0.6, Math.sin(a) * (1.6 + r * 0.35) - 0.1); c.rotation.set((rnd() - 0.5) * 0.3, rnd() * 3, (rnd() - 0.5) * 0.3); g.add(c); }
  // the throne back: a fan of tall cones
  for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.225, c = trafficCone(1.2 + Math.cos(a) * 0.6, i % 2 ? '#e8590c' : '#ffd020'); c.position.set(Math.sin(a) * 1.0, 0.6, -0.9 + Math.cos(a) * 0.1); c.rotation.z = -a * 0.5; g.add(c); }
  return shadowAll(g);
}

// ============ THE LOST & FOUND (Borough boss, Floor 2) ============
export function lostAndFound() {
  const g = new THREE.Group();
  const H = 2.6;
  const sdf = (x, y, z) => {
    let d = ell(x, y, z, 0, 1.0, 0, 1.0, 1.05, 0.85); // hunched heap
    d = smin(d, ell(x, y, z, 0, 1.9, 0.25, 0.55, 0.5, 0.5), 0.3); // hump / head mass
    d = smin(d, ell(x, y, z, 0, 0.2, 0, 1.3, 0.3, 1.1), 0.3);
    for (const [sx, sz, h] of [[-1, 0.3, 1.5], [1, 0.4, 1.3], [-0.7, 0.8, 0.9], [0.6, 0.9, 0.7]]) d = smin(d, chain(x, y, z, [[sx * 0.7, h, sz], [sx * 1.2, h - 0.3, sz + 0.4], [sx * 1.35, 0.1, sz + 0.8]], [0.16, 0.12, 0.1], 0.1), 0.15); // four lumpy arms
    if (Math.abs(d) < 0.08) d += fbm(x * 3, y * 3, z * 3) * 0.06 + vnoise(x * 9, y * 9, z * 9) * 0.02;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#4a3a3a')).lerp(C('#1a1414'), clamp01(fbm(x * 3, y * 3, z * 3) + 0.4)); if (vnoise(x * 6, y * 6, z * 6) > 0.3) c.lerp(C('#6a5a4a'), 0.5); c.multiplyScalar(ao); };
  g.add(new THREE.Mesh(buildMesh(sdf, [-1.8, -0.1, -1.2], [1.8, 2.6, 2.0], 0.03, col), skinMaterial({ roughness: 0.85, clearcoat: 0.1, sheen: 0.5, sheenColor: '#8a7a6a', pore: 1.2, poreScale: 0.3 })));
  // lost property embedded all over it
  const items = [];
  const mats = { red: new THREE.MeshPhysicalMaterial({ color: '#c82a2a', roughness: 0.5 }), blue: new THREE.MeshPhysicalMaterial({ color: '#2a4ac8', roughness: 0.6 }), black: new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: 0.3, clearcoat: 0.8 }), tan: new THREE.MeshPhysicalMaterial({ color: '#a8804a', roughness: 0.8, sheen: 1 }), green: new THREE.MeshPhysicalMaterial({ color: '#2a8a3a', roughness: 0.5 }), yellow: new THREE.MeshPhysicalMaterial({ color: '#e8c020', roughness: 0.5 }), leather: new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a3a1a', { rust: 10 }), roughness: 0.6 }) };
  const screen = glow('#7ac8ff', 1.6);
  const makeItem = (k) => {
    const o = new THREE.Group();
    if (k === 0) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 8, 1, true), [mats.red, mats.blue, mats.black][Math.floor(rnd() * 3)]); c.material.side = THREE.DoubleSide; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), mats.black); h.position.y = -0.25; o.add(c, h); } // umbrella
    else if (k === 1) { o.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.26), [mats.red, mats.leather, mats.blue][Math.floor(rnd() * 3)])); } // shoe
    else if (k === 2) { o.add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.14), [mats.leather, mats.blue, mats.green][Math.floor(rnd() * 3)])); const hd = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), mats.black); hd.position.y = 0.16; o.add(hd); } // suitcase
    else if (k === 3) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mats.tan); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), mats.tan); hd.position.y = 0.13; o.add(b, hd); for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), mats.tan); e.position.set(sx * 0.05, 0.19, 0); o.add(e); } } // teddy
    else if (k === 4) { o.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.01), mats.black)); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.12), screen); s.position.z = 0.006; o.add(s); } // phone
    else if (k === 5) { o.add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 20), [mats.red, mats.yellow, mats.green][Math.floor(rnd() * 3)])); } // swim ring / bracelet
    else { o.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.14, 4, 8), [mats.yellow, mats.red][Math.floor(rnd() * 2)])); } // glove
    return o;
  };
  for (let i = 0; i < 140; i++) {
    const u = rnd(), v = rnd(); const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1) * 0.85;
    const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
    // march from the centre out to the surface
    const p = new THREE.Vector3(0, 1.1, 0.1); for (let s = 0; s < 40 && sdf(p.x, p.y, p.z) < 0; s++) p.addScaledVector(dir, 0.06);
    const it = makeItem(Math.floor(rnd() * 7)); it.position.copy(p); it.lookAt(p.clone().add(dir)); it.rotateZ(rnd() * 6); g.add(it);
  }
  // mismatched eyes peering out from the pile
  const eyeKinds = [eyeTexture({ pupil: 'round', iris: ['#2a8aff', '#1a5ac8', '#0a2a6a', '#000'] }), eyeTexture({ pupil: 'slit' }), eyeTexture({ pupil: 'goat', iris: ['#8aff2a', '#5ac81a', '#2a6a0a', '#000'] })];
  for (const [x, y, z, r] of [[-0.2, 2.15, 0.7, 0.08], [0.22, 2.1, 0.68, 0.06], [0.0, 1.9, 0.75, 0.05], [-0.45, 1.6, 0.8, 0.04], [0.5, 1.75, 0.7, 0.05], [0.1, 1.45, 0.86, 0.035]]) { const e = eyeMesh(eyeKinds[Math.floor(rnd() * 3)], r, 0.25); e.position.set(x, y, z); g.add(e); }
  const sign = canvasTex(512, 128, (c) => { c.fillStyle = '#1a3a6a'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#f0f0f0'; c.font = 'bold 70px sans-serif'; c.fillText('LOST & FOUND', 18, 92); });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshPhysicalMaterial({ map: sign, roughness: 0.5, metalness: 0.3 })); sg.position.set(0.2, 2.45, 0.45); sg.rotation.set(-0.3, 0, -0.15); g.add(sg);
  return shadowAll(g);
}

// ============ GRANDMA GRISTLE (Borough boss, Floor 3) ============
export function grandmaGristle() {
  const g = new THREE.Group();
  const B = humanoid({ height: 3.1, bulk: 1.5, belly: 1.6, shoulders: 1.2, head: 1.05, hunch: 0.9, armL: 'forward', armR: 'raised', nose: 'long', ears: 'point', jaw: 'heavy', legBulk: 1.4 });
  const s = B.scale, hc = B.headCenter, hsc = B.headScale;
  const dress = (x, y, z) => { const ux = x / s, uy = y / s, uz = z / s; let d = rcone(ux, uy, uz, 0, 0.02, 0.05, 0, 1.45, 0.1, 0.55, 0.3); d = Math.max(d, -rcone(ux, uy, uz, 0, -0.05, 0.05, 0, 1.4, 0.1, 0.52, 0.27)); d = Math.max(d, 0.02 - uy); if (Math.abs(d) < 0.03) d += Math.sin(Math.atan2(ux, uz) * 14 + uy * 2) * 0.008; return d * s; };
  const bun = (x, y, z) => sph(x, y, z, hc[0], hc[1] + 0.16 * hsc, hc[2] - 0.08 * hsc, 0.11 * hsc) + vnoise(x * 40, y * 40, z * 40) * 0.006;
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), dress(x, y, z), bun(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const db = B.sdf(x, y, z), dd = dress(x, y, z), dh = bun(x, y, z);
    if (dh < db && dh < dd) c.copy(C('#d8d4cc')).lerp(C('#8a8680'), clamp01(vnoise(x * 60, y * 60, z * 60) + 0.3));
    else if (dd < db) { c.copy(C('#5a2a4a')); const flower = vnoise(x * 18, y * 18, z * 18); if (flower > 0.45) c.copy(C('#e8b8c8')); if (z > 0.15 * s && Math.abs(x) < 0.3 * s && y < 1.3 * s && y > 0.25 * s) { c.copy(C('#e8e0d0')).lerp(C('#8a6a2a'), clamp01(vnoise(x * 8, y * 8, z * 8) + 0.1)); } c.lerp(C('#2a1a10'), clamp01(fbm(x * 6, y * 6, z * 6) * 0.5)); } // floral dress + stained apron
    else { c.copy(C('#9aa88a')).lerp(C('#5a6a4a'), clamp01(fbm(x * 10, y * 10, z * 10) + 0.4)); if (vnoise(x * 40, y * 40, z * 40) > 0.6) c.lerp(C('#3a2a1a'), 0.6); if (z > hc[2] + 0.13 * hsc && Math.abs(y - hc[1] + 0.07 * hsc) < 0.06 * hsc) c.lerp(C('#a85a4a'), 0.5); }
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[0] -= 0.35; mx[0] += 0.35; mn[2] -= 0.2; mx[1] += 0.2;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.016, col), skinMaterial({ roughness: 0.68, clearcoat: 0.2, sheen: 0.4, sheenColor: '#8a7a7a', pore: 1, poreScale: 0.55 })));
  for (const p of B.eyes) { const e = eyeMesh(eyeTexture({ sclera: '#d8d0b0', iris: ['#c8e8ff', '#88a8c8', '#4a6a8a', '#101820'], pupil: 'round', irisR: 55, veins: 100 }), B.eyeR, 0.05); e.position.set(...p); g.add(e); }
  // spectacles, knitting needles in the bun, pearl necklace
  const wire = new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.25 });
  for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045 * hsc, 0.004 * hsc, 6, 24), wire); r.position.set(hc[0] + sx * 0.056 * hsc, B.eyes[0][1], B.eyes[0][2] + 0.02); g.add(r); }
  for (const sx of [-1, 1]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.45, 8), new THREE.MeshPhysicalMaterial({ color: '#c82a6a', roughness: 0.3, clearcoat: 1 })); n.position.set(hc[0] + sx * 0.04, hc[1] + 0.2 * hsc, hc[2] - 0.1 * hsc); n.rotation.z = sx * 0.6; g.add(n); }
  const pearl = new THREE.MeshPhysicalMaterial({ color: '#f4f0e8', roughness: 0.15, clearcoat: 1, iridescence: 0.5 });
  for (let i = 0; i < 22; i++) { const a = -1.3 + i * (2.6 / 21); const p = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), pearl); p.position.set(Math.sin(a) * 0.23 * s, 1.36 * s - Math.cos(a) * 0.05 * s + 0.06, (0.17 + Math.cos(a) * 0.1) * s); g.add(p); }
  // rolling pin raised overhead
  const pinM = new THREE.MeshPhysicalMaterial({ map: grimeTex('#a8784a', { rust: 15 }), roughness: 0.6 });
  const pin = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 20), pinM); pin.add(body); for (const sy of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10), pinM); h.position.y = sy * 0.46; pin.add(h); }
  pin.position.set(...B.handR); pin.rotation.z = Math.PI / 2 - 0.3; g.add(pin);
  // the great cauldron at her side, bubbling
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#3a3634', { rust: 150 }), metalness: 0.8, roughness: 0.6, side: THREE.DoubleSide });
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 20, 0, Math.PI * 2, 0.45, Math.PI - 0.45), iron); pot.position.set(1.5, 0.78, 0.6); g.add(pot);
  for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.4, 8), iron); const a = (i / 3) * Math.PI * 2; leg.position.set(1.5 + Math.cos(a) * 0.5, 0.18, 0.6 + Math.sin(a) * 0.5); g.add(leg); }
  const brew = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), new THREE.MeshPhysicalMaterial({ color: '#8a6a10', emissive: C('#6a3a00'), emissiveIntensity: 0.9, roughness: 0.15, clearcoat: 1 })); brew.rotation.x = -Math.PI / 2; brew.position.set(1.5, 1.38, 0.6); g.add(brew);
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03 + rnd() * 0.05, 12, 8), brew.material); b.position.set(1.5 + (rnd() - 0.5) * 1.0, 1.39, 0.6 + (rnd() - 0.5) * 1.0); g.add(b); }
  const bone = new THREE.MeshPhysicalMaterial({ color: '#e0d4b8', roughness: 0.5 });
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.35, 4, 8), bone); b.position.set(1.5 + (rnd() - 0.5) * 0.6, 1.45, 0.6 + (rnd() - 0.5) * 0.6); b.rotation.set(rnd() * 3, 0, rnd() * 3); g.add(b); }
  const l = new THREE.PointLight('#ffa020', 6, 4); l.position.set(1.5, 1.9, 0.6); g.add(l);
  const steam = new THREE.MeshBasicMaterial({ color: '#e8e0c0', transparent: true, opacity: 0.12, depthWrite: false });
  for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.2 + i * 0.05, 12, 8), steam); p.position.set(1.5 + Math.sin(i) * 0.2, 1.6 + i * 0.18, 0.6 + Math.cos(i) * 0.15); g.add(p); }
  return shadowAll(g);
}
