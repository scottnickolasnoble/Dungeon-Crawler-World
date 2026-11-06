// Town life: NPCs walk routines between waypoints, stop to work, chat in pairs, sweep, sit, and turn to
// look at you. Filler NPCs bark one-liners; quest NPCs and merchants open dialogue (handled by story.js).
import * as THREE from '../node_modules/three/build/three.module.js';
import { poolNPC } from '../npcs/races.js';
import { rigCharacter, bipedParams, stepRig } from './anim.js';
import { martaVance, pickles, spinCycle, oldReggie } from '../npcs/floor1to3.js';
import { wickley, brotherAsh } from '../npcs/floor1to3.js';
import { madamePrickle, sunnySponsorRep, bigDeb, neighbourhoodWatch, gusset, elderLantern } from '../npcs/floor4to6.js';

const NAMED = { marta: martaVance, pickles, spin: spinCycle, reggie: oldReggie, wickley, ash: brotherAsh, sunny: sunnySponsorRep, prickle: madamePrickle, deb: bigDeb, watch: neighbourhoodWatch, gusset, lantern: elderLantern };
// first names + jobs for filler NPCs, so the towns feel lived in
const FIRST = ['Dot', 'Lenny', 'Moss', 'Gertie', 'Sal', 'Pip', 'Ruthie', 'Big Al', 'Tomasz', 'Nell', 'Ozzie', 'Fern', 'Hank', 'Juno', 'Wren', 'Marlow', 'Bea', 'Crispin', 'Ida', 'Rocco'];
export const FILLER_LINES = {
  guard: ['Keep your weapons sheathed in camp.', 'Saw a goblin wearing three cones yesterday. Promoted, I guess.', 'Quiet night. I hate quiet nights.', 'Sergeant Pylon charges a toll on the east road. In cones.', 'Stay inside the lights after dark.'],
  cook: ['Soup’s on. Don’t ask what kind.', 'Fresh rat kebabs! Well. Recent.', 'If it glows, cook it longer.', 'You look hungry. Everyone looks hungry.'],
  trader: ['Buying scrap, selling slightly better scrap.', 'Prices go up when the Host is watching.', 'No refunds. No returns. No questions.'],
  gossip: ['Did you hear? Marta says nobody ever reaches the bottom.', 'Pickles has been buying cones. Why does he want cones?', 'They say the stairwell door only opens if Pylon falls.', 'My cousin went down to Floor 2. Came back damp.', 'The Host winked at me. I think. Hard to tell with a hologram.'],
  healer: ['Hold still. This’ll sting. Everything stings.', 'Drink water. Then drink more water.', 'Bandages are two copper. Sympathy is free.'],
  quest: ['Got a minute? No? Later then.'],
  kid: ['Are you a contestant? Can I have your boots when you die?', 'I’m gonna be on telly one day!', 'Race you to the fire!'],
  worker: ['These tents won’t patch themselves.', 'Pass me that hammer. No, the other hammer.', 'Union break in five.'],
};

