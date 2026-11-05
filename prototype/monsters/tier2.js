// Tier 2 monsters (Floors 4-6: The Sprawl). Each export takes { variant } and returns a THREE.Group.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, smax, ell, rcone, sph, rbox, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid, quadruped } from '../anatomy.js';

const C = (h) => new THREE.Color(h);
const pickV = (v, arr, k = 0) => arr[(v + k * 7) % arr.length];
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
function addEyes(g, body, tex, glow = 0.1, glowColor = '#ff8800') {
  for (const p of body.eyes) { const e = eyeMesh(tex, body.eyeR, glow, glowColor); e.position.set(...p); g.add(e); }
}
function teethRow(g, center, width, n, len, mat, up = true, depth = 0.0) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5, h = len * (0.6 + rnd() * 0.8);
    const m = new THREE.Mesh(new THREE.ConeGeometry(len * 0.28, h, 6), mat);
    m.position.set(center[0] + t * width, center[1] + (up ? h / 2 : -h / 2), center[2] - Math.abs(t) * width * 0.6 + depth);
    if (!up) m.rotation.x = Math.PI; m.rotation.z += (rnd() - 0.5) * 0.3; g.add(m);
  }
}

// ============ MALL-COP OGRE ============
export function mallCopOgre({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.6, bulk: 1.9, belly: 1.4, shoulders: 1.35, head: 0.98, hunch: 0.4, armL: 'forward', armR: 'down', nose: 'flat', ears: 'round', jaw: 'heavy', legBulk: 1.7 });
  const s = B.scale;
  const shirtTop = 1.48 * s, beltY = 0.86 * s;
  const shirtC = pickV(variant, ['#3a4a62', '#5a6a72', '#2e3a4a', '#6a5a3a']);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    const ux = x / s, uy = y / s, uz = z / s;
    c.copy(C('#8a8a6a')).lerp(C('#5a5a42'), clamp01(fbm(ux * 9, uy * 9, uz * 9) + 0.4)); // grey-olive hide
    const sleeveEnd = Math.abs(ux) > 0.3 && uy < 1.14;
    if (uy < 1.5 && uy > 0.86 && !sleeveEnd) { c.copy(C(shirtC)).lerp(C('#1a1a1a'), clamp01(vnoise(ux * 20, uy * 20, uz * 20) * 0.6 + 0.2)); // uniform shirt
      if (uz > 0.1 && Math.abs(ux) < 0.02) c.lerp(C('#c8c8c8'), 0.4); // buttons line
      if (vnoise(ux * 8, uy * 8, uz * 8 + 4) > 0.5) c.lerp(C('#6a5a2a'), 0.5); } // sweat stains
    if (uy < 0.86 && uy > 0.1) c.copy(C('#1e2228')).lerp(C('#3a3e44'), clamp01(vnoise(ux * 30, uy * 30, uz * 30) + 0.2)); // trousers
    if (uy < 0.1) c.copy(C('#111'));
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox;
  g.add(new THREE.Mesh(buildMesh(B.sdf, mn, mx, 0.013, col), skinMaterial({ roughness: 0.6, clearcoat: 0.25, sheen: 0.4, sheenColor: '#8a8a9a', pore: 0.8, poreScale: 0.6 })));
  addEyes(g, B, eyeTexture({ sclera: '#e0d0b0', iris: ['#5a3a1a', '#7a5a2a', '#3a2a10', '#100800'], pupil: 'round', irisR: 60 }), 0.02);
  // tusks
  const tm = toothMat();
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 8), tm); t.position.set(sx * 0.06 * s * 0.98, B.mouth[1] + 0.03, B.mouth[2] - 0.02); t.rotation.set(-0.3, 0, -sx * 0.3); g.add(t); }
  // badge, belt with gear, cap, flashlight
  const gold = new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.3 });
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 6), gold); badge.rotation.x = Math.PI / 2; badge.position.set(0.18, 1.3 * s, 0.33 * s); g.add(badge);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 40), new THREE.MeshPhysicalMaterial({ color: '#141414', roughness: 0.4, clearcoat: 0.7 }));
  belt.rotation.x = Math.PI / 2; belt.scale.set(0.31 * s, 0.28 * s, 1); belt.position.set(0, beltY + 0.02, 0.06 * s); g.add(belt);
  const pouch = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.6 });
  for (const a of [-0.9, -0.3, 0.9]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.07), pouch); p.position.set(Math.sin(a) * 0.32 * s, beltY - 0.03, 0.06 * s + Math.cos(a) * 0.29 * s); p.rotation.y = a; g.add(p); }
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.04), pouch); radio.position.set(-0.2, 1.36 * s, 0.3 * s); g.add(radio);
  const cap = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.08, 24), new THREE.MeshPhysicalMaterial({ color: shirtC, roughness: 0.7 }));
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.012, 24, 1, false, -1, 2), new THREE.MeshPhysicalMaterial({ color: '#0a0a0a', roughness: 0.2, clearcoat: 1 })); visor.position.set(0, -0.035, 0.04);
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.005, 6), gold); cb.rotation.x = Math.PI / 2; cb.position.set(0, 0.0, 0.125);
  cap.add(crown, visor, cb); cap.position.set(B.headTop[0], B.headTop[1] - 0.02, B.headTop[2] + 0.01); cap.rotation.x = -0.1; cap.scale.setScalar(s * 0.98 * 1.15);
  if (variant % 3 !== 2) g.add(cap);
  const fl = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.32, 16), new THREE.MeshStandardMaterial({ map: grimeTex('#2a2a2a', { rust: 5 }), metalness: 0.7, roughness: 0.4 }));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.034, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff8d0').multiplyScalar(2) })); lens.position.y = 0.161; lens.rotation.x = -Math.PI / 2;
  fl.add(tube, lens); fl.position.set(...B.handL); fl.rotation.set(Math.PI / 2 - 0.1, 0, 0); g.add(fl);
  const beam = new THREE.SpotLight('#fff4d0', 18, 6, 0.35, 0.5, 1.2); beam.position.set(...B.handL); beam.target.position.set(B.handL[0], 0, B.handL[2] + 2.5); g.add(beam, beam.target);
  // giant donut in the other hand on some variants
  if (variant % 2) { const dn = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.04, 12, 24), new THREE.MeshPhysicalMaterial({ color: '#d89aa8', roughness: 0.5, clearcoat: 0.6 })); dn.position.set(...B.handR); dn.position.y -= 0.05; g.add(dn); }
  return shadowAll(g);
}
mallCopOgre.variants = true;

