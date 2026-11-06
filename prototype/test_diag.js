// Diagnostic: load a floor, stream console errors live, report memory and draw stats every few seconds.
const { chromium } = require('playwright');
(async () => {
  const [,, q = 'floor=1&newgame&fast', secs = '40'] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--max-old-space-size=4096'] });
  const p = await b.newPage({ viewport: { width: 640, height: 360 } }); p.setDefaultTimeout(300000);
  p.on('pageerror', (e) => console.log('PAGEERR', e.message)); p.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || /WebGL|shader|ERROR/i.test(t)) console.log('CONSOLE', m.type(), t.slice(0, 300)); });
  p.on('crash', () => console.log('CRASHED'));
  await p.goto('http://localhost:8765/play.html?' + q, { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 900000 });
  console.log('loaded', await p.evaluate(() => document.getElementById('loadMsg').textContent));
  for (let i = 0; i < +secs / 5; i++) { await p.waitForTimeout(5000); try { console.log(await p.evaluate(() => { const g = window.__game; const r = g.ink ? g.ink.renderer.info : null; return `t${performance.now() | 0} heap ${(performance.memory ? performance.memory.usedJSHeapSize / 1e6 : 0) | 0}MB mobs ${g.mobs.length}` + (r ? ` progs ${r.programs.length} geos ${r.memory.geometries} tex ${r.memory.textures} calls ${r.render.calls}` : ''); })); } catch (e) { console.log('eval failed', e.message.slice(0, 120)); break; } }
  await b.close();
})();