export function createNPCSystem(ctx) {
  const { scene, col } = ctx; const npcs = []; const tmpl = {};
  function model(spec) {
    if (spec.named && NAMED[spec.named]) return NAMED[spec.named]();
    const role = { kid: 'trader', worker: 'trader', healer: 'gossip', cook: 'gossip' }[spec.role] || spec.role; const key = `${spec.race}|${role}`; if (!tmpl[key]) tmpl[key] = poolNPC({ role, race: spec.race, variant: 0 });
    const g = tmpl[key].clone(); if (spec.role === 'kid') g.scale.setScalar(0.62); else g.scale.setScalar(0.94 + (spec.variant % 4) * 0.04);
    // a hat or prop per instance so clones don't look identical
    const hats = [null, ['#a8281e', 0.16, 0.12], ['#2a4a8a', 0.15, 0.06], ['#e8c020', 0.18, 0.1], ['#3a6a3a', 0.14, 0.14], null];
    const h = hats[spec.variant % hats.length]; if (h) { const head = new THREE.Box3().setFromObject(g); const cap = new THREE.Mesh(new THREE.CylinderGeometry(h[1], h[1] * 1.05, h[2], 16), new THREE.MeshStandardMaterial({ color: h[0], roughness: 0.8 })); cap.position.set(0, head.max.y / g.scale.y - 0.02, 0); g.add(cap); }
    return g;
  }
  function spawn(spec) {
    let [x, z] = ctx.nav ? ctx.nav.nearestFree(spec.x, spec.z) : [spec.x, spec.z];
    const root = new THREE.Group(); const body = model(spec); root.add(body); root.position.set(x, 0, z); root.rotation.y = spec.yaw ?? Math.random() * 6; scene.add(root);
    const sc0 = body.scale.x; body.scale.setScalar(1); const rig = rigCharacter(body, bipedParams(body), [], ctx.rigged); body.scale.setScalar(sc0);
    const name = spec.name || `${FIRST[(spec.variant * 7 + (spec.seed || 0)) % FIRST.length]}`;
    const n = { ...spec, name, g: root, body, rig, stride: rig.uHip.value * 1.7, baseScale: body.scale.x, home: new THREE.Vector3(x, 0, z), wp: 0, wait: Math.random() * 3, act: spec.activity || 'idle', t: Math.random() * 10, talkT: 3 + Math.random() * 6, lookAt: 0, route: buildRoute(spec, x, z) };
    npcs.push(n); return n;
  }
  // filler routes: a loop of 3-4 free points inside the town that can see each other
  function buildRoute(spec, x, z) {
    if (spec.route) return spec.route.map(([a, b, w, act]) => { const [fx, fz] = ctx.nav ? ctx.nav.nearestFree(a, b) : [a, b]; return { p: new THREE.Vector3(fx, 0, fz), w: w ?? 3, act: act || 'idle' }; });
    if (spec.kind !== 'filler' || spec.static) return null;
    const pts = [{ p: new THREE.Vector3(x, 0, z), w: 4 + Math.random() * 4, act: spec.activity || 'idle' }]; const c = spec.town; let tries = 0;
    while (pts.length < 4 && tries++ < 80) { const a = Math.random() * 6.28, r = c.r0 + Math.random() * (c.r - c.r0); const px = c.x + Math.cos(a) * r, pz = c.z + Math.sin(a) * r; const prev = pts[pts.length - 1].p;
      if (ctx.nav && (!ctx.nav.free(px, pz) || !ctx.nav.los(prev.x, prev.z, px, pz))) continue; pts.push({ p: new THREE.Vector3(px, 0, pz), w: 2 + Math.random() * 5, act: ['idle', 'work', 'look', 'sweep'][Math.floor(Math.random() * 4)] }); }
    return pts.length > 1 ? pts : null;
  }

  function update(dt, t, P, speakLine) {
    for (const n of npcs) {
      n.t += dt; const g = n.g, b = n.body; const toP = P.pos.clone().sub(g.position).setY(0), dp = toP.length();
      g.visible = dp < (globalThis.__VIEW || 70); if (dp > 90 && !n.route) continue;
      let moving = false; const p0x = g.position.x, p0z = g.position.z;
      const engaged = (n.kind !== 'filler' && dp < 4.5) || n.talking > 0; n.talking = Math.max(0, (n.talking || 0) - dt);
      if (n.route && !engaged) {
        const W = n.route[n.wp];
        if (n.wait > 0) { n.wait -= dt; n.act = W.act; } else {
          const nxt = n.route[(n.wp + 1) % n.route.length]; const v = nxt.p.clone().sub(g.position).setY(0); const d = v.length();
          if (d < 0.35) { n.wp = (n.wp + 1) % n.route.length; n.wait = nxt.w; }
          else { v.normalize(); const spd = n.role === 'kid' ? 2.6 : 1.25; g.position.addScaledVector(v, Math.min(d, spd * dt)); col.resolve(g.position, 0.32, 0); moving = true; turn(n, Math.atan2(v.x, v.z), 6, dt); n.act = 'walk'; }
        }
      }
      if (engaged || (dp < 3 && !moving)) { turn(n, Math.atan2(toP.x, toP.z), 4, dt); if (n.kind !== 'filler') n.act = engaged ? 'listen' : n.act; }
      // animation by activity
      const s = n.baseScale; let lean = 0, hop = 0, sway = 0, yaw2 = 0;
      const amt = stepRig(n.rig, Math.hypot(g.position.x - p0x, g.position.z - p0z) / s, dt, t, n.stride);
      if (moving) { hop = Math.abs(Math.cos(n.rig.uPhase.value)) * 0.02 * amt * 2; sway = Math.sin(n.rig.uPhase.value) * 0.025 * amt; lean = 0.04 * amt; }
      else if (n.act === 'work') { lean = Math.max(0, Math.sin(n.t * 5)) * 0.28; hop = Math.max(0, -Math.sin(n.t * 5)) * 0.02; }
      else if (n.act === 'sweep') { sway = Math.sin(n.t * 3) * 0.12; yaw2 = Math.sin(n.t * 3) * 0.3; lean = 0.15; }
      else if (n.act === 'talk' || n.act === 'listen') { lean = Math.sin(n.t * 2.2) * 0.04; yaw2 = Math.sin(n.t * 1.3) * 0.12; hop = Math.abs(Math.sin(n.t * (n.talking > 0 ? 9 : 1.5))) * (n.talking > 0 ? 0.03 : 0.01); }
      else if (n.act === 'look') { yaw2 = Math.sin(n.t * 0.7) * 0.6; }
      else if (n.act === 'sit') { hop = -0.25; lean = -0.1; }
      else { lean = Math.sin(n.t * 1.1) * 0.02; hop = Math.sin(n.t * 2) * 0.004; }
      b.rotation.set(lean, yaw2, sway); b.position.y = hop * s;
      // ambient chatter between talking pairs, and one-liners when you're close
      n.talkT -= dt;
      if (n.kind === 'filler' && n.talkT <= 0 && dp < 16) { n.talkT = 7 + Math.random() * 10; if (Math.random() < 0.55) { const lines = FILLER_LINES[n.role] || FILLER_LINES.gossip; speakLine(n, lines[Math.floor(Math.random() * lines.length)], dp < 7 ? 1 : 0.4); } }
    }
  }
  function turn(n, want, rate, dt) { let d = want - n.g.rotation.y; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; n.g.rotation.y += Math.max(-rate * dt, Math.min(rate * dt, d)); }
  function nearest(P, max = 2.6) { let best = null, bd = max; for (const n of npcs) { const d = n.g.position.distanceTo(P.pos.clone().setY(0)); if (d < bd) { bd = d; best = n; } } return best; }
  function pushPlayer(P) { for (const n of npcs) { const dx = P.pos.x - n.g.position.x, dz = P.pos.z - n.g.position.z, d = Math.hypot(dx, dz), m = 0.62 * n.baseScale + 0.1; if (d < m && d > 1e-3) { P.pos.x = n.g.position.x + (dx / d) * m; P.pos.z = n.g.position.z + (dz / d) * m; } } }
  return { npcs, spawn, update, nearest, pushPlayer, byId: (id) => npcs.find((n) => n.id === id) };
}

