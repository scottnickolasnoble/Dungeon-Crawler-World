// FLOOR 3 — THE SOUP DISTRICT. Steaming alleys of food stalls and brick tenements under a ceiling of pipes,
// grease rain, neon soup signs. Soup Row (hub), Candlewick Lane (Tallowfolk village), Ladle Gate (outpost),
// the Lamp Market (moth encampment, Bulb Queen), the Rooftop Roost (pigeon encampment, Old Man Coo),
// the two hag kitchens of the Soup Feud, and the Cone Cathedral where the Cone King holds court.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex, inkLine, woodTex, rnd, seeded } from '../engine/ink.js';
import { townFillers } from '../game/npcs.js';
import { roamingPacks } from './spawns.js';

export const FLOOR3 = { name: 'FLOOR 3 · THE SOUP DISTRICT', size: 360, spawn: [0, 1.7, 30], spawnYaw: 0 };

export function buildFloor3(ink, col, onProgress = () => {}) {
  const { scene, fx } = ink;
  const SIZE = 360, CEIL = 16;
  const HUB = [0, 0], LAMP = [100, -90], ROOST = [-105, -85], CATH = [0, -140], GRAN = [120, 40], AUNT = [-120, 45], CANDLE = [70, 120], LADLE = [-60, 135];
  scene.background = new THREE.Color('#2a1a14'); scene.fog = new THREE.Fog('#3a2418', 14, 120);
  const near = (x, z, p, r) => Math.hypot(x - p[0], z - p[1]) < r;
  const zones = [[HUB, 30], [LAMP, 26], [ROOST, 26], [CATH, 26], [GRAN, 15], [AUNT, 15], [CANDLE, 18], [LADLE, 13]];
  const inZone = (x, z) => zones.some(([p, r]) => near(x, z, p, r));
  const map = { pillars: [], cars: [], water: [], pois: [] };
  const dm = new THREE.Object3D();
  const add = (o) => { scene.add(o); return o; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };

  // wet cobbles, a ceiling of pipes and ducts
  const cobble = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#4a3a30'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) { g.fillStyle = `hsl(${20 + rnd() * 10},${18 + rnd() * 10}%,${22 + rnd() * 12}%)`; g.beginPath(); g.ellipse(x + 16, y + 16, 14, 13, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#0d0b12'; for (let i = 0; i < 60; i++) { const x = rnd() * w, y = rnd() * h; inkLine(g, x, y, x + 20, y + (rnd() - 0.5) * 6, 2); } for (let i = 0; i < 25; i++) { g.fillStyle = `rgba(255,200,120,${0.06 + rnd() * 0.1})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 5 + rnd() * 14, rnd() * 3, 0, 7); g.fill(); } }, [SIZE / 10, SIZE / 10]);
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshPhysicalMaterial({ map: cobble, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 }))); ground.rotation.x = -Math.PI / 2;
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon('#2a201c'))); ceil.rotation.x = Math.PI / 2; ceil.position.y = CEIL;
  for (const [x, z, ry] of [[0, -SIZE / 2, 0], [0, SIZE / 2, Math.PI], [-SIZE / 2, 0, Math.PI / 2], [SIZE / 2, 0, -Math.PI / 2]]) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, CEIL), toon('#3a2a24'))); w.position.set(x, CEIL / 2, z); w.rotation.y = ry; }
  const pipeM = toon('#8a5a3a'), pipeM2 = toon('#5a6a6a');
  for (let i = 0; i < 24; i++) { const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.5 + (i % 3) * 0.2, 0.5 + (i % 3) * 0.2, SIZE, 10), i % 2 ? pipeM : pipeM2)); p.rotation.z = Math.PI / 2; p.position.set(0, CEIL - 1 - (i % 3) * 0.9, -SIZE / 2 + 8 + i * 15); }
  for (let i = 0; i < 12; i++) { const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, SIZE, 10), pipeM)); p.rotation.x = Math.PI / 2; p.position.set(-SIZE / 2 + 15 + i * 30, CEIL - 2.4, 0); }
  scene.add(new THREE.HemisphereLight('#ffc890', '#3a2418', 1.2));
  const key = new THREE.DirectionalLight('#ffd0a0', 0.6); key.position.set(40, 60, 30); scene.add(key);
  onProgress(0.1);

  // tenement blocks laid out on a street grid; alleys between them, plazas cut out for the districts
  const SIGNS = ['PHO REAL', 'BROTH-ERS', 'LADLE LOUNGE', 'NOODLE NOOK', 'STEW YOU', 'SOUP-ER MART', 'DUMPLING DEN', 'GRAVY TRAIN', 'WOK THIS WAY', 'CHOWDER HOUSE', 'BISQUE-IT', 'MISO HAPPY'];
  const brick = (hue) => canvasTex(256, 512, (g, w, h) => { g.fillStyle = `hsl(${hue},38%,30%)`; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? -12 : 0; x < w; x += 24) { g.fillStyle = `hsl(${hue + rnd() * 8},${34 + rnd() * 10}%,${26 + rnd() * 10}%)`; g.fillRect(x + 1, y + 1, 22, 10); }
    for (let fy = 60; fy < h - 20; fy += 90) for (let fx2 = 22; fx2 < w - 30; fx2 += 76) { const lit = rnd() > 0.45; g.fillStyle = lit ? '#ffcf7a' : '#1a1210'; g.fillRect(fx2, fy, 44, 54); g.strokeStyle = '#0d0b12'; g.lineWidth = 5; g.strokeRect(fx2, fy, 44, 54); g.beginPath(); g.moveTo(fx2 + 22, fy); g.lineTo(fx2 + 22, fy + 54); g.stroke(); }
    g.fillStyle = '#1a1210'; g.fillRect(0, h - 70, w, 70); g.fillStyle = '#c8a050'; g.fillRect(80, h - 66, 96, 66); });
  const bodies = [brick(12), brick(22), brick(30), brick(355)].map((t) => toon('#ffffff', { map: t }));
  const blocks = bodies.map(() => []);
  const STEP = 22;
  for (let x = -SIZE / 2 + 16; x < SIZE / 2 - 10; x += STEP) for (let z = -SIZE / 2 + 16; z < SIZE / 2 - 10; z += STEP) {
    if (inZone(x, z)) continue; const k = x * 13 + z * 7; if (seeded(k, 1) < 0.16) continue; // some empty lots
    const w = 10 + seeded(k, 2) * 6, d = 10 + seeded(k, 3) * 6, h = 5 + seeded(k, 4) * 8, ox = (seeded(k, 5) - 0.5) * 3, oz = (seeded(k, 6) - 0.5) * 3;
    blocks[Math.floor(seeded(k, 7) * 4)].push([x + ox, z + oz, w, d, h, k]); col.box(x + ox, z + oz, w / 2, d / 2); map.cars.push([x + ox, z + oz]);
  }
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  blocks.forEach((list, bi) => { const im = add(new THREE.InstancedMesh(boxGeo, bodies[bi], list.length)); list.forEach(([x, z, w, d, h], i) => { dm.position.set(x, h / 2, z); dm.rotation.set(0, 0, 0); dm.scale.set(w, h, d); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); });
  dm.scale.set(1, 1, 1);
  // neon signs on a few buildings, awnings, roof water tanks
  const all = blocks.flat(); const awnM = [toon('#a8281e'), toon('#2a6a4a'), toon('#c8a020'), toon('#2a4a8a')];
  const signTex = SIGNS.map((t, i) => canvasTex(512, 128, (g) => { g.fillStyle = '#120a08'; g.fillRect(0, 0, 512, 128); g.fillStyle = ['#ff3a8a', '#3affea', '#ffd040', '#7aff5a'][i % 4]; g.font = 'bold 74px sans-serif'; g.textAlign = 'center'; g.fillText(t, 256, 92); }));
  const neonLights = [];
  all.forEach(([x, z, w, d, h, k], i) => { if (i % 4 === 0) { const face = Math.floor(seeded(k, 8) * 4); const s = add(new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.8, 7), 1.6), new THREE.MeshBasicMaterial({ map: signTex[i % signTex.length], color: new THREE.Color(1.7, 1.7, 1.7) }))); const n = [[0, d / 2 + 0.05, 0], [0, -d / 2 - 0.05, Math.PI], [w / 2 + 0.05, 0, Math.PI / 2], [-w / 2 - 0.05, 0, -Math.PI / 2]][face]; s.position.set(x + (face >= 2 ? n[0] : 0), Math.min(h - 1, 4.2), z + (face < 2 ? n[1] : 0)); s.rotation.y = n[2]; fx.push(s); if (neonLights.length < 0) neonLights.push(pl(['#ff3a8a', '#3affea', '#ffd040', '#7aff5a'][i % 4], 4, 12, s.position.x + Math.sin(n[2]) * 1.5, 4, s.position.z + Math.cos(n[2]) * 1.5)); }
    if (i % 3 === 1) { const a = add(new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.12, 1.6), awnM[i % 4])); a.position.set(x, 2.8, z + d / 2 + 0.7); a.rotation.x = 0.25; }
    if (i % 5 === 2) { const tk = add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2, 12), woodM())); tk.position.set(x + w * 0.2, h + 1.4, z - d * 0.2); } });
  function woodM() { return toon('#ffffff', { map: woodTex() }); }
  onProgress(0.3);

  // street clutter: food carts, bins, crates, steam vents
  const cartM = [toon('#c84a2a'), toon('#2a8a6a'), toon('#d8a030'), toon('#6a3a8a')];
  const steamM = new THREE.MeshBasicMaterial({ color: '#f0e8e0', transparent: true, opacity: 0.08, depthWrite: false });
  const vents = [];
  for (let i = 0; i < 90; i++) { const x = (seeded(i, 41) - 0.5) * SIZE * 0.92, z = (seeded(i, 42) - 0.5) * SIZE * 0.92; if (inZone(x, z) || col.blocked(x, z, 1.2)) continue;
    const t = i % 3; if (t === 0) { const c = new THREE.Group(); c.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 1), cartM[i % 4]), 0, 0.9, 0)); c.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), toon('#1a1a1a')), -0.7, 0.4, 0.55)); c.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 12), toon('#9aa0a8')), 0.4, 1.6, 0)); const um = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.5, 8), cartM[(i + 1) % 4]); um.position.y = 2.6; c.add(um); c.position.set(x, 0, z); c.rotation.y = seeded(i, 43) * 6; add(c); col.circle(x, z, 1.1); }
    else if (t === 1) { const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 1, 10), toon('#3a4a3a'))); b.position.set(x, 0.5, z); col.circle(x, z, 0.45); }
    else { const v = add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12), toon('#2a2a2a'))); v.position.set(x, 0.04, z); for (let k = 0; k < 4; k++) { const s = add(new THREE.Mesh(new THREE.SphereGeometry(0.45 + k * 0.2, 10, 8), steamM)); s.position.set(x, 0.8 + k * 1.2, z); fx.push(s); vents.push({ s, k, x, z, o: i }); } } }
  onProgress(0.4);

  // grease rain: falling drops recycled each frame
  const rainN = 900; const rain = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), new THREE.MeshBasicMaterial({ color: '#c89a5a', transparent: true, opacity: 0.45 }), rainN)); const drops = [];
  for (let i = 0; i < rainN; i++) drops.push({ x: (seeded(i, 61) - 0.5) * 120, y: seeded(i, 62) * CEIL, z: (seeded(i, 63) - 0.5) * 120, v: 7 + seeded(i, 64) * 4 });

  // SOUP ROW (hub): a plaza around the Great Cauldron, ringed with stalls and lanterns
  const cauldron = new THREE.Group(); cauldron.add(at(new THREE.Mesh(new THREE.SphereGeometry(4, 24, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), toon('#2a2a2e')), 0, 4.2, 0));
  const soupM = new THREE.MeshPhysicalMaterial({ color: '#c86a2a', roughness: 0.2, clearcoat: 1, emissive: new THREE.Color('#5a2a0a'), emissiveIntensity: 0.6 }); const soup = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), soupM); soup.rotation.x = -Math.PI / 2; soup.position.y = 3.1; cauldron.add(soup);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), toon('#2a2a2e')); const a = i / 6 * 6.28; l.position.set(Math.cos(a) * 3.2, 0.7, Math.sin(a) * 3.2); cauldron.add(l); }
  const fireC = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.6, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff8a2a').multiplyScalar(2.4) })); fireC.position.y = 0.8; cauldron.add(fireC); fx.push(fireC);
  const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 8), woodM()); ladle.position.set(1.5, 5.5, 0); ladle.rotation.z = -0.5; cauldron.add(ladle);
  add(cauldron); col.circle(0, 0, 4.3); const cauldLight = pl('#ff8a3a', 40, 26, 0, 5, 0);
  const hubSteam = []; for (let k = 0; k < 10; k++) { const s = add(new THREE.Mesh(new THREE.SphereGeometry(0.9 + k * 0.18, 12, 8), steamM)); s.position.set(0, 5 + k, 0); fx.push(s); hubSteam.push(s); }
  const stallT = (txt, c) => canvasTex(256, 96, (g) => { g.fillStyle = c; g.fillRect(0, 0, 256, 96); g.fillStyle = '#f4eedc'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText(txt, 128, 60); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 96); });
  const wt = woodTex();
  for (const [a, txt, c] of [[0.3, "WICKLEY'S", '#5a2a10'], [1.2, 'BONE BROTH', '#3a2a1a'], [2.0, 'NOODLES', '#2a4a5a'], [2.9, 'BENCHES', '#3a2a1a'], [3.7, 'HOT POT', '#7a1a1a'], [4.5, 'TEA', '#2a5a2a'], [5.4, 'PIES', '#6a4a1a']]) {
    const x = Math.cos(a) * 17, z = Math.sin(a) * 17; const s = new THREE.Group(); s.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 1.2), toon('#ffffff', { map: wt })), 0, 0.5, 0));
    for (const sx of [-1.6, 1.6]) s.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), toon('#4a3020')), sx, 1.3, -0.5));
    const aw = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 1.8), toon(c)); aw.position.set(0, 2.6, 0); aw.rotation.x = 0.2; s.add(aw); s.add(at(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: stallT(txt, c) })), 0, 3.1, 0.6));
    s.position.set(x, 0, z); s.rotation.y = -a - Math.PI / 2; add(s); col.box(x, z, 1.7, 0.6, a + Math.PI / 2);
  }
  // lantern strings across the plaza
  const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd08a').multiplyScalar(2.6) });
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; for (let i = 1; i < 12; i++) { const t = i / 12; const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), bulb)); b.position.set(Math.cos(a) * (5 + t * 20), 9 - Math.sin(t * Math.PI) * 2.5, Math.sin(a) * (5 + t * 20)); fx.push(b); } }
  const gateT = canvasTex(512, 96, (g) => { g.fillStyle = '#2a1408'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#ffb040'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.fillText('SOUP ROW', 256, 72); });
  const gate = add(new THREE.Mesh(new THREE.PlaneGeometry(7, 1.3), new THREE.MeshBasicMaterial({ map: gateT, side: THREE.DoubleSide }))); gate.position.set(0, 5, 27);
  for (const sx of [-3.6, 3.6]) { add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.4, 0.4), toon('#4a3020')), sx, 2.7, 27)); col.circle(sx, 27, 0.35); }
  onProgress(0.55);

  // LAMP MARKET (moth encampment): a hanging forest of bulbs, broken fixtures, the Bulb Queen's chandelier throne
  { const [X, Z] = LAMP; const glowB = [new THREE.MeshBasicMaterial({ color: new THREE.Color('#f0f8ff').multiplyScalar(2.6) }), new THREE.MeshBasicMaterial({ color: new THREE.Color('#d8ffb0').multiplyScalar(2.2) })];
    for (let i = 0; i < 140; i++) { const a = seeded(i, 71) * 6.28, r = 3 + seeded(i, 72) * 22, h = 3 + seeded(i, 73) * 9; const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.22 + seeded(i, 74) * 0.25, 8, 6), glowB[i % 2])); b.position.set(X + Math.cos(a) * r, h, Z + Math.sin(a) * r); fx.push(b); const wire = add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, CEIL - h, 4), toon('#1a1a1a'))); wire.position.set(b.position.x, (CEIL + h) / 2, b.position.z); }
    const chand = new THREE.Mesh(new THREE.TorusGeometry(4, 0.25, 8, 32), toon('#c8a040')); chand.rotation.x = Math.PI / 2; chand.position.set(X, 8, Z); add(chand); pl('#e8f4ff', 30, 30, X, 7, Z);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; const fix = add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.5), toon('#d8d8d0'))); fix.position.set(X + Math.cos(a) * 18, 0.15 + (i % 3) * 0.3, Z + Math.sin(a) * 18); fix.rotation.y = a; col.box(fix.position.x, fix.position.z, 1.2, 0.3, -a); }
    const sg = add(new THREE.Mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = '#101418'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#e8f4ff'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.fillText('THE LAMP MARKET', 256, 70); }), side: THREE.DoubleSide, color: new THREE.Color(1.6, 1.6, 1.6) }))); sg.position.set(X - 20, 6, Z + 12); sg.rotation.y = -0.8; fx.push(sg); }
  // ROOFTOP ROOST (pigeon encampment): scaffold towers, nests, breadcrumbs, a statue of a man covered in pigeons
  { const [X, Z] = ROOST; const scaff = toon('#6a6a70'), nest = toon('#8a6a3a');
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.2, r = 12 + (i % 2) * 6; const x = X + Math.cos(a) * r, z = Z + Math.sin(a) * r; for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) add(at(new THREE.Mesh(new THREE.BoxGeometry(0.15, 7, 0.15), scaff), x + dx, 3.5, z + dz)); add(at(new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), woodM()), x, 7, z)); add(at(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.35, 6, 12), nest), x, 7.3, z)).rotation.x = Math.PI / 2; col.box(x, z, 1.4, 1.4); }
    const statue = add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 2, 10), toon('#8a8a82'))); statue.position.set(X, 1, Z); col.circle(X, Z, 1.9);
    const crumbs = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.06, 0.1), toon('#d8b878'), 300)); for (let i = 0; i < 300; i++) { dm.position.set(X + (seeded(i, 81) - 0.5) * 40, 0.03, Z + (seeded(i, 82) - 0.5) * 40); dm.rotation.set(0, seeded(i, 83) * 6, 0); dm.updateMatrix(); crumbs.setMatrixAt(i, dm.matrix); }
    pl('#ffe0b0', 20, 30, X, 8, Z); }
  // CONE CATHEDRAL (Cone King, Borough boss): a spire built of traffic cones, pews of car seats
  { const [X, Z] = CATH; const coneTex = canvasTex(128, 128, (g) => { g.fillStyle = '#e8590c'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#eeeae0'; g.fillRect(0, 45, 128, 18); g.fillRect(0, 80, 128, 12); }); const cm = toon('#ffffff', { map: coneTex });
    const spire = add(new THREE.Mesh(new THREE.ConeGeometry(7, CEIL - 1, 16), cm)); spire.position.set(X, (CEIL - 1) / 2, Z - 14); col.circle(X, Z - 14, 7);
    const coneGeo = new THREE.ConeGeometry(0.33, 0.9, 10); coneGeo.translate(0, 0.45, 0); const cones = add(new THREE.InstancedMesh(coneGeo, cm, 260)); let ci = 0;
    for (let i = 0; i < 52; i++) { const a = (i / 52) * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < 0.2) continue; for (let l = 0; l < 4; l++) { dm.position.set(X + Math.cos(a) * 22, l * 0.75, Z + Math.sin(a) * 22); dm.rotation.set(0, i, 0); dm.updateMatrix(); if (ci < 260) cones.setMatrixAt(ci++, dm.matrix); } col.circle(X + Math.cos(a) * 22, Z + Math.sin(a) * 22, 0.6); } cones.count = ci;
    for (let r = 0; r < 4; r++) for (const sx of [-1, 1]) { add(at(new THREE.Mesh(new THREE.BoxGeometry(5, 0.9, 1), toon('#3a2a2a')), X + sx * 6, 0.45, Z + 4 + r * 3.2)); col.box(X + sx * 6, Z + 4 + r * 3.2, 2.5, 0.5); }
    const throne = add(new THREE.Mesh(new THREE.BoxGeometry(3, 3.4, 2), toon('#c8a020'))); throne.position.set(X, 1.7, Z - 5); col.box(X, Z - 5, 1.5, 1); pl('#ffa040', 26, 34, X, 7, Z); }
  // HAG KITCHENS (the Soup Feud): Grandma Gristle's and Auntie Brine's rival cauldrons
  const kitchens = [];
  for (const [[X, Z], name, c] of [[GRAN, "GRANDMA GRISTLE'S", '#6a8a2a'], [AUNT, "AUNTIE BRINE'S", '#2a6a8a']]) { const cd = new THREE.Group(); cd.add(at(new THREE.Mesh(new THREE.SphereGeometry(2.2, 18, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), toon('#1a1a1e')), 0, 2.3, 0)); const sp = new THREE.Mesh(new THREE.CircleGeometry(2, 24), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1, emissive: new THREE.Color(c), emissiveIntensity: 0.5 })); sp.rotation.x = -Math.PI / 2; sp.position.y = 1.7; cd.add(sp); cd.position.set(X, 0, Z); add(cd); col.circle(X, Z, 2.4);
    const sg = add(new THREE.Mesh(new THREE.PlaneGeometry(6, 1), new THREE.MeshBasicMaterial({ map: stallT(name, '#1a1a10'), side: THREE.DoubleSide }))); sg.position.set(X, 4.5, Z + 3); pl(c, 16, 18, X, 3, Z); kitchens.push({ X, Z, c });
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const jar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.9, 10), new THREE.MeshPhysicalMaterial({ color: c, transmission: 0.3, roughness: 0.1 }))); jar.position.set(X + Math.cos(a) * 6, 0.45, Z + Math.sin(a) * 6); col.circle(jar.position.x, jar.position.z, 0.4); } }
  // CANDLEWICK LANE (Tallowfolk village, safe) and LADLE GATE (outpost, safe)
  { const [X, Z] = CANDLE; const wax = toon('#f0e0b8'), flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc040').multiplyScalar(2.6) });
    for (let i = 0; i < 40; i++) { const a = seeded(i, 91) * 6.28, r = 4 + seeded(i, 92) * 13, h = 0.6 + seeded(i, 93) * 3.5; const cdl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.3 + h * 0.06, 0.35 + h * 0.07, h, 10), wax)); cdl.position.set(X + Math.cos(a) * r, h / 2, Z + Math.sin(a) * r); const f = add(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), flameM)); f.position.set(cdl.position.x, h + 0.2, cdl.position.z); fx.push(f); if (h > 2) col.circle(cdl.position.x, cdl.position.z, 0.4); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; const hut = add(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 3, 10), wax)); hut.position.set(X + Math.cos(a) * 11, 1.5, Z + Math.sin(a) * 11); const roof = add(new THREE.Mesh(new THREE.ConeGeometry(2.8, 2.4, 10), toon('#8a5a3a'))); roof.position.set(hut.position.x, 4.2, hut.position.z); col.circle(hut.position.x, hut.position.z, 2.6); }
    pl('#ffc060', 30, 30, X, 5, Z); }
  { const [X, Z] = LADLE; const ladleG = new THREE.Group(); ladleG.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 10), toon('#9aa0a8')), 0, 6, 0)); ladleG.add(at(new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 10, 0, 6.28, Math.PI / 2, Math.PI / 2), toon('#9aa0a8')), 0, 12, 0)); ladleG.position.set(X, 0, Z); add(ladleG); col.circle(X, Z, 0.6);
    for (const sx of [-6, 6]) { add(at(new THREE.Mesh(new THREE.BoxGeometry(1, 6, 1), toon('#5a4a3a')), X + sx, 3, Z + 6)); col.box(X + sx, Z + 6, 0.5, 0.5); } pl('#ffd080', 16, 20, X, 5, Z); }
  // the Unnamed's scratch marks, tucked in the far corner (the long arc starts here)
  { const mk = add(new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = '#c8f0ff'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 70, 0.3, 5.9); g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(i) * 110, 128 + Math.sin(i * 1.7) * 110); g.stroke(); } }), transparent: true, color: new THREE.Color(1.6, 1.6, 1.6), side: THREE.DoubleSide }))); mk.position.set(152, 1.8, -SIZE / 2 + 0.2); fx.push(mk); }
  onProgress(0.8);

  map.pois = [
    { name: 'Soup Row', x: 0, z: 0, r: 28, kind: 'hub', safe: true },
    { name: 'Candlewick Lane', x: CANDLE[0], z: CANDLE[1], r: 17, kind: 'hub', safe: true },
    { name: 'Ladle Gate', x: LADLE[0], z: LADLE[1], r: 12, kind: 'hub', safe: true },
    { name: 'The Lamp Market', x: LAMP[0], z: LAMP[1], r: 24, kind: 'camp', camp: 'lamp', boss: 'bulbQueen', level: '17-22' },
    { name: 'The Rooftop Roost', x: ROOST[0], z: ROOST[1], r: 24, kind: 'camp', camp: 'roost', boss: 'coo', level: '16-21' },
    { name: 'The Cone Cathedral', x: CATH[0], z: CATH[1], r: 24, kind: 'camp', camp: 'cathedral', boss: 'coneKing', level: '19-25' },
    { name: "Grandma Gristle's Kitchen", x: GRAN[0], z: GRAN[1], r: 12, kind: 'landmark' },
    { name: "Auntie Brine's Pot", x: AUNT[0], z: AUNT[1], r: 12, kind: 'landmark' },
    { name: 'Scratch Marks', x: 152, z: -152, r: 5, kind: 'secret' },
  ];
  const mobs = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, r = 6 + (i % 3) * 4; mobs.push({ kind: 'moth', variant: i, lvl: 17 + (i % 3), camp: 'lamp', x: LAMP[0] + Math.cos(a) * r, z: LAMP[1] + Math.sin(a) * r }); }
  mobs.push({ kind: 'bulbQueen', lvl: 22, camp: 'lamp', x: LAMP[0], z: LAMP[1] });
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + 0.3, r = 5 + (i % 3) * 4; mobs.push({ kind: 'pigeon', variant: i, lvl: 16 + (i % 3), camp: 'roost', x: ROOST[0] + Math.cos(a) * r, z: ROOST[1] + Math.sin(a) * r }); }
  mobs.push({ kind: 'coo', lvl: 21, camp: 'roost', x: ROOST[0] + 3, z: ROOST[1] + 3 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, r = 7 + (i % 2) * 6; mobs.push({ kind: i % 3 ? 'goblin' : 'captain', variant: i, lvl: 19 + (i % 3), camp: 'cathedral', x: CATH[0] + Math.cos(a) * r, z: CATH[1] + Math.sin(a) * r + 4 }); }
  mobs.push({ kind: 'coneKing', lvl: 25, camp: 'cathedral', x: CATH[0], z: CATH[1] - 2 });
  mobs.push(...roamingPacks({ size: SIZE, seed: 3, count: 26, avoid: (x, z) => inZone(x, z), kinds: (r) => (r < 0.3 ? 'pigeon' : r < 0.5 ? 'moth' : r < 0.65 ? 'mimic' : r < 0.85 ? 'goblin' : 'thrower'), levelAt: (d) => (d < 70 ? [14, 15] : d < 120 ? [15, 17] : [17, 19]) }));
  const npcs = [
    { id: 'wickley', named: 'wickley', kind: 'quest', title: 'Soup cook · Soup Feud', x: Math.cos(0.3) * 14.5, z: Math.sin(0.3) * 14.5, yaw: -0.3 - Math.PI / 2 + Math.PI, voice: 'wickley' },
    { id: 'ash', named: 'ash', kind: 'quest', title: 'Monk of the Last Light', x: -8, z: 8, yaw: 2.3, voice: 'ash' },
    { id: 'vrask', kind: 'quest', role: 'quest', race: 'lumen', variant: 2, name: 'Judge Vrask', title: 'Food critic (visiting)', x: 7, z: -9, yaw: -0.6, voice: 'vrask', static: true },
    { id: 'bix', kind: 'quest', role: 'trader', race: 'stoneblood', variant: 0, name: 'Bix', title: 'Table merchant', x: Math.cos(2.9) * 14.5, z: Math.sin(2.9) * 14.5, yaw: 1.4, voice: 'merchant', static: true },
    ...townFillers({ x: 0, z: 0, r: 22, r0: 7, count: 12, races: ['ogrekin', 'human', 'gutterkin', 'bogling', 'fennix'], seed: 3 }),
    ...townFillers({ x: CANDLE[0], z: CANDLE[1], r: 14, r0: 3, count: 5, races: ['lumen', 'human'], seed: 5 }),
  ];
  const stairs = { x: CATH[0], z: CATH[1] - 8, r: 3, to: '4', flag: 'coneKing_handled', locked: 'The stairs to Floor 4 are under the Cone King’s throne.' };
  const tick = (t) => {
    for (let i = 0; i < rainN; i++) { const d = drops[i]; d.y -= d.v * 0.016; if (d.y < 0) d.y += CEIL - 1; dm.position.set(ink.camera.position.x + d.x, d.y, ink.camera.position.z + d.z); dm.rotation.set(0, 0, 0); dm.updateMatrix(); rain.setMatrixAt(i, dm.matrix); } rain.instanceMatrix.needsUpdate = true;
    for (const v of vents) { const k = (v.k + t * 0.6 + v.o) % 4; v.s.position.y = 0.6 + k * 1.3; v.s.scale.setScalar(0.6 + k * 0.3); }
    hubSteam.forEach((s, k) => { s.position.y = 5 + ((k + t * 0.5) % 10); s.position.x = Math.sin(t * 0.3 + k) * 1.5; });
    fireC.scale.y = 1 + Math.sin(t * 9) * 0.12; cauldLight.intensity = 38 + Math.sin(t * 13) * 5; soup.rotation.z = t * 0.2;
  };
  onProgress(1);
  return { map, mobs, npcs, stairs, tick, size: SIZE, ceiling: CEIL, kitchens };
}
