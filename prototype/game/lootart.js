// Procedural loot art: every item gets its own painted icon, drawn from what it is (name/slot/kind), its
// family (scrap, arcane, kitchen…), its stats (fire adds flames, frost adds ice, gems match the affix) and its
// rarity (glow, sparkles). Seeded by the item's uid, so two "Stop-Sign Axes" still look a little different.
const INK = '#0d0b12';
const RAR = { junk: '#8a8a8a', common: '#d8d2c0', uncommon: '#5ad86a', rare: '#4a9aff', epic: '#b46cff', legendary: '#ff9a2a' };
const FAM = {
  scrap: { a: '#a86a3a', b: '#7a7c80', c: '#c8501e', wear: 0.9 }, arcane: { a: '#6a3aa8', b: '#2a2a6a', c: '#e8c040', wear: 0.1 }, elemental: { a: '#c8401e', b: '#3a2a2a', c: '#ffb040', wear: 0.2 },
  kitchen: { a: '#c8ccd2', b: '#7a5a3a', c: '#e8e4dc', wear: 0.4 }, sports: { a: '#2a6ac8', b: '#e8e8e8', c: '#e83a3a', wear: 0.3 }, work: { a: '#e8c020', b: '#2a2a2a', c: '#ff8a1a', wear: 0.6 },
  medical: { a: '#4ab8a8', b: '#e8f0f0', c: '#e83a4a', wear: 0.1 }, silly: { a: '#ff7ac8', b: '#ffe040', c: '#5ad8ff', wear: 0.2 }, crafted: { a: '#8a6a4a', b: '#5a5a62', c: '#c8a050', wear: 0.4 },
  cloth: { a: '#7a4a8a', b: '#c8b890', c: '#e8c040', wear: 0.2 }, jewel: { a: '#e8c040', b: '#c8ccd2', c: '#e83a8a', wear: 0 }, gadget: { a: '#3ac8ff', b: '#4a4a52', c: '#ffd040', wear: 0.3 }, trophy: { a: '#e8590c', b: '#f0f0f0', c: '#ffd020', wear: 0.2 },
};
const GEM = { fire: '#ff4a1a', frost: '#7ae8ff', storm: '#ffe040', tide: '#2a8aff', light: '#fff4c0', shadow: '#5a2a8a', INT: '#a85aff', WIS: '#3ac8a8', STR: '#e83a3a', DEX: '#5ad86a', CON: '#e8903a', CHA: '#ff7ac8', crit: '#ffd040', hp: '#e83a4a', mana: '#3a7aff', spell: '#c86aff' };