// ============ CUL-DE-SAC HOUND ============
export function culDeSacHound({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const Q = quadruped({ height: 0.85, length: 1.15, bulk: 1.0, gaunt: 0.8, snout: 1.15, mouthOpen: 0.75 });
  const coat = pickV(variant, [['#6a5a48', '#2a2018'], ['#4a4a4a', '#1a1a1a'], ['#8a6a3a', '#3a2a14'], ['#5a4a42', '#c8b8a8']]);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C(coat[0])).lerp(C(coat[1]), clamp01(fbm(x * 8, y * 8, z * 8) + ny * 0.3 + 0.2));
    const mange = vnoise(x * 11 + 2, y * 11, z * 11); if (mange > 0.35) c.lerp(C('#9a6a62'), clamp01((mange - 0.35) * 4) * 0.85); // mangy bald patches
    if (mange > 0.6) c.lerp(C('#5a1a1a'), 0.5); // sores
    if (Math.hypot(x - Q.snoutTip[0], y - Q.snoutTip[1], z - Q.snoutTip[2]) < 0.04) c.copy(C('#141010'));
    if (y < Q.head[1] - 0.04 && z > Q.head[2] + 0.02 && ny > 0.2 && Math.abs(x) < 0.06) c.lerp(C('#7a2a30'), 0.7); // gums / inner mouth
    c.multiplyScalar(ao);
  };
  const [mn, mx] = Q.bbox;
  g.add(new THREE.Mesh(buildMesh(Q.sdf, mn, mx, 0.0075, col), skinMaterial({ roughness: 0.75, clearcoat: 0.15, sheen: 0.8, sheenColor: '#b8a890', pore: 0.6 })));
  addEyes(g, Q, eyeTexture({ sclera: '#c89a3a', iris: ['#ffe060', '#e8a020', '#8a5010', '#2a1000'], pupil: 'round', irisR: 110, veins: 20 }), 0.35, '#ffb020');
  const tm = toothMat();
  const sp = Q.snoutTip, jz = Q.jawZ;
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.008, i === 1 ? 0.045 : 0.022, 6), tm); t.position.set(sx * (0.02 + i * 0.004), sp[1] - 0.04, sp[2] - 0.02 - i * 0.03); t.rotation.x = Math.PI; g.add(t); }
    for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.008, i === 1 ? 0.04 : 0.02, 6), tm); t.position.set(sx * (0.018 + i * 0.004), jz[1] + 0.01, jz[2] - 0.02 - i * 0.03); g.add(t); }
  }
  // collar + name tag
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.014, 8, 30), new THREE.MeshPhysicalMaterial({ color: pickV(variant, ['#b01818', '#1a4ab0', '#2a8a3a', '#c8a020']), roughness: 0.5, clearcoat: 0.3 }));
  collar.position.set(...Q.neck); collar.rotation.x = 1.0; g.add(collar);
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 16), new THREE.MeshStandardMaterial({ color: '#d8c070', metalness: 1, roughness: 0.25 }));
  tag.position.set(Q.neck[0], Q.neck[1] - 0.1, Q.neck[2] + 0.05); tag.rotation.x = 1.3; g.add(tag);
  // drool
  const slime = new THREE.MeshPhysicalMaterial({ color: '#e0e0d0', roughness: 0.05, transmission: 0.5, transparent: true, opacity: 0.75 });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.03, jz[1], jz[2]), new THREE.Vector3(0.035, jz[1] - 0.08, jz[2] + 0.01), new THREE.Vector3(0.03, jz[1] - 0.16, jz[2])]), 8, 0.004, 6), slime));
  const cm = clawMat();
  return shadowAll(g);
}
culDeSacHound.variants = true;

