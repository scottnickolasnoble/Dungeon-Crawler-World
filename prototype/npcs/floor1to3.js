// Floor 1-3 hub NPCs: traders and quest givers. All original characters.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';
import { pigeonGhoul } from '../monsters/tier1.js';

const C = (h) => new THREE.Color(h);
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glow = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });
const humanEye = (iris) => eyeTexture({ sclera: '#f0ece4', iris, pupil: 'round', irisR: 62, veins: 12 });
function addEyes(g, B, tex, k = 0.85) { for (const p of B.eyes) { const e = eyeMesh(tex, B.eyeR * k, 0.02); e.position.set(...p); g.add(e); } }
// stringy or short hair as tubes from the scalp; `faceClear` keeps the forehead free
function hair(g, B, { n = 90, len = 0.09, color = '#3a2a1a', droop = 0.06, thick = 0.003, top = 0.25, faceClear = 0.55 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, sheen: 1, sheenColor: C('#ffffff').lerp(C(color), 0.5) });
  const hc = B.headCenter, r = 0.14 * B.headScale;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, el = top + rnd() * (1.45 - top);
    if (Math.cos(a) > faceClear && el < 1.1) continue;
    const root = new THREE.Vector3(hc[0] + Math.sin(a) * Math.cos(el) * r, hc[1] + Math.sin(el) * r * 0.98, hc[2] + Math.cos(a) * Math.cos(el) * r - 0.01);
    const pts = [root]; let p = root.clone(); const out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    for (let k = 1; k <= 4; k++) { p = p.clone().addScaledVector(out, len * 0.18).add(new THREE.Vector3((rnd() - 0.5) * 0.01, -droop * k * 0.35, -0.004)); pts.push(p); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, thick, 4), m));
  }
}
const label = (text, bg = '#e8e0c8', fg = '#1a1a1a') => canvasTex(256, 96, (c) => { c.fillStyle = bg; c.fillRect(0, 0, 256, 96); c.fillStyle = fg; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText(text, 128, 62); });

