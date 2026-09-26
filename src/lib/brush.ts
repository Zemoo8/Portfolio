// Procedural ink-brush strokes. A stroke is a bundle of bristles following a centre line;
// pressure sets the width, and bristles run dry (break off) toward the tail — the look of
// a Chinese brush (毛笔) loaded with black ink. Output is plain SVG path data, so strokes can
// "paint themselves" with stroke-dashoffset (pathLength = 1).

export type Pt = [number, number];
export type Bristle = { d: string; w: number; o: number; delay: number };

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;

export type StrokeOptions = {
  /** half-width at full pressure */
  width: number;
  bristles?: number;
  seed?: number;
  /** 0..1 — how early/strongly bristles run dry toward the tail */
  dryness?: number;
  /** pressure profile over s ∈ [0,1] → 0..1 */
  pressure?: (s: number) => number;
};

const defaultPressure = (s: number) => {
  // loaded press (slight ink pool), full body, long lift at the end
  const press = s < 0.05 ? 1.12 - s * 1.2 : 1;
  const lift = s < 0.6 ? 1 : Math.pow(Math.max(0, 1 - (s - 0.6) / 0.4), 0.8);
  return press * lift;
};

export function stroke(centre: Pt[], o: StrokeOptions): Bristle[] {
  const { width, bristles = 34, seed = 1, dryness = 0.55, pressure = defaultPressure } = o;
  const rnd = mulberry32(seed);
  const n = centre.length;
  // normals
  const normals: Pt[] = centre.map((_, i) => {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [-ty / l, tx / l];
  });
  const out: Bristle[] = [];
  for (let k = 0; k < bristles; k++) {
    const lane = (k + 0.5) / bristles * 2 - 1; // −1..1 across the brush
    const jitter = (rnd() - 0.5) * 0.12;
    // outer bristles carry less ink and run dry sooner
    const edge = Math.abs(lane);
    const endAt = 1 - dryness * (0.15 + 0.85 * Math.pow(edge, 1.4)) * (0.4 + rnd() * 0.9);
    const startAt = rnd() * 0.02 + edge * 0.03;
    // relative commands keep the markup compact: "M x y l dx dy dx dy …"
    let d = '';
    let px = 0, py = 0, count = 0;
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1);
      if (s < startAt || s > endAt) continue;
      const p = pressure(s);
      const off = (lane + jitter) * width * p;
      const x = f(centre[i][0] + normals[i][0] * off);
      const y = f(centre[i][1] + normals[i][1] * off);
      if (count === 0) d = `M${x} ${y}l`;
      else d += `${f(x - px)} ${f(y - py)} `;
      px = x; py = y; count++;
    }
    if (count < 2) continue;
    out.push({
      d: d.trim(),
      w: f(((width * 2) / bristles) * (2.1 + rnd() * 1.4)),
      o: f(Math.min(1, 0.32 + Math.pow(1 - edge, 0.6) * 0.62 + rnd() * 0.12)),
      delay: f(startAt),
    });
  }
  return out;
}

/** Ensō-like brush circle: centre (cx, cy), radius r, open by `gap` radians. */
export function circle(cx: number, cy: number, r: number, o: StrokeOptions & { start?: number; gap?: number }): Bristle[] {
  const rnd = mulberry32((o.seed ?? 3) * 7);
  const start = o.start ?? -1.9;
  const sweep = Math.PI * 2 - (o.gap ?? 0.5);
  const pts: Pt[] = [];
  const N = 96;
  const wob = [rnd() * 6, rnd() * 6];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const a = start + s * sweep;
    const rr = r * (1 + 0.018 * Math.sin(a * 3 + wob[0]) + 0.012 * Math.sin(a * 5 + wob[1])) + s * r * 0.015;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return stroke(pts, o);
}

/** A slightly bowed horizontal stroke from (0, y) to (len, y). */
export function line(len: number, y: number, o: StrokeOptions & { bow?: number; rise?: number }): Bristle[] {
  const pts: Pt[] = [];
  const N = 52;
  const bow = o.bow ?? 6;
  const rise = o.rise ?? -4;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    pts.push([s * len, y + Math.sin(s * Math.PI) * bow + s * rise]);
  }
  return stroke(pts, o);
}
