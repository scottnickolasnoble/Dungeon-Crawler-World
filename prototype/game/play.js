// Walkable floor: first-person Pyromancer with spells, goblins, loot, stats, skills and achievements.
import * as THREE from '../node_modules/three/build/three.module.js';
import { createInk, Collision } from '../engine/ink.js';
import { makeGoblin } from '../creature.js';
import { SKILLS, CLASS, STATS, makeItem, makeRng, openBox, BOXES, ACHIEVEMENTS, CONSUMABLES } from './data.js';
import { createUI } from './ui.js';

const $ = (id) => document.getElementById(id);
const FLOOR = new URLSearchParams(location.search).get('floor') || '1';
const rng = makeRng(Date.now() & 0xffff);
const FIRE_SKILLS = ['firebolt', 'fireball', 'flamewave', 'emberdarts', 'combust', 'heatray', 'lavapool', 'livingflame', 'inferno', 'flamestep'];

// ---------------- state ----------------
const state = {
  name: 'Dale', level: 9, xp: 120, xpNext: 0, statPoints: 5, skillPoints: 2, gold: 37, scrap: 4,
  base: { STR: 8, DEX: 11, CON: 14, INT: 21, WIS: 13, CHA: 9 },
  hp: 1, mana: 1, stamina: 100, hunger: 78, thirst: 64, ward: 0, wardMax: 1,
  equip: {}, inv: [], ach: {}, counters: { walked: 0, kills: 0, burned: 0, wardAbsorb: 0, boxes: 0 }, discovered: new Set(),
  skills: { firebolt: { lvl: 7, ups: [1] }, flameward: { lvl: 5, ups: [0] }, kindle: { lvl: 3, ups: [] }, fireball: { lvl: 4, ups: [] } },
};
state.equipped = (it) => Object.values(state.equip).includes(it);
const xpFor = (lv) => Math.round(80 * lv ** 1.45);
state.xpNext = xpFor(state.level);
// starting kit: a few pieces equipped, some in the bag, and a box to open
for (const slot of ['head', 'chest', 'main', 'boots', 'gloves']) state.equip[slot] = makeItem(rng, { level: 8, slot, minRarity: 1 });
for (let i = 0; i < 6; i++) state.inv.push(makeItem(rng, { level: 8 }));
state.inv.push({ uid: 9001, kind: 'box', box: 'silver', name: 'Silver Box', rarity: 'rare', host: 'A welcome gift. From us. To you. Enjoy it while you can.' });
state.inv.push({ ...CONSUMABLES[0], uid: 9002, rarity: 'common' }, { ...CONSUMABLES[1], uid: 9003, rarity: 'common' }, { ...CONSUMABLES[2], uid: 9004, rarity: 'uncommon' });

function gearTotals() { const t = {}; for (const it of Object.values(state.equip)) if (it) for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + v; return t; }
function derived() {
  const g = gearTotals(); const S = (k) => state.base[k] + (g[k] || 0);
  return { gearStats: g, maxHp: 60 + S('CON') * 8 + (g.hp || 0), maxMana: 40 + S('INT') * 6 + (g.mana || 0), maxStamina: 80 + S('CON') * 2 + S('DEX'), manaRegen: 2 + S('WIS') * 0.35,
    armor: g.armor || 0, spell: S('INT') * 2 + (g.spell || 0), fire: g.fire || 0, crit: 5 + Math.floor(S('DEX') / 3) + (g.crit || 0), castSpeed: g.castSpeed || 0, moveSpeed: g.moveSpeed || 0 };
}
const gearSkillBonus = (id) => { const g = gearTotals(); return (g['skill_' + id] || 0) + (FIRE_SKILLS.includes(id) ? g.skill_fire || 0 : 0); };
const effLevel = (id) => (state.skills[id] ? state.skills[id].lvl + gearSkillBonus(id) : 0);
function spellDamage(id) { const D = derived(), L = effLevel(id); const base = id === 'fireball' ? 34 + L * 7 : id === 'firebolt' ? 12 + L * 3.2 : 0; return (base + D.spell * (id === 'fireball' ? 0.9 : 0.55)) * (1 + D.fire / 100); }
{ const D = derived(); state.hp = D.maxHp * 0.85; state.mana = D.maxMana; }

// ---------------- scene ----------------
const ink = createInk($('stage'), { fov: 72 });
const { scene, camera, fx } = ink;
const col = new Collision(8);
let world;
const cds = {}; const cooldownFrac = (id) => { const s = SKILLS.find((q) => q.id === id); const r = cds[id] || 0; return s && s.cd ? Math.max(0, r / s.cd) : 0; };