// ============ GUTTER HAG ============
export function gutterHag({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const B = humanoid({ height: 1.6, bulk: 0.72, belly: 0.3, shoulders: 0.9, head: 1.12, hunch: 1.2, armL: 'forward', armR: 'reach', nose: 'long', ears: 'point', jaw: 'normal', legBulk: 0.7 });
  const s = B.scale;
  // shawl and skirt as a draped shell over the body
  const rags = (x, y, z) => {
    const ux = x / s, uy = y / s, uz = z / s;
    let d = ell(ux, uy, uz, 0, 1.26, 0.12, 0.33, 0.2, 0.25); // shawl over hunched shoulders
    d = smin(d, rcone(ux, uy, uz, 0, 0.95, 0.06, 0, 0.05, 0.0, 0.22, 0.36), 0.08); // skirt
    d = Math.max(d, -(rcone(ux, uy, uz, 0, 0.95, 0.06, 0, 0.05, 0.0, 0.2, 0.34))); // hollow
    const hem = 0.06 + vnoise(ux * 18, 0, uz * 18) * 0.06; d = Math.max(d, hem - uy);
    if (Math.abs(d) < 0.03) d += Math.sin(Math.atan2(ux, uz) * 22 + uy * 6) * 0.006 + vnoise(ux * 40, uy * 20, uz * 40) * 0.004;
    return d * s;
  };
  const sdf = (x, y, z) => Math.min(B.sdf(x, y, z), rags(x, y, z));
  const rag1 = pickV(variant, ['#4a3a4a', '#3a4a3a', '#5a3a2a', '#3a3a4a']);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    if (rags(x, y, z) < B.sdf(x, y, z)) {
      c.copy(C(rag1)).lerp(C('#1a1614'), clamp01(fbm(x * 10, y * 10, z * 10) + 0.4));
      if (vnoise(x * 6, y * 6, z * 6) > 0.4) c.lerp(C('#5a4a20'), 0.5); // soup stains
    } else {
      c.copy(C('#8a9a7a')).lerp(C('#4a5a3a'), clamp01(fbm(x * 14, y * 14, z * 14) + 0.4)); // sallow green-grey skin
      if (vnoise(x * 50, y * 50, z * 50) > 0.6) c.lerp(C('#3a2a1a'), 0.6); // liver spots / warts
      const nt = B.headCenter; if (z > nt[2] + 0.12 * B.headScale) c.lerp(C('#9a5a4a'), 0.5); // red nose
    }
    c.multiplyScalar(ao);
  };
  const [mn, mx] = B.bbox; mn[0] -= 0.15; mx[0] += 0.15; mn[2] -= 0.1;
  g.add(new THREE.Mesh(buildMesh(sdf, mn, mx, 0.0075, col), skinMaterial({ roughness: 0.68, clearcoat: 0.2, sheen: 0.3, sheenColor: '#7a6a5a', pore: 1 })));
  addEyes(g, B, eyeTexture({ sclera: '#c8c0a0', iris: ['#c8e8ff', '#88a8c8', '#4a6a8a', '#101820'], pupil: 'round', irisR: 50, veins: 120 }), 0.05, '#88ccff');
  // stringy hair from the scalp
  const hairMat = new THREE.MeshPhysicalMaterial({ color: '#b8b0a0', roughness: 0.6, sheen: 1, sheenColor: C('#ffffff') });
  const hc = B.headCenter, hr = 0.14 * B.headScale;
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, el = 0.2 + rnd() * 1.0;
    if (Math.cos(a) > 0.6 && el < 0.9) continue; // keep the face clear
    const root = new THREE.Vector3(hc[0] + Math.sin(a) * Math.cos(el) * hr, hc[1] + Math.sin(el) * hr, hc[2] + Math.cos(a) * Math.cos(el) * hr - 0.02);
    const pts = [root]; let p = root.clone();
    for (let k = 1; k <= 5; k++) { p = p.clone().add(new THREE.Vector3(Math.sin(a) * 0.03 + (rnd() - 0.5) * 0.02, -0.07, Math.cos(a) * 0.01 - 0.02)); pts.push(p); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.0025, 4), hairMat));
  }
  // a few blackened teeth
  const tm = toothMat(); tm.color = C('#8a7a4a'); teethRow(g, [B.mouth[0], B.mouth[1] - 0.004, B.mouth[2] - 0.03], 0.06, 3, 0.02, tm, true);
  // ladle in the reaching hand
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#4a4440', { rust: 120 }), metalness: 0.8, roughness: 0.6 });
  const ladle = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 8), iron); stick.position.y = 0.12;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), iron); bowl.position.y = -0.12; bowl.material.side = THREE.DoubleSide;
  const soup = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshPhysicalMaterial({ color: '#5a6a20', roughness: 0.1, clearcoat: 1 })); soup.rotation.x = -Math.PI / 2; soup.position.y = -0.125;
  ladle.add(stick, bowl, soup); ladle.position.set(...B.handR); ladle.position.y -= 0.04; ladle.rotation.set(0.4, 0, -0.2); g.add(ladle);
  // a bubbling cauldron at her side on some variants
  if (variant % 2 === 0) {
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI * 2, 0.5, Math.PI - 0.5), iron); pot.position.set(0.55, 0.28, 0.25); pot.material.side = THREE.DoubleSide; g.add(pot);
    const brew = new THREE.Mesh(new THREE.CircleGeometry(0.245, 24), new THREE.MeshPhysicalMaterial({ color: '#6a8a1a', emissive: C('#3a5a00'), emissiveIntensity: 0.6, roughness: 0.15, clearcoat: 1 })); brew.rotation.x = -Math.PI / 2; brew.position.set(0.55, 0.5, 0.25); g.add(brew);
    for (let i = 0; i < 7; i++) { const bub = new THREE.Mesh(new THREE.SphereGeometry(0.015 + rnd() * 0.02, 10, 8), brew.material); bub.position.set(0.55 + (rnd() - 0.5) * 0.3, 0.51, 0.25 + (rnd() - 0.5) * 0.3); g.add(bub); }
    const glow = new THREE.PointLight('#9aff3a', 2.5, 1.5); glow.position.set(0.55, 0.7, 0.25); g.add(glow);
  }
  return shadowAll(g);
}
gutterHag.variants = true;