// ============ MARTA VANCE — Lifer ex-nurse, leader of Stairwell Camp (Floor 1) ============
export function martaVance() {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.7, bulk: 0.9, belly: 0.15, shoulders: 0.95, head: 1.0, hunch: 0.1, armL: 'hip', armR: 'down', nose: 'flat', ears: 'round', jaw: 'normal', legBulk: 0.95, skinNoise: 0.35 });
  const s = B.scale;
  const vest = (x, y, z) => { const ux = x / s, uy = y / s, uz = z / s; let d = (B.sdf(x, y, z) / s) - 0.012; d = Math.max(d, 0.98 - uy); d = Math.max(d, uy - 1.36); d = Math.max(d, Math.abs(ux) - 0.24); d = smax(d, -rcone(ux, uy, uz, 0, 1.4, 0.25, 0, 1.0, 0.25, 0.07, 0.02), 0.01); return d * s; };
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), vest(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const u = y / s;
    if (vest(x, y, z) < B.sdf(x, y, z)) { c.copy(C('#5a3a22')).lerp(C('#2a1a10'), clamp01(vnoise(x * 30, y * 30, z * 30) + 0.3)); }
    else if (u > 1.47) { c.copy(C('#8a6050')).lerp(C('#5a3a30'), clamp01(fbm(x * 20, y * 20, z * 20) + 0.4)); } // skin
    else if (u > 0.86) { c.copy(C('#3a8a8a')).lerp(C('#1a4a4a'), clamp01(vnoise(x * 12, y * 12, z * 12) + 0.3)); if (Math.abs(x / s) > 0.3 && u < 1.12) c.copy(C('#8a6050')); } // teal scrub top, bare forearms
    else if (u > 0.1) c.copy(C('#2a5a6a')).lerp(C('#1a2a2a'), clamp01(vnoise(x * 14, y * 14, z * 14) + 0.3)); // scrub trousers
    else c.copy(C('#1a1410'));
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.0065, col), skinMaterial({ roughness: 0.65, clearcoat: 0.1, sheen: 0.4, sheenColor: '#a88a7a', pore: 0.5, poreScale: 1.2 })));
  addEyes(g, B, humanEye(['#6a4a2a', '#4a3018', '#2a1a0a', '#000']));
  hair(g, B, { n: 220, len: 0.05, color: '#b8b4ac', droop: 0.012, thick: 0.004, top: 0.05 }); // short grey crop
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.15 * B.headScale, 0.018, 8, 32), new THREE.MeshPhysicalMaterial({ color: '#b01818', roughness: 0.8 })); band.position.set(B.headCenter[0], B.headCenter[1] + 0.05, B.headCenter[2] - 0.01); band.rotation.x = Math.PI / 2 - 0.25; g.add(band);
  // red-cross armband, med satchel, stethoscope, a clipboard of camp rotas
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.07, 18, 1, true), new THREE.MeshPhysicalMaterial({ map: canvasTex(128, 64, (c) => { c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#c81a1a'; c.fillRect(54, 8, 20, 48); c.fillRect(40, 22, 48, 20); }), roughness: 0.7, side: THREE.DoubleSide }));
  arm.position.set(-0.32 * s, 1.17 * s, 0.0); arm.rotation.z = -0.1; g.add(arm);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.1), new THREE.MeshPhysicalMaterial({ map: grimeTex('#6a3a1a', { rust: 20 }), roughness: 0.7 })); bag.position.set(0.26 * s, 0.82 * s, 0.05); g.add(bag);
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.17 * s, 1.36 * s, 0.08), new THREE.Vector3(0.0, 1.15 * s, 0.17 * s), new THREE.Vector3(0.24 * s, 0.9 * s, 0.07)]), 20, 0.012, 6), bag.material); g.add(strap);
  const steth = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.006, 6, 24, Math.PI * 1.3), new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.4 })); steth.position.set(0, 1.4 * s, 0.11 * s); steth.rotation.set(1.2, 0, Math.PI * 0.85); g.add(steth);
  const cb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.012), new THREE.MeshPhysicalMaterial({ color: '#7a5a3a', roughness: 0.6 })); cb.position.set(...B.handR); cb.position.y += 0.08; cb.position.z += 0.06; cb.rotation.x = -0.2; g.add(cb);
  return shadowAll(g);
}

