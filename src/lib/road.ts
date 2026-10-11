// The road through the Path chapter: one stroke of a loaded brush winding down the scroll — a hair
// in the far distance at the top, as wide as a hand where it began at the foot. It makes one bend
// per step of the way, swinging out to one side and back to the middle, so the bends alternate and
// each step is written in the hollow of its own.
// Every bend is its own piece, drawn in a box that is stretched to the height of its step:
//   wide    1000 × 300, for screens where the road crosses the page
//   narrow    64 × 300, for phones, where it keeps to the margin
// The stroke is cut in level slices, so two pieces always meet edge to edge however far each one
// is stretched. Plain SVG path data, made once at build time.

const f = (n: number) => Math.round(n * 10) / 10;
const BOX = 300;

type Shape = { mid: number; swing: number; thin: number; thick: number; power: number; hairs: number };
const WIDE: Shape = { mid: 500, swing: 232, thin: 2.5, thick: 58, power: 1.3, hairs: 26 };
const NARROW: Shape = { mid: 32, swing: 12, thin: 2.2, thick: 13, power: 1.2, hairs: 9 };

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Half the stroke's width, `along` of the way from its far end (0) to where it began (1). */
const half = (s: Shape, along: number) => s.thin + (s.thick - s.thin) * Math.pow(along, s.power);

/** One level slice through the stroke: its middle, and how far it reaches to either side. */
function slice(s: Shape, index: number, count: number, side: number, t: number) {
  const dx = side * s.swing * Math.PI * Math.cos(Math.PI * t);
  const w = half(s, (index + t) / count);
  // where the stroke runs flat a level cut through it is long: its width over the slope
  return { x: s.mid + side * s.swing * Math.sin(Math.PI * t), y: t * BOX, reach: (w * Math.hypot(dx, BOX)) / BOX, w, dx };
}

type Piece = { body: string; tail: string[]; dry: string[] };

/** `side` is −1 for a bend that swings toward the start of the line, 1 toward its end. */
function piece(s: Shape, index: number, count: number, side: number): Piece {
  const N = 28;
  const cuts = Array.from({ length: N + 1 }, (_, k) => slice(s, index, count, side, k / N));
  const body = `M${cuts.map((c) => `${f(c.x - c.reach)} ${f(c.y)}`).join('L')}L${[...cuts].reverse().map((c) => `${f(c.x + c.reach)} ${f(c.y)}`).join('L')}Z`;
  const tail: string[] = [];
  const dry: string[] = [];
  if (index !== count - 1) return { body, tail, dry };

  // Where the stroke began — the foot of the last bend — the brush was set down nearly dry: the
  // ink breaks up into the single hairs of the brush, each running out on its own, a few flecks
  // beyond them; and for some way back up the stroke the silk shows through between the hairs.
  const r = seeded(11);
  const end = cuts[N];
  const len = Math.hypot(end.dx, BOX);
  const ux = end.dx / len, uy = BOX / len; // the way the stroke was heading
  const lanes = Array.from({ length: s.hairs + 1 }, (_, k) => -1 + (2 * k) / s.hairs);
  for (let k = 0; k < s.hairs; k++) {
    const bare = 0.1 + r() * 0.34;
    const a = lanes[k] + ((lanes[k + 1] - lanes[k]) * bare) / 2;
    const b = lanes[k + 1] - ((lanes[k + 1] - lanes[k]) * bare) / 2;
    const x0 = end.x + a * end.reach, x1 = end.x + b * end.reach;
    // the cut is level but the stroke is not: the hairs on its trailing side have further to go
    const lag = (1 - (a + b) / 2) * Math.abs(ux) * end.reach * 0.5;
    const run = lag + end.w * (0.35 + r() * r() * 2.6);
    const drift = (r() - 0.5) * end.w * 0.12;
    const mx = (x0 + x1) / 2;
    tail.push(`M${f(x0)} ${f(end.y)}L${f(mx - (x1 - x0) * 0.3 + ux * run * 0.62)} ${f(end.y + uy * run * 0.62)}L${f(mx + drift + ux * run)} ${f(end.y + uy * run)}L${f(mx + (x1 - x0) * 0.3 + ux * run * 0.62)} ${f(end.y + uy * run * 0.62)}L${f(x1)} ${f(end.y)}Z`);
    if (r() > 0.6) {
      const far = run + end.w * (0.25 + r() * 0.7), long = end.w * (0.12 + r() * 0.3), wide = (x1 - x0) * 0.22;
      tail.push(`M${f(mx - wide + ux * far)} ${f(end.y + uy * far)}L${f(mx + ux * (far + long))} ${f(end.y + uy * (far + long))}L${f(mx + wide + ux * far)} ${f(end.y + uy * far)}Z`);
    }
    if (k > 0 && r() > 0.52) {
      const from = Math.round(N * (0.42 + r() * 0.42));
      dry.push('M' + cuts.slice(from).map((c) => `${f(c.x + lanes[k] * c.reach)} ${f(c.y)}`).join('L'));
    }
  }
  return { body, tail, dry };
}

export type Bend = {
  side: -1 | 1;
  wide: Piece;
  narrow: Piece;
  /** Where the middle of the road is, `t` of the way down this bend: percentages of the bend's box. */
  at(t: number): { x: number; y: number };
  /** The road's whole width at that point, as a percentage of the box's width. */
  width(t: number): number;
};

export function road(count: number): Bend[] {
  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return {
      side,
      wide: piece(WIDE, i, count, side),
      narrow: piece(NARROW, i, count, side),
      at: (t: number) => ({ x: (WIDE.mid + side * WIDE.swing * Math.sin(Math.PI * t)) / 10, y: t * 100 }),
      width: (t: number) => (half(WIDE, (i + t) / count) * 2) / 10,
    };
  });
}
