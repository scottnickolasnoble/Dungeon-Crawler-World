// Cave Troll: sculpted body plus separately meshed arms on shoulder pivots, so it can be animated.
import * as THREE from '../node_modules/three/build/three.module.js';
import { vnoise, fbm, clamp01, rnd, smin, ell, rcone, sph, chain, buildMesh, skinMaterial, canvasTex, eyeTexture, eyeMesh, grimeTex, toothMat, clawMat } from '../sculpt.js';
import { humanoid } from '../anatomy.js';

const C = (h) => new THREE.Color(h);

function hideColor(x, y, z, nx, ny, nz, ao, c) {
  c.copy(C('#6a7462')).lerp(C('#2a3024'), clamp01(fbm(x * 5, y * 5, z * 5) + 0.35 - ny * 0.2)); // grey-green stony hide
  const lichen = vnoise(x * 7 + 4, y * 7, z * 7); if (lichen > 0.35) c.lerp(C('#8a9a3a'), clamp01((lichen - 0.35) * 3) * 0.6); // moss + lichen
  if (vnoise(x * 30, y * 30, z * 30) > 0.62) c.lerp(C('#1a1a14'), 0.6); // pits and warts
  if (ny < -0.4) c.lerp(C('#8a8470'), 0.3); // paler underside
  c.multiplyScalar(ao);
}

