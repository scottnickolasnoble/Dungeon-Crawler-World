// Renders frozen frames of a goblin mid wind-up and the boss mid-slam/charge to check telegraph visuals.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(300000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/play.html?floor=1&newgame', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled, null, { timeout: 600000 });
  await p.click('#startBtn'); await p.waitForTimeout(500);
  await p.evaluate(() => {
    window.__freeze = true; const g = window.__game; g.state.hp = 1e6;
    window.__until = (m, type, frac) => { let t = 0; for (let i = 0; i < 3000; i++) { t += 0.05; g.MS.update(0.05, t, 1); if (m.act && m.act.type === type && m.act.t >= m.act.windup * frac) return true; } return false; };
    window.__look = (m, pitch = -0.3) => { const dx = m.g.position.x - g.P.pos.x, dz = m.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = pitch; };
  });
  const snap = async (n) => { await p.waitForTimeout(2500); await p.screenshot({ path: `renders/mobs/${n}.png` }); };
  console.log(await p.evaluate(() => { const g = window.__game; const m = g.mobs.filter((m) => m.kind === 'goblin' && !m.camp)[3]; g.P.pos.set(m.g.position.x + 1.6, 0, m.g.position.z + 0.6); m.state = 'chase'; const ok = window.__until(m, 'melee', 0.85); g.P.pos.set(m.g.position.x + 3.2, 0, m.g.position.z + 2.4); window.__look(m, -0.35); return 'goblin windup ' + ok; }));
  await snap('tele_goblin');
  for (const a of ['slam', 'charge']) {
    console.log(await p.evaluate((a) => { const g = window.__game; const bo = g.mobs.find((m) => m.kind === 'pylon'); g.mobs.filter((x) => x.camp === 'pylon' && x !== bo).forEach((x) => { x.dead = true; x.g.visible = false; if (x.bar) { x.bar.remove(); x.bar = null; } });
      bo.act = null; bo.state = 'chase'; for (const k in bo.abCd) bo.abCd[k] = 99; bo.abCd[a] = 0; bo.atkCd = 0; g.P.pos.set(bo.g.position.x - (a === 'slam' ? 3 : 10), 0, bo.g.position.z + 1);
      const orig = Math.random; Math.random = () => 0.1; const ok = window.__until(bo, a, 0.7); Math.random = orig;
      if (a === 'slam') g.P.pos.set(bo.g.position.x - 9, 0, bo.g.position.z + 2); else g.P.pos.set(bo.g.position.x - 6, 0, bo.g.position.z + 6); window.__look(bo, -0.3); return a + ' ' + ok; }, a));
    await snap('tele_boss_' + a);
  }
  console.log('errors:', errs.slice(0, 5).join(' | ') || 'none'); await b.close();
})();
