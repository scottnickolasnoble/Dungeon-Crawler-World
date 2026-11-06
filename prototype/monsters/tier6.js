// Tier 6 monsters (Floors 16-18: The Network Core).
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';

const C = (h) => new THREE.Color(h);
const pickV = (v, arr, k = 0) => arr[(v + k * 7) % arr.length];
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glowMat = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
const staticTex = (tint = '#ffffff') => canvasTex(128, 96, (c, w, h) => { for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) { const v = rnd() * 255; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(x, y, 2, 2); } c.globalCompositeOperation = 'multiply'; c.fillStyle = tint; c.fillRect(0, 0, w, h); });
const screenMat = (tex, k = 1.6) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(k, k, k) });

// ============ RATINGS WRAITH ============
// A mirror-black figure copying the top contestant, with live ratings scrolling across its skin.
export function ratingsWraith({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.05, bulk: 1.0, shoulders: 1.05, head: 1.0, hunch: 0.2, armL: 'forward', armR: 'raised', nose: 'flat', ears: 'none', skinNoise: 0.2 });
  const sdf = (x, y, z) => B.sdf(x, y, z) + Math.max(0, vnoise(x * 6, y * 30, z * 6)) * 0.01 * (y > 1.2 ? 1 : 0.3);
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.setRGB(0.04, 0.04, 0.06); if (Math.abs(Math.sin(y * 40)) < 0.06) c.setRGB(0.1, 0.45, 0.6); c.multiplyScalar(ao); };
  const [mn, mx] = B.bbox;
  const chrome = new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 1, roughness: 0.08, clearcoat: 1, emissive: C('#0a3a5a'), emissiveIntensity: 0.25 });
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.009, col), chrome));
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR, 12, 8), glowMat('#3ae0ff', 4)); e.position.set(...p); g.add(e); }
  // floating ratings ticker ring and a crown of viewer-count numbers
  const tick = canvasTex(1024, 64, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.font = 'bold 40px monospace'; c.fillStyle = '#3affea'; c.fillText('RATINGS 98.4 ▲  VIEWERS 9,120,441,007 ▲  SHARE 71% ▲  TRENDING #1 ▲', 10, 46); });
  tick.wrapS = THREE.RepeatWrapping;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 64, 1, true), new THREE.MeshBasicMaterial({ map: tick, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); ring.position.y = 1.3; g.add(ring);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 40), glowMat('#ffd040', 3)); crown.position.set(B.headTop[0], B.headTop[1] + 0.08, B.headTop[2]); crown.rotation.x = Math.PI / 2; g.add(crown);
  { const l = new THREE.PointLight('#3ae0ff', 3, 3); l.position.set(0, 1.4, 0.6); g.add(l); }
  return shadowAll(g);
}
ratingsWraith.variants = true;

// ============ CENSOR SERAPH ============
// A many-eyed angel whose wings are layered black redaction bars; its halo flashes BLEEP.
export function censorSeraph({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const Y = 1.6;
  // the core: a smooth white ring of flesh studded with eyes
  const sdf = (x, y, z) => { const q = Math.hypot(Math.hypot(x, y - Y) - 0.35, z) - 0.12; let d = q; d = smin(d, sph(x, y, z, 0, Y, 0, 0.16), 0.1); if (Math.abs(d) < 0.02) d += vnoise(x * 30, y * 30, z * 30) * 0.003; return d; };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#f0ece4')).lerp(C('#c8a880'), clamp01(vnoise(x * 9, y * 9, z * 9) * 0.5 + 0.2)); c.multiplyScalar(ao); };
  g.add(new THREE.Mesh(buildMesh(sdf, [-0.55, Y - 0.55, -0.2], [0.55, Y + 0.55, 0.2], 0.007, col), skinMaterial({ roughness: 0.3, clearcoat: 0.8, sheen: 0.6, sheenColor: '#ffe8d0', pore: 0.3 })));
  const et = eyeTexture({ sclera: '#f4f0e8', iris: ['#2a8aff', '#1a5ac8', '#0a2a6a', '#000814'], pupil: 'round', irisR: 90, veins: 30 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, e = eyeMesh(et, 0.045, 0.3, '#6ab0ff'); e.position.set(Math.cos(a) * 0.35, Y + Math.sin(a) * 0.35, 0.1); e.rotation.y = 0; g.add(e); }
  const big = eyeMesh(et, 0.11, 0.5, '#6ab0ff'); big.position.set(0, Y, 0.1); g.add(big);
  // six wings made of stacked black bars
  const bar = new THREE.MeshPhysicalMaterial({ color: '#050505', roughness: 0.25, clearcoat: 1 });
  for (let w = 0; w < 6; w++) {
    const side = w % 2 ? 1 : -1, tier = Math.floor(w / 2), base = (tier - 1) * 0.55;
    for (let k = 0; k < 9; k++) { const len = 0.5 + k * 0.1 - tier * 0.1; const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.015), bar); b.geometry.translate(len / 2, 0, 0); b.position.set(side * 0.4, Y + base * 0.6, -0.05 - k * 0.01); b.rotation.z = side > 0 ? (base * 0.6 + 0.9 - k * 0.15) : Math.PI - (base * 0.6 + 0.9 - k * 0.15); g.add(b); }
  }
  // the BLEEP halo
  const bleep = canvasTex(1024, 96, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff2a2a'; c.font = 'bold 72px monospace'; for (let i = 0; i < 5; i++) c.fillText('BLEEP', 20 + i * 205, 74); });
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.09, 64, 1, true), new THREE.MeshBasicMaterial({ map: bleep, side: THREE.DoubleSide, color: new THREE.Color(1.8, 1.8, 1.8) })); halo.position.y = Y + 0.65; g.add(halo);
  const glow = new THREE.PointLight('#ffffff', 4, 4); glow.position.set(0, Y, 0.6); g.add(glow);
  const glow2 = new THREE.PointLight('#ff2a2a', 2, 2); glow2.position.set(0, Y + 0.7, 0.3); g.add(glow2);
  return shadowAll(g);
}
censorSeraph.variants = true;