// ---------------- UI hooks ----------------
const G = { state, derived, gearSkillBonus, spellDamage, cooldownFrac, onPanel: (o) => { if (o && document.pointerLockElement) document.exitPointerLock(); },
  drawMap, achProgress,
  addStat(s) { if (state.statPoints > 0) { state.base[s]++; state.statPoints--; } },
  levelSkill(id) { const k = state.skills[id]; if (k && state.skillPoints > 0 && k.lvl < 15) { k.lvl++; state.skillPoints--; if (k.lvl % 5 === 0) ui.toast(`<b>${SKILLS.find((s) => s.id === id).name}</b> reached Lv ${k.lvl}: choose an upgrade!`, '#b46cff'); } },
  chooseUpgrade(id, t, c) { const k = state.skills[id]; if (k && k.lvl >= (t + 1) * 5 && k.ups[t] === undefined) { k.ups[t] = c; ui.toast(`Upgrade chosen: <b>${SKILLS.find((s) => s.id === id).ups[t][c]}</b>`, '#b46cff'); } },
  unequip(slot) { const it = state.equip[slot]; if (!it) return; if (state.inv.length >= 48) return ui.toast('Inventory full!', '#E5484D'); delete state.equip[slot]; state.inv.push(it); clampVitals(); },
  useItem(it) {
    if (it.kind === 'gear') { let slot = it.slot; if (slot === 'ring1' && state.equip.ring1 && !state.equip.ring2) slot = 'ring2'; const old = state.equip[slot]; state.equip[slot] = it; state.inv.splice(state.inv.indexOf(it), 1); if (old) state.inv.push(old); clampVitals(); checkAch(); }
    else if (it.kind === 'consumable') { const D = derived(); const e = it.effect; if (e.hp) state.hp = Math.min(D.maxHp, state.hp + e.hp); if (e.mana) state.mana = Math.min(D.maxMana, state.mana + e.mana); if (e.hunger) state.hunger = Math.min(100, state.hunger + e.hunger); if (e.thirst) state.thirst = Math.min(100, state.thirst + e.thirst); state.inv.splice(state.inv.indexOf(it), 1); ui.toast(`Used <b>${it.name}</b>`, '#5ad86a'); }
    else if (it.kind === 'book') { const s = SKILLS.find((q) => q.id === it.skill); state.inv.splice(state.inv.indexOf(it), 1); if (state.skills[s.id]) { if (state.skills[s.id].lvl < 15) state.skills[s.id].lvl++; ui.toast(`Duplicate book: <b>${s.name}</b> +1 level`, '#b46cff'); } else { state.skills[s.id] = { lvl: 1, ups: [] }; ui.banner(`NEW SKILL: ${s.name.toUpperCase()}`, '#b46cff'); ui.host(`You learned ${s.name}. From a book. In a dungeon. Truly the hero we deserve.`); } }
    else if (it.kind === 'box') { state.inv.splice(state.inv.indexOf(it), 1); const items = openBox(rng, it.box, Math.max(3, state.level)); items.forEach((x) => state.inv.push(x)); state.counters.boxes++; ui.revealBox(BOXES[it.box].name, BOXES[it.box].color, items, checkAch); const best = items.find((x) => x.rarity === 'legendary' || x.rarity === 'epic'); ui.host(best ? `Ooh, ${best.name}! The audience is jealous. I'm jealous.` : 'Unboxing! The purest form of content.'); }
  },
  scrap(it) { state.inv.splice(state.inv.indexOf(it), 1); state.scrap += 1 + ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(it.rarity); state.gold += Math.round(it.value / 4); ui.toast(`Scrapped ${it.name}`, '#9a9a9a', 1800); },
  scrapJunk() { const j = state.inv.filter((i) => i.kind === 'gear' && i.rarity === 'junk'); j.forEach((i) => G.scrap(i)); if (!j.length) ui.toast('No junk to scrap', '#9a9a9a', 1500); },
};
const ui = createUI(G);
function clampVitals() { const D = derived(); state.hp = Math.min(state.hp, D.maxHp); state.mana = Math.min(state.mana, D.maxMana); }

