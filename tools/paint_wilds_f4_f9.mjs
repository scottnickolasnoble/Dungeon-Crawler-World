// Paints the outdoor set dressing for Floors 4-9: stains, floor-themed graffiti, posters and signs.
// Output: godot/textures/wilds/f4_*.png to f9_*.png
//   node tools/paint_wilds_f4_f9.mjs
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
  let seed = 717171; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const rr = (a, b) => a + (b - a) * R();
  const canvas = (name, w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); out[name] = c.toDataURL('image/png'); };
  function ink(g, x1, y1, x2, y2, w = 3, color = INK, wob = 2) { const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.ceil(len / 22)), nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1); const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, o = i === 0 || i === n ? 0 : rr(-wob, wob); pts.push([x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o]); } g.strokeStyle = color; g.lineCap = 'round'; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; g.lineWidth = w * (0.45 + 0.75 * Math.sin(t * Math.PI)); g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke(); } }
  function hatch(g, x, y, w, h, angle = -0.8, gap = 9, color = INK, alpha = 0.5, lw = 1.7) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha = alpha; const d = Math.hypot(w, h), cx = x + w / 2, cy = y + h / 2, c = Math.cos(angle), s = Math.sin(angle); for (let o = -d; o < d; o += gap * rr(0.75, 1.25)) ink(g, cx - s * o - c * d * rr(0.5, 1), cy + c * o - s * d * rr(0.5, 1), cx - s * o + c * d * rr(0.5, 1), cy + c * o + s * d * rr(0.5, 1), lw, color, 0.8); g.restore(); }
  function blob(g, x, y, r, color, alpha = 1, edge = null) { g.save(); g.globalAlpha = alpha; g.fillStyle = color; g.beginPath(); const n = 18; for (let i = 0; i <= n; i++) { const a = (i / n) * 6.283, q = r * rr(0.6, 1.25); if (i === 0) g.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.85); else g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.85); } g.closePath(); g.fill(); if (edge) { g.globalAlpha = 1; g.strokeStyle = edge; g.lineWidth = 3; g.stroke(); } g.restore(); }
  function drip(g, x, y, len, w, color, alpha = 1) { g.save(); g.globalAlpha = alpha; g.fillStyle = color; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.35, y + len * 0.7, x, y + len); g.quadraticCurveTo(x + w * 0.35, y + len * 0.7, x + w, y); g.closePath(); g.fill(); g.restore(); }
  function comicText(g, txt, x, y, size, fill, { stroke = INK, font = 'Impact, "Arial Black", sans-serif', maxW = 9999, skew = 0, lw = null, rot = 0 } = {}) { g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${size}px ${font}`; let s = size; while (g.measureText(txt).width > maxW && s > 8) { s -= 2; g.font = `${s}px ${font}`; } g.translate(x, y); g.rotate(rot); g.transform(1, 0, skew, 1, 0, 0); g.lineJoin = 'round'; g.strokeStyle = stroke; g.lineWidth = lw ?? Math.max(3, s * 0.09); g.strokeText(txt, 0, 0); g.fillStyle = fill; g.fillText(txt, 0, 0); g.restore(); }
  const scrawl = (g, txt, x, y, s, c, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.font = `${s}px "Segoe Print", "Comic Sans MS", cursive`; g.textAlign = 'center'; g.fillStyle = c; g.fillText(txt, 0, 0); g.restore(); const m = s * 0.3; for (let i = 0; i < 6; i++) drip(g, x + rr(-s * 3, s * 3), y + 4, rr(m, m * 3.4), rr(1.5, 4.5), c); };

  // blood and worse, as hard-edged inked shapes, because it is a comic and shouldn't look like a photo
  for (const [name, c1, c2] of [['stain_a', '#6e120e', '#3a0806'], ['stain_b', '#8a1a14', '#4a0c08'], ['drag', '#6e120e', '#3a0806']]) for (const f of ['f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18']) canvas(`${f}_${name}`, 1024, 1024, (g, W) => { if (name === 'drag') { for (let i = 0; i < 9; i++) { const x = 300 + i * 46 + rr(-14, 14); g.fillStyle = c1; g.beginPath(); g.moveTo(x, 40); g.bezierCurveTo(x + rr(-40, 40), 300, x + rr(-40, 40), 700, x + rr(-16, 16), rr(740, 980)); g.lineTo(x + 26, 40); g.closePath(); g.fill(); } blob(g, 512, 110, 200, c1, 1, INK); blob(g, 500, 100, 100, c2); return; } blob(g, W / 2, W / 2, 300, c1, 1, INK); blob(g, W / 2 + 30, W / 2 - 10, 170, c2); for (let i = 0; i < 26; i++) { const a = rr(0, 6.3), d = rr(330, 480); blob(g, W / 2 + Math.cos(a) * d, W / 2 + Math.sin(a) * d, rr(6, 30), c1, 1); } hatch(g, 300, 300, 400, 400, -0.8, 14, INK, 0.35, 2.4); });

  const gr = (f, name, w, h, draw) => canvas(`${f}_g_${name}`, w, h, draw);
  const sign = (f, name, bg, fg, a, b) => canvas(`${f}_s_${name}`, 768, 512, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) blob(g, rr(0, W), rr(0, H), rr(30, 90), '#000', 0.08); hatch(g, 0, H * 0.7, W, H * 0.3, -0.8, 14, INK, 0.3, 2.4); comicText(g, a, W / 2, H * 0.36, 112, fg, { maxW: W - 70 }); comicText(g, b, W / 2, H * 0.72, 56, fg, { maxW: W - 70, lw: 3 }); g.lineWidth = 14; g.strokeStyle = INK; g.strokeRect(7, 7, W - 14, H - 14); for (let i = 0; i < 5; i++) drip(g, rr(20, W - 20), H - 18, rr(8, 28), rr(3, 6), '#3a1a0c', 0.8); });

  // big painted words, with a smaller line under them
  const shout = (f, name, a, b, c = '#c81a14', edge = '#3a0604') => gr(f, name, 1024, 400, (g, W) => { comicText(g, a, W / 2, b ? 130 : 200, b ? 112 : 170, c, { stroke: edge, lw: 3, maxW: 930 }); if (b) comicText(g, b, W / 2, 275, 74, c, { stroke: edge, lw: 2, maxW: 880 }); for (let i = 0; i < 20; i++) drip(g, rr(60, W - 60), rr(b ? 300 : 260, 320), rr(20, 70), rr(2, 6), c); });
  // handwriting, a line at a time; the last line in red
  const note = (f, name, lines, c = '#2a2a34') => gr(f, name, 1024, 120 + lines.length * 90, (g, W) => lines.forEach((t, i) => scrawl(g, t, W / 2 + rr(-40, 40), 90 + i * 90, 54, i === lines.length - 1 && lines.length > 1 ? '#a81a14' : c, rr(-0.02, 0.02))));
  // a MISSING poster: someone's own shape, and a line of small print
  const poster = (f, name, top, foot, paper = '#f0e8c8') => gr(f, name, 768, 576, (g, W) => { g.fillStyle = paper; g.fillRect(40, 30, W - 80, 500); g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(40, 30, W - 80, 500); comicText(g, top, W / 2, 95, 84, '#c81a14', { lw: 3, maxW: W - 120 }); g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(W / 2, 240, 82, 92, 0, 0, 7); g.fill(); g.fillRect(W / 2 - 112, 325, 224, 90); g.fillStyle = paper; for (const s of [-1, 1]) { g.beginPath(); g.arc(W / 2 + s * 30, 225, 15, 0, 7); g.fill(); } comicText(g, foot, W / 2, 470, 34, '#16121a', { lw: 1.5, maxW: W - 120 }); });
  // many red handprints
  const hands = (f, name, c = '#8a1a14') => gr(f, name, 1024, 640, (g) => { for (let i = 0; i < 14; i++) { const x = rr(60, 960), y = rr(70, 570); g.save(); g.translate(x, y); g.rotate(rr(-0.8, 0.8)); g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, 32, 38, 0, 0, 7); g.fill(); for (let k = 0; k < 4; k++) { g.save(); g.translate(-24 + k * 16, -30); g.rotate(-0.25 + k * 0.17); g.fillRect(-6, -44, 12, 46); g.restore(); } g.save(); g.translate(30, -2); g.rotate(1.1); g.fillRect(-6, -34, 12, 36); g.restore(); g.restore(); drip(g, x, y + 20, rr(20, 110), rr(3, 8), c); } });

  // FLOOR 4: the Endless Mall
  shout('f4', 'sale', 'EVERYTHING MUST GO', 'YOU TOO', '#e8398c', '#3a0620');
  shout('f4', 'returns', 'NO RETURNS');
  shout('f4', 'mother', 'MOTHER IS NOT ANGRY', 'COME TO THE CENTRE', '#a81a14');
  note('f4', 'lost', ['will the parents of the lost child', 'please stop looking', 'she has been found. she is very happy here']);
  note('f4', 'clerk', ['i have worked here for 11 years', 'i have never found the way out', 'the fountain is new. the fountain is not new'], '#3a2a5a');
  hands('f4', 'hands');
  poster('f4', 'missing', 'HAVE YOU SEEN', 'ASK AT SECURITY. THEY HAVE SEEN HIM.');
  sign('f4', 'grotto', '#a81e22', '#ffffff', "SANTA'S GROTTO", 'HE KNOWS IF YOU HAVE BEEN BAD. IT IS JUNE.');
  sign('f4', 'rides', '#f5c518', '#16121a', 'KIDDIE RIDES', 'FREE TODAY. FREE EVERY DAY. GET ON.');
  sign('f4', 'fountain', '#3a8aa0', '#ffffff', 'WISHING WELL', 'YOUR TEETH GO TO CHARITY');
  sign('f4', 'pulse', '#7a1c28', '#ffe8e8', 'THE ATRIUM', 'PLEASE KEEP WALKING TOWARDS THE SOUND');
  sign('f4', 'train', '#d8302a', '#ffffff', 'MALL TRAIN', 'BACK CARRIAGE RESERVED');
  sign('f4', 'duct', '#a85a64', '#ffffff', 'STAFF ONLY', 'THE WALLS ARE SOFT. THIS IS NORMAL.');
  sign('f4', 'dummies', '#25233f', '#fff0a8', 'NEW SEASON', 'THE MODELS MOVE WHEN YOU DO NOT LOOK');
  sign('f4', 'photo', '#3a6ab0', '#ffffff', '4 POSES', 'THE FOURTH IS BEHIND YOU');
  for (const [name, bg, fg, t] of [['pretz', '#e8882a', '#fff4d0', 'HOT PRETZ'], ['tan', '#c8882a', '#fff0d0', 'TAN-O-RAMA'], ['smile', '#3ab0c8', '#ffffff', 'SMILES DENTAL'], ['body', '#a81e22', '#ffffff', 'THE BODY SHOP'], ['wrap', '#e8398c', '#ffffff', 'GIFT WRAP'], ['deal', '#25233f', '#ffe84a', 'DEALS DEALS DEALS'], ['kids', '#6ac870', '#16121a', 'KIDS GO FREE'], ['meat', '#d8302a', '#ffffff', 'MEAT ON A STICK']]) canvas('f4_brand_' + name, 1024, 180, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); comicText(g, t, W / 2, H / 2, 120, fg, { maxW: W - 60, lw: 5 }); });

  // FLOOR 5: Suburbia Infinite
  shout('f5', 'love', 'WE LOVE IT HERE', 'WE LOVE IT HERE WE LOVE IT', '#2a4a7a', '#0c1a30');
  shout('f5', 'lawn', 'KEEP OFF THE GRASS', 'IT IS STILL GROWING');
  note('f5', 'note', ['welcome neighbour!', 'we saw you arrive', 'we see you now'], '#2a4a7a');
  note('f5', 'kids', ['MOMMY IS IN THE GARDEN', 'DADDY IS IN THE GARDEN', 'i am in the garden'], '#3a7a3a');
  poster('f5', 'missing', 'MISSING', 'THE HENDERSONS. HAVE YOU SEEN THEM? THEY HAVE SEEN YOU.');
  poster('f5', 'violation', 'VIOLATION', 'YOUR FACE. CORRECT WITHIN 7 DAYS.', '#f8f0a0');
  sign('f5', 'open', '#3a7a3a', '#ffffff', 'OPEN HOUSE', 'STAY. STAY. STAY. STAY.');
  sign('f5', 'hoa', '#f4f1e8', '#2a4a7a', 'HOA NOTICE', 'SMILE FROM THE STREET AT ALL TIMES');
  sign('f5', 'gnomes', '#c8302a', '#ffffff', 'GNOME GARDEN', 'THEY WERE NOT THERE WHEN YOU CAME IN');
  sign('f5', 'party', '#e8398c', '#ffffff', 'BLOCK PARTY', 'BRING A DISH. BE A DISH.');
  sign('f5', 'pool', '#3a8ad0', '#ffffff', 'POOL RULES', 'NO DIVING. NO RUNNING. NO COMING UP.');
  sign('f5', 'cart', '#f4f1e8', '#16121a', 'HOA PATROL', 'PLEASE REPORT YOURSELF');
  sign('f5', 'drain', '#6a7078', '#ffffff', 'STORM DRAIN', 'WE DUMP NOTHING. IT COMES OUT BY ITSELF.');
  sign('f5', 'pines', '#f4f1e8', '#3a7a3a', 'SMILEY PINES', 'POPULATION: YES');
  canvas('f5_mow_you', 1024, 512, (g, W, H) => { comicText(g, 'YOU', W / 2, H / 2, 420, 'rgba(120,180,70,0.92)', { stroke: 'rgba(40,80,30,0.8)', lw: 6, maxW: W - 40 }); });

  // FLOOR 6: the Canopy
  shout('f6', 'trophy', 'BAG LIMIT: NONE', 'SEASON 6. GOOD HUNTING.', '#e8d8a0', '#2a1a08');
  shout('f6', 'run', 'DO NOT RUN', 'THEY LIKE IT', '#c81a14');
  note('f6', 'note', ['i heard the jeep again', 'i have stopped washing so they can\'t smell me', 'the plants can tell anyway'], '#e0d8a8');
  note('f6', 'tally', ['|||| |||| |||| |||| ||||', '|||| |||| ||||', 'stop counting'], '#e0d8a8');
  poster('f6', 'wanted', 'HUNTING TODAY', 'YOUR LICENCE WAS ISSUED BY THE ANIMAL', '#d8c890');
  hands('f6', 'hands', '#6e120e');
  sign('f6', 'trail', '#7a7040', '#f8f0c8', 'TROPHY WALK', 'PLEASE DO NOT TOUCH THE EXHIBITS');
  sign('f6', 'safari', '#b09a6a', '#16121a', 'GLIMMERKIN SAFARI', 'YOU ARE THE EXPERIENCE');
  sign('f6', 'hollow', '#2f4a2a', '#d8ffc8', 'HAG HOLLOW', 'MIND THE CHIMES. THEY ARE LISTENING.');
  sign('f6', 'garden', '#a8263a', '#ffffff', 'DO NOT FEED', 'THEY HAVE BEEN FED');
  sign('f6', 'kennel', '#5a5a60', '#ffffff', 'THE KENNELS', 'GOOD BOYS. ALL OF THEM. NOW.');
  sign('f6', 'jeep', '#7a7040', '#ffffff', 'JEEP TOUR', 'KEEP ARMS INSIDE. OR DON\'T.');
  sign('f6', 'roots', '#4a3626', '#e0ffd0', 'THE UNDERROOTS', 'THEY GROW TOWARDS WARM THINGS');
  sign('f6', 'photo', '#c8a860', '#16121a', 'PHOTO OPPORTUNITY', 'PUT YOUR HEAD THROUGH. GO ON.');

  // FLOOR 7: the Drowned Cistern
  shout('f7', 'rent', 'RENT IS DUE', 'RENT WAS ALWAYS DUE', '#c81a14');
  shout('f7', 'low', 'THE WATER WAS LOWER', 'YESTERDAY', '#a8e0d0', '#0c2a24');
  note('f7', 'tide', ['high tide 4pm', 'high tide 4pm', 'it isn\'t a tide'], '#a8e0d0');
  note('f7', 'tenant', ['dear landlord, the ceiling is leaking', 'dear landlord, the ceiling is on the floor', 'dear landlord, i am writing this from the ceiling'], '#d8e8d8');
  poster('f7', 'eviction', 'EVICTION', 'BY ORDER. YOU HAVE ALREADY LEFT. YOU JUST DON\'T KNOW IT.');
  hands('f7', 'hands', '#2e5a4a');
  sign('f7', 'ferry', '#27403c', '#d8f0e0', 'CHAIN FERRY', 'NAN IS NOT DRIVING. DO NOT ASK WHO IS.');
  sign('f7', 'baths', '#f0ece0', '#16121a', 'PUBLIC BATHS', 'MRS BATHWATER IS IN. SHE IS ALWAYS IN.');
  sign('f7', 'tenements', '#5a4a42', '#ffffff', 'TENEMENT ROW', 'FLOORS 1 AND 2 NOW OFFER WATER VIEWS');
  sign('f7', 'organ', '#b8944a', '#16121a', 'THE ORGAN LOFT', 'IT IS NOT THE WIND');
  sign('f7', 'barge', '#2a2a30', '#d8ffa0', 'LANDFILL BARGE', 'THE KING ACCEPTS ALL WASTE');
  sign('f7', 'wyrm', '#d8cfb4', '#16121a', 'OLD NED', 'A VERY LARGE EEL. WE THINK THIS IS ALL OF HIM.');
  sign('f7', 'drain', '#3e5a50', '#ffffff', 'MAIN DRAIN', 'THE WATER GOES HERE. SO WILL YOU.');
  sign('f7', 'hands', '#2e5a4a', '#ffffff', 'SHALLOWS', 'WAVE BACK. IT IS ONLY POLITE.');

  // FLOOR 8: the Workings
  shout('f8', 'dig', 'DIG', 'DIG DIG DIG DIG DIG DIG', '#f4d8a0', '#2a1c0a');
  shout('f8', 'fresh', 'FRESH OIL', 'CHANGED EVERY 90 YEARS', '#e8a040', '#3a1c04');
  note('f8', 'shift', ['shift 1: 11 down, 11 up', 'shift 2: 11 down, 11 up', 'shift 3: 11 down, 12 up'], '#f0e0b8');
  note('f8', 'mold', ['she told me to rest', 'she told me i was doing so well', 'she is so soft, so warm, you should come'], '#c8d8a8');
  poster('f8', 'repo', 'REPOSSESSED', 'YOUR ARMS ARE OVERDUE. PLEASE LEAVE THEM OUT.');
  hands('f8', 'hands', '#c89a3a');
  sign('f8', 'cart', '#3a2616', '#f4d8a0', 'MAN RIDING', 'MIND YOUR HEAD. WE HAVE TOO MANY ALREADY.');
  sign('f8', 'fryers', '#c89a3a', '#16121a', 'THE FRYERS', 'BATTERED TO ORDER');
  sign('f8', 'repo', '#b8944a', '#16121a', 'REPO YARD', 'WE TAKE WHAT YOU OWE');
  sign('f8', 'chapel', '#5a3a2a', '#ffe8c0', 'THE DRILL CHAPEL', 'DOWN IS HOLY');
  sign('f8', 'nursery', '#d8d8a8', '#3a4a2a', 'THE NURSERY', 'SHH. EVERYTHING HERE IS GROWING.');
  sign('f8', 'seam', '#3a2c22', '#ffd88a', 'NO DIGGING', 'THIS SEAM IS LOOKING BACK');
  sign('f8', 'stack', '#8a4a2a', '#ffffff', 'NO. 4 STACK', 'FUEL: SEE ROSTER');
  sign('f8', 'shaft', '#5a4032', '#ffffff', 'OLD GALLERIES', 'CLOSED SINCE THE COUNT WAS WRONG');

  // FLOOR 9: the Undercity
  shout('f9', 'vote', 'VOTE RAT', 'YOU ALREADY HAVE', '#d8a838', '#2a1a04');
  shout('f9', 'city', 'A GREAT CITY', 'A GREAT CITY A GREAT CITY', '#5aa08a', '#0c2a24');
  note('f9', 'senate', ['motion to eat the minority', 'seconded', 'carried. it has been carried away.'], '#efe6c8');
  note('f9', 'metro', ['next train: now', 'next train: now', 'it does not stop for you. you stop for it.'], '#efe6c8');
  poster('f9', 'candidate', 'RE-ELECT', 'THE UNDERMAYOR. HE WAS NEVER ELECTED. THAT IS HOW GOOD HE IS.', '#e8d8f0');
  hands('f9', 'tails', '#5a4a44');
  sign('f9', 'senate', '#6a2a7a', '#efe6c8', 'THE SENATE', 'PUBLIC GALLERY. YOU ARE ON THE AGENDA.');
  sign('f9', 'vault', '#7a7a80', '#ffffff', 'THE VAULT', 'YOUR SAVINGS ARE SAFE. IT IS YOU WHO ARE NOT.');
  sign('f9', 'opera', '#7a2a5a', '#ffffff', 'THE OPERA', 'TONIGHT AND EVERY NIGHT. NO INTERVAL. NO EXIT.');
  sign('f9', 'metro', '#1a2a24', '#e8e0b0', 'METROPOLITAIN', 'ALL LINES CLOSED. ALL LINES RUNNING.');
  sign('f9', 'hall', '#8a8676', '#16121a', 'CITY HALL', 'PLEASE TAKE A NUMBER. YOUR NUMBER IS UP.');
  sign('f9', 'throne', '#5a4a44', '#ffd88a', 'THE THRONE', 'KNEEL. THEY ARE ALREADY UNDER YOU.');
  sign('f9', 'lantern', '#3a4a44', '#ffefc0', 'THE FOUNDER', 'HE STILL LIGHTS THE WAY. HE IS STILL LIT.');
  sign('f9', 'cathedral', '#d8d0b0', '#3a2a4a', 'SPORE CATHEDRAL', 'BREATHE DEEP, SISTER. SING.');
  // FLOORS 10-18 (art/WORLD.md): the graffiti each floor's tag walls ask for
  shout('f10', 'quiet', 'QUIET ON SET', 'WE ARE ALWAYS ROLLING', '#c81a14');
  shout('f10', 'smile', 'SMILE', 'YOU ARE ON CAMERA', '#f5c518', '#3a2a04');
  shout('f10', 'take', 'TAKE 9,999', 'AGAIN. FROM THE TOP.', '#e8e8e8', '#16121a');
  note('f10', 'extras', ['the extras never go home', 'they stand where they were put', 'one of them waved at me'], '#e8d8c8');
  shout('f11', 'chant', 'WHO ARE YA', 'WHO ARE YA WHO ARE YA', '#e8398c', '#3a0620');
  shout('f11', 'away', 'AWAY END', 'NO WAY BACK', '#34b8c4', '#062a30');
  note('f11', 'ref', ['the ref is blind', 'the ref is deaf', 'the ref is behind you'], '#ffffff');
  shout('f11', 'final', 'THE FINAL', 'IS EVERY MATCH', '#f5c518', '#3a2a04');
  shout('f12', 'laugh', 'HA HA HA HA', 'HA HA HA HA HA HA HA', '#ffd0e0', '#3a0a20');
  shout('f12', 'places', 'PLACES PLEASE', 'FIVE MINUTES. FOREVER.', '#f5c518', '#3a2a04');
  shout('f12', 'smile', 'KEEP SMILING', 'THEY CAN TELL', '#e8e8e8', '#16121a');
  note('f12', 'contract', ['i signed for one season', 'this is my ninth', 'read clause 12. READ CLAUSE 12'], '#ffe0f0');
  shout('f13', 'shh', 'SHHHH', 'IT CAN HEAR PAGES TURN', '#e8d8a8', '#2a1a04');
  shout('f13', 'overdue', 'OVERDUE', 'FINE: EVERYTHING', '#c81a14');
  note('f13', 'index', ['i looked myself up in the index', 'i am filed under SOON', 'see also: everyone'], '#efe6c8');
  shout('f13', 'you', 'THERE IS A BOOK', 'WITH YOUR NAME ON IT', '#e8d8a8', '#2a1a04');
  shout('f14', 'turnback', 'TURN BACK', 'TURN BACK TURN BACK', '#c81a14');
  shout('f14', 'count', 'THE COUNT', 'NEVER STOPPED ACTING', '#c8d0d8', '#0c1018');
  note('f14', 'season9', ['season 9 was cancelled', 'nobody told the castle', 'nobody told the cast'], '#c8d0d8');
  note('f14', 'maid', ['the maid in the portrait', 'looks just like marta', 'she was younger then. so was the castle.'], '#e8d8a8');
  shout('f15', 'backup', 'BACKED UP', 'EVERYONE. ALWAYS.', '#8ad8ff', '#062030');
  shout('f15', 'cold', 'KEEP IT COLD', 'OR IT WAKES', '#e0f4ff', '#0a1420');
  note('f15', 'recorded', ['it recorded my first day', 'it recorded my last day', 'i haven\'t had my last day yet'], '#e0f4ff');
  shout('f15', 'deleted', 'NOTHING IS DELETED', 'NOTHING', '#c81a14');
  shout('f16', 'onair', 'ON AIR', 'ON AIR ON AIR ON AIR', '#ff3a3a', '#300606');
  shout('f16', 'static', 'SHHHHHHHHHHHHH', 'SHE IS SINGING', '#c8c8ff', '#0e0e20');
  note('f16', 'signal', ['the signal goes down', 'not out', 'it goes DOWN'], '#e8e8ff');
  shout('f16', 'off', 'THERE IS AN OFF SWITCH', 'ASK THE ENGINEER', '#f5c518', '#3a2a04');
  shout('f17', 'welcome', 'WELCOME HOME', 'WE KEPT YOUR ROOM', '#2a4a7a', '#0c1a30');
  note('f17', 'dinner', ['mum says dinner at six', 'it has been six for fifty years', 'the gravy is still warm'], '#2a4a7a');
  shout('f17', 'winner', 'EVERY WINNER', 'BECOMES THE HOST', '#c84a3a', '#300c08');
  shout('f17', 'mum', 'I\'LL BE HOME', 'FOR DINNER', '#2a4a7a', '#0c1a30');
  shout('f18', 'choose', 'CHOOSE', 'THEY COULDN\'T', '#3a3a38', '#d8d8d4');
  shout('f18', 'builders', 'WE WERE HERE FIRST', 'WE ARE STILL HERE', '#3a3a38', '#d8d8d4');
  note('f18', 'door', ['there is a door', 'there was always a door', 'it opens from this side'], '#3a3a38');
  note('f18', 'first', ['contestant 0001', 'fans: 1', 'it was them watching. it was always them.'], '#3a3a38');
  return out;
});
for (const [name, url] of Object.entries(painted)) fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('painted', Object.keys(painted).length);
await browser.close();
