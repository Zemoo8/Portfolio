// Emblem parameter sweep → one contact image.
import sharp from 'sharp';
const { emblemPath, defaultEmblem } = await import('../../src/lib/emblem.ts');
const base = { ...defaultEmblem, ...JSON.parse(process.argv[2] || '{}') };
const key = process.argv[3] || 'offset';
const values = JSON.parse(process.argv[4] || '[0.6,1.4,2.2,3.0,3.8,4.6]');
const tiles = await Promise.all(values.map(async (v) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-115 -115 230 230" width="320" height="320"><rect x="-115" y="-115" width="230" height="230" fill="#111"/><path d="${emblemPath({ ...base, [key]: v })}" fill="#fff"/><text x="-110" y="108" fill="#f80" font-size="12" font-family="sans-serif">${key}=${v}</text></svg>`;
  return { input: await sharp(Buffer.from(svg)).png().toBuffer() };
}));
await sharp({ create: { width: 320 * tiles.length, height: 320, channels: 3, background: '#000' } })
  .composite(tiles.map((t, i) => ({ ...t, left: i * 320, top: 0 })))
  .png().toFile('assets-generated/qc/emblem-grid.png');
