// Usage: node record.js <page> <outDir> <fps> [t1,t2,... for stills]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [,, page, out, fps = '30', stills] = process.argv;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('err:', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto('http://localhost:8765/' + page);
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const times = stills ? stills.split(',').map(Number) : [];
  if (!stills) { const dur = await p.evaluate(() => window.DURATION); for (let i = 0; i * (1 / fps) <= dur; i++) times.push(i / fps); }
  for (let i = 0; i < times.length; i++) {
    await p.evaluate((t) => window.renderAt(t), times[i]);
    await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
    if (i % 30 === 0) console.log(`frame ${i}/${times.length}`);
  }
  await b.close();
})();
