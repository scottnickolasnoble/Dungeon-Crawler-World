const { chromium } = require('playwright');
(async () => {
  const [,, url, out, dsf] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: +(dsf||1) });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('err:', e.message));
  await p.goto('http://localhost:8765/' + url, { timeout: 300000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({ path: out }); await b.close();
})();
