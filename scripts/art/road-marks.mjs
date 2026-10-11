// What stands along the road in the Path chapter: a pavilion, karst rocks, a pine — each on its
// own rise of ground, pale gold like the road it stands beside and cut with ink lines the way an
// engraver would — and the people on the road: a walker and two riders, in ink.
// Written to public/art/road-*.png. The gold is the road's own (Path.astro, --gold): where a rise
// of ground runs into the road the two must be one colour.
// Deterministic (seeded).   node scripts/art/road-marks.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '../../public/art');
const GOLD = '#f0d7a1';
const INK = '#1d170e';
const f = (n) => Math.round(n * 10) / 10;
const rnd = (seed) => { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// a hand is never quite steady: the same slight tremor on every mark (moved in sRGB, so no colour shifts)
const tremor = `<filter id="t" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>`;
/** A landmark: its body in gold, then the lines cut into it. */
const art = (w, h, body, lines) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${tremor}<g filter="url(#t)"><g fill="${GOLD}" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round">${body}</g><g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${lines}</g></g></svg>`;
/** The rise of ground a landmark stands on: a long low lens, its ends running out to nothing. */
const ground = (w, y) => `<path d="M0 ${y}Q${w / 2} ${y - 30} ${w} ${y}Q${w / 2} ${y + 20} 0 ${y}Z"/>`;

// ---- a pavilion: a terrace, columns and a railing, two roofs with upturned eaves, tiles cut as lines
function roofShape(cx, eave, ridge, half, rise) {
  // the eave sags and turns up at both ends; the ridge is shorter
  const tip = half * 1.18, top = half * 0.52;
  return `M${f(cx - tip)} ${f(eave - rise * 0.34)} Q${f(cx - half * 0.86)} ${f(eave + 5)} ${f(cx - half * 0.55)} ${f(eave)} L${f(cx + half * 0.55)} ${f(eave)} Q${f(cx + half * 0.86)} ${f(eave + 5)} ${f(cx + tip)} ${f(eave - rise * 0.34)} Q${f(cx + half * 0.8)} ${f(eave - rise * 0.5)} ${f(cx + top)} ${f(ridge)} L${f(cx - top)} ${f(ridge)} Q${f(cx - half * 0.8)} ${f(eave - rise * 0.5)} ${f(cx - tip)} ${f(eave - rise * 0.34)}Z`;
}
function roofLines(cx, eave, ridge, half, rise, seed) {
  const top = half * 0.52;
  const r = rnd(seed);
  let tiles = '';
  for (let i = 0; i <= 18; i++) {
    const s = i / 18;
    const x0 = cx - top + s * top * 2;
    const x1 = cx - half * 0.98 + s * half * 1.96;
    const sag = Math.sin(s * Math.PI) * 4;
    tiles += `M${f(x0)} ${f(ridge + 3)}Q${f((x0 + x1) / 2 + (r() - 0.5) * 2)} ${f((ridge + eave) / 2 + sag)} ${f(x1)} ${f(eave - 3 - (1 - Math.sin(s * Math.PI)) * rise * 0.26)}`;
  }
  return `<path d="${roofShape(cx, eave, ridge, half, rise)}" fill="${INK}" fill-opacity="0.2" stroke-width="3.6"/><path d="${tiles}" stroke-width="1.7"/><path d="M${f(cx - top - 6)} ${f(ridge)}H${f(cx + top + 6)}" stroke-width="5"/>`;
}
function pavilion() {
  const body = `${ground(400, 352)}<path d="M50 318H350V334H50Z"/><path d="M30 334H370V352H30Z"/><path d="M84 200H316V318H84Z"/><path d="M76 200H324V212H76Z"/>
    <path d="${roofShape(200, 190, 142, 150, 44)}"/><path d="M138 112H262V142H138Z"/><path d="${roofShape(200, 108, 70, 96, 34)}"/>
    <path d="M197 72V44h6V72Z"/><circle cx="200" cy="40" r="7"/>`;
  let s = '';
  // terrace and steps
  s += `<path d="M50 318H350M30 334H370" stroke-width="3"/><path d="M168 318V350M232 318V350M168 329H232M168 340H232" stroke-width="2.2"/>`;
  // the dark of the open hall behind the columns
  s += `<path d="M96 214H304V282H96Z" fill="${INK}" fill-opacity="0.34" stroke="none"/>`;
  // columns, the beam they carry, the railing between them
  for (const x of [88, 142, 200, 258, 312]) s += `<path d="M${x - 5} 212V318M${x + 5} 212V318" stroke-width="2.6"/><path d="M${x - 4} 213H${x + 4}V317H${x - 4}Z" fill="${GOLD}" stroke="none"/>`;
  s += `<path d="M76 200H324V212H76Z" stroke-width="2.8"/>`;
  for (const [a, b] of [[93, 137], [147, 195], [205, 253], [263, 307]]) {
    s += `<path d="M${a} 284H${b}M${a} 304H${b}" stroke-width="2.2"/>`;
    for (let x = a + 5; x < b - 4; x += 10) s += `<path d="M${x} 284l8 20M${x + 8} 284l-8 20" stroke-width="1.3"/>`;
  }
  // brackets under the eave
  for (let x = 84; x <= 316; x += 16) s += `<path d="M${x} 200v-8" stroke-width="1.8"/>`;
  s += roofLines(200, 190, 142, 150, 44, 3);
  // the upper storey and its lattice
  s += `<path d="M138 112H262V142H138Z" fill="${INK}" fill-opacity="0.16" stroke-width="2.8"/>`;
  for (let x = 150; x < 262; x += 14) s += `<path d="M${x} 114V140" stroke-width="1.4"/>`;
  s += `<path d="M138 127H262" stroke-width="1.4"/>`;
  s += roofLines(200, 108, 70, 96, 34, 9);
  s += `<path d="M190 58H210" stroke-width="2.6"/>`;
  return art(400, 372, body, s);
}

// ---- karst rocks: steep round-topped spires, shaded with the engraver's upright lines
function rocks(seed, list) {
  const r = rnd(seed);
  const W = 400, BASE = 400;
  const height = (x) => {
    let h = 0;
    for (const p of list) {
      const d = (x - p.x) / p.w;
      h = Math.max(h, p.h / (1 + Math.pow(Math.abs(d), 3.1)), (p.h * 0.5) / (1 + Math.pow(Math.abs((x - p.x - p.w * 1.15) / (p.w * 0.8)), 2.6)));
    }
    // the rise they stand on runs out toward both ends
    return h * Math.min(1, Math.min(x - 14, W - 14 - x) / 26);
  };
  const ridge = [];
  for (let x = 14; x <= W - 14; x += 4) ridge.push([x, BASE - Math.max(0, height(x)) - (Math.sin(x * 0.21) + Math.sin(x * 0.53)) * 2.2]);
  const outline = ridge.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
  const body = `${ground(W, BASE)}<path d="M14 ${BASE}L${outline}L${W - 14} ${BASE}Z"/>`;
  let s = `<path d="M${outline}" stroke-width="3.4"/>`;
  // shading: lines hung from the ridge, longest on one flank of every spire, each breaking off raggedly
  let hatch = '';
  for (let x = 20; x <= W - 20; x += 5.5) {
    const h = height(x);
    if (h < 26) continue;
    const slope = height(x + 6) - height(x - 6);
    const len = h * (slope < 0 ? 0.66 : 0.26) * (0.55 + r() * 0.5);
    const top = BASE - h + 7 + r() * 5;
    hatch += `M${f(x)} ${f(top)}l${f((r() - 0.5) * 3)} ${f(len)}`;
    if (r() > 0.6) hatch += `M${f(x + 2.5)} ${f(top + len * 0.5)}l${f((r() - 0.5) * 2)} ${f(len * 0.45)}`;
  }
  s += `<path d="${hatch}" stroke-width="1.7"/>`;
  // moss: small hooked dabs on the shoulders
  let dabs = '';
  for (let i = 0; i < 26; i++) { const x = 34 + r() * (W - 68); const h = height(x); if (h > 40) dabs += `M${f(x - 5)} ${f(BASE - h + 9)}q5 -6 10 0`; }
  s += `<path d="${dabs}" stroke-width="2.1"/>`;
  return art(W, 424, body, s);
}

// ---- a pine: a leaning trunk with bark cut into it, and flat tiers of needles like small clouds
function pine(seed, flip = 1) {
  const r = rnd(seed);
  const pts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([200 + flip * (Math.sin(t * 2.5) * 34 + t * 26 - 30), 392 - t * 300]); }
  const line = (list) => `${list.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`;
  const left = pts.map(([x, y], i) => [x - 10 * (1 - i / 25), y]);
  const right = pts.map(([x, y], i) => [x + 10 * (1 - i / 25), y]);
  let body = `${ground(400, 396)}<path d="M${line(left)}L${line([...right].reverse())}Z"/>`;
  let s = `<path d="M${line(left)}M${line(right)}" stroke-width="2.8"/>`;
  let bark = '';
  for (let i = 1; i < 19; i++) { const [x, y] = pts[i]; bark += `M${f(x - 5 + r() * 4)} ${f(y)}q${f(3 + r() * 3)} ${f(-5)} ${f(1)} ${f(-11)}`; }
  s += `<path d="${bark}" stroke-width="1.5"/>`;
  for (let k = 0; k < 6; k++) {
    const t = 0.34 + k * 0.125;
    const [cx, cy] = pts[Math.round(t * 20)];
    const reach = (104 - k * 11) * (0.85 + r() * 0.3);
    const dir = k % 2 ? flip : -flip;
    const ox = cx + dir * reach;
    // the tier: a flat cloud of needles, heaped from three rounds
    for (const [at, rx, ry] of [[0.22, 0.34, 15], [0.56, 0.4, 19], [0.9, 0.3, 14]]) body += `<ellipse cx="${f(cx + (ox - cx) * at)}" cy="${f(cy - 13)}" rx="${f(reach * rx + 10)}" ry="${ry}"/>`;
    s += `<path d="M${f(cx)} ${f(cy)}Q${f((cx + ox) / 2)} ${f(cy - 10)} ${f(ox)} ${f(cy - 2)}" stroke-width="2.8"/>`;
    for (let n = 0; n < 5; n++) {
      const fx = cx + (ox - cx) * (0.18 + n * 0.2) + (r() - 0.5) * 8;
      const fy = cy - 5 + (r() - 0.5) * 5;
      const len = 17 + r() * 8;
      let needles = '';
      for (let a = -2.9; a <= -0.24; a += 0.24) needles += `M${f(fx)} ${f(fy)}l${f(Math.cos(a + (r() - 0.5) * 0.1) * len)} ${f(Math.sin(a) * len * 0.62)}`;
      s += `<path d="${needles}" stroke-width="1.5"/>`;
    }
  }
  return art(400, 420, body, s);
}

