// Brush-drawn UI marks, rendered once to small SVGs in public/ink/ and used as CSS masks
// (so any colour can be painted through them, and they're cached across pages):
//   swash     — primary button: a loaded brush swash with a solid core (text stays ≥ AA)
//   under     — underline / active state: a thin tapered stroke
//   ring      — a small ensō around the active language
//   arrow     — prev / next (points right; mirrored in CSS for "previous" and for RTL)
//   cross     — close
//   dash      — kicker and tag bullet
//   rod       — the long hanging stroke of the navigation rod (baked upright)
//   roller    — the short, loaded stroke a hanging scroll hangs from
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

write('rod', svg('0 0 1200 16', paths(line(1188, 8, { width: 3.4, bristles: 10, seed: 15, dryness: 0.6, bow: 2.2, rise: 0.6 }), 6, 0), { stretch: true, filter: fibre(0.006, 0.9, 2.4, 12) }));

write('roller', svg('0 0 100 24', paths(line(88, 12, { width: 7, bristles: 14, seed: 17, dryness: 0.4, bow: 0.8, rise: -1 }), 6, 0), { stretch: true, filter: fibre(0.05, 0.5, 2.2, 13) }));

// sweep: the stroke that changes the page (global.css → view transitions) — a brush wider than
// the screen. Its body is solid from top to bottom (both lie beyond the screen), so only its two
// ends are ever seen: the loaded start that trails, and the long dry tail that leads the way.
{
  const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const lanes = 58;
  let hairs = '';
  for (let k = 0; k < lanes; k++) {
    const lane = ((k + 0.5) / lanes) * 2 - 1; // −1 (top) … 1 (bottom)
    const y = f(((k + 0.5) * 200) / lanes + (rand(k + 600) - 0.5) * 2.2);
    // the tip of a brush: the hairs in the middle reach furthest, the outer ones give out sooner
    const reach = 0.22 + 0.78 * Math.pow(Math.abs(lane), 1.7);
    const to = f(394 - 92 * reach * (0.55 + rand(k + 100) * 0.75));
    const from = f(8 + 30 * Math.pow(Math.abs(lane), 2) + rand(k) * 14);
    const width = f((200 / lanes) * (0.85 + rand(k + 700) * 1.5)); // hairs clump: no two alike
    // a hair is never quite straight: it sags or lifts a little on its way
    const bend = f((rand(k + 800) - 0.5) * 5);
    hairs += `<path d="M${from} ${y}Q${f((from + to) / 2)} ${f(y + bend)} ${to} ${f(y + bend * 0.4)}" stroke-width="${width}" stroke-opacity="${f(0.7 + rand(k + 200) * 0.3)}"/>`;
    // a few hairs skip, then touch the paper again further on
    if (rand(k + 300) > 0.6) hairs += `<path d="M${f(to + 4 + rand(k + 400) * 8)} ${f(y + bend * 0.4)}h${f(3 + rand(k + 500) * 11)}" stroke-width="${f(width * 0.6)}" stroke-opacity="0.45"/>`;
  }
  write('sweep', svg('0 0 400 200', '<path d="M44 -6H300V206H44Z" fill="#000" stroke="none"/>' + hairs, { stretch: true, filter: fibre(0.011, 0.34, 7, 21) }));
}

// seal: the body of a carved name seal pressed on paper (the tools in Capabilities) — a block with
// worn corners and an edge that did not take the ink evenly. (No chips inside it: at the size of a
// word they read as stray full stops.)
write('seal', svg('0 0 200 80', '<rect x="5" y="5" width="190" height="70" rx="7" fill="#000" stroke="none"/>', { stretch: true, filter: fibre(0.09, 0.11, 4.5, 31) }));

// Bake every mark to a PNG alpha mask as well: an SVG with feTurbulence is re-rasterised by the
// browser at every size it is used — measurable main-thread cost on pages with many marks.
// CSS uses the PNGs; the SVGs stay as the editable source.
import sharp from 'sharp';
const bake = { swash: [800, 160], under: [600, 28], ring: [200, 200], arrow: [240, 80], cross: [80, 80], dash: [88, 24], rod: [1200, 24], roller: [200, 48], sweep: [1600, 800], seal: [400, 160] };
// marks that are used upright are also baked turned a quarter clockwise (the stroke's start on top)
const upright = { rod: ['rod', 1] };
for (const [name, [w, h]] of Object.entries(bake)) {
  const src = fs.readFileSync(path.join(OUT, `${name}.svg`));
  const png = await sharp(src, { density: 72 * (w / Number(/viewBox="0 0 ([\d.]+)/.exec(src.toString())[1])) })
    .resize(w, h, { fit: 'fill' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  if (name !== 'rod') fs.writeFileSync(path.join(OUT, `${name}.png`), png);
  if (upright[name]) {
    const [file, k] = upright[name];
    await sharp(png).resize(Math.round(w * k), Math.round(h * k), { fit: 'fill' }).rotate(90).png({ compressionLevel: 9, palette: false }).toFile(path.join(OUT, `${file}.png`));
  }
}
console.log('baked PNG masks');

// grain: the tooth of the paper (--paper-grain in global.css), a 220 px tile of fine noise that
// repeats without a seam. It used to be an inline SVG feTurbulence: on a first visit the graphics
// driver compiled a noise shader for it — about a quarter of a second during which nothing on the
// page could move. One warm grey, its transparency taken from the noise (1–8 %).
{
  const noise = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .09 0"/></filter><rect width="100%" height="100%" filter="url(#p)"/></svg>`;
  const { data, info } = await sharp(Buffer.from(noise), { density: 72 }).resize(220, 220).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // the filter worked in linear light: its (.35 .3 .22) reaches the screen as this sRGB colour
  for (let i = 0; i < data.length; i += 4) { data[i] = 160; data[i + 1] = 149; data[i + 2] = 129; }
  await sharp(data, { raw: info }).png({ compressionLevel: 9, palette: true, colours: 32, dither: 0 }).toFile(path.join(OUT, 'grain.png'));
  console.log('grain.png'.padEnd(12), `${(fs.statSync(path.join(OUT, 'grain.png')).size / 1024).toFixed(1)} KB`);
}
