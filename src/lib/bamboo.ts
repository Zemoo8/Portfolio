// Ink bamboo, painted with the same bristle engine as every other stroke on the site (brush.ts).
// The Path chapter is one stalk: each step of the way hangs from a joint of it. The pieces are
// drawn here once, at build time, as plain SVG path data:
//   cane()    one segment of the stalk, in a 44 × 200 box that is stretched to its stage's height
//   joint()   the dark hook where two segments meet
//   leaves()  a twig and its fan of leaves, growing out to the right (mirrored in CSS for the left)
//   shoot()   this year's growth: a thin, pale tip
//   grass()   a tuft at the foot of the stalk
import { stroke, type Bristle, type Pt } from './brush';

const along = (from: Pt, to: Pt, n: number, bend = 0): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n;
    // the bend is across the line, greatest in the middle
    const nx = -(to[1] - from[1]), ny = to[0] - from[0];
    const l = Math.hypot(nx, ny) || 1;
    const k = Math.sin(s * Math.PI) * bend;
    return [from[0] + (to[0] - from[0]) * s + (nx / l) * k, from[1] + (to[1] - from[1]) * s + (ny / l) * k];
  });

/** A segment: a broad, pale wash between two darker edges, a little wider toward its joints. */
export function cane(seed: number): { wash: Bristle[]; edges: Bristle[] } {
  const lean = Math.sin(seed * 1.7) * 1.3;
  const swell = (s: number) => 0.9 + 0.14 * Math.pow(Math.abs(Math.cos(s * Math.PI)), 3);
  const wash = stroke(along([22, 5], [22, 195], 12, lean), { width: 11.5, bristles: 13, seed, dryness: 0.16, pressure: swell });
  const edges = [
    ...stroke(along([10.6, 6], [10.2, 194], 10, lean), { width: 1.1, bristles: 3, seed: seed + 1, dryness: 0.3 }),
    ...stroke(along([33.4, 6], [33.8, 194], 10, lean), { width: 1.3, bristles: 3, seed: seed + 2, dryness: 0.2 }),
  ];
  return { wash, edges };
}

/** The joint, in a 44 × 12 box centred on the meeting of two segments. */
export function joint(seed: number): Bristle[] {
  return stroke([[6, 7.5], [13, 4.8], [22, 4.2], [31, 4.8], [38.5, 7.8]], { width: 1.9, bristles: 6, seed, dryness: 0.2 });
}

const leaf = (from: Pt, angle: number, length: number, seed: number): Bristle[] => {
  const curl = Math.sin(seed) * 0.2;
  const pts: Pt[] = Array.from({ length: 13 }, (_, i) => {
    const s = i / 12;
    const a = angle + curl * s;
    return [from[0] + Math.cos(a) * length * s, from[1] + Math.sin(a) * length * s];
  });
  // pressed down just after the start, then lifted away to a point
  return stroke(pts, { width: 6, bristles: 8, seed, dryness: 0.16, pressure: (s) => Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.75) * (1 - 0.35 * s) + 0.04 });
};

/** A twig from (0, 118) and its leaves, in a 170 × 130 box. `n` leaves (3–5); the twig first. */
export function leaves(seed: number, n = 4): { twig: Bristle[]; fan: Bristle[][] } {
  const tip: Pt = [40, 98];
  const twig = stroke(along([0, 118], tip, 8, -3), { width: 1.4, bristles: 4, seed, dryness: 0.3 });
  // every leaf reaches up and away: nothing hangs below the joint, where the next step is written
  const spread = [[-1.02, 66], [-0.7, 92], [-0.4, 108], [-0.12, 94], [0.16, 70]];
  const picked = n >= 5 ? spread : n === 4 ? [spread[0], spread[1], spread[2], spread[3]] : [spread[1], spread[2], spread[3]];
  const fan = picked.map(([a, len], k) => leaf(tip, a - 0.28 + Math.sin(seed + k) * 0.07, len * (0.92 + ((seed * (k + 3)) % 7) / 45), seed * 13 + k));
  return { twig, fan };
}

/** This year's growth: a thin pale tip rising from the last joint, in a 44 × 200 box. */
export function shoot(seed: number): Bristle[] {
  return stroke(along([22, 196], [24, 22], 12, 3), { width: 6.5, bristles: 8, seed, dryness: 0.55, pressure: (s) => 1 - 0.72 * s });
}

/** A tuft of grass at the foot of the stalk, in a 220 × 70 box (the stalk stands at x = 110). */
export function grass(seed: number): Bristle[][] {
  const blades: [number, number, number][] = [[62, -1.25, 34], [78, -1.05, 50], [92, -1.42, 40], [128, -1.72, 44], [142, -2.02, 54], [158, -1.86, 32], [44, -0.92, 26], [176, -2.2, 28]];
  return blades.map(([x, a, len], k) => {
    const pts: Pt[] = Array.from({ length: 10 }, (_, i) => { const s = i / 9; const b = a + (k % 2 ? 0.25 : -0.22) * s; return [x + Math.cos(b) * len * s, 66 + Math.sin(b) * len * s]; });
    return stroke(pts, { width: 2.6, bristles: 5, seed: seed + k, dryness: 0.25, pressure: (s) => 1 - 0.85 * s });
  });
}
