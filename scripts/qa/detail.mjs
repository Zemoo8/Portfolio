// Close-up screenshots of specific elements (for design review).
// Usage: node scripts/qa/detail.mjs <route> <name> <WxH> <selector> [selector ...]
// Each selector is scrolled into view, given time to settle, then captured with some margin.
import { chromium } from 'playwright';
const [route, name, size, ...sels] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const b = await chromium.launch({ channel: process.env.QA_CHANNEL || undefined });
const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1.5, hasTouch: width < 800, isMobile: width < 800 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(`${process.env.QA_BASE || 'http://localhost:4321'}${route}`, { waitUntil: 'load' });
await p.waitForTimeout(1800);
let k = 0;
for (const sel of sels) {
  const el = await p.$(sel);
  if (!el) { errs.push(`missing ${sel}`); continue; }
  await el.scrollIntoViewIfNeeded();
  await p.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); window.scrollBy(0, r.top - Math.max(80, (innerHeight - r.height) / 2)); }, sel);
  await p.waitForTimeout(2600);
  const box = await el.boundingBox();
  const pad = 24;
  await p.screenshot({ path: `assets-generated/qc/site/${name}-${k++}.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(width - Math.max(0, box.x - pad), box.width + pad * 2), height: Math.min(height, box.height + pad * 2) } });
}
console.log(JSON.stringify({ errs }));
await b.close();
