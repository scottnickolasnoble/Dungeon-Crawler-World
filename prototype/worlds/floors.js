// Floors 1-6 (720 m across each). Each config: look, obstacle scatter, hub town, 4 villages, encampments with
// bosses, landmarks, quest givers and merchants, an outskirts buffer of weak critters, and roaming monsters.
import * as THREE from '../node_modules/three/build/three.module.js';
import { buildFloor } from './floorgen.js';
import { sceneryF2, sceneryF3, sceneryF4, sceneryF5, sceneryF6 } from './scenery.js';

const DM = new THREE.Object3D();
function inst(H, geo, mat, list) { const im = H.add(new THREE.InstancedMesh(geo, mat, Math.max(1, list.length))); list.forEach((m, i) => im.setMatrixAt(i, m)); im.count = list.length; return im; }
const M4 = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rz = 0) => { DM.position.set(x, y, z); DM.rotation.set(0, ry, rz); DM.scale.set(sx, sy, sz); DM.updateMatrix(); return DM.matrix.clone(); };
const grid = (H, step, seed, fn) => { for (let x = -H.SIZE / 2 + step / 2; x < H.SIZE / 2; x += step) for (let z = -H.SIZE / 2 + step / 2; z < H.SIZE / 2; z += step) { if (H.inZone(x, z)) continue; fn(x, z, H.seeded(x * 7 + z * 3, seed)); } };
const sign = (H, txt, bg, fg, w, h) => new THREE.MeshBasicMaterial({ map: H.canvasTex(512, 128, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 512, 128); g.fillStyle = fg; g.font = 'bold 72px sans-serif'; g.textAlign = 'center'; g.fillText(txt, 256, 92, 490); }), side: THREE.DoubleSide, color: new THREE.Color(1.5, 1.5, 1.5) });
const shopper = (H, label) => sign(H, label, '#1a1210', '#F5C518');

