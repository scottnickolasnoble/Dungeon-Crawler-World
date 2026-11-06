// Screenshots each intro panel (jumps straight to each shot) a few seconds in.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } }); p.setDefaultTimeout(120000);
  p.on('pageerror', (e) => console.log('err:', e.message));
  for (const s of [3]) { await p.goto(`http://localhost:8766/introdemo.html?shot=${s}`); await p.waitForFunction(() => window.__ready); await p.waitForTimeout(s === 4 ? 3500 : 2600); await p.screenshot({ path: `renders/intro/shot${s}.png` }); }
  await b.close();
})();
