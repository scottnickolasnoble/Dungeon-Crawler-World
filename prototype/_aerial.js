// Renders an aerial view of a floor's hub town plus a street-level shot.  node _aerial.js <floor>
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const f = process.argv[2] || '1'; const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(600000); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('downstairs_gfx', JSON.stringify({ preset: 'low', scale: 0.8, outline: true, view: 70, sdf: 2.2, npc: 2.4, suggested: true })); });
  await p.goto(`http://localhost:8765/play.html?floor=${f}&newgame&fast&nointro`);
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled); await p.click('#startBtn'); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__freeze = true; const g = window.__game, r = g.world().hub.rect; g.P.pos.set((r[0] + r[2]) / 2 + 3, 0, r[3] - 8); g.P.yaw = 0; g.P.pitch = 0; });
  await p.waitForTimeout(2500); await p.screenshot({ path: `shots/street_f${f}.png` });
  const url = await p.evaluate(() => { const g = window.__game, r = g.world().hub.rect, cam = g.ink.camera; const cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2; const par = cam.parent; g.ink.scene.attach(cam); cam.far = 300; g.ink.scene.fog = null; g.ink.scene.add(new g.ink.THREE.AmbientLight('#ffffff', 1.6));
    cam.position.set(cx, 95, cz + 70); cam.lookAt(cx, 0, cz + 5); cam.updateMatrixWorld(); g.ink.render(); return g.ink.renderer.domElement.toDataURL('image/png'); });
  fs.writeFileSync(`shots/aerial_f${f}.png`, Buffer.from(url.split(',')[1], 'base64')); console.log('errors:', errs.join(' | ') || 'none'); await b.close(); })();
