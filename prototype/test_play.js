// Headless smoke test of the walkable game: loads, starts, moves, casts, opens panels, screenshots.
// Usage: node test_play.js <floor> <outDir>   (needs a static server on :8765)
const { chromium } = require('playwright');
(async () => {
  const [,, floor = '1', out = '.'] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.setDefaultTimeout(240000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://localhost:8765/play.html?floor=${floor}`, { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 600000 });
  console.log('load:', await p.evaluate(() => document.getElementById('loadMsg').textContent));
  await p.click('#startBtn');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/f${floor}_start.png` });
  // walk toward a group of mobs and cast
  await p.evaluate(() => { const g = window.__game; const m = g.mobs[0]; const dx = m.g.position.x - g.P.pos.x, dz = m.g.position.z - g.P.pos.z, d = Math.hypot(dx, dz); g.P.pos.set(m.g.position.x - (dx / d) * 14, 0, m.g.position.z - (dz / d) * 14); g.P.yaw = Math.atan2(-dx, -dz); });
  await p.keyboard.down('KeyW'); await p.waitForTimeout(900); await p.keyboard.up('KeyW');
  for (let i = 0; i < 8; i++) { await p.evaluate(() => { const g = window.__game; const live = g.mobs.filter((m) => !m.dead); if (live[0]) { const dx = live[0].g.position.x - g.P.pos.x, dz = live[0].g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.05; } g.cast('firebolt'); }); await p.waitForTimeout(500); }
  await p.evaluate(() => window.__game.cast('flameward'));
  await p.evaluate(() => window.__game.cast('fireball')); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/f${floor}_combat.png` });
  const st = await p.evaluate(() => { const g = window.__game; return { kills: g.state.counters.kills, burned: g.state.counters.burned, hp: Math.round(g.state.hp), ach: Object.keys(g.state.ach), inv: g.state.inv.length, mobs: g.mobs.length }; });
  console.log('state:', JSON.stringify(st));
  for (const [k, n] of [['KeyI', 'inv'], ['KeyC', 'char'], ['KeyK', 'skills'], ['KeyM', 'map'], ['KeyJ', 'ach']]) { await p.keyboard.press(k); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/f${floor}_${n}.png` }); await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
  await p.keyboard.press('KeyI'); await p.waitForTimeout(300); await p.click('#invTabs button[data-tab="boxes"]'); await p.waitForTimeout(200);
  const cells = await p.$$('#grid .cell'); if (cells[0]) { await cells[0].click(); await p.waitForTimeout(2200); await p.screenshot({ path: `${out}/f${floor}_box.png` }); }
  console.log('errors:', errs.slice(0, 8).join(' | ') || 'none');
  await b.close();
})();