// ======================= FLOOR 1 · THE UNDERCROFT =======================
const F1 = {
  floor: 1, name: 'FLOOR 1 · THE UNDERCROFT', hubName: 'Stairwell Camp', spawn: [0, 1.7, 52], spawnYaw: 0, ceil: 9.5, bg: '#1c1622', fogNear: 18, fogFar: 130, hemi: ['#c8a878', '#2a2028', 1.15], key: '#ffcf8a',
  ground: (g, w, h) => { g.fillStyle = '#5a5654'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? 20 : 120},${Math.random() < 0.5 ? 18 : 115},16,${Math.random() * 0.1})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 18, 2 + Math.random() * 18); } g.strokeStyle = '#e8dca0'; g.lineWidth = 7; for (let x = 0; x <= w; x += w / 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * 0.42); g.moveTo(x, h * 0.58); g.lineTo(x, h); g.stroke(); } g.fillStyle = '#e8dca0'; g.font = 'bold 40px sans-serif'; for (let i = 0; i < 4; i++) g.fillText('B' + (i + 1), i * w / 4 + 30, 60); }, groundTile: 20, ceilColor: '#3a3638', wallColor: '#3a3436',
  hub: { style: 'garage', w: 150, d: 116 },
  scatter(H) { const pillars = [], cars = [[], [], [], [], [], []], lampsOn = [];
    grid(H, 12, 1, (x, z, r) => { pillars.push(M4(x, 4.75, z)); H.col.box(x, z, 0.55, 0.55); H.map.pillars.push([x, z]); if (r > 0.35) lampsOn.push(M4(x + 6, 9.3, z + 6)); for (let k = 0; k < 2; k++) { if (H.seeded(x + k * 31, z) > 0.45) continue; const cx = x + 3 + k * 3, cz = z + 4; const c = Math.floor(H.seeded(cx, cz) * 6); const ry = (H.seeded(cz, cx) - 0.5) * 0.3; cars[c].push(M4(cx, 0, cz, ry)); H.col.box(cx, cz, 0.95, 2.15, -ry, 1.6); H.map.cars.push([cx, cz]); } });
    const pTex = H.canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#7a7470'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8c020'; for (let y = h * 0.82; y < h; y += 26) for (let x = -40; x < w; x += 52) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y); g.lineTo(x + 52, y + 26); g.lineTo(x + 26, y + 26); g.fill(); } g.strokeStyle = '#0d0b12'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); });
    inst(H, new THREE.BoxGeometry(1.1, 9.5, 1.1), H.toon('#ffffff', { map: pTex }), pillars);
    const body = new THREE.BoxGeometry(1.9, 1.35, 4.3); body.translate(0, 0.9, 0); ['#a8281e', '#2a4aa0', '#d8d0c0', '#2a2a2e', '#3a7a4a', '#c8a020'].forEach((c, i) => inst(H, body, H.toon(c), cars[i]));
    inst(H, new THREE.BoxGeometry(1.6, 0.12, 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb24a').multiplyScalar(2.2) }), lampsOn);
    const water = new THREE.MeshPhysicalMaterial({ color: '#1a3038', roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.85 });
    for (const [x, z, rx, rz] of [[60, 160, 20, 12], [-40, 180, 30, 18], [220, 40, 18, 26], [-260, -200, 26, 20], [20, -220, 14, 9], [-300, 60, 22, 14]]) { const w = H.add(new THREE.Mesh(new THREE.CircleGeometry(1, 40), water)); w.rotation.x = -Math.PI / 2; w.scale.set(rx, rz, 1); w.position.set(x, 0.03, z); H.map.water.push([x, z, rx, rz]); }
    H.scene.add(new THREE.PointLight('#ffb24a', 0, 1)); },
  hubDecor(H, hub) { // the chained stairwell tower inside camp
    const t = H.add(new THREE.Mesh(new THREE.BoxGeometry(10, 9.5, 10), H.toon('#8a8480'))); t.position.set(0, 4.75, -36); H.col.box(0, -36, 5, 5);
    const ex = H.add(new THREE.Mesh(new THREE.PlaneGeometry(3, 1), sign(H, 'EXIT ▼', '#0a3a12', '#5aff7a'))); ex.position.set(0, 4.2, -30.9); H.fx.push(ex); H.pl('#5aff7a', 8, 14, 0, 4, -28);
    for (let i = 0; i < 6; i++) { const ch = H.add(new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 6, 12), H.toon('#6a6a72'))); ch.position.set(-1 + (i % 3), 1.2 + Math.floor(i / 3) * 0.5, -30.8); } },
  villages: [{ name: 'Ticket Booth', x: 230, z: -170, races: ['human', 'clanker'], merchants: [{ id: 'v1a', name: 'Booth Attendant', title: 'Provisions', shop: 'provisions' }] }, { name: 'Level B Village', x: -240, z: -180, races: ['gutterkin', 'gutterkin'], merchants: [{ id: 'v1b', name: 'Squatter Nib', title: 'Gear', shop: 'gear' }] }, { name: 'The Lift Shaft', x: -230, z: 220, races: ['human', 'stoneblood'], merchants: [{ id: 'v1c', name: 'Rope Trader Hal', title: 'Provisions', shop: 'provisions' }] }, { name: 'Valet Row', x: 240, z: 230, races: ['human', 'clanker'], merchants: [{ id: 'v1d', name: 'Mechanic Joss', title: 'Gear', shop: 'gear' }] }],
  camps: [
    { name: 'Pylon Point', camp: 'pylon', x: 150, z: -130, r: 22, style: 'cone', mob: ['goblin', 'goblin', 'thrower'], lvl: [6, 8], count: 12, elites: [{ kind: 'captain', lvl: 9 }, { kind: 'captain', lvl: 9, dx: -5, dz: 6 }], boss: 'pylon', bossLvl: 10, level: '6-10' },
    { name: 'The Flooded Bay', camp: 'flooded', x: -150, z: -60, r: 20, style: 'lamprey', mob: 'lamprey', lvl: [5, 7], count: 10, boss: 'bigSucker', bossLvl: 8, level: '5-8' },
    { name: 'The Lightwell', camp: 'lightwell', x: -80, z: 260, r: 18, style: 'moth', mob: 'moth', lvl: [4, 6], count: 9, boss: 'mothMatron', bossLvl: 7, level: '4-7' },
    { name: 'The Pigeon Loft', camp: 'loft', x: 70, z: -270, r: 18, style: 'pigeon', mob: 'pigeon', lvl: [3, 5], count: 9, boss: 'pigeonElder', bossLvl: 6, level: '3-6' },
    { name: 'The Lost Property Office', camp: 'lostprop', x: 300, z: 40, r: 22, style: 'mimic', mob: ['mimic', 'goblin'], lvl: [9, 11], count: 10, boss: 'lostfound', bossLvl: 12, level: '9-12 · Borough' },
  ],
  landmarks: [
    { name: 'The Ramp Spiral', x: -190, z: 80, r: 16, build(H, l) { const m = H.toon('#7a7470'); for (let i = 0; i < 90; i++) { const a = i * 0.21, y = i * 0.11; const s = H.add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 2.6), m)); s.position.set(l.x + Math.cos(a) * 9, y, l.z + Math.sin(a) * 9); s.rotation.y = -a; } H.add(new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 11, 24), H.toon('#6a6462'))).position.set(l.x, 5.5, l.z); H.col.circle(l.x, l.z, 4.6); H.pl('#ffb24a', 16, 24, l.x + 8, 6, l.z); } },
    { name: 'The Burning Bus', x: 100, z: 160, r: 14, build(H, l) { const bus = H.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 3, 11), H.toon('#c8a020'))); bus.position.set(l.x, 1.7, l.z); bus.rotation.set(0, 0.6, 0.12); H.col.box(l.x, l.z, 1.3, 5.5, -0.6); const fl = []; for (let i = 0; i < 12; i++) { const f = H.add(new THREE.Mesh(new THREE.ConeGeometry(0.5 + H.seeded(i, 51) * 0.5, 2 + H.seeded(i, 52) * 2, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 3 ? '#ff7a1a' : '#ffd040').multiplyScalar(2.6) }))); f.position.set(l.x + (H.seeded(i, 53) - 0.5) * 5, 3.8 + H.seeded(i, 54), l.z + (H.seeded(i, 55) - 0.5) * 9); H.fx.push(f); fl.push(f); } const L = H.pl('#ff7a1a', 50, 40, l.x, 5, l.z); return (t) => { fl.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 7 + i) * 0.2; }); L.intensity = 46 + Math.sin(t * 11) * 6; }; } },
    { name: 'The Exit Sign', x: 0, z: -350, r: 20, build(H, l) { const s = H.add(new THREE.Mesh(new THREE.BoxGeometry(26, 9, 1), new THREE.MeshBasicMaterial({ map: H.canvasTex(512, 192, (g) => { g.fillStyle = '#0a3a12'; g.fillRect(0, 0, 512, 192); g.fillStyle = '#5aff7a'; g.font = 'bold 150px sans-serif'; g.fillText('EXIT', 80, 160); }), color: new THREE.Color(2, 2, 2), fog: false }))); s.position.set(0, 5, -359); H.fx.push(s); H.pl('#5aff7a', 30, 40, 0, 5, -345); } },
  ],
  outskirts: { kind: 'pigeon', lvl: [1, 2], count: 16 },
  roam: { count: 46, kinds: (r, d, i) => (r < 0.12 ? 'thrower' : r < 0.25 ? 'moth' : r < 0.35 ? 'lamprey' : r < 0.42 && d > 200 ? 'mimic' : 'goblin'), levelAt: (d) => (d < 150 ? [1, 3] : d < 220 ? [3, 5] : d < 290 ? [5, 8] : [7, 10]) },
  questNPCs: (S) => [{ id: 'marta', named: 'marta', kind: 'quest', name: 'Marta Vance', title: 'Camp leader', x: S.quests[0][0], z: S.quests[0][1], yaw: 0.6, voice: 'marta' }],
  merchants: [{ id: 'pickles', named: 'pickles', name: 'Pickles', title: 'Junk trader', shop: 'pickles', voice: 'pickles' }, { id: 'bo', name: 'Benchwright Bo', title: 'Table merchant', shop: 'tables', race: 'stoneblood', voice: 'bo' }, { id: 'm1g', name: 'Rusty Kell', title: 'Weapons & armour', shop: 'gear' }, { id: 'm1p', name: 'Dot', title: 'Food, water, potions', shop: 'provisions' }],
  townsfolk: { races: ['human', 'gutterkin'] }, innkeeper: 'Barb the Innkeeper',
  stairs: { x: 0, z: -29, r: 3.4, to: '2', flag: 'f1_stairs', how: 'Talk to Marta Vance in Stairwell Camp and take “The Chained Stairwell”. Deal with Sergeant Pylon at Pylon Point (kill him, or broker a truce through Pickles), then report back to Marta.', locked: 'The stairwell door is chained. Marta knows why.' },
};

