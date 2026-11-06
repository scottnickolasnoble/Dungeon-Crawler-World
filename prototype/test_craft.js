// Headless test of the Crash Pad + crafting: buy tables, craft components, gear, a combo, and imbue.
// Usage: node test_craft.js <outDir>   (needs a static server on :8765)
const { chromium } = require('playwright');
(async () => {
  const [,, out = '.'] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.setDefaultTimeout(240000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/play.html?floor=pad&newgame', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 600000 });
  console.log('load:', await p.evaluate(() => document.getElementById('loadMsg').textContent));
  await p.click('#startBtn'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/pad_start.png` });
  // give lots of materials and gold so we can try many recipes
  await p.evaluate(() => { const S = window.__game.state; S.gold = 3000; for (const k of ['scrapmetal', 'wire', 'cloth', 'plastic', 'rubber', 'glass', 'grease', 'battery', 'gristle', 'ember', 'frost', 'storm', 'light', 'mushroom', 'mysterymeat', 'dirtywater', 'hide', 'gunpowder', 'burnoil', 'spring']) S.mats[k] = (S.mats[k] || 0) + 20; });
  const SL = [[-9, -7.6], [-4.5, -7.6], [0, -7.6], [4.5, -7.6], [9, -7.6], [10.6, -3], [10.6, 2], [6, 7.6], [-6, 7.6], [-10.6, 0]];
  const buyAt = async (t, i) => { await p.evaluate(([x, z]) => { const g = window.__game; const d = Math.hypot(x, z); g.P.pos.set(x - (x / d) * 1.7, 0, z - (z / d) * 1.7); }, SL[i]); await p.waitForTimeout(300); await p.keyboard.press('KeyE'); await p.waitForTimeout(400); await p.click(`#craftTables .ctab[data-t="${t}"]`); await p.waitForTimeout(150); if (i === 4) await p.screenshot({ path: `${out}/pad_buy.png` }); await p.click('#buyBtn'); await p.waitForTimeout(250); await p.keyboard.press('Escape'); await p.waitForTimeout(150); };
  await buyAt('anvil', 1); await buyAt('boom', 4); await buyAt('alchemy', 5); await buyAt('font', 0);
  await p.keyboard.press('KeyB'); await p.waitForTimeout(300);
  console.log('tables:', JSON.stringify(await p.evaluate(() => window.__game.state.tables)));
  const tryCraft = async (table, rid, n = 1) => { await p.click(`#craftTables .ctab[data-t="${table}"]`); await p.waitForTimeout(150); await p.click(`#recipeList .rrow[data-r="${rid}"]`); await p.waitForTimeout(150); for (let i = 0; i < n; i++) { const dis = await p.$eval('#craftBtn', (e) => e.disabled); if (dis) { console.log('cannot craft', rid, await p.$eval('.cfoot .sm', (e) => e.textContent)); return; } await p.click('#craftBtn'); await p.waitForTimeout(120); } };
  await tryCraft('workbench', 'steel_ingot', 4);
  await tryCraft('workbench', 'bolts_screws', 2);
  await tryCraft('workbench', 'glass_vial', 2);
  await tryCraft('anvil', 'rebar_spear');
  for (const t of ['anvil', 'boom']) { await p.click(`#craftTables .ctab[data-t="${t}"]`); await p.waitForTimeout(150); await p.click('#upBtn'); await p.waitForTimeout(200); }
  await tryCraft('anvil', 'hubcap_chakram');
  await tryCraft('boom', 'firebomb', 2);
  await p.screenshot({ path: `${out}/pad_craft.png` });
  // imbue: pick the first imbue recipe on the font and the first target
  await p.click('#craftTables .ctab[data-t="font"]'); await p.waitForTimeout(150);
  await p.click('#craftFilter button[data-f="Imbue"]'); await p.waitForTimeout(150);
  const imb = await p.$$('#recipeList .rrow'); if (imb[0]) { await imb[0].click(); await p.waitForTimeout(150); const tg = await p.$$('.tgt'); if (tg[0]) { await tg[0].click(); await p.waitForTimeout(150); } await p.screenshot({ path: `${out}/pad_imbue.png` }); const dis = await p.$eval('#craftBtn', (e) => e.disabled); if (!dis) await p.click('#craftBtn'); else console.log('imbue blocked:', await p.$eval('.cfoot .sm', (e) => e.textContent)); }
  await p.waitForTimeout(300);
  const st = await p.evaluate(() => { const S = window.__game.state; return { gold: S.gold, inv: S.inv.map((i) => `${i.name}${i.tags ? ' [' + i.tags.join(',') + ']' : ''}`).slice(-8), crafted: S.counters.crafted, craftXP: S.craftXP }; });
  console.log('state:', JSON.stringify(st));
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  await p.evaluate(() => { const g = window.__game; g.P.pos.set(0, 0, 2); g.P.yaw = 0; g.P.pitch = -0.1; });
  await p.waitForTimeout(800); await p.screenshot({ path: `${out}/pad_room.png` });
  // bomb throw smoke-test
  await p.evaluate(() => window.__game.throwBomb()); await p.waitForTimeout(1500);
  console.log('errors:', errs.slice(0, 8).join(' | ') || 'none');
  await b.close();
})();