// ============ BOUNCE-HOUSE SLIME ============
export function bounceHouseSlime({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const sdf = (x, y, z) => {
    let d = ell(x, y, z, 0, 0.55, 0, 0.75, 0.55, 0.7);
    d = smin(d, ell(x, y, z, 0.35, 0.28, 0.3, 0.35, 0.28, 0.3), 0.2);
    d = smin(d, ell(x, y, z, -0.42, 0.25, -0.1, 0.32, 0.25, 0.35), 0.2);
    d = smin(d, sph(x, y, z, 0.1, 1.05, 0.1, 0.18), 0.25);
    d = Math.max(d, -y); // flat base
    d += fbm(x * 3, y * 3, z * 3) * 0.04 + vnoise(x * 12, y * 12, z * 12) * 0.006;
    return d;
  };
  const tint = pickV(variant, ['#ff5aa8', '#5ac8ff', '#a8ff5a', '#ffb43a']);
  const col = (x, y, z, nx, ny, nz, ao, c) => { c.copy(C(tint)).lerp(C('#ffffff'), clamp01(ny * 0.4)); c.multiplyScalar(0.6 + ao * 0.4); };
  const jelly = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.08, transmission: 0.85, thickness: 0.6, ior: 1.35, clearcoat: 1, clearcoatRoughness: 0.03, attenuationColor: C(tint), attenuationDistance: 0.8, transparent: true, opacity: 0.92 });
  g.add(new THREE.Mesh(buildMesh(sdf, [-1.0, -0.02, -0.85], [1.0, 1.35, 0.85], 0.02, col), jelly));
  // things it has swallowed: shoe, bones, a skull, a goblin cone, coins
  const inside = new THREE.Group();
  const bone = new THREE.MeshPhysicalMaterial({ color: '#d8ccb0', roughness: 0.5 });
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.3, 4, 8), bone); b.position.set((rnd() - 0.5) * 0.8, 0.25 + rnd() * 0.5, (rnd() - 0.5) * 0.6); b.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); inside.add(b); }
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), bone); skull.position.set(-0.15, 0.6, 0.2); skull.scale.set(1, 1.1, 1.15); inside.add(skull);
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.24), new THREE.MeshPhysicalMaterial({ color: '#d82a2a', roughness: 0.5 })); shoe.position.set(0.25, 0.45, -0.1); shoe.rotation.set(0.5, 0.8, 0.2); inside.add(shoe);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 16), new THREE.MeshPhysicalMaterial({ color: '#ff6a10', roughness: 0.5 })); cone.position.set(0.35, 0.75, 0.05); cone.rotation.z = 1.2; inside.add(cone);
  const gold = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.25 });
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.005, 12), gold); c.position.set((rnd() - 0.5) * 1.0, 0.1 + rnd() * 0.7, (rnd() - 0.5) * 0.7); c.rotation.set(rnd() * 3, 0, rnd() * 3); inside.add(c); }
  g.add(inside);
  // shredded bounce-house vinyl stuck to its skin: striped panels and a turret cap
  const vinyl = canvasTex(256, 256, (cx, w, h) => { for (let i = 0; i < 8; i++) { cx.fillStyle = ['#e82a2a', '#ffd020', '#2a6ae8', '#2ac85a'][i % 4]; cx.fillRect(i * 32, 0, 32, h); } for (let i = 0; i < 300; i++) { cx.fillStyle = `rgba(0,0,0,${rnd() * 0.2})`; cx.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 10, 1 + rnd() * 3); } });
  const vm = new THREE.MeshPhysicalMaterial({ map: vinyl, roughness: 0.35, clearcoat: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.PlaneGeometry(0.4, 0.3, 8, 8); const p = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, vnoise(p.getX(k) * 6, p.getY(k) * 6, i) * 0.05); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, vm); const a = i * 1.6 + 0.4; m.position.set(Math.sin(a) * 0.72, 0.4 + i * 0.12, Math.cos(a) * 0.66); m.lookAt(0, 0.5, 0); m.rotateY(Math.PI); g.add(m);
  }
  const turret = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 16), new THREE.MeshPhysicalMaterial({ color: '#ffd020', roughness: 0.35, clearcoat: 0.8 })); turret.position.set(0.1, 1.3, 0.1); turret.rotation.z = 0.25; g.add(turret);
  const inner = new THREE.PointLight(tint, 1.5, 2); inner.position.set(0, 0.5, 0); g.add(inner);
  return shadowAll(g);
}
bounceHouseSlime.variants = true;