// ============ PICKLES — Gutterkin (rat-folk) junk dealer (Floor 1) ============
export function pickles() {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.4, bulk: 0.8, belly: 0.4, shoulders: 0.85, head: 1.15, hunch: 1.1, armL: 'forward', armR: 'reach', nose: 'none', ears: 'none', jaw: 'normal', legBulk: 0.75, skinNoise: 0.3 });
  const s = B.scale, hc = B.headCenter, hs = B.headScale;
  const tip = [hc[0], hc[1] - 0.06 * hs, hc[2] + 0.3 * hs];
  const extra = (x, y, z) => {
    let d = rcone(x, y, z, hc[0], hc[1] - 0.02 * hs, hc[2] + 0.1 * hs, tip[0], tip[1], tip[2], 0.08 * hs, 0.025 * hs); // long snout
    for (const sx of [-1, 1]) { const e = ell(x, y, z, hc[0] + sx * 0.12 * hs, hc[1] + 0.12 * hs, hc[2] - 0.02, 0.075 * hs, 0.085 * hs, 0.018 * hs); d = Math.min(d, Math.max(e, -ell(x, y, z, hc[0] + sx * 0.12 * hs, hc[1] + 0.12 * hs, hc[2] + 0.01, 0.06 * hs, 0.07 * hs, 0.02 * hs))); } // big round ears
    d = smin(d, chain(x, y, z, [[0, 0.82 * s, -0.12 * s], [0.08, 0.5 * s, -0.4 * s], [0.25, 0.15 * s, -0.5 * s], [0.4, 0.04, -0.35 * s]], [0.035, 0.025, 0.015, 0.008], 0.02), 0.03); // tail
    return d;
  };
  const coat = (x, y, z) => { const ux = x / s, uy = y / s, uz = z / s; let d = rcone(ux, uy, uz, 0, 0.35, 0.05, 0, 1.36, 0.12, 0.3, 0.25); d = Math.max(d, -rcone(ux, uy, uz, 0, 0.3, 0.05, 0, 1.33, 0.12, 0.27, 0.22)); d = smax(d, -rcone(ux, uy, uz, 0, 0.3, 0.32, 0, 1.3, 0.3, 0.1, 0.06), 0.02); d = Math.max(d, 0.35 - uy - vnoise(ux * 20, 0, uz * 20) * 0.04); return d * s; };
  const sdf = (x, y, z) => { let d = Math.min(smin(B.sdf(x, y, z), extra(x, y, z), 0.02), coat(x, y, z)); if (Math.abs(d) < 0.015) d += (Math.abs(vnoise(x * 140, y * 140, z * 140)) - 0.3) * 0.003; return d; };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    if (coat(x, y, z) < Math.min(B.sdf(x, y, z), extra(x, y, z))) { c.copy(C('#3a4a2a')).lerp(C('#1a2010'), clamp01(fbm(x * 10, y * 10, z * 10) + 0.4)); const patch = vnoise(x * 7, y * 7, z * 7); if (patch > 0.4) c.copy(C('#6a3a2a')); if (patch < -0.5) c.copy(C('#3a3a5a')); } // patched coat
    else { c.copy(C('#6a5a52')).lerp(C('#2a2220'), clamp01(fbm(x * 20, y * 20, z * 20) + 0.4)); const t = Math.hypot(x - tip[0], y - tip[1], z - tip[2]); if (t < 0.05) c.copy(C('#d88a8a')); if (y < 0.85 * s && z < -0.1 * s) c.copy(C('#c8908a')); } // fur, pink nose, pink tail
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[2] -= 0.4; mx[2] += 0.2; mn[0] -= 0.2; mx[0] += 0.3;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.0068, col), skinMaterial({ roughness: 0.8, clearcoat: 0.1, sheen: 1, sheenColor: '#a89888', pore: 0.4 })));
  const bead = new THREE.MeshPhysicalMaterial({ color: '#050505', roughness: 0.03, clearcoat: 1 });
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR * 0.7, 12, 8), bead); e.position.set(p[0] * 1.15, p[1] + 0.005, p[2] - 0.005); g.add(e); }
  const tm = toothMat(); tm.color = C('#e8c860'); for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.006), tm); t.position.set(sx * 0.007, tip[1] - 0.03, tip[2] - 0.03); g.add(t); }
  const wh = new THREE.MeshStandardMaterial({ color: '#e8e0d8', roughness: 0.4 });
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0006, 0.16, 3), wh); w.position.set(tip[0] + sx * 0.06, tip[1] + 0.005 - i * 0.008, tip[2] - 0.05); w.rotation.set(0, 0, sx * (1.3 + i * 0.1)); g.add(w); }
  // monocle, and a towering backpack of junk
  const mono = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.003, 6, 20), new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.2 })); mono.position.set(B.eyes[0][0] * 1.15, B.eyes[0][1], B.eyes[0][2] + 0.008); g.add(mono);
  const pack = new THREE.Group(); const junk = [new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a3a1a'), roughness: 0.7 }), new THREE.MeshStandardMaterial({ map: grimeTex('#7a7c80'), metalness: 0.9, roughness: 0.4 }), new THREE.MeshPhysicalMaterial({ color: '#c82a2a', roughness: 0.5 }), new THREE.MeshPhysicalMaterial({ color: '#2a5ac8', roughness: 0.5 })];
  pack.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), junk[0]));
  for (let i = 0; i < 16; i++) { const k = i % 4, o = k === 1 ? new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 14), junk[1]) : new THREE.Mesh(new THREE.BoxGeometry(0.08 + rnd() * 0.15, 0.06 + rnd() * 0.12, 0.08 + rnd() * 0.1), junk[k]); o.position.set((rnd() - 0.5) * 0.4, 0.25 + i * 0.045, (rnd() - 0.5) * 0.2); o.rotation.set(rnd() - 0.5, rnd() * 3, rnd() - 0.5); pack.add(o); }
  const umb = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 6), junk[1]); umb.position.set(0.18, 0.4, -0.05); umb.rotation.z = -0.3; pack.add(umb);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), glow('#ffd080', 2.5)); lamp.position.set(-0.2, 0.75, 0); pack.add(lamp); const ll = new THREE.PointLight('#ffb050', 1.5, 2); ll.position.copy(lamp.position); pack.add(ll);
  pack.position.set(0, 1.05 * s, -0.3 * s); pack.rotation.x = 0.25; g.add(pack);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.1), new THREE.MeshPhysicalMaterial({ map: label("PICKLES' JUNK", '#e8d8a8', '#5a1a10'), roughness: 0.8, side: THREE.DoubleSide })); sign.position.set(...B.handR); sign.position.y += 0.08; g.add(sign);
  return shadowAll(g);
}

