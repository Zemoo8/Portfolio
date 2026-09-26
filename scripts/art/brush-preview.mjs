import sharp from 'sharp';
const { circle, line } = await import('../../src/lib/brush.ts');
const paths = (bs, color = '#1f1d1a') => bs.map((b) => `<path d="${b.d}" stroke="${color}" stroke-width="${b.w}" stroke-opacity="${b.o}" fill="none" stroke-linecap="round"/>`).join('');
const c = circle(200, 200, 170, { width: 21, bristles: 56, seed: 3, dryness: 0.75, gap: 0.42 });
const l = line(560, 18, { width: 8, bristles: 34, seed: 5, dryness: 0.65 });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="460" viewBox="0 0 1000 460">
<rect width="1000" height="460" fill="#f5efe1"/>
<g transform="translate(20,30)">${paths(c)}</g>
<g transform="translate(430,120)">${paths(l)}</g>
<g transform="translate(430,220) scale(0.8)">${paths(line(560, 18, { width: 9, bristles: 30, seed: 9, dryness: 0.75 }), '#b3321a')}</g>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('assets-generated/qc/brush.png');
