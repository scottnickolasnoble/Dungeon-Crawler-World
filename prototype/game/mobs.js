// Mob system: nav-grid flow-field pathfinding, readable attacks (wind-up, ground telegraph, swing, recover),
// ranged throwers, elites, bosses with telegraphed abilities, encampment groups, level scaling and respawns.
import * as THREE from '../node_modules/three/build/three.module.js';
import { makeGoblin } from '../creature.js';
import { mopWight } from '../monsters/tier1.js';
import { sergeantPylon, headCustodianEbb, trafficCone } from '../monsters/bosses1.js';

// ---------------- definitions ----------------
// windup = how long the attack is telegraphed (parry window is the last 0.35 s of it plus the swing)
export const MOBDEFS = {
  goblin: { name: 'Traffic-Cone Goblin', model: 'goblin', hp: 40, dmg: 6, speed: 3.4, reach: 1.9, arc: 1.4, windup: 0.6, swing: 0.18, recover: 0.65, xp: 20, aggro: 15, barks: ['OI! CONE ZONE!', 'Shiny! MINE!', 'Get the tall one!', 'Hrrk! Fresh meat!', 'Boss said nobody passes!'] },
  thrower: { name: 'Cone Chucker', model: 'thrower', hp: 30, dmg: 7, speed: 3.0, reach: 1.7, arc: 1.2, windup: 0.6, swing: 0.18, recover: 0.7, xp: 22, aggro: 18, ranged: { min: 6, max: 16, windup: 0.85, speed: 13, cd: 2.2 }, barks: ['Heads up! HEH HEH.', 'Cone incoming!', 'Catch!'] },
  captain: { name: 'Cone Captain', model: 'captain', hp: 120, dmg: 12, speed: 3.6, reach: 2.2, arc: 1.6, windup: 0.75, swing: 0.2, recover: 0.7, xp: 70, aggro: 16, elite: true, abilities: ['charge'], barks: ['FORM UP, YOU LOT!', 'For the Sergeant!', 'You picked the wrong car park.'] },
  wight: { name: 'Mop Wight', model: 'wight', hp: 55, dmg: 9, speed: 2.7, reach: 2.4, arc: 2.4, windup: 0.85, swing: 0.25, recover: 0.9, xp: 28, aggro: 14, barks: ['...still... on... shift...', 'Mind... the... floor...', 'Clock... in...'] },
  pylon: { name: 'Sergeant Pylon', title: 'Neighbourhood Boss · Pylon Point', model: 'pylon', boss: true, hp: 520, dmg: 16, speed: 3.3, reach: 3.0, arc: 1.7, windup: 0.8, swing: 0.22, recover: 0.75, xp: 650, aggro: 18, leash: 30, abilities: ['slam', 'charge', 'whistle', 'barrage'],
    barks: ['HALT! This is a CONE ZONE!', 'Lads! Fall in!', 'You are parked in MY spot.', 'I have twenty years on the force. Okay, two. In cones.'], enrage: 'SERGEANT PYLON BLOWS HIS WHISTLE IN RAGE' },
  ebb: { name: 'Head Custodian Ebb', title: 'Neighbourhood Boss · Boiler Room 0', model: 'ebb', boss: true, hp: 620, dmg: 18, speed: 2.9, reach: 3.0, arc: 2.6, windup: 0.9, swing: 0.25, recover: 0.8, xp: 800, aggro: 18, leash: 30, abilities: ['sweep', 'puddle', 'clockin', 'keys'],
    barks: ['You are tracking mud on my floor.', 'Shift change, wights! Clock in!', 'Forty years. Not one dry day.'], enrage: 'HEAD CUSTODIAN EBB HAS HAD IT WITH YOU' },
};
const ABIL = {
  slam: { cd: 9, windup: 1.2, range: 4.5 }, charge: { cd: 8, windup: 1.0, range: 14 }, whistle: { cd: 26, windup: 0.9, uses: 2 }, barrage: { cd: 11, windup: 0.9, range: 18 },
  sweep: { cd: 8, windup: 1.1, range: 4.0 }, puddle: { cd: 12, windup: 1.0, range: 16 }, clockin: { cd: 24, windup: 0.9, uses: 2 }, keys: { cd: 9, windup: 0.8, range: 18 },
};
export const scaleHp = (base, lvl) => Math.round(base * (1 + 0.24 * (lvl - 1)));
export const scaleDmg = (base, lvl) => base * (1 + 0.16 * (lvl - 1));