// ======================= FLOOR 2 · SPIN CITY =======================
const F2 = {
  floor: 2, name: 'FLOOR 2 · SPIN CITY', hubName: 'The Laundromat', spawn: [0, 1.7, 52], spawnYaw: 0, ceil: 12, bg: '#1a2a2e', fogNear: 14, fogFar: 115, hemi: ['#c8f0e8', '#2a3a30', 1.25], key: '#e8fff8',
  groundMat: () => new THREE.MeshPhysicalMaterial({ map: (() => { const t = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const n = 8, s = 64; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#d8e0d8' : '#3a7a7a'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = '#0d0b12'; g.lineWidth = 3; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); } return c; })()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(90, 90); t.colorSpace = THREE.SRGBColorSpace; return t; })(), roughness: 0.15, clearcoat: 0.8 }),
  ceilColor: '#2a3a3c', wallColor: '#2a3a3c', hub: { style: 'laundry', w: 150, d: 116 },
  scatter(H) { sceneryF2(H);
    const canal = new THREE.MeshPhysicalMaterial({ color: '#2a5a3a', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9, emissive: new THREE.Color('#0a3a1a'), emissiveIntensity: 0.4 });
    for (const [w, d] of [[H.SIZE, 7], [7, H.SIZE]]) { const c = H.add(new THREE.Mesh(new THREE.PlaneGeometry(w, d), canal)); c.rotation.x = -Math.PI / 2; c.position.y = 0.04; } H.map.water.push([0, 0, 3.5, 360], [0, 0, 360, 3.5]); },
  villages: [{ name: 'Lint Hollow', x: -240, z: -170, races: ['gutterkin', 'gutterkin'], merchants: [{ id: 'v2a', name: 'Lint Picker Fen', title: 'Provisions', shop: 'provisions' }] }, { name: 'Coin-Op Corner', x: 250, z: -30, races: ['human', 'clanker'], merchants: [{ id: 'v2b', name: 'Change Machine Carl', title: 'Gear', shop: 'gear' }] }, { name: 'Dryer Heights', x: -70, z: -280, races: ['fennix', 'fennix'], merchants: [{ id: 'v2c', name: 'Vix', title: 'Gear', shop: 'gear' }] }, { name: 'Bleach Wells', x: 70, z: 290, races: ['bogling', 'human'], merchants: [{ id: 'v2d', name: 'Well Keeper Moss', title: 'Water and food', shop: 'provisions' }] }],
  camps: [
    { name: 'Boiler Room 0', camp: 'boiler', x: -200, z: -60, r: 22, style: 'wight', mob: 'wight', lvl: [11, 13], count: 11, boss: 'ebb', bossLvl: 15, level: '11-15 · Borough' },
    { name: 'The Machine Graveyard', camp: 'machines', x: 150, z: -240, r: 20, style: 'mimic', mob: 'mimic', lvl: [10, 12], count: 9, boss: 'dave', bossLvl: 13, level: '10-13' },
    { name: 'The Lint Traps', camp: 'lint', x: -260, z: 110, r: 20, style: 'lamprey', mob: ['lamprey', 'goblin'], lvl: [9, 11], count: 10, boss: 'lintKing', bossLvl: 12, level: '9-12' },
  ],
  landmarks: [
    { name: 'The Great Dryer', x: 210, z: 150, r: 28, build(H, l) { const d = H.add(new THREE.Mesh(new THREE.BoxGeometry(44, 11.5, 20), H.toon('#e8ece8'))); d.position.set(l.x, 5.75, l.z); H.col.box(l.x, l.z, 22, 10); const door = H.add(new THREE.Mesh(new THREE.CircleGeometry(8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb060').multiplyScalar(1.5) }))); door.position.set(l.x, 5.5, l.z + 10.05); H.pl('#ffb060', 40, 40, l.x, 5, l.z + 14); return (t) => { door.material.color.setRGB(1.5 + Math.sin(t * 3) * 0.2, 1.05, 0.55); }; } },
    { name: 'Soap Falls', x: -170, z: 220, r: 18, build(H, l) { const f = H.add(new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 11, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: '#e8fff8', transparent: true, opacity: 0.55, roughness: 0.1, side: THREE.DoubleSide }))); f.position.set(l.x, 5.5, l.z); H.col.circle(l.x, l.z, 8); H.pl('#bff8ff', 20, 30, l.x, 4, l.z); return (t) => { f.rotation.y = t * 0.4; }; } },
    { name: 'Sock Mountain', x: 210, z: 270, r: 22, build(H, l) { const cols = ['#e83a3a', '#3a8ae8', '#f0f0e8', '#e8c020', '#5ad86a', '#c86aa8']; for (let i = 0; i < 160; i++) { const a = H.seeded(i, 81) * 6.28, r = H.seeded(i, 82) * 14, y = Math.max(0, 9 - r * 0.6) * H.seeded(i, 83); const s = H.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.2, 4, 8), H.toon(cols[i % 6]))); s.position.set(l.x + Math.cos(a) * r, y + 0.3, l.z + Math.sin(a) * r); s.rotation.set(H.seeded(i, 84) * 3, H.seeded(i, 85) * 3, 0); } H.col.circle(l.x, l.z, 10); } },
  ],
  outskirts: { kind: 'pigeon', lvl: [7, 8], count: 14 },
  roam: { count: 44, kinds: (r) => (r < 0.35 ? 'wight' : r < 0.5 ? 'thrower' : r < 0.62 ? 'mimic' : r < 0.75 ? 'lamprey' : 'goblin'), levelAt: (d) => (d < 160 ? [8, 10] : d < 240 ? [10, 12] : [12, 15]) },
  questNPCs: (S) => [{ id: 'spin', named: 'spin', kind: 'quest', name: 'Spin Cycle', title: 'Laundromat owner', x: S.quests[0][0], z: S.quests[0][1], yaw: 0.4, voice: 'spin' }, { id: 'reggie', named: 'reggie', kind: 'quest', name: 'Old Reggie', title: 'Retired custodian', x: S.quests[1][0], z: S.quests[1][1], yaw: -0.6, voice: 'reggie' }],
  merchants: [{ id: 'bev', name: 'Bev', title: 'Table merchant', shop: 'tables', race: 'fennix', voice: 'bev' }, { id: 'm2g', name: 'Spool', title: 'Weapons & armour', shop: 'gear' }, { id: 'm2p', name: 'Suds', title: 'Food, water, potions', shop: 'provisions' }, { id: 'm2j', name: 'Rinse', title: 'Junk', shop: 'pickles' }],
  townsfolk: { races: ['gutterkin', 'fennix'] }, innkeeper: 'Mangle the Innkeeper',
  stairs: { x: 0, z: -42, r: 3.4, to: '3', flag: 'ebb_handled', how: 'Defeat Head Custodian Ebb, boss of Boiler Room 0 (west of the Laundromat). The pressure door opens when he falls.', locked: 'The service stairs to Floor 3 are behind Boiler Room 0’s pressure door. Deal with Ebb first.' },
  hubDecor(H) { const t = H.add(new THREE.Mesh(new THREE.BoxGeometry(8, 7, 6), H.toon('#3a5a6a'))); t.position.set(0, 3.5, -46.5); H.col.box(0, -46.5, 4, 3); const ex = H.add(new THREE.Mesh(new THREE.PlaneGeometry(3, 1), sign(H, 'STAIRS ▼', '#0a3a12', '#5aff7a'))); ex.position.set(0, 4.2, -43.4); H.fx.push(ex); },
};

// ======================= FLOOR 3 · THE SOUP DISTRICT =======================
const F3 = {
  floor: 3, name: 'FLOOR 3 · THE SOUP DISTRICT', hubName: 'Soup Row', spawn: [0, 1.7, 52], spawnYaw: 0, ceil: 16, bg: '#2a1a14', fog: '#3a2418', fogNear: 14, fogFar: 125, hemi: ['#ffc890', '#3a2418', 1.2], key: '#ffd0a0',
  ground: (g, w, h) => { g.fillStyle = '#4a3a30'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) { g.fillStyle = `hsl(${20 + Math.random() * 10},${18 + Math.random() * 10}%,${22 + Math.random() * 12}%)`; g.beginPath(); g.ellipse(x + 16, y + 16, 14, 13, 0, 0, 7); g.fill(); } }, groundTile: 10, ceilColor: '#2a201c', wallColor: '#3a2a24',
  hub: { style: 'brick', w: 160, d: 124, callings: true },
  scatter(H) { sceneryF3(H); },
  hubDecor(H, hub) { const c = H.add(new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 14, 0, 6.28, Math.PI * 0.35, Math.PI * 0.65), H.toon('#2a2a2e'))); c.position.set(0, 3.6, 12); H.col.circle(0, 12, 3.6); const soup = H.add(new THREE.Mesh(new THREE.CircleGeometry(3.0, 32), new THREE.MeshPhysicalMaterial({ color: '#c86a2a', emissive: new THREE.Color('#5a2a0a'), emissiveIntensity: 0.6 }))); soup.rotation.x = -Math.PI / 2; soup.position.set(0, 2.7, 12); H.pl('#ff8a3a', 30, 24, 0, 5, 12); },
  villages: [{ name: 'Candlewick Lane', x: 230, z: 240, races: ['lumen', 'human'], merchants: [{ id: 'v3a', name: 'Chandler Wix', title: 'Provisions', shop: 'provisions' }] }, { name: 'Ladle Gate', x: -210, z: 270, races: ['human', 'ogrekin'], merchants: [{ id: 'v3b', name: 'Gatekeeper Brom', title: 'Gear', shop: 'gear' }] }, { name: 'Bonebroth Commons', x: -270, z: -110, races: ['ogrekin', 'ogrekin'], merchants: [{ id: 'v3c', name: 'Big Marrow', title: 'Food', shop: 'provisions' }] }, { name: 'Pantry Keep', x: 260, z: -60, races: ['human', 'stoneblood'], merchants: [{ id: 'v3d', name: 'Quartermaster Rye', title: 'Gear', shop: 'gear' }] }],
  camps: [
    { name: 'The Lamp Market', camp: 'lamp', x: 200, z: -190, r: 22, style: 'moth', mob: 'moth', lvl: [17, 19], count: 11, boss: 'bulbQueen', bossLvl: 22, level: '17-22' },
    { name: 'The Rooftop Roost', camp: 'roost', x: -210, z: -200, r: 22, style: 'pigeon', mob: 'pigeon', lvl: [16, 18], count: 11, boss: 'coo', bossLvl: 21, level: '16-21' },
    { name: "Grandma Gristle's Kitchen", camp: 'gristle', x: 260, z: 110, r: 20, style: 'hag', mob: 'hag', lvl: [18, 20], count: 9, boss: 'gristle', bossLvl: 23, level: '18-23' },
    { name: 'The Cone Cathedral', camp: 'cathedral', x: 0, z: -290, r: 24, style: 'cone', mob: ['goblin', 'thrower', 'captain'], lvl: [19, 21], count: 12, boss: 'coneKing', bossLvl: 25, level: '19-25 · Borough' },
  ],
  landmarks: [
    { name: "Auntie Brine's Pot", x: -260, z: 70, r: 12, build(H, l) { const c = H.add(new THREE.Mesh(new THREE.SphereGeometry(2.2, 18, 12, 0, 6.28, Math.PI * 0.35, Math.PI * 0.65), H.toon('#1a1a1e'))); c.position.set(l.x, 2.3, l.z); H.col.circle(l.x, l.z, 2.4); const s = H.add(new THREE.Mesh(new THREE.CircleGeometry(2, 24), new THREE.MeshPhysicalMaterial({ color: '#2a6a8a', emissive: new THREE.Color('#2a6a8a'), emissiveIntensity: 0.5 }))); s.rotation.x = -Math.PI / 2; s.position.set(l.x, 1.7, l.z); H.pl('#2a6a8a', 16, 18, l.x, 3, l.z); } },
    { name: 'Scratch Marks', x: 330, z: -340, r: 6, kind: 'secret', build(H, l) { const mk = H.add(new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: H.canvasTex(256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.strokeStyle = '#c8f0ff'; g.lineWidth = 7; g.beginPath(); g.arc(128, 128, 70, 0.3, 5.9); g.stroke(); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(i) * 110, 128 + Math.sin(i * 1.7) * 110); g.stroke(); } }), transparent: true, color: new THREE.Color(1.6, 1.6, 1.6), side: THREE.DoubleSide }))); mk.position.set(l.x, 1.8, -359.6); H.fx.push(mk); } },
  ],
  outskirts: { kind: 'pigeon', lvl: [13, 14], count: 14 },
  roam: { count: 46, kinds: (r) => (r < 0.3 ? 'pigeon' : r < 0.5 ? 'moth' : r < 0.62 ? 'mimic' : r < 0.82 ? 'goblin' : r < 0.92 ? 'hag' : 'thrower'), levelAt: (d) => (d < 160 ? [14, 15] : d < 240 ? [15, 17] : [17, 20]) },
  questNPCs: (S) => [{ id: 'wickley', named: 'wickley', kind: 'quest', name: 'Wickley', title: 'Soup cook · Soup Feud', x: S.quests[0][0], z: S.quests[0][1], yaw: 0, voice: 'wickley' }, { id: 'ash', named: 'ash', kind: 'quest', name: 'Brother Ash', title: 'Monk of the Last Light', x: S.quests[1][0], z: S.quests[1][1], yaw: 2.3, voice: 'ash' }, { id: 'vrask', kind: 'quest', role: 'quest', race: 'lumen', variant: 2, name: 'Judge Vrask', title: 'Food critic (visiting)', x: S.quests[2][0], z: S.quests[2][1], yaw: -0.6, voice: 'vrask', static: true }],
  merchants: [{ id: 'bix', name: 'Bix', title: 'Table merchant', shop: 'tables', race: 'stoneblood', voice: 'bix' }, { id: 'm3g', name: 'Cleaver Jo', title: 'Weapons & armour', shop: 'gear' }, { id: 'm3p', name: 'Auntie Dumpling', title: 'Food, water, potions', shop: 'provisions' }, { id: 'm3j', name: 'Scraps', title: 'Junk', shop: 'pickles' }],
  townsfolk: { races: ['ogrekin', 'human'] }, innkeeper: 'Gravy the Innkeeper',
  stairs: { x: 0, z: -282, r: 3.4, to: '4', flag: 'coneKing_handled', how: 'Defeat the Cone King at the Cone Cathedral. The stairs are under his throne, far north of Soup Row.', locked: 'The stairs to Floor 4 are under the Cone King’s throne.' },
};