// ---------------- achievements ----------------
function achProgress(id) { const c = state.counters; return { firstSteps: `${Math.min(50, Math.floor(c.walked))}/50 m`, tourist: `${state.discovered.size}/3`, cartographer: `${state.discovered.size}/5`, pyro: `${c.burned}/10`, goblinBane: `${c.kills}/10`, warded: `${Math.floor(c.wardAbsorb)}/50`, fullKit: `${Object.keys(state.equip).length}/10`, hoarder: `${c.boxes}/5`, levelUp: `Lv ${state.level}/10` }[id] || ''; }
function award(id) {
  if (state.ach[id]) return; const a = ACHIEVEMENTS.find((q) => q.id === id); state.ach[id] = true;
  state.inv.push({ uid: 8000 + Math.floor(rng() * 1e6), kind: 'box', box: a.box, name: BOXES[a.box].name, rarity: a.box === 'gold' ? 'epic' : a.box === 'silver' ? 'rare' : 'uncommon', host: `Earned by: ${a.name}. Allegedly.` });
  ui.toast(`<div class="ta">ACHIEVEMENT</div><b>${a.name}</b><div class="sm">${a.desc}</div><div class="sm" style="color:${BOXES[a.box].color}">Reward: ${BOXES[a.box].name}</div>`, BOXES[a.box].color, 6000);
  ui.host({ firstSteps: 'You walked! Fifty whole metres! Somebody get this contestant a medal. Or a box. Here, a box.', tourist: 'Sightseeing during the apocalypse. Bold.', cartographer: 'You found everything. Well, everything we let you find.', firstBlood: 'First blood! The audience cheers. One of them faints.', pyro: 'Ten enemies on fire. You are what our insurance calls "a problem".', goblinBane: 'Ten goblins down. The cone industry is in shambles.', warded: 'Safety first. Boring, but first.', closeCall: 'So close! Ratings love a near-death experience.', fullKit: 'Fully dressed. Fashion is subjective. Yours is wrong.', hoarder: 'Five boxes opened. You are now legally a streamer.', levelUp: 'Level ten! Your mother would be proud. If she were here. She is not.', exit: 'You touched the Exit Sign. It does nothing. But you touched it.' }[id] || 'Achievement!');
}
function checkAch() {
  const c = state.counters;
  if (c.walked >= 50) award('firstSteps'); if (state.discovered.size >= 3) award('tourist'); if (state.discovered.size >= 5) award('cartographer');
  if (c.kills >= 1) award('firstBlood'); if (c.burned >= 10) award('pyro'); if (c.kills >= 10) award('goblinBane'); if (c.wardAbsorb >= 50) award('warded');
  if (Object.keys(state.equip).length >= 10) award('fullKit'); if (c.boxes >= 5) award('hoarder'); if (state.level >= 10) award('levelUp');
}
function gainXP(n) { state.xp += n; while (state.xp >= state.xpNext) { state.xp -= state.xpNext; state.level++; state.xpNext = xpFor(state.level); state.statPoints += 5; state.skillPoints += 1; for (const [k, v] of Object.entries(CLASS.auto)) state.base[k] += v; const D = derived(); state.hp = D.maxHp; state.mana = D.maxMana; ui.banner(`LEVEL ${state.level}!`); ui.toast(`<b>Level ${state.level}</b><div class="sm">+5 stat points · +1 skill point · +1 INT +1 CON</div>`, '#F5C518'); ui.host('Level up! You are now slightly less likely to die. Slightly.'); } checkAch(); }

// ---------------- player controller ----------------
const P = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, onGround: true, bob: 0 };
const keys = {}; let locked = false;
document.addEventListener('keydown', (e) => {
  keys[e.code] = true; if (e.repeat) return;
  const k = e.code;
  if (k === 'KeyI') ui.toggle('inv'); else if (k === 'KeyC') ui.toggle('char'); else if (k === 'KeyK') ui.toggle('skills'); else if (k === 'KeyM') ui.toggle('map'); else if (k === 'KeyJ') ui.toggle('ach');
  else if (k === 'Escape') ui.close(); else if (k === 'KeyO') { ink.state.outline = !ink.state.outline; ui.toast(`Ink outlines ${ink.state.outline ? 'on' : 'off'}`, '#9a9a9a', 1200); }
  else if (!ui.isOpen()) { if (k === 'Digit1') cast('firebolt'); if (k === 'Digit2' || k === 'KeyR') cast('fireball'); if (k === 'Digit3' || k === 'KeyQ') cast('flameward'); if (k === 'Digit4') cast('kindle'); if (k === 'KeyE') interact(); if (k === 'Space' && P.onGround) { P.vel.y = 5.2; P.onGround = false; } }
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
$('stage').addEventListener('click', () => { if (!ui.isOpen() && started) $('stage').requestPointerLock(); });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === $('stage'); $('clickHint').style.display = locked || ui.isOpen() || !started ? 'none' : 'flex'; });
document.addEventListener('mousemove', (e) => { if (!locked) return; P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.45, Math.min(1.45, P.pitch - e.movementY * 0.0022)); });
document.addEventListener('mousedown', (e) => { if (locked && e.button === 0) cast('firebolt'); if (locked && e.button === 2) cast('fireball'); });
document.addEventListener('contextmenu', (e) => { if (locked) e.preventDefault(); });