// ============ PRODUCER DRONE SWARM ============
// Camera drones: a lens eye, four rotors, a red REC light and a clipboard arm. One leader, several followers.
function drone(scale, team) {
  const d = new THREE.Group();
  const shell = new THREE.MeshPhysicalMaterial({ map: grimeTex(team, { rust: 5, scratches: 1200 }), metalness: 0.5, roughness: 0.3, clearcoat: 0.8 });
  const blk = new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0.7, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), shell); body.scale.set(1.2, 0.7, 1.0); d.add(body);
  const lensH = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.12, 24), blk); lensH.rotation.x = Math.PI / 2; lensH.position.set(0, -0.03, 0.15); d.add(lensH);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshPhysicalMaterial({ color: '#1a2a4a', metalness: 0.2, roughness: 0.02, clearcoat: 1, iridescence: 1 })); glass.position.set(0, -0.03, 0.211); d.add(glass);
  const rec = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), glowMat('#ff1a1a', 5)); rec.position.set(0.1, 0.06, 0.1); d.add(rec);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.03), blk); arm.position.set(Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17); arm.rotation.y = -a; d.add(arm);
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.004, 24), new THREE.MeshBasicMaterial({ color: '#888', transparent: true, opacity: 0.25 })); rotor.position.set(Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3); d.add(rotor);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 12), blk); motor.position.set(Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3); d.add(motor);
  }
  d.scale.setScalar(scale); return d;
}
export function producerDrones({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const team = pickV(variant, ['#e8e8e8', '#e8a010', '#1a1a1a']);
  const lead = drone(1.6, team); lead.position.set(0, 1.6, 0); lead.rotation.set(0.2, -0.3, 0.1); g.add(lead);
  // the leader carries a boom mic and a clipboard on articulated arms
  const blk = new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0.7, roughness: 0.4 });
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 8), blk); boom.position.set(0.35, 1.45, 0.2); boom.rotation.z = 1.1; g.add(boom);
  const mic = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.14, 6, 12), new THREE.MeshPhysicalMaterial({ color: '#5a5a5a', roughness: 1, sheen: 1, sheenColor: C('#aaa') })); mic.position.set(0.75, 1.27, 0.2); mic.rotation.z = Math.PI / 2; g.add(mic);
  const clip = canvasTex(192, 256, (c, w, h) => { c.fillStyle = '#f0ead8'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = 'bold 22px sans-serif'; c.fillText('SCENE 14', 20, 40); c.font = '16px sans-serif'; ['- more blood', '- add pit', '- cue crowd', '- kill hero?'].forEach((t, i) => c.fillText(t, 20, 80 + i * 30)); });
  const cb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.01), new THREE.MeshPhysicalMaterial({ color: '#6a4a2a', roughness: 0.6 })); cb.position.set(-0.35, 1.35, 0.25); cb.rotation.set(-0.3, 0.4, 0.1); g.add(cb);
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.19), new THREE.MeshPhysicalMaterial({ map: clip, roughness: 0.8 })); pg.position.set(-0.348, 1.35, 0.258); pg.rotation.set(-0.3, 0.4, 0.1); g.add(pg);
  // followers in formation
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, f = drone(0.8, team); f.position.set(Math.cos(a) * 1.0, 1.1 + Math.sin(i * 2.3) * 0.5, Math.sin(a) * 0.7 - 0.2); f.rotation.set(rnd() * 0.4 - 0.2, -a + Math.PI / 2, rnd() * 0.4 - 0.2); g.add(f); }
  // spotlight cones from the drones
  const sp = new THREE.SpotLight('#fff4e0', 25, 6, 0.35, 0.5, 1.2); sp.position.set(0, 1.55, 0.3); sp.target.position.set(0, 0, 1.5); g.add(sp, sp.target);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#fff4e0', transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(0, 0.8, 0.9); cone.rotation.x = -0.5; g.add(cone);
  return shadowAll(g);
}
producerDrones.variants = true;

