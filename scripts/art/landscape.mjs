// Procedural ink-wash landscape ("air temple" mist), rendered SVG → WebP with sharp.
// Deterministic (seeded). Produces transparent layers for parallax:
//   public/art/sky.webp   (opaque: sky, sun glow, far range, low mist)
//   public/art/peaks.webp (karst spires + mist bands)
//   public/art/near.webp  (foreground ridges + pines + mist)
// plus a small combined preview in assets-generated/qc/landscape.jpg
import sharp from 'sharp';
import fs from 'node:fs';

const W = 2400;
const H = 1500;
const SEED = Number(process.argv[2] || 7);

// ---------- deterministic noise ---------------------------------------------------------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const lattice = Array.from({ length: 4096 }, rand);
const smooth = (t) => t * t * (3 - 2 * t);
const vnoise = (x) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = lattice[((i % 4096) + 4096) % 4096];
  const b = lattice[(((i + 1) % 4096) + 4096) % 4096];
  return a + (b - a) * smooth(f);
};
const fbm = (x, oct = 5) => {
  let v = 0, amp = 0.5, fr = 1;
  for (let o = 0; o < oct; o++) { v += amp * vnoise(x * fr + o * 13.7); amp *= 0.5; fr *= 2.03; }
  return v;
};

// ---------- shapes ---------------------------------------------------------------------------
const f1 = (n) => Math.round(n * 10) / 10;

/** Rolling range: fbm ridge between yBase and yBase - amp. */
function range(yBase, amp, freq, offset, step = 6) {
  const pts = [];
  for (let x = -20; x <= W + 20; x += step) pts.push([x, yBase - amp * fbm(x * freq + offset)]);
  return pts;
}

/** Karst spires: sum of steep, round-topped bells over a low base, plus brush noise. */
function spires(yBase, list, noiseAmp, offset, step = 4) {
  const pts = [];
  for (let x = -20; x <= W + 20; x += step) {
    let h = 0;
    for (const s of list) {
      const d = (x - s.x - (s.lean ?? 0) * 40 * (1 - Math.min(1, Math.abs(x - s.x) / (s.w * 3)))) / s.w;
      const bell = s.h / (1 + Math.pow(Math.abs(d), s.p ?? 3.2));
      // shoulders: two smaller bumps hugging the main spire
      const sh1 = (s.h * 0.55) / (1 + Math.pow(Math.abs((x - s.x - s.w * 1.1) / (s.w * 0.8)), 2.6));
      const sh2 = (s.h * 0.38) / (1 + Math.pow(Math.abs((x - s.x + s.w * 1.2) / (s.w * 0.9)), 2.4));
      h = Math.max(h, bell, sh1, sh2);
    }
    h += noiseAmp * (fbm(x * 0.012 + offset, 4) - 0.5) * (0.4 + h / 400);
    pts.push([x, yBase - h]);
  }
  return pts;
}

const closed = (pts) => `M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}L${W + 20} ${H + 20}L-20 ${H + 20}Z`;
const line = (pts) => `M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}`;
const top = (pts) => Math.min(...pts.map((p) => p[1]));

/** One ink-wash mountain layer: gradient wash from the ridge down + a dry-brush ridge line. */
function wash(id, pts, color, opacity, fadeTo, ridgeOpacity, blur = 1.2) {
  const t = top(pts);
  return `
  <linearGradient id="g${id}" x1="0" y1="${f1(t)}" x2="0" y2="${f1(fadeTo)}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/>
    <stop offset="0.45" stop-color="${color}" stop-opacity="${opacity * 0.72}"/>
    <stop offset="1" stop-color="${color}" stop-opacity="0"/>
  </linearGradient>
  <g filter="url(#brush${blur > 2 ? 'Soft' : ''})">
    <path d="${closed(pts)}" fill="url(#g${id})"/>
    <path d="${line(pts)}" fill="none" stroke="${color}" stroke-opacity="${ridgeOpacity}" stroke-width="2.2" stroke-linejoin="round"/>
  </g>
  ${blur > 2 ? '' : `<path d="${closed(pts)}" fill="url(#g${id})" opacity="0.55" filter="url(#cun)"/>`}`;
}

