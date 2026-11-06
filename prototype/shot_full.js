// Full-page screenshot of a page that sets window.__ready. Usage: node shot_full.js <url> <out.png>
const { chromium } = require('playwright');
(async () => {
  const [,, url, out] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } }); p.setDefaultTimeout(300000);
  p.on('pageerror', (e) => console.log('err:', e.message));
  await p.goto('http://localhost:8765/' + url, { timeout: 300000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: out, fullPage: true }); await b.close();
})();
