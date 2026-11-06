// FLOOR 2 — SPIN CITY. An endless laundromat-and-sewer maze: humid fog, soap-slick tiles, sewer canals.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex, inkLine, woodTex, rnd, seeded } from '../engine/ink.js';
import { spinCycle, oldReggie } from '../npcs/floor1to3.js';
import { roamingPacks } from './spawns.js';

export const FLOOR2 = { name: 'FLOOR 2 · SPIN CITY', size: 360, spawn: [0, 1.7, 40], spawnYaw: 0 };

export function buildFloor2(ink, col, onProgress = () => {}) {
  const { scene, fx } = ink;
  const SIZE = 360, CEIL = 12;
  const HUB = [0, 0], BOIL = [-90, -70], DRY = [95, -60], FALLS = [-70, 90], SOCK = [80, 95];
  scene.background = new THREE.Color('#1a2a2e'); scene.fog = new THREE.Fog('#1a2a2e', 14, 110);
  const near = (x, z, p, r) => Math.hypot(x - p[0], z - p[1]) < r;
  const inZone = (x, z) => near(x, z, HUB, 30) || near(x, z, BOIL, 26) || near(x, z, DRY, 30) || near(x, z, FALLS, 20) || near(x, z, SOCK, 22) || Math.abs(x) < 6 || Math.abs(z) < 6;
  const map = { pillars: [], cars: [], water: [], pois: [] };
  const dm = new THREE.Object3D();
  const add = (o) => { scene.add(o); return o; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };

  // wet checker tiles, grimy ceiling with pipes
  const tileTex = canvasTex(512, 512, (g, w, h) => { const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#d8e0d8' : '#3a7a7a'; g.fillRect(i * s, j * s, s, s); g.fillStyle = `rgba(30,40,30,${rnd() * 0.25})`; g.fillRect(i * s, j * s, s, s); }
    g.strokeStyle = '#0d0b12'; g.lineWidth = 3; for (let i = 0; i <= n; i++) { inkLine(g, i * s, 0, i * s, h, 3); inkLine(g, 0, i * s, w, i * s, 3); }
    for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(255,255,255,${0.1 + rnd() * 0.15})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 8 + rnd() * 30, 4 + rnd() * 12, rnd() * 3, 0, 7); g.fill(); } // soap smears
  }, [SIZE / 8, SIZE / 8]);
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshPhysicalMaterial({ map: tileTex, roughness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.1 }))); ground.rotation.x = -Math.PI / 2;
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon('#2a3a3c'))); ceil.rotation.x = Math.PI / 2; ceil.position.y = CEIL;
  for (const [x, z, ry] of [[0, -SIZE / 2, 0], [0, SIZE / 2, Math.PI], [-SIZE / 2, 0, Math.PI / 2], [SIZE / 2, 0, -Math.PI / 2]]) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, CEIL), toon('#2a3a3c'))); w.position.set(x, CEIL / 2, z); w.rotation.y = ry; }
  const pipeMat = toon('#7a6a5a');
  for (let i = 0; i < 18; i++) { const z = -SIZE / 2 + 10 + i * 20, p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, SIZE, 10), pipeMat)); p.rotation.z = Math.PI / 2; p.position.set(0, CEIL - 0.6 - (i % 3) * 0.5, z); }
  const tube = new THREE.MeshBasicMaterial({ color: new THREE.Color('#d8fff0').multiplyScalar(1.8) });
  const tubes = add(new THREE.InstancedMesh(new THREE.BoxGeometry(3.2, 0.12, 0.25), tube, 400)); let ti = 0;
  for (let x = -SIZE / 2 + 12; x < SIZE / 2; x += 18) for (let z = -SIZE / 2 + 12; z < SIZE / 2; z += 18) if (ti < 400 && seeded(x + z * 7, 2) > 0.25) { dm.position.set(x, CEIL - 0.1, z); dm.rotation.set(0, 0, 0); dm.updateMatrix(); tubes.setMatrixAt(ti++, dm.matrix); } tubes.count = ti;
  scene.add(new THREE.HemisphereLight('#c8f0e8', '#2a3a30', 1.25));
  const key = new THREE.DirectionalLight('#e8fff8', 0.6); key.position.set(-30, 60, 20); scene.add(key);
  onProgress(0.12);

  // sewer canals: two green channels crossing the floor, with bridges
  const canalM = new THREE.MeshPhysicalMaterial({ color: '#2a5a3a', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9, emissive: new THREE.Color('#0a3a1a'), emissiveIntensity: 0.4 });
  const edgeM = toon('#5a6a62');
  for (const [cx, cz, w, len, rot] of [[0, -120, 8, SIZE, 0], [-140, 0, 8, SIZE, Math.PI / 2]]) {
    const ch = add(new THREE.Mesh(new THREE.PlaneGeometry(len, w), canalM)); ch.rotation.set(-Math.PI / 2, 0, rot); ch.position.set(cx, 0.02, cz);
    for (const s of [-1, 1]) { const e = add(new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 0.6), edgeM)); e.rotation.y = rot; const off = (w / 2 + 0.3) * s; e.position.set(cx + (rot ? off : 0), 0.25, cz + (rot ? 0 : off)); }
    map.water.push(rot ? [cx, 0, w / 2, SIZE / 2] : [0, cz, SIZE / 2, w / 2]);
    // the canal is a hazard: block it except at bridges
    for (let t = -SIZE / 2; t < SIZE / 2; t += 3) { const bx = rot ? cx : t, bz = rot ? t : cz; if (Math.abs(t) < 5 || Math.abs(t - 90) < 4 || Math.abs(t + 90) < 4) continue; col.circle(bx, bz, w / 2 - 0.3); }
    for (const b of [-90, 0, 90]) { const br = add(new THREE.Mesh(new THREE.BoxGeometry(rot ? w + 3 : 6, 0.4, rot ? 6 : w + 3), toon('#ffffff', { map: woodTex() }))); br.position.set(rot ? cx : b, 0.3, rot ? b : cz); }
  }
  onProgress(0.2);

  // the maze: rows of washers and dryers (instanced), with gaps for aisles
  const washTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e8ecec'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8d0d0'; g.fillRect(0, 0, w, 50); g.fillStyle = '#2a3a3a'; g.fillRect(150, 15, 80, 20); for (let i = 0; i < 4; i++) { g.fillStyle = ['#e8c020', '#3ac8ff', '#e83a3a', '#5ad86a'][i]; g.beginPath(); g.arc(30 + i * 28, 25, 8, 0, 7); g.fill(); } g.fillStyle = '#1a2a30'; g.beginPath(); g.arc(w / 2, 150, 70, 0, 7); g.fill(); g.strokeStyle = '#8a9a9a'; g.lineWidth = 12; g.stroke(); g.fillStyle = 'rgba(160,220,255,0.35)'; g.beginPath(); g.arc(w / 2 - 15, 135, 30, 0, 7); g.fill(); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(90,70,40,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 8, 2 + rnd() * 8); } g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); });
  const dryTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d8c8a8'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a2a1a'; g.fillRect(20, 20, 80, 22); g.fillStyle = '#ff6a1a'; g.fillRect(170, 20, 50, 22); g.fillStyle = '#2a1e18'; g.beginPath(); g.arc(w / 2, 150, 75, 0, 7); g.fill(); g.strokeStyle = '#b8a888'; g.lineWidth = 12; g.stroke(); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(90,60,30,${rnd() * 0.18})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 8, 2 + rnd() * 8); } g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); });
  const box = new THREE.BoxGeometry(1.4, 1.5, 1.3); box.translate(0, 0.75, 0);
  const rows = [[], []];
  for (let z = -SIZE / 2 + 8; z < SIZE / 2 - 4; z += 14) for (let x = -SIZE / 2 + 4; x < SIZE / 2 - 2; x += 1.45) {
    const k = Math.floor(x * 3 + z * 11); if (inZone(x, z) || seeded(k, 7) > 0.88 || Math.abs((x % 40) + 40) % 40 < 3.2) continue; // gaps make aisles
    for (const side of [-1, 1]) { const zz = z + side * 0.7; if (inZone(x, zz)) continue; const stack = seeded(k + side, 9) > 0.8 ? 2 : 1; for (let s = 0; s < stack; s++) rows[seeded(k, 4) > 0.5 ? 1 : 0].push([x, s * 1.5, zz, side > 0 ? 0 : Math.PI]); }
    col.box(x, z, 0.75, 1.4, 0, 3);
  }
  rows.forEach((list, i) => { const im = add(new THREE.InstancedMesh(box, toon('#ffffff', { map: i ? dryTex : washTex }), list.length)); list.forEach(([x, y, z, ry], j) => { dm.position.set(x, y, z); dm.rotation.set(0, ry, 0); dm.updateMatrix(); im.setMatrixAt(j, dm.matrix); }); });
  for (const r of rows) for (const [x, , z] of r) if (map.pillars.length < 6000 && seeded(x * 5 + z, 3) > 0.6) map.pillars.push([x, z]);
  onProgress(0.35);

  // clotheslines with hanging laundry over the aisles
  const clothCols = ['#e83a5a', '#3a8ae8', '#f0e8d8', '#5ad86a', '#e8c020', '#a85ae8', '#ff8a3a'];
  const clothM = clothCols.map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide, sheen: 0.6 }));
  const lineM = new THREE.MeshBasicMaterial({ color: '#1a1a1a' });
  for (let i = 0; i < 40; i++) { const x = (seeded(i, 61) - 0.5) * SIZE * 0.9, z = (seeded(i, 62) - 0.5) * SIZE * 0.9, len = 18 + seeded(i, 63) * 20, ry = seeded(i, 64) * Math.PI; const y = 5.5 + seeded(i, 65) * 3;
    const ln = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 4), lineM)); ln.rotation.set(0, ry, Math.PI / 2); ln.position.set(x, y, z);
    for (let k = 0; k < len / 1.3; k++) { const t = -len / 2 + k * 1.3 + 0.6; const w = 0.6 + seeded(i * 50 + k, 66) * 0.6, h = 0.7 + seeded(i * 50 + k, 67) * 1.0; const c = add(new THREE.Mesh(new THREE.PlaneGeometry(w, h, 2, 3), clothM[(i + k) % clothM.length])); c.position.set(x + Math.cos(ry) * t, y - h / 2, z - Math.sin(ry) * t); c.rotation.y = ry; c.rotation.x = (seeded(i + k, 68) - 0.5) * 0.3; } }
  onProgress(0.45);

  // soap bubbles drifting everywhere + suds puddles
  const bubM = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 0.9, roughness: 0.0, iridescence: 1, iridescenceIOR: 1.3, transparent: true, opacity: 0.35, depthWrite: false });
  const bubbles = add(new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), bubM, 600)); const bub = [];
  for (let i = 0; i < 600; i++) { const b = { x: (seeded(i, 71) - 0.5) * SIZE, y: 0.5 + seeded(i, 72) * 9, z: (seeded(i, 73) - 0.5) * SIZE, r: 0.08 + seeded(i, 74) ** 3 * 0.6, s: 0.2 + seeded(i, 75) * 0.5 }; bub.push(b); }
  fx.push(bubbles);
  const sudsM = new THREE.MeshPhysicalMaterial({ color: '#f4fff8', roughness: 0.6, sheen: 1, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 26; i++) { const x = (seeded(i, 81) - 0.5) * SIZE * 0.9, z = (seeded(i, 82) - 0.5) * SIZE * 0.9; if (inZone(x, z)) continue; const s = add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), sudsM)); s.scale.set(2 + seeded(i, 83) * 4, 0.4 + seeded(i, 84) * 0.6, 2 + seeded(i, 85) * 3); s.position.set(x, 0, z); }
  onProgress(0.5);

  // THE LAUNDROMAT (hub): a fortified 24-hour laundromat
  const shopTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a5a7a'; g.fillRect(0, 0, w, 60); g.fillStyle = '#1a2a30'; for (let i = 0; i < 5; i++) g.fillRect(20 + i * 98, 90, 80, 120); g.fillStyle = 'rgba(255,230,160,0.55)'; for (let i = 0; i < 5; i++) g.fillRect(26 + i * 98, 96, 68, 108); g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(80,60,40,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 10, 3 + rnd() * 10); } });
  const shop = add(new THREE.Mesh(new THREE.BoxGeometry(26, 7, 14), toon('#ffffff', { map: shopTex }))); shop.position.set(0, 3.5, -8); col.box(0, -8, 13, 7);
  const neon = add(new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = '#0a1418'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#3affea'; g.font = 'bold 62px sans-serif'; g.fillText('THE LAUNDROMAT', 20, 70); g.fillStyle = '#ff3a8a'; g.font = 'bold 26px sans-serif'; g.fillText('24HR', 440, 30); }), color: new THREE.Color(1.8, 1.8, 1.8) }))); neon.position.set(0, 8.2, -0.9); pl('#3affea', 14, 20, 0, 7, 3);
  // barricade of dryers in a ring, a sock-bunting and a door
  for (let i = 0; i < 34; i++) { const a = (i / 34) * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.22) continue; const x = Math.cos(a) * 26, z = Math.sin(a) * 26 - 4; for (let s = 0; s < 2; s++) { const m = add(new THREE.Mesh(box, toon('#ffffff', { map: s ? washTex : dryTex }))); m.position.set(x, s * 1.5, z); m.rotation.y = -a + Math.PI / 2 + (seeded(i, s) - 0.5) * 0.3; } col.box(x, z, 0.8, 0.8, a); }
  const gate = add(new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = '#1a2a30'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#F5C518'; g.font = 'bold 54px sans-serif'; g.fillText('NO FIGHTING · NO SOCKS', 14, 66); }) }))); gate.position.set(0, 4.2, 22.2);
  for (const sx of [-3.5, 3.5]) { add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 0.3), toon('#4a3020')), sx, 2.3, 22.2)); col.circle(sx, 22.2, 0.3); }
  const benchM = toon('#ffffff', { map: woodTex() });
  for (const [x, z] of [[-8, 6], [8, 6], [-12, 12], [12, 12]]) { add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.9), benchM), x, 0.45, z)); col.box(x, z, 1.5, 0.45); }
  const sp = spinCycle(); sp.position.set(-5, 0, 4); sp.rotation.y = 0.4; add(sp); col.circle(-5, 4, 0.5);
  onProgress(0.62);
  const rg = oldReggie(); rg.position.set(7, 0, 8); rg.rotation.y = -0.6; add(rg); col.circle(7, 8, 0.5);
  onProgress(0.72);

  // BOILER ROOM 0 (Mop Wight encampment): boilers, steam, wet-floor signs, a punch clock, Head Custodian Ebb
  const [BX, BZ] = BOIL;
  const boilerM = toon('#8a4a2a');
  for (const [dx, dz, r, h] of [[-8, -6, 3, 8], [8, -7, 2.6, 7], [0, -12, 3.6, 9], [-12, 6, 2.2, 6]]) { add(at(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), boilerM), BX + dx, h / 2, BZ + dz)); add(at(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), boilerM), BX + dx, h, BZ + dz)); col.circle(BX + dx, BZ + dz, r + 0.2); pl('#ff6a2a', 8, 10, BX + dx, 1.5, BZ + dz + r + 0.5); }
  const steam = new THREE.MeshBasicMaterial({ color: '#e8f0f0', transparent: true, opacity: 0.12, depthWrite: false });
  for (let i = 0; i < 24; i++) { const s = add(new THREE.Mesh(new THREE.SphereGeometry(1 + seeded(i, 91) * 1.5, 10, 8), steam)); s.position.set(BX + (seeded(i, 92) - 0.5) * 24, 2 + seeded(i, 93) * 8, BZ + (seeded(i, 94) - 0.5) * 24); fx.push(s); }
  const signTex = canvasTex(128, 192, (g) => { g.fillStyle = '#f0c818'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#111'; g.font = 'bold 26px sans-serif'; g.fillText('CAUTION', 10, 40); g.font = 'bold 22px sans-serif'; g.fillText('WET FLOOR', 4, 170); g.beginPath(); g.arc(64, 100, 26, 0, 7); g.fill(); });
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; const s = add(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), new THREE.MeshPhysicalMaterial({ map: signTex, roughness: 0.4, side: THREE.DoubleSide }))); s.position.set(BX + Math.cos(a) * 20, 0.45, BZ + Math.sin(a) * 20); s.rotation.y = -a; }
  const bsign = add(new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#ff8a3a'; g.font = 'bold 62px sans-serif'; g.fillText('BOILER ROOM 0', 40, 70); }), side: THREE.DoubleSide }))); bsign.position.set(BX, 9.5, BZ - 4);
  onProgress(0.82);

  // THE GREAT DRYER: a stadium-sized drum, its glowing door turning
  const [DX, DZ] = DRY;
  const drum = add(new THREE.Mesh(new THREE.BoxGeometry(44, CEIL - 0.5, 20), toon('#ffffff', { map: dryTex }))); drum.position.set(DX, (CEIL - 0.5) / 2, DZ - 8); col.box(DX, DZ - 8, 22, 10);
  const door = add(new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb060').multiplyScalar(1.5) }))); door.position.set(DX, 5.5, DZ + 2.05);
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.6, 12, 48), toon('#9a9ca0'))); ring.position.set(DX, 5.5, DZ + 2.1);
  const tumble = new THREE.Group(); tumble.position.set(DX, 5.5, DZ + 1.9); add(tumble);
  for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), clothM[i % clothM.length]); const a = (i / 16) * Math.PI * 2; c.position.set(Math.cos(a) * (3 + (i % 3) * 1.4), Math.sin(a) * (3 + (i % 3) * 1.4), 0); c.rotation.z = a; tumble.add(c); }
  pl('#ffb060', 24, 30, DX, 5, DZ + 6);
  // SOAP FALLS: foam pouring from a burst pipe into a pool
  const [FX, FZ] = FALLS;
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 10, 16), pipeMat), FX, CEIL - 1, FZ)).rotation.z = Math.PI / 2;
  const foamM = new THREE.MeshPhysicalMaterial({ color: '#f4fffa', roughness: 0.4, transparent: true, opacity: 0.75, sheen: 1, emissive: new THREE.Color('#8affea'), emissiveIntensity: 0.15, side: THREE.DoubleSide });
  const falls = add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 3.5, CEIL - 1, 20, 1, true), foamM)); falls.position.set(FX, (CEIL - 1) / 2, FZ);
  const pool = add(new THREE.Mesh(new THREE.CircleGeometry(12, 40), canalM)); pool.rotation.x = -Math.PI / 2; pool.position.set(FX, 0.04, FZ); map.water.push([FX, FZ, 12, 12]); col.circle(FX, FZ, 9);
  for (let i = 0; i < 30; i++) { const s = add(new THREE.Mesh(new THREE.SphereGeometry(0.8 + seeded(i, 101) * 1.6, 12, 8), sudsM)); const a = seeded(i, 102) * 6.28, r = 3 + seeded(i, 103) * 8; s.position.set(FX + Math.cos(a) * r, 0.2, FZ + Math.sin(a) * r); s.scale.y = 0.5; }
  pl('#8affea', 18, 26, FX, 5, FZ + 4);
  // SOCK MOUNTAIN
  const [SX2, SZ2] = SOCK;
  const sockGeo = new THREE.CapsuleGeometry(0.18, 0.55, 4, 8);
  const socks = add(new THREE.InstancedMesh(sockGeo, toon('#ffffff'), 2400)); const cc = new THREE.Color();
  for (let i = 0; i < 2400; i++) { const r = Math.sqrt(seeded(i, 111)) * 18, a = seeded(i, 112) * 6.28, hgt = Math.max(0, (1 - r / 18) * 14) * seeded(i, 113); dm.position.set(SX2 + Math.cos(a) * r, hgt, SZ2 + Math.sin(a) * r); dm.rotation.set(seeded(i, 114) * 6, seeded(i, 115) * 6, seeded(i, 116) * 6); dm.updateMatrix(); socks.setMatrixAt(i, dm.matrix); socks.setColorAt(i, cc.set(clothCols[i % clothCols.length])); }
  col.circle(SX2, SZ2, 12);
  const sockCore = add(new THREE.Mesh(new THREE.ConeGeometry(15, 13, 24), toon('#a89a8a'))); sockCore.position.set(SX2, 6, SZ2);
  onProgress(1);

  map.pois = [
    { name: 'The Laundromat', x: 0, z: 0, r: 28, kind: 'hub', safe: true },
    { name: 'Boiler Room 0', x: BX, z: BZ, r: 24, kind: 'camp', camp: 'boiler', boss: 'ebb', level: '11-15' },
    { name: 'The Great Dryer', x: DX, z: DZ, r: 28, kind: 'landmark' },
    { name: 'Soap Falls', x: FX, z: FZ, r: 18, kind: 'landmark' },
    { name: 'Sock Mountain', x: SX2, z: SZ2, r: 22, kind: 'landmark' },
  ];
  const mobs = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = 7 + (i % 2) * 5; mobs.push({ kind: 'wight', variant: i, lvl: 11 + (i % 3), camp: 'boiler', x: BX + Math.cos(a) * r, z: BZ + Math.sin(a) * r + 4 }); }
  mobs.push({ kind: 'ebb', variant: 0, lvl: 15, camp: 'boiler', x: BX, z: BZ });
  mobs.push(...roamingPacks({ size: SIZE, seed: 2, count: 24, avoid: (x, z) => Math.hypot(x, z) < 34 || Math.hypot(x - BX, z - BZ) < 32 || Math.hypot(x - DX, z - DZ) < 26 || Math.hypot(x - FX, z - FZ) < 16 || Math.hypot(x - SX2, z - SZ2) < 20,
    kinds: (r, d, i) => (r < 0.45 ? 'wight' : r < 0.6 ? 'thrower' : d > 110 && i === 0 ? 'captain' : 'goblin'),
    levelAt: (d) => (d < 70 ? [8, 9] : d < 120 ? [9, 11] : [11, 13]) }));
  const tick = (t) => {
    tumble.rotation.z = t * 0.6; door.material.color.setRGB(1.5 + Math.sin(t * 3) * 0.2, 1.05, 0.55);
    for (let i = 0; i < bub.length; i++) { const b = bub[i]; const y = ((b.y + t * b.s) % 10) + 0.4; dm.position.set(b.x + Math.sin(t * 0.5 + i) * 0.8, y, b.z + Math.cos(t * 0.4 + i) * 0.8); dm.rotation.set(0, 0, 0); dm.scale.setScalar(b.r); dm.updateMatrix(); bubbles.setMatrixAt(i, dm.matrix); }
    bubbles.instanceMatrix.needsUpdate = true; dm.scale.setScalar(1); falls.rotation.y = t * 0.4;
  };
  return { map, mobs, tick, size: SIZE, ceiling: CEIL };
}
