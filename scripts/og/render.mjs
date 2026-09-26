// Renders social cards (1200×630) and the neutral intro-film posters from the running site,
// so the typography, painting and seal are exactly the site's own.
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

// ---- intro posters: the moon-gate view, square (films are shown in a circle) ----------
for (const l of langs) {
  await sharp('public/art/gate.webp').resize(1080, 1080).webp({ quality: 80 }).toFile(`public/media/intros/intro-${l}-poster.webp`);
}

// ---- social cards --------------------------------------------------------------------
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const card = ({ lang, kicker, title, sub, image, portrait }) => `
<div id="og" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}">
  <img class="bg" src="/art/sky.webp"><img class="bg" src="/art/peaks.webp"><img class="bg" src="/art/near.webp">
  <div class="wash"></div>
  <div class="t">
    <p class="k">${kicker}</p>
    <h1>${title}</h1>
    <p class="s">${sub}</p>
    <p class="u"><span class="seal"><svg viewBox="-100 -100 200 200"><use href="#air-emblem" x="-100" y="-100" width="200" height="200"/></svg></span>github.com/Zemoo8</p>
  </div>
  <div class="m ${portrait ? 'portrait' : 'mat'}">${image}</div>
</div>`;
const css = `
  html,body{margin:0}
  body>*:not(#og):not(svg){display:none!important}
  #og{position:fixed;inset:0;width:1200px;height:630px;display:grid;grid-template-columns:1.1fr 1fr;gap:44px;padding:60px 64px;box-sizing:border-box;overflow:hidden;background:#f5efe1;color:#1f1d1a;font-family:'Figtree Variable',sans-serif;z-index:99999}
  #og .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 100%}
  #og .wash{position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,241,229,.96) 0%,rgba(246,241,229,.85) 45%,rgba(246,241,229,.2) 100%)}
  #og[dir=rtl] .wash{background:linear-gradient(270deg,rgba(246,241,229,.96) 0%,rgba(246,241,229,.85) 45%,rgba(246,241,229,.2) 100%)}
  #og[lang=ar]{font-family:'IBM Plex Sans Arabic',sans-serif}
  .t{position:relative;display:flex;flex-direction:column;justify-content:space-between}
  .k{margin:0;font:600 17px 'Figtree Variable',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8e3a12}
  #og[lang=ar] .k{font-family:'IBM Plex Sans Arabic';letter-spacing:0}
  h1{margin:0;font:600 104px/.9 'Cormorant Garamond',serif;letter-spacing:-.02em}
  h1 em{font-weight:500}
  #og[lang=ar] h1{font:600 84px/1.25 'Noto Naskh Arabic',serif;letter-spacing:0}
  .s{margin:0;font-size:25px;line-height:1.4;color:#45413a;max-width:500px}
  .u{margin:0;display:flex;align-items:center;gap:14px;font:600 16px 'Figtree Variable',sans-serif;color:#66615a;direction:ltr}
  .seal{display:grid;place-items:center;width:44px;height:44px;border-radius:9px;background:#b33c1a;color:#fbeee0;transform:rotate(-4deg)}
  .seal svg{width:72%;height:72%;fill:currentColor}
  .m{position:relative;align-self:center;overflow:hidden}
  .m.mat{padding:10px;border-radius:14px;background:#fbf7ea;box-shadow:0 30px 60px -30px rgba(40,36,30,.5)}
  .m.mat img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px}
  .m.portrait{justify-self:center;width:300px;aspect-ratio:432/577;border-radius:999px 999px 16px 16px;background:radial-gradient(90% 70% at 50% 30%,#eef0e9,#dcded5);box-shadow:0 30px 60px -30px rgba(40,36,30,.5)}
  .m.portrait img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}`;

const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const shoot = async (lang, data, out) => {
  await page.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: css });
  await page.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), card({ lang, ...data }));
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.querySelectorAll('#og img')].map((i) => i.decode().catch(() => {}))]));
  await page.waitForTimeout(300);
  await page.locator('#og').screenshot({ path: out, type: 'jpeg', quality: 86 });
};

const home = {
  en: ['Full-stack & AI developer', 'Ahmed<br><em>Baghouli</em>', 'AI systems that have to work for real people.'],
  fr: ['Développeur full-stack & IA', 'Ahmed<br><em>Baghouli</em>', 'Des systèmes d’IA pensés pour de vraies personnes.'],
  ar: ['مطوّر برمجيات شاملة وذكاء اصطناعي', 'أحمد<br>بغولي', 'أنظمة ذكاء اصطناعي تعمل لأشخاص حقيقيين.'],
};
for (const l of langs) {
  const [kicker, title, sub] = home[l];
  await shoot(l, { kicker, title, sub, portrait: true, image: `<img src="/media/profile/portrait-ink.webp">` }, `public/og/default-${l}.jpg`);
}
for (const p of projectList) {
  const img = p.film?.desktop ? `/media/projects/${p.film.desktop}-poster.webp` : `/media/projects/${p.cover.src}.webp`;
  for (const l of langs) {
    await shoot(l, { kicker: `${p.index} · ${p.category[l]}`, title: p.title, sub: p.tagline[l], image: `<img src="${img}" style="object-fit:${p.cover.kind === 'figure' && !p.film?.desktop ? 'contain;background:#fbfaf6' : 'cover'}">` }, `public/og/${p.slug}-${l}.jpg`);
  }
}
await browser.close();
console.log('og + posters written');
