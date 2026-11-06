// Exercises loot rarity gating, crafting caps, the crafting guide, quick-use keys, scrap confirmation, weapon types,
// town service signs, the way-down hint and the new-game name prompt.  node test_systems.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1100, height: 620 } }); p.setDefaultTimeout(600000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.addInitScript(() => { localStorage.clear(); localStorage.setItem('downstairs_gfx', JSON.stringify({ preset: 'low', scale: 0.6, outline: true, view: 55, sdf: 2.2, npc: 2.4, suggested: true })); });
  await p.goto('http://localhost:8765/play.html?floor=1&newgame&fast&nointro');
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled);
  console.log('name prompt shown:', await p.evaluate(() => !!document.getElementById('nameIn')));
  await p.fill('#nameIn', 'Rosa'); await p.click('#startBtn'); await p.waitForTimeout(1200);
  await p.evaluate(() => { window.__freeze = true; });
  console.log('HUD name:', await p.evaluate(() => document.getElementById('name').textContent), '| state.name:', await p.evaluate(() => window.__game.state.name));

  // loot rarity by monster level
  console.log('loot:', await p.evaluate(async () => { const D = await import('./game/data.js'); const rng = D.makeRng(7); const out = [];
    for (const lv of [1, 3, 6, 12, 20, 40]) { const c = {}; for (let i = 0; i < 4000; i++) { const it = D.makeItem(rng, { level: lv }); c[it.rarity] = (c[it.rarity] || 0) + 1; } out.push(`L${lv} ` + ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => `${r[0]}${((c[r] || 0) / 40).toFixed(1)}%`).join(' ')); }
    const gold = {}; for (let i = 0; i < 400; i++) for (const it of D.openBox(rng, 'gold', 3)) if (it.kind === 'gear') gold[it.rarity] = (gold[it.rarity] || 0) + 1; out.push('gold box @L3 ' + JSON.stringify(gold));
    const w = {}; for (let i = 0; i < 300; i++) { const it = D.makeItem(rng, { level: 12, slot: 'main' }); w[it.wtype] = (w[it.wtype] || 0) + 1; } out.push('weapon types @L12 ' + JSON.stringify(w)); return out.join('\n   '); }));

  // crafted rarity caps
  console.log('craft:', await p.evaluate(async () => { const g = window.__game, S = g.state, CR = g.CR; const { RECIPES } = await import('./game/crafting.js'); const res = [];
    S.base.STR = 40; for (const tier of [2, 5]) { S.tables.anvil = { tier, slot: 3 }; const rec = RECIPES.find((x) => x.table === 'anvil' && x.tier === tier && x.out.gear);
      const c = {}; for (let i = 0; i < 150; i++) { for (const [m, n] of Object.entries(rec.inputs)) S.mats[m] = n; const before = S.inv.length; CR.craft(rec); const it = S.inv[S.inv.length - 1]; if (S.inv.length > before) { c[it.rarity] = (c[it.rarity] || 0) + 1; S.inv.pop(); } }
      res.push(`T${tier} ${rec.name}: ${JSON.stringify(c)} wtype ${rec.out.gear.wtype}`); } return res.join(' | '); }));

  // crafting guide
  await p.keyboard.press('KeyN'); await p.waitForTimeout(400);
  console.log('guide:', await p.evaluate(() => `open ${document.getElementById('pGuide').classList.contains('show')} rows ${document.querySelectorAll('#guideBody .gRow').length}`));
  await p.fill('#gSearch', 'rapier'); await p.waitForTimeout(300); await p.click('#guideBody .gRow'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/guide.png' });
  await p.click('#guideBody .gIn'); await p.waitForTimeout(200); console.log('guide material view:', await p.evaluate(() => document.querySelector('#guideBody .gTitle').textContent + ' | ' + document.querySelectorAll('#guideBody .gSrc').length + ' sources'));
  await p.screenshot({ path: 'shots/guide_mat.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // quick use
  console.log('quick:', await p.evaluate(async () => { const g = window.__game, S = g.state; S.hp = 20; const n0 = S.inv.filter((i) => i.kind === 'consumable').length; document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ', key: 'z' })); await new Promise((r) => setTimeout(r, 200)); return `hp ${Math.round(S.hp)} consumables ${n0} -> ${S.inv.filter((i) => i.kind === 'consumable').length} | bar ${document.querySelectorAll('#quickbar .qs').length} slots`; }));

  // scrap confirmation
  console.log('scrap:', await p.evaluate(async () => { const g = window.__game, S = g.state; const it = { uid: 99, kind: 'gear', slot: 'head', name: 'Test Crown', rarity: 'legendary', stats: { armor: 5 }, level: 20 }; S.inv.push(it); g.G.scrap(it); const shown = document.getElementById('confirmBox') && document.getElementById('confirmBox').style.display === 'flex'; const still = S.inv.includes(it); document.getElementById('cfYes').click(); return `confirm shown ${shown}, kept until yes ${still}, gone after ${!S.inv.includes(it)}, showstopper ${S.mats.showstopper || 0}`; }));

  // weapon types swing without errors
  console.log('swings:', await p.evaluate(async () => { const g = window.__game, S = g.state; const D = await import('./game/data.js'); const out = [];
    for (const t of Object.keys(D.WTYPES)) { S.equip.main = { uid: 1, kind: 'gear', slot: 'main', name: 'Test ' + t, wtype: t, stats: { dmg: 10 }, rarity: 'common', level: 1 }; g.refreshHand && g.refreshHand(); await new Promise((r) => setTimeout(r, 700)); out.push(`${t}:${window.__swing() ? 'ok' : 'cd'}`); } return out.join(' '); }));

  // town signs, way-down text
  console.log('town:', await p.evaluate(() => { const g = window.__game; let n = 0; g.ink.scene.traverse((o) => { if (o.isSprite) n++; }); return `sprites ${n} | wayDown: ${document.getElementById('wayDown').textContent.slice(0, 120)}`; }));
  await p.evaluate(() => { const g = window.__game, r = g.world().hub.rect; g.P.pos.set((r[0] + r[2]) / 2 + 30, 0, (r[1] + r[3]) / 2 + 10); g.P.yaw = 1.2; });
  await p.waitForTimeout(1500); await p.screenshot({ path: 'shots/town_signs.png' });
  await p.keyboard.press('KeyM'); await p.waitForTimeout(600); await p.screenshot({ path: 'shots/map_services.png' });
  console.log('errors:', [...new Set(errs)].join(' | ') || 'none');
  await b.close();
})();
