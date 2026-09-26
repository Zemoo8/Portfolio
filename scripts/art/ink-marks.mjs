// Brush-drawn UI marks, rendered once to small SVGs in public/ink/ and used as CSS masks
// (so any colour can be painted through them, and they're cached across pages):
//   swash     — primary button: a loaded brush swash with a solid core (text stays ≥ AA)
//   under     — underline / active state: a thin tapered stroke
//   ring      — a small ensō around the active language
//   arrow     — prev / next (points right; mirrored in CSS for "previous" and for RTL)
//   cross     — close
//   dash      — kicker and tag bullet
//   edge      — the deckled bottom edge of the header's paper band (tiles horizontally)
// A directional turbulence displacement ("fibre") breaks every edge up like the hairs of a
// dry brush. Deterministic (seeded). Usage: node scripts/art/ink-marks.mjs
import fs from 'node:fs';
import path from 'node:path';
import { stroke, circle, line } from '../../src/lib/brush.ts';

const OUT = path.resolve(import.meta.dirname, '../../public/ink');
fs.mkdirSync(OUT, { recursive: true });

const f = (n) => Math.round(n * 10) / 10;
const paths = (bristles, dx = 0, dy = 0) =>
  bristles
    .map((b) => `<path d="${b.d.replace(/^M([-\d.]+) ([-\d.]+)/, (_, x, y) => `M${f(+x + dx)} ${f(+y + dy)}`)}" stroke-width="${b.w}" stroke-opacity="${b.o}"/>`)
    .join('');
const fibre = (fx, fy, scale, seed = 3) =>
  `<filter id="f" x="-10%" y="-40%" width="120%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
const svg = (vb, body, { stretch = false, filter = fibre(0.03, 0.5, 3) } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${stretch ? ' preserveAspectRatio="none"' : ''}>${filter}<g filter="url(#f)" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;
const write = (name, content) => {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), content);
  console.log(`${name}.svg`.padEnd(12), `${(content.length / 1024).toFixed(1)} KB`);
};

// swash: full body, a slow partial lift so the tail runs dry but stays wide under the text
const swashPressure = (s) => (s < 0.04 ? 1.1 - s * 2.5 : 1) * (s < 0.78 ? 1 : 1 - ((s - 0.78) / 0.22) * 0.5);
const swash = line(378, 40, { width: 27, bristles: 30, seed: 7, dryness: 0.6, bow: 2.5, rise: -3, pressure: swashPressure });
// solid core: the part the label sits on is fully opaque
const core = '<path d="M20 26 C 120 22, 260 23, 352 27 L 356 51 C 250 56, 120 56, 18 53 Z" fill="#000" stroke="none"/>';
write('swash', svg('0 0 400 80', core + paths(swash, 11, 0), { stretch: true, filter: fibre(0.012, 0.42, 7, 4) }));

write('under', svg('0 0 300 14', paths(line(292, 7, { width: 3.1, bristles: 9, seed: 3, dryness: 0.7, bow: 1.4, rise: -1.6 }), 4, 0), { stretch: true, filter: fibre(0.02, 0.8, 2.2, 6) }));

write('ring', svg('0 0 100 100', paths(circle(50, 50, 38, { width: 4.4, bristles: 12, seed: 5, dryness: 0.72, gap: 0.55 })), { filter: fibre(0.09, 0.09, 2.4, 8) }));

const along = (from, to, n, sag = 0) =>
  Array.from({ length: n }, (_, i) => { const s = i / (n - 1); return [from[0] + (to[0] - from[0]) * s, from[1] + (to[1] - from[1]) * s - Math.sin(s * Math.PI) * sag]; });
const shaft = stroke(along([6, 22], [110, 19.5], 30, 2.5), { width: 2.4, bristles: 7, seed: 11, dryness: 0.5 });
const headA = stroke(along([86, 6], [110, 19], 12), { width: 2.3, bristles: 6, seed: 12, dryness: 0.4 });
const headB = stroke(along([110, 19], [87, 34], 12), { width: 2.3, bristles: 6, seed: 13, dryness: 0.55 });
write('arrow', svg('0 0 120 40', paths(shaft) + paths(headA) + paths(headB), { filter: fibre(0.05, 0.3, 1.8, 9) }));

const diag = (from, to, seed) => stroke(along(from, to, 16, -1.5), { width: 2.8, bristles: 7, seed, dryness: 0.45 });
write('cross', svg('0 0 40 40', paths(diag([8, 7], [33, 33], 21)) + paths(diag([33, 8], [7, 33], 22)), { filter: fibre(0.12, 0.12, 1.6, 10) }));

write('dash', svg('0 0 44 12', paths(line(38, 6, { width: 3.2, bristles: 7, seed: 9, dryness: 0.5, bow: 0.6, rise: -0.8 }), 3, 0), { stretch: true, filter: fibre(0.06, 0.6, 1.6, 11) }));

// deckled paper edge: torn fibres from turbulence (stitched, so it tiles seamlessly)
write('edge', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 24" preserveAspectRatio="none"><filter id="t" x="0" y="-50%" width="100%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.045 0.22" numOctaves="3" seed="5" stitchTiles="stitch"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter><rect x="-20" y="-20" width="640" height="32" fill="#000" filter="url(#t)"/></svg>\n`);

// Bake every mark to a PNG alpha mask as well: an SVG with feTurbulence is re-rasterised by the
// browser at every size it is used — measurable main-thread cost on pages with many marks.
// CSS uses the PNGs; the SVGs stay as the editable source.
import sharp from 'sharp';
const bake = { swash: [800, 160], under: [600, 28], ring: [200, 200], arrow: [240, 80], cross: [80, 80], dash: [88, 24], edge: [1200, 48] };
for (const [name, [w, h]] of Object.entries(bake)) {
  const src = fs.readFileSync(path.join(OUT, `${name}.svg`));
  await sharp(src, { density: 72 * (w / Number(/viewBox="0 0 ([\d.]+)/.exec(src.toString())[1])) })
    .resize(w, h, { fit: 'fill' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(OUT, `${name}.png`));
}
console.log('baked PNG masks');