// ======================= FLOOR 4 · THE ENDLESS MALL =======================
const SHOPNAMES = ['SHOES R US', 'MUZAK & CO', 'PRETZEL HUT', 'BATHS & BEYOND HOPE', 'ELECTRONICS', 'CANDLE CORNER', 'FUN CENTRE', 'HATS!', 'GLAMOUR SHOTS', 'SPORTS DEPOT', 'PET WORLD', 'PHONE CASES', 'CINNAMON', 'TOY BARN', 'SALE SALE SALE', 'FOOD COURT →'];
const F4 = {
  floor: 4, name: 'FLOOR 4 · THE ENDLESS MALL', hubName: 'Food Court Free State', spawn: [0, 1.7, 52], spawnYaw: 0, ceil: 14, bg: '#2a2630', fog: '#3a3640', fogNear: 20, fogFar: 140, hemi: ['#fff4e8', '#4a4048', 1.35], key: '#ffffff',
  ground: (g, w, h) => { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#d8d0c0' : '#c8bca8'; g.fillRect(i * 64, j * 64, 64, 64); } for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`; g.fillRect(Math.random() * w, Math.random() * h, 40, 6); } }, groundTile: 16, ceilColor: '#e8e8f0', wallColor: '#d8d0c8',
  hub: { style: 'mall', w: 156, d: 120 },
  scatter(H) { sceneryF4(H, SHOPNAMES); },
  villages: [{ name: 'Escalator Rise', x: -240, z: -180, races: ['human', 'fennix'], merchants: [{ id: 'v4a', name: 'Rail Guard Tess', title: 'Gear', shop: 'gear' }] }, { name: 'Kiosk Ring', x: 250, z: -170, races: ['human', 'clanker'], merchants: [{ id: 'v4b', name: 'Kiosk Kev', title: 'Provisions', shop: 'provisions' }] }, { name: 'The Changing Rooms', x: -250, z: 200, races: ['fennix', 'fennix'], merchants: [{ id: 'v4c', name: 'Seamstress Pin', title: 'Gear', shop: 'gear' }] }, { name: 'Loading Dock 9', x: 250, z: 240, races: ['grimhide', 'human'], merchants: [{ id: 'v4d', name: 'Smuggler Rook', title: 'Provisions', shop: 'provisions' }] }],
  camps: [
    { name: 'Mall Security HQ', camp: 'security', x: 150, z: -260, r: 22, style: 'mall', mob: 'mallcop', lvl: [26, 28], count: 11, boss: 'kevlar', bossLvl: 30, level: '26-30' },
    { name: 'The Coupon Den', camp: 'coupon', x: -190, z: -40, r: 20, style: 'leech', mob: 'leech', lvl: [25, 27], count: 10, boss: 'notice', bossLvl: 29, level: '25-29' },
    { name: 'The Bounce Castle', camp: 'bounce', x: -60, z: 280, r: 20, style: 'slime', mob: 'slime', lvl: [27, 29], count: 10, boss: 'blob', bossLvl: 31, level: '27-31' },
    { name: 'The Food Court Depths', camp: 'depths', x: 280, z: 40, r: 24, style: 'slime', mob: ['slime', 'leech'], lvl: [29, 31], count: 12, boss: 'kraken', bossLvl: 34, level: '29-34 · Borough' },
    { name: 'The Atrium', camp: 'atrium', x: 0, z: -320, r: 26, style: 'mall', mob: ['mallcop', 'mimic'], lvl: [32, 34], count: 12, boss: 'mallmother', bossLvl: 38, level: '32-38 · City' },
  ],
  landmarks: [{ name: 'The Escalator to Nowhere', x: -150, z: 140, r: 14, build(H, l) { for (let i = 0; i < 20; i++) { const s = H.add(new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 1), H.toon('#9aa0a8'))); s.position.set(l.x, i * 0.55, l.z - 8 + i * 0.8); } const r = H.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 18), H.toon('#2a2a2e'))); r.position.set(l.x + 1.7, 6, l.z); r.rotation.x = -0.6; H.col.box(l.x, l.z, 1.6, 8); } }],
  outskirts: { kind: 'leech', lvl: [22, 23], count: 14 },
  roam: { count: 44, kinds: (r) => (r < 0.3 ? 'mallcop' : r < 0.55 ? 'leech' : r < 0.8 ? 'slime' : 'mimic'), levelAt: (d) => (d < 160 ? [23, 25] : d < 240 ? [25, 28] : [28, 32]) },
  questNPCs: (S) => [{ id: 'sunny', named: 'sunny', kind: 'quest', name: 'Sunny the Sponsor Rep', title: 'Sponsor Rep', x: S.quests[0][0], z: S.quests[0][1], yaw: 0, voice: 'spin' }, { id: 'prickle', named: 'prickle', kind: 'quest', name: 'Madame Prickle', title: 'Kiosk fortune-teller', x: S.quests[1][0], z: S.quests[1][1], yaw: 2, voice: 'marta' }],
  merchants: [{ id: 'm4g', name: 'Clearance Carl', title: 'Weapons & armour', shop: 'gear' }, { id: 'm4p', name: 'Cinnamon Sue', title: 'Food, water, potions', shop: 'provisions' }, { id: 'm4t', name: 'Bo’s Mall Branch', title: 'Table merchant', shop: 'tables', race: 'stoneblood', voice: 'bo' }, { id: 'm4j', name: 'Lost Receipts', title: 'Junk', shop: 'pickles' }],
  townsfolk: { races: ['human', 'fennix'] }, innkeeper: 'Mattress Mo',
  stairs: { x: 278, z: 32, r: 3.4, to: '5', flag: 'kraken_handled', how: 'Defeat the Food Court Kraken in the Food Court Depths. The service lift is east of the Free State.', locked: 'The service lift to Floor 5 is behind the Food Court Kraken.' },
};