// ---------------- spells ----------------
const projectiles = [], blasts = [];
const boltLights = [0, 1, 2].map(() => { const l = new THREE.PointLight('#ff8a2a', 0, 8, 1.5); scene.add(l); return l; });
const handFlame = new THREE.Group(); camera.add(handFlame); handFlame.position.set(0.32, -0.3, -0.6);
{ const hm = new THREE.MeshPhysicalMaterial({ color: '#c8987a', roughness: 0.6, sheen: 0.4 }); const palm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), hm); palm.scale.set(1.2, 0.7, 1.3); handFlame.add(palm); const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.4, 14), new THREE.MeshPhysicalMaterial({ color: '#5a2a1a', roughness: 0.9, sheen: 0.5 })); sl.rotation.x = Math.PI / 2 - 0.3; sl.position.set(0.02, -0.06, 0.24); handFlame.add(sl); }
const palmFire = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffa030').multiplyScalar(2.5) })); palmFire.position.set(0, 0.07, -0.03); handFlame.add(palmFire); fx.push(palmFire);
const palmLight = new THREE.PointLight('#ff9a3a', 1.5, 3); handFlame.add(palmLight); palmLight.position.set(0, 0.1, -0.1);
const wardBubble = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })); camera.add(wardBubble); fx.push(wardBubble); wardBubble.visible = false;
let castAnim = 0;
function cast(id) {
  const s = SKILLS.find((q) => q.id === id); if (!state.skills[id]) return ui.toast(`${s.name} is locked · ${s.src}`, '#9a9a9a', 1600);
  if ((cds[id] || 0) > 0) return; if (state.mana < s.mana) return ui.toast('Not enough mana', '#4a9aff', 900);
  state.mana -= s.mana; cds[id] = s.cd * (1 - derived().castSpeed / 100); castAnim = 0.25;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const origin = camera.position.clone().add(new THREE.Vector3(0.25, -0.2, -0.5).applyQuaternion(camera.quaternion));
  if (id === 'firebolt') { const twin = state.skills.firebolt.ups[0] === 0; const n = twin ? 2 : 1; for (let i = 0; i < n; i++) { const d = dir.clone(); if (twin) d.applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - 0.5) * 0.06); spawnProjectile(origin, d, 'firebolt', twin ? 0.65 : 1); } }
  if (id === 'fireball') spawnProjectile(origin, dir, 'fireball', 1);
  if (id === 'flameward') { const L = effLevel('flameward'), D = derived(); state.wardMax = state.ward = 40 + L * 9 + D.spell * 0.4 * (state.skills.flameward.ups[0] === 1 ? 1.5 : 1); ui.toast('Flame Ward', '#ff8a2a', 900); }
  if (id === 'kindle') { const hit = rayHit(origin, dir, 12); burstAt(hit, '#ffb040', 30, 0.5); ui.toast('Kindle: something nearby is now on fire. Congratulations.', '#ffb040', 1500); }
}
function rayHit(o, d, max) { const p = o.clone(); for (let t = 0; t < max; t += 0.25) { p.addScaledVector(d, 0.25); const q = p.clone(); col.resolve(q, 0.05, p.y); if (q.distanceToSquared(p) > 1e-6 || p.y < 0.05 || p.y > world.ceiling - 0.1) return p; } return p; }
function spawnProjectile(o, d, kind, scale) {
  const big = kind === 'fireball';
  const core = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.28 : 0.13 * scale, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(big ? '#ff7a1a' : '#ffb040').multiplyScalar(3) }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.5 : 0.25 * scale, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.add(halo); core.position.copy(o); scene.add(core); fx.push(core, halo);
  projectiles.push({ m: core, v: d.clone().multiplyScalar(big ? 22 : 34), kind, life: 2.2, scale, trail: 0 });
}
const sparks = [];
function burstAt(p, color, n, spd, grav = 4) { const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true }); for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 5, 4), m); s.position.copy(p); scene.add(s); fx.push(s); sparks.push({ m: s, v: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(spd * (2 + Math.random() * 6)), life: 0.4 + Math.random() * 0.5, g: grav }); } }
function explode(p, radius, dmgFn) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffb040', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.copy(p); scene.add(s); fx.push(s);
  blasts.push({ m: s, r: radius, life: 0.4, t: 0 }); burstAt(p, '#ff8a2a', 50, 1.2); shake = Math.max(shake, 0.25);
  for (const m of mobs) if (!m.dead && m.g.position.distanceTo(p) < radius + 0.6) dmgFn(m);
}

