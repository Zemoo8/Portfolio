// Encodes every showcase film as a single, universally playable MP4:
// H.264 High@4.0, yuv420p (limited range, BT.709), +faststart, no audio.
// WebM is deliberately not produced: VP9 files made from screen captures failed to decode
// in Chrome after the first frame, and a failure at that point never falls back to MP4.
//
//   node scripts/media/encode-films.mjs [key ...]      (no keys = all)
//
// Outputs per key:  public/media/projects/<key>.mp4
//                   public/media/projects/<key>-card.mp4   (960 px, for the orbit; desktop films only)
//                   <key>-poster.webp + -poster-sm.webp    (only when `poster` is given)
//                   src/data/film-dimensions.json          ({ key: [w, h, seconds] })
// Sources are only read. Our own earlier encodes are first copied to
// assets-generated/film-masters/ so re-running never re-compresses a re-compression.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PUB = path.join(ROOT, 'public/media/projects');
const MASTERS = path.join(ROOT, 'assets-generated/film-masters');
const USER = path.resolve(ROOT, '..'); // Ahmed's project folders (read-only)
const HOME = path.resolve(ROOT, '../..'); // files Ahmed pointed to outside the projects (read-only)

/** width: output width · crf: quality · start/end: trim (seconds of the source)
 *  card: also make the small orbit version (true, or { start, end } for a highlight loop)
 *  poster: seconds into the finished film
 *  pillar: [w, h, x, y] of a vertical film letterboxed in a wide frame — it is re-framed as the
 *  sharp column over a soft, blurred glow of itself instead of flat black bars */
const FILMS = {
  // AI Eyes — the ad Ahmed supplied ("AI Eyes AD", 9:16 content inside a 16:9 frame)
  // the first 5.8 s are near-black; the web cut opens on the logo reveal
  'aieyes/ad-film': { src: path.join(HOME, 'Downloads/AI Eyes AD.mp4'), width: 1600, crf: 24, start: 5.8, card: { start: 5.8, end: 34 }, poster: 2.7, pillar: [640, 1080, 640, 0] },
  // Cheezy — films Ahmed produced for the client (LIVRAISON = the delivered masters)
  'cheezy/brand-film': { src: path.join(USER, 'cheezy/LIVRAISON/Cheezy-Film.mp4'), width: 1600, crf: 24, card: true, poster: 35.6 },
  'cheezy/film-app': { src: path.join(USER, 'cheezy/LIVRAISON/Cheezy-Film-II.mp4'), width: 1600, crf: 24 },
  // screen recordings made by this repo's capture pipeline (scripts/media/capture.mjs)
  'cheezy/showcase-desktop': { self: true, width: 1600, crf: 23 },
  'cheezy/showcase-mobile': { self: true, width: 720, crf: 23 },
  'cheezy/app-mobile': { self: true, width: 720, crf: 23 },
  'radar/showcase-desktop': { self: true, width: 1440, crf: 23, card: true },
  'scraping/showcase-desktop': { self: true, width: 1600, crf: 23, card: true },
  'subway-runner/showcase-desktop': { self: true, width: 1440, crf: 23, card: true },
};

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const probe = (file) => {
  // first line: stream fields (sometimes with a trailing comma), last line: container duration
  const lines = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt:format=duration', '-of', 'csv=p=0:s=,', file])
    .trim().split(/\r?\n/).filter(Boolean);
  const [w, h, pix] = lines[0].split(',');
  return { w: +w, h: +h, pix, dur: +lines.at(-1).split(',')[0] };
};
const encode = (src, out, width, crf, pillar, start, end) => {
  const { pix } = probe(src);
  // screen captures come out as full-range (yuvj420p): convert to standard limited range
  const range = pix.startsWith('yuvj') ? ':in_range=full:out_range=limited' : '';
  const tmp = out.replace(/\.mp4$/, '.tmp.mp4');
  const H = Math.round((width * 9) / 16 / 2) * 2;
  const graph = pillar
    ? ['-filter_complex', `[0:v]crop=${pillar.join(':')},split=2[fg0][bg0];` +
        // glow: the column's inner part, enlarged and heavily blurred (no black edges in it)
        `[bg0]crop=iw-80:ih:40:0,scale=${width}:-2,crop=${width}:${H},gblur=sigma=${Math.round(width / 26)},eq=brightness=-0.1:saturation=1.3[bg];` +
        // column: feathered left/right edges so it melts into the glow
        `[fg0]scale=-2:${H}:flags=lanczos,format=yuva420p,geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='255*min(1,min(X,W-1-X)/${Math.round(width / 50)})'[fg];` +
        `[bg][fg]overlay=(W-w)/2:0,format=yuv420p[v]`, '-map', '[v]']
    : ['-vf', `scale=${width}:-2:flags=lanczos${range},format=yuv420p`];
  const trim = [...(start ? ['-ss', String(start)] : []), ...(end ? ['-to', String(end)] : [])];
  run('ffmpeg', ['-y', '-loglevel', 'error', ...trim, '-i', src, '-an', ...graph,
    '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0', '-preset', 'slow', '-crf', String(crf),
    '-g', '48', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, out);
};

const dimsFile = path.join(ROOT, 'src/data/film-dimensions.json');
const dims = fs.existsSync(dimsFile) ? JSON.parse(fs.readFileSync(dimsFile, 'utf8')) : {};
const only = process.argv.slice(2);
fs.mkdirSync(MASTERS, { recursive: true });

for (const [key, f] of Object.entries(FILMS)) {
  if (only.length && !only.includes(key)) continue;
  const out = path.join(PUB, `${key}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let src = f.src;
  if (f.self) {
    src = path.join(MASTERS, `${key.replace('/', '__')}.mp4`);
    if (!fs.existsSync(src)) fs.copyFileSync(out, src); // keep our first encode as the master
  }
  if (!fs.existsSync(src)) { console.warn(`skip ${key}: source missing`); continue; }
  encode(src, out, f.width, f.crf, f.pillar, f.start, f.end);
  if (f.card) {
    const c = f.card === true ? { start: f.start, end: f.end } : f.card;
    encode(src, path.join(PUB, `${key}-card.mp4`), 960, f.crf + 4, f.pillar, c.start, c.end);
  }
  if (f.poster != null) {
    // taken from the finished film, so the poster matches its framing exactly
    const png = path.join(MASTERS, `${key.replace('/', '__')}-poster.png`);
    run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(f.poster), '-i', out, '-frames:v', '1', png]);
    const sharp = (await import('sharp')).default;
    await sharp(png).resize({ width: f.width }).webp({ quality: 82 }).toFile(path.join(PUB, `${key}-poster.webp`));
    await sharp(png).resize({ width: 800 }).webp({ quality: 78 }).toFile(path.join(PUB, `${key}-poster-sm.webp`));
  }
  const p = probe(out);
  dims[key] = [p.w, p.h, Math.round(p.dur * 10) / 10];
  const kb = (fs.statSync(out).size / 1024) | 0;
  console.log(`${key.padEnd(34)} ${p.w}×${p.h}  ${p.dur.toFixed(1)} s  ${kb} KB${f.card ? `  (card ${(fs.statSync(path.join(PUB, `${key}-card.mp4`)).size / 1024) | 0} KB)` : ''}`);
}

// the broken VP9 files are no longer referenced anywhere
for (const dir of fs.readdirSync(PUB)) {
  const d = path.join(PUB, dir);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const file of fs.readdirSync(d)) if (file.endsWith('.webm')) fs.rmSync(path.join(d, file));
}
fs.writeFileSync(dimsFile, JSON.stringify(dims, null, 2) + '\n');
