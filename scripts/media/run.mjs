// Usage: node scripts/media/run.mjs films <slug>   |   node scripts/media/run.mjs stills <slug>
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { capture } from './capture.mjs';
import { scenarios, stills } from './scenarios.mjs';

const [mode, slug] = process.argv.slice(2);
const pub = (s) => path.join('public/media/projects', s);
const raw = (s) => path.join('assets-generated', s);

if (mode === 'films') {
  const list = scenarios[slug];
  if (!list) throw new Error(`no scenarios for ${slug}`);
  fs.mkdirSync(pub(slug), { recursive: true });
  for (const sc of list) {
    const only = process.argv[4];
    if (only && sc.name !== only) continue;
    const res = await capture(sc, pub(slug));
    console.log(JSON.stringify(res));
  }
} else if (mode === 'stills') {
  fs.mkdirSync(raw(slug), { recursive: true });
  const browser = await chromium.launch({ args: ['--hide-scrollbars'] });
  for (const [s, url, viewport, mobile, steps, file, opts = {}] of stills.filter((x) => x[0] === slug)) {
    const ctx = await browser.newContext(
      mobile ? { ...devices['iPhone 13'], viewport, deviceScaleFactor: 3 } : { viewport, deviceScaleFactor: 2, colorScheme: opts.colorScheme || 'dark' },
    );
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    if (opts.before) await page.evaluate(opts.before);
    await page.waitForTimeout(1200);
    for (const [op, a, b, c] of steps) {
      try {
        if (op === 'wait') await page.waitForTimeout(a);
        else if (op === 'click') await page.click(a, { timeout: 8000 });
        else if (op === 'hover') await page.hover(a);
        else if (op === 'type') await page.type(a, b, { delay: 20 });
        else if (op === 'eval') await page.evaluate(a);
        else if (op === 'scroll') {
          await page.evaluate(({ a, c, sc }) => {
            const el = sc ? document.querySelector(sc) : null;
            let y = a;
            if (typeof a === 'string') { const n = document.querySelector(a); y = n ? n.getBoundingClientRect().top + (el ? el.scrollTop : scrollY) + (c || 0) : 0; }
            el ? (el.scrollTop = y) : window.scrollTo(0, y);
          }, { a, c, sc: opts.scroller });
        }
      } catch (e) { console.warn(`  ! ${file} ${op} ${a}: ${e.message.split('\n')[0]}`); }
    }
    await page.screenshot({ path: path.join(raw(slug), file), fullPage: !!opts.fullPage });
    console.log('still', slug, file);
    await ctx.close();
  }
  await browser.close();
}