/** Moss dots (dian): small ink dabs along ridge crests, denser on peaks. */
function moss(pts, color, count, seed, minH) {
  const r = mulberry32(seed);
  let out = '';
  const peaks = pts.filter((p) => p[1] < minH);
  for (let i = 0; i < count && peaks.length; i++) {
    const [x, y] = peaks[Math.floor(r() * peaks.length)];
    const rx = 3 + r() * 6;
    out += `<ellipse cx="${f1(x + (r() - 0.5) * 18)}" cy="${f1(y + 2 + r() * 10)}" rx="${f1(rx)}" ry="${f1(rx * 0.55)}" fill="${color}" opacity="${f1(0.35 + r() * 0.4)}"/>`;
  }
  return `<g filter="url(#brush)">${out}</g>`;
}

/** Tiny temple silhouette with upturned eaves (three tiers). */
function temple(x, y, s) {
  const tier = (w, h, yy) => {
    const e = w * 0.18;
    return `<path d="M${f1(x - w / 2 - e)} ${f1(yy - h * 0.1)} Q${f1(x - w / 2)} ${f1(yy)} ${f1(x - w / 2 + e)} ${f1(yy - h * 0.05)} L${f1(x)} ${f1(yy - h * 0.55)} L${f1(x + w / 2 - e)} ${f1(yy - h * 0.05)} Q${f1(x + w / 2)} ${f1(yy)} ${f1(x + w / 2 + e)} ${f1(yy - h * 0.1)} Z" />
      <rect x="${f1(x - w * 0.32)}" y="${f1(yy)}" width="${f1(w * 0.64)}" height="${f1(h * 0.45)}"/>`;
  };
  return `<g fill="#3a3732" opacity="0.85" filter="url(#brush)">
    ${tier(52 * s, 30 * s, y - 38 * s)}${tier(40 * s, 24 * s, y - 64 * s)}${tier(28 * s, 18 * s, y - 84 * s)}
    <path d="M${f1(x)} ${f1(y - 104 * s)} L${f1(x)} ${f1(y - 92 * s)}" stroke="#3a3732" stroke-width="${f1(2 * s)}"/>
  </g>`;
}

const mist = (cx, cy, rx, ry, op, blur = 40) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f7f2e6" opacity="${op}" filter="url(#mist${blur})"/>`;

/** Ink pine: leaning trunk + layered horizontal needle clumps. */
function pine(x, y, s, flip = 1) {
  const r = mulberry32(Math.round(x * 7 + y));
  const trunk = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    trunk.push([x + flip * (Math.sin(t * 2.4) * 26 * s + t * 18 * s), y - t * 210 * s]);
  }
  const trunkPath = line(trunk);
  let clumps = '';
  for (let k = 0; k < 6; k++) {
    const t = 0.35 + k * 0.12;
    const [cx, cy] = trunk[Math.round(t * n)];
    const w = (70 - k * 7) * s * (0.8 + r() * 0.4);
    const dir = k % 2 ? flip : -flip;
    const ox = cx + dir * w * 0.45;
    clumps += `<path d="M${f1(cx)} ${f1(cy)} Q${f1((cx + ox) / 2)} ${f1(cy - 6 * s)} ${f1(ox)} ${f1(cy)}" stroke="#23211d" stroke-width="${f1(3.2 * s)}" fill="none" stroke-linecap="round"/>`;
    // needle fans: several half-rosettes of thin strokes along the branch
    for (let f = 0; f < 4; f++) {
      const fx = cx + (ox - cx) * (0.2 + f * 0.27) + (r() - 0.5) * 8 * s;
      const fy = cy - 2 * s + (r() - 0.5) * 6 * s;
      const len = (19 + r() * 9) * s;
      let needles = '';
      for (let a = -3.05; a <= -0.1; a += 0.17) {
        const aa = a + (r() - 0.5) * 0.12;
        const l = len * (0.75 + r() * 0.35);
        needles += `M${f1(fx)} ${f1(fy)}l${f1(Math.cos(aa) * l)} ${f1(Math.sin(aa) * l * 0.62)}`;
      }
      clumps += `<path d="${needles}" stroke="#1f1d1a" stroke-width="${f1(1.3 * s)}" opacity="0.8" fill="none"/>`;
      clumps += `<ellipse cx="${f1(fx)}" cy="${f1(fy - len * 0.28)}" rx="${f1(len * 0.95)}" ry="${f1(len * 0.42)}" fill="#3b3833" opacity="0.42"/>`;
    }
  }
  return `<g filter="url(#brush)"><path d="${trunkPath}" stroke="#23211d" stroke-width="${f1(9 * s)}" stroke-linecap="round" fill="none"/>${clumps}</g>`;
}

