// Loads floors and screenshots open-map scenery.  node _scene.js 2,3,4,5,6
const { chromium } = require('playwright');
(async () => { for (const f of (process.argv[2] || '2').split(',')) {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(600000); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('downstairs_gfx', JSON.stringify({ preset: 'low', scale: 0.7, outline: true, view: 70, sdf: 2.2, npc: 2.4, suggested: true })); });
  const t0 = Date.now(); await p.goto(`http://localhost:8765/play.html?floor=${f}&newgame&fast&nointro`);
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || /^Error/.test(document.getElementById('loadMsg').textContent)); const load = ((Date.now() - t0) / 1000).toFixed(0);
  await p.click('#startBtn'); await p.waitForTimeout(1200);
  const info = await p.evaluate(() => { window.__freeze = true; const g = window.__game; const T = g.ink.THREE; let inst = 0, n = 0; g.ink.scene.traverse((o) => { if (o.isInstancedMesh) { n++; inst += o.count; } });
    // find a free spot ~130 m south-east of the hub
    let x = 90, z = 150; const col = g.world().col || null; g.P.pos.set(x, 0, z); g.P.yaw = 2.4; g.P.pitch = -0.05; return `instanced meshes ${n}, instances ${inst}, mobs ${g.mobs.length}`; });
  await p.waitForTimeout(2500); await p.screenshot({ path: `shots/scene_f${f}.png` });
  await p.evaluate(() => { const g = window.__game; g.P.yaw += 2.2; }); await p.waitForTimeout(1500); await p.screenshot({ path: `shots/scene_f${f}b.png` });
  console.log(`F${f} load ${load}s | ${info} | errors: ${errs.join(' | ') || 'none'}`); await b.close(); } })();
