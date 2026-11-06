// Procedural audio, all synthesised with Web Audio (no sound files):
// SFX, positional panning, adaptive music (town / explore / combat / boss per floor), babble voices for NPCs,
// the host and monsters, and an optional spoken host voice through the browser's speech engine.
export function createAudio() {
  let ctx = null, master, music, sfx, voice, comp, noiseBuf, verb, verbSend;
  const S = { master: 0.8, music: 0.45, sfx: 0.8, voice: 0.8, hostSpeech: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem('downstairs_audio') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('downstairs_audio', JSON.stringify(S)); } catch (e) {} };
  let listener = { x: 0, z: 0, yaw: 0 };

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
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05); return o;
  }
  function noise(t0, dur, dest, { gain = 0.3, type = 'bandpass', f = 1000, f1 = null, q = 1, a = 0.005 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur); fl.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  const dist = (k = 20) => { const ws = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); } ws.curve = c; return ws; };

  // ---------- sound effects ----------
  const lastPlayed = {};
  function play(name, pos) {
    if (!ctx) return; const t = now(); if (lastPlayed[name] && t - lastPlayed[name] < 0.03) return; lastPlayed[name] = t;
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
  let speaking = null;
  function say(text, who = 'villager', pos = null, opts = {}) {
    if (!ctx) return 0; const P = { ...(VOICES[who] || VOICES.villager), ...(opts.voice || {}) }; if (opts.seed) { P.pitch *= 0.85 + (opts.seed % 7) * 0.05; P.formant = (P.formant || 1) * (0.92 + (opts.seed % 5) * 0.04); }
    if (who === 'host' && S.hostSpeech && window.speechSynthesis) { try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')); u.rate = 1.12; u.pitch = 1.15; u.volume = S.voice * S.master; window.speechSynthesis.speak(u); return 1; } catch (e) {} }
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
    init, play, say, setMood, setFloor, settings: S, apply,
    setListener(x, z, yaw) { listener.x = x; listener.z = z; listener.yaw = yaw; },
    get ready() { return !!ctx; },
  };
}