const defs = `
  <defs>
    <filter id="brush" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="3" seed="${SEED}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${SEED + 1}" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.35" result="g2"/>
      <feComposite in="d" in2="g2" operator="in" result="textured"/>
      <feGaussianBlur in="textured" stdDeviation="0.9"/>
    </filter>
    <filter id="cun" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="3" seed="${SEED}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="8" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.045 0.004" numOctaves="3" seed="${SEED + 5}" result="streak"/>
      <feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -0.55" result="s2"/>
      <feComposite in="d" in2="s2" operator="in" result="streaked"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${SEED + 1}" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1 1.4" result="g2"/>
      <feComposite in="streaked" in2="g2" operator="in" result="t2"/>
      <feGaussianBlur in="t2" stdDeviation="0.7"/>
    </filter>
    <filter id="brushSoft" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="${SEED + 2}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="3"/>
    </filter>
    ${[20, 40, 70].map((b) => `<filter id="mist${b}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${b}"/></filter>`).join('')}
    <radialGradient id="sun" cx="0.74" cy="0.2" r="0.32">
      <stop offset="0" stop-color="#f1b98f" stop-opacity="0.55"/>
      <stop offset="0.35" stop-color="#f2d4b8" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#f4e6cc" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6f1e4"/>
      <stop offset="0.5" stop-color="#efeadc"/>
      <stop offset="1" stop-color="#e6e1d4"/>
    </linearGradient>
  </defs>`;

// ---------- composition ---------------------------------------------------------------------
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${body}</svg>`;

const birds = [[1640, 330, 1], [1690, 310, 0.8], [1605, 352, 0.7]]
  .map(([x, y, s]) => `<path d="M${x - 14 * s} ${y - 5 * s} Q${x - 6 * s} ${y - 9 * s} ${x} ${y} Q${x + 6 * s} ${y - 9 * s} ${x + 14 * s} ${y - 5 * s}" stroke="#3a3732" stroke-width="${2 * s}" fill="none" opacity="0.7"/>`)
  .join('');

const skyLayer = svg(`
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#sun)"/>
  <circle cx="${W * 0.74}" cy="${H * 0.2}" r="74" fill="#d9542b" opacity="0.72" filter="url(#brush)"/>
  ${wash('far1', range(H * 0.7, 190, 0.0016, 3.1), '#bdb8ad', 0.42, H * 0.86, 0.12, 3)}
  ${wash('far2', range(H * 0.76, 150, 0.0021, 8.4), '#aca79c', 0.5, H * 0.92, 0.15, 3)}
  ${mist(W * 0.5, H * 0.8, W * 0.62, 120, 0.85, 70)}
  ${birds}
