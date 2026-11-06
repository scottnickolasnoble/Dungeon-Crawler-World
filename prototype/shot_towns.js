// Smoke-tests the single-file bundle and grabs shots of the Floor 1 hub, a camp and the class panel.
// Usage: node shot_towns.js [url]
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://localhost:8765/publish/downstairs.html';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(600000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { try { localStorage.setItem('downstairs_gfx', JSON.stringify({ preset: 'low', scale: 0.6, outline: true, view: 70, sdf: 2.2, npc: 2.4, suggested: true })); } catch (e) {} });
  await p.goto(url + '?floor=1&newgame&fast&nointro#floor-1');
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || /^Error/.test(document.getElementById('loadMsg').textContent));
  await p.click('#startBtn'); await p.waitForTimeout(1500); await p.evaluate(() => { window.__freeze = true; });
  const view = async (name, fn) => { await p.evaluate(fn); await p.waitForTimeout(1800); await p.screenshot({ path: `shots/${name}.png` }); };
  await view('town_hub', () => { const g = window.__game, r = g.world().hub.rect; g.P.pos.set((r[0] + r[2]) / 2, 0, r[3] + 18); g.P.yaw = 0; g.P.pitch = -0.12; });
  await view('town_inside', () => { const g = window.__game, r = g.world().hub.rect; g.P.pos.set((r[0] + r[2]) / 2 - 6, 0, (r[1] + r[3]) / 2 + 8); g.P.yaw = 0.3; g.P.pitch = -0.05; });
  await view('camp', () => { const g = window.__game, c = g.world().map.pois.find((q) => q.kind === 'camp'); g.P.pos.set(c.x, 0, c.z + (c.r || 20) + 14); g.P.yaw = 0; g.P.pitch = -0.1; window.__freeze = true; });
  await p.evaluate(() => window.__game.ui.toggle('class')); await p.waitForTimeout(600); await p.screenshot({ path: 'shots/class_panel.png' });
  console.log('errors:', errs.join(' | ') || 'none'); await b.close();
})();
