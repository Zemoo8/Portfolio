// The painting on the folding screen of "More on GitHub": an old pine across six leaves of gold
// leaf, in the manner of the Kanō screens — the trunk on the last leaf, one great bough reaching
// back over the others, rocks and running water at its foot. The section pastes its paper cards
// over the middle of every leaf, so the picture lives in the upper third and along the foot.
// Written to public/art/screen.webp. Deterministic (seeded).   node scripts/art/screen.mjs
import sharp from 'sharp';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../../public/art/screen.webp');
const W = 2400, H = 1000;
const f = (n) => Math.round(n * 10) / 10;
const rnd = (seed) => { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const r = rnd(8);

// ---- the ground: squares of gold leaf, each a shade of its own, laid with the seams showing
const LEAF = 125;
let ground = '';
for (let y = 0; y < H; y += LEAF) for (let x = 0; x < W; x += LEAF) {
  const k = r();
  ground += `<rect x="${x}" y="${y}" width="${LEAF}" height="${LEAF}" fill="${k > 0.5 ? '#f3d98f' : '#a97f2c'}" opacity="${f(Math.abs(k - 0.5) * 0.34)}"/>`;
}
let seams = '';
for (let x = LEAF; x < W; x += LEAF) seams += `M${x} 0V${H}`;
for (let y = LEAF; y < H; y += LEAF) seams += `M0 ${y}H${W}`;

// ---- clouds of raised gold: scalloped banks drifting in from the upper left and the lower right
function bank(x0, y0, len, depth, up) {
  let d = `M${x0} ${y0}`;
  let x = x0;
  while (x < x0 + len) {
    const w = 90 + r() * 120, h = depth * (0.5 + r() * 0.5);
    d += `q${f(w / 2)} ${f(up ? -h : h)} ${f(w)} 0`;
    x += w;
  }
  return d + `V${up ? H + 40 : -40}H${x0}Z`;
}
const clouds = [bank(-60, 96, 1250, 70, false), bank(260, 44, 760, 46, false), bank(1150, H - 70, 1400, 64, true), bank(-80, H - 34, 900, 40, true)];

// ---- the pine
const line = (pts) => pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
/** A limb as an outline: thick where it leaves the trunk, tapering to its tip, never quite straight. */
function limb(pts, w0, w1) {
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) * (0.86 + r() * 0.28);
    left.push([x + nx * w, y + ny * w]); right.push([x - nx * w, y - ny * w]);
  }
  return `M${line(left)}L${line(right.reverse())}Z`;
}
/** Points along a curve through the given knots (Catmull-Rom), with a little wander. */
function through(knots, per = 9, wander = 5) {
  const out = [];
  for (let i = 0; i < knots.length - 1; i++) {
    const p0 = knots[Math.max(0, i - 1)], p1 = knots[i], p2 = knots[i + 1], p3 = knots[Math.min(knots.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const at = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      out.push([at(p0[0], p1[0], p2[0], p3[0]) + (r() - 0.5) * wander, at(p0[1], p1[1], p2[1], p3[1]) + (r() - 0.5) * wander]);
    }
  }
  out.push(knots[knots.length - 1]);
  return out;
}
const trunk = through([[2210, 1040], [2170, 860], [2085, 700], [2110, 520], [2030, 370], [1950, 250], [1975, 120], [2040, -30]], 10, 9);
const bough = through([[2100, 560], [1930, 470], [1720, 400], [1480, 330], [1230, 300], [980, 250], [720, 262], [470, 214], [300, 232]], 9, 7);
const limbs = [
  [trunk, 62, 26],
  [bough, 30, 6],
  [through([[2040, 390], [2190, 300], [2330, 262], [2440, 190]], 8, 6), 20, 7],
  [through([[1970, 210], [1830, 150], [1660, 138], [1520, 96]], 8, 6), 17, 5],
  [through([[1500, 336], [1420, 420], [1300, 452], [1190, 440]], 7, 5), 13, 4],
  [through([[1010, 258], [930, 180], [820, 140]], 7, 5), 11, 4],
  [through([[1760, 412], [1700, 300], [1610, 250]], 7, 5), 12, 4],
];
let wood = '', bark = '';
for (const [pts, w0, w1] of limbs) {
  wood += `<path d="${limb(pts, w0, w1)}"/>`;
  // bark: short hooked strokes along the limb, and a pale edge on its upper side
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [x, y] = pts[i]; const w = w0 + (w1 - w0) * (i / pts.length);
    for (let k = 0; k < Math.ceil(w / 9); k++) bark += `M${f(x + (r() - 0.5) * w * 1.3)} ${f(y + (r() - 0.5) * w * 1.3)}q${f(4 + r() * 6)} ${f(-6 - r() * 5)} ${f(1 + r() * 3)} ${f(-14 - r() * 8)}`;
  }
}

