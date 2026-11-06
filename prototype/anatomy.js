// Parametric anatomy: a humanoid and a quadruped signed-distance body, both with adjustable proportions.
// Coordinates: metres, feet at y=0, facing +z. Built in "unit" space and scaled to the requested height.
import { vnoise, fbm, smin, smax, ell, rcone, sph, chain } from './sculpt.js';

const ARM_POSES = {
  down: (sx, sw) => [[sx * 0.25 * sw, 1.3, 0], [sx * 0.34 * sw, 1.03, 0.0], [sx * 0.35 * sw, 0.8, 0.07]],
  forward: (sx, sw) => [[sx * 0.25 * sw, 1.3, 0], [sx * 0.36 * sw, 1.05, 0.12], [sx * 0.33 * sw, 1.02, 0.34]],
  reach: (sx, sw) => [[sx * 0.25 * sw, 1.3, 0], [sx * 0.37 * sw, 1.1, 0.16], [sx * 0.34 * sw, 1.18, 0.42]],
  hip: (sx, sw) => [[sx * 0.25 * sw, 1.3, 0], [sx * 0.4 * sw, 1.08, -0.06], [sx * 0.22 * sw, 0.92, 0.06]],
  raised: (sx, sw) => [[sx * 0.25 * sw, 1.3, 0], [sx * 0.38 * sw, 1.5, 0.05], [sx * 0.34 * sw, 1.72, 0.1]],
};