// ---------------- mobs ----------------
const mobs = [];
function spawnMobs(list) {
  for (const s of list) {
    const g = makeGoblin({ variant: s.variant }); g.position.set(s.x, 0, s.z); g.rotation.y = Math.random() * 6; scene.add(g);
    const mats = []; g.traverse((o) => { if (o.isMesh && o.material && o.material.vertexColors) { o.material = o.material.clone(); mats.push(o.material); } });
    const lvl = 3 + (s.variant % 3), maxHp = 55 + lvl * 8;
    mobs.push({ g, mats, lvl, hp: maxHp, maxHp, home: new THREE.Vector3(s.x, 0, s.z), state: 'idle', atk: 0, burn: 0, burnDps: 0, flash: 0, dead: false, deadT: 0, wander: Math.random() * 10, name: 'Traffic-Cone Goblin', bar: makeBar() });
  }
}
function makeBar() { const el = document.createElement('div'); el.className = 'mbar'; el.innerHTML = '<div class="mn"></div><div class="mb"><i></i></div>'; $('hud').appendChild(el); return el; }
const dmgNums = [];
function dmgNumber(p, txt, cls = '') { const el = document.createElement('div'); el.className = 'dn ' + cls; el.textContent = txt; $('hud').appendChild(el); dmgNums.push({ el, p: p.clone(), t: 0 }); }
function hurtMob(m, dmg, burnSec = 0) {
  if (m.dead) return; const D = derived(); const crit = Math.random() * 100 < D.crit; const d = Math.round(dmg * (crit ? 1.8 : 1) * (0.9 + Math.random() * 0.2));
  m.hp -= d; m.flash = 0.12; m.state = 'chase'; dmgNumber(m.g.position.clone().add(new THREE.Vector3(0, 2.0, 0)), (crit ? 'CRIT ' : '') + d, crit ? 'crit' : '');
  if (burnSec > 0) { if (m.burn <= 0) state.counters.burned++; m.burn = Math.max(m.burn, burnSec); m.burnDps = Math.max(m.burnDps, 4 + effLevel('firebolt') * 0.8); }
  if (m.hp <= 0) killMob(m); checkAch();
}
const drops = [];
function killMob(m) {
  m.dead = true; m.hp = 0; m.bar.remove(); state.counters.kills++; gainXP(28 + m.lvl * 6); state.gold += 2 + Math.floor(Math.random() * 6);
  if (state.counters.kills === 1) ui.host('Your first kill on camera! Our legal team has been notified.');
  // loot pouch with 1-2 items
  const items = [makeItem(rng, { level: state.level - 1 })]; if (Math.random() < 0.5) items.push(makeItem(rng, { level: state.level - 1 })); if (Math.random() < 0.35) items.push({ ...CONSUMABLES[Math.floor(Math.random() * CONSUMABLES.length)], uid: Math.floor(Math.random() * 1e9), rarity: 'common' });
  const best = items.reduce((b, i) => (['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(i.rarity) > ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(b.rarity) ? i : b), items[0]);
  const colr = { junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' }[best.rarity];
  const pouch = new THREE.Group(); const bag = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshPhysicalMaterial({ color: '#7a5a3a', roughness: 0.8 })); bag.scale.y = 0.8; pouch.add(bag);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 3, 10, 1, true), new THREE.MeshBasicMaterial({ color: colr, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 1.5; pouch.add(beam); fx.push(beam);
  pouch.position.copy(m.g.position).setY(0.15); scene.add(pouch); drops.push({ g: pouch, items, colr });
}
function interact() {
  let best = null, bd = 2.2; for (const d of drops) { const dd = d.g.position.distanceTo(P.pos.clone().setY(0.15)); if (dd < bd) { bd = dd; best = d; } }
  if (!best) return; for (const it of best.items) { if (state.inv.length >= 48) { ui.toast('Inventory full! Scrap some junk (I).', '#E5484D'); break; } state.inv.push(it); ui.toast(`<span style="color:${{ junk: '#9a9a9a', common: '#f4eedc', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' }[it.rarity] || '#fff'}">${it.name}</span>`, '#3a3448', 2200); }
  scene.remove(best.g); drops.splice(drops.indexOf(best), 1);
}

// ---------------- map ----------------
const visited = new Set(); const VCELL = 12;
function drawMap(cv, big = false) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, S = world.size, m = world.map;
  const scale = big ? Math.min(W, H) / S : 2.2; const cx = big ? W / 2 : W / 2 - P.pos.x * scale, cz = big ? H / 2 : H / 2 - P.pos.z * scale;
  const X = (x) => (big ? cx + x * scale : cx + x * scale), Z = (z) => (big ? cz + z * scale : cz + z * scale);
  c.fillStyle = '#14101a'; c.fillRect(0, 0, W, H);
  if (!big) { c.save(); c.translate(W / 2, H / 2); c.rotate(-P.yaw + Math.PI); c.translate(-W / 2, -H / 2); }
  c.fillStyle = '#2a4a5a'; for (const [x, z, rx, rz] of m.water) { c.beginPath(); c.ellipse(X(x), Z(z), rx * scale, rz * scale, 0, 0, 7); c.fill(); }
  c.fillStyle = '#5a5060'; for (const [x, z] of m.pillars) c.fillRect(X(x) - 1, Z(z) - 1, 2.2, 2.2);
  c.fillStyle = '#6a4a4a'; for (const [x, z] of m.cars) c.fillRect(X(x) - 1.5, Z(z) - 3, 3, 6);
  for (const p of m.pois) { const known = state.discovered.has(p.name); c.strokeStyle = known ? (p.kind === 'hub' ? '#F5C518' : p.kind === 'camp' ? '#ff7a3a' : '#7BE38A') : '#4a4058'; c.lineWidth = 2; c.beginPath(); c.arc(X(p.x), Z(p.z), Math.max(5, p.r * scale * (big ? 1 : 0.4)), 0, 7); c.stroke(); if (big && known) { c.fillStyle = '#F4EEDC'; c.font = 'bold 14px Barlow Condensed'; c.textAlign = 'center'; c.fillText(p.name.toUpperCase(), X(p.x), Z(p.z) - p.r * scale - 6); } }
  c.fillStyle = '#E5484D'; for (const mb of mobs) if (!mb.dead && mb.g.position.distanceTo(P.pos) < (big ? 60 : 45)) c.fillRect(X(mb.g.position.x) - 2, Z(mb.g.position.z) - 2, 4, 4);
  for (const d of drops) { c.fillStyle = d.colr; c.fillRect(X(d.g.position.x) - 2, Z(d.g.position.z) - 2, 4, 4); }
  if (big) { c.fillStyle = 'rgba(13,11,18,0.9)'; const cs = VCELL * scale; for (let gx = -S / 2; gx < S / 2; gx += VCELL) for (let gz = -S / 2; gz < S / 2; gz += VCELL) if (!visited.has(`${Math.floor(gx / VCELL)},${Math.floor(gz / VCELL)}`)) c.fillRect(X(gx), Z(gz), cs + 0.5, cs + 0.5); }
  if (!big) c.restore();
  const px = big ? X(P.pos.x) : W / 2, pz = big ? Z(P.pos.z) : H / 2; c.save(); c.translate(px, pz); c.rotate(big ? -P.yaw + Math.PI : 0); c.fillStyle = '#3FD0E0'; c.strokeStyle = '#0D0B12'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke(); c.restore();
  if (big) { c.fillStyle = '#F5C518'; c.font = 'bold 22px Bangers'; c.textAlign = 'left'; c.fillText(world.name, 16, 32); c.fillStyle = '#d9d2bf'; c.font = '15px Barlow Condensed'; c.fillText(`${state.discovered.size}/${m.pois.length} places discovered · fog clears as you explore · this chunk is 360 m across (Floor 1 is 2 km)`, 16, 54); }
}

// ---------------- loop ----------------
let started = false, shake = 0, lastPOI = null, lowHpT = 0;
const v3 = new THREE.Vector3();
function project(p) { v3.copy(p).project(camera); return [(v3.x * 0.5 + 0.5) * window.innerWidth, (-v3.y * 0.5 + 0.5) * window.innerHeight, v3.z]; }
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
  const D = derived(); const paused = ui.isOpen();
  if (started && !paused) {
    // movement
    const fwd = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)), right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const wish = new THREE.Vector3(); if (keys.KeyW || keys.ArrowUp) wish.add(fwd); if (keys.KeyS || keys.ArrowDown) wish.sub(fwd); if (keys.KeyD || keys.ArrowRight) wish.add(right); if (keys.KeyA || keys.ArrowLeft) wish.sub(right);
    const sprint = (keys.ShiftLeft || keys.ShiftRight) && state.stamina > 1 && wish.lengthSq() > 0;
    const speed = (sprint ? 8.5 : 5.0) * (1 + D.moveSpeed / 100) * (state.hunger < 10 ? 0.8 : 1);
    if (wish.lengthSq()) wish.normalize().multiplyScalar(speed);
    P.vel.x += (wish.x - P.vel.x) * Math.min(1, dt * 12); P.vel.z += (wish.z - P.vel.z) * Math.min(1, dt * 12);
    P.vel.y -= 14 * dt;
    const before = P.pos.clone();
    P.pos.addScaledVector(P.vel, dt);
    if (P.pos.y <= 0) { P.pos.y = 0; P.vel.y = 0; P.onGround = true; }
    col.resolve(P.pos, 0.4, P.pos.y); const h = world.size / 2 - 1; P.pos.x = Math.max(-h, Math.min(h, P.pos.x)); P.pos.z = Math.max(-h, Math.min(h, P.pos.z));
    const moved = Math.hypot(P.pos.x - before.x, P.pos.z - before.z); state.counters.walked += moved; P.bob += moved * 2.2;
    state.stamina = Math.max(0, Math.min(D.maxStamina, state.stamina + (sprint ? -22 : 14) * dt));
    // vitals
    state.mana = Math.min(D.maxMana, state.mana + D.manaRegen * dt);
    state.hunger = Math.max(0, state.hunger - dt * 0.08); state.thirst = Math.max(0, state.thirst - dt * 0.11);
    if (state.thirst <= 0 || state.hunger <= 0) state.hp -= dt * 1.5;
    for (const k in cds) cds[k] = Math.max(0, cds[k] - dt);
    if (state.hp < D.maxHp * 0.15 && state.hp > 0) { lowHpT += dt; if (lowHpT > 1) award('closeCall'); }
    if (state.hp <= 0) { state.hp = D.maxHp * 0.5; P.pos.set(...world.spawn); ui.banner('YOU DIED', '#E5484D'); ui.host('You died! Don’t worry, our revival sponsor has you covered. This time.'); mobs.forEach((m) => { if (!m.dead) { m.state = 'idle'; m.g.position.copy(m.home); } }); }
    // discovery + fog
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) visited.add(`${Math.floor(P.pos.x / VCELL) + dx},${Math.floor(P.pos.z / VCELL) + dz}`);
    let inPOI = null; for (const p of world.map.pois) if (Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < p.r) { inPOI = p; if (!state.discovered.has(p.name)) { state.discovered.add(p.name); ui.banner(`DISCOVERED: ${p.name.toUpperCase()}`, '#7BE38A'); gainXP(40); if (p.name === 'The Exit Sign') award('exit'); } }
    if (inPOI !== lastPOI) { lastPOI = inPOI; $('loc').textContent = inPOI ? inPOI.name.toUpperCase() : world.name; $('safe').style.display = inPOI && inPOI.safe ? 'inline-block' : 'none'; }
    checkAch();
  }
  // camera
  const bob = P.onGround ? Math.sin(P.bob) * 0.035 : 0;
  camera.position.set(P.pos.x, P.pos.y + 1.7 + bob, P.pos.z);
  camera.rotation.set(0, 0, 0, 'YXZ'); camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
  if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.3; camera.position.y += (Math.random() - 0.5) * shake * 0.3; shake = Math.max(0, shake - dt * 1.5); }
  camera.updateMatrixWorld();
  // hand + ward
  castAnim = Math.max(0, castAnim - dt); handFlame.position.set(0.32, -0.3 - (P.onGround ? Math.abs(Math.sin(P.bob)) * 0.015 : 0) + castAnim * 0.3, -0.6 - castAnim * 0.6); palmFire.scale.setScalar(1 + Math.sin(t * 20) * 0.15 + castAnim * 3);
  wardBubble.visible = state.ward > 0; wardBubble.material.opacity = 0.08 + Math.sin(t * 6) * 0.03;
  if (!paused) {
    // projectiles
    let li = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i]; pr.life -= dt; pr.m.position.addScaledVector(pr.v, dt); if (pr.kind === 'fireball') pr.v.y -= 2 * dt;
      if (li < 3) { boltLights[li].position.copy(pr.m.position); boltLights[li].intensity = pr.kind === 'fireball' ? 14 : 6; li++; }
      pr.trail += dt; if (pr.trail > 0.03) { pr.trail = 0; burstAt(pr.m.position, '#ff8a2a', 1, 0.15, -1); }
      let hit = null; for (const m of mobs) if (!m.dead && m.g.position.clone().setY(1.1).distanceTo(pr.m.position) < 0.75) { hit = m; break; }
      const q = pr.m.position.clone(); col.resolve(q, 0.05, pr.m.position.y); const wall = q.distanceToSquared(pr.m.position) > 1e-6 || pr.m.position.y < 0.05 || pr.m.position.y > world.ceiling - 0.1;
      if (hit || wall || pr.life <= 0) {
        if (pr.kind === 'fireball') explode(pr.m.position, 3.2 + (state.skills.fireball.ups[0] === 0 ? 1.2 : 0), (m) => hurtMob(m, spellDamage('fireball'), 3));
        else { if (hit) hurtMob(hit, spellDamage('firebolt') * pr.scale, state.skills.firebolt.ups[0] === 1 ? 4 : 2); burstAt(pr.m.position, '#ffb040', 14, 0.6); }
        scene.remove(pr.m); projectiles.splice(i, 1);
      }
    }
    for (; li < 3; li++) boltLights[li].intensity = 0;
    for (let i = blasts.length - 1; i >= 0; i--) { const b = blasts[i]; b.t += dt; b.m.scale.setScalar(0.3 + (b.t / b.life) * b.r); b.m.material.opacity = 0.8 * (1 - b.t / b.life); if (b.t >= b.life) { scene.remove(b.m); blasts.splice(i, 1); } }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.v.y -= s.g * dt; s.m.position.addScaledVector(s.v, dt); if (s.life <= 0) { scene.remove(s.m); sparks.splice(i, 1); } }
    // mobs
    for (const m of mobs) {
      const g = m.g;
      if (m.dead) { m.deadT += dt; g.rotation.x = Math.max(-1.5, -m.deadT * 4); if (m.deadT > 6) { g.visible = false; } continue; }
      const toP = P.pos.clone().sub(g.position).setY(0), dist = toP.length();
      if (m.state === 'idle' && dist < 16) { m.state = 'chase'; if (Math.random() < 0.5) ui.host('A goblin noticed you. It has a cone. You have a lighter. Fight!'); }
      if (m.state === 'chase' && dist > 40) m.state = 'return';
      let move = new THREE.Vector3();
      if (m.state === 'chase') { if (dist > 1.5) move = toP.clone().normalize().multiplyScalar(3.4); m.atk -= dt; if (dist < 1.9 && m.atk <= 0) { m.atk = 1.3; let dmg = 6 + m.lvl * 1.5; dmg *= 1 - Math.min(0.6, D.armor / 200); if (state.ward > 0) { const a = Math.min(state.ward, dmg); state.ward -= a; dmg -= a; state.counters.wardAbsorb += a; } state.hp -= dmg; shake = Math.max(shake, 0.15); if (dmg > 0) { dmgNumber(P.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).add(fwdVec().multiplyScalar(0.8)), '-' + Math.round(dmg), 'hurt'); $('vign').style.opacity = 0.7; } } }
      else if (m.state === 'return') { const back = m.home.clone().sub(g.position).setY(0); if (back.length() > 0.5) move = back.normalize().multiplyScalar(2.5); else m.state = 'idle'; }
      else { m.wander += dt; g.rotation.y += Math.sin(m.wander * 0.7) * dt * 0.5; }
      g.position.addScaledVector(move, dt); col.resolve(g.position, 0.4, 0);
      if (move.lengthSq() > 0.01) g.rotation.y = Math.atan2(move.x, move.z); else if (m.state === 'chase') g.rotation.y = Math.atan2(toP.x, toP.z);
      g.position.y = move.lengthSq() > 0.01 ? Math.abs(Math.sin(t * 9 + m.wander)) * 0.08 : 0;
      if (m.burn > 0) { m.burn -= dt; m.hp -= m.burnDps * dt; if (Math.random() < dt * 14) burstAt(g.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 1 + Math.random(), (Math.random() - 0.5) * 0.4)), '#ff8a2a', 1, 0.2, -2); if (m.hp <= 0) killMob(m); }
      m.flash = Math.max(0, m.flash - dt); const f = m.flash / 0.12, b = m.burn > 0 ? 0.25 : 0; m.mats.forEach((mt) => mt.emissive.setRGB(0.8 * f + b, 0.1 * f + b * 0.35, 0.05 * f));
      // nameplate
      const [sx, sy, sz] = project(g.position.clone().setY(2.3)); const show = sz < 1 && dist < 28 && (m.state === 'chase' || m.hp < m.maxHp);
      m.bar.style.display = show ? 'block' : 'none'; if (show) { m.bar.style.transform = `translate(${sx - 50}px, ${sy - 20}px)`; m.bar.querySelector('.mn').textContent = `${m.name} · Lv ${m.lvl}${m.burn > 0 ? ' · BURNING' : ''}`; m.bar.querySelector('i').style.width = (m.hp / m.maxHp) * 100 + '%'; }
    }
    // drop bobbing + prompt
    let near = false; for (const d of drops) { d.g.children[0].position.y = Math.sin(t * 3) * 0.05; if (d.g.position.distanceTo(P.pos.clone().setY(0.15)) < 2.2) near = true; }
    $('prompt').style.display = near ? 'block' : 'none';
    if (state.ward <= 0) state.ward = 0;
    world.tick(t);
  }
  // floating numbers
  for (let i = dmgNums.length - 1; i >= 0; i--) { const d = dmgNums[i]; d.t += dt; const [x, y, z] = project(d.p.clone().add(new THREE.Vector3(0, d.t * 1.2, 0))); d.el.style.transform = `translate(${x - 30}px, ${y}px)`; d.el.style.opacity = z < 1 ? Math.max(0, 1 - d.t / 0.9) : 0; if (d.t > 0.9) { d.el.remove(); dmgNums.splice(i, 1); } }
  $('vign').style.opacity = Math.max(0, parseFloat($('vign').style.opacity || 0) - dt * 2);
  $('compass').style.backgroundPositionX = `${(P.yaw / (Math.PI * 2)) * 720}px`;
  ui.hud(D); if (started) drawMap($('mini'));
  ink.render();
  requestAnimationFrame(frame);
}
const fwdVec = () => new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));

