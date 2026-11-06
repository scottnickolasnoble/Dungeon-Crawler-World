// Walled settlements and monster encampments, shared by every floor.
// buildTown: a rectangular walled town with gates, guard posts, districts (market row, quest square with a notice
// board, inn, Safe Room door to the Crash Pad, training yard, guild hall, Hall of Callings, stairwell) and spots
// for merchants, quest givers and townsfolk. Monsters can't enter (the rect is returned as a no-mob zone).
// buildCamp: a themed encampment ring (barricade, tents, banner, bonfire, the leader's dais).
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex, inkLine, woodTex, seeded } from '../engine/ink.js';

const signTex = (txt, bg, fg = '#f4eedc', w = 512, h = 112, font = 62) => canvasTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `bold ${font}px sans-serif`; g.textAlign = 'center'; g.fillText(txt, w / 2, h * 0.68, w - 20); g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); });
const facade = (base, trim, rows = 2, door = true) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; g.fillRect(Math.random() * w, Math.random() * h, 4, 4); }
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) { if (door && r === rows - 1 && c === 1) continue; const x = 26 + c * 76, y = 30 + r * (190 / rows); g.fillStyle = Math.random() > 0.4 ? '#ffd88a' : '#2a2030'; g.fillRect(x, y, 48, 46); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(x, y, 48, 46); g.fillStyle = trim; g.fillRect(x - 4, y + 46, 56, 8); }
  if (door) { g.fillStyle = '#4a2a1a'; g.fillRect(100, h - 96, 56, 96); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(100, h - 96, 56, 96); } g.strokeStyle = '#0d0b12'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); });

export const WALL_STYLES = {
  garage: { wall: '#6a6466', trim: '#e8c020', cap: '#2a2a2e', label: 'concrete barriers and stacked cars' },
  laundry: { wall: '#c8d0cc', trim: '#3a8a8a', cap: '#5a6a6a', label: 'dead washing machines' },
  brick: { wall: '#8a4a32', trim: '#c8a050', cap: '#3a2a24', label: 'brick and pipe' },
  mall: { wall: '#d8d0c8', trim: '#e83a8a', cap: '#8a8a92', label: 'shop shutters' },
  picket: { wall: '#f0f0ec', trim: '#3a8a3a', cap: '#c8c8c0', label: 'picket fence and hedges' },
  timber: { wall: '#7a5a3a', trim: '#5ad86a', cap: '#4a3a24', label: 'log palisade' },
};

