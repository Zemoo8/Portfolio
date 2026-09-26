// Visual QA: full-page screenshots after scrolling through (so reveals fire).
// Usage: node scripts/qa/shoot.mjs <path> <name> [WxH ...]   e.g. /en/ home 1440x900 390x844
import { chromium } from 'playwright';
import fs from 'node:fs';

const [route = '/en/', name = 'home', ...sizes] = process.argv.slice(2);
const views = sizes.length ? sizes : ['1440x900'];
const base = process.env.QA_BASE || 'http://localhost:4321';
fs.mkdirSync('assets-generated/qc/site', { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const v of views) {
  const [width, height] = v.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 800, isMobile: width < 800 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  page.on('response', (r) => r.status() >= 400 && !/intro-(en|fr|ar)\.(mp4|webm|vtt)/.test(r.url()) && errors.push(`${r.status()} ${r.url()}`));
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += Math.round(height * 0.7)) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  const overflow = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed'; }).slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(el.getBoundingClientRect().left)}→${Math.round(el.getBoundingClientRect().right)}`);
  });
  await page.screenshot({ path: `assets-generated/qc/site/${name}-${v}.jpg`, type: 'jpeg', quality: 70 });
  await page.screenshot({ path: `assets-generated/qc/site/${name}-${v}-full.jpg`, fullPage: true, type: 'jpeg', quality: 60 });
  console.log(JSON.stringify({ view: v, route, height: h, overflow, errors: [...new Set(errors)].slice(0, 10) }));
  await ctx.close();
}
await browser.close();