/** A pad of needles: a flat green cloud heaped from rounds, needles standing up out of it. */
function pad(cx, cy, w, h) {
  let wash = '', light = '', needles = '';
  const n = Math.max(3, Math.round(w / 46));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = cx - w / 2 + t * w + (r() - 0.5) * 14;
    const rise = Math.sin(t * Math.PI) * h * 0.5;
    const rx = w / n * (0.75 + r() * 0.3), ry = h * (0.5 + r() * 0.22);
    wash += `<ellipse cx="${f(x)}" cy="${f(cy - rise)}" rx="${f(rx)}" ry="${f(ry)}"/>`;
    light += `<ellipse cx="${f(x - 3)}" cy="${f(cy - rise - ry * 0.34)}" rx="${f(rx * 0.76)}" ry="${f(ry * 0.44)}"/>`;
    for (let a = -2.86; a <= -0.28; a += 0.2) {
      const len = ry * (1.0 + r() * 0.42);
      needles += `M${f(x)} ${f(cy - rise + ry * 0.5)}l${f(Math.cos(a + (r() - 0.5) * 0.12) * len * 1.05)} ${f(Math.sin(a) * len)}`;
    }
  }
  return { wash, light, needles };
}
const pads = [
  [2330, 212, 250, 44], [2190, 262, 170, 36], [1660, 100, 280, 46], [1840, 118, 180, 38], [1960, 60, 210, 40],
  [1600, 214, 210, 40], [1730, 356, 200, 36], [1480, 286, 260, 44], [1250, 258, 250, 44], [1190, 404, 230, 40],
  [1340, 430, 150, 30], [1010, 214, 230, 42], [820, 106, 250, 44], [900, 150, 150, 32], [730, 226, 240, 42],
  [500, 180, 250, 44], [300, 200, 200, 38], [610, 150, 150, 30], [2080, 444, 170, 34], [1900, 420, 150, 30],
].map(([x, y, w, h]) => pad(x, y, w, h));

// ---- at its foot: rocks in ink, and water drawn as the old screens draw it — long level curls
function rock(x, base, w, h, seed) {
  const q = rnd(seed); const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([x + t * w, base - Math.sin(t * Math.PI) ** 0.7 * h * (0.75 + q() * 0.4)]); }
  let hatch = '';
  for (let i = 2; i < 13; i++) { const [px, py] = pts[i]; hatch += `M${f(px)} ${f(py + 6)}l${f((q() - 0.5) * 6)} ${f((base - py) * (0.3 + q() * 0.4))}`; }
  return { body: `M${x} ${base}L${line(pts)}L${x + w} ${base}Z`, edge: `M${line(pts)}`, hatch };
}
const rocks = [rock(1980, 1010, 330, 150, 3), rock(1820, 1010, 230, 96, 5), rock(2230, 1010, 200, 112, 7), rock(120, 1010, 260, 104, 9), rock(330, 1010, 180, 66, 11)];
let water = '';
for (let k = 0; k < 15; k++) {
  const y = 905 + (k % 5) * 20 + r() * 8, x = 440 + r() * 1250, len = 150 + r() * 260;
  water += `M${f(x)} ${f(y)}q${f(len * 0.25)} ${f(-12 - r() * 8)} ${f(len * 0.5)} 0t${f(len * 0.5)} 0`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#e3c173"/><stop offset="0.55" stop-color="#d8b25e"/><stop offset="1" stop-color="#c79f4b"/></linearGradient>
  <filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="4" seed="4"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.06  0.9 0 0 0 -0.36"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.05  0.5 0 0 0 -0.16"/></filter>
  <filter id="hand" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="6"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#gold)"/>
${ground}
<rect width="${W}" height="${H}" filter="url(#mottle)"/>
<path d="${seams}" stroke="#7a5a18" stroke-opacity="0.2" stroke-width="1.6" fill="none"/>
<path d="${seams}" stroke="#fff3c8" stroke-opacity="0.22" stroke-width="1" fill="none" transform="translate(2 2)"/>
<g filter="url(#hand)">
  ${clouds.map((d) => `<path d="${d}" fill="#f0d590" fill-opacity="0.55"/><path d="${d}" fill="none" stroke="#a8842f" stroke-opacity="0.55" stroke-width="2.4"/>`).join('')}
  <path d="${water}" fill="none" stroke="#6d5216" stroke-opacity="0.55" stroke-width="2.6" stroke-linecap="round"/>
  ${rocks.map((k) => `<path d="${k.body}" fill="#2a251d" fill-opacity="0.82"/><path d="${k.edge}" fill="none" stroke="#14110c" stroke-width="5" stroke-linejoin="round"/><path d="${k.hatch}" fill="none" stroke="#0f0d09" stroke-opacity="0.7" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
  <g fill="#33271b">${wood}</g>
  <path d="${bark}" fill="none" stroke="#120d08" stroke-opacity="0.75" stroke-width="2.6" stroke-linecap="round"/>
  ${pads.map((p) => `<g fill="#2f4d38">${p.wash}</g>`).join('')}
  ${pads.map((p) => `<g fill="#55795a" fill-opacity="0.75">${p.light}</g><path d="${p.needles}" fill="none" stroke="#17291d" stroke-opacity="0.85" stroke-width="1.9" stroke-linecap="round"/>`).join('')}
</g>
<rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;

await sharp(Buffer.from(svg)).webp({ quality: 80, effort: 6 }).toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log('screen.webp', `${meta.width}×${meta.height}`, `${((await import('node:fs')).statSync(OUT).size / 1024).toFixed(0)} KB`);
