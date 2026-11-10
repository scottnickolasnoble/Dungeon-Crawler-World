// Paints Floor 1's outdoor set dressing: new ground, graffiti, painted level markings, warning signs and posters.
// Decals have transparent backgrounds. Output: godot/textures/wilds/f1_*.png
//   node tools/paint_wilds_f1.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'godot', 'textures', 'wilds');
fs.mkdirSync(OUT, { recursive: true });
async function launch() { for (const channel of ['msedge', 'chrome']) { try { return await chromium.launch({ channel }); } catch (e) { /* next */ } } throw new Error('Neither Edge nor Chrome could be started.'); }
const browser = await launch();
const page = await browser.newPage();
const painted = await page.evaluate(() => {
  const INK = '#0d0b12'; const out = {};
  let seed = 3131; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const rr = (a, b) => a + (b - a) * R(); const pick = (a) => a[Math.floor(R() * a.length)];
  const canvas = (name, w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); out[name] = c.toDataURL('image/png'); };
  function ink(g, x1, y1, x2, y2, w = 3, color = INK, wob = 2) { const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.ceil(len / 22)), nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1); const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, o = i === 0 || i === n ? 0 : rr(-wob, wob); pts.push([x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o]); } g.strokeStyle = color; g.lineCap = 'round'; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; g.lineWidth = w * (0.45 + 0.75 * Math.sin(t * Math.PI)); g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke(); } }
  const crack = (g, x, y, a, len, w = 2.2, color = INK) => { let px = x, py = y; const n = Math.ceil(len / 16); for (let i = 0; i < n; i++) { a += rr(-0.7, 0.7); const qx = px + Math.cos(a) * 16, qy = py + Math.sin(a) * 16; ink(g, px, py, qx, qy, w * (1 - (i / n) * 0.6), color, 0.5); px = qx; py = qy; } };
  function hatch(g, x, y, w, h, angle = -0.8, gap = 9, color = INK, alpha = 0.5, lw = 1.7) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha = alpha; const d = Math.hypot(w, h), cx = x + w / 2, cy = y + h / 2, c = Math.cos(angle), s = Math.sin(angle); for (let o = -d; o < d; o += gap * rr(0.75, 1.25)) ink(g, cx - s * o - c * d * rr(0.5, 1), cy + c * o - s * d * rr(0.5, 1), cx - s * o + c * d * rr(0.5, 1), cy + c * o + s * d * rr(0.5, 1), lw, color, 0.8); g.restore(); }
  function blob(g, x, y, r, color, alpha = 1, edge = null) { g.save(); g.globalAlpha = alpha; g.fillStyle = color; g.beginPath(); const n = 14; for (let i = 0; i <= n; i++) { const a = (i / n) * 6.283, q = r * rr(0.65, 1.2); if (i === 0) g.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.8); else g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.8); } g.closePath(); g.fill(); if (edge) { g.globalAlpha = 1; g.strokeStyle = edge; g.lineWidth = 2.5; g.stroke(); } g.restore(); }
  function drip(g, x, y, len, w, color, alpha = 1) { g.save(); g.globalAlpha = alpha; g.fillStyle = color; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.35, y + len * 0.7, x, y + len); g.quadraticCurveTo(x + w * 0.35, y + len * 0.7, x + w, y); g.closePath(); g.fill(); g.restore(); }
  function comicText(g, txt, x, y, size, fill, { stroke = INK, drop = null, font = 'Impact, "Arial Black", sans-serif', maxW = 9999, skew = 0, lw = null, rot = 0 } = {}) { g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${size}px ${font}`; let s = size; while (g.measureText(txt).width > maxW && s > 8) { s -= 2; g.font = `${s}px ${font}`; } g.translate(x, y); g.rotate(rot); g.transform(1, 0, skew, 1, 0, 0); const w = lw ?? Math.max(3, s * 0.09); g.lineJoin = 'round'; if (drop) { g.strokeStyle = drop; g.lineWidth = w; g.strokeText(txt, s * 0.05, s * 0.07); } g.strokeStyle = stroke; g.lineWidth = w; g.strokeText(txt, 0, 0); g.fillStyle = fill; g.fillText(txt, 0, 0); g.restore(); }

  // Ground: concrete, worn at big scale. The bay lines are now separate, so they only appear where cars actually park.
  canvas('f1_ground', 1024, 1024, (g, W) => { g.fillStyle = '#5e5a55'; g.fillRect(0, 0, W, W); for (let i = 0; i < 60; i++) blob(g, rr(0, W), rr(0, W), rr(40, 150), pick(['#6a6660', '#524e4a', '#47433f']), 0.3); for (let i = 0; i < 3400; i++) { g.fillStyle = R() < 0.6 ? 'rgba(20,18,14,0.4)' : 'rgba(205,195,175,0.25)'; const r = rr(1, 4); g.fillRect(rr(0, W), rr(0, W), r, r); } for (let i = 0; i < 12; i++) crack(g, rr(40, W - 40), rr(40, W - 40), rr(0, 6.3), rr(90, 260), 2.6); for (let i = 0; i < 9; i++) blob(g, rr(0, W), rr(0, W), rr(18, 60), '#221e1a', 0.55); for (let i = 0; i < 7; i++) hatch(g, rr(0, W - 180), rr(0, W - 150), rr(90, 180), rr(70, 150), rr(-1.2, 1.2), 12, INK, 0.3, 2); for (const p of [0, 512]) { ink(g, p, 0, p, W, 4, 'rgba(10,8,10,0.75)', 1); ink(g, 0, p, W, p, 4, 'rgba(10,8,10,0.75)', 1); } });

  // Painted parking bays: one strip of ten bays, 2.8 m each, tinted per district in Godot (white paint here).
  canvas('f1_bays', 1024, 256, (g, W, H) => { g.fillStyle = '#f0ece0'; for (let i = 0; i <= 10; i++) { const x = 12 + i * 100; g.fillRect(x - 5, 0, 10, H); } g.fillRect(0, H - 10, W, 10); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(0,0,0,0.9)'; g.fillRect(rr(0, W), rr(0, H), rr(2, 9), rr(2, 8)); } });

  // Giant floor markings that name each district
  for (const [letter, color, sub] of [['A', '#d9423a', 'RED LEVEL'], ['B', '#3a8ad0', 'BLUE LEVEL'], ['C', '#d9b32a', 'NOBODY PARKS HERE'], ['D', '#49a860', 'GREEN LEVEL'], ['X', '#9a4ad0', 'STAFF ONLY']]) canvas('f1_level_' + letter.toLowerCase(), 1024, 1024, (g, W) => { g.strokeStyle = color; g.lineWidth = 40; g.beginPath(); g.arc(W / 2, W / 2, 440, 0, 7); g.stroke(); comicText(g, letter, W / 2, W / 2 - 60, 620, color, { stroke: color, lw: 2 }); comicText(g, sub, W / 2, W / 2 + 300, 92, color, { stroke: color, lw: 1, maxW: 720 }); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 2000; i++) { g.fillStyle = 'rgba(0,0,0,0.95)'; g.fillRect(rr(0, W), rr(0, W), rr(3, 22), rr(2, 16)); } });

  // Graffiti and warnings: the story of everyone who came through before you
  const spray = (name, w, h, draw) => canvas('f1_g_' + name, w, h, (g) => { draw(g, w, h); });
  const scrawl = (g, txt, x, y, s, c, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.font = `${s}px "Segoe Print", "Comic Sans MS", cursive`; g.textAlign = 'center'; g.fillStyle = c; g.fillText(txt, 0, 0); g.restore(); const m = s * 0.3; for (let i = 0; i < 4; i++) drip(g, x + rr(-s * 2.2, s * 2.2), y + 4, rr(m, m * 3), rr(1.5, 4), c); };
  spray('dont_look', 1024, 320, (g, W) => { scrawl(g, "DON'T LOOK AT THE BLUE LEVEL", W / 2, 170, 66, '#e8e0c8', -0.02); });
  spray('it_hears', 1024, 400, (g, W) => { comicText(g, 'IT HEARS', W / 2, 130, 150, '#c81a14', { stroke: '#3a0604', lw: 5 }); comicText(g, 'YOUR SLIPPERS', W / 2, 280, 104, '#c81a14', { stroke: '#3a0604', lw: 4, maxW: 880 }); for (let i = 0; i < 16; i++) drip(g, rr(100, W - 100), rr(180, 340), rr(30, 80), rr(3, 8), '#a81410'); });
  spray('tally', 768, 512, (g) => { g.lineCap = 'round'; for (let row = 0; row < 3; row++) for (let n = 0; n < 6; n++) { const ox = 60 + n * 112, oy = 70 + row * 150; for (let k = 0; k < 4; k++) ink(g, ox + k * 18, oy, ox + k * 18 + rr(-3, 3), oy + 96, 8, '#e0d8c0', 2); ink(g, ox - 12, oy + 76, ox + 74, oy + 14, 7, '#e0d8c0', 2); } scrawl(g, 'days', 660, 490, 40, '#e0d8c0'); });
  spray('dave', 1024, 256, (g, W) => { scrawl(g, 'DAVE WENT TO THE VENDING MACHINE', W / 2, 120, 50, '#7ad0e8', -0.01); scrawl(g, 'that was 3 days ago', W / 2 + 120, 200, 40, '#7ad0e8', 0.02); });
  spray('cone', 768, 768, (g, W) => { g.fillStyle = '#ea6714'; g.beginPath(); g.moveTo(W / 2, 40); g.lineTo(W / 2 + 200, 610); g.lineTo(W / 2 - 200, 610); g.closePath(); g.fill(); g.lineWidth = 16; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#f4ece0'; g.fillRect(W / 2 - 94, 250, 188, 74); g.strokeRect(W / 2 - 94, 250, 188, 74); g.fillStyle = '#ea6714'; g.fillRect(W / 2 - 280, 610, 560, 66); g.strokeRect(W / 2 - 280, 610, 560, 66); for (const s of [-1, 1]) { g.fillStyle = '#f5e65a'; g.beginPath(); g.arc(W / 2 + s * 62, 180, 30, 0, 7); g.fill(); g.lineWidth = 8; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(W / 2 + s * 62, 186, 12, 0, 7); g.fill(); } comicText(g, 'ALL HAIL', W / 2, 720, 62, '#ea6714', { lw: 3 }); });
  spray('claws', 768, 768, (g) => { for (let set = 0; set < 3; set++) { const x = rr(90, 420), y = rr(50, 280); for (let i = 0; i < 4; i++) { const a = x + i * 58, b = y + i * 7; g.fillStyle = '#0f0c0e'; g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + 42, b + 170, a + 64, b + 390); g.quadraticCurveTo(a + 12, b + 180, a, b); g.fill(); g.strokeStyle = '#9a9288'; g.lineWidth = 2; g.stroke(); } } });
  spray('arrow', 1024, 400, (g, W) => { g.fillStyle = '#e8e0c8'; g.beginPath(); g.moveTo(40, 150); g.lineTo(700, 130); g.lineTo(700, 50); g.lineTo(980, 200); g.lineTo(700, 350); g.lineTo(700, 270); g.lineTo(40, 250); g.closePath(); g.fill(); comicText(g, 'SAFE', 330, 200, 104, '#c81a14', { stroke: '#3a0604', lw: 2 }); ink(g, 200, 250, 560, 150, 12, '#c81a14', 3); scrawl(g, 'it lied', 800, 390, 44, '#c81a14'); });
  spray('marta', 1024, 512, (g, W) => { comicText(g, 'MARTA SAYS', W / 2, 120, 118, '#5ad86a', { stroke: '#0a3a12', lw: 3 }); comicText(g, 'STAY IN THE LIGHT', W / 2, 280, 118, '#ffffff', { stroke: '#0a3a12', lw: 4, maxW: 920 }); ink(g, 120, 370, 880, 370, 12, '#5ad86a', 3); });
  spray('hand', 512, 512, (g, W) => { const c = '#7a1a14'; blob(g, 256, 320, 110, c); for (const [x, y, a] of [[130, 130, -0.5], [210, 70, -0.15], [300, 70, 0.1], [380, 130, 0.45], [430, 300, 1.1]]) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.fillRect(-22, 0, 44, 180); g.restore(); } for (let i = 0; i < 7; i++) drip(g, rr(170, 350), 420, rr(30, 90), rr(4, 9), c); });

  // Signs on posts: official, cheerful and no help at all
  const sign = (name, bg, fg, a, b) => canvas('f1_s_' + name, 768, 512, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) blob(g, rr(0, W), rr(0, H), rr(30, 90), '#000', 0.08); hatch(g, 0, H * 0.7, W, H * 0.3, -0.8, 14, INK, 0.3, 2.4); comicText(g, a, W / 2, H * 0.36, 118, fg, { maxW: W - 70 }); comicText(g, b, W / 2, H * 0.72, 62, fg, { maxW: W - 70, lw: 3 }); g.lineWidth = 14; g.strokeStyle = INK; g.strokeRect(7, 7, W - 14, H - 14); for (let i = 0; i < 5; i++) drip(g, rr(20, W - 20), H - 18, rr(8, 28), rr(3, 6), '#3a1a0c', 0.8); });
  sign('blackout', '#d9b32a', '#16121a', 'NO LIGHTS', 'BEYOND THIS POINT · ENJOY!');
  sign('paybooth', '#3a6a9c', '#ffffff', 'PAY HERE', 'YOUR TICKET HAS EXPIRED. SO HAVE YOU.');
  sign('lostcar', '#2f7a5a', '#ffffff', 'LOST YOUR CAR?', 'IT FOUND SOMEONE ELSE.');
  sign('flooded', '#d9b32a', '#16121a', 'WET FLOOR', 'ALSO SOMETHING IN THE WET');
  sign('sinkhole', '#b4282a', '#ffffff', 'DANGER', 'HOLE. PLEASE ENJOY THE HOLE.');
  sign('zipline', '#e8c020', '#16121a', 'SERVICE LINE', 'STAFF ONLY · PRESS E TO BE STAFF');
  return out;
});
for (const [name, url] of Object.entries(painted)) fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('painted', Object.keys(painted).length);
await browser.close();
