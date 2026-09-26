// Quick look: viewport screenshots at given scroll positions (element selectors or px).
// node scripts/qa/look.mjs <route> <name> <WxH> <pos1> [pos2 ...]
import { chromium } from 'playwright';
const [route, name, size, ...positions] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const b = await chromium.launch({ channel: process.env.QA_CHANNEL || undefined, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 800, isMobile: width < 800 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('http://localhost:4321' + route, { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
let k = 0;
for (const pos of positions) {
  if (/^\d+$/.test(pos)) await p.evaluate((y) => window.scrollTo(0, y), Number(pos));
  else await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), pos);
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `assets-generated/qc/site/${name}-${k++}.jpg`, type: 'jpeg', quality: 72 });
}
console.log(JSON.stringify({ errs: errs.slice(0, 6) }));
await b.close();
