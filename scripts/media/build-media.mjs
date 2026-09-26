// Converts raw captures (assets-generated/<slug>/*.png) and selected source
// images from the original project folders into web-ready responsive WebP in
// public/media/projects/<slug>/. Originals are only ever read, never modified.
//
//   <name>.webp       large (desktop: 1920w, mobile: 780w)
//   <name>-sm.webp    half size, used by srcset
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('..');
const OUT = 'public/media/projects';

// [slug, source path, output name, large width]
const external = [
  ['radar', `${ROOT}/math.project/results/fig1_engagement_geometry.png`, 'fig-engagement', 1920],
  ['radar', `${ROOT}/math.project/results/fig2_tracking_accuracy.png`, 'fig-accuracy', 1920],
  ['radar', `${ROOT}/math.project/results/fig4_imm_modes.png`, 'fig-imm-modes', 1920],
  ['radar', `${ROOT}/math.project/results/fig6_design_sweeps.png`, 'fig-sweeps', 1920],
  ['cheezy', `${ROOT}/cheezy/ads/approved/01-ig-cheesecake-en.png`, 'ad-cheesecake', 900],
  ['cheezy', `${ROOT}/cheezy/ads/approved/04-story-matcha-fr.png`, 'ad-matcha', 900],
  ['cheezy', `${ROOT}/cheezy/ads/approved/06-poster-menu-fr.png`, 'ad-menu', 900],
];

const isMobile = (name) => /mobile/.test(name);

async function emit(slug, src, name, width) {
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  const meta = await sharp(src).metadata();
  const w = Math.min(width, meta.width);
  await sharp(src).resize({ width: w }).webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
  await sharp(src).resize({ width: Math.round(w / 2) }).webp({ quality: 78, effort: 6 }).toFile(path.join(dir, `${name}-sm.webp`));
  const h = Math.round((meta.height * w) / meta.width);
  return { slug, name, w, h };
}

const manifest = [];
for (const slug of fs.readdirSync('assets-generated')) {
  const dir = path.join('assets-generated', slug);
  if (!fs.statSync(dir).isDirectory() || ['qc', 'recon'].includes(slug)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    const name = f.replace(/\.png$/, '');
    manifest.push(await emit(slug, path.join(dir, f), name, isMobile(name) ? 780 : 1920));
  }
}
for (const [slug, src, name, w] of external) {
  if (fs.existsSync(src)) manifest.push(await emit(slug, src, name, w));
  else console.warn('missing source', src);
}
// Dimensions are consumed by the site to reserve layout space (no CLS).
fs.writeFileSync('src/data/media-dimensions.json', JSON.stringify(Object.fromEntries(manifest.map((m) => [`${m.slug}/${m.name}`, [m.w, m.h]])), null, 1));
console.log(`${manifest.length} images written`);
