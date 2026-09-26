// Renders social cards (1200×630) and neutral intro-film posters from the running site,
// so the typography and the iris are exactly the site's own.
// Requires the preview server: npm run build && npm run preview, then: node scripts/og/render.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';

const base = process.env.QA_BASE || 'http://localhost:4321';
const langs = ['en', 'fr', 'ar'];
// Node ≥ 22.18 strips TypeScript types natively, so the content module is imported as-is.
const { projects: projectList } = await import('../../src/content/projects.ts');

fs.mkdirSync('public/og', { recursive: true });
fs.mkdirSync('public/media/intros', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });

// ---- intro posters (4:5, neutral: iris only) -------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${base}/en/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '.intro__overlay,.grain{display:none!important}' });
  await page.waitForTimeout(300);
  const buf = await page.locator('.intro__stage').screenshot();
  for (const l of langs) {
    await sharp(buf).resize(1080, 1350, { fit: 'cover' }).webp({ quality: 82 }).toFile(`public/media/intros/intro-${l}-poster.webp`);
  }
  await ctx.close();
}

// ---- social cards --------------------------------------------------------------------
const card = ({ lang, kicker, title, sub, image, tone }) => `
<div id="og" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}" style="--tone:${tone}">
  <div class="t">
    <p class="k"><i></i>${kicker}</p>
    <h1>${title}</h1>
    <p class="s">${sub}</p>
    <p class="u">github.com/Zemoo8 · linkedin</p>
  </div>
  <div class="m">${image}</div>
</div>`;
const css = `
  html,body{margin:0;background:#0c0c0b}
  body>*:not(#og){display:none!important}
  #og{position:fixed;inset:0;width:1200px;height:630px;display:grid;grid-template-columns:1.15fr 1fr;gap:48px;padding:64px;box-sizing:border-box;background:
    radial-gradient(60% 80% at 85% 50%, color-mix(in srgb, var(--tone) 22%, transparent), transparent 70%), #0c0c0b;color:#ece9e2;font-family:'Geist Variable',sans-serif;z-index:99999}
  #og[lang=ar]{font-family:'IBM Plex Sans Arabic',sans-serif}
  .t{display:flex;flex-direction:column;justify-content:space-between}
  .k{margin:0;font:400 18px 'Geist Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#8d8980;display:flex;align-items:center;gap:12px}
  #og[lang=ar] .k{font-family:'IBM Plex Sans Arabic';letter-spacing:0}
  .k i{width:10px;height:10px;border-radius:50%;background:#ff5a26}
  h1{margin:0;font:400 104px/0.9 'Instrument Serif',serif;letter-spacing:-.03em}
  #og[lang=ar] h1{font:500 88px/1.15 'IBM Plex Sans Arabic';letter-spacing:0}
  .s{margin:0;font-size:26px;line-height:1.35;color:#c9c5bc}
  .u{margin:0;font:400 16px 'Geist Mono',monospace;color:#5c5953;direction:ltr;text-align:start}
  .m{position:relative;border-radius:18px;overflow:hidden;box-shadow:0 0 0 1px rgba(236,233,226,.12) inset;background:#131312}
  .m img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .m.portrait{background:radial-gradient(80% 60% at 50% 30%,#23221f,#111110);border-radius:999px 999px 18px 18px}
  .m.portrait img{object-fit:cover;object-position:50% 20%}`;

const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const shoot = async (lang, data, out) => {
  await page.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: css });
  await page.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), card({ lang, ...data }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.locator('#og').screenshot({ path: out, type: 'jpeg', quality: 86 });
};

const home = {
  en: ['Full-stack & AI developer', 'Ahmed<br><em>Baghouli</em>', 'AI systems that have to work for real people.'],
  fr: ['Développeur full-stack & IA', 'Ahmed<br><em>Baghouli</em>', 'Des systèmes d’IA pensés pour de vraies personnes.'],
  ar: ['مطوّر برمجيات شاملة وذكاء اصطناعي', 'أحمد<br>بغولي', 'أنظمة ذكاء اصطناعي تعمل لأشخاص حقيقيين.'],
};
for (const l of langs) {
  const [kicker, title, sub] = home[l];
  await shoot(l, { kicker, title, sub, tone: '#ff5a26', image: `<div class="m portrait" style="position:absolute;inset:0"><img src="/media/profile/portrait.webp"></div>` }, `public/og/default-${l}.jpg`);
}
for (const p of projectList) {
  const img = p.film?.desktop ? `/media/projects/${p.film.desktop}-poster.webp` : `/media/projects/${p.cover.src}.webp`;
  for (const l of langs) {
    await shoot(l, { kicker: `${p.index} · ${p.category[l]}`, title: p.title, sub: p.tagline[l], tone: p.tone, image: `<img src="${img}" style="object-fit:${p.cover.kind === 'figure' && !p.film?.desktop ? 'contain;background:#f7f6f2' : 'cover'}">` }, `public/og/${p.slug}-${l}.jpg`);
  }
}
await browser.close();
console.log('og + posters written');