// ============ ALGORITHM HYDRA ============
// Five serpent necks of braided cable rising from a server rack; each head is a different screen-faced predator.
export function algorithmHydra({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const rackM = new THREE.MeshPhysicalMaterial({ map: grimeTex('#1a1c20', { rust: 10, scratches: 1500 }), metalness: 0.8, roughness: 0.35 });
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.8), rackM); rack.position.y = 0.5; g.add(rack);
  for (let i = 0; i < 14; i++) { const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.005), glowMat(['#2aff4a', '#ffb020', '#3ac8ff'][i % 3], 3)); led.position.set(-0.5 + (i % 7) * 0.08, 0.2 + Math.floor(i / 7) * 0.3, 0.402); g.add(led); }
  const cableC = ['#1a1a1a', '#c81a1a', '#1a5ac8', '#e8c020', '#2a8a2a'];
  const headTex = [staticTex('#88ffcc'), staticTex('#ff88cc'), staticTex('#88ccff'), staticTex('#ffee88'), staticTex('#cc88ff')];
  for (let h = 0; h < 5; h++) {
    const a = -1.0 + h * 0.5, height = 1.6 + Math.sin(h * 2.1) * 0.35;
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(Math.sin(a) * (0.2 + t * 0.9) + Math.sin(t * 6 + h) * 0.08, 0.9 + t * height - Math.max(0, t - 0.85) * 0.6, Math.cos(a) * 0.1 + t * 0.6 + Math.cos(t * 5 + h) * 0.08)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let s = 0; s < 4; s++) { const off = new THREE.Vector3(Math.cos(s * 1.6) * 0.03, 0, Math.sin(s * 1.6) * 0.03); const cp = pts.map((p, k) => p.clone().add(off.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), k * 0.6))); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), 60, 0.022, 8), new THREE.MeshPhysicalMaterial({ color: cableC[(h + s) % 5], roughness: 0.35, clearcoat: 0.6 }))); }
    // head: a wedge-shaped monitor with a mouth of fibre-optic teeth
    const end = curve.getPoint(1), dir = curve.getTangent(1);
    const head = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.34), rackM); head.add(shell);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.14), screenMat(headTex[h])); face.position.z = 0.171; head.add(face);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.26), rackM); jaw.position.set(0, -0.14, 0.03); jaw.rotation.x = 0.4; head.add(jaw);
    const fib = glowMat(['#3affea', '#ff3af0', '#3ac8ff', '#ffe03a', '#c83aff'][h], 3);
    for (let t = 0; t < 7; t++) { const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.06, 5), fib); tooth.position.set(-0.1 + t * 0.033, -0.1, 0.15); tooth.rotation.x = Math.PI; head.add(tooth); }
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), fib); e.position.set(sx * 0.08, 0.04, 0.175); head.add(e); }
    head.position.copy(end); head.lookAt(end.clone().add(new THREE.Vector3(dir.x, 0, dir.z).normalize().add(new THREE.Vector3(0, -0.3, 1)))); g.add(head);
    { const l = new THREE.PointLight(['#3affea', '#ff3af0', '#3ac8ff', '#ffe03a', '#c83aff'][h], 1.2, 1.5); l.position.copy(end).add(new THREE.Vector3(0, 0, 0.3)); g.add(l); }
  }
  return shadowAll(g);
}
algorithmHydra.variants = true;

