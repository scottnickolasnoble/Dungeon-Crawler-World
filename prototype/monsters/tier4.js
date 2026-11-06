// Tier 4 monsters (Floors 10-12: The Spectacle).
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';

const C = (h) => new THREE.Color(h);
const pickV = (v, arr, k = 0) => arr[(v + k * 7) % arr.length];
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glowMat = (hex, k = 2.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k) });

// ============ GLADIATOR BOT ============
export function gladiatorBot({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const team = pickV(variant, ['#c81a1a', '#1a5ac8', '#e8a010', '#1a9a4a']);
  const plate = new THREE.MeshPhysicalMaterial({ map: grimeTex('#7a7e86', { rust: 30, scratches: 4000 }), metalness: 0.95, roughness: 0.3, clearcoat: 0.3 });
  const paint = new THREE.MeshPhysicalMaterial({ map: grimeTex(team, { rust: 20, scratches: 3000 }), metalness: 0.4, roughness: 0.35, clearcoat: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1a1a1e', metalness: 0.8, roughness: 0.5 });
  const add = (geo, m, p, r = [0, 0, 0], sc) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); if (sc) o.scale.set(...sc); g.add(o); return o; };
  // legs: armoured, wide stance
  for (const sx of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.08, 0.07, 0.5, 16), dark, [sx * 0.2, 0.95, 0], [0, 0, sx * 0.1]);
    add(new THREE.BoxGeometry(0.2, 0.32, 0.22), paint, [sx * 0.21, 0.95, 0.03], [0, 0, sx * 0.1]);
    add(new THREE.SphereGeometry(0.09, 16, 12), plate, [sx * 0.24, 0.68, 0.06]);
    add(new THREE.CylinderGeometry(0.065, 0.06, 0.5, 16), dark, [sx * 0.26, 0.4, 0.0]);
    add(new THREE.BoxGeometry(0.17, 0.42, 0.16), plate, [sx * 0.26, 0.42, 0.06]);
    add(new THREE.BoxGeometry(0.2, 0.08, 0.34), plate, [sx * 0.26, 0.05, 0.08]);
  }
  // pelvis + torso with a crowd-meter on the chest
  add(new THREE.BoxGeometry(0.46, 0.2, 0.3), dark, [0, 1.22, 0]);
  add(new THREE.CylinderGeometry(0.3, 0.22, 0.55, 8), plate, [0, 1.6, 0], [0, Math.PI / 8, 0]);
  add(new THREE.BoxGeometry(0.5, 0.36, 0.08), paint, [0, 1.66, 0.25]);
  const meter = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#050505'; c.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { c.fillStyle = i < 11 ? (i < 6 ? '#2aff4a' : i < 9 ? '#ffd020' : '#ff2a2a') : '#202020'; c.fillRect(8 + i * 15, 12, 11, 40); } });
  add(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: meter }), [0, 1.74, 0.292]);
  for (const sx of [-1, 1]) {
    add(new THREE.SphereGeometry(0.15, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), paint, [sx * 0.38, 1.82, 0], [0, 0, sx * -0.5]); // pauldrons
    add(new THREE.CylinderGeometry(0.055, 0.05, 0.38, 14), dark, [sx * 0.42, 1.58, 0.05], [0.3, 0, sx * 0.15]);
    add(new THREE.BoxGeometry(0.14, 0.3, 0.14), plate, [sx * 0.44, 1.33, 0.2], [1.1, 0, 0]);
  }
  // head: a gladiator helmet with a slit visor and a fan crest
  add(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 12), dark, [0, 1.92, 0]);
  const helm = add(new THREE.SphereGeometry(0.16, 24, 18), plate, [0, 2.05, 0], [0, 0, 0], [1, 1.1, 1.05]);
  add(new THREE.BoxGeometry(0.22, 0.03, 0.04), glowMat('#ff2a1a', 3), [0, 2.05, 0.16]);
  add(new THREE.BoxGeometry(0.03, 0.1, 0.04), dark, [0, 1.98, 0.16]);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.02, 0.18, 0.04), paint, [0, 2.2 + Math.sin((i / 8) * Math.PI) * 0.06, -0.14 + i * 0.035], [(i - 4) * -0.12, 0, 0]);
  // sword arm and net-launcher arm
  const blade = add(new THREE.BoxGeometry(0.06, 0.9, 0.012), new THREE.MeshPhysicalMaterial({ map: grimeTex('#c8ccd4', { rust: 10, scratches: 5000 }), metalness: 1, roughness: 0.15 }), [0.44, 1.6, 0.62], [1.1, 0, 0]);
  add(new THREE.BoxGeometry(0.22, 0.04, 0.05), paint, [0.44, 1.24, 0.34], [1.1, 0, 0]);
  add(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12), dark, [-0.44, 1.26, 0.38], [1.1 + Math.PI / 2, 0, 0]);
  // sponsor decals
  const decal = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, w, h); c.fillStyle = team; c.font = 'bold 54px sans-serif'; c.fillText('SPONSOR', 10, 80); });
  for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshPhysicalMaterial({ map: decal, roughness: 0.5 }), [sx * 0.21, 0.95, 0.142], [0, 0, sx * 0.1]);
  return shadowAll(g);
}
gladiatorBot.variants = true;

