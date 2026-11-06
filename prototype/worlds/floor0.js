// FLOOR 0 · THE LANDING — the Network's Orientation Centre at the bottom of every stairwell. A guided tutorial:
// Intern Pip's desk, a water fountain, training dummies, a practice arena with cardboard goblins, and the stairs
// down to Floor 1. Safe everywhere except the arena.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex } from '../engine/ink.js';

export const FLOOR0 = { name: 'FLOOR 0 · THE LANDING', size: 140, spawn: [0, 1.7, 56], spawnYaw: 0 };
export function buildFloor0(ink, col, onProgress = () => {}) {
  const { scene, fx } = ink; const add = (o) => { scene.add(o); return o; }; const CEIL = 7;
  scene.background = new THREE.Color('#1a1820'); scene.fog = new THREE.Fog('#1a1820', 30, 110);
  scene.add(new THREE.HemisphereLight('#fff8f0', '#4a4048', 1.5));
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };
  const tile = canvasTex(256, 256, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#e8e4dc' : '#c8c0b4'; g.fillRect(i * 64, j * 64, 64, 64); } g.strokeStyle = '#0d0b12'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } }, [24, 40]);
  const W = 28, L = 130; // a long hall running north (−z) from the arrival stairs
  const fl = add(new THREE.Mesh(new THREE.PlaneGeometry(W, L), toon('#ffffff', { map: tile }))); fl.rotation.x = -Math.PI / 2; fl.position.z = -5;
  const ce = add(new THREE.Mesh(new THREE.PlaneGeometry(W, L), toon('#d8d0c8'))); ce.rotation.x = Math.PI / 2; ce.position.set(0, CEIL, -5);
  const wallM = toon('#ffffff', { map: canvasTex(256, 128, (g) => { g.fillStyle = '#c8c0d8'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#E5484D'; g.fillRect(0, 96, 256, 10); g.fillStyle = '#F5C518'; g.fillRect(0, 106, 256, 6); }, [8, 1]) });
  for (const s of [-1, 1]) { const w = add(new THREE.Mesh(new THREE.BoxGeometry(1, CEIL, L), wallM)); w.position.set(s * W / 2, CEIL / 2, -5); col.box(s * W / 2, -5, 0.5, L / 2); }
  for (const z of [60, -70]) { const w = add(new THREE.Mesh(new THREE.BoxGeometry(W, CEIL, 1), wallM)); w.position.set(0, CEIL / 2, z); col.box(0, z, W / 2, 0.5); }
  const sign = (txt, bg, fg, w = 8, h = 1.4) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 512, 96); g.fillStyle = fg; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText(txt, 256, 68, 490); }), color: new THREE.Color(1.4, 1.4, 1.4), side: THREE.DoubleSide }));
  // arrival stairs (behind you), banners, ceiling lights
  for (let i = 0; i < 8; i++) { const s = add(new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 1), toon('#8a8480'))); s.position.set(0, 0.2 + i * 0.4, 58 - i * 0.2); }
  const ban = add(sign('WELCOME, CONTESTANTS!', '#E5484D', '#fff', 14, 2)); ban.position.set(0, 5.4, 46); fx.push(ban);
  const ban2 = add(sign('PLEASE DO NOT DIE IN THE LOBBY', '#2a2a5a', '#F5C518', 12, 1.4)); ban2.position.set(0, 5.4, 10); fx.push(ban2);
  for (let z = 50; z > -66; z -= 12) { const l = add(new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff8e8').multiplyScalar(2) }))); l.position.set(0, CEIL - 0.06, z); pl('#fff4e8', 10, 16, 0, CEIL - 1, z); }
  // TVs with the Host on them
  const tvTex = canvasTex(256, 160, (g) => { const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, '#2a1a5a'); gr.addColorStop(1, '#e8406a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 160); g.fillStyle = '#f0c8a0'; g.beginPath(); g.ellipse(128, 70, 34, 42, 0, 0, 7); g.fill(); g.fillStyle = '#14101a'; g.fillRect(100, 58, 24, 12); g.fillRect(132, 58, 24, 12); g.fillStyle = '#2a1a12'; g.fillRect(92, 26, 72, 18); g.fillStyle = '#5a1010'; g.fillRect(110, 90, 36, 8); g.fillStyle = '#E5484D'; g.fillRect(8, 8, 50, 20); g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.fillText('LIVE', 16, 23); });
  for (const [x, z, ry] of [[-13.4, 30, Math.PI / 2], [13.4, 0, -Math.PI / 2], [-13.4, -30, Math.PI / 2]]) { const tv = add(new THREE.Mesh(new THREE.PlaneGeometry(4, 2.5), new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(1.3, 1.3, 1.3) }))); tv.position.set(x, 4, z); tv.rotation.y = ry; fx.push(tv); }
  // orientation desk (Pip), velvet ropes
  const desk = add(new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 1.6), toon('#c8a050'))); desk.position.set(0, 0.55, 30); col.box(0, 30, 3.5, 0.8);
  const ds = add(sign('ORIENTATION', '#2a2a5a', '#fff', 5, 0.9)); ds.position.set(0, 2.2, 30.9); fx.push(ds);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.1, 8), toon('#c8a040'))); p.position.set(s * 6, 0.55, 40 - i * 3); }
  // water fountain (drink with E)
  const fo = add(new THREE.Mesh(new THREE.BoxGeometry(1, 1.1, 0.7), toon('#c8ccd2'))); fo.position.set(-12.8, 0.55, 18); col.box(-12.8, 18, 0.5, 0.35); const fs = add(sign('WATER', '#1a4a6a', '#fff', 2, 0.6)); fs.position.set(-13.3, 2, 18); fs.rotation.y = Math.PI / 2; fx.push(fs);
  // training area with dummies
  const yard = add(new THREE.Mesh(new THREE.PlaneGeometry(22, 14), toon('#a8885a'))); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0.02, 5);
  const ts = add(sign('TRAINING DUMMIES', '#3a2a1a', '#F5C518', 6, 1)); ts.position.set(0, 3.2, 12); fx.push(ts);
  // practice arena, behind a half wall with a gap
  for (const s of [-1, 1]) { const w = add(new THREE.Mesh(new THREE.BoxGeometry(10, 2, 0.6), toon('#8a3a3a'))); w.position.set(s * 8, 1, -14); col.box(s * 8, -14, 5, 0.3); }
  const as = add(sign('PRACTICE ARENA', '#8a1a14', '#fff', 7, 1.1)); as.position.set(0, 3, -14); fx.push(as);
  const ar = add(new THREE.Mesh(new THREE.CircleGeometry(11, 40), toon('#6a5a4a'))); ar.rotation.x = -Math.PI / 2; ar.position.set(0, 0.03, -30);
  // stairs down to Floor 1 at the far end
  const st = add(new THREE.Mesh(new THREE.BoxGeometry(8, CEIL, 2), toon('#3a3a42'))); st.position.set(0, CEIL / 2, -68); const ex = add(sign('▼ FLOOR 1', '#0a3a12', '#5aff7a', 5, 1.1)); ex.position.set(0, 4, -66.9); fx.push(ex); pl('#5aff7a', 10, 14, 0, 3, -63);
  onProgress(1);
  const map = { pillars: [], cars: [], water: [], pois: [
    { name: 'The Landing', x: 0, z: 0, r: 70, rect: [-14, -70, 14, 60], kind: 'hub', safe: true },
    { name: 'Orientation Desk', x: 0, z: 30, r: 8, kind: 'landmark' }, { name: 'Practice Arena', x: 0, z: -30, r: 11, kind: 'landmark' }] };
  const mobs = [{ kind: 'cardboard', variant: 1, lvl: 1, camp: 'arena', x: -5, z: -32 }, { kind: 'cardboard', variant: 4, lvl: 1, camp: 'arena', x: 5, z: -32 }, { kind: 'cardboard', variant: 6, lvl: 1, camp: 'arena', x: 0, z: -38 }];
  const npcs = [{ id: 'pip', kind: 'quest', role: 'quest', race: 'human', variant: 1, name: 'Intern Pip', title: 'Network Orientation', x: 0, z: 28.4, yaw: 0, voice: 'spin', static: true },
    { kind: 'filler', role: 'guard', race: 'human', variant: 3, x: -10, z: 44, static: true, activity: 'look', town: { x: 0, z: 0, r: 4, r0: 1 } }, { kind: 'filler', role: 'gossip', race: 'gutterkin', variant: 5, x: 9, z: 20, static: true, activity: 'talk', town: { x: 0, z: 0, r: 4, r0: 1 } }];
  const doors = [{ kind: 'fountain', x: -12, z: 18 }];
  return { map, mobs, npcs, doors, noMob: [], dummies: [[-6, 5], [0, 5], [6, 5]], tutorialArena: true, stairs: { x: 0, z: -64, r: 3.4, to: '1', flag: 'tut_arena_done', how: 'Finish Intern Pip’s orientation: drink from the fountain, open your box, hit the training dummies, then beat the 3 cardboard goblins in the Practice Arena.', locked: 'Pip wants a word before you go down.' }, tick: () => {}, size: 140, ceiling: CEIL };
}