// helper for worlds: a town's worth of filler NPCs
export function townFillers({ x, z, r, r0 = 6, count = 10, races, seed = 1 }) {
  const roles = ['guard', 'cook', 'gossip', 'gossip', 'worker', 'kid', 'trader', 'healer', 'guard', 'worker', 'gossip', 'kid'];
  const out = [];
  // only two races per town are sculpted (four body templates at most); variety comes from hats, scale and props
  const two = races.slice(0, 2);
  for (let i = 0; i < count; i++) { const a = (i / count) * 6.28 + seed, rr = r0 + ((i * 37) % 10) / 10 * (r - r0); out.push({ kind: 'filler', role: roles[(i + seed) % roles.length], race: two[i % two.length], variant: i + seed, seed, x: x + Math.cos(a) * rr, z: z + Math.sin(a) * rr, town: { x, z, r, r0 } }); }
  // a chatting pair that stays put
  out.push({ kind: 'filler', role: 'gossip', race: two[0], variant: 21 + seed, x: x + r0 + 1, z: z - 1.5, yaw: -1.2, static: true, activity: 'talk', town: { x, z, r, r0 } }, { kind: 'filler', role: 'gossip', race: two[1 % two.length], variant: 22 + seed, x: x + r0 + 2.4, z: z - 0.6, yaw: 1.9, static: true, activity: 'talk', town: { x, z, r, r0 } });
  return out;
}