// ============ STAGE-FRIGHT PHANTOM ============
export function stagePhantom({ variant = 0 } = {}) {
  const g = new THREE.Group();
  // flowing shroud: a tall, hollow drape tearing into tendrils at the bottom
  const sdf = (x, y, z) => {
    const sway = Math.sin(y * 3) * 0.06;
    let d = rcone(x - sway, y, z, 0, 0.25, 0, 0, 1.75, 0.05, 0.45, 0.16);
    d = smin(d, ell(x, y, z, 0, 1.9, 0.07, 0.16, 0.2, 0.16), 0.08); // hood
    d = smax(d, -ell(x, y, z, 0, 1.88, 0.2, 0.11, 0.15, 0.1), 0.03); // hood opening
    d = Math.max(d, -rcone(x - sway, y, z, 0, 0.2, 0, 0, 1.7, 0.05, 0.42, 0.13)); // hollow
    // arms emerging, beckoning
    d = smin(d, chain(x, y, z, [[0.18, 1.6, 0.05], [0.42, 1.45, 0.25], [0.55, 1.55, 0.5]], [0.07, 0.05, 0.035], 0.04), 0.05);
    d = smin(d, chain(x, y, z, [[-0.18, 1.6, 0.05], [-0.38, 1.35, 0.3], [-0.42, 1.2, 0.5]], [0.07, 0.05, 0.035], 0.04), 0.05);
    const hem = 0.25 + Math.abs(Math.sin(Math.atan2(x, z) * 7)) * 0.25 + vnoise(x * 8, 0, z * 8) * 0.12; d = Math.max(d, hem - y);
    if (Math.abs(d) < 0.03) d += Math.sin(Math.atan2(x, z) * 18 + y * 4) * 0.008;
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C('#d8dcf0')).lerp(C('#4a4a6a'), clamp01(1 - y / 1.9 + vnoise(x * 6, y * 6, z * 6) * 0.3)); c.multiplyScalar(0.4 + ao * 0.6); };
  const ghost = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, transparent: true, opacity: 0.72, side: THREE.DoubleSide, emissive: C('#4a5a9a'), emissiveIntensity: 0.25, sheen: 1, sheenColor: C('#c8d8ff'), depthWrite: false });
  const body = new THREE.Mesh(buildMesh(sdf, [-0.75, 0.0, -0.6], [0.75, 2.15, 0.75], 0.012, col), ghost); body.position.y = 0.25; g.add(body);
  // porcelain theatre mask in the hood: one half weeping, one half grinning
  const mask = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#f4eee4'; c.fillRect(0, 0, w, h); c.fillStyle = '#0a0a0a';
    c.beginPath(); c.ellipse(170, 220, 50, 30, 0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(342, 220, 50, 30, -0.3, 0, 7); c.fill();
    c.lineWidth = 16; c.beginPath(); c.arc(256, 330, 90, 0.1, Math.PI * 0.5); c.stroke(); c.beginPath(); c.arc(256, 420, 90, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
    c.fillStyle = '#8a0a0a'; c.fillRect(160, 250, 10, 140); c.fillStyle = '#c8a020'; c.lineWidth = 6; c.strokeStyle = '#c8a020'; c.beginPath(); c.moveTo(80, 100); c.quadraticCurveTo(256, 20, 432, 100); c.stroke();
    for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(60,40,30,${rnd() * 0.4})`; c.lineWidth = 1; c.beginPath(); const x = rnd() * w, y = rnd() * h; c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 60, y + rnd() * 40); c.stroke(); } });
  const mgeo = new THREE.SphereGeometry(0.13, 32, 24, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.2, Math.PI * 0.6);
  const m = new THREE.Mesh(mgeo, new THREE.MeshPhysicalMaterial({ map: mask, roughness: 0.25, clearcoat: 1, side: THREE.DoubleSide })); m.position.set(0, 2.12, 0.18); m.rotation.y = -Math.PI / 2 + Math.PI / 2; g.add(m);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), glowMat('#9ad8ff', 4)); e.position.set(sx * 0.045, 2.15, 0.27); g.add(e); }
  // bony hands
  const bone = new THREE.MeshPhysicalMaterial({ color: '#e8e0d0', roughness: 0.5 });
  for (const [hx, hy, hz] of [[0.55, 1.8, 0.5], [-0.42, 1.45, 0.5]]) for (let f = 0; f < 4; f++) { const fg = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.08, 4, 6), bone); fg.position.set(hx + (f - 1.5) * 0.018, hy + 0.02, hz + 0.05); fg.rotation.x = 1.2 + f * 0.1; g.add(fg); }
  // the spotlight that makes it visible
  const spot = new THREE.SpotLight('#e8f0ff', 30, 8, 0.32, 0.4, 1); spot.position.set(0, 5, 1.5); spot.target.position.set(0, 0, 0); g.add(spot, spot.target);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), new THREE.MeshBasicMaterial({ color: '#c8d8ff', transparent: true, opacity: 0.12 })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.005; g.add(halo);
  return shadowAll(g);
}
stagePhantom.variants = true;

// ============ COMMERCIAL BREAK IMP ============
export function commercialImp({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 0.95, bulk: 0.8, belly: 0.5, shoulders: 0.95, head: 0.3, hunch: 0.6, armL: 'raised', armR: 'forward', nose: 'none', ears: 'none', legBulk: 0.85, skinNoise: 0.6 });
  const s = B.scale;
  const sdf = (x, y, z) => {
    let d = B.sdf(x, y, z);
    d = smin(d, chain(x, y, z, [[0, 0.82 * s, -0.12 * s], [0.0, 0.5 * s, -0.4 * s], [0.18 * s, 0.35 * s, -0.55 * s], [0.25 * s, 0.6 * s, -0.6 * s]], [0.035 * s, 0.025 * s, 0.018 * s, 0.01 * s], 0.03), 0.03); // tail
    for (const sx of [-1, 1]) d = smin(d, rcone(Math.abs(x) * sx * sx, y, z, 0.28 * s, 1.42 * s, -0.1 * s, 0.55 * s, 1.6 * s, -0.35 * s, 0.03 * s, 0.006 * s), 0.03); // wing struts
    return d;
  };
  const skinC = pickV(variant, ['#b02a1a', '#6a2a8a', '#2a6a3a']);
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C(skinC)).lerp(C('#1a0806'), clamp01(fbm(x * 15, y * 15, z * 15) + 0.4 - ny * 0.2)); c.multiplyScalar(ao); };
  const [mn, mx] = B.bbox; mn[0] -= 0.45; mx[0] += 0.45; mn[2] -= 0.6;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.005, col), skinMaterial({ roughness: 0.45, clearcoat: 0.6, sheen: 0.3, sheenColor: '#ff6a4a', pore: 0.8, poreScale: 1.5 })));
  // a CRT television for a head, showing colour bars and a grin
  const hc = [0, 1.62 * s, 0.12 * s];
  const tv = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.24), new THREE.MeshPhysicalMaterial({ map: grimeTex('#3a3028', { rust: 20 }), roughness: 0.4, clearcoat: 0.6 }));
  const screen = canvasTex(320, 240, (c, w, h) => { const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']; bars.forEach((b, i) => { c.fillStyle = b; c.fillRect(i * w / 7, 0, w / 7 + 1, h * 0.7); }); c.fillStyle = '#111'; c.fillRect(0, h * 0.7, w, h * 0.3); c.fillStyle = '#fff'; c.font = 'bold 40px monospace'; c.fillText("WE'LL BE", 50, h * 0.83); c.fillText('RIGHT BACK', 30, h * 0.97); for (let y = 0; y < h; y += 3) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, y, w, 1); } });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.18), new THREE.MeshBasicMaterial({ map: screen, color: new THREE.Color(1.6, 1.6, 1.6) })); scr.position.z = 0.121;
  tv.add(shell, scr);
  const ant = new THREE.MeshStandardMaterial({ color: '#aaa', metalness: 1, roughness: 0.3 });
  for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 6), ant); a.position.set(sx * 0.06, 0.2, -0.03); a.rotation.z = -sx * 0.5; tv.add(a); const horn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 10), new THREE.MeshPhysicalMaterial({ color: '#1a1008', roughness: 0.3, clearcoat: 1 })); horn.position.set(sx * 0.13, 0.13, 0); horn.rotation.z = -sx * 0.6; tv.add(horn); }
  tv.position.set(...hc); tv.rotation.set(0.1, -0.15, 0.08); g.add(tv);
  const sl = new THREE.PointLight('#a0c8ff', 1.5, 1.2); sl.position.set(hc[0], hc[1], hc[2] + 0.3); g.add(sl);
  // a coupon-stuffed pitchfork
  const fork = new THREE.Group(); const fm = new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.9, roughness: 0.4 });
  fork.add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 6), fm)); for (const dx of [-0.03, 0, 0.03]) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.08, 6), fm); t.position.set(dx, 0.33, 0); fork.add(t); }
  fork.position.set(...B.handL); fork.position.y += 0.1; g.add(fork);
  return shadowAll(g);
}
commercialImp.variants = true;

// ============ HYPE BEAST ============
export function hypeBeast({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.7, bulk: 2.2, belly: 0.3, shoulders: 1.55, head: 0.9, hunch: 1.0, armL: 'raised', armR: 'down', nose: 'flat', ears: 'round', jaw: 'heavy', legBulk: 1.6 });
  const s = B.scale, hc = B.headCenter, hsc = B.headScale;
  const sdf = (x, y, z) => {
    let d = B.sdf(x, y, z);
    // ram horns curling from the temples
    for (const sx of [-1, 1]) { const p = (t) => [hc[0] + sx * (0.12 + Math.sin(t * 3.5) * 0.12 + t * 0.08) * hsc, hc[1] + (0.08 + Math.cos(t * 3.5) * 0.12 - 0.04) * hsc, hc[2] + (-0.05 - t * 0.12) * hsc]; d = smin(d, chain(x, y, z, [p(0), p(0.25), p(0.5), p(0.75), p(1)], [0.05, 0.045, 0.035, 0.025, 0.012].map((r) => r * hsc), 0.01), 0.03); }
    // shaggy fur on shoulders and back
    if (Math.abs(d) < 0.05 && y > 1.2 * s && z < 0.1 * s) d -= Math.max(0, vnoise(x * 30, y * 10, z * 30)) * 0.04;
    return d;
  };
  const fur = pickV(variant, ['#4a2a6a', '#1a3a6a', '#6a1a2a']);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C(fur)).lerp(C('#0a0610'), clamp01(fbm(x * 10, y * 10, z * 10) + 0.4));
    if (z > hc[2] + 0.08 * hsc && Math.abs(y - hc[1]) < 0.16 * hsc) c.copy(C('#3a2a3a')).lerp(C('#8a6a7a'), clamp01(ny + 0.3)); // bare face
    const lx = x - hc[0], ly = y - hc[1]; if (Math.hypot(Math.abs(lx) - 0.2 * hsc, ly - 0.05 * hsc) < 0.2 * hsc && z < hc[2]) c.copy(C('#d8c8a0')).lerp(C('#6a5a3a'), clamp01(Math.sin(Math.atan2(ly, lx) * 20) * 0.5 + 0.5)); // ridged horns
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mx[1] += 0.3;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.014, col), skinMaterial({ roughness: 0.75, clearcoat: 0.1, sheen: 1, sheenColor: '#c89aff', pore: 0.6, poreScale: 0.5 })));
  for (const p of B.eyes) { const e = new THREE.Mesh(new THREE.SphereGeometry(B.eyeR * 0.9, 12, 8), glowMat('#ff3af0', 3)); e.position.set(...p); g.add(e); }
  const tm = toothMat(); for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), tm); t.position.set(sx * 0.07 * hsc, B.mouth[1] + 0.04, B.mouth[2] - 0.02); t.rotation.x = -0.2; g.add(t); }
  // merch: a giant foam finger, an LED collar, a chain with a medallion
  const foam = new THREE.Group(); const fm = new THREE.MeshPhysicalMaterial({ color: '#ffd020', roughness: 0.9, sheen: 0.5 });
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.12), fm); const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 6, 12), fm); finger.position.y = 0.38;
  const n1 = canvasTex(128, 128, (c) => { c.fillStyle = '#ffd020'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#1a1a8a'; c.font = 'bold 72px sans-serif'; c.fillText('#1', 14, 96); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: n1 })); lab.position.z = 0.062;
  foam.add(palm, finger, lab); foam.position.set(...B.handL); foam.position.y += 0.02; g.add(foam);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2 * s, 0.025, 10, 30), new THREE.MeshStandardMaterial({ color: '#111', metalness: 0.8, roughness: 0.3 })); collar.position.set(0, 1.47 * s, 0.1 * s); collar.rotation.x = Math.PI / 2 - 0.4; g.add(collar);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), glowMat(['#ff3af0', '#3affea', '#ffe03a'][i % 3], 3)); led.position.set(Math.cos(a) * 0.2 * s, 1.47 * s + Math.sin(a) * 0.2 * s * Math.sin(0.4), 0.1 * s + Math.sin(a) * 0.2 * s * Math.cos(0.4)); g.add(led); }
  const gold = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.2 });
  const med = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24), gold); med.rotation.x = Math.PI / 2 - 0.3; med.position.set(0, 1.18 * s, 0.33 * s); g.add(med);
  const hl = new THREE.PointLight('#ff3af0', 2, 2.5); hl.position.set(0, 1.5 * s, 0.6); g.add(hl);
  return shadowAll(g);
}
hypeBeast.variants = true;

// ============ CONFETTI ELEMENTAL ============
export function confettiElemental({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const cols = ['#ff3a5a', '#ffd020', '#3ac8ff', '#5aff6a', '#c85aff', '#ffffff', '#ff8a2a'];
  // glitter core: a faceted, glowing heart
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshPhysicalMaterial({ color: '#ffe8ff', metalness: 0.6, roughness: 0.1, iridescence: 1, iridescenceIOR: 2, clearcoat: 1, flatShading: true, emissive: C('#ff7ae8'), emissiveIntensity: 0.5 }));
  core.position.y = 1.25; g.add(core);
  { const cl = new THREE.PointLight('#ff9af0', 4, 4); cl.position.set(0, 1.25, 0.2); g.add(cl); }
  // a vortex of confetti: thousands of foil flakes spiralling into a humanoid silhouette
  const flake = new THREE.PlaneGeometry(0.03, 0.018);
  const mats = cols.map((c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.7, roughness: 0.25, side: THREE.DoubleSide, iridescence: 0.4 }));
  const N = 2600;
  const inst = mats.map((m) => new THREE.InstancedMesh(flake, m, Math.ceil(N / mats.length)));
  const counts = mats.map(() => 0), dummy = new THREE.Object3D();
  for (let i = 0; i < N; i++) {
    const y = Math.pow(rnd(), 0.8) * 2.1, t = y / 2.1;
    // silhouette radius: narrow waist, broad shoulders, arms spreading out at the top
    let r = 0.15 + Math.sin(t * Math.PI) * 0.25 + (t > 0.6 ? (t - 0.6) * 0.9 : 0);
    const a = rnd() * Math.PI * 2 + y * 5, rr = r * (0.6 + rnd() * 0.55);
    dummy.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr * 0.75);
    dummy.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); dummy.scale.setScalar(0.7 + rnd() * 0.8); dummy.updateMatrix();
    const k = i % mats.length; inst[k].setMatrixAt(counts[k]++, dummy.matrix);
  }
  inst.forEach((im, k) => { im.count = counts[k]; g.add(im); });
  // curling streamers
  for (let i = 0; i < 6; i++) {
    const pts = []; const a0 = rnd() * Math.PI * 2, turns = 3 + rnd() * 4, y0 = rnd() * 0.6, y1 = 1.2 + rnd() * 0.9;
    for (let k = 0; k <= 20; k++) { const t = k / 20, r = 0.25 + t * 0.45 + vnoise(i, t * 4, 0) * 0.15; pts.push(new THREE.Vector3(Math.cos(a0 + t * turns) * r, y0 + t * (y1 - y0), Math.sin(a0 + t * turns) * r * 0.75)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.006, 4), new THREE.MeshPhysicalMaterial({ color: cols[i % cols.length], roughness: 0.3, metalness: 0.5 }));
    tube.scale.set(1, 1, 1); g.add(tube);
  }
  // two burning eyes in the swirl
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), glowMat('#ffffff', 5)); e.position.set(sx * 0.08, 1.72, 0.22); g.add(e); }
  // a carpet of fallen confetti on the floor
  for (let i = 0; i < 400; i++) { const m = new THREE.Mesh(flake, mats[i % mats.length]); m.position.set((rnd() - 0.5) * 2.4, 0.003, (rnd() - 0.5) * 2); m.rotation.set(-Math.PI / 2, 0, rnd() * 6); g.add(m); }
  return shadowAll(g);
}
confettiElemental.variants = true;
