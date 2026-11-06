// FLOOR 1 — THE UNDERCROFT. Builds the walkable chunk into an ink scene and registers collision.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex, inkLine, woodTex, rnd, seeded } from '../engine/ink.js';
import { martaVance, pickles } from '../npcs/floor1to3.js';
import { sergeantPylon } from '../monsters/bosses1.js';

export const FLOOR1 = { name: 'FLOOR 1 · THE UNDERCROFT', size: 360, spawn: [30, 1.7, 2], spawnYaw: Math.PI / 2 };

export function buildFloor1(ink, col, onProgress = () => {}) {
  const { scene, fx } = ink;
  const SIZE = 360, CEIL = 9.5, GRID = 10, PX = 75, PZ = -62, SX = -92, SZ = 40, BX = 42, BZ = 74;
  scene.background = new THREE.Color('#1c1622'); scene.fog = new THREE.Fog('#1c1622', 16, 130);
  const inZone = (x, z) => Math.hypot(x, z) < 26 || Math.hypot(x - PX, z - PZ) < 24 || Math.hypot(x - SX, z - SZ) < 16 || Math.hypot(x - BX, z - BZ) < 12;
  const map = { pillars: [], cars: [], water: [], pois: [] };
  const dm = new THREE.Object3D();
  const add = (o) => { scene.add(o); return o; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

  // floor + ceiling
  const bayTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#5a5654'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? 20 : 120},${rnd() < 0.5 ? 18 : 115},${rnd() < 0.5 ? 16 : 110},${rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 20, 2 + rnd() * 20); }
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(20,16,12,${0.15 + rnd() * 0.25})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); }
    g.strokeStyle = '#e8dca0'; g.lineWidth = 7; for (let x = 0; x <= w; x += w / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * 0.42); g.moveTo(x, h * 0.58); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = '#e8dca0'; g.font = 'bold 40px sans-serif'; for (let i = 0; i < 4; i++) g.fillText('B' + (i + 1), i * w / 4 + 30, 60);
    g.strokeStyle = '#0d0b12'; for (let i = 0; i < 14; i++) { const x = rnd() * w, y = rnd() * h; inkLine(g, x, y, x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 70, 2); }
  }, [SIZE / 20, SIZE / 20]);
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon('#ffffff', { map: bayTex }))); ground.rotation.x = -Math.PI / 2;
  const ceilTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3a3638'; g.fillRect(0, 0, w, h); g.strokeStyle = '#0d0b12'; for (let i = 0; i <= 4; i++) inkLine(g, i * 64, 0, i * 64, h, 6); }, [SIZE / 10, SIZE / 10]);
  const ceiling = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon('#ffffff', { map: ceilTex }))); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = CEIL;
  for (const [x, z, ry] of [[0, -SIZE / 2, 0], [0, SIZE / 2, Math.PI], [-SIZE / 2, 0, Math.PI / 2], [SIZE / 2, 0, -Math.PI / 2]]) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, CEIL), toon('#3a3436'))); w.position.set(x, CEIL / 2, z); w.rotation.y = ry; }
  onProgress(0.1);

  // pillar forest
  const pillarTex = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#7a7470'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 10, 3 + rnd() * 10); } g.fillStyle = '#e8c020'; for (let y = h * 0.82; y < h; y += 26) for (let x = -40; x < w; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.lineTo(x + 40, y + 20); g.lineTo(x + 20, y + 20); g.fill(); } g.fillStyle = '#2a5ac8'; g.fillRect(40, h * 0.3, w - 80, 110); g.fillStyle = '#f0f0f0'; g.font = 'bold 72px sans-serif'; g.fillText('B5', 80, h * 0.3 + 84); g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); });
  const pillarPos = [];
  for (let x = -SIZE / 2 + 5; x < SIZE / 2; x += GRID) for (let z = -SIZE / 2 + 5; z < SIZE / 2; z += GRID) { if (inZone(x, z)) continue; pillarPos.push([x, z]); col.box(x, z, 0.55, 0.55); map.pillars.push([x, z]); }
  const pillars = add(new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, CEIL, 1.1), toon('#ffffff', { map: pillarTex }), pillarPos.length));
  pillarPos.forEach(([x, z], i) => { dm.position.set(x, CEIL / 2, z); dm.rotation.set(0, 0, 0); dm.updateMatrix(); pillars.setMatrixAt(i, dm.matrix); });
  for (let x = -SIZE / 2 + 5; x < SIZE / 2; x += GRID * 2) { const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, SIZE), toon('#5a5456'))); b.position.set(x, CEIL - 0.45, 0); }
  // sodium lights
  const lampOn = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb24a').multiplyScalar(2.2) }), lampOff = new THREE.MeshBasicMaterial({ color: '#4a4030' });
  const onPos = [], offPos = []; for (let x = -SIZE / 2 + 10; x < SIZE / 2; x += GRID) for (let z = -SIZE / 2 + 10; z < SIZE / 2; z += GRID) (seeded(x * 3 + z, 4) > 0.35 ? onPos : offPos).push([x, z]);
  for (const [arr, mat] of [[onPos, lampOn], [offPos, lampOff]]) { const im = add(new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.12, 0.4), mat, arr.length)); arr.forEach(([x, z], i) => { dm.position.set(x, CEIL - 0.15, z); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); }
  scene.add(new THREE.HemisphereLight('#c8a878', '#2a2028', 1.15));
  const key = new THREE.DirectionalLight('#ffcf8a', 0.7); key.position.set(30, 60, 20); scene.add(key);
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };
  onProgress(0.2);

  // abandoned cars
  const carColors = ['#a8281e', '#2a4aa0', '#d8d0c0', '#2a2a2e', '#3a7a4a', '#c8a020', '#7a7a80', '#6a3a8a'];
  const carBody = new THREE.BoxGeometry(1.9, 0.75, 4.3); carBody.translate(0, 0.62, 0);
  const carCab = new THREE.BoxGeometry(1.7, 0.6, 2.2); carCab.translate(0, 1.27, -0.2);
  const carWin = new THREE.BoxGeometry(1.72, 0.42, 2.0); carWin.translate(0, 1.3, -0.2);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14); wheelGeo.rotateZ(Math.PI / 2);
  const carMats = [...carColors.map((c) => toon(c)), toon('#2a2220')], winMat = new THREE.MeshPhysicalMaterial({ color: '#1a2a3a', roughness: 0.1, metalness: 0.3, clearcoat: 1 }), tyre = toon('#141414');
  const slots = [];
  for (let x = -SIZE / 2 + 7; x < SIZE / 2 - 5; x += 2.6) for (let z = -SIZE / 2 + 2; z < SIZE / 2; z += GRID) { const k = x * 7 + z * 3; if (seeded(k, 1) > 0.42 || inZone(x, z)) continue; slots.push({ x, z: z + 2.5, ry: (seeded(k, 5) - 0.5) * 0.25, col: seeded(k, 3) > 0.88 ? 8 : Math.floor(seeded(k, 6) * 8), flipped: seeded(k, 2) > 0.93 }); }
  const byCol = carMats.map(() => []); slots.forEach((c) => { byCol[c.col].push(c); col.box(c.x, c.z, 0.95, 2.15, -c.ry, c.flipped ? 2.0 : 1.55); map.cars.push([c.x, c.z]); });
  byCol.forEach((list, ci) => { if (!list.length) return; const b = new THREE.InstancedMesh(carBody, carMats[ci], list.length), cb = new THREE.InstancedMesh(carCab, carMats[ci], list.length), w = new THREE.InstancedMesh(carWin, winMat, list.length); list.forEach((c, i) => { dm.position.set(c.x, c.flipped ? 1.9 : 0, c.z); dm.rotation.set(0, c.ry, c.flipped ? Math.PI : 0); dm.updateMatrix(); b.setMatrixAt(i, dm.matrix); cb.setMatrixAt(i, dm.matrix); w.setMatrixAt(i, dm.matrix); }); scene.add(b, cb, w); });
  const wheels = add(new THREE.InstancedMesh(wheelGeo, tyre, slots.length * 4)); let wi = 0;
  slots.forEach((c) => { for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) { const p = new THREE.Vector3(wx, c.flipped ? 1.6 : 0.36, wz).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.ry); dm.position.set(c.x + p.x, p.y, c.z + p.z); dm.rotation.set(0, c.ry, 0); dm.updateMatrix(); wheels.setMatrixAt(wi++, dm.matrix); } });
  wheels.count = wi; onProgress(0.3);

  // scenery: carts, ticket machines, puddles, debris
  const steel = toon('#9a9ca0');
  for (let i = 0; i < 70; i++) { const x = (seeded(i, 11) - 0.5) * SIZE * 0.9, z = (seeded(i, 12) - 0.5) * SIZE * 0.9; if (inZone(x, z)) continue; const g = new THREE.Group(); g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.9, 3, 3, 4), new THREE.MeshBasicMaterial({ color: '#8a8c90', wireframe: true })), 0, 0.75, 0)); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), steel); h.rotation.z = Math.PI / 2; h.position.set(0, 1.05, -0.5); g.add(h); g.position.set(x, 0, z); g.rotation.y = seeded(i, 13) * 6; if (seeded(i, 14) > 0.7) { g.rotation.z = Math.PI / 2; g.position.y = 0.3; } add(g); col.circle(x, z, 0.5, 1.0); }
  const ticketTex = canvasTex(128, 256, (g) => { g.fillStyle = '#c8a020'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#0d0b12'; g.fillRect(14, 30, 100, 60); g.fillStyle = '#3affea'; g.font = 'bold 16px monospace'; g.fillText('RIDDLE?', 24, 66); g.fillStyle = '#0d0b12'; g.font = 'bold 20px sans-serif'; g.fillText('PAY HERE', 14, 200); });
  for (let i = 0; i < 14; i++) { const x = (seeded(i, 21) - 0.5) * SIZE * 0.8, z = (seeded(i, 22) - 0.5) * SIZE * 0.8; if (inZone(x, z)) continue; const m = add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.5), toon('#ffffff', { map: ticketTex }))); m.position.set(x, 0.8, z); m.rotation.y = seeded(i, 23) * 6; col.circle(x, z, 0.5); }
  const water = new THREE.MeshPhysicalMaterial({ color: '#1a3038', roughness: 0.03, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.85 });
  for (const [x, z, rx, rz] of [[-60, -30, 22, 14], [30, 30, 10, 6], [-20, 90, 30, 18], [110, 20, 18, 26], [-120, -90, 26, 20], [10, -110, 14, 9]]) { const w = add(new THREE.Mesh(new THREE.CircleGeometry(1, 40), water)); w.rotation.x = -Math.PI / 2; w.scale.set(rx, rz, 1); w.position.set(x, 0.03, z); map.water.push([x, z, rx, rz]); }
  const debris = add(new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.25, 0), toon('#6a6460'), 500));
  for (let i = 0; i < 500; i++) { dm.position.set((seeded(i, 31) - 0.5) * SIZE, 0.1, (seeded(i, 32) - 0.5) * SIZE); dm.rotation.set(seeded(i, 33) * 6, seeded(i, 34) * 6, 0); dm.scale.setScalar(0.3 + seeded(i, 35) * 1.4); dm.updateMatrix(); debris.setMatrixAt(i, dm.matrix); } dm.scale.setScalar(1);
  onProgress(0.4);

  // STAIRWELL CAMP
  const stairTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#8a8480'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.15})`; g.fillRect(rnd() * w, rnd() * h, 4 + rnd() * 10, 4 + rnd() * 10); } g.strokeStyle = '#0d0b12'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); g.fillStyle = '#c81a1a'; g.font = 'bold 54px sans-serif'; g.fillText('STAIRWELL', 110, 120); g.fillStyle = '#2a2a2a'; g.fillRect(180, 260, 150, 252); g.strokeRect(180, 260, 150, 252); g.fillStyle = '#f0f0f0'; g.font = 'bold 30px sans-serif'; g.fillText('LOCKED', 196, 380); });
  const tower = add(new THREE.Mesh(new THREE.BoxGeometry(8, CEIL, 8), toon('#ffffff', { map: stairTex }))); tower.position.y = CEIL / 2; col.box(0, 0, 4, 4);
  const exitS = add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 96, (g) => { g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#5aff7a'; g.font = 'bold 70px sans-serif'; g.fillText('EXIT', 50, 76); }), color: new THREE.Color(1.8, 1.8, 1.8) }))); exitS.position.set(0, 6.5, 4.15);
  pl('#5aff7a', 6, 14, 0, 6, 6);
  const tentCols = ['#8a3a2a', '#3a6a4a', '#c8a050', '#4a5a8a', '#7a4a6a', '#a87a3a', '#5a7a7a'];
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + 0.1, r = 11 + (i % 3) * 3.2; if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0) continue; const colr = tentCols[i % 7]; const tt = canvasTex(128, 128, (g) => { g.fillStyle = colr; g.fillRect(0, 0, 128, 128); for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.2})`; g.fillRect(rnd() * 128, rnd() * 128, 6 + rnd() * 20, 4 + rnd() * 10); } g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128); }); const r0 = 2.0 + seeded(i, 41); const b = add(new THREE.Mesh(new THREE.ConeGeometry(r0, 2.4 + seeded(i, 42) * 0.8, 4), toon('#ffffff', { map: tt }))); const x = Math.cos(a) * r, z = Math.sin(a) * r; b.position.set(x, 1.25, z); b.rotation.y = Math.PI / 4 - a; col.circle(x, z, r0 * 0.8); }
  const fire = new THREE.Group(); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6), toon('#4a2a1a')); l.rotation.set(Math.PI / 2, (i / 6) * Math.PI, 0.3); l.position.y = 0.15; fire.add(l); }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa020').multiplyScalar(2.5) })); flame.position.y = 0.8; fire.add(flame); fx.push(flame);
  fire.position.set(9, 0, 3); add(fire); col.circle(9, 3, 0.8); const fireLight = pl('#ff9a3a', 30, 22, 9, 2.5, 3);
  const stallTex = (txt, c) => canvasTex(256, 96, (g) => { g.fillStyle = c; g.fillRect(0, 0, 256, 96); g.fillStyle = '#f4eedc'; g.font = 'bold 40px sans-serif'; g.fillText(txt, 14, 62); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 96); });
  const wt = woodTex();
  for (const [x, z, ry, txt, c] of [[14, -6, -0.4, "PICKLES' JUNK", '#5a1a10'], [16, 9, 0.6, 'WATER 2c', '#1a4a6a'], [-14, 10, 2.4, 'MED TENT', '#8a1a1a'], [-6, -16, -2.6, 'INN', '#3a2a5a']]) {
    const s = new THREE.Group(); s.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 1.2), toon('#ffffff', { map: wt })), 0, 0.5, 0));
    for (const sx of [-1.6, 1.6]) s.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), toon('#4a3020')), sx, 1.3, -0.5));
    const aw = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 1.8), toon(c)); aw.position.set(0, 2.6, 0); aw.rotation.x = 0.2; s.add(aw);
    s.add(at(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: stallTex(txt, c) })), 0, 3.1, 0.6));
    s.position.set(x, 0, z); s.rotation.y = ry; add(s); col.box(x, z, 1.7, 0.6, -ry);
  }
  pl('#ffd080', 10, 14, 15, 2.6, -4); pl('#ffd080', 10, 14, -13, 2.6, 9);
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; if (a < 0.25 || a > Math.PI * 2 - 0.25) continue; const c = new THREE.Group(); c.add(new THREE.Mesh(carBody, carMats[i % 8]), new THREE.Mesh(carCab, carMats[i % 8])); const x = Math.cos(a) * 23.5, z = Math.sin(a) * 23.5; c.position.set(x, i % 3 === 0 ? 0.9 : 0, z); c.rotation.set(0, -a, i % 3 === 0 ? 1.3 : 0); add(c); col.box(x, z, 0.95, 2.15, a); }
  const gate = add(new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#F5C518'; g.font = 'bold 60px sans-serif'; g.fillText('STAIRWELL CAMP', 18, 70); }), side: THREE.DoubleSide }))); gate.position.set(24.6, 4.2, 0); gate.rotation.y = Math.PI / 2; gate.material.side = THREE.FrontSide; { const back = gate.clone(); back.position.x = 24.4; back.rotation.y = -Math.PI / 2; scene.add(back); }
  for (const sz of [-3, 3]) { add(at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 0.3), toon('#4a3020')), 24.5, 2.3, sz)); col.circle(24.5, sz, 0.3); }
  const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe8a0').multiplyScalar(3) });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; for (let i = 1; i < 14; i++) { const t = i / 14; const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), bulb)); b.position.set(Math.cos(a) * (4.5 + t * 18), 7.5 - Math.sin(t * Math.PI) * 2.2, Math.sin(a) * (4.5 + t * 18)); fx.push(b); } }
  onProgress(0.5);
  const marta = martaVance(); marta.position.set(-12.5, 0, 12.2); marta.rotation.y = 2.4; add(marta); col.circle(-12.5, 12.2, 0.45);
  onProgress(0.6);
  const pick = pickles(); pick.position.set(13.8, 0, -4.8); pick.rotation.y = -1.2; add(pick); col.circle(13.8, -4.8, 0.45);
  onProgress(0.7);

  // PYLON POINT
  const pylon = new THREE.Group(); pylon.position.set(PX, 0, PZ); add(pylon);
  const coneTex = canvasTex(128, 128, (g) => { g.fillStyle = '#e8590c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#eeeae0'; g.fillRect(0, 45, 128, 18); g.fillRect(0, 80, 128, 12); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128); });
  const coneGeo = new THREE.ConeGeometry(0.33, 0.9, 12); coneGeo.translate(0, 0.45, 0);
  const conePos = [];
  for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; if (Math.abs(a - Math.PI) < 0.18) continue; for (let lvl = 0; lvl < 3; lvl++) conePos.push([Math.cos(a) * 19, lvl * 0.75, Math.sin(a) * 19]); col.circle(PX + Math.cos(a) * 19, PZ + Math.sin(a) * 19, 0.6); }
  const towers = [[12, 12], [-12, 12], [12, -12], [-13, -11]];
  for (const [tx, tz] of towers) { for (let lvl = 0; lvl < 9; lvl++) for (let k = 0; k < 4; k++) conePos.push([tx + Math.cos(k * 1.57) * 0.8, lvl * 0.75, tz + Math.sin(k * 1.57) * 0.8]); col.circle(PX + tx, PZ + tz, 1.3); }
  const cones = new THREE.InstancedMesh(coneGeo, toon('#ffffff', { map: coneTex }), conePos.length); conePos.forEach(([x, y, z], i) => { dm.position.set(x, y, z); dm.rotation.set(0, i * 0.7, 0); dm.updateMatrix(); cones.setMatrixAt(i, dm.matrix); }); pylon.add(cones);
  for (const [tx, tz] of towers) { const plat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), toon('#ffffff', { map: wt })); plat.position.set(tx, 6.8, tz); pylon.add(plat); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; const c = new THREE.Group(); c.add(new THREE.Mesh(carBody, carMats[(i + 3) % 9]), new THREE.Mesh(carCab, carMats[(i + 3) % 9])); c.position.set(Math.cos(a) * 9, (i % 2) * 1.3, Math.sin(a) * 9); c.rotation.set((i % 2) * 0.4, -a + 1.57, (i % 3) * 0.3); pylon.add(c); col.box(PX + Math.cos(a) * 9, PZ + Math.sin(a) * 9, 0.95, 2.15, a - 1.57); }
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.8, 24), toon('#5a5450')); stage.position.y = 0.4; pylon.add(stage); col.circle(PX, PZ, 3.8);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.4), new THREE.MeshBasicMaterial({ map: canvasTex(512, 128, (g) => { g.fillStyle = '#e8590c'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#0d0b12'; g.font = 'bold 76px sans-serif'; g.fillText('PYLON POINT', 30, 92); }), side: THREE.DoubleSide })); banner.position.set(0, 5.5, -4); pylon.add(banner);
  const sarge = sergeantPylon(); sarge.position.set(0, 0.8, 0); sarge.rotation.y = 0.6; pylon.add(sarge);
  pl('#ffa040', 22, 30, PX, 5, PZ);
  onProgress(0.85);

  // LANDMARKS
  const rampMat = toon('#ffffff', { map: canvasTex(256, 64, (g) => { g.fillStyle = '#7a7470'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#e8c020'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 26, 16, 10); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 64); }) });
  for (let i = 0; i < 90; i++) { const a = i * 0.21, y = i * 0.11; const seg = add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 2.6), rampMat)); seg.position.set(SX + Math.cos(a) * 9, y, SZ + Math.sin(a) * 9); seg.rotation.y = -a; }
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, CEIL + 2, 24), toon('#6a6462')), SX, CEIL / 2, SZ)); col.circle(SX, SZ, 4.6);
  pl('#ffb24a', 16, 24, SX + 8, 6, SZ);
  const busTex = canvasTex(512, 128, (g) => { g.fillStyle = '#c8a020'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#1a1a1a'; for (let x = 20; x < 500; x += 62) g.fillRect(x, 18, 46, 46); g.fillStyle = '#2a1a10'; for (let i = 0; i < 80; i++) { g.globalAlpha = rnd() * 0.6; g.beginPath(); g.arc(rnd() * 512, rnd() * 128, 6 + rnd() * 20, 0, 7); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#0d0b12'; g.font = 'bold 30px sans-serif'; g.fillText('SCHOOL BUS', 180, 110); });
  const bus = add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.0, 11), toon('#ffffff', { map: busTex }))); bus.position.set(BX, 1.7, BZ); bus.rotation.set(0, 0.6, 0.12); col.box(BX, BZ, 1.3, 5.5, -0.6);
  const flames = [];
  for (let i = 0; i < 14; i++) { const f = add(new THREE.Mesh(new THREE.ConeGeometry(0.4 + seeded(i, 51) * 0.6, 1.6 + seeded(i, 52) * 2.2, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 3 ? '#ff7a1a' : '#ffd040').multiplyScalar(2.6) }))); f.position.set(BX + (seeded(i, 53) - 0.5) * 5, 3.6 + seeded(i, 54), BZ + (seeded(i, 55) - 0.5) * 8); fx.push(f); flames.push(f); }
  const busLight = pl('#ff7a1a', 50, 40, BX, 5, BZ);
  const bigExit = add(new THREE.Mesh(new THREE.BoxGeometry(26, 9, 1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 192, (g) => { g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 512, 192); g.fillStyle = '#5aff7a'; g.font = 'bold 150px sans-serif'; g.fillText('EXIT', 80, 160); }), color: new THREE.Color(2, 2, 2), fog: false }))); bigExit.position.set(0, CEIL - 5, -SIZE / 2 + 2);
  onProgress(1);

  map.pois = [
    { name: 'Stairwell Camp', x: 0, z: 0, r: 26, kind: 'hub', safe: true },
    { name: 'Pylon Point', x: PX, z: PZ, r: 24, kind: 'camp' },
    { name: 'The Ramp Spiral', x: SX, z: SZ, r: 16, kind: 'landmark' },
    { name: 'The Burning Bus', x: BX, z: BZ, r: 14, kind: 'landmark' },
    { name: 'The Exit Sign', x: 0, z: -SIZE / 2 + 6, r: 18, kind: 'landmark' },
  ];
  // goblin spawns: a pack inside Pylon Point, and a few roaming patrols
  const mobs = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.4, r = 6 + (i % 3) * 2.5; mobs.push({ kind: 'goblin', variant: i, x: PX + Math.cos(a) * r, z: PZ + Math.sin(a) * r }); }
  for (const [x, z] of [[40, -20], [55, -35], [-40, -50], [-55, -40], [30, 50], [-60, 60]]) mobs.push({ kind: 'goblin', variant: Math.floor(Math.abs(x + z)) % 6, x, z });
  // animated bits the game loop ticks
  const tick = (t) => { flame.scale.y = 1 + Math.sin(t * 9) * 0.12; fireLight.intensity = 28 + Math.sin(t * 13) * 4; flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 7 + i) * 0.2; }); busLight.intensity = 46 + Math.sin(t * 11) * 6; };
  return { map, mobs, tick, size: SIZE, ceiling: CEIL };
}
