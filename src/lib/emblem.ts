// The air emblem: three tapered spiral ribbons with 3-fold rotational symmetry,
// generated as one SVG path (viewBox -100 -100 200 200). Pure geometry, no raster.

type Pt = [number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** One spiral ribbon as a closed polygon (centre line offset by a varying half-width). */
function spiral(cx: number, cy: number, phi: number, o: EmblemOptions): Pt[] {
  const { turns, r0, r1, flare, width, samples } = o;
  const total = turns * Math.PI * 2;
  const centre: Pt[] = [];
  const widths: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const theta = phi + s * total;
    const r = r0 + (r1 - r0) * s + flare * Math.pow(Math.max(0, s - 0.66) / 0.34, 2.2);
    centre.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)]);
    // blunt, slightly thinner inner hook; full body; long taper to a point on the tail
    const body = lerp(0.62, 1, Math.min(1, s / 0.35));
    const tail = s < 0.74 ? 1 : Math.pow(Math.max(0, 1 - (s - 0.74) / 0.26), 0.62);
    widths.push(width * body * tail);
  }
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < centre.length; i++) {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(centre.length - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const [x, y] = centre[i];
    left.push([x - ty * widths[i], y + tx * widths[i]]);
    right.push([x + ty * widths[i], y - tx * widths[i]]);
  }
  // round cap at the inner end
  const [sx, sy] = centre[0];
  const cap: Pt[] = [];
  const a0 = Math.atan2(left[0][1] - sy, left[0][0] - sx);
  for (let k = 1; k < 10; k++) {
    const a = a0 + (Math.PI * k) / 10;
    cap.push([sx + widths[0] * Math.cos(a), sy + widths[0] * Math.sin(a)]);
  }
  return [...left, ...right.reverse(), ...cap];
}

export type EmblemOptions = {
  turns: number;
  r0: number;
  r1: number;
  flare: number;
  width: number;
  distance: number;
  samples: number;
  /** start angle of each spiral relative to its position angle */
  offset: number;
};

export const defaultEmblem: EmblemOptions = {
  turns: 2.15,
  r0: 3.2,
  r1: 30,
  flare: 24,
  width: 4.4,
  distance: 37,
  samples: 150,
  offset: 3.85,
};

const fmt = (n: number) => Math.round(n * 10) / 10;

export function emblemPath(o: EmblemOptions = defaultEmblem): string {
  let d = '';
  for (let i = 0; i < 3; i++) {
    // 120° apart; +π puts two spirals on top and one below, like the traditional air symbol
    const pos = Math.PI / 2 + Math.PI / 3 + (i * 2 * Math.PI) / 3;
    const cx = o.distance * Math.cos(pos + Math.PI);
    const cy = o.distance * Math.sin(pos + Math.PI);
    const pts = spiral(cx, cy, pos + o.offset, o);
    d += 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + 'Z';
  }
  return d;
}