// ============ LAWN GNOME CULTIST ============
export function lawnGnome({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const sdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = rcone(x, y, z, 0, 0.05, 0, 0, 0.42, 0.02, 0.2, 0.15); // robe body
    d = smin(d, ell(x, y, z, 0, 0.05, 0.02, 0.22, 0.06, 0.2), 0.05); // base
    d = smin(d, ell(x, y, z, 0, 0.55, 0.04, 0.14, 0.13, 0.13), 0.06); // head
    d = smin(d, sph(x, y, z, 0, 0.53, 0.17, 0.045), 0.02); // bulbous nose
    d = smin(d, rcone(x, y, z, 0, 0.47, 0.12, 0, 0.22, 0.17, 0.12, 0.05), 0.05); // beard
    d = smin(d, chain(ax, y, z, [[0.14, 0.38, 0.03], [0.16, 0.27, 0.1], [0.06, 0.26, 0.17]], [0.045, 0.035, 0.03], 0.03), 0.03); // arms clasped
    d = smin(d, sph(x, y, z, 0.0, 0.27, 0.18, 0.04), 0.02); // hands
    d = smin(d, rcone(x, y, z, 0, 0.62, 0.02, 0.06, 1.0, -0.12, 0.13, 0.015), 0.04); // pointed hat
    d = smax(d, -sph(ax, y, z, 0.05, 0.58, 0.13, 0.022), 0.008); // eye holes
    // cracks in the ceramic
    const cr = Math.abs(vnoise(x * 18, y * 18, z * 18));
    if (Math.abs(d) < 0.01 && cr < 0.022) d += (0.022 - cr) * 0.15;
    if (Math.abs(d) < 0.01) d += vnoise(x * 60, y * 60, z * 60) * 0.0012;
    return d;
  };
  const hat = pickV(variant, ['#c81a1a', '#1a4ac8', '#1a8a3a', '#6a1a8a']);
  const robe = pickV(variant, ['#2a6a3a', '#5a3a8a', '#c88a1a', '#3a5ac8'], 1);
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    if (y > 0.63 || (y > 0.6 && z < 0.0)) c.copy(C(hat));
    else if (z > 0.1 && y < 0.5 && y > 0.2 && Math.abs(x) < 0.12) c.copy(C('#e8e4dc')); // beard
    else if (y > 0.47) c.copy(C('#e8b898')); // face
    else c.copy(C(robe));
    if (y < 0.09) c.copy(C('#4a6a2a'));
    if (y > 0.24 && y < 0.3 && z > 0.14) c.copy(C('#e8b898'));
    const cr = Math.abs(vnoise(x * 18, y * 18, z * 18)); if (cr < 0.022) c.copy(C('#3a0a08')).lerp(C('#8a1a10'), cr * 45); // something red inside the cracks
    c.lerp(C('#5a5040'), clamp01(vnoise(x * 9, y * 9, z * 9) * 0.6)); // weathering, moss, dirt
    if (y < 0.2) c.lerp(C('#3a4a20'), clamp01((0.2 - y) * 4) * 0.5);
    c.multiplyScalar(ao);
  };
  const ceramic = skinMaterial({ roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2, sheen: 0, pore: 0.25, poreScale: 0.4 });
  g.add(new THREE.Mesh(buildMesh(sdf, [-0.3, -0.02, -0.3], [0.3, 1.05, 0.3], 0.005, col), ceramic));
  // painted-on eyes that glow faintly
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2a10').multiplyScalar(2.5) })); e.position.set(sx * 0.05, 0.58, 0.12); g.add(e); }
  // ritual dagger
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.14, 4), new THREE.MeshStandardMaterial({ color: '#c8c8d0', metalness: 1, roughness: 0.2 })); blade.position.set(0, 0.36, 0.22); g.add(blade);
  g.scale.setScalar(1.0);
  return shadowAll(g);
}
lawnGnome.variants = true;

