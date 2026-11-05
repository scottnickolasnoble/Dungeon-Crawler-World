const { chromium } = require('playwright');
(async () => {
  const [,, out, dsf, hud] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: +dsf });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('err:', e.message));
  await p.goto('http://localhost:8765/' + (hud === '0' ? '?nohud' : ''));
  if (hud === '0') await p.evaluate(() => document.body.classList.add('nohud'));
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.screenshot({ path: out }); await b.close();
})();