// ============ EXECUTIVE SHADE ============
// A faceless silhouette in a perfect suit; its head is a void, its tie a ribbon of gold, its pen drips ink.
export function executiveShade({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.15, bulk: 0.9, belly: 0.1, shoulders: 1.15, head: 1.0, hunch: 0.0, armL: 'hip', armR: 'forward', nose: 'none', ears: 'none', jaw: 'normal', legBulk: 0.85, skinNoise: 0 });
  const s = B.scale;
  // suit jacket shell with lapels
  const jacket = (x, y, z) => { const ux = x / s, uy = y / s, uz = z / s; let d = ell(ux, uy, uz, 0, 1.12, 0.03, 0.3, 0.32, 0.19); d = smin(d, ell(Math.abs(ux), uy, uz, 0.25, 1.3, 0.0, 0.1, 0.07, 0.1), 0.06); d = Math.max(d, 0.72 - uy); d = smax(d, -rcone(ux, uy, uz, 0, 1.38, 0.2, 0, 1.0, 0.2, 0.09, 0.0), 0.01); return d * s; };
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), jacket(x, y, z));
  const suitC = pickV(variant, ['#14161c', '#1c1418', '#141c18']);
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C(suitC)); if (Math.abs(Math.sin(x * 120)) < 0.08) c.lerp(C('#3a3a44'), 0.6); c.multiplyScalar(ao); }; // pinstripe
  const [mn, mx] = B.bbox; mn[0] -= 0.1; mx[0] += 0.1;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.008, col), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, sheen: 0.35, sheenColor: C('#3a3a4a'), sheenRoughness: 0.5, color: '#6a6a78' })));
  // the head: a perfect black void swallowing light, rimmed by a faint corona
  const voidM = new THREE.MeshBasicMaterial({ color: '#000000' });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * B.headScale, 32, 24), voidM); head.position.set(B.headCenter[0], B.headCenter[1] - 0.02, B.headCenter[2] + 0.035); head.scale.set(1, 1.15, 1.12); g.add(head);
  const corona = new THREE.Mesh(new THREE.TorusGeometry(0.235 * B.headScale, 0.008, 8, 48), glowMat('#c8a040', 2)); corona.position.copy(head.position); g.add(corona);
  // white shirt, gold tie, cufflinks
  const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.3), new THREE.MeshPhysicalMaterial({ color: '#e8e8e8', roughness: 0.6 })); shirt.position.set(0, 1.22 * s, 0.2 * s); g.add(shirt);
  const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.32), new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.25, side: THREE.DoubleSide })); tie.position.set(0, 1.18 * s, 0.205 * s); g.add(tie);
  // golden pen held out, dripping ink, and a briefcase
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.16, 12), new THREE.MeshStandardMaterial({ color: '#d8b040', metalness: 1, roughness: 0.15 })); pen.position.set(...B.handR); pen.rotation.x = 1.3; g.add(pen);
  const ink = new THREE.MeshPhysicalMaterial({ color: '#050510', roughness: 0.05, clearcoat: 1 });
  for (let i = 0; i < 4; i++) { const dr = new THREE.Mesh(new THREE.SphereGeometry(0.01 - i * 0.0015, 8, 6), ink); dr.position.set(B.handR[0], B.handR[1] - 0.05 - i * 0.12, B.handR[2] + 0.08); dr.scale.y = 1.6; g.add(dr); }
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.12, 24), ink); pool.rotation.x = -Math.PI / 2; pool.position.set(B.handR[0], 0.004, B.handR[2] + 0.08); g.add(pool);
  const leather = new THREE.MeshPhysicalMaterial({ map: grimeTex('#2a1a10', { rust: 5 }), roughness: 0.4, clearcoat: 0.6 });
  const bc = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.1), leather); bc.position.set(0.42 * s, 0.4 * s, 0.05); g.add(bc);
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.2 })); clasp.position.set(0.42 * s, 0.52 * s, 0.11); g.add(clasp);
  // contracts drifting around it
  const doc = canvasTex(192, 256, (c, w, h) => { c.fillStyle = '#f4f0e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = 'bold 20px serif'; c.fillText('CONTRACT', 40, 34); for (let y = 54; y < 210; y += 10) c.fillRect(16, y, 160 * (0.6 + rnd() * 0.4), 2); c.strokeStyle = '#222'; c.beginPath(); c.moveTo(20, 236); c.lineTo(170, 236); c.stroke(); c.fillText('X', 20, 232); });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24), new THREE.MeshPhysicalMaterial({ map: doc, roughness: 0.8, side: THREE.DoubleSide })); const a = (i / 6) * Math.PI * 2; p.position.set(Math.cos(a) * 0.7, 0.8 + i * 0.22, Math.sin(a) * 0.5); p.rotation.set(rnd() - 0.5, -a, rnd() - 0.5); g.add(p); }
  { const l = new THREE.PointLight('#c8a040', 1.5, 2.5); l.position.set(0, 1.9, 0.6); g.add(l); }
  return shadowAll(g);
}
executiveShade.variants = true;
