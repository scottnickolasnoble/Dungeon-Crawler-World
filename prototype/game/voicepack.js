// Your own voice recordings: import audio files named after the lines in voice/SCRIPTS.md (e.g. marta_03.wav),
// they're kept in this browser (IndexedDB), and when a character says a line you recorded, your recording plays
// through that character's voice effect instead of the synthetic voice. One person can voice everyone.
import LINES from '../voice/lines.js';

// per-character effect: pitch (semitones), formant tilt, growl (distortion), robot (ring mod Hz), echo, radio
export const VOICE_FX = {
  host: { pitch: 0, echo: 0.12 }, narrator: { pitch: -1, echo: 0.18 }, marta: {}, pickles: { pitch: 4 }, bo: { pitch: -3, growl: 6 }, bev: { pitch: 3 }, bix: { pitch: -2 },
  spin: { pitch: 3 }, reggie: { pitch: -4, tilt: -1 }, wickley: { pitch: 2 }, ash: { pitch: -2, echo: 0.25 }, vrask: { pitch: 5, robot: 30, echo: 0.15 }, pip: { pitch: 3 },
  callings: { echo: 0.4 }, sunny: { pitch: 3 }, prickle: { pitch: 1, echo: 0.3 }, deb: { pitch: -1 }, watch: { radio: true }, gusset: { pitch: -3 }, lantern: { pitch: -2, echo: 0.3 },
  goblin: { pitch: 6, growl: 12 }, thrower: { pitch: 7, growl: 10 }, captain: { pitch: 3, growl: 18 }, pylon: { pitch: -3, growl: 20 }, wight: { pitch: -7, echo: 0.45, tilt: -1 }, ebb: { pitch: -8, echo: 0.4, growl: 6 },
  lamprey: { pitch: -9, growl: 10, echo: 0.3 }, moth: { pitch: 9, robot: 90 }, pigeon: { pitch: 5, robot: 12 }, mimic: { pitch: -5, robot: 60, growl: 10 }, hag: { pitch: 3, growl: 8, echo: 0.2 }, mallcop: { pitch: -4, radio: true },
  hound: { pitch: -3, growl: 24 }, gnome: { pitch: 8 }, slime: { pitch: -6, robot: 8 }, leech: { pitch: 2, robot: 40 }, hunter: { pitch: 0, echo: 0.1 }, villager: {}, dale: {},
};
const norm = (t) => String(t).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const BY_TEXT = new Map(Object.entries(LINES).map(([k, t]) => [norm(t), k]));

export function createVoicePack(getCtx, outBus) {
  const clips = new Map(); // key -> AudioBuffer
  let db = null;
  const open = () => new Promise((res) => { try { const r = indexedDB.open('downstairs_voice', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => { db = r.result; res(db); }; r.onerror = () => res(null); } catch (e) { res(null); } });
  async function load() { await open(); if (!db) return 0; return new Promise((res) => { try { const tx = db.transaction('clips'); const st = tx.objectStore('clips'); const req = st.getAllKeys(); req.onsuccess = async () => { for (const k of req.result) { const g = st.get(k); await new Promise((r2) => { g.onsuccess = async () => { await decode(k, g.result); r2(); }; g.onerror = r2; }); } res(clips.size); }; req.onerror = () => res(0); } catch (e) { res(0); } }); }
  async function decode(key, buf) { const ctx = getCtx(); if (!ctx || !buf) return; try { clips.set(key, await ctx.decodeAudioData(buf.slice(0))); } catch (e) {} }
  async function importFiles(files) { await open(); let n = 0; for (const f of files) { const key = f.name.replace(/\.[a-z0-9]+$/i, '').toLowerCase(); if (!LINES[key]) continue; const buf = await f.arrayBuffer(); try { db && db.transaction('clips', 'readwrite').objectStore('clips').put(buf, key); } catch (e) {} await decode(key, buf); n++; } return n; }
  function clear() { clips.clear(); try { db && db.transaction('clips', 'readwrite').objectStore('clips').clear(); } catch (e) {} }
  const keyFor = (text) => BY_TEXT.get(norm(text));
  // play a recording through the speaker's effect chain; returns its duration or 0 if there is no recording
  function play(text, who) {
    const ctx = getCtx(); if (!ctx) return 0; const key = keyFor(text); const buf = key && clips.get(key); if (!buf) return 0;
    const fx = VOICE_FX[who] || VOICE_FX[key.split('_')[0]] || {}; const src = ctx.createBufferSource(); src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (fx.pitch || 0) / 12); let node = src;
    const chain = (n) => { node.connect(n); node = n; };
    if (fx.tilt) { const f = ctx.createBiquadFilter(); f.type = 'lowshelf'; f.frequency.value = 400; f.gain.value = fx.tilt * -6; chain(f); }
    if (fx.growl) { const ws = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = ((1 + fx.growl) * x) / (1 + fx.growl * Math.abs(x)); } ws.curve = c; chain(ws); }
    if (fx.robot) { const g = ctx.createGain(); g.gain.value = 0; const o = ctx.createOscillator(); o.frequency.value = fx.robot; o.connect(g.gain); o.start(); o.stop(ctx.currentTime + buf.duration / src.playbackRate.value + 0.2); chain(g); }
    if (fx.radio) { const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000; chain(hp); chain(lp); }
    const out = ctx.createGain(); out.gain.value = 1; chain(out); out.connect(outBus());
    if (fx.echo) { const d = ctx.createDelay(1); d.delayTime.value = 0.18; const fb = ctx.createGain(); fb.gain.value = fx.echo; out.connect(d); d.connect(fb); fb.connect(d); const w = ctx.createGain(); w.gain.value = 0.6; d.connect(w); w.connect(outBus()); setTimeout(() => { try { fb.disconnect(); } catch (e) {} }, (buf.duration + 2) * 1000); }
    src.start(); return buf.duration / src.playbackRate.value;
  }
  return { load, importFiles, clear, play, count: () => clips.size, total: Object.keys(LINES).length };
}