export function buildTown(ink, col, o) {
  const { scene, fx } = ink; const add = (m) => { scene.add(m); return m; };
  const { x: X, z: Z, w: W, d: D, name, style = 'garage', gates = ['S', 'N'], floor = 1, big = true } = o; const st = WALL_STYLES[style] || WALL_STYLES.garage;
  const H = big ? 5 : 3.6, GW = 9; const spots = { merchants: [], quests: [], fillers: [], guards: [], doors: [] };
  const wallTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = st.wall; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)'; g.fillRect(i * 44, 0, 40, h); } g.fillStyle = st.trim; g.fillRect(0, h - 20, w, 10); g.strokeStyle = '#0d0b12'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); for (let i = 0; i < 4; i++) inkLine(g, i * 64 + 10, 10, i * 64 + 30, 40, 2); }, [4, 1]);
  const wallM = toon('#ffffff', { map: wallTex }), capM = toon(st.cap);
  // perimeter with gate gaps
  const sides = { N: [[X - W / 2, Z - D / 2], [X + W / 2, Z - D / 2]], S: [[X - W / 2, Z + D / 2], [X + W / 2, Z + D / 2]], W: [[X - W / 2, Z - D / 2], [X - W / 2, Z + D / 2]], E: [[X + W / 2, Z - D / 2], [X + W / 2, Z + D / 2]] };
  const gateAt = {};
  for (const [k, [[ax, az], [bx, bz]]] of Object.entries(sides)) {
    const len = Math.hypot(bx - ax, bz - az), horiz = az === bz; const segs = gates.includes(k) ? [[0, len / 2 - GW / 2], [len / 2 + GW / 2, len]] : [[0, len]];
    if (gates.includes(k)) gateAt[k] = [(ax + bx) / 2, (az + bz) / 2, horiz];
    for (const [s0, s1] of segs) { const L = s1 - s0, c = (s0 + s1) / 2; const cx = horiz ? ax + c : ax, cz = horiz ? az : az + c; const m = add(new THREE.Mesh(new THREE.BoxGeometry(horiz ? L : 1.2, H, horiz ? 1.2 : L), wallM)); m.position.set(cx, H / 2, cz); col.box(cx, cz, horiz ? L / 2 : 0.6, horiz ? 0.6 : L / 2);
      const cap = add(new THREE.Mesh(new THREE.BoxGeometry(horiz ? L : 1.6, 0.4, horiz ? 1.6 : L), capM)); cap.position.set(cx, H + 0.2, cz);
      for (let t = 4; t < L - 2; t += 12) { const px = horiz ? ax + s0 + t : ax, pz = horiz ? az : az + s0 + t; const post = add(new THREE.Mesh(new THREE.BoxGeometry(1.6, H + 1.4, 1.6), capM)); post.position.set(px, (H + 1.4) / 2, pz); } }
  }
  // gate arches with the town name, braziers and two guard posts
  const signM = new THREE.MeshBasicMaterial({ map: signTex(name.toUpperCase(), '#1a1210', '#F5C518'), side: THREE.DoubleSide });
  const fire = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa030').multiplyScalar(2.4) });
  for (const [k, [gx, gz, horiz]] of Object.entries(gateAt)) { const out = k === 'S' ? [0, 1] : k === 'N' ? [0, -1] : k === 'E' ? [1, 0] : [-1, 0];
    for (const s of [-1, 1]) { const px = gx + (horiz ? s * (GW / 2 + 0.8) : 0), pz = gz + (horiz ? 0 : s * (GW / 2 + 0.8)); const p = add(new THREE.Mesh(new THREE.BoxGeometry(1.8, H + 3, 1.8), capM)); p.position.set(px, (H + 3) / 2, pz); col.box(px, pz, 0.9, 0.9);
      const br = add(new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 10), fire)); br.position.set(px + out[0] * 1.2, 1.6, pz + out[1] * 1.2); fx.push(br); spots.guards.push([gx + (horiz ? s * 3 : out[0] * -2.5), gz + (horiz ? out[1] * -2.5 : s * 3), Math.atan2(out[0], out[1])]); }
    const sg = add(new THREE.Mesh(new THREE.PlaneGeometry(GW + 2, 1.8), signM)); sg.position.set(gx, H + 2.4, gz); sg.rotation.y = horiz ? 0 : Math.PI / 2; fx.push(sg);
    const l = new THREE.PointLight('#ffb050', 14, 18, 1.4); l.position.set(gx + out[0] * 3, 4, gz + out[1] * 3); scene.add(l); }
  // ground: paved inside
  const paveTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#7a7068'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < w; x += 32) { g.fillStyle = `hsl(25,${8 + Math.random() * 6}%,${36 + Math.random() * 10}%)`; g.fillRect(x + 2, y + 2, 28, 28); } }, [W / 8, D / 8]);
  const pave = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), toon('#ffffff', { map: paveTex }))); pave.rotation.x = -Math.PI / 2; pave.position.set(X, 0.02, Z);

  // ---- districts ----
  const bld = (bx, bz, bw, bd, bh, label, base, trim, signCol = '#2a1a10', ry = 0) => { const tex = facade(base, trim, bh > 6 ? 3 : 2); const m = add(new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), toon('#ffffff', { map: tex }))); m.position.set(bx, bh / 2, bz); m.rotation.y = ry; col.box(bx, bz, bw / 2, bd / 2, -ry);
    const roof = add(new THREE.Mesh(new THREE.BoxGeometry(bw + 0.6, 0.5, bd + 0.6), toon(trim))); roof.position.set(bx, bh + 0.25, bz); roof.rotation.y = ry;
    if (label) { const s = add(new THREE.Mesh(new THREE.PlaneGeometry(Math.min(bw, 8), 1.2), new THREE.MeshBasicMaterial({ map: signTex(label, signCol), side: THREE.DoubleSide }))); const f = new THREE.Vector3(0, 0, bd / 2 + 0.06).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry); s.position.set(bx + f.x, Math.min(bh - 0.8, 3.6), bz + f.z); s.rotation.y = ry; fx.push(s); }
    const door = new THREE.Vector3(0, 0, bd / 2 + 1.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry); return [bx + door.x, bz + door.z]; };
  const L = (fx_, fz) => [X + fx_ * W / 2, Z + fz * D / 2]; // fraction of half-size
  // quest square: centrepiece fountain + notice board
  const [qx, qz] = L(0, 0);
  const fount = add(new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.9, 24), toon('#8a8a92'))); fount.position.set(qx, 0.45, qz); col.circle(qx, qz, 3.8);
  const water = add(new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), new THREE.MeshPhysicalMaterial({ color: '#3a7aa8', roughness: 0.05, clearcoat: 1 }))); water.rotation.x = -Math.PI / 2; water.position.set(qx, 0.92, qz);
  const spout = add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.6, 10), toon('#9a9aa2'))); spout.position.set(qx, 1.6, qz);
  const board = new THREE.Group(); const bt = canvasTex(256, 192, (g) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, 256, 192); for (let i = 0; i < 7; i++) { g.fillStyle = ['#f4eedc', '#ffe8a0', '#d8f0ff'][i % 3]; g.save(); g.translate(20 + (i % 4) * 58, 22 + Math.floor(i / 4) * 80); g.rotate((Math.random() - 0.5) * 0.2); g.fillRect(0, 0, 48, 62); g.fillStyle = '#c81a14'; g.fillRect(20, -4, 8, 8); g.fillStyle = '#3a3030'; for (let k = 0; k < 5; k++) g.fillRect(6, 12 + k * 9, 36, 3); g.restore(); } g.strokeStyle = '#0d0b12'; g.lineWidth = 8; g.strokeRect(0, 0, 256, 192); });
  board.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.5), toon('#ffffff', { map: bt })), {})); board.children[0].position.y = 2.2; for (const s of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 0.2), toon('#4a3020')); p.position.set(s, 1.7, -0.05); board.add(p); }
  const [nbx, nbz] = [qx + 7, qz - 2]; board.position.set(nbx, 0, nbz); board.rotation.y = -0.6; add(board); col.box(nbx, nbz, 1.8, 0.3, 0.6); spots.board = [nbx + 1, nbz + 1.4];
  spots.quests.push([qx - 6, qz + 3], [qx + 5, qz + 6], [qx - 4, qz - 7], [qx + 9, qz + 3]);
  // market row along the west side
  const mStalls = big ? 8 : 3; const colors = ['#a8281e', '#2a6a4a', '#c8a020', '#2a4a8a', '#7a3a7a', '#c86a2a', '#3a8a8a', '#8a5a2a'];
  const wt = woodTex();
  for (let i = 0; i < mStalls; i++) { const [sx, sz] = L(-0.72, -0.62 + i * (1.24 / Math.max(1, mStalls - 1))); const s = new THREE.Group(); s.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(3.4, 1, 1.2), toon('#ffffff', { map: wt })))); s.children[0].position.y = 0.5;
    for (const k of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), toon('#4a3020')); p.position.set(k, 1.3, -0.5); s.add(p); } const aw = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 1.8), toon(colors[i % 8])); aw.position.set(0, 2.6, 0); aw.rotation.x = 0.2; s.add(aw);
    s.position.set(sx, 0, sz); s.rotation.y = Math.PI / 2; add(s); col.box(sx, sz, 0.6, 1.7); spots.merchants.push([sx + 1.6, sz, -Math.PI / 2]); }
  const mk = add(new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshBasicMaterial({ map: signTex('MARKET ROW', '#5a2a10'), side: THREE.DoubleSide }))); { const [a, b] = L(-0.72, -0.78); mk.position.set(a, 3.6, b); mk.rotation.y = Math.PI / 2; fx.push(mk); }
  // buildings on the east side: inn, safe room, guild hall / hall of callings, stairwell; houses to fill
  const east = [];
  if (big) {
    east.push(['inn', bld(...L(0.62, -0.55), 14, 9, 7, 'THE INN', '#8a5a3a', '#c8a050', '#3a2a5a', -Math.PI / 2)]);
    east.push(['saferoom', bld(...L(0.66, -0.05), 9, 8, 5, 'SAFE ROOM', '#3a4a5a', '#5ad86a', '#0a3a12', -Math.PI / 2)]);
    if (floor >= 3) east.push(['guild', bld(...L(0.62, 0.45), 16, 10, 8, 'GUILD HALL', '#5a3a6a', '#e8c040', '#3a1a4a', -Math.PI / 2)]);
    else east.push(['training', null]);
    if (o.callings) east.push(['callings', bld(...L(0, -0.72), 18, 10, 9, 'HALL OF CALLINGS', '#6a5a7a', '#F5C518', '#2a1a3a', 0)]);
    // houses around the edges
    for (let i = 0; i < 8; i++) { const fxp = -0.35 + (i % 4) * 0.22, fzp = i < 4 ? -0.82 : 0.82; if (o.callings && i < 4 && Math.abs(fxp) < 0.3) continue; const [hx, hz] = L(fxp, fzp); bld(hx, hz, 8, 7, 5 + (i % 3) * 1.5, null, ['#8a6a5a', '#6a7a8a', '#9a8a6a', '#7a5a6a'][i % 4], ['#3a2a24', '#2a3a4a'][i % 2], null, fzp < 0 ? 0 : Math.PI); }
  } else {
    east.push(['saferoom', bld(...L(0.55, 0), 7, 6, 4, 'SAFE ROOM', '#3a4a5a', '#5ad86a', '#0a3a12', -Math.PI / 2)]);
    for (let i = 0; i < 3; i++) { const [hx, hz] = L(-0.2 + i * 0.3, -0.7); bld(hx, hz, 6, 5, 4, null, ['#8a6a5a', '#6a7a8a', '#9a8a6a'][i], '#3a2a24', null, 0); }
  }
  for (const [kind, door] of east) if (door) { spots.doors.push({ kind, x: door[0], z: door[1] }); const glow = new THREE.PointLight(kind === 'saferoom' ? '#5aff7a' : '#ffd080', 6, 9, 1.4); glow.position.set(door[0], 3, door[1]); scene.add(glow); }
  spots.inn = (spots.doors.find((d) => d.kind === 'inn') || {}); spots.saferoom = spots.doors.find((d) => d.kind === 'saferoom'); spots.guild = spots.doors.find((d) => d.kind === 'guild'); spots.callings = spots.doors.find((d) => d.kind === 'callings');
  // training yard with straw dummies (south-east)
  spots.dummies = [];
  if (big) { const [tx, tz] = L(0.45, 0.62); const fenceM = toon('#7a5a3a'); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const f = add(new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.2 : 14, 1, i % 2 ? 10 : 0.2), fenceM)); f.position.set(tx + Math.cos(a) * 7, 0.5, tz + Math.sin(a) * 5); }
    const yard = add(new THREE.Mesh(new THREE.PlaneGeometry(14, 10), toon('#a8885a'))); yard.rotation.x = -Math.PI / 2; yard.position.set(tx, 0.03, tz);
    for (let i = 0; i < 3; i++) spots.dummies.push([tx - 4 + i * 4, tz]); const ts = add(new THREE.Mesh(new THREE.PlaneGeometry(5, 0.9), new THREE.MeshBasicMaterial({ map: signTex('TRAINING YARD', '#3a2a1a'), side: THREE.DoubleSide }))); ts.position.set(tx, 2.4, tz - 5.2); fx.push(ts); }
  // lamp posts along the main street
  const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe0a0').multiplyScalar(2.2) });
  for (let i = 0; i < (big ? 6 : 3); i++) { const lz = Z - D / 2 + (i + 0.5) * D / (big ? 6 : 3); for (const s of [-1, 1]) { const lx = X + s * 5; const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4, 6), toon('#2a2a2e'))); p.position.set(lx, 2, lz); const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), lampM)); b.position.set(lx, 4.1, lz); fx.push(b); } }
  for (let i = 0; i < (big ? 3 : 1); i++) { const l = new THREE.PointLight('#ffd8a0', 18, 34, 1.3); l.position.set(X, 7, Z - D / 3 + i * D / 3); scene.add(l); }
  // townsfolk wander inside an inner rect
  spots.inner = { x: X, z: Z, r: Math.min(W, D) / 2 - 6, r0: 5 };
  return { rect: [X - W / 2 - 1, Z - D / 2 - 1, X + W / 2 + 1, Z + D / 2 + 1], spots, gates: gateAt, poi: { name, x: X, z: Z, r: Math.max(W, D) / 2, rect: [X - W / 2, Z - D / 2, X + W / 2, Z + D / 2], kind: 'hub', safe: true, town: true } };
}

