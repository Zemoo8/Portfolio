// Renders the emblem to PNG for visual iteration: node scripts/art/emblem-preview.mjs [json-overrides]
import sharp from 'sharp';
const { emblemPath, defaultEmblem } = await import('../../src/lib/emblem.ts');
const o = { ...defaultEmblem, ...(process.argv[2] ? JSON.parse(process.argv[2]) : {}) };
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-110 -110 220 220" width="600" height="600"><rect x="-110" y="-110" width="220" height="220" fill="#111"/><path d="${emblemPath(o)}" fill="#fff" fill-rule="nonzero"/></svg>`;
await sharp(Buffer.from(svg)).png().toFile('assets-generated/qc/emblem.png');
console.log(JSON.stringify(o));
