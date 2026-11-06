// Steps the mob AI directly (no rendering) to verify pathing, attacks, parry and boss abilities quickly.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 360 } }); p.setDefaultTimeout(240000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:8765/play.html?floor=${process.argv[2] || 1}&newgame`, { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 600000 });
  const res = await p.evaluate(() => {
    const g = window.__game, MS = g.MS, out = []; g.state.hp = 1e6; let t = 0;
    const step = (n, fn) => { for (let i = 0; i < n; i++) { t += 0.05; MS.update(0.05, t, g.state.level); fn && fn(i); } };
    // 1) a roaming goblin, player 9 m away behind obstacles
    const m = g.mobs.filter((m) => m.kind === 'goblin' && !m.camp).sort((a, b) => a.g.position.length() - b.g.position.length())[0];
    g.P.pos.set(m.g.position.x + 9, 0, m.g.position.z + 4);
    const d0 = m.g.position.distanceTo(g.P.pos); let attacks = 0, hits = 0; const hp0 = g.state.hp;
    step(200, () => { if (m.act && m.act.t < 0.06) attacks++; });
    out.push(`goblin: start ${d0.toFixed(1)} m -> ${m.g.position.distanceTo(g.P.pos).toFixed(1)} m, attacks started ${attacks}, player dmg taken ${Math.round(hp0 - g.state.hp)}`);
    // 2) parry: trigger parry right before the strike
    let parried = 0; step(200, () => { if (m.act && m.act.type === 'melee' && m.act.t > m.act.windup - 0.1 && !m.act.hit) g.DEF.parryT = performance.now() / 1000; if (m.state === 'stagger') parried++; });
    out.push(`parry: counter=${g.state.counters.parries} stagger frames=${parried}`);
    // 3) path around: put player on the other side of a car row, far-ish
    const blockedPaths = [];
    for (const mm of g.mobs.filter((x) => !x.camp && !x.dead).slice(0, 12)) { mm.state = 'idle'; mm.g.position.copy(mm.home); }
    const m2 = g.mobs.filter((x) => !x.camp)[5]; g.P.pos.set(m2.g.position.x - 3, 0, m2.g.position.z - 13); m2.state = 'chase'; const s0 = m2.g.position.distanceTo(g.P.pos);
    step(240); out.push(`pathing: ${s0.toFixed(1)} -> ${m2.g.position.distanceTo(g.P.pos).toFixed(1)} m (state ${m2.state})`);
    // 4) boss
    const bo = g.mobs.find((x) => x.kind === 'pylon' || x.kind === 'ebb'); g.mobs.filter((x) => x.camp === bo.camp && x !== bo).forEach((x) => { x.dead = true; x.g.visible = false; });
    g.P.pos.set(bo.g.position.x - 10, 0, bo.g.position.z); const seen = {}; const hpB = g.state.hp;
    step(900, (i) => { if (bo.act && bo.act.t < 0.06) seen[bo.act.type] = (seen[bo.act.type] || 0) + 1; if (i % 150 === 0) { const a = Math.random() * 6.28; g.P.pos.set(bo.g.position.x + Math.cos(a) * (5 + Math.random() * 8), 0, bo.g.position.z + Math.sin(a) * 8); } });
    out.push(`boss ${bo.kind}: state ${bo.state}, moved ${bo.g.position.distanceTo(bo.home).toFixed(1)} m from home, actions ${JSON.stringify(seen)}, dmg dealt ${Math.round(hpB - g.state.hp)}, alive mobs ${g.mobs.filter((x) => !x.dead).length}, enraged ${bo.enraged}`);
    // 5) nav stats
    const N = MS.nav; let bl = 0; for (let i = 0; i < N.block.length; i++) bl += N.block[i]; out.push(`nav ${N.n}x${N.n}, blocked ${(100 * bl / N.block.length).toFixed(1)}%`);
    return out.join('\n');
  });
  console.log(res); console.log('errors:', errs.slice(0, 6).join(' | ') || 'none'); await b.close();
})();