// ---------------- nav grid + flow field ----------------
class NavGrid {
  constructor(col, size, cell = 1) {
    this.cell = cell; this.n = Math.ceil(size / cell); this.half = size / 2; const N = this.n;
    this.block = new Uint8Array(N * N); this.dist = new Uint16Array(N * N); this.stamp = new Uint32Array(N * N); this.cur = 1; this.q = new Int32Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -this.half + (i + 0.5) * cell, z = -this.half + (j + 0.5) * cell; this.block[i * N + j] = col.blocked(x, z, 0.42, 0.5) ? 1 : 0; }
  }
  idx(x, z) { const i = Math.floor((x + this.half) / this.cell), j = Math.floor((z + this.half) / this.cell); if (i < 0 || j < 0 || i >= this.n || j >= this.n) return -1; return i * this.n + j; }
  center(k) { const i = Math.floor(k / this.n), j = k % this.n; return [-this.half + (i + 0.5) * this.cell, -this.half + (j + 0.5) * this.cell]; }
  free(x, z) { const k = this.idx(x, z); return k >= 0 && !this.block[k]; }
  // BFS from the target out to maxR cells
  flow(tx, tz, maxR = 48) {
    let s = this.idx(tx, tz); if (s < 0) return; this.cur++; const N = this.n;
    if (this.block[s]) { for (const d of [1, -1, N, -N, N + 1, N - 1, -N + 1, -N - 1]) if (!this.block[s + d]) { s = s + d; break; } }
    const si = Math.floor(s / N), sj = s % N; let h = 0, t = 0; this.q[t++] = s; this.stamp[s] = this.cur; this.dist[s] = 0;
    while (h < t) { const k = this.q[h++], i = Math.floor(k / N), j = k % N, d = this.dist[k]; if (Math.abs(i - si) > maxR || Math.abs(j - sj) > maxR) continue;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const nk = ni * N + nj; if (this.block[nk] || this.stamp[nk] === this.cur) continue; if (di && dj && (this.block[i * N + nj] || this.block[ni * N + j])) continue; this.stamp[nk] = this.cur; this.dist[nk] = d + (di && dj ? 3 : 2); this.q[t++] = nk; } }
  }
  // best next waypoint from (x,z) following the field; null if outside it
  next(x, z) {
    const k = this.idx(x, z); if (k < 0 || this.stamp[k] !== this.cur) return null; const N = this.n, i = Math.floor(k / N), j = k % N; let best = k, bd = this.dist[k];
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; const nk = ni * N + nj; if (this.stamp[nk] !== this.cur || this.block[nk]) continue; if (di && dj && (this.block[i * N + nj] || this.block[ni * N + j])) continue; if (this.dist[nk] < bd) { bd = this.dist[nk]; best = nk; } }
    return best === k ? null : this.center(best);
  }
  los(ax, az, bx, bz) { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.5); for (let i = 1; i < n; i++) { const t = i / n; if (!this.free(ax + (bx - ax) * t, az + (bz - az) * t)) return false; } return true; }
  nearestFree(x, z) { if (this.free(x, z)) return [x, z]; for (let r = 1; r < 8; r++) for (let a = 0; a < 12; a++) { const px = x + Math.cos(a * 0.52) * r, pz = z + Math.sin(a * 0.52) * r; if (this.free(px, pz)) return [px, pz]; } return [x, z]; }
}

