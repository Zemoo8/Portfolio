// Visual walkthrough: one viewport screenshot per scene, in real Chrome, after reveals settle.
// Usage: node scripts/qa/walk.mjs <out-dir> [WxH] [lang]
//   writes <out-dir>/<scene>.jpg for the home scenes and three case studies.
import { chromium } from 'playwright';
import fs from 'node:fs';

const [out = 'assets-generated/qc/walk', size = '1440x900', lang = 'en'] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const base = process.env.QA_BASE || 'http://localhost:4321';
fs.mkdirSync(out, { recursive: true });

const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 800, hasTouch: width < 800 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

const shot = async (name) => p.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 78 });
const goTo = async (sel, offset = 0) => {
  await p.evaluate(([s, o]) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const el = document.querySelector(s);
    if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY + o);
  }, [sel, offset]);
  await p.waitForTimeout(2400);
};

await p.goto(`${base}/${lang}/`, { waitUntil: 'load' });
await p.waitForTimeout(2600);
await shot('01-hero');
const scenes = (await p.evaluate(() => [...document.querySelectorAll('main > section[id], main > [data-scene]')].map((s) => s.id || s.dataset.scene))).filter(Boolean);
let k = 2;
for (const id of scenes) {
  await goTo(`#${id}`, -40);
  await shot(`${String(k++).padStart(2, '0')}-${id}`);
}
for (const slug of ['ai-eyes', 'cheezy', 'aegis-radar']) {
  await p.goto(`${base}/${lang}/work/${slug}/`, { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  await shot(`${String(k++).padStart(2, '0')}-case-${slug}`);
}
console.log(JSON.stringify({ scenes, errs }));
await b.close();