// P: { height, bulk, belly, shoulders, head, hunch, armL, armR, nose, ears, jaw, detail, legBulk }
export function humanoid(P = {}) {
  const H = P.height ?? 1.8, s = H / 1.8;
  const b = P.bulk ?? 1, k = P.belly ?? 0, sw = P.shoulders ?? 1, hs = P.head ?? 1, hz = (P.hunch ?? 0) * 0.12, lb = P.legBulk ?? b;
  const armL = ARM_POSES[P.armL ?? 'down'](1, sw), armR = ARM_POSES[P.armR ?? 'down'](-1, sw);
  for (const a of [armL, armR]) for (const p of a) p[2] += hz;
  const HC = [0, 1.63 + (hs - 1) * 0.1, 0.1 + hz * 1.6]; // head centre
  const hp = (x, y, z) => [HC[0] + x * hs, HC[1] + y * hs, HC[2] + z * hs];
  const eyeOff = [0.056, -0.012, 0.143];
  const detail = P.detail ?? 1;

  const head = (x, y, z) => {
    // into head-local, unscaled space
    const lx = (x - HC[0]) / hs, ly = (y - HC[1]) / hs, lz = (z - HC[2]) / hs, ax = Math.abs(lx);
    let d = ell(lx, ly, lz, 0, 0, 0, 0.14, 0.135, 0.155);
    d = smin(d, rcone(ax, ly, lz, 0, 0.035, 0.125, 0.1, 0.025, 0.09, 0.03, 0.022), 0.035); // brow
    d = smin(d, sph(ax, ly, lz, 0.088, -0.045, 0.095, 0.038), 0.035); // cheekbones
    const jaw = P.jaw ?? 'normal';
    const jw = jaw === 'heavy' ? 1.35 : 1;
    d = smin(d, ell(lx, ly, lz, 0, -0.12, 0.09, 0.105 * jw, 0.065 * jw, 0.1), 0.06); // muzzle
    d = smin(d, ell(lx, ly, lz, 0, -0.165, jaw === 'underbite' ? 0.1 : 0.08, 0.085 * jw, 0.04 * jw, 0.09), 0.04); // jaw
    const nose = P.nose ?? 'hook';
    if (nose === 'hook') { d = smin(d, rcone(lx, ly, lz, 0, 0.005, 0.145, 0, -0.065, 0.218, 0.022, 0.03), 0.03); d = smin(d, ell(lx, ly, lz, 0, -0.08, 0.215, 0.032, 0.022, 0.022), 0.02); }
    else if (nose === 'flat') { d = smin(d, ell(lx, ly, lz, 0, -0.06, 0.16, 0.045, 0.03, 0.03), 0.03); }
    else if (nose === 'long') { d = smin(d, rcone(lx, ly, lz, 0, 0.0, 0.145, 0, -0.1, 0.27, 0.02, 0.014), 0.025); d = smin(d, sph(lx, ly, lz, 0, -0.1, 0.27, 0.02), 0.01); }
    if (nose !== 'none') d = smax(d, -sph(ax, ly, lz, 0.015, -0.09, nose === 'flat' ? 0.188 : 0.222, 0.01), 0.008);
    d = smax(d, -sph(ax, ly, lz, eyeOff[0], eyeOff[1], eyeOff[2] + 0.002, 0.03), 0.012); // sockets
    const lid = sph(ax, ly, lz, eyeOff[0], eyeOff[1], eyeOff[2] - 0.001, 0.0305);
    d = smin(d, Math.max(lid, -(ly - (eyeOff[1] + 0.003 - (ax - eyeOff[0]) * 0.25))), 0.008);
    d = smin(d, Math.max(lid, ly - (eyeOff[1] - 0.016)), 0.006);
    d = smax(d, -ell(lx, ly, lz, 0, -0.138 + ax * 0.15, 0.155, 0.068, 0.0105, 0.05), 0.008); // mouth
    const ears = P.ears ?? 'point';
    if (ears === 'point') { const fz = (lz + 0.04) * 2.6; d = smin(d, rcone(ax - 0.13, ly - 0.015, fz, 0, 0, 0, 0.2, 0.07, -0.15, 0.05, 0.006), 0.03); }
    else if (ears === 'round') d = smin(d, ell(ax, ly, lz, 0.14, 0.0, -0.01, 0.025, 0.05, 0.035), 0.02);
    return d * hs;
  };

  const body = (x, y, z) => {
    const ax = Math.abs(x);
    let d = ell(x, y, z, 0, 0.86, 0.0, 0.17 * sw * (1 + k * 0.3), 0.13, 0.13 * (1 + k * 0.3));
    d = smin(d, ell(x, y, z, 0, 1.0 + k * 0.02, 0.045 + k * 0.07 + hz * 0.5, 0.165 * sw * (1 + k * 0.45), 0.15 * (1 + k * 0.35), 0.15 * (1 + k * 0.9)), 0.08);
    d = smin(d, ell(x, y, z, 0, 1.2, 0.02 + hz, 0.215 * sw * b ** 0.5, 0.17, 0.15 * b ** 0.4), 0.1);
    d = smin(d, ell(ax, y, z, 0.095 * sw, 1.25, 0.12 + hz, 0.095 * b ** 0.5, 0.065, 0.05 * b ** 0.4), 0.04);
    d = smin(d, ell(ax, y, z, 0.24 * sw, 1.3, hz, 0.085 * b ** 0.7, 0.08 * b ** 0.7, 0.085 * b ** 0.7), 0.06);
    d = smin(d, ell(ax, y, z, 0.1 * sw, 1.33, -0.06 + hz, 0.11 * b, 0.06 * b, 0.08), 0.07);
    d = smin(d, rcone(x, y, z, 0, 1.33, hz, 0, 1.5 + (hs - 1) * 0.08, 0.08 + hz * 1.5, 0.09 * b ** 0.5, 0.07 * hs), 0.07);
    if (detail) {
      for (let i = 0; i < 7; i++) d = smin(d, sph(x, y, z, 0, 1.36 - i * 0.065, -0.115 + hz * (1 - i / 7) + Math.sin(i * 0.6) * 0.01, 0.022), 0.03);
      d = smin(d, rcone(ax, y, z, 0.03, 1.34, 0.09 + hz, 0.2 * sw, 1.36, 0.03 + hz, 0.013, 0.012), 0.025);
    }
    for (const arm of [armL, armR]) {
      d = smin(d, chain(x, y, z, arm, [0.062 * b, 0.048 * b, 0.034 * b], 0.05), 0.05);
      const [sh, el, wr] = arm;
      d = smin(d, ell(x, y, z, (sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2, (sh[2] + el[2]) / 2, 0.05 * b, 0.075, 0.05 * b), 0.04); // biceps
      d = smin(d, ell(x, y, z, el[0] * 0.6 + wr[0] * 0.4, el[1] * 0.6 + wr[1] * 0.4, el[2] * 0.6 + wr[2] * 0.4, 0.045 * b, 0.07, 0.045 * b), 0.04);
      // hand + 4 fingers
      const dir = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]], L = Math.hypot(...dir); const u = dir.map((q) => q / L);
      const hc = [wr[0] + u[0] * 0.04, wr[1] + u[1] * 0.04, wr[2] + u[2] * 0.04];
      d = smin(d, sph(x, y, z, hc[0], hc[1], hc[2], 0.042 * b ** 0.6), 0.03);
      for (let f = 0; f < 4; f++) {
        const off = (f - 1.5) * 0.022 * b ** 0.6, tip = [hc[0] + u[0] * 0.09 + off * (u[2] ? 1 : 0), hc[1] + u[1] * 0.09 - 0.02, hc[2] + u[2] * 0.09 + off * (u[0] ? 1 : 0)];
        d = smin(d, rcone(x, y, z, hc[0] + off * (u[2] ? 1 : 0), hc[1], hc[2] + off * (u[0] ? 1 : 0), tip[0], tip[1], tip[2], 0.013 * b ** 0.6, 0.008 * b ** 0.6), 0.012);
      }
    }
    // legs
    d = smin(d, chain(ax, y, z, [[0.1 * sw, 0.82, 0], [0.16 * sw, 0.46, 0.09], [0.15 * sw, 0.09, -0.03]], [0.095 * lb, 0.062 * lb, 0.04 * lb], 0.05), 0.05);
    d = smin(d, ell(ax, y, z, 0.15 * sw, 0.66, 0.05, 0.085 * lb, 0.14, 0.085 * lb), 0.05);
    d = smin(d, ell(ax, y, z, 0.16 * sw, 0.32, -0.01, 0.055 * lb, 0.09, 0.06 * lb), 0.04);
    d = smin(d, ell(ax, y, z, 0.15 * sw, 0.045, 0.06, 0.055 * lb, 0.04, 0.11 * lb ** 0.5), 0.04);
    return d;
  };

  const sdfUnit = (x, y, z) => smin(body(x, y, z), head(x, y, z), 0.05);
  const skinNoise = P.skinNoise ?? 1;
  const sdf = (x, y, z) => {
    const ux = x / s, uy = y / s, uz = z / s;
    let d = sdfUnit(ux, uy, uz);
    if (skinNoise && d < 0.03 && d > -0.03) {
      d += fbm(ux * 9, uy * 9, uz * 9) * 0.006 * skinNoise;
      d += (Math.abs(vnoise(ux * 38, uy * 55, uz * 38)) - 0.3) * 0.0026 * skinNoise;
      const w = vnoise(ux * 26 + 11, uy * 26, uz * 26 - 7); if (w > 0.62) d -= (w - 0.62) * 0.03 * skinNoise;
    }
    return d * s;
  };
  const S = (p) => p.map((q) => q * s);
  const eye = hp(eyeOff[0], eyeOff[1], eyeOff[2]);
  const top = hp(0, 0.13, 0);
  const handOf = (arm) => { const [, el, wr] = arm; const dir = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]], L = Math.hypot(...dir); return S([wr[0] + dir[0] / L * 0.05, wr[1] + dir[1] / L * 0.05, wr[2] + dir[2] / L * 0.05]); };
  return {
    sdf, scale: s, height: H,
    eyes: [S([eye[0], eye[1], eye[2]]), S([-eye[0], eye[1], eye[2]])], eyeR: 0.027 * hs * s,
    mouth: S(hp(0, -0.138, 0.2)), headTop: S(top), headCenter: S(HC), headScale: hs * s,
    handL: handOf(armL), handR: handOf(armR),
    bbox: [S([-0.62 * sw * Math.max(1, b * 0.8), -0.02, -0.4 - Math.max(0, k) * 0.1]), S([0.62 * sw * Math.max(1, b * 0.8), 1.86 + (hs - 1) * 0.4, 0.55 + hz * 2 + Math.max(0, k) * 0.2])],
  };
}