// ---- the people on the road, as silhouettes in ink
const solid = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><g fill="${INK}" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
function walker() {
  // a wide hat, a travelling cloak, a staff, a stride
  return solid(120, 200, `
    <path d="M30 38L60 16L92 38Q61 46 30 38Z"/><circle cx="60" cy="46" r="11"/>
    <path d="M47 58Q60 52 73 58L84 128Q62 138 40 128Z"/>
    <path d="M50 126L40 186H52L62 138Z"/><path d="M66 126L84 182L74 188L58 138Z"/>
    <path d="M36 186h18v6h-22zM72 186l16 -4v6l-14 4z"/>
    <path d="M96 52L104 192" fill="none" stroke-width="4"/><path d="M76 84L99 96" fill="none" stroke-width="7"/>`);
}
function rider(x) {
  // a horse at a walk and the traveller on its back; drawn facing right
  return `<g transform="translate(${x} 0)">
    <path d="M38 96Q72 82 110 92Q126 96 130 110Q132 126 122 132L44 134Q30 128 32 110Q33 100 38 96Z"/>
    <path d="M112 96L132 62Q138 54 146 60L160 78Q162 86 154 88L142 84L132 104Z"/><path d="M138 58l4 -10l6 12z"/>
    <path d="M36 102Q20 108 16 132Q22 134 26 128Q30 114 42 110Z"/>
    <path d="M48 128L42 176H50L60 132Z"/><path d="M70 130L78 176H86L82 130Z"/><path d="M104 130L96 176H104L116 132Z"/><path d="M120 126L132 172L140 170L130 124Z"/>
    <path d="M38 176h14v5h-16zM76 176h14v5h-14zM94 176h14v5h-16zM130 170l12 -2v5l-10 3z"/>
    <path d="M68 96Q64 60 76 44Q88 40 96 50Q104 70 98 96Z"/><circle cx="86" cy="34" r="10"/><path d="M62 30L86 12L112 30Q86 36 62 30Z"/>
    <path d="M92 62L124 78" fill="none" stroke-width="5"/><path d="M74 92L66 124L76 126L84 96Z"/>
  </g>`;
}
const riders = () => solid(340, 190, rider(0) + rider(172));

const marks = {
  'road-pavilion': [pavilion(), 560],
  'road-rocks': [rocks(11, [{ x: 150, w: 44, h: 330 }, { x: 262, w: 38, h: 250 }, { x: 64, w: 30, h: 170 }, { x: 340, w: 28, h: 130 }]), 560],
  'road-peaks': [rocks(27, [{ x: 220, w: 36, h: 300 }, { x: 110, w: 42, h: 210 }, { x: 318, w: 30, h: 190 }]), 360],
  'road-pine': [pine(4, 1), 520],
  'road-walker': [walker(), 120],
  'road-riders': [riders(), 340],
};
fs.mkdirSync(OUT, { recursive: true });
for (const [name, [svg, width]] of Object.entries(marks)) {
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const out = path.join(OUT, `${name}.png`);
  await sharp(Buffer.from(svg), { density: 72 * (width / Number(vb[1])) }).resize(width).png({ compressionLevel: 9, palette: true, colours: 64 }).toFile(out);
  console.log(`${name}.png`.padEnd(20), `${width} px`, `${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
}
