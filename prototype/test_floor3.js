// Floor 3 check: loads, counts mobs/NPCs, steps each boss's AI to see its abilities, opens Vrask's and Wickley's
// dialogue, and takes a few screenshots of Soup Row, the Lamp Market, the Roost and the Cone Cathedral.
const { chromium } = require('playwright');
(async () => {
  const out = 'renders/floor3';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(300000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto('http://localhost:8765/play.html?floor=3&newgame&fast', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 900000 });
  console.log('load', await p.evaluate(() => document.getElementById('loadMsg').textContent), ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await p.click('#startBtn'); await p.waitForTimeout(600);
  console.log(await p.evaluate(() => { const g = window.__game; const c = {}; g.mobs.forEach((m) => { c[m.kind] = (c[m.kind] || 0) + 1; }); return 'mobs ' + JSON.stringify(c) + ' npcs ' + g.NPCS.npcs.length; }));
  console.log(await p.evaluate(() => { const g = window.__game, out = []; g.state.hp = 1e7; g.state.level = 20; window.__freeze = true;
    for (const k of ['bulbQueen', 'coo', 'coneKing']) { const bo = g.mobs.find((m) => m.kind === k); g.mobs.filter((x) => x.camp === bo.camp && x !== bo).forEach((x) => { x.dead = true; x.g.visible = false; if (x.bar) { x.bar.remove(); x.bar = null; } });
      const seen = {}; let t = 0; for (let i = 0; i < 1000; i++) { t += 0.05; if (i % 120 === 0) { const a = Math.random() * 6.28; g.P.pos.set(bo.g.position.x + Math.cos(a) * (4 + Math.random() * 9), 0, bo.g.position.z + Math.sin(a) * 7); } if (i === 400) bo.hp = bo.maxHp * 0.5; g.MS.update(0.05, t, 20); if (bo.act && bo.act.t < 0.06) seen[bo.act.type] = (seen[bo.act.type] || 0) + 1; }
      out.push(`${k}: ${JSON.stringify(seen)} moved ${bo.g.position.distanceTo(bo.home).toFixed(1)} m`); bo.act = null; bo.state = 'idle'; bo.g.position.copy(bo.home); }
    window.__freeze = false; g.MS.clearAll(); g.mobs.filter((m) => m.summoned).forEach((m) => { m.dead = true; m.g.visible = false; if (m.bar) { m.bar.remove(); m.bar = null; } }); return out.join('\n'); }));
  const shot = async (name, x, z, yaw, pitch = -0.08) => { await p.evaluate(([x, z, yaw, pitch]) => { const g = window.__game; g.P.pos.set(x, 0, z); g.P.yaw = yaw; g.P.pitch = pitch; }, [x, z, yaw, pitch]); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${name}.png` }); };
  await shot('soup_row', 0, 22, 0, -0.12);
  await shot('lamp_market', 100 - 24, -90 + 18, Math.atan2(24, -18) - Math.PI, 0.05);
  await shot('roost', -105 + 22, -85 + 14, Math.atan2(-22, -14), 0.0);
  await shot('cathedral', 0, -140 + 20, 0, 0.05);
  await shot('alley', 40, 50, 0.8, 0);
  // dialogue: Vrask and Wickley
  for (const id of ['vrask', 'wickley']) { await p.evaluate((id) => { const g = window.__game; const n = g.NPCS.byId(id); g.P.pos.set(n.g.position.x + 1.5, 0, n.g.position.z + 1.2); const dx = n.g.position.x - g.P.pos.x, dz = n.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.05; g.use(); }, id); await p.waitForTimeout(600); await p.keyboard.press('Space'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/talk_${id}.png` }); console.log(id, await p.$$eval('#dChoices .dch', (r) => r.map((x) => x.textContent).join(' | '))); if (id === 'wickley') { const bs = await p.$$('#dChoices .dch'); await bs[0].click(); await p.waitForTimeout(300); await p.keyboard.press('Space'); await p.waitForTimeout(300); console.log('wickley>feud', await p.$$eval('#dChoices .dch', (r) => r.map((x) => x.textContent).join(' | '))); await p.keyboard.press('Digit1'); await p.waitForTimeout(300); console.log('quests', await p.evaluate(() => Object.keys(window.__game.state.quests).join(','))); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
  console.log('errors:', errs.slice(0, 8).join(' | ') || 'none'); await b.close();
})();
