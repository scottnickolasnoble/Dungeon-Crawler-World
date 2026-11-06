// Headless test: town NPCs move, dialogue branches start quests, Bo sells a table, the Crash Pad installs it,
// the table panel shows only its own 60 recipes, and audio runs without errors.
const { chromium } = require('playwright');
(async () => {
  const out = 'renders/story';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(300000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now();
  await p.goto('http://localhost:8765/play.html?floor=1&newgame&fast', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled || document.getElementById('loadMsg').textContent.startsWith('Error'), null, { timeout: 600000 });
  console.log('load', await p.evaluate(() => document.getElementById('loadMsg').textContent), ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await p.click('#startBtn'); await p.waitForTimeout(600);
  console.log('npcs', await p.evaluate(() => window.__game.NPCS.npcs.map((n) => `${n.id || n.role}`).join(',')));
  const pos0 = await p.evaluate(() => window.__game.NPCS.npcs.filter((n) => n.route).map((n) => n.g.position.toArray().map((v) => +v.toFixed(1))));
  await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 200; i++) g.NPCS.update(0.05, i * 0.05, g.P, () => {}); });
  const pos1 = await p.evaluate(() => window.__game.NPCS.npcs.filter((n) => n.route).map((n) => n.g.position.toArray().map((v) => +v.toFixed(1))));
  console.log('walkers moved', pos0.filter((a, i) => Math.hypot(a[0] - pos1[i][0], a[2] - pos1[i][2]) > 0.5).length, '/', pos0.length);
  const talk = async (id) => { await p.evaluate((id) => { const g = window.__game; const n = g.NPCS.byId(id); g.P.pos.set(n.g.position.x + 1.6, 0, n.g.position.z + 1.2); const dx = n.g.position.x - g.P.pos.x, dz = n.g.position.z - g.P.pos.z; g.P.yaw = Math.atan2(-dx, -dz); g.P.pitch = -0.05; g.use(); }, id); await p.waitForTimeout(300); await p.keyboard.press('Space'); await p.waitForTimeout(200); };
  const choose = async (txt) => { const bs = await p.$$('#dChoices .dch'); for (const bt of bs) { const t = await bt.textContent(); if (t.includes(txt)) { await bt.click(); await p.waitForTimeout(300); await p.keyboard.press('Space'); await p.waitForTimeout(200); return t; } } return 'NOT FOUND: ' + txt + ' in ' + (await Promise.all(bs.map((x) => x.textContent()))).join(' | '); };
  await talk('marta'); await p.screenshot({ path: `${out}/marta.png` });
  console.log(await choose('Why has nobody')); console.log(await choose('find out'));
  await talk('marta'); console.log(await choose('work')); console.log(await choose('find the leak'));
  await talk('marta'); console.log(await choose('Charisma'));
  console.log('quests', await p.evaluate(() => JSON.stringify(window.__game.state.quests)));
  await talk('pickles'); console.log(await choose('traffic cones')); console.log(await choose('Twelve'));
  await p.evaluate(() => { window.__game.state.gold = 1000; });
  await talk('bo'); console.log(await choose('Show me the tables')); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/bo_shop.png` });
  for (const nm of ['Boom Bench', 'Alchemy Lab']) { const rows = await p.$$('#shopList .srow'); for (const r of rows) { if ((await r.textContent()).includes(nm)) { await (await r.$('button')).click(); await p.waitForTimeout(250); break; } } }
  console.log('stock', await p.evaluate(() => JSON.stringify(window.__game.state.tableStock)), 'gold', await p.evaluate(() => window.__game.state.gold));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.evaluate(() => { const g = window.__game; g.STORY.Q.event('visit', 'The Ramp Spiral'); g.STORY.Q.event('visit', 'The Burning Bus'); });
  await talk('marta'); console.log(await choose('Glad to help'));
  console.log('quests', await p.evaluate(() => Object.entries(window.__game.state.quests).map(([k, v]) => k + ':' + v.st).join(' ')));
  await p.evaluate(() => { window.__game.P.pos.set(3, 0, 6); window.__game.P.yaw = 0.6; window.__game.P.pitch = -0.05; }); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/town.png` });
  await p.evaluate(() => { window.__game.ui.toggle('quests'); }); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/questlog.png` }); await p.keyboard.press('Escape');
  await p.evaluate(() => window.__game.saveGame());
  await p.goto('http://localhost:8765/play.html?floor=pad&fast', { timeout: 300000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled, null, { timeout: 600000 }); await p.click('#startBtn'); await p.waitForTimeout(500);
  const SL = [[-9, -7.6], [-4.5, -7.6], [0, -7.6], [4.5, -7.6], [9, -7.6], [10.6, -3]];
  const at = async (i) => { await p.evaluate(([x, z]) => { const g = window.__game; const d = Math.hypot(x, z); g.P.pos.set(x - (x / d) * 1.7, 0, z - (z / d) * 1.7); }, SL[i]); await p.waitForTimeout(200); await p.evaluate(() => window.__game.use()); await p.waitForTimeout(400); };
  await at(4); await p.screenshot({ path: `${out}/install.png` }); const st = await p.$$('#craftInstall .stock'); for (const s of st) if ((await s.textContent()).includes('Boom')) { await s.click(); break; } await p.waitForTimeout(300);
  console.log('boom panel recipes', await p.$$eval('#recipeList .rrow', (r) => r.length), 'title', await p.textContent('#craftTitle')); await p.screenshot({ path: `${out}/boom_table.png` });
  await p.keyboard.press('Escape'); await at(5); const st2 = await p.$$('#craftInstall .stock'); if (st2[0]) await st2[0].click(); await p.waitForTimeout(300); await p.keyboard.press('Escape');
  console.log('tables', await p.evaluate(() => JSON.stringify(window.__game.state.tables)));
  await at(4); await p.click('#craftFilter button[data-f="Combo"]'); await p.waitForTimeout(200); console.log('combo rows', await p.$$eval('#recipeList .rrow', (r) => r.map((x) => x.textContent).join(' | ')));
  console.log('audio', await p.evaluate(async () => { const A = window.__game.AU; A.init(); for (const n of ['firebolt', 'fireball', 'explode', 'hit', 'swing', 'parry', 'block', 'hurt', 'slam', 'pickup', 'levelup', 'achieve', 'victory', 'craft', 'roar', 'death', 'step', 'coin']) A.play(n, { x: 1, z: 1 }); const d = A.say('Welcome back, contestant! Is this thing on?', 'host'); A.say('OI! CONE ZONE!', 'goblin', { x: 2, z: 0 }); A.setMood('boss'); await new Promise((r) => setTimeout(r, 1200)); return 'ok say ' + d.toFixed(2) + 's'; }));
  console.log('errors:', errs.slice(0, 8).join(' | ') || 'none'); await b.close();
})();
