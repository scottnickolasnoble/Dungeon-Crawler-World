// Quick load check: prints page errors as they happen and the loading message every 10 s.
const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2] || 'floor=0&newgame&fast&nointro';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 480, height: 270 } });
  p.on('pageerror', (e) => console.log('PAGEERR', e.message, (e.stack || '').split('\n').slice(0, 3).join(' / ')));
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 300)); });
  await p.addInitScript(() => { try { localStorage.setItem('downstairs_gfx', JSON.stringify({ preset: 'low', scale: 0.5, outline: false, view: 55, sdf: 2.2, npc: 2.4, suggested: true })); } catch (e) {} });
  await p.goto('http://localhost:8765/play.html?' + q, { timeout: 120000 });
  for (let i = 0; i < +(process.argv[3] || 30); i++) { await p.waitForTimeout(10000); const m = await p.evaluate(() => document.getElementById('loadMsg').textContent + ' | btn ' + document.getElementById('startBtn').disabled); console.log(i * 10 + 10, 's', m); if (/Ready|Error/.test(m)) break; }
  await b.close();
})();