export function caveTroll() {
  const g = new THREE.Group();
  const B = humanoid({ height: 2.9, bulk: 2.0, belly: 0.9, shoulders: 1.4, head: 0.92, hunch: 1.3, nose: 'long', ears: 'point', jaw: 'underbite', legBulk: 1.8, noArms: true });
  const s = B.scale;
  const mat = skinMaterial({ roughness: 0.72, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.25, sheenColor: '#7a8a6a', pore: 1, poreScale: 0.45 });
  // body (torso, head, legs)
  const sdf = (x, y, z) => { let d = B.sdf(x, y, z); if (Math.abs(d) < 0.04) d += fbm(x * 3, y * 3, z * 3) * 0.02; return d; };
  const [mn, mx] = B.bbox;
  const body = new THREE.Mesh(buildMesh(sdf, mn, mx, 0.016, hideColor), mat);
  const upper = new THREE.Group(); // everything that leans with the torso
  g.add(body);
  // eyes, tusks, teeth
  const et = eyeTexture({ sclera: '#c8b060', iris: ['#ff8a00', '#d85a00', '#7a2a00', '#200800'], pupil: 'slit', irisR: 110, veins: 40 });
  for (const p of B.eyes) { const e = eyeMesh(et, B.eyeR * 0.85, 0.35, '#ff7a00'); e.position.set(...p); g.add(e); }
  const tm = toothMat(); tm.color = C('#d8c890');
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 8), tm); t.position.set(sx * 0.1 * B.headScale, B.mouth[1] + 0.05, B.mouth[2] - 0.04); t.rotation.set(-0.35, 0, -sx * 0.35); g.add(t); }
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05 + rnd() * 0.03, 6), tm); t.position.set((i - 2) * 0.04, B.mouth[1] + 0.025, B.mouth[2] + 0.005 - Math.abs(i - 2) * 0.02); g.add(t); }
  // hide loincloth + bone necklace
  const hide = new THREE.MeshPhysicalMaterial({ map: grimeTex('#3a2a1e', { rust: 60 }), roughness: 0.95, side: THREE.DoubleSide, sheen: 0.5, sheenColor: new THREE.Color('#6a5040') });
  const cloth = new THREE.CylinderGeometry(0.3 * s, 0.36 * s, 0.34 * s, 28, 8, true); const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), zz = cp.getZ(i); const a = Math.atan2(x, zz); cp.setXYZ(i, x * (1 + Math.sin(a * 9) * 0.05), y + (y < -0.1 * s ? vnoise(a * 4, 0, 0) * 0.12 : 0), zz * (1 + Math.sin(a * 9) * 0.05)); }
  cloth.computeVertexNormals();
  const lc = new THREE.Mesh(cloth, hide); lc.position.set(0, 0.74 * s, 0.07 * s); g.add(lc);
  const bone = new THREE.MeshPhysicalMaterial({ color: '#e0d4b8', roughness: 0.5 });
  for (let i = 0; i < 11; i++) { const a = -1.1 + i * 0.22; const b = new THREE.Mesh(i === 5 ? new THREE.SphereGeometry(0.07, 12, 10) : new THREE.CapsuleGeometry(0.018, 0.09, 4, 8), bone); b.position.set(Math.sin(a) * 0.3 * s, 1.36 * s - Math.cos(a) * 0.05 * s - Math.abs(Math.sin(a)) * 0.0, 0.18 * s + Math.cos(a) * 0.17 * s); g.add(b); }
  // arms: separately meshed, pivoting at the shoulders
  const armSDF = (sx) => (x, y, z) => {
    let d = chain(x, y, z, [[0, 0, 0], [sx * 0.08, -0.62, 0.12], [sx * 0.05, -1.22, 0.28]], [0.17, 0.13, 0.11], 0.08);
    d = smin(d, ell(x, y, z, sx * 0.05, -0.3, 0.04, 0.15, 0.28, 0.15), 0.08); // bicep
    d = smin(d, ell(x, y, z, sx * 0.08, -0.9, 0.2, 0.14, 0.26, 0.13), 0.08); // forearm
    d = smin(d, ell(x, y, z, sx * 0.05, -1.36, 0.32, 0.13, 0.14, 0.12), 0.06); // fist
    for (let f = 0; f < 4; f++) d = smin(d, ell(x, y, z, sx * 0.05 + (f - 1.5) * 0.055, -1.43, 0.42, 0.035, 0.05, 0.05), 0.02); // knuckles
    if (Math.abs(d) < 0.04) d += fbm(x * 9, y * 9, z * 9) * 0.012 + (Math.abs(vnoise(x * 38, y * 50, z * 38)) - 0.3) * 0.004;
    return d;
  };
  const arms = {};
  for (const [key, sx, sh] of [['L', 1, B.shoulderL], ['R', -1, B.shoulderR]]) {
    const pivot = new THREE.Group(); pivot.position.set(sh[0] + sx * 0.06, sh[1], sh[2]);
    const m = new THREE.Mesh(buildMesh(armSDF(sx), [-0.35, -1.65, -0.3], [0.35, 0.25, 0.65], 0.016, hideColor), mat); pivot.add(m);
    const cm = clawMat(); for (let f = 0; f < 4; f++) { const cl = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 6), cm); cl.position.set(sx * 0.05 + (f - 1.5) * 0.055, -1.5, 0.45); cl.rotation.x = 2.4; pivot.add(cl); }
    g.add(pivot); arms[key] = pivot;
  }
  // tree-trunk club with iron spikes, gripped in the right fist
  const club = new THREE.Group();
  const trunk = new THREE.CylinderGeometry(0.09, 0.2, 1.7, 16, 24); const tp = trunk.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i); const k = 1 + vnoise(x * 12, y * 4, z * 12) * 0.18; tp.setXYZ(i, x * k, y, z * k); }
  trunk.computeVertexNormals();
  const bark = new THREE.MeshPhysicalMaterial({ map: canvasTex(256, 512, (cx, w, h) => { cx.fillStyle = '#3a2618'; cx.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { cx.strokeStyle = `rgba(${10 + rnd() * 50},${8 + rnd() * 25},4,0.9)`; cx.lineWidth = 1 + rnd() * 5; const x = rnd() * w; cx.beginPath(); cx.moveTo(x, rnd() * h); cx.lineTo(x + (rnd() - 0.5) * 10, rnd() * h); cx.stroke(); } for (let i = 0; i < 30; i++) { cx.fillStyle = 'rgba(90,10,5,0.45)'; cx.beginPath(); cx.arc(rnd() * w, rnd() * h * 0.4, 4 + rnd() * 16, 0, 7); cx.fill(); } }), roughness: 0.9 });
  const log = new THREE.Mesh(trunk, bark); log.position.y = 0.6; club.add(log);
  const iron = new THREE.MeshStandardMaterial({ map: grimeTex('#4a4440', { rust: 120 }), metalness: 0.85, roughness: 0.55 });
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = 0.95 + (i % 5) * 0.11, r = 0.17 + (y - 0.6) * 0.02; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.13, 6), iron); sp.position.set(Math.cos(a) * r, y, Math.sin(a) * r); sp.lookAt(Math.cos(a) * 2, y, Math.sin(a) * 2); sp.rotateX(Math.PI / 2); club.add(sp); }
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 24), iron); band.rotation.x = Math.PI / 2; band.position.y = 0.85; club.add(band);
  club.position.set(-0.05 * 1, -1.38, 0.34); club.rotation.set(1.3, 0, 0); arms.R.add(club);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: g, arms, club, skinMat: mat, headPos: B.headCenter, height: 2.9 * 1.0, mouth: B.mouth };
}