// ============ SPIN CYCLE — Stagehand trader at The Laundromat (Floor 2) ============
export function spinCycle() {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.95, bulk: 0.72, belly: -0.1, shoulders: 0.95, head: 1.08, hunch: 0.3, armL: 'hip', armR: 'forward', nose: 'flat', ears: 'none', jaw: 'normal', legBulk: 0.7, skinNoise: 0.15 });
  const s = B.scale;
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const u = y / s;
    c.copy(C('#9aa0a8')).lerp(C('#6a7078'), clamp01(fbm(x * 15, y * 15, z * 15) + 0.4)); // vat-grey skin
    if (u < 1.35 && u > 0.08 && !(Math.abs(x / s) > 0.29 && u > 0.95 && u < 1.25 && false)) { c.copy(C('#1a2a4a')).lerp(C('#0a1020'), clamp01(vnoise(x * 18, y * 18, z * 18) + 0.3)); if (u > 1.05 && Math.abs(x / s) < 0.12 && z > 0.12 * s) c.copy(C('#c8b020')); } // navy overalls with bib
    if (Math.abs(x / s) > 0.3 && u > 0.82 && u < 1.15) c.copy(C('#9aa0a8')); // bare grey forearms
    if (u < 0.08) c.copy(C('#1a1a1a'));
    if (Math.hypot(x / s - 0.35, u - 0.85, z / s - 0.08) < 0.04) c.copy(C('#9aa0a8'));
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox;
  g.add(new THREE.Mesh(buildMesh(B.sdf, mn, mx, 0.0075, col), skinMaterial({ roughness: 0.5, clearcoat: 0.3, sheen: 0.3, sheenColor: '#c8d0d8', pore: 0.3 })));
  addEyes(g, B, eyeTexture({ sclera: '#d8d8d8', iris: ['#c8c8c8', '#a8a8a8', '#787878', '#202020'], pupil: 'round', irisR: 70, veins: 0 }), 0.9);
  // headset, crew lanyard, a heaving laundry sack
  const hc = B.headCenter, hs = B.headScale;
  const blk = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.4, metalness: 0.4 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.15 * hs, 0.01, 8, 32, Math.PI), blk); band.position.set(hc[0], hc[1] + 0.01, hc[2] - 0.01); g.add(band);
  for (const sx of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 18), blk); cup.rotation.z = Math.PI / 2; cup.position.set(hc[0] + sx * 0.15 * hs, hc[1], hc[2] - 0.01); g.add(cup); }
  const mic = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(hc[0] + 0.15 * hs, hc[1] - 0.02, hc[2]), new THREE.Vector3(hc[0] + 0.12 * hs, hc[1] - 0.1 * hs, hc[2] + 0.12 * hs), new THREE.Vector3(hc[0] + 0.04, hc[1] - 0.12 * hs, hc[2] + 0.17 * hs)]), 12, 0.004, 5), blk); g.add(mic);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), glow('#ff2a1a', 4)); led.position.set(hc[0] + 0.16 * hs, hc[1] + 0.01, hc[2] + 0.02); g.add(led);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.1), new THREE.MeshPhysicalMaterial({ map: label('CREW', '#f0f0f0', '#b01010'), roughness: 0.4 })); badge.position.set(0.0, 1.14 * s, 0.205 * s); g.add(badge);
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), new THREE.MeshPhysicalMaterial({ map: grimeTex('#d8d0c0', { rust: 10 }), roughness: 0.95, sheen: 0.6 })); sack.scale.set(1, 1.2, 0.9);
  const sp = sack.geometry.attributes.position; for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i); const k = 1 + vnoise(x * 8, y * 8, z * 8) * 0.12; sp.setXYZ(i, x * k, y * k, z * k); } sack.geometry.computeVertexNormals();
  sack.position.set(-0.32 * s, 1.35 * s, -0.25 * s); g.add(sack);
  const socks = [new THREE.MeshPhysicalMaterial({ color: '#e82a6a', roughness: 0.9 }), new THREE.MeshPhysicalMaterial({ color: '#2ac8e8', roughness: 0.9 }), new THREE.MeshPhysicalMaterial({ color: '#e8d020', roughness: 0.9 })];
  for (let i = 0; i < 5; i++) { const sk = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.12, 4, 8), socks[i % 3]); sk.position.set(-0.32 * s + (rnd() - 0.5) * 0.3, 1.35 * s + 0.36, -0.25 * s + (rnd() - 0.5) * 0.2); sk.rotation.set(rnd() * 3, 0, rnd() * 3); g.add(sk); }
  const gear = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.03), new THREE.MeshPhysicalMaterial({ map: label('LOST?', '#f0e8c8', '#1a2a4a'), roughness: 0.6 })); gear.position.set(...B.handR); gear.position.y += 0.06; g.add(gear);
  return shadowAll(g);
}