// ======================= FLOOR 5 · SUBURBIA INFINITE =======================
const F5 = {
  floor: 5, name: 'FLOOR 5 · SUBURBIA INFINITE', hubName: 'Fort Cul-de-Sac', spawn: [0, 1.7, 52], spawnYaw: 0, ceil: 34, bg: '#8ac8f0', fog: '#a8d8f8', fogNear: 40, fogFar: 200, hemi: ['#ffffff', '#5a8a3a', 1.5], key: '#fff4e0', ceilColor: '#8ac8f0', wallColor: '#9ad0f4',
  ground: (g, w, h) => { g.fillStyle = '#5a9a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? 40 : 120},${140 + Math.random() * 60},40,${Math.random() * 0.3})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 5); } g.fillStyle = '#4a4a50'; g.fillRect(0, h * 0.44, w, h * 0.12); g.fillRect(w * 0.44, 0, w * 0.12, h); g.fillStyle = '#e8e0a0'; for (let x = 0; x < w; x += 40) g.fillRect(x, h * 0.495, 22, 5); }, groundTile: 36,
  hub: { style: 'picket', w: 156, d: 120 },
  scatter(H) { sceneryF5(H); },
  villages: [{ name: 'Maple Drive', x: -240, z: -180, races: ['human', 'human'], merchants: [{ id: 'v5a', name: 'Garage Sale Gail', title: 'Gear', shop: 'gear' }] }, { name: 'The Garage Band', x: 250, z: -170, races: ['grimhide', 'human'], merchants: [{ id: 'v5b', name: 'Drummer Dax', title: 'Provisions', shop: 'provisions' }] }, { name: 'Pool House', x: -250, z: 200, races: ['bogling', 'bogling'], merchants: [{ id: 'v5c', name: 'Lifeguard Lou', title: 'Provisions', shop: 'provisions' }] }, { name: 'Sprinkler Field', x: 250, z: 240, races: ['human', 'fennix'], merchants: [{ id: 'v5d', name: 'Groundskeeper Ida', title: 'Gear', shop: 'gear' }] }],
  camps: [
    { name: 'The Gnome Garden', camp: 'gnomes', x: 160, z: -260, r: 22, style: 'gnome', mob: 'gnome', lvl: [37, 39], count: 12, boss: 'pope', bossLvl: 41, level: '37-41' },
    { name: 'The Dog Park', camp: 'dogpark', x: -200, z: -40, r: 22, style: 'hound', mob: 'hound', lvl: [38, 40], count: 10, boss: 'fetch', bossLvl: 42, level: '38-42' },
    { name: 'The HOA Clubhouse', camp: 'hoa', x: 280, z: 40, r: 24, style: 'gnome', mob: ['gnome', 'mallcop'], lvl: [40, 42], count: 12, boss: 'hoa', bossLvl: 45, level: '40-45 · Borough' },
    { name: 'Town Hall', camp: 'townhall', x: 0, z: -320, r: 26, style: 'hound', mob: ['hound', 'mallcop'], lvl: [43, 45], count: 12, boss: 'mayor', bossLvl: 49, level: '43-49 · City' },
  ],
  landmarks: [{ name: 'The Block Party', x: -80, z: 280, r: 16, kind: 'landmark', build(H, l) { const cols = ['#e83a3a', '#3a8ae8', '#ffd040', '#5ad86a']; for (let i = 0; i < 24; i++) { const b = H.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), H.toon(cols[i % 4]))); b.position.set(l.x + Math.cos(i) * 8, 4 + Math.sin(i * 3) * 0.6, l.z + Math.sin(i) * 8); } const t = H.add(new THREE.Mesh(new THREE.BoxGeometry(8, 1, 3), H.toon('#ffffff'))); t.position.set(l.x, 0.5, l.z); H.col.box(l.x, l.z, 4, 1.5); } }],
  outskirts: { kind: 'gnome', lvl: [34, 35], count: 14 },
  roam: { count: 44, kinds: (r) => (r < 0.4 ? 'gnome' : r < 0.7 ? 'hound' : r < 0.85 ? 'hag' : 'mallcop'), levelAt: (d) => (d < 160 ? [35, 37] : d < 240 ? [37, 40] : [40, 44]) },
  questNPCs: (S) => [{ id: 'deb', named: 'deb', kind: 'quest', name: 'Big Deb', title: 'Fort Cul-de-Sac quartermaster', x: S.quests[0][0], z: S.quests[0][1], yaw: 0, voice: 'pickles' }, { id: 'watch', named: 'watch', kind: 'quest', name: 'the Neighbourhood Watch', title: 'The Neighbourhood Watch', x: S.quests[1][0], z: S.quests[1][1], yaw: 2, voice: 'reggie' }],
  merchants: [{ id: 'm5g', name: 'Yard Sale Yolanda', title: 'Weapons & armour', shop: 'gear' }, { id: 'm5p', name: 'Lemonade Lee', title: 'Food, water, potions', shop: 'provisions' }, { id: 'm5t', name: 'Bo’s Garage', title: 'Table merchant', shop: 'tables', race: 'stoneblood', voice: 'bo' }, { id: 'm5j', name: 'Curbside Cal', title: 'Junk', shop: 'pickles' }],
  townsfolk: { races: ['human', 'bogling'] }, innkeeper: 'Mrs Doily',
  stairs: { x: 278, z: 32, r: 3.4, to: '6', flag: 'hoa_handled', how: 'Deal with the HOA Clubhouse boss. The manhole down is inside their clubhouse grounds, east of Fort Cul-de-Sac.', locked: 'The manhole to Floor 6 is inside the HOA Clubhouse. They have rules about it.' },
};

