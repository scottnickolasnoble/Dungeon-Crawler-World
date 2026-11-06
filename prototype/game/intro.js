// Opening cutscene: painted comic-ink panels (canvas), slow camera moves, subtitles and spoken narration.
// Dale is asleep at 3:17 AM, the TV turns itself on, the Host announces Earth has been acquired and every building
// is folding into the ground, explains the show, and Dale runs for the stairwell. Space = next line, Esc = skip.
const INK = '#0d0b12';

export function playIntro({ say, sfx, music, onDone, startShot = 0 }) {
  const wrap = document.createElement('div'); wrap.id = 'intro';
  wrap.innerHTML = `<canvas id="introCv"></canvas><div id="introSub"><b id="introWho"></b><span id="introTxt"></span></div><div id="introHint">Space: next line · Esc: skip intro</div>`;
  document.body.appendChild(wrap);
  const cv = wrap.querySelector('#introCv'), g = cv.getContext('2d');
  const resize = () => { cv.width = Math.min(1600, window.innerWidth) * (window.devicePixelRatio > 1 ? 1.5 : 1); cv.height = cv.width * window.innerHeight / window.innerWidth; };
  resize(); window.addEventListener('resize', resize);
  let staticOn = true; let shot = startShot, lineIdx = 0, shotT = 0, lineT = 0, lineDur = 4, talking = false, done = false, last = performance.now();

  // ---------- painting helpers ----------
  const W = () => cv.width, H = () => cv.height;
  const P = (pts, fill, lw = 6) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); } };
  const R = (x, y, w, h, fill, lw = 6, r = 0) => { g.beginPath(); if (r) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); } };
  const E = (x, y, rx, ry, fill, lw = 6) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); } };
  const txt = (s, x, y, size, col, font = 'Bangers', align = 'center') => { g.font = `${size}px ${font}, sans-serif`; g.textAlign = align; g.lineWidth = size / 6; g.strokeStyle = INK; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); };
  const halftone = (alpha = 0.07) => { g.globalAlpha = alpha; g.fillStyle = '#000'; const s = 9; for (let y = 0; y < 1000; y += s) for (let x = (y / s) % 2 ? s / 2 : 0; x < 1600; x += s) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } g.globalAlpha = 1; };
  const seeded = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // every panel is painted on a 1600x1000 board, then framed with a slow push-in
  function frame(draw, t, zoom = [1, 1.12], pan = [0, 0, 0, 0]) {
    const k = Math.min(1, t / 9); const z = zoom[0] + (zoom[1] - zoom[0]) * k; const px = pan[0] + (pan[2] - pan[0]) * k, py = pan[1] + (pan[3] - pan[1]) * k;
    g.save(); g.fillStyle = '#000'; g.fillRect(0, 0, W(), H()); const s = Math.max(W() / 1600, H() / 1000) * z; g.translate(W() / 2, H() / 2); g.scale(s, s); g.translate(-800 + px, -500 + py); g.lineJoin = 'round'; g.lineCap = 'round';
    draw(t); halftone(); g.restore();
    // letterbox + panel border
    const bar = H() * 0.08; g.fillStyle = '#000'; g.fillRect(0, 0, W(), bar); g.fillRect(0, H() - bar, W(), bar);
  }

  // ---------- the Host (used on the TV) ----------
  function host(x, y, s, t, mouth) {
    g.save(); g.translate(x, y); g.scale(s, s);
    R(-150, 120, 300, 200, '#2a2a3a', 6, 40); P([[-30, 120], [0, 170], [30, 120]], '#f4eedc', 5); P([[-24, 150], [0, 140], [24, 150], [0, 160]], '#E5484D', 4); // suit, shirt, bow tie
    E(0, 0, 105, 125, '#f0c8a0'); // head
    P([[-105, -30], [-90, -110], [-20, -150], [70, -140], [110, -60], [100, -20], [60, -95], [-40, -100]], '#2a1a12', 6); // slick hair
    R(-82, -32, 70, 34, '#14101a', 5, 10); R(12, -32, 70, 34, '#14101a', 5, 10); g.fillStyle = '#fff'; g.globalAlpha = 0.6; g.fillRect(-70, -26, 20, 6); g.fillRect(24, -26, 20, 6); g.globalAlpha = 1; // shades
    const open = mouth ? 10 + Math.abs(Math.sin(t * 16)) * 26 : 6;
    g.beginPath(); g.ellipse(0, 55, 62, open, 0, 0, Math.PI); g.fillStyle = '#5a1010'; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#fff'; g.fillRect(-52, 55, 104, Math.min(open * 0.5, 12)); // teeth
    P([[-10, 0], [0, 30], [12, 30]], null, 4); // nose
    g.restore();
  }

  // ---------- panels ----------
  const PANELS = {
    bedroom(t) {
      R(0, 0, 1600, 1000, '#1a1e3a', 0); R(0, 760, 1600, 240, '#2a2032', 0);
      // window with the sleeping city
      R(120, 120, 420, 360, '#0a0e22'); for (let i = 0; i < 14; i++) { const bx = 130 + i * 30, bh = 80 + seeded(i) * 200; R(bx, 480 - bh, 28, bh, '#14182e', 0); for (let k = 0; k < 8; k++) if (seeded(i * 9 + k) > 0.55) { g.fillStyle = '#ffd27a'; g.fillRect(bx + 6 + (k % 2) * 10, 480 - bh + 12 + Math.floor(k / 2) * 22, 6, 9); } }
      R(120, 120, 420, 360, null, 10); g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(330, 120); g.lineTo(330, 480); g.moveTo(120, 300); g.lineTo(540, 300); g.stroke();
      // poster
      R(650, 150, 200, 260, '#c84a2a'); txt('BOOM!', 750, 300, 70, '#ffd040'); txt('FIREWORKS', 750, 360, 30, '#fff');
      // bed with Dale asleep
      R(700, 560, 820, 260, '#5a3a2a', 6, 20); R(720, 520, 780, 140, '#3a5a8a', 6, 40); E(820, 560, 90, 50, '#e8e4dc'); E(860, 520, 70, 60, '#c8987a'); P([[800, 480], [850, 450], [920, 470], [930, 510], [870, 490], [820, 510]], '#4a2a1a', 5);
      g.beginPath(); g.moveTo(900, 640); g.quadraticCurveTo(1150, 520 + Math.sin(t * 1.5) * 8, 1480, 600); g.lineTo(1480, 700); g.lineTo(900, 700); g.closePath(); g.fillStyle = '#3a5a8a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
      for (let i = 0; i < 3; i++) { const zt = (t * 0.6 + i * 0.33) % 1; g.globalAlpha = 1 - zt; txt('Z', 960 + zt * 120 + i * 20, 430 - zt * 200, 40 + i * 14, '#c8d8ff'); } g.globalAlpha = 1;
      // nightstand + clock
      R(1520, 600, 80, 220, '#4a3020'); R(380, 640, 230, 160, '#4a3020'); R(410, 590, 170, 70, '#14101a', 6, 10); txt('3:17', 495, 645, 52, (Math.floor(t * 2) % 2) ? '#ff3a2a' : '#c81a14', 'monospace');
      const lit = t > 6; if (lit) { g.globalAlpha = 0.25 + 0.1 * Math.sin(t * 30); g.fillStyle = '#7ad8ff'; g.fillRect(0, 0, 1600, 1000); g.globalAlpha = 1; }
    },
    tv(t) {
      R(0, 0, 1600, 1000, '#14121e', 0); R(260, 120, 1080, 760, '#3a2a22', 10, 30); R(330, 180, 940, 620, '#000', 8, 40);
      g.save(); g.beginPath(); g.roundRect(330, 180, 940, 620, 40); g.clip();
      if (t < 1.4 && staticOn) { for (let i = 0; i < 2200; i++) { const v = Math.random() * 255 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(330 + Math.random() * 940, 180 + Math.random() * 620, 6, 4); } }
      else { const grd = g.createLinearGradient(0, 180, 0, 800); grd.addColorStop(0, '#2a1a5a'); grd.addColorStop(1, '#e8406a'); g.fillStyle = grd; g.fillRect(330, 180, 940, 620); for (let i = 0; i < 9; i++) { g.globalAlpha = 0.15; g.fillStyle = '#ffd040'; g.beginPath(); g.moveTo(800, 900); g.lineTo(330 + i * 120, 180); g.lineTo(380 + i * 120, 180); g.fill(); } g.globalAlpha = 1;
        host(800, 470, 1.25, t, talking); R(360, 210, 150, 54, '#E5484D', 5); txt('LIVE', 435, 252, 40, '#fff'); R(1030, 720, 210, 54, '#F5C518', 5); g.font = 'bold 30px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.fillStyle = INK; g.fillText('THE NETWORK', 1135, 758);
        g.globalAlpha = 0.12; for (let y = 180; y < 800; y += 6) { g.fillStyle = '#000'; g.fillRect(330, y, 940, 2); } g.globalAlpha = 1; }
      g.restore(); R(1200, 820, 40, 40, '#c81a14', 4, 20);
    },
    window(t) {
      const red = g.createLinearGradient(0, 0, 0, 1000); red.addColorStop(0, '#3a0a1a'); red.addColorStop(0.6, '#c8401e'); red.addColorStop(1, '#ffb040'); g.fillStyle = red; g.fillRect(0, 0, 1600, 1000);
      for (let i = 0; i < 4; i++) { g.globalAlpha = 0.18; g.fillStyle = '#fff'; g.save(); g.translate(300 + i * 350, 1000); g.rotate(Math.sin(t * 0.5 + i) * 0.4); g.beginPath(); g.moveTo(-20, 0); g.lineTo(-120, -1000); g.lineTo(120, -1000); g.lineTo(20, 0); g.fill(); g.restore(); } g.globalAlpha = 1;
      for (let i = 0; i < 22; i++) { const bx = i * 76 - 20, bh = 220 + seeded(i + 3) * 460; const sink = Math.max(0, (t - seeded(i) * 4) * (40 + seeded(i + 7) * 60)); const y = 1000 - bh + sink; R(bx, y, 70, bh, i % 3 ? '#1a1420' : '#2a1a2a', 5); for (let k = 0; k < 20; k++) if (seeded(i * 31 + k) > 0.6) { g.fillStyle = '#ffd27a'; g.fillRect(bx + 10 + (k % 3) * 18, y + 20 + Math.floor(k / 3) * 30, 9, 13); }
        if (sink > 0) for (let d = 0; d < 4; d++) E(bx + 35 + (seeded(i * 5 + d) - 0.5) * 120, 980 - d * 25, 60 + d * 20, 30 + d * 10, `rgba(120,100,90,${0.5 - d * 0.1})`, 0); }
      // the window frame we're looking out of
      g.lineWidth = 60; g.strokeStyle = '#1a1e3a'; g.strokeRect(0, 0, 1600, 1000); g.lineWidth = 14; g.strokeStyle = INK; g.beginPath(); g.moveTo(800, 0); g.lineTo(800, 1000); g.moveTo(0, 500); g.lineTo(1600, 500); g.stroke();
      txt('WOOOOOOM', 1150, 260, 90, '#ffd040');
    },
    grab(t) {
      R(0, 0, 1600, 1000, '#24203a', 0); R(200, 620, 1300, 400, '#4a3020');
      // the bathrobe on a hook, the lighter on the nightstand
      P([[1100, 120], [1300, 160], [1380, 700], [1040, 700]], '#7a4a8a'); E(1180, 140, 14, 14, '#c8a050', 4);
      const grabbed = t > 2.2; const lx = grabbed ? 700 - (t - 2.2) * 30 : 700, ly = grabbed ? 560 - (t - 2.2) * 40 : 600;
      R(lx - 40, ly - 80, 80, 130, '#c81a14', 6, 12); R(lx - 32, ly - 110, 64, 34, '#c8ccd2', 5, 6);
      if (grabbed) { const f = 1 + Math.sin(t * 20) * 0.1; P([[lx, ly - 210 * f], [lx + 30, ly - 140], [lx + 20, ly - 112], [lx - 20, ly - 112], [lx - 30, ly - 140]], '#ff7a1a', 5); P([[lx, ly - 170 * f], [lx + 14, ly - 130], [lx - 14, ly - 130]], '#ffe060', 0); }
      // Dale's hand reaching in
      const hx = grabbed ? lx + 90 : 1500 - Math.min(1, t / 2.2) * 700; g.save(); g.translate(hx, ly + 10); E(0, 0, 90, 64, '#c8987a'); for (let i = 0; i < 4; i++) E(-80, -40 + i * 26, 40, 14, '#c8987a', 5); R(60, -50, 500, 100, '#7a4a8a', 6, 30); g.restore();
      txt('*FLICK*', 470, 280, 80, '#ffd040');
    },
    street(t) {
      const sky = g.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, '#2a0a1a'); sky.addColorStop(1, '#e8601e'); g.fillStyle = sky; g.fillRect(0, 0, 1600, 1000); R(0, 600, 1600, 400, '#2a2430', 0);
      P([[0, 1000], [700, 600], [900, 600], [1600, 1000]], '#3a3440', 0);
      for (const side of [-1, 1]) for (let i = 0; i < 6; i++) { const x = 800 + side * (160 + i * 140), w = 140, h = 300 + seeded(i + side * 9) * 300; const sink = Math.max(0, (t - i * 0.4) * 50); R(x - (side < 0 ? w : 0), 620 - h + sink, w, h, '#1a1420', 5); }
      // the stairwell, glowing
      R(700, 470, 200, 160, '#14101a', 6); R(720, 500, 160, 130, '#0a3a12', 4); g.globalAlpha = 0.4 + 0.2 * Math.sin(t * 6); E(800, 560, 220, 140, '#5aff7a', 0); g.globalAlpha = 1; R(730, 420, 140, 50, '#0a3a12', 5); txt('EXIT', 800, 460, 44, '#5aff7a');
      // people running for it
      for (let i = 0; i < 14; i++) { const ph = (t * 0.25 + seeded(i)) % 1; const side = seeded(i + 40) > 0.5 ? 1 : -1; const x = 800 + side * (700 - ph * 650), y = 1000 - ph * 360, s = 1.2 - ph * 0.9; g.save(); g.translate(x, y); g.scale(s, s); E(0, -120, 22, 22, '#c8987a', 4); R(-22, -100, 44, 70, ['#c84a2a', '#2a6ac8', '#5ad86a', '#e8c040'][i % 4], 4, 8); const k = Math.sin(t * 12 + i) * 18; P([[-14, -30], [-14 - k, 30], [-4 - k, 30], [-2, -30]], '#2a2a3a', 3); P([[2, -30], [4 + k, 30], [14 + k, 30], [14, -30]], '#2a2a3a', 3); g.restore(); }
      txt('60 SECONDS', 800, 260, 110, '#ff3a2a');
    },
    stairs(t) {
      R(0, 0, 1600, 1000, '#050608', 0);
      for (let i = 0; i < 12; i++) { const k = (i + (t * 1.2) % 1) / 12; const w = 1500 * (1 - k * 0.9), y = 1000 - k * 700; const c = Math.floor(70 * (1 - k)); R(800 - w / 2, y, w, 40 * (1 - k * 0.8), `rgb(${c},${c + 10},${c})`, 4); }
      g.globalAlpha = 0.5; E(800, 280, 260, 120, '#5aff7a', 0); g.globalAlpha = 1;
      g.save(); g.translate(800, 760 - Math.min(1, t / 6) * 300); const sc = 1 - Math.min(0.6, t / 10); g.scale(sc, sc); E(0, -200, 40, 44, '#c8987a', 5); P([[-60, -150], [60, -150], [80, 60], [-80, 60]], '#7a4a8a'); P([[40, -130], [100, -60], [90, -40], [30, -100]], '#7a4a8a', 5); E(110, -60, 14, 14, '#c8987a', 4); P([[110, -110], [124, -76], [96, -76]], '#ff7a1a', 4); g.restore();
    },
    title(t) {
      R(0, 0, 1600, 1000, '#0d0b12', 0); for (let i = 0; i < 16; i++) { g.save(); g.translate(800, 500); g.rotate(i / 16 * Math.PI * 2 + t * 0.05); g.globalAlpha = 0.08; g.fillStyle = '#F5C518'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -1100); g.lineTo(90, -1100); g.fill(); g.restore(); } g.globalAlpha = 1;
      const s = Math.min(1, t / 0.6); g.save(); g.translate(800, 440); g.scale(s, s); txt('DOWNSTAIRS', 0, 0, 220, '#F5C518'); g.restore();
      if (t > 1.2) txt('FLOOR 1 · THE UNDERCROFT', 800, 600, 70, '#f4eedc');
      if (t > 2.2) txt('Contestant #4,117,021 · Dale · Pyromancer', 800, 690, 42, '#ff9a2a', 'Barlow Condensed');
    },
  };

  // ---------- script ----------
  const N = 'narrator', HOST = 'host';
  const SHOTS = [
    { p: 'bedroom', zoom: [1.05, 1.18], pan: [0, 0, 60, 20], lines: [[N, '3:17 in the morning. Somewhere ordinary.'], [N, 'Dale was asleep. Dale was always asleep at 3:17. He worked nights at a fireworks warehouse, and this was his one night off.'], [N, 'Then the television switched itself on.']], sfx: [[6.2, 'static']] },
    { p: 'tv', zoom: [1, 1.08], pan: [0, 0, 0, -20], lines: [[HOST, 'Good morning, Earth! Sorry about the hour. Big news, huge news!'], [HOST, 'Your planet has been acquired by the Network. Congratulations! The surface is being renovated.'], [HOST, 'In ten minutes, every building on Earth will fold neatly into the ground. Please do not be inside them.']] },
    { p: 'window', zoom: [1.08, 1.2], pan: [0, 20, 0, -30], lines: [[N, 'Dale looked out of the window. The city was folding itself away like a pop-up book in reverse.'], [HOST, 'But here is the good news! Every stairwell on the planet now leads to one place. Downstairs!']], sfx: [[0.3, 'rumble'], [3, 'rumble']] },
    { p: 'tv', zoom: [1.1, 1.18], pan: [0, -20, 0, -40], lines: [[HOST, 'Downstairs is the greatest show in the galaxy. Eighteen floors. Monsters. Loot. Ratings!'], [HOST, 'The rules are simple. Go down. Stay alive. Eat, drink, and entertain the audience. They are watching. All of them.'], [HOST, 'Reach Floor Eighteen and you win. Nobody has ever reached Floor Eighteen. No pressure!']] },
    { p: 'grab', zoom: [1, 1.1], pan: [0, 0, -40, 0], lines: [[N, 'Dale had nine minutes, one bathrobe, and the lighter from work.'], [N, 'It would have to do.']], sfx: [[2.2, 'flick']] },
    { p: 'street', zoom: [1, 1.15], pan: [0, 0, 0, 30], lines: [[HOST, 'Stairwells close in sixty seconds! Anyone still upstairs becomes part of the scenery!'], [N, 'The whole street was running for the same green sign.']], sfx: [[0.2, 'rumble'], [2, 'siren']] },
    { p: 'stairs', zoom: [1, 1.25], pan: [0, 0, 0, 40], lines: [[HOST, 'Contestant number four million, one hundred seventeen thousand and twenty-one. Class detected: Pyromancer. Cute.'], [HOST, 'Welcome to the dungeon, Dale. Find the camp, find the people, find a way down. And try not to die before the commercial break!']] },
    { p: 'title', zoom: [1, 1.05], pan: [0, 0, 0, 0], lines: [[null, '']], hold: 4.5 },
  ];
  const fired = new Set();
  function startLine() {
    const sh = SHOTS[shot], L = sh.lines[lineIdx]; lineT = 0; const [who, text] = L;
    wrap.querySelector('#introWho').textContent = who === HOST ? 'THE HOST' : who === N ? '' : ''; wrap.querySelector('#introTxt').textContent = text; wrap.querySelector('#introSub').style.display = text ? 'block' : 'none';
    talking = who === HOST; const d = text ? say(text, who, null, { pri: 3 }) : 0; lineDur = text ? Math.max(2.4, d > 0 ? d + 0.6 : text.split(/\s+/).length / 2.6 + 0.8) : sh.hold || 3;
  }
  function next() { const sh = SHOTS[shot]; if (lineIdx < sh.lines.length - 1) { lineIdx++; startLine(); return; } shot++; lineIdx = 0; shotT = 0; if (shot >= SHOTS.length) return finish(); startLine(); }
  function finish() { if (done) return; done = true; window.removeEventListener('keydown', key, true); window.removeEventListener('resize', resize); wrap.classList.add('out'); setTimeout(() => wrap.remove(), 700); onDone && onDone(); }
  function key(e) { if (e.code === 'Escape') { e.stopPropagation(); finish(); } else if (e.code === 'Space' || e.code === 'Enter') { e.stopPropagation(); e.preventDefault(); next(); } }
  window.addEventListener('keydown', key, true); wrap.addEventListener('click', next);
  music && music('quiet'); startLine();
  function loop(now) {
    if (done) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; shotT += dt; lineT += dt;
    const sh = SHOTS[shot]; (sh.sfx || []).forEach(([at, n], i) => { const k = shot + ':' + i; if (shotT >= at && !fired.has(k)) { fired.add(k); sfx && sfx(n); } });
    staticOn = shot === 1; frame(PANELS[sh.p], shotT, sh.zoom, sh.pan);
    if (lineT >= lineDur) next();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { skip: finish };
}
