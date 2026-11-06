// Close-ups of NPC faces on a floor's hub (low preset, to judge the worst case).  node _face.js 1 [preset]
const { chromium } = require('playwright');
(async () => { const f = process.argv[2] || '1', pre = process.argv[3] || 'low'; const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(600000); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((pre) => { localStorage.setItem('downstairs_gfx', JSON.stringify(pre === 'low' ? { preset: 'low', scale: 0.8, outline: true, view: 55, sdf: 2.2, npc: 2.4, suggested: true } : { preset: 'high', scale: 1, outline: true, view: 70, sdf: 1, npc: 1, suggested: true })); }, pre);
  await p.goto(`http://localhost:8765/play.html?floor=${f}&newgame&fast&nointro`); await p.waitForFunction(() => !document.getElementById('startBtn').disabled); await p.click('#startBtn'); await p.waitForTimeout(1000);
  const names = await p.evaluate(() => { window.__freeze = true; return window.__game.NPCS.npcs.filter((n) => n.kind === 'quest').slice(0, 3).map((n) => n.name); });
  for (let i = 0; i < names.length; i++) {
    await p.evaluate((i) => { const g = window.__game; const n = g.NPCS.npcs.filter((q) => q.kind === 'quest')[i]; const h = n.g.position; const fy = n.g.rotation.y; g.P.pos.set(h.x + Math.sin(fy) * 1.1, 0, h.z + Math.cos(fy) * 1.1); g.P.yaw = fy; g.P.pitch = -0.02; }, i);
    await p.waitForTimeout(1500); await p.screenshot({ path: `shots/face_${f}_${i}_${pre}.png` }); }
  console.log(names.join(', '), '| errors:', errs.join(' | ') || 'none'); await b.close(); })();