// ============ COUPON LEECH ============
export function couponLeech({ variant = 0 } = {}) {
  const g = new THREE.Group();
  const spine = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; spine.push([Math.sin(t * 4) * 0.12, 0.12 + Math.sin(t * Math.PI) * 0.22 + (t > 0.8 ? (t - 0.8) * 1.2 : 0), -0.6 + t * 1.15]); }
  const R = spine.map((_, i) => 0.1 + Math.sin((i / 12) * Math.PI) * 0.08);
  const head = spine[12];
  const sdf = (x, y, z) => {
    let d = chain(x, y, z, spine, R, 0.08);
    d = smax(d, -ell(x, y, z, head[0], head[1] + 0.02, head[2] + 0.1, 0.07, 0.07, 0.07), 0.02); // sucker
    // segment rings
    if (Math.abs(d) < 0.03) { d += Math.abs(Math.sin(z * 55)) * 0.006 + fbm(x * 12, y * 12, z * 12) * 0.006; }
    d = Math.max(d, -y + 0.005);
    return d;
  };
  const col = (x, y, z, nx, ny, nz, ao, c) => {
    c.copy(C('#3a2a1a')).lerp(C('#6a5a2a'), clamp01(-ny * 0.6 + 0.3));
    if (Math.abs(Math.sin(z * 55)) < 0.2) c.lerp(C('#1a1208'), 0.6);
    if (Math.abs(x) < 0.03 && ny > 0.7) c.lerp(C('#c8a020'), 0.6); // gold dorsal stripe
    if (Math.hypot(x - head[0], y - head[1] - 0.02) < 0.07 && z > head[2]) c.copy(C('#5a0a10'));
    c.multiplyScalar(ao);
  };
  g.add(new THREE.Mesh(buildMesh(sdf, [-0.35, -0.02, -0.8], [0.35, 0.65, 0.75], 0.0085, col), skinMaterial({ roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.3, sheenColor: '#6a5a20', pore: 0.4 })));
  // coins stuck in its hide and a trail of coupons
  const gold = new THREE.MeshStandardMaterial({ color: '#e0b040', metalness: 1, roughness: 0.25 });
  for (let i = 0; i < 26; i++) {
    const k = 1 + Math.floor(rnd() * 10), p = spine[k], a = rnd() * Math.PI;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.005, 14), gold);
    c.position.set(p[0] + Math.cos(a) * R[k] * 0.95, p[1] + Math.sin(a) * R[k] * 0.95, p[2] + (rnd() - 0.5) * 0.05); c.lookAt(p[0], p[1], p[2]); c.rotateX(Math.PI / 2); g.add(c);
  }
  const coupon = canvasTex(256, 128, (cx, w, h) => { cx.fillStyle = '#f0e8c8'; cx.fillRect(0, 0, w, h); cx.setLineDash([6, 4]); cx.strokeStyle = '#333'; cx.lineWidth = 3; cx.strokeRect(6, 6, w - 12, h - 12); cx.fillStyle = '#c81a1a'; cx.font = 'bold 44px sans-serif'; cx.fillText('50% OFF', 30, 70); cx.fillStyle = '#333'; cx.font = '18px sans-serif'; cx.fillText('YOUR LIFE*', 70, 100); });
  const cm = new THREE.MeshPhysicalMaterial({ map: coupon, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), cm); pl.position.set((rnd() - 0.5) * 0.5, 0.004 + i * 0.001, -0.6 - rnd() * 0.5 + i * 0.05); pl.rotation.set(-Math.PI / 2, 0, rnd() * 6); g.add(pl); }
  const tm = toothMat();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, t = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.025, 5), tm); t.position.set(head[0] + Math.cos(a) * 0.055, head[1] + 0.02 + Math.sin(a) * 0.055, head[2] + 0.12); t.lookAt(head[0], head[1] + 0.02, head[2]); t.rotateX(Math.PI / 2); g.add(t); }
  return shadowAll(g);
}
couponLeech.variants = true;