// ---------------- system ----------------
export function createMobSystem(ctx) {
  const { scene, fx, col } = ctx; const mobs = []; const projs = []; const tele = []; const trails = []; const zones = [];
  let nav = null, flowT = 0, flowCell = -1;
  const tmpl = {};
  function modelFor(kind, variant) {
    const d = MOBDEFS[kind];
    if (d.model === 'goblin' || d.model === 'thrower' || d.model === 'captain') {
      const key = 'g' + (variant % 8); if (!tmpl[key]) tmpl[key] = makeGoblin({ variant: variant % 8 });
      const g = tmpl[key].clone();
      if (d.model === 'thrower') { const w = g.getObjectByName('weapon'); if (w) w.visible = false; const c = trafficCone(0.4); c.name = 'held'; c.position.set(-0.33, 1.02, 0.36); g.add(c); }
      if (d.model === 'captain') { for (let i = 0; i < 2; i++) { const c = trafficCone(0.34, i ? '#ffd020' : '#e8590c'); c.position.set(0, 1.7 + i * 0.1, 0.06); g.add(c); } g.scale.setScalar(1.22); }
      else g.scale.setScalar(0.95 + (variant % 3) * 0.05);
      return g;
    }
    if (d.model === 'wight') { if (!tmpl.w) tmpl.w = mopWight(); const g = tmpl.w.clone(); g.scale.setScalar(0.95 + (variant % 3) * 0.06); return g; }
    if (d.model === 'pylon') return sergeantPylon();
    if (d.model === 'ebb') return headCustodianEbb();
  }
  function buildNav(size) { nav = new NavGrid(col, size, 1); return nav; }

  function spawn(s) {
    const d = MOBDEFS[s.kind]; const lvl = s.lvl || 1; let [x, z] = nav ? nav.nearestFree(s.x, s.z) : [s.x, s.z];
    const root = new THREE.Group(); const body = modelFor(s.kind, s.variant || 0); root.add(body); root.position.set(x, 0, z); root.rotation.y = Math.random() * 6; scene.add(root);
    const mats = []; body.traverse((o) => { if (o.isMesh && o.material && (o.material.isMeshPhysicalMaterial || o.material.isMeshStandardMaterial) && o.material.emissive) { o.material = o.material.clone(); mats.push(o.material); } });
    const weapon = body.getObjectByName('weapon') || body.getObjectByName('held'); const wBase = weapon ? weapon.rotation.clone() : null; const bodyScale = body.scale.x;
    const hp = scaleHp(d.hp, lvl);
    const m = { def: d, kind: s.kind, g: root, body, bodyScale, weapon, wBase, mats, lvl, hp, maxHp: hp, home: new THREE.Vector3(x, 0, z), camp: s.camp || null, roam: !s.camp && !d.boss, state: 'idle', act: null, atkCd: 0.5 + Math.random(), abCd: {}, abUses: {}, burn: 0, burnDps: 0, flash: 0, stun: 0, stagger: 0, slow: 0, dead: false, deadT: 0, wander: Math.random() * 10, wanderTarget: null, name: d.name, bar: d.boss ? null : ctx.makeBar(), barkT: 0, enraged: false, spawnSpec: s, respawnT: 0 };
    for (const a of d.abilities || []) m.abCd[a] = ABIL[a].cd * (0.4 + Math.random() * 0.4);
    mobs.push(m); return m;
  }

  // ---------- telegraphs ----------
  const teleMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  function telegraph(kind, pos, yaw, a, b) { // kind: 'sector'(reach, arc) | 'circle'(r) | 'rect'(len, width)
    const g = new THREE.Group(); g.position.set(pos.x, 0.05, pos.z); let outline, fill;
    if (kind === 'sector') { const geo = new THREE.RingGeometry(0.25, a, 28, 1, -b / 2, b); geo.rotateX(-Math.PI / 2); outline = new THREE.Mesh(geo, teleMat('#ff2a1a', 0.18)); fill = new THREE.Mesh(geo, teleMat('#ff5a2a', 0.42)); g.rotation.y = yaw - Math.PI / 2; }
    else if (kind === 'circle') { const geo = new THREE.CircleGeometry(a, 40); geo.rotateX(-Math.PI / 2); outline = new THREE.Mesh(geo, teleMat('#ff2a1a', 0.18)); fill = new THREE.Mesh(geo, teleMat('#ff5a2a', 0.42)); const ring = new THREE.Mesh(new THREE.RingGeometry(a - 0.12, a, 48).rotateX(-Math.PI / 2), teleMat('#ff3a1a', 0.85)); g.add(ring); fx.push(ring); }
    else { const geo = new THREE.PlaneGeometry(b, a); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, a / 2); outline = new THREE.Mesh(geo, teleMat('#ff2a1a', 0.18)); fill = new THREE.Mesh(geo, teleMat('#ff5a2a', 0.42)); g.rotation.y = yaw; }
    g.add(outline, fill); fill.scale.setScalar(0.001); scene.add(g); fx.push(outline, fill);
    const t = { g, fill, kind, alive: true }; tele.push(t); return t;
  }
  function setTele(t, p) { if (!t) return; if (t.kind === 'rect') t.fill.scale.set(1, 1, Math.max(0.001, p)); else t.fill.scale.setScalar(Math.max(0.001, p)); t.fill.material.opacity = 0.3 + p * 0.35; }
  function killTele(t) { if (!t || !t.alive) return; t.alive = false; scene.remove(t.g); t.g.traverse((o) => { const i = fx.indexOf(o); if (i >= 0) fx.splice(i, 1); }); }
  function swingTrail(m, reach, arc) {
    const geo = new THREE.RingGeometry(reach * 0.55, reach * 0.95, 24, 1, -arc / 2, arc); geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(1.5), transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    mesh.position.set(m.g.position.x, 1.0 * m.bodyScale, m.g.position.z); mesh.rotation.y = m.g.rotation.y - Math.PI / 2; mesh.rotation.z = 0.25; scene.add(mesh); fx.push(mesh); trails.push({ mesh, t: 0 });
  }

  // ---------- projectiles ----------
  function throwProj(m, target, opts = {}) {
    const from = m.g.position.clone().setY(1.5 * m.bodyScale); const to = target.clone().setY(1.0); const flat = Math.hypot(to.x - from.x, to.z - from.z); const spd = opts.speed || 13; const T = Math.max(0.35, flat / spd);
    const vel = new THREE.Vector3((to.x - from.x) / T, (to.y - from.y) / T + 0.5 * 12 * T, (to.z - from.z) / T);
    let mesh; if (opts.keys) { mesh = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 16), new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 1, roughness: 0.3 })); } else { mesh = trafficCone(0.45); }
    mesh.position.copy(from); scene.add(mesh);
    projs.push({ mesh, vel, dmg: scaleDmg(m.def.dmg, m.lvl) * (opts.mult || 1), src: m, life: 3, spin: 8 + Math.random() * 6, deflected: false });
    ctx.sfx && ctx.sfx('throw', from);
  }

  // ---------- helpers ----------
  const P = () => ctx.P.pos;
  function face(m, tx, tz, rate, dt) { const want = Math.atan2(tx - m.g.position.x, tz - m.g.position.z); let d = want - m.g.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; m.g.rotation.y += Math.max(-rate * dt, Math.min(rate * dt, d)); }
  function aggro(m, quiet) {
    if (m.dead || m.state === 'chase' || m.state === 'attack') return; const was = m.state; m.state = 'chase';
    if (!quiet && was !== 'chase' && Math.random() < (m.def.boss ? 1 : 0.55)) bark(m);
    if (m.def.boss && ctx.onBossAggro) ctx.onBossAggro(m);
    if (m.camp) for (const o of mobs) if (o !== m && o.camp === m.camp && !o.dead && o.state !== 'chase' && o.g.position.distanceTo(m.g.position) < 28) { o.state = 'chase'; if (Math.random() < 0.3) bark(o); }
  }
  function bark(m, txt) { if (m.barkT > 0) return; m.barkT = 4; ctx.bark && ctx.bark(m, txt || m.def.barks[Math.floor(Math.random() * m.def.barks.length)]); }
  function startAct(m, type, extra = {}) {
    const d = m.def, sp = m.enraged ? 0.78 : 1; const act = { type, t: 0, hit: false, yaw: m.g.rotation.y, ...extra };
    if (type === 'melee') { act.windup = d.windup * sp; act.swing = d.swing; act.recover = d.recover * sp; act.tele = telegraph('sector', m.g.position, m.g.rotation.y, d.reach + 0.3, d.arc); }
    else { const A = ABIL[type]; act.windup = A.windup * sp; act.swing = type === 'charge' ? 0.9 : 0.25; act.recover = 0.8 * sp;
      if (type === 'slam' || type === 'sweep') act.tele = telegraph('circle', m.g.position, 0, A.range);
      if (type === 'charge') { const yaw = Math.atan2(P().x - m.g.position.x, P().z - m.g.position.z); act.yaw = yaw; m.g.rotation.y = yaw; act.tele = telegraph('rect', m.g.position, yaw, A.range, 2.4); }
      if (type === 'puddle') { act.spots = [0, 1, 2].map((i) => { const a = Math.random() * 6.28, r = i === 0 ? 0 : 2.5 + Math.random() * 3; return new THREE.Vector3(P().x + Math.cos(a) * r, 0, P().z + Math.sin(a) * r); }); act.teles = act.spots.map((p) => telegraph('circle', p, 0, 2.2)); }
      if (type === 'whistle' || type === 'clockin') bark(m, type === 'whistle' ? 'FWEEEET! LADS! TO ME!' : 'Clock in, you lot! Overtime!');
      m.abCd[type] = A.cd; m.abUses[type] = (m.abUses[type] || 0) + 1; }
    m.act = act; m.state = 'attack'; ctx.sfx && ctx.sfx(d.boss ? 'bossWindup' : 'windup', m.g.position);
  }
  function endAct(m) { if (!m.act) return; killTele(m.act.tele); (m.act.teles || []).forEach(killTele); m.act = null; m.state = m.dead ? 'dead' : 'chase'; m.atkCd = (m.def.boss ? 0.5 : 0.5 + Math.random() * 0.8) * (m.enraged ? 0.7 : 1); }
  function inSector(m, reach, arc, yaw) { const dx = P().x - m.g.position.x, dz = P().z - m.g.position.z, d = Math.hypot(dx, dz); if (d > reach) return false; let a = Math.atan2(dx, dz) - yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return Math.abs(a) <= arc / 2 + 0.15; }
  function stagger(m, secs) { if (m.act) { killTele(m.act.tele); (m.act.teles || []).forEach(killTele); m.act = null; } m.state = 'stagger'; m.stagger = secs; ctx.floatText && ctx.floatText(m.g.position.clone().setY(2.4 * m.bodyScale), 'STAGGERED', 'parry'); }

  function doStrike(m) {
    const a = m.act, d = m.def, dmg = scaleDmg(d.dmg, m.lvl);
    if (a.type === 'melee') { swingTrail(m, d.reach + 0.3, d.arc); ctx.sfx && ctx.sfx('swing', m.g.position);
      if (inSector(m, d.reach + 0.5, d.arc, a.yaw)) { const r = ctx.hitPlayer(dmg, m, { kind: 'melee' }); if (r === 'parried') stagger(m, d.boss ? 1.4 : 1.8); } }
    if (a.type === 'slam' || a.type === 'sweep') { const R = ABIL[a.type].range; ctx.shake(0.45); ctx.burst(m.g.position.clone().setY(0.2), a.type === 'slam' ? '#e8a060' : '#7ac8e8', 50, 1.3); ctx.sfx && ctx.sfx('slam', m.g.position); if (m.g.position.distanceTo(P().clone().setY(0)) < R + 0.3) ctx.hitPlayer(dmg * 1.6, m, { kind: 'aoe', knock: 7 }); }
    if (a.type === 'whistle' || a.type === 'clockin') { const kind = a.type === 'whistle' ? 'goblin' : 'wight'; for (let i = 0; i < 3; i++) { const ang = Math.random() * 6.28; const s = spawn({ kind, variant: Math.floor(Math.random() * 8), lvl: Math.max(1, m.lvl - 3), x: m.g.position.x + Math.cos(ang) * 4, z: m.g.position.z + Math.sin(ang) * 4, camp: m.camp || 'boss' + mobs.indexOf(m) }); s.summoned = true; s.state = 'chase'; ctx.burst(s.g.position.clone().setY(0.5), '#ffd040', 20, 0.6); } }
    if (a.type === 'barrage' || a.type === 'keys') { const n = a.type === 'barrage' ? 5 : 3; for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * 2.2; const right = new THREE.Vector3(Math.cos(a.yaw), 0, -Math.sin(a.yaw)); throwProj(m, P().clone().addScaledVector(right, off), { speed: 14, keys: a.type === 'keys', mult: 0.8 }); } }
    if (a.type === 'puddle') { a.spots.forEach((p) => { const geo = new THREE.CircleGeometry(2.2, 32); geo.rotateX(-Math.PI / 2); const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#4a8aa8', roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.75 })); mesh.position.set(p.x, 0.04, p.z); scene.add(mesh); zones.push({ mesh, p, r: 2.2, t: 10, dps: scaleDmg(3, m.lvl) }); }); ctx.sfx && ctx.sfx('splash', m.g.position); }
  }

  // ---------- per-frame ----------
  function update(dt, t, playerLevel) {
    const pp = P();
    // flow field toward the player
    flowT -= dt; const pc = nav ? nav.idx(pp.x, pp.z) : -1;
    if (nav && (flowT <= 0 || pc !== flowCell) && flowT < 0.35) { nav.flow(pp.x, pp.z, 50); flowCell = pc; flowT = 0.5; }
    for (const m of mobs) {
      const g = m.g; m.barkT -= dt;
      if (m.dead) { m.deadT += dt; if (m.kind === 'wight' || m.kind === 'ebb') g.position.y = -Math.min(1.6 * m.bodyScale, m.deadT * 1.2); else m.body.rotation.x = Math.max(-1.5, -m.deadT * 4); if (m.deadT > 6) g.visible = false;
        if (m.roam && m.deadT > 90 && pp.distanceTo(m.home) > 60) { revive(m); } continue; }
      const dx = pp.x - g.position.x, dz = pp.z - g.position.z, dist = Math.hypot(dx, dz);
      const far = dist > 90; if (far && m.state === 'idle') continue;
      const d = m.def, spd = d.speed * (m.enraged ? 1.25 : 1) * (m.slow > 0 ? 0.5 : 1); m.slow -= dt;
      let move = new THREE.Vector3();
      if (m.state === 'idle') {
        if (dist < d.aggro && (dist < 6 || nav.los(g.position.x, g.position.z, pp.x, pp.z)) && !ctx.playerSafe()) aggro(m);
        m.wander -= dt; if (m.roam && m.wander <= 0) { m.wander = 3 + Math.random() * 5; const a = Math.random() * 6.28, r = Math.random() * 7; m.wanderTarget = new THREE.Vector3(m.home.x + Math.cos(a) * r, 0, m.home.z + Math.sin(a) * r); }
        if (m.wanderTarget && nav.free(m.wanderTarget.x, m.wanderTarget.z)) { const w = m.wanderTarget.clone().sub(g.position).setY(0); if (w.length() > 0.5) move = w.normalize().multiplyScalar(1.3); else m.wanderTarget = null; }
      } else if (m.state === 'stagger') { m.stagger -= dt; if (m.stagger <= 0) m.state = 'chase'; }
      else if (m.state === 'return') { const back = m.home.clone().sub(g.position).setY(0); m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.08 * dt); if (back.length() > 0.8) move = back.normalize().multiplyScalar(spd); else { m.state = 'idle'; m.hp = m.maxHp; if (d.boss && ctx.onBossReset) ctx.onBossReset(m); } if (dist < 8) m.state = 'chase'; }
      else if (m.state === 'chase') {
        const leash = d.leash || 45; if (g.position.distanceTo(m.home) > leash + 10 || dist > 55 || ctx.playerSafe()) { m.state = 'return'; }
        else {
          m.atkCd -= dt; for (const k in m.abCd) m.abCd[k] -= dt;
          // pick an action
          let acted = false;
          if (m.atkCd <= 0 && d.abilities) { for (const a of d.abilities) { const A = ABIL[a]; if (m.abCd[a] > 0 || (A.uses && (m.abUses[a] || 0) >= A.uses)) continue; const ok = a === 'slam' || a === 'sweep' ? dist < A.range * 0.8 : a === 'charge' ? dist > 5 && dist < A.range && nav.los(g.position.x, g.position.z, pp.x, pp.z) : a === 'whistle' || a === 'clockin' ? m.hp < m.maxHp * 0.75 : dist < A.range; if (ok && Math.random() < 0.6) { startAct(m, a); acted = true; break; } } }
          if (!acted && d.ranged && m.atkCd <= 0 && dist > d.ranged.min * 0.7 && dist < d.ranged.max && nav.los(g.position.x, g.position.z, pp.x, pp.z)) { m.act = { type: 'throw', t: 0, windup: d.ranged.windup, swing: 0.2, recover: 0.6, yaw: g.rotation.y }; m.state = 'attack'; acted = true; }
          if (!acted && m.atkCd <= 0 && dist < d.reach * 0.9) { face(m, pp.x, pp.z, 20, 1); startAct(m, 'melee'); acted = true; }
          if (!acted) {
            const stopAt = d.ranged ? d.ranged.min : d.reach * 0.75;
            if (dist > stopAt) { let tx = pp.x, tz = pp.z; if (!nav.los(g.position.x, g.position.z, pp.x, pp.z)) { const n = nav.next(g.position.x, g.position.z); if (n) { tx = n[0]; tz = n[1]; } } const v = new THREE.Vector3(tx - g.position.x, 0, tz - g.position.z); if (v.lengthSq() > 1e-4) move = v.normalize().multiplyScalar(spd); }
            else if (d.ranged && dist < d.ranged.min * 0.6) move = new THREE.Vector3(-dx, 0, -dz).normalize().multiplyScalar(spd * 0.7);
            face(m, pp.x, pp.z, 8, dt);
          }
        }
      }
      if (m.state === 'attack' && m.act) {
        const a = m.act; a.t += dt; const W = a.windup, S = a.swing, R = a.recover;
        if (a.type === 'melee' && a.t < W * 0.6) { face(m, pp.x, pp.z, 5, dt); a.yaw = g.rotation.y; if (a.tele) a.tele.g.rotation.y = a.yaw - Math.PI / 2; if (a.tele) a.tele.g.position.set(g.position.x, 0.05, g.position.z); }
        if (a.type === 'throw' && a.t < W) face(m, pp.x, pp.z, 8, dt);
        if (a.type === 'slam' || a.type === 'sweep') { if (a.tele) a.tele.g.position.set(g.position.x, 0.05, g.position.z); }
        if (a.t < W) { setTele(a.tele, a.t / W); (a.teles || []).forEach((tt) => setTele(tt, a.t / W)); }
        else if (!a.hit) { a.hit = true; killTele(a.tele); (a.teles || []).forEach(killTele);
          if (a.type === 'throw') { throwProj(m, pp.clone().addScaledVector(ctx.P.vel, 0.4), { speed: d.ranged.speed }); const h = m.body.getObjectByName('held'); if (h) h.visible = false; }
          else if (a.type !== 'charge') doStrike(m); }
        if (a.type === 'charge' && a.t >= W && a.t < W + S) { const v = new THREE.Vector3(Math.sin(a.yaw), 0, Math.cos(a.yaw)).multiplyScalar(18); const before = g.position.clone(); g.position.addScaledVector(v, dt); col.resolve(g.position, 0.6 * m.bodyScale, 0); if (g.position.distanceTo(before) < 18 * dt * 0.4) a.t = W + S; if (!a.struck && g.position.distanceTo(pp.clone().setY(0)) < 1.6 * m.bodyScale) { a.struck = true; ctx.hitPlayer(scaleDmg(d.dmg, m.lvl) * 1.4, m, { kind: 'aoe', knock: 9 }); } if (Math.random() < dt * 30) ctx.burst(g.position.clone().setY(0.2), '#c8b8a0', 2, 0.4); }
        if (a.t >= W + S + R) { if (a.type === 'throw') { const h = m.body.getObjectByName('held'); if (h) h.visible = true; m.atkCd = d.ranged.cd * (0.8 + Math.random() * 0.5); m.act = null; m.state = 'chase'; } else endAct(m); }
      }
      // separation from other mobs
      for (const o of mobs) { if (o === m || o.dead) continue; const sx = g.position.x - o.g.position.x, sz = g.position.z - o.g.position.z, sd = Math.hypot(sx, sz), min = 0.55 * (m.bodyScale + o.bodyScale); if (sd < min && sd > 1e-3) { move.x += (sx / sd) * 2.5; move.z += (sz / sd) * 2.5; } }
      if (m.stun > 0) { m.stun -= dt; move.set(0, 0, 0); }
      g.position.addScaledVector(move, dt); col.resolve(g.position, 0.4 * Math.min(1.6, m.bodyScale), 0);
      if (move.lengthSq() > 0.2 && m.state !== 'attack') { const want = Math.atan2(move.x, move.z); let df = want - g.rotation.y; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; g.rotation.y += df * Math.min(1, dt * 10); }
      animate(m, move, t, dt);
      if (m.burn > 0) { m.burn -= dt; m.hp -= m.burnDps * dt; if (Math.random() < dt * 14) ctx.burst(g.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1 + Math.random(), (Math.random() - 0.5) * 0.4)), '#ff8a2a', 1, 0.2, -2); if (m.hp <= 0) ctx.kill(m); }
      // enrage
      if (d.boss && !m.enraged && m.hp < m.maxHp * 0.4) { m.enraged = true; ctx.banner && ctx.banner(d.enrage || `${d.name} IS ENRAGED`, '#E5484D'); ctx.sfx && ctx.sfx('roar', g.position); }
    }
    // projectiles
    for (let i = projs.length - 1; i >= 0; i--) { const p = projs[i]; p.life -= dt; p.vel.y -= 12 * dt; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.rotation.x += p.spin * dt; p.mesh.rotation.z += p.spin * 0.6 * dt;
      let gone = p.life <= 0 || p.mesh.position.y < 0.05;
      if (!gone && !p.deflected && p.mesh.position.distanceTo(pp.clone().setY(1.1)) < 0.75) { const r = ctx.hitPlayer(p.dmg, p.src, { kind: 'proj' }); if (r === 'parried' && !p.src.dead) { p.deflected = true; const to = p.src.g.position.clone().setY(1.2); p.vel = to.sub(p.mesh.position).normalize().multiplyScalar(22); p.vel.y += 1; } else gone = true; }
      if (!gone && p.deflected) { for (const m of mobs) if (!m.dead && m.g.position.clone().setY(1.1 * m.bodyScale).distanceTo(p.mesh.position) < 0.9 * m.bodyScale) { ctx.hurt(m, p.dmg * 2.5, 0); gone = true; break; } }
      if (gone) { scene.remove(p.mesh); projs.splice(i, 1); ctx.burst(p.mesh.position, '#e8590c', 8, 0.4); } }
    // trails + zones
    for (let i = trails.length - 1; i >= 0; i--) { const tr = trails[i]; tr.t += dt; tr.mesh.material.opacity = 0.75 * (1 - tr.t / 0.22); tr.mesh.rotation.y += dt * 4; if (tr.t > 0.22) { scene.remove(tr.mesh); fx.splice(fx.indexOf(tr.mesh), 1); trails.splice(i, 1); } }
    for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; z.t -= dt; z.mesh.material.opacity = Math.min(0.75, z.t * 0.4); if (Math.hypot(pp.x - z.p.x, pp.z - z.p.z) < z.r) { ctx.zoneTick(z.dps * dt); } if (z.t <= 0) { scene.remove(z.mesh); zones.splice(i, 1); } }
  }
  function playerInZone() { const pp = P(); return zones.some((z) => Math.hypot(pp.x - z.p.x, pp.z - z.p.z) < z.r); }

  function animate(m, move, t, dt) {
    const b = m.body, s = m.bodyScale, a = m.act; let lean = 0, hop = 0, sway = 0, glow = 0, lunge = 0, wRot = 0, squash = 1;
    const moving = move.lengthSq() > 0.05;
    if (moving) { hop = Math.abs(Math.sin(t * 9 + m.wander)) * 0.08 * s; sway = Math.sin(t * 9 + m.wander) * 0.06; lean = 0.08; }
    if (a) { const W = a.windup, S = a.swing; const p = Math.min(1, a.t / W);
      if (a.t < W) { lean = -0.32 * p; wRot = -2.1 * p; glow = 0.06 + 0.16 * p * (0.6 + 0.4 * Math.sin(t * 30)); squash = 1 + 0.06 * p; if (a.type === 'slam' || a.type === 'sweep') { hop = 0.5 * p * s; } }
      else if (a.t < W + S) { const q = (a.t - W) / S; lean = 0.45; wRot = -2.1 + 3.5 * Math.min(1, q * 1.6); lunge = 0.35 * Math.sin(q * Math.PI) * s; glow = 0.08; if (a.type === 'slam' || a.type === 'sweep') { hop = 0; squash = 0.85; } }
      else { const q = Math.min(1, (a.t - W - S) / a.recover); lean = 0.45 * (1 - q); wRot = 1.4 * (1 - q); } }
    if (m.state === 'stagger') { lean = -0.25 + Math.sin(t * 14) * 0.08; sway = Math.sin(t * 9) * 0.15; }
    b.rotation.x = lean; b.rotation.z = sway; b.position.y = hop; b.position.z = lunge; b.scale.set(s, s * squash, s);
    if (m.weapon && m.wBase) m.weapon.rotation.set(m.wBase.x + wRot, m.wBase.y, m.wBase.z + (a && a.type === 'sweep' ? wRot * 0.6 : 0));
    m.flash = Math.max(0, m.flash - dt); const f = m.flash / 0.12, bn = m.burn > 0 ? 0.25 : 0;
    for (const mt of m.mats) mt.emissive.setRGB(0.8 * f + bn + glow, 0.1 * f + bn * 0.35 + glow * 0.25, 0.05 * f);
  }
  function revive(m) { m.dead = false; m.deadT = 0; m.hp = m.maxHp; m.state = 'idle'; m.g.visible = true; m.body.rotation.x = 0; m.g.position.copy(m.home); m.bar = ctx.makeBar(); }
  function clearAll() { for (const m of mobs) if (m.act) endAct(m); }
  return { mobs, spawn, update, buildNav, aggro, stagger, endAct, playerInZone, get nav() { return nav; }, clearAll, projs };
}