// ---------------- boot ----------------
async function boot() {
  const setP = (p, msg) => { $('loadBar').style.width = Math.round(p * 100) + '%'; if (msg) $('loadMsg').textContent = msg; };
  await new Promise((r) => setTimeout(r, 50));
  const mod = FLOOR === '2' ? await import('../worlds/floor2.js') : await import('../worlds/floor1.js');
  const def = FLOOR === '2' ? mod.FLOOR2 : mod.FLOOR1;
  setP(0.02, 'Sculpting the floor…');
  const built = (FLOOR === '2' ? mod.buildFloor2 : mod.buildFloor1)(ink, col, (p) => setP(p * 0.8));
  world = { ...built, name: def.name, spawn: def.spawn };
  setP(0.85, 'Waking up the goblins…'); await new Promise((r) => setTimeout(r, 30));
  spawnMobs(built.mobs);
  P.pos.set(def.spawn[0], 0, def.spawn[2]); P.yaw = def.spawnYaw;
  $('loc').textContent = world.name; setP(1, 'Ready.');
  $('startBtn').disabled = false; $('startBtn').textContent = 'CLICK TO ENTER';
  requestAnimationFrame(frame);
}
$('startBtn').addEventListener('click', () => { $('loading').style.display = 'none'; started = true; $('stage').requestPointerLock(); ui.host('Welcome back to the Undercroft, Dale! Try not to die before the commercial break.'); });
boot().catch((e) => { $('loadMsg').textContent = 'Error: ' + e.message; console.error(e); });
window.__game = { state, P, mobs, cast, ui, G };
