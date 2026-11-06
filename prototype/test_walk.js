// Walk-cycle check: freezes the mob AI, poses a goblin, a lamprey, a moth, a mimic and a townsperson mid-stride,
// and screenshots each close up (outlines on). Also reports Floor 1 mob counts and speech-voice availability.
const { chromium } = require('playwright');
(async () => {
  const out = 'renders/walk';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 450 } }); p.setDefaultTimeout(300000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto('http://localhost:8765/play.html?floor=1&newgame&nointro', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 900000 });
  console.log('load', await p.evaluate(() => document.getElementById('loadMsg').textContent), ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await p.click('#startBtn'); await p.waitForTimeout(500);
  console.log(await p.evaluate(() => { const g = window.__game; const c = {}; g.mobs.forEach((m) => { c[m.kind] = (c[m.kind] || 0) + 1; }); return 'mobs ' + g.mobs.length + ' ' + JSON.stringify(c) + ' | rigged meshes ' + [...document.querySelectorAll('x')].length + ' | speech voices ' + (window.speechSynthesis ? speechSynthesis.getVoices().length : 'n/a'); }));
  await p.evaluate(() => { window.__freeze = true; window.__game.state.hp = 1e7; document.querySelectorAll('.mbar').forEach((e) => (e.style.visibility = 'hidden')); });
  for (const [kind, ph, dist, h] of [['goblin', 1.6, 3.2, 1.0], ['goblin', -1.6, 3.2, 1.0], ['lamprey', 0, 4, 1.0], ['moth', 0, 4, 1.5], ['mimic', 1.2, 4.5, 1.1], ['pigeon', 1.6, 3, 0.7]]) {
    const r = await p.evaluate(([kind, ph, dist, h]) => { const g = window.__game; const m = g.mobs.find((x) => x.kind === kind && !x.camp) || g.mobs.find((x) => x.kind === kind); if (!m) return 'none ' + kind;
      // side-on view so the stride reads
      const yaw = m.g.rotation.y; const side = { x: Math.cos(yaw), z: -Math.sin(yaw) }; g.P.pos.set(m.g.position.x + side.x * dist, 0, m.g.position.z + side.z * dist); const dx = m.g.position.x - g.P.pos.x, dz = m.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.25 + (1 - h) * 0.4;
      if (m.rig) { m.rig.uAmt.value = 0.55; m.rig.uPhase.value = ph; m.rig.uTime.value = 2; } m.walkPh = ph; return `${kind} rig=${m.rigType} hip=${m.rig ? m.rig.uHip.value.toFixed(2) : '-'}`; }, [kind, ph, dist, h]);
    // run the mob's own animate once so the body pose matches
    await p.evaluate(([kind]) => { const g = window.__game; const m = g.mobs.find((x) => x.kind === kind && !x.camp) || g.mobs.find((x) => x.kind === kind); const keep = m.rig ? m.rig.uPhase.value : 0; }, [kind]);
    console.log(r); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${kind}_${ph}.png` });
  }
  // a townsperson walking their route
  console.log(await p.evaluate(() => { const g = window.__game; const n = g.NPCS.npcs.find((x) => x.route && x.kind === 'filler'); n.wait = 0; for (let i = 0; i < 40; i++) g.NPCS.update(0.05, 10 + i * 0.05, g.P, () => {}); const yaw = n.g.rotation.y; g.P.pos.set(n.g.position.x + Math.cos(yaw) * 3.2, 0, n.g.position.z - Math.sin(yaw) * 3.2); const dx = n.g.position.x - g.P.pos.x, dz = n.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.15; n.rig.uAmt.value = 0.45; n.rig.uPhase.value = 1.6; return 'npc ' + n.role + ' hip ' + n.rig.uHip.value.toFixed(2); }));
  await p.waitForTimeout(600); await p.screenshot({ path: `${out}/npc.png` });
  console.log('errors:', errs.slice(0, 8).join(' | ') || 'none'); await b.close();
})();