// ======================= FLOOR 6 · THE CANOPY =======================
const F6 = {
  floor: 6, name: 'FLOOR 6 · THE CANOPY', hubName: 'The Treehouse', spawn: [0, 1.7, 52], spawnYaw: 0, ceil: 40, bg: '#0e1a14', fog: '#12241a', fogNear: 16, fogFar: 120, hemi: ['#a8e8c8', '#1a2a14', 1.15], key: '#c8ffd8', ceilColor: '#0a140e', wallColor: '#14261a',
  ground: (g, w, h) => { g.fillStyle = '#2a3a1e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${30 + Math.random() * 60},${60 + Math.random() * 60},20,${Math.random() * 0.4})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 0, 7); g.fill(); } }, groundTile: 22,
  hub: { style: 'timber', w: 156, d: 120 },
  scatter(H) { sceneryF6(H); },
  villages: [{ name: 'Rope Bridge Hamlet', x: -240, z: -180, races: ['fennix', 'human'], merchants: [{ id: 'v6a', name: 'Ropemaker Twine', title: 'Gear', shop: 'gear' }] }, { name: 'Acorn Store', x: 250, z: -170, races: ['gutterkin', 'human'], merchants: [{ id: 'v6b', name: 'Squirrel Sal', title: 'Provisions', shop: 'provisions' }] }, { name: 'Mossy Hollow', x: -250, z: 200, races: ['bogling', 'bogling'], merchants: [{ id: 'v6c', name: 'Moss Mother', title: 'Provisions', shop: 'provisions' }] }, { name: 'Lantern Ridge', x: 250, z: 240, races: ['lumen', 'human'], merchants: [{ id: 'v6d', name: 'Lamplighter Quill', title: 'Gear', shop: 'gear' }] }],
  camps: [
    { name: 'Glimmerkin Safari Lodge', camp: 'lodge1', x: 0, z: -320, r: 26, style: 'hunter', mob: 'hunter', lvl: [52, 54], count: 10, boss: 'huntLord', bossLvl: 57, level: '52-57 · City' },
    { name: 'Hag Hollow', camp: 'haghollow', x: -200, z: -40, r: 22, style: 'hag', mob: 'hag', lvl: [47, 49], count: 10, boss: 'sludge', bossLvl: 51, level: '47-51' },
    { name: 'The Wild Kennel', camp: 'kennel', x: 170, z: -250, r: 22, style: 'hound', mob: 'hound', lvl: [48, 50], count: 11, boss: 'matriarch', bossLvl: 52, level: '48-52 · Borough' },
    { name: 'Hornback Hunting Camp', camp: 'lodge2', x: 280, z: 40, r: 22, style: 'hunter', mob: ['hunter', 'hound'], lvl: [49, 51], count: 10, level: '49-51 · Lodge' },
  ],
  landmarks: [{ name: 'The Tallest Tree', x: -90, z: 280, r: 16, build(H, l) { const t = H.add(new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 40, 20), H.toon('#3a2a1a'))); t.position.set(l.x, 20, l.z); H.col.circle(l.x, l.z, 12); const g = H.pl('#5affc8', 20, 40, l.x, 6, l.z + 16); } }],
  outskirts: { kind: 'hound', lvl: [44, 45], count: 12 },
  roam: { count: 42, kinds: (r, d) => (r < 0.18 && d > 180 ? 'hunter' : r < 0.45 ? 'hound' : r < 0.7 ? 'hag' : r < 0.85 ? 'slime' : 'gnome'), levelAt: (d) => (d < 160 ? [45, 47] : d < 240 ? [47, 50] : [50, 54]) },
  questNPCs: (S) => [{ id: 'gusset', named: 'gusset', kind: 'quest', name: 'Gusset', title: 'Treehouse warden', x: S.quests[0][0], z: S.quests[0][1], yaw: 0, voice: 'bo' }, { id: 'lantern', named: 'lantern', kind: 'quest', name: 'Elder Lantern', title: 'Elder of the Mothwing', x: S.quests[1][0], z: S.quests[1][1], yaw: 2, voice: 'ash' }],
  merchants: [{ id: 'm6g', name: 'Bark & Blade', title: 'Weapons & armour', shop: 'gear' }, { id: 'm6p', name: 'Forager Fern', title: 'Food, water, potions', shop: 'provisions' }, { id: 'm6t', name: 'Bo’s Treehouse Branch', title: 'Table merchant', shop: 'tables', race: 'stoneblood', voice: 'bo' }, { id: 'm6j', name: 'Twig', title: 'Junk', shop: 'pickles' }],
  townsfolk: { races: ['fennix', 'bogling'] }, innkeeper: 'Old Bramble',
  stairs: { x: 0, z: -312, r: 3.4, to: '7', flag: 'huntLord_handled', how: 'Defeat the Hunt Lord at the Glimmerkin Safari Lodge, far north of the Treehouse.', locked: 'The way down is through the Glimmerkin Safari Lodge.' },
};

export const FLOORDEFS = { 1: F1, 2: F2, 3: F3, 4: F4, 5: F5, 6: F6 };
export function buildFloorN(n, ink, col, onProgress) { return buildFloor(ink, col, FLOORDEFS[n], onProgress); }
