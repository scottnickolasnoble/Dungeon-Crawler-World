// Shared spawn helpers: roaming packs whose level rises with distance from the safe hub, and encampments.
import { seeded } from '../engine/ink.js';

// packs of 2-4 spread across the floor, avoiding the given zones; levelAt(distanceFromHub) -> [min,max]
export function roamingPacks({ size, avoid, seed = 1, count = 22, kinds, levelAt, hub = [0, 0] }) {
  const out = []; let tries = 0;
  for (let p = 0; out.length < count * 3 && p < count && tries < 400; tries++) {
    const x = (seeded(tries, seed * 7 + 1) - 0.5) * size * 0.88, z = (seeded(tries, seed * 7 + 2) - 0.5) * size * 0.88;
    if (avoid(x, z)) continue; const d = Math.hypot(x - hub[0], z - hub[1]); if (d < 34) continue;
    const [lo, hi] = levelAt(d); const n = 2 + Math.floor(seeded(tries, seed * 7 + 3) * 3);
    for (let i = 0; i < n; i++) { const r = seeded(i, tries + 9); const kind = kinds(r, d, i); const a = i * 2.1 + tries, rr = 1.5 + i * 0.9;
      out.push({ kind, variant: (tries * 3 + i) % 8, lvl: lo + Math.floor(seeded(i, tries + 17) * (hi - lo + 1)) + (kind === 'captain' ? 2 : 0), x: x + Math.cos(a) * rr, z: z + Math.sin(a) * rr }); }
    p++;
  }
  return out;
}