function rngFrom(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }
const hashStr = (t) => { let h = 2166136261; for (const c of String(t)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.max(0, Math.min(255, r * k)); g = Math.max(0, Math.min(255, g * k)); b = Math.max(0, Math.min(255, b * k)); return `rgb(${r | 0},${g | 0},${b | 0})`; };

// which drawing to use, from the item's name and slot
function archetype(it) {
  const n = (it.name || '').toLowerCase(), k = it.kind, s = it.slot;
  if (k === 'box') return 'box'; if (k === 'book') return 'book';
  if (k === 'consumable') { const e = it.effect || {}; if (e.bomb) return /cone/.test(n) ? 'coneBomb' : /mine|trap|net/.test(n) ? 'mine' : /firework|rocket|popper|confetti/.test(n) ? 'rocket' : 'bomb'; if (e.turret) return 'turret'; if (e.map) return 'map'; if (e.scroll || e.recall || /scroll|pitch/.test(n)) return 'scroll'; if (e.bag || /backpack|bag/.test(n)) return 'bag'; if (/kit/.test(n)) return 'kit'; if (e.hunger && e.hunger >= (e.thirst || 0)) return /pie|tart|loaf|bar|doughnut|crisps|omelette|dumpling/.test(n) ? 'pie' : /skewer|jerky|kebab/.test(n) ? 'skewer' : 'bowl'; if (e.thirst && !e.hp && !e.mana) return /tea|coffee|cocoa/.test(n) ? 'mug' : /soda|fizz|lemonade|sparkling|electrolyte/.test(n) ? 'can' : 'bottle'; return 'potion'; }
  if (s === 'main') return /wand/.test(n) ? 'wand' : /staff|torch staff/.test(n) ? 'staff' : /axe/.test(n) ? 'axe' : /spear/.test(n) ? 'spear' : /chakram|hubcap/.test(n) ? 'chakram' : /wrench/.test(n) ? 'wrench' : /crowbar/.test(n) ? 'crowbar' : /mace|ladle/.test(n) ? 'mace' : /hammer/.test(n) ? 'hammer' : /dagger/.test(n) ? 'dagger' : /crossbow/.test(n) ? 'crossbow' : /bow/.test(n) ? 'bow' : 'sword';
  if (s === 'off') return /orb|globe/.test(n) ? 'orb' : /tome|book/.test(n) ? 'tome' : /torch/.test(n) ? 'torch' : /lantern/.test(n) ? 'lantern' : /hook/.test(n) ? 'hook' : 'shield';
  if (s === 'head') return /cone/.test(n) ? 'coneHelm' : /wizard|hood/.test(n) ? 'wizardHat' : /hard hat/.test(n) ? 'hardHat' : /colander/.test(n) ? 'colander' : /circlet|crown/.test(n) ? 'circlet' : /hockey|mask/.test(n) ? 'hockeyMask' : /bandana/.test(n) ? 'bandana' : 'helm';
  if (s === 'face') return /goggle/.test(n) ? 'goggles' : /monocle/.test(n) ? 'monocle' : /visor/.test(n) ? 'visor' : 'mask';
  if (s === 'shoulders') return /duck/.test(n) ? 'duckPads' : 'pauldrons';
  if (s === 'chest') return /robe/.test(n) ? 'robe' : /apron/.test(n) ? 'apron' : /vest|scrubs|jacket/.test(n) ? 'vest' : 'cuirass';
  if (s === 'back') return /jetpack/.test(n) ? 'jetpack' : 'cloak';
  if (s === 'bracers') return 'bracers'; if (s === 'gloves') return /mitt/.test(n) ? 'mitt' : 'gloves'; if (s === 'belt') return 'belt';
  if (s === 'legs') return /shorts/.test(n) ? 'shorts' : 'trousers';
  if (s === 'boots') return /skate/.test(n) ? 'skates' : /sandal/.test(n) ? 'sandals' : 'boots';
  if (s === 'ring1' || s === 'ring2') return 'ring'; if (s === 'amulet') return /bottle-cap|cap/.test(n) ? 'capAmulet' : /lanyard/.test(n) ? 'lanyard' : 'amulet';
  return 'box';
}

const cache = new Map();
export function itemArt(it, size = 96) {
  const key = `${it.uid}|${it.name}|${(it.tags || []).length}|${size}`; if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const R = rngFrom(hashStr(it.name) ^ (it.uid || 7) * 2654435761); const fam = FAM[it.family] || FAM.crafted; const rar = RAR[it.rarity] || RAR.common;
  const stats = it.stats || {}; const keys = Object.keys(stats);
  const gemKey = keys.find((k) => GEM[k] && !['hp', 'mana'].includes(k)) || keys.find((k) => GEM[k]);
  const gem = gemKey ? GEM[gemKey] : fam.c;
  const hue = (h) => shade(h, 0.85 + R() * 0.3);
  const A = hue(fam.a), B = hue(fam.b), Cc = fam.c;
  // background: rarity glow
  const bg = g.createRadialGradient(64, 60, 6, 64, 64, 70); bg.addColorStop(0, shade(rar, 0.55)); bg.addColorStop(1, '#14101a'); g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  if (it.rarity === 'legendary' || it.rarity === 'epic') { g.save(); g.translate(64, 64); g.globalAlpha = 0.18; g.fillStyle = rar; for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, -70); g.lineTo(6, -70); g.fill(); } g.restore(); }
  g.lineJoin = 'round'; g.lineCap = 'round';
  // drawing helpers: every shape gets the thick ink outline
  const P = (pts, fill, w = 4.5) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = w; g.stroke(); };
  const Rr = (x, y, w, h, r, fill, lw = 4.5) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); };
  const E = (x, y, rx, ry, fill, lw = 4.5, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); } };
  const L = (pts, w = 4, col = INK) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const shine = (x, y, w, h) => { g.globalAlpha = 0.35; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, w, h, -0.5, 0, 7); g.fill(); g.globalAlpha = 1; };
  const rivets = (pts) => pts.forEach(([x, y]) => E(x, y, 2.6, 2.6, '#d8d8d8', 1.5));
  const grime = (n) => { if (fam.wear < 0.3) return; g.globalAlpha = 0.25 * fam.wear; for (let i = 0; i < n; i++) { g.fillStyle = R() < 0.5 ? '#3a1a08' : '#6a3a18'; g.beginPath(); g.arc(30 + R() * 68, 30 + R() * 68, 1 + R() * 4, 0, 7); g.fill(); } g.globalAlpha = 1; };
  const gemAt = (x, y, r) => { E(x, y, r, r, gem, 3); shine(x - r * 0.3, y - r * 0.35, r * 0.4, r * 0.25); };
  const stripes = (x, y, w, h, c1, c2, n = 4) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); for (let i = -2; i < n * 2; i++) { g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.moveTo(x + i * (w / n), y); g.lineTo(x + (i + 1) * (w / n), y); g.lineTo(x + (i + 1) * (w / n) - h * 0.6, y + h); g.lineTo(x + i * (w / n) - h * 0.6, y + h); g.fill(); } g.restore(); };
  const t = archetype(it); const j = (a) => a + (R() - 0.5) * 6;

  const draw = {
    sword() { g.save(); g.translate(64, 64); g.rotate(-0.78); const len = 70 + R() * 14; P([[-6, -len / 2], [0, -len / 2 - 10], [6, -len / 2], [6, 18], [-6, 18]], B); L([[0, -len / 2 - 4], [0, 14]], 2, 'rgba(255,255,255,.5)'); Rr(-18, 16, 36, 8, 3, Cc); Rr(-4.5, 24, 9, 22, 3, A); gemAt(0, 50, 5); g.restore(); },
    dagger() { g.save(); g.translate(64, 64); g.rotate(-0.78); P([[-7, -30], [0, -44], [7, -30], [6, 8], [-6, 8]], B); Rr(-14, 6, 28, 7, 3, Cc); Rr(-4, 13, 8, 18, 3, A); gemAt(0, 34, 4); g.restore(); },
    axe() { g.save(); g.translate(64, 64); g.rotate(-0.6); Rr(-4, -40, 8, 86, 3, '#8a6a4a'); if (/stop/i.test(it.name)) { const r = 22; const pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; pts.push([16 + Math.cos(a) * r, -26 + Math.sin(a) * r]); } P(pts, '#c81a14'); g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('STOP', 16, -22); } else P([[2, -40], [34, -48], [40, -20], [30, -6], [2, -14]], B); grime(10); g.restore(); },
    spear() { g.save(); g.translate(64, 64); g.rotate(-0.78); Rr(-3.5, -30, 7, 84, 3, /rebar/i.test(it.name) ? '#7a5a4a' : '#8a6a4a'); P([[-9, -30], [0, -56], [9, -30]], B); Rr(-6, -32, 12, 6, 2, Cc); g.restore(); },
    wrench() { g.save(); g.translate(64, 64); g.rotate(-0.78); Rr(-6, -20, 12, 66, 5, B); P([[-16, -22], [-16, -44], [-6, -48], [-6, -34], [6, -34], [6, -48], [16, -44], [16, -22], [8, -16], [-8, -16]], B); grime(14); g.restore(); },
    crowbar() { g.save(); g.translate(64, 64); g.rotate(-0.78); Rr(-4, -38, 8, 80, 4, A); L([[0, 42], [-4, 50], [-14, 50]], 8); L([[0, 42], [-4, 50], [-14, 50]], 4, A); g.restore(); },
    mace() { g.save(); g.translate(64, 64); g.rotate(-0.7); Rr(-4, -14, 8, 60, 3, '#8a6a4a'); if (/ladle/i.test(it.name)) { E(0, -26, 20, 16, '#c8ccd2'); E(0, -28, 14, 9, '#8a8e94', 2); } else { E(0, -26, 18, 18, B); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; P([[Math.cos(a) * 16, -26 + Math.sin(a) * 16], [Math.cos(a + 0.2) * 26, -26 + Math.sin(a + 0.2) * 26], [Math.cos(a + 0.4) * 16, -26 + Math.sin(a + 0.4) * 16]], Cc, 3); } } g.restore(); },
    hammer() { g.save(); g.translate(64, 64); g.rotate(-0.7); Rr(-4, -16, 8, 64, 3, '#8a6a4a'); Rr(-26, -36, 52, 24, 4, B); rivets([[-18, -24], [18, -24]]); g.restore(); },
    wand() { g.save(); g.translate(64, 64); g.rotate(-0.78); Rr(-3.5, -36, 7, 76, 3, A); E(0, -40, 7, 7, gem, 3); for (let i = 0; i < 5; i++) { g.fillStyle = gem; g.globalAlpha = 0.7; g.beginPath(); g.arc((R() - 0.5) * 30, -40 + (R() - 0.5) * 30, 2, 0, 7); g.fill(); } g.globalAlpha = 1; g.restore(); },
    staff() { g.save(); g.translate(64, 64); g.rotate(-0.55); Rr(-4, -34, 8, 86, 3, '#7a5a3a'); if (/lighter/i.test(it.name)) { Rr(-9, -50, 18, 20, 3, '#e83a3a'); flame(0, -54, 0.8); } else if (/tiki|torch/i.test(it.name)) { P([[-10, -36], [10, -36], [6, -50], [-6, -50]], '#c8a050'); flame(0, -56, 1); } else { L([[0, -34], [-10, -46], [0, -58], [10, -46], [0, -34]], 4); gemAt(0, -46, 7); } g.restore(); },
    chakram() { E(64, 64, 34, 34, B); E(64, 64, 16, 16, '#14101a', 3); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; P([[64 + Math.cos(a) * 32, 64 + Math.sin(a) * 32], [64 + Math.cos(a + 0.25) * 44, 64 + Math.sin(a + 0.25) * 44], [64 + Math.cos(a + 0.4) * 32, 64 + Math.sin(a + 0.4) * 32]], '#c8ccd2', 3); } shine(54, 46, 10, 5); },
    bow() { g.save(); g.translate(64, 64); g.rotate(-0.5); g.beginPath(); g.arc(-30, 0, 46, -1.1, 1.1); g.strokeStyle = INK; g.lineWidth = 11; g.stroke(); g.strokeStyle = A; g.lineWidth = 6; g.stroke(); L([[-30 + Math.cos(-1.1) * 46, Math.sin(-1.1) * 46], [-30 + Math.cos(1.1) * 46, Math.sin(1.1) * 46]], 2, '#e8e4dc'); g.restore(); },
    crossbow() { g.save(); g.translate(64, 70); Rr(-6, -30, 12, 60, 3, '#7a5a3a'); g.beginPath(); g.arc(0, -10, 36, Math.PI * 1.15, Math.PI * 1.85); g.strokeStyle = INK; g.lineWidth = 10; g.stroke(); g.strokeStyle = B; g.lineWidth = 5; g.stroke(); L([[-30, -28], [0, -2], [30, -28]], 2, '#e8e4dc'); g.restore(); },
    shield() { const n = (it.name || '').toLowerCase(); if (/lid/.test(n)) { E(64, 66, 40, 36, '#9aa0a8'); for (let i = -2; i <= 2; i++) L([[64 + i * 13, 34], [64 + i * 13, 98]], 2, '#6a6e74'); Rr(52, 58, 24, 12, 5, '#6a6e74', 3); } else if (/door/.test(n)) { Rr(24, 28, 80, 72, 10, A); Rr(32, 34, 64, 30, 6, '#3a5a7a', 3); Rr(70, 72, 18, 6, 3, '#c8ccd2', 3); grime(14); } else if (/riot/.test(n)) { Rr(30, 18, 68, 94, 10, 'rgba(160,200,230,.7)'); g.fillStyle = INK; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText('RIOT', 64, 70); } else { P([[64, 18], [104, 30], [100, 70], [64, 108], [28, 70], [24, 30]], A); P([[64, 30], [92, 38], [88, 68], [64, 94]], B, 3); gemAt(64, 58, 7); } },
    orb() { Rr(46, 88, 36, 16, 4, '#7a5a3a'); E(64, 58, 32, 32, 'rgba(200,230,255,.55)'); for (let i = 0; i < 14; i++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(44 + R() * 40, 36 + R() * 44, 1.5, 0, 7); g.fill(); } P([[54, 78], [64, 56], [74, 78]], '#3a8a4a', 3); shine(52, 42, 10, 6); },
    tome() { Rr(30, 24, 68, 82, 6, A); Rr(36, 30, 56, 70, 4, shade(fam.a, 0.7), 3); flame(64, 70, 0.6); Rr(28, 24, 10, 82, 4, B, 3); },
    torch() { g.save(); g.translate(64, 70); g.rotate(-0.4); Rr(-5, -14, 10, 60, 3, '#7a5a3a'); Rr(-9, -22, 18, 12, 3, '#5a5a62'); flame(0, -28, 1.1); g.restore(); },
    lantern() { Rr(44, 36, 40, 56, 6, 'rgba(255,220,140,.7)'); Rr(40, 28, 48, 10, 4, B); Rr(40, 90, 48, 10, 4, B); L([[52, 28], [64, 14], [76, 28]], 4); flame(64, 68, 0.6); },
    hook() { L([[40, 100], [64, 60], [64, 30]], 6); g.beginPath(); g.arc(78, 30, 14, Math.PI, 0.2); g.strokeStyle = INK; g.lineWidth = 9; g.stroke(); g.strokeStyle = '#c8ccd2'; g.lineWidth = 4; g.stroke(); },
    coneHelm() { P([[64, 16], [92, 96], [36, 96]], '#e8590c'); stripes(36, 50, 56, 12, '#eeeae0', '#eeeae0', 1); g.fillStyle = '#eeeae0'; g.fillRect(48, 50, 32, 10); g.fillRect(43, 70, 42, 8); P([[64, 16], [92, 96], [36, 96]], 'rgba(0,0,0,0)'); Rr(26, 94, 76, 10, 3, '#3a3a3a'); },
    wizardHat() { P([[64, 10], [80, 52], [92, 90], [36, 90], [50, 52]], A); E(64, 92, 46, 10, shade(fam.a, 0.8)); for (let i = 0; i < 5; i++) { g.fillStyle = Cc; g.beginPath(); g.arc(52 + R() * 26, 34 + R() * 46, 2.5, 0, 7); g.fill(); } },
    hardHat() { g.beginPath(); g.arc(64, 76, 38, Math.PI, 0); g.closePath(); g.fillStyle = '#e8c020'; g.fill(); g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke(); Rr(18, 74, 92, 12, 5, '#e8c020'); Rr(58, 38, 12, 38, 3, '#d8b010', 3); shine(48, 56, 10, 6); },
    colander() { g.beginPath(); g.arc(64, 74, 38, Math.PI, 0); g.closePath(); g.fillStyle = '#c8ccd2'; g.fill(); g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke(); for (let i = 0; i < 16; i++) { g.fillStyle = INK; g.beginPath(); g.arc(38 + (i % 6) * 10 + (i > 5 ? 5 : 0), 52 + Math.floor(i / 6) * 9, 2, 0, 7); g.fill(); } Rr(14, 72, 22, 8, 3, '#c8ccd2', 3); Rr(92, 72, 22, 8, 3, '#c8ccd2', 3); },
    circlet() { g.beginPath(); g.ellipse(64, 70, 40, 18, 0, 0, Math.PI * 2); g.strokeStyle = INK; g.lineWidth = 12; g.stroke(); g.strokeStyle = '#e8c040'; g.lineWidth = 6; g.stroke(); P([[52, 54], [64, 30], [76, 54]], '#e8c040'); gemAt(64, 48, 6); if (/crown/i.test(it.name)) for (const x of [36, 92]) P([[x - 8, 62], [x, 44], [x + 8, 62]], '#e8590c', 3); },
    hockeyMask() { P([[64, 14], [96, 36], [92, 84], [64, 108], [36, 84], [32, 36]], '#e8e4dc'); for (const [x, y] of [[50, 50], [78, 50]]) E(x, y, 9, 6, INK, 0); for (let i = 0; i < 9; i++) E(52 + (i % 3) * 12, 72 + Math.floor(i / 3) * 9, 2, 2, INK, 0); g.fillStyle = '#c81a14'; g.beginPath(); g.moveTo(64, 20); g.lineTo(58, 36); g.lineTo(70, 36); g.fill(); },
    bandana() { P([[20, 60], [108, 60], [96, 82], [64, 92], [32, 82]], A); P([[96, 66], [118, 80], [104, 92]], A, 3); for (let i = 0; i < 6; i++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(36 + i * 11, 72, 2, 0, 7); g.fill(); } },
    helm() { g.beginPath(); g.arc(64, 70, 36, Math.PI, 0); g.lineTo(100, 98); g.lineTo(28, 98); g.closePath(); g.fillStyle = B; g.fill(); g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke(); Rr(36, 66, 56, 10, 3, INK, 0); Rr(60, 30, 8, 60, 3, A, 3); rivets([[34, 90], [94, 90]]); grime(10); },
    goggles() { Rr(16, 54, 96, 16, 8, '#3a3a3a'); for (const x of [44, 84]) { E(x, 62, 18, 16, '#8a8e94'); E(x, 62, 12, 10, gem, 2.5); shine(x - 4, 58, 4, 2); } },
    monocle() { E(64, 56, 28, 28, '#e8c040'); E(64, 56, 21, 21, 'rgba(200,230,255,.6)', 2.5); L([[86, 70], [96, 90], [90, 110]], 3); shine(56, 48, 7, 4); },
    visor() { Rr(18, 46, 92, 36, 14, B); Rr(26, 54, 76, 14, 7, gem, 2.5); },
    mask() { P([[30, 46], [98, 46], [92, 82], [64, 92], [36, 82]], /gas/i.test(it.name) ? '#4a5a4a' : '#9ad8e8'); if (/gas/i.test(it.name)) { E(64, 80, 12, 12, '#2a2a2a'); for (const x of [46, 82]) E(x, 58, 10, 9, 'rgba(200,230,255,.6)', 3); } else for (let i = 0; i < 3; i++) L([[38, 56 + i * 8], [90, 56 + i * 8]], 2, 'rgba(0,0,0,.25)'); L([[30, 50], [12, 44]], 3); L([[98, 50], [116, 44]], 3); },
    pauldrons() { for (const sx of [-1, 1]) { g.save(); g.translate(64 + sx * 26, 64); g.scale(sx, 1); g.beginPath(); g.arc(0, 4, 26, Math.PI * 1.1, Math.PI * 2.1); g.closePath(); g.fillStyle = /hubcap/i.test(it.name) ? '#c8ccd2' : A; g.fill(); g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke(); rivets([[-14, -6], [10, -10]]); g.restore(); } grime(8); },
    duckPads() { for (const sx of [-1, 1]) { E(64 + sx * 26, 70, 22, 16, '#ffd020'); E(64 + sx * 34, 52, 12, 11, '#ffd020'); P([[64 + sx * 44, 52], [64 + sx * 54, 56], [64 + sx * 44, 58]], '#ff8a1a', 3); E(64 + sx * 36, 50, 2, 2, INK, 0); } },
    robe() { P([[44, 20], [84, 20], [104, 108], [24, 108]], A); P([[56, 20], [64, 46], [72, 20]], shade(fam.a, 0.7), 3); Rr(36, 64, 56, 8, 3, Cc, 3); for (let i = 0; i < 4; i++) { g.fillStyle = Cc; g.beginPath(); g.arc(40 + R() * 48, 80 + R() * 22, 2.5, 0, 7); g.fill(); } },
    apron() { P([[42, 18], [86, 18], [92, 56], [100, 108], [28, 108], [36, 56]], '#e8e4dc'); Rr(48, 70, 32, 18, 3, '#d8d2c0', 3); L([[42, 18], [30, 8]], 3); L([[86, 18], [98, 8]], 3); g.globalAlpha = 0.5; E(56, 46, 8, 5, '#c84a2a', 0); E(76, 94, 6, 4, '#7a5a2a', 0); g.globalAlpha = 1; },
    vest() { const hv = /hi-vis/i.test(it.name); P([[30, 24], [52, 18], [64, 36], [76, 18], [98, 24], [102, 106], [26, 106]], hv ? '#d8f020' : /scrubs/i.test(it.name) ? '#4ab8a8' : A); if (hv) { g.fillStyle = '#c8c8c8'; g.fillRect(28, 64, 72, 8); g.fillRect(28, 82, 72, 8); } L([[64, 36], [64, 104]], 3); },
    cuirass() { P([[30, 22], [98, 22], [104, 64], [92, 106], [36, 106], [24, 64]], B); L([[64, 26], [64, 102]], 3, 'rgba(0,0,0,.4)'); Rr(30, 64, 68, 8, 3, A, 3); rivets([[38, 34], [90, 34], [40, 92], [88, 92]]); grime(14); shine(48, 40, 10, 6); },
    cloak() { P([[48, 18], [80, 18], [108, 108], [64, 98], [20, 108]], A); E(64, 22, 7, 7, Cc, 3); for (let i = 0; i < 3; i++) L([[50 + i * 12, 40], [40 + i * 22, 100]], 2, 'rgba(0,0,0,.25)'); },
    jetpack() { for (const x of [44, 84]) { Rr(x - 14, 26, 28, 60, 10, B); flame(x, 96, 0.7); } Rr(52, 40, 24, 30, 4, A, 3); },
    bracers() { for (const x of [42, 86]) { Rr(x - 16, 30, 32, 66, 8, A); for (let i = 0; i < 3; i++) L([[x - 14, 46 + i * 16], [x + 14, 46 + i * 16]], 2.5, 'rgba(0,0,0,.4)'); } gemAt(86, 62, 5); },
    gloves() { for (const sx of [-1, 1]) { g.save(); g.translate(64 + sx * 24, 64); g.scale(sx, 1); P([[-16, 30], [-18, -6], [-14, -30], [-6, -32], [-4, -12], [2, -34], [10, -32], [10, -10], [16, -24], [22, -18], [16, 30]], A); Rr(-18, 22, 36, 14, 4, B, 3); g.restore(); } },
    mitt() { for (const sx of [-1, 1]) { g.save(); g.translate(64 + sx * 24, 66); g.scale(sx, 1); P([[-18, 30], [-20, -14], [-6, -34], [12, -26], [14, 0], [24, -10], [26, 6], [16, 30]], '#e8e4dc'); g.globalAlpha = 0.5; E(-4, 0, 8, 6, '#3a2a1a', 0); g.globalAlpha = 1; g.restore(); } },
    belt() { Rr(10, 54, 108, 20, 6, /seatbelt/i.test(it.name) ? '#3a3a42' : '#7a4a2a'); Rr(52, 48, 26, 32, 4, '#e8c040'); Rr(58, 56, 14, 16, 2, '#14101a', 2); if (/bandolier|sauce/i.test(it.name)) for (let i = 0; i < 4; i++) Rr(18 + i * 22, 30, 12, 26, 3, ['#e83a3a', '#e8c020', '#5ad86a', '#8a5a2a'][i], 3); },
    trousers() { P([[34, 18], [94, 18], [98, 108], [70, 108], [64, 54], [58, 108], [30, 108]], A); Rr(32, 18, 64, 10, 3, B, 3); grime(8); },
    shorts() { P([[30, 26], [98, 26], [104, 82], [70, 86], [64, 60], [58, 86], [24, 82]], '#b89a6a'); for (const x of [36, 82]) Rr(x, 50, 14, 16, 3, '#a88a5a', 2.5); Rr(28, 26, 72, 9, 3, '#8a6a4a', 3); },
    boots() { for (const sx of [-1, 1]) { g.save(); g.translate(64 + sx * 22, 0); g.scale(sx, 1); P([[-14, 24], [8, 24], [8, 74], [26, 84], [26, 100], [-16, 100]], A); Rr(-18, 94, 46, 8, 3, B, 3); if (/steel/i.test(it.name)) E(18, 92, 8, 6, '#c8ccd2', 2.5); g.restore(); } },
    sandals() { for (const sx of [-1, 1]) { E(64 + sx * 24, 70, 15, 34, '#8a6a4a'); L([[64 + sx * 14, 58], [64 + sx * 34, 58]], 5); L([[64 + sx * 16, 76], [64 + sx * 32, 76]], 5); } },
    skates() { for (const sx of [-1, 1]) { g.save(); g.translate(64 + sx * 22, 0); g.scale(sx, 1); P([[-12, 24], [8, 24], [8, 64], [22, 74], [22, 86], [-14, 86]], '#ff7ac8'); for (const x of [-8, 14]) E(x, 98, 8, 8, '#ffe040', 3); g.restore(); } },
    ring() { g.beginPath(); g.ellipse(64, 72, 28, 24, 0, 0, Math.PI * 2); g.strokeStyle = INK; g.lineWidth = 14; g.stroke(); g.strokeStyle = /washer/i.test(it.name) ? '#9aa0a8' : '#e8c040'; g.lineWidth = 8; g.stroke(); if (!/washer/i.test(it.name)) { P([[52, 48], [64, 34], [76, 48], [64, 58]], gem); shine(60, 42, 4, 2); } },
    amulet() { L([[30, 14], [64, 62], [98, 14]], 6); L([[30, 14], [64, 62], [98, 14]], 2, '#e8c040'); if (/feather/i.test(it.name)) { P([[64, 60], [78, 80], [70, 112], [58, 112], [50, 80]], '#ff6a1a'); L([[64, 62], [64, 110]], 2); } else { P([[64, 58], [84, 80], [64, 106], [44, 80]], '#e8c040'); gemAt(64, 82, 9); } },
    capAmulet() { L([[30, 14], [64, 58], [98, 14]], 5); E(64, 80, 22, 22, '#c81a14'); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; L([[64 + Math.cos(a) * 22, 80 + Math.sin(a) * 22], [64 + Math.cos(a) * 26, 80 + Math.sin(a) * 26]], 3); } g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('POP', 64, 84); },
    lanyard() { L([[34, 10], [64, 64], [94, 10]], 7, '#2a4a8a'); Rr(42, 60, 44, 54, 4, '#e8e4dc'); Rr(50, 68, 28, 22, 2, '#9ad8e8', 2.5); L([[50, 98], [78, 98]], 3); L([[50, 104], [70, 104]], 3); },
    potion() { const col = (it.effect || {}).hp ? '#e83a4a' : (it.effect || {}).mana ? '#3a7aff' : gem; Rr(54, 18, 20, 10, 3, '#8a6a4a'); Rr(56, 28, 16, 14, 3, 'rgba(220,240,255,.6)', 3); E(64, 74, 32, 34, 'rgba(220,240,255,.45)'); g.save(); g.beginPath(); g.ellipse(64, 74, 30, 32, 0, 0, 7); g.clip(); g.fillStyle = col; g.fillRect(30, 70 - R() * 10, 70, 50); g.restore(); E(64, 74, 32, 34, 'rgba(0,0,0,0)'); shine(50, 60, 8, 5); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(50 + R() * 28, 80 + R() * 20, 2, 0, 7); g.fill(); } },
    bottle() { Rr(56, 14, 16, 12, 3, '#2a6ac8'); P([[56, 26], [72, 26], [80, 46], [80, 108], [48, 108], [48, 46]], 'rgba(170,220,255,.55)'); Rr(48, 62, 32, 24, 2, (it.name || '').length % 2 ? '#e8e4dc' : '#5ad8ff', 3); shine(56, 52, 4, 10); },
    can() { Rr(42, 24, 44, 82, 8, gem); Rr(42, 24, 44, 10, 5, '#c8ccd2', 3); Rr(42, 96, 44, 10, 5, '#c8ccd2', 3); g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillText('FIZZ', 64, 70); },
    mug() { Rr(36, 40, 50, 60, 8, '#e8e4dc'); g.beginPath(); g.arc(88, 70, 13, -1.4, 1.4); g.strokeStyle = INK; g.lineWidth = 9; g.stroke(); g.strokeStyle = '#e8e4dc'; g.lineWidth = 4; g.stroke(); E(61, 44, 22, 5, '#6a3a1a', 2); for (let i = 0; i < 3; i++) L([[50 + i * 11, 34], [46 + i * 11, 22], [52 + i * 11, 12]], 2.5, 'rgba(255,255,255,.7)'); },
    bowl() { g.beginPath(); g.arc(64, 62, 40, 0, Math.PI); g.closePath(); g.fillStyle = '#c84a2a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke(); E(64, 62, 40, 9, (it.effect || {}).buff === 'fire' ? '#e8401a' : '#b8702a', 3); for (let i = 0; i < 5; i++) E(46 + R() * 36, 60 + R() * 4, 4, 3, ['#5ad86a', '#e8c040', '#8a5a3a'][i % 3], 2); for (let i = 0; i < 3; i++) L([[50 + i * 14, 48], [46 + i * 14, 34], [52 + i * 14, 22]], 2.5, 'rgba(255,255,255,.7)'); },
    pie() { g.beginPath(); g.arc(64, 70, 40, Math.PI, 0); g.lineTo(104, 76); g.lineTo(24, 76); g.closePath(); g.fillStyle = '#d89a4a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke(); Rr(22, 74, 84, 14, 5, '#b87a3a'); for (let i = 0; i < 4; i++) L([[44 + i * 12, 46], [48 + i * 12, 62]], 3); },
    skewer() { L([[16, 100], [112, 28]], 4, '#8a6a4a'); for (let i = 0; i < 4; i++) E(34 + i * 20, 86 - i * 15, 11, 9, ['#8a3a2a', '#5a8a2a', '#8a3a2a', '#c8a020'][i]); },
    coneBomb() { P([[64, 26], [86, 92], [42, 92]], '#e8590c'); g.fillStyle = '#eeeae0'; g.fillRect(52, 56, 24, 8); Rr(36, 90, 56, 10, 3, '#3a3a3a'); L([[64, 26], [74, 12]], 3); fuse(74, 12); },
    bomb() { E(62, 72, 32, 32, it.effect && it.effect.freeze ? '#7ac8e8' : it.effect && it.effect.burn ? '#8a2a1a' : '#2a2a2e'); Rr(54, 34, 16, 10, 3, '#5a5a62', 3); shine(50, 58, 9, 6); fuse(70, 30); },
    mine() { E(64, 80, 40, 16, '#4a5a3a'); E(64, 72, 30, 12, '#5a6a4a'); E(64, 68, 8, 5, '#e83a3a', 2.5); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; L([[64 + Math.cos(a) * 30, 72 + Math.sin(a) * 12], [64 + Math.cos(a) * 44, 72 + Math.sin(a) * 18]], 3); } },
    rocket() { g.save(); g.translate(64, 64); g.rotate(0.6); Rr(-10, -34, 20, 56, 4, '#e83a8a'); P([[-10, -34], [0, -52], [10, -34]], '#ffd040'); P([[-10, 14], [-20, 30], [-10, 22]], '#3a8aff', 3); P([[10, 14], [20, 30], [10, 22]], '#3a8aff', 3); g.restore(); fuse(40, 96); },
    turret() { Rr(36, 74, 56, 26, 6, '#5a5a62'); Rr(46, 46, 36, 30, 6, gem); Rr(78, 54, 32, 10, 3, '#3a3a42', 3); E(64, 60, 6, 6, '#ffd040', 2.5); for (const x of [40, 88]) L([[x, 100], [x - 6, 112]], 4); },
    map() { P([[18, 30], [50, 22], [80, 32], [110, 24], [110, 100], [80, 108], [50, 98], [18, 106]], '#e8dcb0'); g.setLineDash([5, 5]); L([[30, 90], [52, 60], [74, 72], [92, 44]], 3, '#c81a14'); g.setLineDash([]); L([[86, 38], [98, 50]], 4, '#c81a14'); L([[98, 38], [86, 50]], 4, '#c81a14'); },
    scroll() { Rr(34, 22, 60, 84, 3, '#efe2b8'); Rr(28, 16, 72, 12, 6, '#d8c890'); Rr(28, 100, 72, 12, 6, '#d8c890'); for (let i = 0; i < 5; i++) L([[44, 42 + i * 10], [84 - R() * 16, 42 + i * 10]], 2, 'rgba(0,0,0,.45)'); E(64, 92, 7, 7, gem, 2.5); },
    bag() { P([[30, 44], [98, 44], [104, 104], [24, 104]], '#8a6a3a'); Rr(40, 60, 48, 24, 6, '#7a5a2a', 3); g.beginPath(); g.arc(64, 44, 22, Math.PI, 0); g.strokeStyle = INK; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; g.stroke(); },
    kit() { Rr(22, 40, 84, 62, 8, '#e8e4dc'); Rr(54, 30, 20, 14, 4, '#e8e4dc', 3); Rr(56, 56, 16, 34, 2, '#e83a3a', 0); Rr(47, 65, 34, 16, 2, '#e83a3a', 0); },
    book() { Rr(28, 22, 72, 86, 6, '#6a3aa8'); Rr(34, 28, 60, 74, 4, '#4a2a7a', 3); flame(64, 66, 0.7); g.fillStyle = '#e8c040'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('SKILL', 64, 98); Rr(26, 22, 10, 86, 3, '#e8c040', 3); },
    box() { const col = { bronze: '#c88a4a', silver: '#c8ccd8', gold: '#F5C518', boss: '#E5484D' }[it.box] || '#c88a4a'; P([[24, 48], [64, 30], [104, 48], [104, 96], [64, 114], [24, 96]], col); L([[24, 48], [64, 66], [104, 48]], 4); L([[64, 66], [64, 114]], 4); P([[52, 40], [64, 34], [76, 40], [64, 46]], '#fff', 2.5); g.fillStyle = INK; g.font = 'bold 30px Bangers, sans-serif'; g.textAlign = 'center'; g.fillText('?', 84, 92); g.fillText('?', 44, 92); },
  };
  function flame(x, y, k = 1) { g.save(); g.translate(x, y); g.scale(k, k); P([[0, -26], [10, -8], [8, 6], [0, 10], [-8, 6], [-10, -8]], '#ff7a1a', 3); P([[0, -14], [5, -2], [0, 6], [-5, -2]], '#ffe060', 0.01); g.restore(); }
  function fuse(x, y) { L([[x, y], [x + 8, y - 8]], 3, '#c8a050'); for (let i = 0; i < 6; i++) { const a = R() * 6.28; L([[x + 8, y - 8], [x + 8 + Math.cos(a) * 9, y - 8 + Math.sin(a) * 9]], 2, '#ffd040'); } }
  (draw[t] || draw.box)();
  // stat flourishes: fire licks, frost crystals, crackles of storm, a smoke wisp for "Smouldering"
  if (stats.fire && it.kind === 'gear' && !/staff|torch|tome|jetpack/.test(t)) { flame(26 + R() * 10, 106, 0.55); flame(100 - R() * 10, 104, 0.45); }
  if (stats.frost) for (let i = 0; i < 3; i++) { const x = 20 + R() * 88, y = 90 + R() * 26; P([[x, y - 12], [x + 4, y], [x, y + 4], [x - 4, y]], '#bff4ff', 2); }
  if (stats.storm) L([[96, 18], [88, 34], [98, 34], [86, 52]], 3, '#ffe040');
  if (/smouldering|infernal/i.test(it.name)) { g.globalAlpha = 0.4; for (let i = 0; i < 3; i++) E(70 + i * 8, 22 - i * 4, 8 + i * 2, 5 + i, '#9a9a9a', 0); g.globalAlpha = 1; }
  if (/bloodstained/i.test(it.name)) { g.globalAlpha = 0.7; for (let i = 0; i < 5; i++) E(40 + R() * 50, 50 + R() * 40, 2 + R() * 4, 2 + R() * 3, '#8a0a0a', 0); g.globalAlpha = 1; }
  if (/haunted|cursed/i.test(it.name)) { g.globalAlpha = 0.35; E(98, 30, 12, 14, '#c8e8ff', 0); g.globalAlpha = 1; E(94, 28, 2, 2, INK, 0); E(102, 28, 2, 2, INK, 0); }
  if (/sponsored|ratings|prime-time/i.test(it.name)) { Rr(84, 92, 36, 18, 3, '#F5C518', 2.5); g.fillStyle = INK; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText('AD', 102, 105); }
  if (/broken/i.test(it.name) || it.rarity === 'junk') { L([[40, 30], [52, 50], [46, 62], [60, 80]], 3, 'rgba(0,0,0,.6)'); }
  if (it.tags && it.tags.some((x) => /imbued/i.test(x))) { g.globalAlpha = 0.25; g.fillStyle = gem; g.fillRect(0, 0, 128, 128); g.globalAlpha = 1; }
  if (it.rarity === 'legendary' || it.rarity === 'epic') for (let i = 0; i < 6; i++) { const x = 12 + R() * 104, y = 12 + R() * 104; L([[x - 5, y], [x + 5, y]], 2, '#fff'); L([[x, y - 5], [x, y + 5]], 2, '#fff'); }
  // rarity frame
  g.strokeStyle = rar; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122);
  let url; if (size !== 128) { const c2 = document.createElement('canvas'); c2.width = c2.height = size; const g2 = c2.getContext('2d'); g2.imageSmoothingQuality = 'high'; g2.drawImage(c, 0, 0, size, size); url = c2.toDataURL(); } else url = c.toDataURL();
  cache.set(key, url); return url;
}
export const artImg = (it, size = 96, cls = '') => `<img class="lootart ${cls}" src="${itemArt(it, size)}" width="${size}" height="${size}" alt="${String(it.name || '').replace(/"/g, '&quot;')}">`;