// ============ OLD REGGIE — 11-season Lifer at The Laundromat (Floor 2) ============
export function oldReggie() {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.72, bulk: 0.8, belly: 0.5, shoulders: 0.9, head: 1.0, hunch: 1.0, armL: 'down', armR: 'forward', nose: 'hook', ears: 'round', jaw: 'normal', legBulk: 0.8, skinNoise: 0.6 });
  const s = B.scale;
  const cardi = (x, y, z) => { const ux = x / s, uy = y / s, uz = z / s; let d = (B.sdf(x, y, z) / s) - 0.014 + Math.max(0, Math.abs(ux) - 0.33) * 2; d = Math.max(d, 0.72 - uy); d = Math.max(d, uy - 1.42); d = smax(d, -rcone(ux, uy, uz, 0, 1.45, 0.22, 0, 0.9, 0.3, 0.08, 0.03), 0.02); if (Math.abs(d) < 0.02) d += Math.abs(Math.sin(uy * 120)) * 0.002; return d * s; };
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), cardi(x, y, z));
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const u = y / s;
    if (cardi(x, y, z) < B.sdf(x, y, z)) { c.copy(C('#7a5a3a')).lerp(C('#3a2a1a'), clamp01(vnoise(x * 25, y * 25, z * 25) + 0.3)); if (Math.abs(Math.sin(u * 40)) < 0.08) c.lerp(C('#a8803a'), 0.3); }
    else if (u > 1.45) { c.copy(C('#e0b8a0')).lerp(C('#a87a6a'), clamp01(fbm(x * 18, y * 18, z * 18) + 0.4)); if (vnoise(x * 40, y * 40, z * 40) > 0.55) c.lerp(C('#8a5a3a'), 0.5); } // aged skin with liver spots
    else if (u > 0.1) c.copy(C('#4a4a42')).lerp(C('#2a2a24'), clamp01(vnoise(x * 14, y * 14, z * 14) + 0.3)); // old trousers
    else c.copy(C('#2a1a10'));
    if (Math.abs(x / s) > 0.3 && u > 0.82 && u < 1.1 && cardi(x, y, z) > B.sdf(x, y, z)) c.copy(C('#e0b8a0'));
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[0] -= 0.05; mx[0] += 0.05;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.0065, col), skinMaterial({ roughness: 0.7, clearcoat: 0.1, sheen: 0.5, sheenColor: '#c8a890', pore: 1.0, poreScale: 1.0 })));
  addEyes(g, B, humanEye(['#7a9aaa', '#5a7a8a', '#3a4a5a', '#000']));
  hair(g, B, { n: 70, len: 0.06, color: '#e8e4dc', droop: 0.02, thick: 0.004, top: -0.2, faceClear: 0.2 }); // wispy white fringe around a bald top
  // long white beard
  const bm = new THREE.MeshPhysicalMaterial({ color: '#e8e4dc', roughness: 0.6, sheen: 1, sheenColor: C('#ffffff') });
  const hc = B.headCenter, hs = B.headScale;
  for (let i = 0; i < 140; i++) { const a = (rnd() - 0.5) * 2.4, root = new THREE.Vector3(hc[0] + Math.sin(a) * 0.1 * hs, hc[1] - 0.1 * hs - rnd() * 0.06, hc[2] + Math.cos(a) * 0.12 * hs); const pts = [root]; let p = root.clone(); for (let k = 1; k <= 4; k++) { p = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.015 - Math.sin(a) * 0.006, -0.05, 0.012 - k * 0.004)); pts.push(p); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.0035, 4), bm)); }
  // walking cane and a pigeon on his shoulder (he's been feeding them for 11 seasons)
  const cane = new THREE.Group(); const wood = new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a3a1a', { rust: 5 }), roughness: 0.5, clearcoat: 0.4 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.92, 10), wood); shaft.position.y = -0.46; cane.add(shaft);
  const crook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI), wood); crook.position.set(0.04, 0, 0); cane.add(crook);
  cane.position.set(...B.handR); cane.position.y += 0.02; g.add(cane);
  const bird = pigeonGhoul(); bird.scale.setScalar(0.24); bird.position.set(0.26 * s, 1.32 * s, -0.02); bird.rotation.y = 0.6; g.add(bird);
  return shadowAll(g);
}

