// Headless check of mob AI: nav grid, chase around obstacles, telegraphed attacks, parry, boss abilities.
const { chromium } = require('playwright');
(async () => {
  const [,, out = 'renders/mobs'] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.setDefaultTimeout(240000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); if (m.text().startsWith('T:')) console.log(m.text()); });
  const t0 = Date.now();
  await p.goto('http://localhost:8765/play.html?floor=1&newgame&nointro', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 600000 });
  console.log('load:', await p.evaluate(() => document.getElementById('loadMsg').textContent), ((Date.now() - t0) / 1000).toFixed(0) + 's');
  console.log('mobs:', await p.evaluate(() => { const g = window.__game; const c = {}; g.mobs.forEach((m) => { c[m.kind] = (c[m.kind] || 0) + 1; }); return JSON.stringify(c) + ' lv ' + g.mobs.map((m) => m.lvl).join(','); }));
  await p.click('#startBtn'); await p.waitForTimeout(800);
  // put the player behind a car relative to a nearby goblin and see if it paths around
  const r = await p.evaluate(() => { const g = window.__game; const m = g.mobs.filter((m) => m.kind === 'goblin' && !m.camp).sort((a, b) => a.g.position.length() - b.g.position.length())[0]; g.P.pos.set(m.g.position.x + 8, 0, m.g.position.z + 3); g.state.hp = 9999; return [m.lvl, m.g.position.x.toFixed(1), m.g.position.z.toFixed(1)]; });
  console.log('target goblin', r);
  let sawAttack = false, sawTele = false;
  for (let i = 0; i < 16; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => { const g = window.__game; const near = g.mobs.filter((m) => !m.dead && m.g.position.distanceTo(g.P.pos) < 14); const m = near[0]; if (m) { const dx = m.g.position.x - g.P.pos.x, dz = m.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.2; } return near.map((m) => `${m.state}${m.act ? ':' + m.act.type + ':' + m.act.t.toFixed(2) : ''}@${m.g.position.distanceTo(g.P.pos).toFixed(1)}`).join(' ') + ' hp=' + Math.round(g.state.hp); });
    if (s.includes('attack')) { sawAttack = true; if (!sawTele) { sawTele = true; await p.screenshot({ path: `${out}/telegraph.png` }); } } if (i % 3 === 0) console.log(i, s); }
  // parry test: hold F through an attack
  const parr = await p.evaluate(async () => { const g = window.__game; const m = g.mobs.find((m) => !m.dead && m.g.position.distanceTo(g.P.pos) < 6); if (!m) return 'no mob'; for (let k = 0; k < 60; k++) { await new Promise((r) => setTimeout(r, 100)); if (m.act && m.act.type === 'melee' && m.act.t > m.act.windup - 0.25) { g.DEF.parryT = performance.now() / 1000; await new Promise((r) => setTimeout(r, 400)); return 'parries=' + g.state.counters.parries + ' state=' + m.state; } } return 'no swing seen'; });
  console.log('parry:', parr);
  // boss: go to Pylon Point
  await p.evaluate(() => { const g = window.__game; g.mobs.forEach((m) => { if (!m.camp && !m.dead) { m.state = 'idle'; m.g.position.copy(m.home); } }); const b = g.mobs.find((m) => m.kind === 'pylon'); g.mobs.filter((m) => m.camp === 'pylon' && m !== b).forEach((m) => { m.hp = 0; m.dead = true; m.g.visible = false; if (m.bar) { m.bar.remove(); m.bar = null; } }); g.P.pos.set(b.g.position.x - 12, 0, b.g.position.z); g.state.level = 10; });
  const seen = new Set();
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => { const g = window.__game; const b = g.mobs.find((m) => m.kind === 'pylon'); const dx = b.g.position.x - g.P.pos.x, dz = b.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.15; return `${b.state}${b.act ? ':' + b.act.type : ''} d=${Math.hypot(dx, dz).toFixed(1)} moved=${b.g.position.distanceTo(b.home).toFixed(1)} hp=${Math.round(g.state.hp)} mobs=${g.mobs.filter((m) => !m.dead).length}`; });
    const a = (s.match(/attack:(\w+)/) || [])[1]; if (a && !seen.has(a)) { seen.add(a); await p.screenshot({ path: `${out}/boss_${a}.png` }); } if (i % 5 === 0) console.log('boss', i, s); }
  console.log('boss abilities seen:', [...seen].join(','));
  await p.screenshot({ path: `${out}/boss_end.png` });
  await p.keyboard.press('KeyM'); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/map.png` });
  console.log('errors:', errs.slice(0, 8).join(' | ') || 'none'); await b.close();
})();
