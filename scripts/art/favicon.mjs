// Favicons: a bold brushed ensō in ink (the red seal logo is gone). Usage: node scripts/art/favicon.mjs
import fs from 'node:fs';
import sharp from 'sharp';
import { circle } from '../../src/lib/brush.ts';

const ring = circle(50, 50, 33, { width: 9, bristles: 14, seed: 23, dryness: 0.55, gap: 0.6 })
  .map((b) => `<path d="${b.d}" stroke-width="${b.w}" stroke-opacity="${b.o}"/>`).join('');
const svg = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${bg ? `<rect width="100" height="100" rx="22" fill="${bg}"/>` : ''}<g fill="none" stroke="#1f1d1a" stroke-linecap="round" stroke-linejoin="round">${ring}</g></svg>`;

fs.writeFileSync('public/favicon.svg', svg(null) + '\n');
for (const [file, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(Buffer.from(svg('#f5efe1')), { density: Math.max(72, size * 1.5) }).resize(size, size).png().toFile(`public/${file}`);
}
console.log('favicons written');