`);

const spireList = [
  { x: 330, w: 70, h: 560, p: 3.6, lean: 0.4 }, { x: 470, w: 52, h: 420, p: 3.4 },
  { x: 610, w: 95, h: 300, p: 2.6 }, { x: 1540, w: 64, h: 610, p: 3.8, lean: -0.3 },
  { x: 1690, w: 50, h: 470, p: 3.4 }, { x: 1860, w: 88, h: 360, p: 2.8 },
  { x: 2090, w: 60, h: 520, p: 3.5, lean: 0.2 }, { x: 1080, w: 120, h: 230, p: 2.4 },
];
const spireBack = [
  { x: 180, w: 60, h: 420, p: 3.4 }, { x: 760, w: 70, h: 380, p: 3.2 }, { x: 900, w: 55, h: 300, p: 3.2 },
  { x: 1320, w: 62, h: 440, p: 3.6 }, { x: 1960, w: 58, h: 400, p: 3.5 }, { x: 2280, w: 70, h: 450, p: 3.4 },
];

// The mountains are built in stages as the page scrolls (Backdrop.astro), so each element is also
// rendered as its own transparent layer. Composited in order they give exactly the full painting.
const backSpires = spires(H * 0.86, spireBack, 60, 11);
const mainSpires = spires(H * 0.93, spireList, 90, 21);
// seat the temple on the actual crest of the tallest spire
const crest = mainSpires.filter(([x]) => Math.abs(x - 1540) < 30).reduce((a, b) => (b[1] < a[1] ? b : a));
const frameSpires = spires(H * 1.0, [{ x: 60, w: 80, h: 520, p: 3.2, lean: 0.5 }, { x: 2360, w: 90, h: 480, p: 3.0, lean: -0.5 }], 70, 33);

const stage = {
  back: `${wash('sb', backSpires, '#a09b90', 0.55, H * 0.95, 0.2, 3)}${moss(backSpires, '#7d786e', 60, 9, H * 0.86 - 300)}
  ${mist(W * 0.3, H * 0.83, 520, 90, 0.8, 40)}
  ${mist(W * 0.78, H * 0.86, 560, 100, 0.8, 40)}`,
  main: `${wash('sf', mainSpires, '#6e6a62', 0.84, H * 1.02, 0.34)}${moss(mainSpires, '#2f2c28', 140, 4, H * 0.93 - 330)}`,
  temple: temple(crest[0], crest[1] + 30, 1.05),
  frame: `${wash('fr', frameSpires, '#4f4b45', 0.88, H * 1.08, 0.4)}${moss(frameSpires, '#26241f', 70, 12, H - 300)}
  ${mist(W * 0.15, H * 0.96, 520, 110, 0.9, 40)}
  ${mist(W * 0.55, H * 0.98, 700, 120, 0.92, 70)}
  ${mist(W * 0.9, H * 0.97, 480, 100, 0.9, 40)}`,
};
const peaksLayer = svg(`${stage.back}${stage.main}${stage.temple}${stage.frame}`);

const nearLeft = range(H * 1.02, 260, 0.0032, 40.2).map(([x, y]) => [x, y + Math.max(0, (x - 700) * 0.6)]);
const nearRight = range(H * 1.04, 240, 0.0028, 57.9).map(([x, y]) => [x, y + Math.max(0, (1800 - x) * 0.55)]);
const ridges = `${wash('nl', nearLeft, '#56524b', 0.9, H * 1.1, 0.4)}
  ${wash('nr', nearRight, '#56524b', 0.86, H * 1.1, 0.4)}`;
const pines = `${pine(170, H * 0.88, 1.15, 1)}
  ${pine(2230, H * 0.9, 1.0, -1)}`;
const nearMist = mist(W * 0.5, H * 1.02, 900, 120, 0.95, 70);
const nearLayer = svg(`${ridges}${pines}${nearMist}`);

fs.mkdirSync('public/art', { recursive: true });
const render = async (src, out, alpha) => {
  const png = await sharp(Buffer.from(src), { density: 72 }).png().toBuffer();
  await sharp(png).resize(2000).webp({ quality: alpha ? 70 : 78, alphaQuality: 70, effort: 6 }).toFile(out);
  await sharp(png).resize(1000).webp({ quality: alpha ? 68 : 76, alphaQuality: 68, effort: 6 }).toFile(out.replace('.webp', '-1000.webp'));
  fs.writeFileSync(out.replace('public/art/', 'assets-generated/art-').replace('.webp', '.png'), png);
  return out;
};
await render(skyLayer, 'public/art/sky.webp', false);
await render(peaksLayer, 'public/art/peaks.webp', true);
await render(nearLayer, 'public/art/near.webp', true);
// the stages the scroll builds (see Backdrop.astro)
await render(svg(stage.back), 'public/art/build-back.webp', true);
await render(svg(stage.main), 'public/art/build-main.webp', true);
await render(svg(stage.temple), 'public/art/build-temple.webp', true);
await render(svg(stage.frame), 'public/art/build-frame.webp', true);
await render(svg(`${ridges}${nearMist}`), 'public/art/build-ridges.webp', true);
await render(svg(pines), 'public/art/build-pines.webp', true);
// phones build the painting in three stages, not six (fewer full-screen layers to composite):
// the main peaks, temple and framing peaks as one image, the ridges and pines as another
const merge = async (parts, out) => {
  const [first, ...rest] = parts.map((p) => `public/art/build-${p}-1000.webp`);
  await sharp(first).composite(rest.map((input) => ({ input }))).webp({ quality: 82, alphaQuality: 80, effort: 6 }).toFile(out);
};
await merge(['main', 'temple', 'frame'], 'public/art/build-mid-1000.webp');
await merge(['ridges', 'pines'], 'public/art/build-near-1000.webp');

// preview
// (sharp resizes before compositing, so composite to a buffer first)
const full = await sharp('assets-generated/art-sky.png').composite([{ input: 'assets-generated/art-peaks.png' }, { input: 'assets-generated/art-near.png' }]).png().toBuffer();
// moon-gate view: square crop centred on the temple spire, soft and small
await sharp(full).extract({ left: 1010, top: 330, width: 1100, height: 1100 }).resize(900).webp({ quality: 74 }).toFile('public/art/gate.webp');
await sharp(full).resize(1200).jpeg({ quality: 82 }).toFile('assets-generated/qc/landscape.jpg');
for (const f of ['sky', 'peaks', 'near']) console.log(f, Math.round(fs.statSync(`public/art/${f}.webp`).size / 1024) + ' KB');
