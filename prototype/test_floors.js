// Loads each floor (fast mode, low graphics), reports load time, monsters, NPCs, towns, camps and errors.
// On Floor 3 it also picks a class and casts every hotbar skill, and checks melee + a guild master.
// Usage: node test_floors.js 0,1,2,3,4,5,6
const { chromium } = require('playwright');
(async () => {
  const floors = (process.argv[2] || '0,1,2,3,4,5,6').split(',');
  for (const f of floors) {
    const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const p = await b.newPage({ viewport: { width: 640, height: 360 } }); p.setDefaultTimeout(300000);
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    await p.addInitScript(() => { try { localStorage.setItem('downstairs_gfx', JSON.stringify({ preset: 'low', scale: 0.5, outline: false, view: 55, sdf: 2.2, npc: 2.4, suggested: true })); } catch (e) {} });
    const t0 = Date.now();
    try {
      await p.goto(`http://localhost:8765/play.html?floor=${f}&newgame&fast&nointro`, { timeout: 300000 });
      await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 900000 });
      const load = ((Date.now() - t0) / 1000).toFixed(0);
      await p.click('#startBtn'); await p.waitForTimeout(800);
      const info = await p.evaluate(() => { const g = window.__game, w = g.world(); const c = {}; g.mobs.forEach((m) => { c[m.kind] = (c[m.kind] || 0) + 1; }); const pois = w.map.pois; return `mobs ${g.mobs.length} ${JSON.stringify(c)} | npcs ${g.NPCS.npcs.length} | towns ${pois.filter((p) => p.safe).map((p) => p.name).join(', ')} | camps ${pois.filter((p) => p.kind === 'camp').map((p) => p.name).join(', ')} | doors ${w.doors.length} | noMob ${w.noMob.length}`; });
      console.log(`FLOOR ${f}: load ${load}s | ${info}`);
      // monsters must not be inside towns
      console.log('  mobs inside towns:', await p.evaluate(() => { const g = window.__game, w = g.world(); return g.mobs.filter((m) => !m.def.passive && (w.noMob || []).some((r) => m.g.position.x > r[0] && m.g.position.x < r[2] && m.g.position.z > r[1] && m.g.position.z < r[3])).length; }));
      if (f === '3') {
        console.log('  ' + await p.evaluate(async () => { const g = window.__game, out = []; g.state.mana = 9999; g.state.level = 15;
          g.G.chooseClass('stormcaller', 'lumen'); out.push(`class ${g.state.cls} race ${g.state.race} hotbar ${g.state.hotbar.join(',')}`);
          const m = g.mobs.find((x) => !x.dead && !x.def.passive && !x.def.boss); g.P.pos.set(m.g.position.x + 4, 0, m.g.position.z); const dx = m.g.position.x - g.P.pos.x, dz = m.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); window.__freeze = true;
          for (const id of g.state.hotbar) { const ok = g.cast(id); out.push(`${id}:${ok ? 'cast' : 'no'}`); await new Promise((r) => setTimeout(r, 120)); }
          // every skill kind via the engine directly
          const kinds = {}; for (const id of ['frostshard', 'icebarrier', 'chilltouch', 'quake', 'raiseskeleton', 'mend', 'haste', 'sporecloud', 'blinkstep', 'pipebomb', 'galeslash', 'tremorsense']) { g.state.skills[id] = { lvl: 3, ups: [] }; g.state.mana = 9999; kinds[id] = g.cast(id); } out.push('kinds ' + JSON.stringify(kinds));
          return out.join(' | '); }));
        console.log('  guild:', await p.evaluate(() => { const g = window.__game; const n = g.NPCS.npcs.find((x) => x.guild === 'collegium'); if (!n) return 'no guild npc'; g.P.pos.set(n.g.position.x + 1.5, 0, n.g.position.z); g.STORY.open(n); const t = document.getElementById('dText'); return 'opened ' + !!document.getElementById('dialog').classList.contains('show'); }));
      }
      if (f === '1') console.log('  melee:', await p.evaluate(async () => { const g = window.__game; const m = g.mobs.find((x) => x.kind === 'dummy'); if (!m) return 'no dummy'; g.P.pos.set(m.g.position.x, 0, m.g.position.z + 1.8); g.P.yaw = 0; g.P.pitch = 0; const before = g.state.counters.dummyHits || 0; for (let i = 0; i < 4; i++) { window.__swing && window.__swing(); await new Promise((r) => setTimeout(r, 800)); } return `dummy hits ${(g.state.counters.dummyHits || 0) - before}`; }));
    } catch (e) { console.log(`FLOOR ${f}: FAILED ${e.message.slice(0, 160)}`); }
    console.log('  errors:', [...new Set(errs)].slice(0, 6).join(' | ') || 'none');
    await b.close();
  }
})();
