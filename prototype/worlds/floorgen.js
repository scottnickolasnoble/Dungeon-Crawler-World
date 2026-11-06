// Floor generator shared by every floor (720 m across). A floor config supplies its look (ground, ceiling, fog,
// light), an obstacle scatter, the hub town, villages, encampments (mobs + boss), landmarks, its townsfolk and quest
// givers, and its roaming monsters. Around every town there's an "outskirts" buffer with only weak critters.
import * as THREE from '../node_modules/three/build/three.module.js';
import { toon, canvasTex, inkLine, woodTex, rnd, seeded } from '../engine/ink.js';
import { buildTown, buildCamp, TOWN_PALETTE } from './town.js';
import { createKit, jgrid, cullTiles, resetTiles } from './detail.js';
import { townFillers } from '../game/npcs.js';

export function buildFloor(ink, col, cfg, onProgress = () => {}) { resetTiles();
  const { scene, fx } = ink; const SIZE = cfg.size || 720, CEIL = cfg.ceil || 10;
  const add = (o) => { scene.add(o); return o; }; const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const pl = (c, i, d, x, y, z) => { const l = new THREE.PointLight(c, i, d, 1.4); l.position.set(x, y, z); scene.add(l); return l; };
  scene.background = new THREE.Color(cfg.bg); scene.fog = new THREE.Fog(cfg.fog || cfg.bg, cfg.fogNear || 18, cfg.fogFar || 120);
  scene.add(new THREE.HemisphereLight(cfg.hemi[0], cfg.hemi[1], cfg.hemi[2] || 1.2)); const key = new THREE.DirectionalLight(cfg.key || '#ffe0c0', 0.6); key.position.set(40, 80, 30); scene.add(key);
  const map = { pillars: [], cars: [], water: [], pois: [] }; const ticks = []; const noMob = []; const mobs = []; const npcs = []; const doors = []; const dummies = [];
  // ground, ceiling, outer walls
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), cfg.groundMat ? cfg.groundMat() : toon('#ffffff', { map: canvasTex(512, 512, cfg.ground, [SIZE / (cfg.groundTile || 18), SIZE / (cfg.groundTile || 18)]) }))); ground.rotation.x = -Math.PI / 2;
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), toon(cfg.ceilColor || '#2a2428'))); ceil.rotation.x = Math.PI / 2; ceil.position.y = CEIL;
  for (const [x, z, ry] of [[0, -SIZE / 2, 0], [0, SIZE / 2, Math.PI], [-SIZE / 2, 0, Math.PI / 2], [SIZE / 2, 0, -Math.PI / 2]]) { const w = add(new THREE.Mesh(new THREE.PlaneGeometry(SIZE, CEIL), toon(cfg.wallColor || '#3a3436'))); w.position.set(x, CEIL / 2, z); w.rotation.y = ry; }
  onProgress(0.05);
  // ---- zones: hub, villages, camps, landmarks (obstacles and roaming mobs keep out) ----
  const zones = [];
  const hubCfg = { x: 0, z: 0, w: 150, d: 116, style: 'garage', gates: ['S', 'N', 'E', 'W'], floor: cfg.floor, big: true, ...cfg.hub };
  zones.push({ rect: [hubCfg.x - hubCfg.w / 2 - 30, hubCfg.z - hubCfg.d / 2 - 30, hubCfg.x + hubCfg.w / 2 + 30, hubCfg.z + hubCfg.d / 2 + 30] });
  for (const v of cfg.villages || []) zones.push({ rect: [v.x - 32 - 14, v.z - 26 - 14, v.x + 32 + 14, v.z + 26 + 14] });
  for (const c of cfg.camps || []) zones.push({ c: [c.x, c.z, (c.r || 20) + 8] });
  for (const l of cfg.landmarks || []) zones.push({ c: [l.x, l.z, l.r || 16] });
  const inZone = (x, z, pad = 0) => zones.some((q) => (q.rect ? x > q.rect[0] - pad && x < q.rect[2] + pad && z > q.rect[1] - pad && z < q.rect[3] + pad : Math.hypot(x - q.c[0], z - q.c[1]) < q.c[2] + pad));
  const H = { scene, fx, col, add, at, pl, toon, canvasTex, inkLine, woodTex, rnd, seeded, SIZE, CEIL, map, inZone, ticks, THREE, ink, createKit, jgrid };
  // ---- obstacles ----
  cfg.scatter && cfg.scatter(H); onProgress(0.3);
  // ---- hub town ----
  const townKit = createKit(add, cfg.townPalette || TOWN_PALETTE); // shared by the hub and the villages, drawn instanced
  const hub = buildTown(ink, col, { ...hubCfg, name: cfg.hubName, kit: townKit });
  map.pois.push(hub.poi); noMob.push(hub.rect); doors.push(...hub.spots.doors.map((d) => ({ ...d, town: cfg.hubName })));
  dummies.push(...hub.spots.dummies);
  cfg.hubDecor && cfg.hubDecor(H, hub); onProgress(0.45);
  // ---- villages ----
  const villageSpots = [];
  for (const v of cfg.villages || []) { const t = buildTown(ink, col, { kit: townKit, x: v.x, z: v.z, w: 64, d: 52, style: v.style || hubCfg.style, gates: v.gates || ['S', 'N'], floor: cfg.floor, big: false, name: v.name }); t.poi.kind = 'hub'; map.pois.push(t.poi); noMob.push(t.rect); doors.push(...t.spots.doors.map((d) => ({ ...d, town: v.name }))); villageSpots.push([v, t]); }
  townKit.flush(); onProgress(0.55);
  // ---- camps ----
  for (const c of cfg.camps || []) { const cp = buildCamp(ink, col, { ...c }); ticks.push(cp.tick); map.pois.push(cp.poi);
    const n = c.count || 10; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.2, r = (c.r || 20) * (0.35 + (i % 3) * 0.2); const kind = Array.isArray(c.mob) ? c.mob[i % c.mob.length] : c.mob; mobs.push({ kind, variant: i, lvl: c.lvl[0] + (i % (c.lvl[1] - c.lvl[0] + 1)), camp: c.camp, x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r }); }
    for (const e of c.elites || []) mobs.push({ kind: e.kind, variant: 1, lvl: e.lvl, camp: c.camp, x: c.x + (e.dx || 4), z: c.z + (e.dz || 4) });
    if (c.boss) mobs.push({ kind: c.boss, variant: 0, lvl: c.bossLvl, camp: c.camp, x: c.x, z: c.z }); }
  onProgress(0.62);
  // ---- landmarks ----
  for (const l of cfg.landmarks || []) { const t = l.build ? l.build(H, l) : null; if (t) ticks.push(t); map.pois.push({ name: l.name, x: l.x, z: l.z, r: l.r || 16, kind: l.kind || 'landmark' }); }
  onProgress(0.7);
  // ---- monsters: outskirts critters near towns, then roaming packs that get tougher with distance ----
  const hubR = Math.max(hubCfg.w, hubCfg.d) / 2;
  const avoidMob = (x, z) => noMob.some((r) => x > r[0] - 6 && x < r[2] + 6 && z > r[1] - 6 && z < r[3] + 6) || (cfg.camps || []).some((c) => Math.hypot(x - c.x, z - c.z) < (c.r || 20) + 14);
  const R = cfg.roam || {}; let tries = 0, packs = 0;
  if (cfg.outskirts) for (let i = 0; i < cfg.outskirts.count; i++) { const a = seeded(i, 701) * Math.PI * 2, d = hubR + 26 + seeded(i, 702) * 40; const x = hubCfg.x + Math.cos(a) * d, z = hubCfg.z + Math.sin(a) * d; if (avoidMob(x, z)) continue; mobs.push({ kind: cfg.outskirts.kind, variant: i, lvl: cfg.outskirts.lvl[0] + (i % (cfg.outskirts.lvl[1] - cfg.outskirts.lvl[0] + 1)), x, z }); }
  while (packs < (R.count || 40) && tries++ < 2000) { const x = (seeded(tries, 711) - 0.5) * SIZE * 0.92, z = (seeded(tries, 712) - 0.5) * SIZE * 0.92; const d = Math.hypot(x - hubCfg.x, z - hubCfg.z); if (d < hubR + 75 || avoidMob(x, z) || col.blocked(x, z, 1)) continue;
    const [lo, hi] = R.levelAt(d); const n = 2 + Math.floor(seeded(tries, 713) * 3); for (let i = 0; i < n; i++) { const kind = R.kinds(seeded(i, tries + 714), d, i); mobs.push({ kind, variant: (tries * 3 + i) % 8, lvl: lo + Math.floor(seeded(i, tries + 715) * (hi - lo + 1)), x: x + Math.cos(i * 2.1) * (1.5 + i), z: z + Math.sin(i * 2.1) * (1.5 + i) }); } packs++; }
  onProgress(0.8);
  // ---- people ----
  const S = hub.spots; const T = cfg.townsfolk || { races: ['human', 'gutterkin'] };
  for (const q of cfg.questNPCs ? cfg.questNPCs(S) : []) npcs.push(q);
  (cfg.merchants || []).forEach((m, i) => { const s = S.merchants[i % S.merchants.length]; if (!s) return; npcs.push({ id: m.id, named: m.named, kind: 'quest', role: 'trader', race: m.race || T.races[i % T.races.length], variant: i, name: m.name, title: m.title, shop: m.shop, x: s[0], z: s[1], yaw: s[2], voice: m.voice || 'merchant', static: true }); });
  S.guards.forEach(([gx, gz, gy], i) => npcs.push({ kind: 'filler', role: 'guard', race: T.races[i % T.races.length], variant: i + 3, x: gx, z: gz, yaw: gy, static: true, activity: 'look', town: { x: S.inner.x, z: S.inner.z, r: 6, r0: 1 } }));
  if (S.inn && S.inn.x !== undefined) npcs.push({ id: 'innkeeper', kind: 'quest', role: 'cook', race: T.races[0], variant: 5, name: cfg.innkeeper || 'Innkeeper', title: 'The Inn · rest and heal', x: S.inn.x - 1.6, z: S.inn.z, yaw: Math.PI / 2, static: true, voice: 'villager' });
  if (S.guild) { const gk = ['collegium', 'union', 'nightshift', 'caregivers']; gk.forEach((g, i) => npcs.push({ id: 'guild_' + g, guild: g, kind: 'quest', role: 'quest', race: ['lumen', 'stoneblood', 'fennix', 'human'][i], variant: i, name: { collegium: 'Archmage Pell', union: 'Foreman Gruss', nightshift: 'Supervisor Mox', caregivers: 'Matron Hale' }[g], title: { collegium: 'The Collegium (mages)', union: 'Tradesfolk Union', nightshift: 'The Night Shift', caregivers: 'Caregivers’ Lodge' }[g], x: S.guild.x - 2 - i * 0.2, z: S.guild.z - 4.5 + i * 3, yaw: Math.PI / 2, static: true, voice: 'villager' })); }
  if (S.callings) npcs.push({ id: 'callings', kind: 'quest', role: 'quest', race: 'lumen', variant: 1, name: 'Registrar Odessa', title: 'Hall of Callings · choose race and class', x: S.callings.x + 2.5, z: S.callings.z, yaw: Math.PI, static: true, voice: 'marta' });
  npcs.push(...townFillers({ x: S.inner.x, z: S.inner.z, r: S.inner.r, r0: S.inner.r0, count: cfg.fillers || 16, races: T.races, seed: cfg.floor + 1 }));
  for (const [v, t] of villageSpots) { (v.merchants || []).forEach((m, i) => { const s = t.spots.merchants[i]; if (s) npcs.push({ id: m.id, kind: 'quest', role: 'trader', race: v.races ? v.races[0] : T.races[0], variant: i + 7, name: m.name, title: `${m.title} · ${v.name}`, shop: m.shop, x: s[0], z: s[1], yaw: s[2], voice: m.voice || 'merchant', static: true }); });
    for (const q of v.quests || []) npcs.push({ ...q, x: t.spots.quests[0][0], z: t.spots.quests[0][1] });
    npcs.push(...townFillers({ x: v.x, z: v.z, r: 18, r0: 4, count: 5, races: v.races || T.races, seed: Math.abs(v.x) % 7 })); }
  onProgress(0.9);
  let cullT = 0; const tick = (t) => { for (const f of ticks) f(t); cfg.tick && cfg.tick(t); if (t - cullT > 0.25) { cullT = t; cullTiles(ink.camera.position, Math.max(globalThis.__VIEW || 70, scene.fog ? scene.fog.far * 0.9 : 0)); } }; // fogged-out tiles are invisible anyway
  onProgress(1);
  return { map, mobs, npcs, doors, noMob, dummies, stairs: cfg.stairs, tick, size: SIZE, ceiling: CEIL, hub };
}

// common obstacle helpers for configs
export function scatterInstanced(H, geo, mat, n, seed, place) { const dm = new THREE.Object3D(); const pos = []; for (let i = 0; i < n * 3 && pos.length < n; i++) { const x = (seeded(i, seed) - 0.5) * H.SIZE * 0.94, z = (seeded(i, seed + 1) - 0.5) * H.SIZE * 0.94; if (H.inZone(x, z)) continue; const r = place(x, z, i, dm); if (r === false) continue; pos.push(dm.matrix.clone()); }
  const im = H.add(new THREE.InstancedMesh(geo, mat, pos.length)); pos.forEach((m, i) => im.setMatrixAt(i, m)); return im; }