// ---------------- encampments ----------------
export const CAMP_STYLES = {
  goblin: { wall: 'junk', tent: '#8a5a2a', banner: '#e8590c', fire: '#ffa030' }, lamprey: { wall: 'pipes', tent: '#3a5a4a', banner: '#7aff5a', fire: '#7affb0' }, moth: { wall: 'lamps', tent: '#d8d8c8', banner: '#e8f4ff', fire: '#e8f4ff' },
  pigeon: { wall: 'crates', tent: '#8a8a82', banner: '#c8c8c0', fire: '#ffd8a0' }, mimic: { wall: 'machines', tent: '#8a1a14', banner: '#ffd040', fire: '#ffb040' }, wight: { wall: 'signs', tent: '#2a3a5a', banner: '#f0c818', fire: '#9ad8ff' },
  mall: { wall: 'carts', tent: '#e83a8a', banner: '#3affea', fire: '#ffd040' }, slime: { wall: 'balloons', tent: '#ff7ac8', banner: '#ffe040', fire: '#ff7ac8' }, leech: { wall: 'kiosks', tent: '#5a8a3a', banner: '#c8ff5a', fire: '#c8ff5a' },
  gnome: { wall: 'hedges', tent: '#c81a1a', banner: '#3a8a3a', fire: '#ffd040' }, hound: { wall: 'kennels', tent: '#6a4a2a', banner: '#e8c040', fire: '#ffa030' }, hag: { wall: 'cauldrons', tent: '#3a4a2a', banner: '#8aff5a', fire: '#8aff5a' },
  hunter: { wall: 'logs', tent: '#d8c890', banner: '#ffffff', fire: '#ffb040' }, cone: { wall: 'cones', tent: '#e8590c', banner: '#ffd020', fire: '#ffa030' },
};
export function buildCamp(ink, col, o) {
  const { scene, fx } = ink; const add = (m) => { scene.add(m); return m; };
  const { x: X, z: Z, r: R = 20, name, style = 'goblin', boss } = o; const st = CAMP_STYLES[style] || CAMP_STYLES.goblin;
  const g = new THREE.Group(); g.position.set(X, 0, Z); add(g);
  const piece = (kind, i) => { const p = new THREE.Group(); const c = ['#6a6466', '#8a5a2a', '#4a4a52', '#a8281e', '#3a6a4a'][i % 5];
    if (kind === 'junk') { for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.4 - k * 0.3, 0.7, 1.1 - k * 0.2), toon(['#6a6466', '#8a5a2a', '#a8281e'][(i + k) % 3])); b.position.y = 0.35 + k * 0.65; b.rotation.y = (i + k) * 0.7; p.add(b); } }
    else if (kind === 'cones') { for (let k = 0; k < 3; k++) { const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 10), toon('#e8590c')); c2.position.y = 0.45 + k * 0.72; p.add(c2); } }
    else if (kind === 'pipes') { const t = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.28, 8, 16, Math.PI), toon('#5a6a5a')); t.position.y = 0.2; t.rotation.y = i; p.add(t); }
    else if (kind === 'lamps') { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.5), toon('#d8d8d0')); b.position.y = 0.3 + (i % 2) * 0.35; b.rotation.y = i * 0.6; p.add(b); }
    else if (kind === 'crates' || kind === 'kiosks') { const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 1.3), toon(kind === 'kiosks' ? '#e8e0d0' : '#9a7a4a')); b.position.y = 0.6; p.add(b); const b2 = b.clone(); b2.scale.setScalar(0.7); b2.position.set(0.2, 1.6, 0.1); p.add(b2); }
    else if (kind === 'machines' || kind === 'kennels') { const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.9), toon(kind === 'kennels' ? '#7a5a3a' : '#8a1a14')); b.position.y = 0.95; p.add(b); }
    else if (kind === 'signs') { const b = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 4, 1, true), toon('#f0c818')); b.position.y = 0.5; p.add(b); }
    else if (kind === 'carts') { const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.4), toon('#9aa0a8')); b.position.y = 0.6; b.rotation.z = (i % 3 - 1) * 0.4; p.add(b); }
    else if (kind === 'balloons') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), toon(['#ff7ac8', '#ffe040', '#5ad8ff'][i % 3])); b.position.y = 0.7; p.add(b); }
    else if (kind === 'hedges') { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1), toon('#3a7a3a')); b.position.y = 0.7; p.add(b); }
    else if (kind === 'cauldrons') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, 6.28, 1, 2.1), toon('#1a1a1e')); b.position.y = 0.6; p.add(b); }
    else { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 8), toon('#6a4a2a')); b.rotation.z = Math.PI / 2; b.position.y = 0.4 + (i % 2) * 0.6; b.rotation.y = i * 0.5; p.add(b); }
    return p; };
  // barricade ring with two openings
  const n = Math.round(R * 2.2);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; if (Math.abs(Math.sin(a - 0.3)) < 0.09 || Math.abs(Math.sin(a - 0.3 - Math.PI / 2)) < 0.06 && Math.cos(a - 0.3 - Math.PI / 2) > 0) continue; const p = piece(st.wall, i); p.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); p.rotation.y = -a; g.add(p); col.circle(X + Math.cos(a) * R, Z + Math.sin(a) * R, 0.75); }
  // tents / huts
  const tentM = toon(st.tent);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5, r = R * 0.62; const t = new THREE.Mesh(new THREE.ConeGeometry(2, 2.6, 6), tentM); t.position.set(Math.cos(a) * r, 1.3, Math.sin(a) * r); g.add(t); col.circle(X + Math.cos(a) * r, Z + Math.sin(a) * r, 1.8); }
  // bonfire
  const logs = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.4, 10), toon('#3a2a1a')); logs.position.set(R * 0.3, 0.2, R * 0.25); g.add(logs);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(st.fire).multiplyScalar(2.4) })); flame.position.set(R * 0.3, 1.2, R * 0.25); g.add(flame); fx.push(flame);
  const fl = new THREE.PointLight(st.fire, 20, 26, 1.4); fl.position.set(X + R * 0.3, 3, Z + R * 0.25); scene.add(fl);
  // leader's dais + banner with the camp name
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4, 0.14, 24), toon('#4a3a32')); dais.position.y = 0.07; g.add(dais);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 8), toon('#3a2a20')); pole.position.set(-3.5, 4.5, -3.5); g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), new THREE.MeshBasicMaterial({ map: signTex(name.toUpperCase(), '#1a1210', st.banner, 512, 140, 64), side: THREE.DoubleSide })); flag.position.set(-1, 8.2, -3.5); g.add(flag); fx.push(flag);
  // skull totems at the openings
  for (const a of [0.3, 0.3 + Math.PI / 2]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), toon('#4a3a2a')); t.position.set(Math.cos(a) * (R + 1.5), 1.5, Math.sin(a) * (R + 1.5)); g.add(t); const sk = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), toon('#e8e0c8')); sk.position.set(t.position.x, 3.2, t.position.z); g.add(sk); }
  const tick = (t) => { flame.scale.y = 1 + Math.sin(t * 9 + X) * 0.12; fl.intensity = 18 + Math.sin(t * 13 + Z) * 3; flag.rotation.y = Math.sin(t * 1.3 + X) * 0.15; };
  return { tick, poi: { name, x: X, z: Z, r: R + 3, kind: 'camp', camp: o.camp, boss, level: o.level } };
}
