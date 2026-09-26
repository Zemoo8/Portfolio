// Reconnaissance: full-page screenshot + structural outline of a URL.
// Usage: node scripts/media/recon.mjs <url> <name> [width] [height]
import { chromium } from 'playwright';
const [url, name, w = '1440', h = '900'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('goto ' + e.message));
await page.waitForTimeout(2500);
const outline = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('section, header, footer, nav, [id], h1, h2, button, a[href^="#"]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.height < 4) return;
    out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} y=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} "${(el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 50)}"`);
  });
  return { title: document.title, height: document.documentElement.scrollHeight, items: out.slice(0, 120) };
});
await page.screenshot({ path: `assets-generated/recon/${name}.jpg`, fullPage: true, quality: 70, type: 'jpeg' }).catch(() => {});
console.log(JSON.stringify({ ...outline, errors }, null, 1));
await browser.close();
