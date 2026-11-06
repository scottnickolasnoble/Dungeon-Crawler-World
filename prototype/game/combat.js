// Player combat engine: melee weapon swings (light/heavy), and every class skill by kind
// (bolt, volley, nova, cone, zone, ward, heal, buff, dash, strike, summon, reveal). Elements apply statuses.
import * as THREE from '../node_modules/three/build/three.module.js';
import { skillDef, UP_EFFECT, ELEM, ELEM_STATUS, CLASSES } from './classes.js';

export function createCombat(ctx) {
  const { scene, fx, camera, P, state, col } = ctx;
  const projectiles = [], zones = [], allies = [], blasts = [];
  const cds = {}; let swingT = 0, swingCd = 0, heavyPending = null;
  const lights = [0, 1, 2].map(() => { const l = new THREE.PointLight('#ff8a2a', 0, 8, 1.5); scene.add(l); return l; });

  // ---------- stats ----------
  const level = (id) => (state.skills[id] ? state.skills[id].lvl + ctx.gearSkillBonus(id) : 0);
  const ups = (id) => (state.skills[id] ? state.skills[id].ups : []);
  function mods(id) { const m = { dmg: 1, cd: 1, size: 1, count: 0, status: 1, cost: 1 }; ups(id).forEach((c, t) => { if (c === undefined || c === null) return; const e = UP_EFFECT[t][c]; for (const k in e) { if (k === 'count') m.count += e[k]; else m[k] *= e[k]; } }); return m; }
  function power(def, id) { const D = ctx.derived(); const L = Math.max(1, level(id)); const [b, per] = def.dmg || [0, 0]; const st = D.stat(def.scale || 'INT'); return (b + per * L + st * 1.4) * mods(id).dmg * (1 + (D.gearStats[def.elem] || 0) / 100); }
  const cdLeft = (id) => cds[id] || 0;
  function cooldownFrac(id) { const d = skillDef(id); return d && d.cd ? Math.max(0, (cds[id] || 0) / (d.cd * mods(id).cd)) : 0; }

  // ---------- statuses on mobs ----------
  function applyStatus(m, def, secs) {
    if (!m || m.dead || !secs) return; const st = def.root ? 'root' : def.freeze ? 'freeze' : ELEM_STATUS[def.elem] || 'none';
    if (st === 'burn' || st === 'poison' || st === 'bleed') { m.burn = Math.max(m.burn || 0, secs); m.burnDps = Math.max(m.burnDps || 0, power(def, def.id) * 0.18); m.dotColor = ELEM[def.elem] ? ELEM[def.elem].color : '#ff8a2a'; if (st === 'burn') state.counters.burned++; }
    if (st === 'slow') m.slow = Math.max(m.slow || 0, secs);
    if (st === 'stun' || st === 'root') m.stun = Math.max(m.stun || 0, Math.min(2.5, secs));
    if (st === 'freeze') { m.stun = Math.max(m.stun || 0, Math.min(3, secs)); m.slow = secs + 2; }
    if (st === 'wet') m.wet = Math.max(m.wet || 0, secs * 2);
    if (st === 'weaken' || def.weaken) m.weak = Math.max(m.weak || 0, secs * 2);
  }
  function hit(m, dmg, def, opts = {}) {
    if (!m || m.dead) return; let d = dmg;
    if (def.elem === 'storm' && m.wet > 0) d *= 1.5; if (def.undead && /wight|ebb|bone/.test(m.kind)) d *= def.undead;
    ctx.hurtMob(m, d, { crit: def.crit || 0, elem: def.elem, color: ELEM[def.elem] ? ELEM[def.elem].color : null });
    if (def.status) applyStatus(m, def, def.status * mods(def.id).status);
    if (def.knock || opts.knock) { const k = m.g.position.clone().sub(opts.from || P.pos).setY(0).normalize().multiplyScalar(def.knock || opts.knock); m.g.position.add(k.multiplyScalar(0.25)); col.resolve(m.g.position, 0.4, 0); }
    if (def.pull) { const k = (opts.from || P.pos).clone().sub(m.g.position).setY(0); const L = k.length(); if (L > 1.8) m.g.position.addScaledVector(k.normalize(), Math.min(L - 1.6, 5)); }
    if (def.drain) { const D = ctx.derived(); state.hp = Math.min(D.maxHp, state.hp + d * def.drain); }
    if (def.taunt) ctx.aggro(m);
    if (def.steal && Math.random() < 0.35) ctx.steal(m);
  }

  // ---------- projectiles ----------
  function spawnBolt(origin, dir, def, scale = 1) {
    const e = ELEM[def.elem] || ELEM.fire; const size = (def.size || 0.12) * mods(def.id).size * scale;
    const core = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(e.core).multiplyScalar(2.6) }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(size * 2, 10, 8), new THREE.MeshBasicMaterial({ color: e.color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.add(halo); core.position.copy(origin); scene.add(core); fx.push(core, halo);
    projectiles.push({ m: core, v: dir.clone().multiplyScalar(def.speed || 30), def, life: 2.4, scale, trail: 0, hits: new Set(), chain: def.chain || 0 });
  }
  function updateProjectiles(dt) {
    let li = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i], def = pr.def; pr.life -= dt; pr.m.position.addScaledVector(pr.v, dt); if (def.arc) pr.v.y -= def.arc * 3 * dt;
      if (li < 3) { lights[li].color.set((ELEM[def.elem] || ELEM.fire).color); lights[li].position.copy(pr.m.position); lights[li].intensity = def.explode ? 12 : 5; li++; }
      pr.trail += dt; if (pr.trail > 0.035) { pr.trail = 0; ctx.burst(pr.m.position, (ELEM[def.elem] || ELEM.fire).color, 1, 0.15, -1); }
      let hitM = null; for (const m of ctx.mobs) if (!m.dead && !pr.hits.has(m) && m.g.position.clone().setY(1.1 * m.bodyScale).distanceTo(pr.m.position) < 0.75 * Math.max(1, m.bodyScale * 0.8)) { hitM = m; break; }
      const q = pr.m.position.clone(); col.resolve(q, 0.05, pr.m.position.y); const wall = q.distanceToSquared(pr.m.position) > 1e-6 || pr.m.position.y < 0.05 || pr.m.position.y > ctx.ceiling() - 0.1;
      let done = wall || pr.life <= 0;
      if (hitM) { pr.hits.add(hitM);
        if (def.explode) done = true; else { hit(hitM, power(def, def.id) * pr.scale, def, { from: pr.m.position }); ctx.burst(pr.m.position, (ELEM[def.elem] || ELEM.fire).core, 10, 0.5);
          if (pr.chain > 0) { pr.chain--; const nxt = ctx.mobs.filter((o) => !o.dead && !pr.hits.has(o) && o.g.position.distanceTo(hitM.g.position) < 9).sort((a, b) => a.g.position.distanceTo(hitM.g.position) - b.g.position.distanceTo(hitM.g.position))[0]; if (nxt) { pr.v = nxt.g.position.clone().setY(1.1 * nxt.bodyScale).sub(pr.m.position).normalize().multiplyScalar(def.speed || 40); pr.life = 1; } else done = true; }
          else if (!def.pierce) done = true; } }
      if (done) { if (def.explode) explode(pr.m.position.clone(), def.explode * mods(def.id).size, def); scene.remove(pr.m); fx.splice(fx.indexOf(pr.m), 1); projectiles.splice(i, 1); }
    }
    for (; li < 3; li++) lights[li].intensity = 0;
  }
  function explode(p, radius, def) {
    const e = ELEM[def.elem] || ELEM.fire; const s = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: e.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.copy(p); scene.add(s); fx.push(s);
    blasts.push({ m: s, r: radius, life: 0.4, t: 0 }); ctx.burst(p, e.color, 40, 1.1); ctx.shake(0.22); ctx.sfx('explode', p);
    for (const m of ctx.mobs) if (!m.dead && m.g.position.distanceTo(p) < radius + 0.6) hit(m, power(def, def.id), def, { from: p });
  }

  // ---------- area helpers ----------
  const fwd = () => new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const flatFwd = () => new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
  function inArc(m, range, arc) { const d = m.g.position.clone().sub(P.pos).setY(0); const L = d.length(); if (L > range + 0.4 * m.bodyScale) return false; const a = Math.acos(Math.max(-1, Math.min(1, d.normalize().dot(flatFwd())))); return a <= arc / 2 + 0.15; }
  function ring(p, r, color, dur = 0.45) { const geo = new THREE.RingGeometry(0.2, 1, 48); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.position.set(p.x, 0.1, p.z); scene.add(m); fx.push(m); blasts.push({ m, r, life: dur, t: 0, ring: true }); }

  // ---------- casting ----------
  function cast(id) {
    const def = skillDef(id); if (!def) return false; if (!state.skills[id]) { ctx.toast(`${def.name} is locked · ${def.src}`, '#9a9a9a', 1500); return false; }
    if (def.kind === 'passive') return false; if (cdLeft(id) > 0) return false;
    const M = mods(id); const cost = Math.round((def.cost || 0) * M.cost); if (state.mana < cost) { ctx.toast('Not enough mana', '#4a9aff', 900); return false; }
    state.mana -= cost; const D = ctx.derived(); cds[id] = (def.cd || 1) * M.cd * (1 - (D.castSpeed || 0) / 100); ctx.castAnim(def);
    const dir = fwd(), origin = camera.position.clone().add(new THREE.Vector3(0.25, -0.2, -0.5).applyQuaternion(camera.quaternion)); const e = ELEM[def.elem] || ELEM.fire;
    switch (def.kind) {
      case 'bolt': { const n = 1 + (id === 'flick' || id === 'firebolt' ? M.count : 0); for (let i = 0; i < n; i++) { const d = dir.clone(); if (n > 1) d.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - (n - 1) / 2) * 0.07); spawnBolt(origin, d, def, n > 1 ? 0.7 : 1); } break; }
      case 'volley': { const n = (def.count || 5) + M.count; for (let i = 0; i < n; i++) { const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (i / (n - 1) - 0.5) * (def.spread || 0.5)); spawnBolt(origin, d, def); } break; }
      case 'nova': { const r = (def.radius || 5) * M.size; ring(P.pos, r, e.color); ctx.burst(P.pos.clone().setY(1), e.color, 50, 1.2); ctx.shake(0.15); for (const m of ctx.mobs) if (!m.dead && m.g.position.distanceTo(P.pos) < r + 0.5 * m.bodyScale) { if (def.id === 'combust' && !(m.burn > 0)) continue; hit(m, power(def, id), def, { knock: def.knock }); } break; }
      case 'cone': { const r = (def.range || 6) * M.size; coneFx(r, def.arc || 1.2, e.color); for (const m of ctx.mobs) if (!m.dead && inArc(m, r, def.arc || 1.2)) hit(m, power(def, id), def, { knock: def.knock }); break; }
      case 'strike': { swingT = 0.32; for (const m of ctx.mobs) if (!m.dead && inArc(m, def.range || 2.6, def.arc || 1.3)) hit(m, power(def, id) + weaponDmg(), def); ctx.sfx('swing', P.pos); break; }
      case 'zone': { const at = ctx.rayHit(origin, dir, (def.range || 12)).setY(0); const r = (def.radius || 3) * M.size; const mesh = zoneMesh(at, r, e.color); zones.push({ p: at, r, t: def.dur || 6, def, tick: 0, mesh }); break; }
      case 'ward': { const amt = (def.amount[0] + def.amount[1] * level(id) + D.stat(def.scale || 'WIS') * 1.2) * M.dmg; state.wardMax = state.ward = amt; state.wardElem = def.elem; state.wardThorns = def.thorns || 0; state.wardHeal = def.heal || 0; ctx.wardColor(e.color); if (def.parry) ctx.bigParry(); ctx.toast(def.name, e.color, 900); break; }
      case 'heal': { const amt = (def.amount[0] + def.amount[1] * level(id) + D.stat(def.scale || 'WIS') * 1.5) * M.dmg; state.hp = Math.min(D.maxHp, state.hp + amt); if (def.thirst) state.thirst = Math.min(100, state.thirst + def.thirst); if (def.hunger) state.hunger = Math.min(100, state.hunger + def.hunger); ctx.burst(P.pos.clone().setY(1.2), e.color, 30, 0.6, -3); ctx.floatText(P.pos.clone().add(new THREE.Vector3(0, 1.6, 0)).add(flatFwd()), '+' + Math.round(amt), 'heal'); break; }
      case 'buff': { const until = performance.now() / 1000 + (def.dur || 10) * (1 + (M.status - 1) * 0.5); for (const [k, v] of Object.entries(def.buff)) state.buffs.push({ stat: k, amount: v * M.dmg, until, src: id }); ctx.toast(`${def.name}: ${Object.entries(def.buff).map(([k, v]) => `+${Math.round(v * M.dmg)} ${k}`).join(', ')}`, e.color, 1600); break; }
      case 'dash': { ctx.dash(flatFwd(), (def.dist || 8) * M.size, def.lift || 0); const from = P.pos.clone(); setTimeout(() => { for (const m of ctx.mobs) if (!m.dead && distToSeg(m.g.position, from, P.pos) < 1.6 * m.bodyScale && def.dmg && def.dmg[0] > 0) hit(m, power(def, id), def); }, 260); ctx.burst(P.pos.clone().setY(0.6), e.color, 20, 0.6); break; }
      case 'summon': { summon(def, id); break; }
      case 'reveal': { ctx.reveal(def); break; }
    }
    ctx.sfx(def.kind === 'heal' || def.kind === 'ward' || def.kind === 'buff' ? 'ward' : def.kind === 'nova' ? 'explode' : def.explode ? 'fireball' : 'firebolt', P.pos);
    return true;
  }
  const distToSeg = (p, a, b) => { const ab = b.clone().sub(a).setY(0), ap = p.clone().sub(a).setY(0); const t = Math.max(0, Math.min(1, ap.dot(ab) / Math.max(1e-4, ab.lengthSq()))); return ap.sub(ab.multiplyScalar(t)).length(); };
  function coneFx(r, arc, color) { const geo = new THREE.RingGeometry(0.4, r, 32, 1, -arc / 2, arc); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.position.set(P.pos.x, 0.6, P.pos.z); m.rotation.y = P.yaw + Math.PI / 2; scene.add(m); fx.push(m); blasts.push({ m, r: 1, life: 0.35, t: 0, cone: true }); }
  function zoneMesh(p, r, color) { const geo = new THREE.CircleGeometry(r, 36); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set(p.x, 0.06, p.z); scene.add(m); fx.push(m); return m; }
  function updateZones(dt, t) {
    for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; z.t -= dt; z.tick -= dt; z.mesh.material.opacity = 0.25 + Math.sin(t * 6) * 0.08; z.mesh.rotation.y += dt * (z.def.pull ? 3 : 0.4);
      if (Math.random() < dt * 20) ctx.burst(new THREE.Vector3(z.p.x + (Math.random() - 0.5) * z.r * 1.6, 0.3, z.p.z + (Math.random() - 0.5) * z.r * 1.6), (ELEM[z.def.elem] || ELEM.fire).color, 1, 0.3, -2);
      if (z.tick <= 0) { z.tick = 0.5; for (const m of ctx.mobs) if (!m.dead && Math.hypot(m.g.position.x - z.p.x, m.g.position.z - z.p.z) < z.r + 0.4) { hit(m, power(z.def, z.def.id) * 0.45, z.def, { from: z.p }); } if (z.def.healZone && Math.hypot(P.pos.x - z.p.x, P.pos.z - z.p.z) < z.r) { const D = ctx.derived(); state.hp = Math.min(D.maxHp, state.hp + z.def.healZone * 0.5 + D.stat('WIS') * 0.2); } }
      if (z.t <= 0) { scene.remove(z.mesh); fx.splice(fx.indexOf(z.mesh), 1); zones.splice(i, 1); } }
  }
  // summons: a glowing companion that orbits you and zaps the nearest enemy
  function summon(def, id) { const e = ELEM[def.elem] || ELEM.fire; const g = new THREE.Group(); const core = new THREE.Mesh(new THREE.SphereGeometry(def.elem === 'death' ? 0.28 : 0.22, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(e.core).multiplyScalar(2.2) })); g.add(core); fx.push(core);
    if (def.elem === 'death' || id === 'hawk') { const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.7, 4, 8), new THREE.MeshStandardMaterial({ color: def.elem === 'death' ? '#e8e0d0' : '#8a6a4a' })); body.position.y = -0.6; g.add(body); }
    const l = new THREE.PointLight(e.color, 4, 6); g.add(l); g.position.copy(P.pos).setY(1.6); scene.add(g); allies.push({ g, def, id, t: def.dur || 20, cd: 0, ph: Math.random() * 6 }); ctx.toast(`${def.name}!`, e.color, 1200); }
  function updateAllies(dt, t) {
    for (let i = allies.length - 1; i >= 0; i--) { const a = allies[i]; a.t -= dt; a.cd -= dt; a.ph += dt * 2;
      let target = null, bd = 13; for (const m of ctx.mobs) { if (m.dead) continue; const d = m.g.position.distanceTo(a.g.position); if (d < bd) { bd = d; target = m; } }
      const home = target && bd < 13 ? target.g.position.clone().add(new THREE.Vector3(Math.cos(a.ph) * 1.6, 1.6, Math.sin(a.ph) * 1.6)) : P.pos.clone().add(new THREE.Vector3(Math.cos(a.ph) * 1.8, 1.8 + Math.sin(t * 3) * 0.2, Math.sin(a.ph) * 1.8));
      a.g.position.lerp(home, Math.min(1, dt * 3));
      if (target && a.cd <= 0 && bd < 5) { a.cd = 0.9; hit(target, power(a.def, a.id) * 0.8, a.def); ctx.burst(target.g.position.clone().setY(1.2), (ELEM[a.def.elem] || ELEM.fire).color, 8, 0.5); }
      if (a.t <= 0) { scene.remove(a.g); allies.splice(i, 1); } }
  }

  // ---------- melee ----------
  function weaponDmg() { const w = state.equip.main; const D = ctx.derived(); return (w && w.stats.dmg ? w.stats.dmg : 4) + D.stat('STR') * 0.7 + (D.gearStats.dmg || 0) * 0.3; }
  function swing(heavy) {
    if (swingCd > 0) return false; const D = ctx.derived(); const spd = 1 + (D.atkSpeed || 0) / 100; swingCd = (heavy ? 1.25 : 0.62) / spd; swingT = heavy ? 0.42 : 0.3;
    if (heavy && state.stamina < 12) { ctx.toast('Too tired for a heavy swing', '#5ad86a', 900); swingCd = 0.3; return false; } if (heavy) state.stamina -= 12;
    const brand = state.buffs.some((b) => b.stat === 'weaponElem' && b.until > performance.now() / 1000);
    const def = { id: 'melee', elem: brand ? 'fire' : 'phys', status: brand ? 2 : heavy ? 0.6 : 0, crit: 0 };
    ctx.sfx('swing', P.pos);
    setTimeout(() => { let n = 0; for (const m of ctx.mobs) { if (m.dead || n >= 3) continue; if (inArc(m, heavy ? 3 : 2.6, heavy ? 1.9 : 1.6)) { n++; const dmg = weaponDmg() * (heavy ? 2.2 : 1) * (0.9 + Math.random() * 0.2); ctx.hurtMob(m, dmg, { elem: def.elem, crit: 0 }); if (heavy && Math.random() < 0.5) { m.stun = Math.max(m.stun || 0, 0.8); } if (def.status) applyStatus(m, { ...def, elem: 'fire' }, 2); ctx.burst(m.g.position.clone().setY(1.2 * m.bodyScale), '#ffffff', 10, 0.5); } } if (n) ctx.shake(heavy ? 0.2 : 0.08); }, heavy ? 180 : 90);
    return true;
  }

  function update(dt, t) {
    for (const k in cds) cds[k] = Math.max(0, cds[k] - dt); swingCd = Math.max(0, swingCd - dt); swingT = Math.max(0, swingT - dt);
    updateProjectiles(dt); updateZones(dt, t); updateAllies(dt, t);
    for (let i = blasts.length - 1; i >= 0; i--) { const b = blasts[i]; b.t += dt; const k = b.t / b.life; if (b.ring) { b.m.scale.setScalar(0.2 + k * b.r); } else if (!b.cone) b.m.scale.setScalar(0.3 + k * b.r); b.m.material.opacity = 0.75 * (1 - k); if (b.t >= b.life) { scene.remove(b.m); fx.splice(fx.indexOf(b.m), 1); blasts.splice(i, 1); } }
  }
  return { cast, swing, update, cooldownFrac, level, power, get swingT() { return swingT; }, clear() { projectiles.splice(0).forEach((p) => scene.remove(p.m)); } };
}
