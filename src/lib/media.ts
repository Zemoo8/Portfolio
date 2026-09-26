// Build-time media helpers. Films are optional: if a file is missing the UI falls back to
// stills, so dropping a new MP4 into public/media/projects/<slug>/ is enough to publish it.
import fs from 'node:fs';
import nodePath from 'node:path';
import dims from '../data/media-dimensions.json';
import { asset } from '../i18n/config';

const PUBLIC = nodePath.resolve(process.cwd(), 'public');
const PROJECTS = 'media/projects';

export const exists = (rel: string) => fs.existsSync(nodePath.join(PUBLIC, rel));

export type FilmSource = { mp4: string; webm?: string; poster?: string };

/** Resolve a film key like 'cheezy/showcase-desktop' to its files, or null if absent. */
export function film(key?: string): FilmSource | null {
  if (!key) return null;
  const base = `${PROJECTS}/${key}`;
  if (!exists(`${base}.mp4`)) return null;
  return {
    mp4: asset(`${base}.mp4`),
    webm: exists(`${base}.webm`) ? asset(`${base}.webm`) : undefined,
    poster: exists(`${base}-poster.webp`) ? asset(`${base}-poster.webp`) : undefined,
  };
}

/** Responsive still: large + small WebP with intrinsic size (prevents layout shift). */
export function still(key: string) {
  const [w, h] = (dims as unknown as Record<string, [number, number]>)[key] ?? [1600, 1000];
  return {
    src: asset(`${PROJECTS}/${key}.webp`),
    srcset: `${asset(`${PROJECTS}/${key}-sm.webp`)} ${Math.round(w / 2)}w, ${asset(`${PROJECTS}/${key}.webp`)} ${w}w`,
    width: w,
    height: h,
  };
}