// ============ TALLOWFOLK: living candles ============
function candleBody({ height, radius, wax, dripC, robe = null, flame = '#ffb040', arms = 'down' }) {
  const g = new THREE.Group();
  const top = height;
  const sdf = (x, y, z) => {
    let d = rcone(x, y, z, 0, 0.05, 0, 0, top - radius * 0.3, 0, radius * 1.05, radius);
    d = smin(d, ell(x, y, z, 0, top - radius * 0.3, 0, radius, radius * 0.4, radius), radius * 0.4);
    d = smax(d, -ell(x, y, z, 0, top + radius * 0.02, 0, radius * 0.75, radius * 0.25, radius * 0.75), 0.02); // melted pool at the crown
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3, ln = 0.15 + (i % 3) * 0.12; d = smin(d, rcone(x, y, z, Math.sin(a) * radius * 0.97, top - 0.05, Math.cos(a) * radius * 0.97, Math.sin(a) * radius * 1.0, top - 0.05 - ln, Math.cos(a) * radius * 1.0, radius * 0.12, radius * 0.08), 0.02); } // drips
    // face: two deep-set eyes and a soft mouth carved in the wax
    const fz = radius * 0.98, ey = top - radius * 0.75;
    d = smax(d, -sph(Math.abs(x), y, z, radius * 0.3, ey, fz, radius * 0.14), 0.02);
    d = smax(d, -ell(x, y, z, 0, ey - radius * 0.45, fz, radius * 0.22, radius * 0.06, radius * 0.1), 0.015);
    d = smin(d, sph(x, y, z, 0, ey - radius * 0.18, fz + 0.005, radius * 0.08), 0.02); // nose nub
    // stubby wax arms
    const arm = arms === 'forward' ? [[radius, top * 0.55, 0], [radius * 1.5, top * 0.45, radius * 0.6], [radius * 1.4, top * 0.48, radius * 1.4]] : [[radius, top * 0.55, 0], [radius * 1.6, top * 0.4, radius * 0.2], [radius * 1.6, top * 0.28, radius * 0.4]];
    for (const sx of [-1, 1]) d = smin(d, chain(sx * x, y, z, arm, [radius * 0.22, radius * 0.18, radius * 0.16], 0.03), 0.05);
    d = smin(d, ell(x, y, z, 0, 0.04, 0, radius * 1.4, 0.06, radius * 1.4), 0.05); // puddled base
    if (Math.abs(d) < 0.02) d += vnoise(x * 40, y * 40, z * 40) * 0.002 + Math.sin(y * 60 + vnoise(x * 8, 0, z * 8) * 3) * 0.0008;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C(wax)).lerp(C(dripC), clamp01(vnoise(x * 6, y * 3, z * 6) * 0.6 + 0.2)); if (ny > 0.5 && y > top - 0.1) c.lerp(C('#fff4d0'), 0.4); c.multiplyScalar(0.55 + ao * 0.45); };
  const waxM = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.4, transmission: 0.25, thickness: 0.3, sheen: 0.6, sheenColor: C('#ffe0b0'), emissive: C(flame), emissiveIntensity: 0.06 });
  g.add(new THREE.Mesh(buildMesh(sdf, [-radius * 2.2, -0.02, -radius * 1.6], [radius * 2.2, top + 0.1, radius * 2.0], Math.max(0.006, radius * 0.035), col), waxM));
  // wick + flame
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.08, 8), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: 0.9 })); wick.position.y = top + 0.0; g.add(wick);
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), glow(flame, 3)); f1.scale.set(0.7, 1.8, 0.7); f1.position.y = top + 0.11; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), glow('#fff8e0', 4)); f2.scale.set(0.7, 1.6, 0.7); f2.position.y = top + 0.08; g.add(f2);
  const fl = new THREE.PointLight(flame, 4, 4); fl.position.y = top + 0.2; g.add(fl);
  // eyes glow from inside the carved sockets
  const ey = top - radius * 0.75;
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.07, 10, 8), glow(flame, 3)); e.position.set(sx * radius * 0.3, ey, radius * 0.9); g.add(e); }
  return { g, top, radius };
}
// WICKLEY — Tallowfolk chef on Soup Row (Floor 3)
export function wickley() {
  const { g, top, radius } = candleBody({ height: 1.25, radius: 0.24, wax: '#f0e0c0', dripC: '#d8b888', flame: '#ffb040', arms: 'forward' });
  // apron, a ladle and a little chef's neckerchief
  const ap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.1, radius * 1.15, 0.6, 32, 1, true, -1.1, 2.2), new THREE.MeshPhysicalMaterial({ map: grimeTex('#e8e4dc', { rust: 30, scratches: 400 }), roughness: 0.9, side: THREE.DoubleSide })); ap.position.y = 0.45; g.add(ap);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.03, 0.025, 8, 32), new THREE.MeshPhysicalMaterial({ color: '#c82a2a', roughness: 0.8 })); scarf.rotation.x = Math.PI / 2; scarf.position.y = top * 0.72; g.add(scarf);
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#6a6a6a', { rust: 40 }), metalness: 0.9, roughness: 0.4, side: THREE.DoubleSide });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 8), iron); stick.position.set(radius * 1.4, top * 0.48 + 0.12, radius * 1.45); stick.rotation.x = 0.4; g.add(stick);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), iron); bowl.position.set(radius * 1.4, top * 0.48 - 0.08, radius * 1.55); g.add(bowl);
  // a pot of soup on a little brazier
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.22, 24, 1, true), iron); pot.position.set(-0.6, 0.38, 0.25); g.add(pot);
  const soup = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), new THREE.MeshPhysicalMaterial({ color: '#c87a2a', roughness: 0.2, clearcoat: 1, emissive: C('#4a2000'), emissiveIntensity: 0.4 })); soup.rotation.x = -Math.PI / 2; soup.position.set(-0.6, 0.47, 0.25); g.add(soup);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.27, 12), new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.7, roughness: 0.5 })); stand.position.set(-0.6, 0.135, 0.25); g.add(stand);
  const coal = new THREE.PointLight('#ff6a1a', 1.5, 1.2); coal.position.set(-0.6, 0.2, 0.45); g.add(coal);
  return shadowAll(g);
}
// BROTHER ASH — Tallowfolk scholar studying the hags (Floor 3)
export function brotherAsh() {
  const { g, top, radius } = candleBody({ height: 1.75, radius: 0.18, wax: '#e8e4f0', dripC: '#a8a0c0', flame: '#6ab0ff', arms: 'forward' });
  // grey monk's robe with a rope belt, prayer beads, and a book held open
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.25, radius * 1.9, top * 0.68, 32, 6, true), new THREE.MeshPhysicalMaterial({ map: grimeTex('#5a5a62', { rust: 15 }), roughness: 0.95, sheen: 0.6, sheenColor: C('#9a9aa8'), side: THREE.DoubleSide }));
  const rp = robe.geometry.attributes.position; for (let i = 0; i < rp.count; i++) { const x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i), a = Math.atan2(x, z); const k = 1 + Math.sin(a * 11) * 0.04; rp.setXYZ(i, x * k, y, z * k); } robe.geometry.computeVertexNormals();
  robe.position.y = top * 0.34 + 0.02; g.add(robe);
  const hood = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.15, 0.05, 10, 32), robe.material); hood.rotation.x = Math.PI / 2; hood.position.y = top * 0.7; g.add(hood);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.35, 0.012, 6, 32), new THREE.MeshPhysicalMaterial({ color: '#b8a070', roughness: 0.9 })); rope.rotation.x = Math.PI / 2; rope.position.y = top * 0.42; g.add(rope);
  const bead = new THREE.MeshPhysicalMaterial({ color: '#3a2a1a', roughness: 0.3, clearcoat: 1 });
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 1.4 - 0.7, b = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), bead); b.position.set(Math.sin(a) * radius * 1.05, top * 0.66 - Math.cos(a) * 0.14 + 0.1, Math.cos(a) * radius * 1.0 + 0.02); g.add(b); }
  const bookCover = new THREE.MeshPhysicalMaterial({ map: grimeTex('#3a1a3a', { rust: 10 }), roughness: 0.6 });
  const pages = canvasTex(256, 192, (c, w, h) => { c.fillStyle = '#ece2c8'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(40,20,10,0.75)'; for (let y = 14; y < h; y += 11) { let x = 8; while (x < w - 16) { const ww = 6 + rnd() * 22; if (Math.abs(x - w / 2) > 6) c.fillRect(x, y, ww, 3); x += ww + 5; } } c.strokeStyle = '#8a1a1a'; c.lineWidth = 2; c.beginPath(); c.arc(w * 0.75, h * 0.6, 22, 0, 7); c.stroke(); });
  const book = new THREE.Group(); const cv = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.24), bookCover); const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), new THREE.MeshPhysicalMaterial({ map: pages, roughness: 0.9 })); pg.rotation.x = -Math.PI / 2; pg.position.y = 0.008; book.add(cv, pg);
  book.position.set(0, top * 0.48, radius * 1.6); book.rotation.x = 0.5; g.add(book);
  const read = new THREE.PointLight('#8ac8ff', 1.2, 1); read.position.set(0, top * 0.6, radius * 2); g.add(read);
  return shadowAll(g);
}
