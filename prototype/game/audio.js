// Procedural audio, all synthesised with Web Audio (no sound files):
// SFX, positional panning, adaptive music (town / explore / combat / boss per floor), babble voices for NPCs,
// the host and monsters, and an optional spoken host voice through the browser's speech engine.
export function createAudio() {
  let ctx = null, master, music, sfx, voice, comp, noiseBuf, verb, verbSend;
  const S = { master: 0.8, music: 0.45, sfx: 0.8, voice: 0.9, voiceMode: 'speech' };
  try { Object.assign(S, JSON.parse(localStorage.getItem('downstairs_audio') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('downstairs_audio', JSON.stringify(S)); } catch (e) {} };
  let listener = { x: 0, z: 0, yaw: 0 }; let active = 0; // live oscillators/noise sources, capped so big fights can't overload audio

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.connect(comp); music = ctx.createGain(); sfx = ctx.createGain(); voice = ctx.createGain(); [music, sfx, voice].forEach((g) => g.connect(master));
    // small room reverb from a synthetic impulse
    const len = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb = ctx.createConvolver(); verb.buffer = ir; verbSend = ctx.createGain(); verbSend.gain.value = 0.22; verbSend.connect(verb); verb.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    apply(); startMusic();
  }
  function apply() { if (!ctx) return; master.gain.value = S.master; music.gain.value = S.music * 0.55; sfx.gain.value = S.sfx; voice.gain.value = S.voice; save(); }

  // ---------- building blocks ----------
  const now = () => ctx.currentTime;
  function out(bus, pos, wet = 0.15) { // returns an input node routed through distance + pan
    const g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; let vol = 1;
    if (pos) { const dx = pos.x - listener.x, dz = pos.z - listener.z, d = Math.hypot(dx, dz); vol = 1 / (1 + d * d * 0.012); if (vol < 0.02) vol = 0; if (p && d > 0.3) { p.pan.value = Math.max(-0.9, Math.min(0.9, (dx * Math.cos(listener.yaw) - dz * Math.sin(listener.yaw)) / d)); } }
    g.gain.value = vol; if (p) { g.connect(p); p.connect(bus); } else g.connect(bus);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet * vol; g.connect(w); w.connect(verbSend); }
    return vol > 0 ? g : null;
  }
  function osc(type, f, t0, dur, dest, { gain = 0.3, f1 = null, a = 0.005, curve = 'exp' } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + a); if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); else g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05); active++; o.onended = () => { active--; try { o.disconnect(); g.disconnect(); } catch (e) {} }; return o;
  }
  function noise(t0, dur, dest, { gain = 0.3, type = 'bandpass', f = 1000, f1 = null, q = 1, a = 0.005 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur); fl.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05); active++; s.onended = () => { active--; try { s.disconnect(); fl.disconnect(); g.disconnect(); } catch (e) {} };
  }
  const curves = {}; const dist = (k = 20) => { const ws = ctx.createWaveShaper(); if (!curves[k]) { const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); } curves[k] = c; } ws.curve = curves[k]; return ws; };

  // ---------- sound effects ----------
  const lastPlayed = {};
  function play(name, pos) {
    if (!ctx) return; const t = now(); const gap = { hit: 0.06, step: 0.12, swing: 0.08, windup: 0.15, bossWindup: 0.3, death: 0.15, hurt: 0.12 }[name] || 0.04; if (lastPlayed[name] && t - lastPlayed[name] < gap) return;
    const vital = ['parry', 'levelup', 'victory', 'achieve', 'roar', 'slam'].includes(name); if (active > (vital ? 90 : 56)) return; lastPlayed[name] = t;
    const o = out(sfx, pos, name === 'slam' || name === 'roar' ? 0.35 : 0.12); if (!o) return;
    switch (name) {
      case 'firebolt': noise(t, 0.35, o, { gain: 0.35, f: 3000, f1: 600, q: 0.8 }); osc('sine', 900, t, 0.18, o, { gain: 0.12, f1: 300 }); break;
      case 'fireball': noise(t, 0.6, o, { gain: 0.45, f: 1600, f1: 250, q: 0.7, a: 0.03 }); osc('sawtooth', 160, t, 0.5, o, { gain: 0.08, f1: 60 }); break;
      case 'explode': case 'bomb': noise(t, 1.1, o, { gain: 0.9, type: 'lowpass', f: 2400, f1: 80, q: 0.3 }); osc('sine', 110, t, 0.8, o, { gain: 0.7, f1: 30 }); noise(t + 0.05, 0.6, o, { gain: 0.2, f: 5000, f1: 1500 }); break;
      case 'ward': osc('triangle', 300, t, 0.6, o, { gain: 0.15, f1: 600 }); noise(t, 0.6, o, { gain: 0.12, f: 2000, f1: 4000, q: 2 }); break;
      case 'hit': noise(t, 0.12, o, { gain: 0.45, type: 'lowpass', f: 1800, q: 0.5 }); osc('sine', 140, t, 0.12, o, { gain: 0.35, f1: 60 }); noise(t + 0.02, 0.3, o, { gain: 0.08, f: 6000, q: 1 }); break;
      case 'swing': case 'throw': case 'dodge': noise(t, 0.25, o, { gain: 0.35, f: 600, f1: 2500, q: 2.5, a: 0.04 }); break;
      case 'windup': noise(t, 0.4, o, { gain: 0.07, f: 300, f1: 900, q: 3, a: 0.2 }); break;
      case 'bossWindup': noise(t, 0.7, o, { gain: 0.15, f: 120, f1: 500, q: 4, a: 0.3 }); osc('sawtooth', 60, t, 0.7, o, { gain: 0.08, f1: 90, a: 0.3 }); break;
      case 'parry': [1, 2.76, 5.4, 8.9].forEach((k, i) => osc('sine', 620 * k, t, 0.6 - i * 0.1, o, { gain: 0.22 / (i + 1) })); noise(t, 0.05, o, { gain: 0.5, f: 4000, q: 0.5 }); break;
      case 'parryTry': noise(t, 0.12, o, { gain: 0.06, f: 3000, f1: 5000, q: 3 }); break;
      case 'block': noise(t, 0.15, o, { gain: 0.45, type: 'lowpass', f: 700 }); osc('square', 90, t, 0.1, o, { gain: 0.1 }); break;
      case 'hurt': noise(t, 0.18, o, { gain: 0.4, type: 'lowpass', f: 900 }); voiceBurst('oh', { pitch: 150, rough: 0.2 }, t, o, 0.22); break;
      case 'slam': noise(t, 1.2, o, { gain: 1, type: 'lowpass', f: 900, f1: 60, q: 0.4 }); osc('sine', 70, t, 1.0, o, { gain: 0.8, f1: 25 }); break;
      case 'splash': noise(t, 0.7, o, { gain: 0.4, f: 1200, f1: 300, q: 0.6 }); for (let i = 0; i < 5; i++) osc('sine', 600 + Math.random() * 900, t + i * 0.06, 0.08, o, { gain: 0.06, f1: 1600 }); break;
      case 'pickup': [880, 1320, 1760].forEach((f, i) => osc('triangle', f, t + i * 0.05, 0.18, o, { gain: 0.12 })); break;
      case 'coin': osc('square', 1900, t, 0.08, o, { gain: 0.05 }); osc('square', 2500, t + 0.06, 0.14, o, { gain: 0.05 }); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => { osc('triangle', f, t + i * 0.09, 0.5, o, { gain: 0.14 }); osc('sine', f * 2, t + i * 0.09, 0.3, o, { gain: 0.04 }); }); break;
      case 'achieve': [784, 988, 1175, 1568].forEach((f, i) => osc('square', f, t + i * 0.07, 0.25, o, { gain: 0.05 })); osc('triangle', 392, t, 0.8, o, { gain: 0.12 }); break;
      case 'victory': [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => osc('sawtooth', f, t + i * 0.13, 0.4, o, { gain: 0.06 })); osc('sine', 98, t, 1.4, o, { gain: 0.3 }); break;
      case 'craft': for (let i = 0; i < 3; i++) { osc('square', 1200 + i * 90, t + i * 0.12, 0.09, o, { gain: 0.07 }); noise(t + i * 0.12, 0.06, o, { gain: 0.25, f: 3500, q: 3 }); } break;
      case 'ui': osc('triangle', 1200, t, 0.05, o, { gain: 0.06 }); break;
      case 'step': noise(t, 0.07, o, { gain: 0.06, type: 'lowpass', f: 400 + Math.random() * 200 }); break;
      case 'roar': { const d = dist(40); d.connect(o); osc('sawtooth', 90, t, 1.4, d, { gain: 0.3, f1: 55, a: 0.1 }); osc('sawtooth', 93, t, 1.4, d, { gain: 0.25, f1: 50, a: 0.1 }); noise(t, 1.4, o, { gain: 0.3, f: 500, f1: 200, q: 2, a: 0.1 }); break; }
      case 'death': voiceBurst('ah', { pitch: 220, rough: 0.5 }, t, o, 0.5, 0.6); break;
      case 'static': noise(t, 1.2, o, { gain: 0.35, type: 'highpass', f: 1500, a: 0.01 }); break;
      case 'rumble': noise(t, 3.5, o, { gain: 0.9, type: 'lowpass', f: 220, f1: 60, q: 0.3, a: 0.4 }); osc('sine', 45, t, 3.5, o, { gain: 0.5, a: 0.5, curve: 'lin' }); break;
      case 'siren': for (let i = 0; i < 4; i++) { osc('sawtooth', 600, t + i * 1.1, 0.55, o, { gain: 0.05, f1: 900, a: 0.05 }); osc('sawtooth', 900, t + i * 1.1 + 0.55, 0.55, o, { gain: 0.05, f1: 600, a: 0.05 }); } break;
      case 'flick': noise(t, 0.06, o, { gain: 0.5, f: 5000, q: 1 }); noise(t + 0.05, 0.6, o, { gain: 0.2, f: 900, f1: 600, q: 0.6, a: 0.05 }); break;
      case 'door': noise(t, 0.5, o, { gain: 0.3, type: 'lowpass', f: 500 }); osc('sine', 80, t, 0.3, o, { gain: 0.3 }); break;
    }
  }

  // ---------- voices: formant babble ----------
  const VOW = { a: [800, 1150], e: [500, 1750], i: [320, 2300], o: [500, 900], u: [350, 800], ah: [750, 1200], oh: [450, 800] };
  function voiceBurst(v, P, t, dest, dur = 0.12, drop = 0) {
    const [f1, f2] = VOW[v] || VOW.a; const src = ctx.createOscillator(); src.type = P.wave || 'sawtooth'; src.frequency.setValueAtTime(P.pitch, t); if (drop) src.frequency.exponentialRampToValueAtTime(P.pitch * (1 - drop), t + dur); else src.frequency.linearRampToValueAtTime(P.pitch * (1 + (P.inflect || 0)), t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const b1 = ctx.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = f1 * (P.formant || 1); b1.Q.value = 6; const b2 = ctx.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = f2 * (P.formant || 1); b2.Q.value = 8;
    let head = src; if (P.rough) { const d = dist(P.rough * 60); src.connect(d); head = d; }
    head.connect(b1); head.connect(b2); const mix = ctx.createGain(); mix.gain.value = 2.2; b1.connect(mix); b2.connect(mix); mix.connect(g); g.connect(dest); src.start(t); src.stop(t + dur + 0.05);
    if (P.breath) noise(t, dur, dest, { gain: P.breath, f: f2, q: 3 });
  }
  // voice presets: pitch (Hz), speed (syllables/s), formant shift, roughness
  const VOICES = {
    host: { pitch: 190, speed: 11, formant: 1.08, wave: 'sawtooth', inflect: 0.15 },
    goblin: { pitch: 300, speed: 12, formant: 1.35, rough: 0.35, inflect: 0.3 },
    thrower: { pitch: 340, speed: 13, formant: 1.4, rough: 0.3, inflect: 0.3 },
    captain: { pitch: 210, speed: 10, formant: 1.2, rough: 0.5 },
    wight: { pitch: 85, speed: 4, formant: 0.8, rough: 0.2, breath: 0.08, wave: 'triangle' },
    pylon: { pitch: 140, speed: 9, formant: 1.1, rough: 0.6 }, ebb: { pitch: 70, speed: 5, formant: 0.75, rough: 0.4, breath: 0.1 },
    moth: { pitch: 420, speed: 15, formant: 1.6, rough: 0.2, wave: 'square', breath: 0.05 }, pigeon: { pitch: 260, speed: 9, formant: 0.9, rough: 0.3, inflect: -0.2 }, mimic: { pitch: 120, speed: 8, formant: 1.3, wave: 'square', rough: 0.6 },
    bulbQueen: { pitch: 300, speed: 8, formant: 1.4, wave: 'triangle', breath: 0.06 }, coo: { pitch: 150, speed: 7, formant: 0.85, rough: 0.4, breath: 0.05 }, coneKing: { pitch: 120, speed: 8, formant: 1.05, rough: 0.7 },
    wickley: { pitch: 230, speed: 13, formant: 1.2 }, ash: { pitch: 120, speed: 6, formant: 0.9, breath: 0.03 }, vrask: { pitch: 330, speed: 9, formant: 1.5, wave: 'triangle' },
    marta: { pitch: 210, speed: 10, formant: 1.12 }, pickles: { pitch: 260, speed: 14, formant: 1.25, rough: 0.15 }, spin: { pitch: 240, speed: 12, formant: 1.2, wave: 'square' }, reggie: { pitch: 110, speed: 7, formant: 0.92, breath: 0.04 },
    merchant: { pitch: 150, speed: 10, formant: 1 }, villager: { pitch: 180, speed: 10, formant: 1.05 },
  };
  // ---------- real spoken voices (the browser's speech engine), cast per character ----------
  // accent = preferred English locales in order; g = gender hint matched against voice names; pitch/rate shape the character
  const CAST = {
    host: { accent: ['en-US'], g: 'm', pitch: 1.12, rate: 1.12 },
    narrator: { accent: ['en-GB'], g: 'm', pitch: 0.92, rate: 0.95 },
    marta: { accent: ['en-IE', 'en-GB'], g: 'f', pitch: 0.95, rate: 0.98 },
    pickles: { accent: ['en-AU', 'en-NZ', 'en-GB'], g: 'm', pitch: 1.45, rate: 1.22 },
    bo: { accent: ['en-GB-SCT', 'en-SC', 'en-GB'], g: 'm', pitch: 0.7, rate: 0.95 },
    bev: { accent: ['en-AU', 'en-NZ'], g: 'f', pitch: 1.1, rate: 1.08 },
    bix: { accent: ['en-NZ', 'en-AU', 'en-GB'], g: 'm', pitch: 0.85, rate: 1.0 },
    spin: { accent: ['en-IN', 'en-US'], g: 'f', pitch: 1.25, rate: 1.15 },
    reggie: { accent: ['en-GB'], g: 'm', pitch: 0.62, rate: 0.82 },
    wickley: { accent: ['en-ZA', 'en-GB'], g: 'm', pitch: 1.2, rate: 1.15 },
    ash: { accent: ['en-IN', 'en-GB'], g: 'm', pitch: 0.78, rate: 0.82 },
    vrask: { accent: ['en-GB'], g: 'm', pitch: 1.55, rate: 0.88 },
    merchant: { accent: ['en-GB', 'en-US'], g: 'm', pitch: 0.9, rate: 1.0 },
    villager: { accent: ['en-'], g: null, pitch: 1.0, rate: 1.0, varied: true },
    goblin: { accent: ['en-GB', 'en-AU', 'en-'], g: 'm', pitch: 1.95, rate: 1.35, varied: true, growl: 'goblin' },
    thrower: { accent: ['en-AU', 'en-'], g: 'm', pitch: 2, rate: 1.4, varied: true, growl: 'goblin' },
    captain: { accent: ['en-GB', 'en-'], g: 'm', pitch: 1.35, rate: 1.1, growl: 'goblin' },
    pylon: { accent: ['en-GB', 'en-'], g: 'm', pitch: 0.65, rate: 1.08, growl: 'big' },
    wight: { accent: ['en-'], g: 'm', pitch: 0.1, rate: 0.6, growl: 'ghost' }, ebb: { accent: ['en-GB', 'en-'], g: 'm', pitch: 0.25, rate: 0.72, growl: 'ghost' },
    moth: { accent: ['en-'], g: 'f', pitch: 2, rate: 1.5, growl: 'buzz' }, bulbQueen: { accent: ['en-GB', 'en-'], g: 'f', pitch: 1.5, rate: 0.9, growl: 'buzz' },
    pigeon: { accent: ['en-US', 'en-'], g: 'm', pitch: 1.6, rate: 1.25, growl: 'coo' }, coo: { accent: ['en-GB', 'en-'], g: 'm', pitch: 0.5, rate: 0.8, growl: 'coo' },
    mimic: { accent: ['en-US', 'en-'], g: 'm', pitch: 0.4, rate: 0.85, growl: 'metal' }, coneKing: { accent: ['en-GB', 'en-'], g: 'm', pitch: 0.45, rate: 0.95, growl: 'big' },
    lamprey: { accent: ['en-'], g: null, pitch: 0.3, rate: 0.7, growl: 'ghost' }, bigSucker: { accent: ['en-'], g: null, pitch: 0.2, rate: 0.7, growl: 'big' },
  };
  const FEM = /female|zira|susan|hazel|libby|sonia|natasha|emily|aria|jenny|clara|moira|karen|tessa|fiona|samantha|victoria|kate|serena|veena|ava|allison|neerja|molly|emma|michelle|ana\b|leah|luna|maisie|mia|hollie|catherine|heera|linda|sara|nicole|olivia|amy|joanna|salli|kimberly|ivy|kendra|raveena|aditi|isla|sonia|abbi|bella|elsie|hayley|ruby|yan|annette|freya|natalie|tina|zoe|eliza|imani|luciana|rosa|siri/i;
  const MALE = /male|david|mark|george|ryan|thomas|william|connor|daniel|oliver|rishi|prabhat|guy|christopher|eric|roger|steffan|brian|liam|mitchell|luke|alex|fred|tom\b|arthur|james|ken|duncan|darren|elliot|ethan|ollie|noah|alfie|aaron|andrew|brandon|davis|jacob|jason|tony|ravi|hemant|kai|neil|ken|matthew|joey|justin|russell|geraint|gordon|lee|rocko|reed|grandpa|eddy|ralph/i;
  let voices = [];
  const loadVoices = () => { try { voices = (window.speechSynthesis ? window.speechSynthesis.getVoices() : []).filter((v) => /^en/i.test(v.lang)); } catch (e) { voices = []; } };
  if (window.speechSynthesis) { loadVoices(); try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
  const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const quality = (v) => (/natural|online|neural/i.test(v.name) ? 3 : /google/i.test(v.name) ? 2 : v.localService ? 1 : 1);
  const castCache = {};
  function pickVoice(who, seed) {
    const key = who + '|' + seed; if (castCache[key] !== undefined) return castCache[key];
    const C = CAST[who] || CAST.villager; let pool = [];
    for (const a of C.accent) { const m = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(a.toLowerCase())); if (m.length) { pool = m; break; } }
    if (!pool.length) pool = voices.slice();
    const g = C.g || (C.varied ? (hash(seed) % 2 ? 'f' : 'm') : null);
    if (g) { const gp = pool.filter((v) => (g === 'f' ? FEM.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/i, '')) : MALE.test(v.name.replace(/female/i, '')) && !FEM.test(v.name))); if (gp.length) pool = gp; }
    pool.sort((a, b) => quality(b) - quality(a)); const top = pool.filter((v) => quality(v) === quality(pool[0]));
    const v = top.length ? top[hash(who + seed) % top.length] : null; castCache[key] = v; return v;
  }
  let speakPri = 0, speakUntil = 0, lastBark = 0;
  function speak(text, who, pos, opts) {
    const synth = window.speechSynthesis; if (!synth || !voices.length) return -1;
    const clean = text.replace(/<[^>]+>/g, '').replace(/\*[^*]+\*/g, '').replace(/[…]/g, '...').trim(); if (!clean) return 0;
    const pri = opts.pri ?? (who === 'host' ? 2 : 1); const nowS = performance.now() / 1000; const busy = synth.speaking && nowS < speakUntil;
    if (busy && pri < speakPri) return 0; // a bark never interrupts dialogue or the host
    if (pri === 1) { if (nowS - lastBark < 2.5) return 0; lastBark = nowS; }
    let vol = 1; if (pos) { const d = Math.hypot(pos.x - listener.x, pos.z - listener.z); vol = 1 / (1 + d * d * 0.01); if (vol < 0.08) return 0; }
    const C = CAST[who] || CAST.villager; const seed = opts.seed ?? 0; const v = pickVoice(who, seed);
    try { synth.cancel(); const u = new SpeechSynthesisUtterance(clean); if (v) { u.voice = v; u.lang = v.lang; }
      const vary = C.varied ? 0.85 + (hash(seed) % 30) / 100 : 1; u.pitch = Math.max(0, Math.min(2, C.pitch * vary)); u.rate = Math.max(0.5, Math.min(1.6, C.rate)); u.volume = Math.max(0, Math.min(1, S.voice * S.master * vol));
      u.onend = () => { speakPri = 0; }; synth.speak(u); speakPri = pri; const dur = clean.split(/\s+/).length / (2.6 * u.rate) + 0.4; speakUntil = nowS + dur;
      if (C.growl && ctx) growl(C.growl, pos); return dur; } catch (e) { return -1; }
  }
  // a short creature sound under a monster's line, so they sound like monsters and not just people
  function growl(kind, pos) {
    const o = out(sfx, pos, 0.2); if (!o || active > 40) return; const t = now();
    if (kind === 'goblin') { const d = dist(30); d.connect(o); osc('sawtooth', 320, t, 0.35, d, { gain: 0.08, f1: 220 }); }
    if (kind === 'big') { const d = dist(40); d.connect(o); osc('sawtooth', 90, t, 0.6, d, { gain: 0.14, f1: 60, a: 0.05 }); noise(t, 0.6, o, { gain: 0.12, f: 400, f1: 150, q: 2 }); }
    if (kind === 'ghost') { osc('sine', 180, t, 1.2, o, { gain: 0.06, f1: 120, a: 0.3 }); noise(t, 1.2, o, { gain: 0.05, f: 900, q: 6, a: 0.3 }); }
    if (kind === 'buzz') { osc('sawtooth', 210, t, 0.5, o, { gain: 0.05 }); osc('square', 213, t, 0.5, o, { gain: 0.03 }); }
    if (kind === 'coo') { for (let i = 0; i < 3; i++) osc('sine', 420 - i * 30, t + i * 0.18, 0.16, o, { gain: 0.07, f1: 300 }); }
    if (kind === 'metal') { [1, 2.7, 5.1].forEach((k) => osc('square', 140 * k, t, 0.4, o, { gain: 0.03 })); }
  }
  let speaking = null;
  function say(text, who = 'villager', pos = null, opts = {}) {
    if (S.voiceMode === 'speech') { const r = speak(text, who, pos, opts); if (r >= 0) return r; }
    if (!ctx || active > 30) return 0; const P = { ...(VOICES[who] || VOICES.villager), ...(opts.voice || {}) }; if (opts.seed) { P.pitch *= 0.85 + (opts.seed % 7) * 0.05; P.formant = (P.formant || 1) * (0.92 + (opts.seed % 5) * 0.04); }
    // babble fallback (no speech voices available)
    const o = out(voice, pos, 0.1); if (!o) return 0; const words = text.replace(/<[^>]+>/g, '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, opts.max || 26);
    let t = now() + 0.02; const step = 1 / P.speed; const question = /\?\s*$/.test(text), shout = /!\s*$/.test(text) || text === text.toUpperCase();
    words.forEach((w, wi) => { const syl = w.match(/[aeiouy]+/g) || ['a']; syl.slice(0, 3).forEach((s, si) => { const v = s[0] === 'y' ? 'i' : s[0]; const last = wi === words.length - 1 && si === Math.min(2, syl.length - 1);
      const pv = { ...P, pitch: P.pitch * (1 + Math.sin(wi * 1.7 + si) * 0.08) * (shout ? 1.15 : 1) * (last && question ? 1.25 : 1), inflect: last ? (question ? 0.3 : -0.2) : P.inflect || 0 };
      voiceBurst(v, pv, t, o, step * 0.9 * (last ? 1.6 : 1)); if (/^[ptkbdg]/.test(w) && si === 0) noise(t - 0.01, 0.02, o, { gain: 0.15, f: 3000, q: 1 }); t += step; }); t += step * 0.35; if (/[,.!?]$/.test(w)) t += step * 1.2; });
    return t - now();
  }

  // ---------- music ----------
  // each floor gets a key, tempo and texture; moods add layers. Notes are scheduled ahead on a 16-step grid.
  const FLOORS = {
    1: { root: 50, scale: [0, 2, 3, 5, 7, 8, 10], bpm: 96, bass: 'sawtooth', lead: 'square', prog: [0, 5, 3, 4] },
    2: { root: 52, scale: [0, 2, 3, 5, 7, 9, 10], bpm: 112, bass: 'triangle', lead: 'triangle', prog: [0, 3, 4, 3] },
    3: { root: 45, scale: [0, 1, 3, 5, 7, 8, 10], bpm: 88, bass: 'sawtooth', lead: 'sine', prog: [0, 1, 5, 4] },
    pad: { root: 53, scale: [0, 2, 4, 5, 7, 9, 11], bpm: 84, bass: 'triangle', lead: 'sine', prog: [0, 5, 3, 4] },
  };
  let floorKey = '1', mood = 'explore', moodGain = {}, nextT = 0, step = 0, timer = null, layers = {};
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function startMusic() {
    for (const k of ['pad', 'bass', 'drums', 'lead', 'heavy']) { layers[k] = ctx.createGain(); layers[k].gain.value = 0; layers[k].connect(music); }
    nextT = now() + 0.1; timer = setInterval(sched, 50); setMood(mood, true);
  }
  function setFloor(f) { floorKey = FLOORS[f] ? String(f) : '1'; }
  function setMood(m, force) {
    if (!ctx || (m === mood && !force)) { mood = m; return; } mood = m;
    const L = { town: { pad: 0.5, bass: 0.35, drums: 0.12, lead: 0.3, heavy: 0 }, explore: { pad: 0.45, bass: 0.4, drums: 0.18, lead: 0.15, heavy: 0 }, combat: { pad: 0.25, bass: 0.55, drums: 0.5, lead: 0.25, heavy: 0.15 }, boss: { pad: 0.2, bass: 0.6, drums: 0.6, lead: 0.3, heavy: 0.45 }, quiet: { pad: 0.3, bass: 0, drums: 0, lead: 0, heavy: 0 } }[m] || {};
    for (const [k, g] of Object.entries(layers)) { g.gain.cancelScheduledValues(now()); g.gain.setTargetAtTime(L[k] || 0, now(), 0.8); }
  }
  function sched() {
    if (!ctx) return; const F = FLOORS[floorKey]; const bpm = F.bpm * (mood === 'combat' ? 1.18 : mood === 'boss' ? 1.25 : 1); const sp = 60 / bpm / 4;
    while (nextT < now() + 0.2) { const s = step % 16, bar = Math.floor(step / 16) % 4, deg = F.prog[bar]; const chordRoot = F.root + F.scale[deg % 7] + (deg >= 7 ? 12 : 0);
      const note = (d, oct = 0) => F.root + F.scale[((deg + d) % 7 + 7) % 7] + 12 * (oct + Math.floor((deg + d) / 7));
      if (s === 0) for (const d of [0, 2, 4]) osc('triangle', midi(note(d, 1)), nextT, sp * 15, layers.pad, { gain: 0.05, a: 0.4, curve: 'lin' });
      if (s % 4 === 0 || (s === 10 && mood !== 'town')) osc(F.bass, midi(chordRoot - 12), nextT, sp * (s === 10 ? 1.5 : 3), layers.bass, { gain: 0.16, a: 0.01 });
      if (s === 14 && bar % 2) osc(F.bass, midi(chordRoot - 10), nextT, sp, layers.bass, { gain: 0.12 });
      if (s % 8 === 0) { osc('sine', 120, nextT, 0.25, layers.drums, { gain: 0.6, f1: 40 }); } if (s % 8 === 4) noise(nextT, 0.18, layers.drums, { gain: 0.25, f: 1800, q: 0.7 }); if (s % 2 === 0) noise(nextT, 0.04, layers.drums, { gain: 0.08, type: 'highpass', f: 7000 });
      if ((mood === 'combat' || mood === 'boss') && s % 4 === 2) osc('sine', 100, nextT, 0.15, layers.drums, { gain: 0.35, f1: 45 });
      if (mood === 'boss' && s % 2 === 0) osc('sawtooth', midi(chordRoot - 24 + (s % 4 ? 0 : 0)), nextT, sp * 1.8, layers.heavy, { gain: 0.1 });
      if (mood === 'combat' && s % 4 === 0) osc('square', midi(chordRoot - 12), nextT, sp * 0.8, layers.heavy, { gain: 0.05 });
      const leadPat = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0]; if (leadPat[s] && Math.random() < 0.7) { const d = [0, 2, 4, 5, 4, 2, 1, 3][(s + bar * 3) % 8]; osc(F.lead, midi(note(d, 2)), nextT, sp * 1.6, layers.lead, { gain: 0.035, a: 0.01 }); }
      nextT += sp; step++; }
  }

  return {
    init, play, say, setMood, setFloor, settings: S, apply, voiceCount: () => voices.length, voiceFor: (who) => { const v = pickVoice(who, 0); return v ? `${v.name} (${v.lang})` : 'none'; },
    stopSpeech: () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} },
    setListener(x, z, yaw) { listener.x = x; listener.z = z; listener.yaw = yaw; },
    get ready() { return !!ctx; },
  };
}