// P: { height (shoulder, m), length, bulk, gaunt, snout, ears, tail, mouthOpen }
export function quadruped(P = {}) {
  const s = (P.height ?? 0.7) / 0.7, L = P.length ?? 1, b = P.bulk ?? 1, gaunt = P.gaunt ?? 0, sn = P.snout ?? 1;
  const z = (v) => v * L;
  const hipZ = z(-0.36), chestZ = z(0.22);
  const FL = [[0.1, 0.62, chestZ + 0.02], [0.1, 0.38, chestZ - 0.02], [0.09, 0.12, chestZ + 0.03], [0.09, 0.03, chestZ + 0.07]];
  const BL = [[0.1, 0.6, hipZ - 0.02], [0.11, 0.42, hipZ + 0.08], [0.1, 0.2, hipZ - 0.08], [0.1, 0.03, hipZ - 0.04]];
  const HD = [0, 0.86, chestZ + 0.3];
  const body = (x, y, zz) => {
    const ax = Math.abs(x);
    let d = ell(x, y, zz, 0, 0.62, hipZ, 0.13 * b, 0.15 * b, 0.17);
    d = smin(d, ell(x, y, zz, 0, 0.62 + gaunt * 0.03, (hipZ + chestZ) / 2, 0.13 * b * (1 - gaunt * 0.25), 0.14 * b * (1 - gaunt * 0.35), 0.22 * L), 0.1);
    d = smin(d, ell(x, y, zz, 0, 0.64, chestZ, 0.15 * b, 0.2 * b, 0.17), 0.1);
    d = smin(d, rcone(x, y, zz, 0, 0.72, chestZ + 0.1, HD[0], HD[1] - 0.02, HD[2] - 0.06, 0.1 * b, 0.07), 0.06);
    // spine ridge + ribs
    for (let i = 0; i < 9; i++) d = smin(d, sph(x, y, zz, 0, 0.74 + gaunt * 0.005, hipZ + (chestZ - hipZ) * (i / 8), 0.016 + gaunt * 0.004), 0.025);
    if (gaunt > 0) for (let i = 0; i < 6; i++) { const rz = chestZ - 0.02 - i * 0.055 * L; d = smin(d, rcone(ax, y, zz, 0.04, 0.74, rz, 0.13 * b, 0.56, rz + 0.01, 0.012, 0.01), 0.02); }
    for (const leg of [FL, BL]) d = smin(d, chain(ax, y, zz, leg, [0.07 * b, 0.045 * b, 0.032 * b, 0.035 * b], 0.04), 0.06);
    d = smin(d, ell(ax, y, zz, 0.11, 0.48, chestZ + 0.0, 0.05 * b, 0.11, 0.07), 0.05); // shoulder muscle
    d = smin(d, ell(ax, y, zz, 0.11, 0.5, hipZ + 0.04, 0.065 * b, 0.12, 0.1), 0.05); // thigh
    for (const leg of [FL, BL]) { const p = leg[3]; d = smin(d, ell(ax, y, zz, p[0], 0.03, p[2] + 0.03, 0.04 * b, 0.03, 0.06), 0.02); }
    // tail
    if (P.tail !== false) d = smin(d, chain(x, y, zz, [[0, 0.68, hipZ - 0.15], [0, 0.6, hipZ - 0.32], [0.05, 0.45, hipZ - 0.42]], [0.035, 0.025, 0.012], 0.03), 0.04);
    return d;
  };
  const head = (x, y, zz) => {
    const ax = Math.abs(x), lx = x - HD[0], ly = y - HD[1], lz = zz - HD[2];
    let d = ell(lx, ly, lz, 0, 0, 0, 0.09, 0.085, 0.1);
    d = smin(d, rcone(lx, ly, lz, 0, -0.01, 0.06, 0, -0.035, 0.06 + 0.17 * sn, 0.058, 0.035), 0.04); // snout
    const open = P.mouthOpen ?? 0.3;
    d = smin(d, rcone(lx, ly, lz, 0, -0.07, 0.04, 0, -0.08 - open * 0.08, 0.04 + 0.15 * sn, 0.04, 0.025), 0.03); // lower jaw
    d = smax(d, -ell(lx, ly + 0.06 + open * 0.03, lz, 0, 0, 0.1 + 0.07 * sn, 0.05, 0.012 + open * 0.035, 0.12 * sn), 0.01); // gape
    d = smax(d, -sph(Math.abs(lx), ly, lz, 0.05, 0.03, 0.06, 0.022), 0.01); // sockets
    d = smin(d, rcone(Math.abs(lx), ly, lz, 0.0, 0.05, 0.06, 0.06, 0.045, 0.03, 0.02, 0.016), 0.02); // brow
    if ((P.ears ?? 'point') === 'point') d = smin(d, Math.max(rcone(Math.abs(lx), ly, lz * 3, 0.05, 0.05, -0.05, 0.08, 0.17, -0.12, 0.04, 0.005), -0), 0.02);
    else d = smin(d, ell(Math.abs(lx), ly, lz, 0.08, 0.0, -0.03, 0.02, 0.07, 0.045), 0.02);
    d = smax(d, -sph(Math.abs(lx), ly, lz, 0.018, -0.03, 0.06 + 0.17 * sn, 0.012), 0.006); // nostrils
    return d;
  };
  const legs = P.legs ?? 1, LH = 0.62, lift = LH * (1 - legs);
  const sdf = (x, y, zz) => {
    const ux = x / s, uz = zz / s; let uy = y / s;
    uy = uy < LH * legs ? uy / legs : uy + lift; // shorter legs squash the lower body only
    let d = smin(body(ux, uy, uz), head(ux, uy, uz), 0.04);
    if (uy < LH) d *= legs;
    if (d < 0.03 && d > -0.03) d += fbm(ux * 10, uy * 10, uz * 10) * 0.005 + (Math.abs(vnoise(ux * 40, uy * 60, uz * 40)) - 0.3) * 0.002;
    return d * s;
  };
  const S = (p) => [p[0] * s, (p[1] - (p[1] > LH ? lift : p[1] * (1 - legs))) * s, p[2] * s];
  return {
    sdf, scale: s,
    eyes: [S([HD[0] + 0.05, HD[1] + 0.03, HD[2] + 0.055]), S([HD[0] - 0.05, HD[1] + 0.03, HD[2] + 0.055])], eyeR: 0.02 * s,
    head: S(HD), snoutTip: S([0, HD[1] - 0.035, HD[2] + 0.06 + 0.17 * sn]), jawZ: S([0, HD[1] - 0.06, HD[2] + 0.04 + 0.15 * sn]),
    neck: S([0, 0.78, chestZ + 0.18]),
    bbox: [S([-0.32 * b, -0.02, hipZ - 0.6]), S([0.32 * b, 1.15, HD[2] + 0.12 + 0.2 * sn])],
  };
}
