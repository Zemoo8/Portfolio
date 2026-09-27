// Scroll must be predictable: native scrolling, position-driven effects only.
//  1) wheel input moves the page by exactly what was asked (no smoothing/inertia library)
//  2) the painted layers are CSS scroll-driven animations (compositor), and the same scroll
//     position always gives the same layer offset, whatever the speed of getting there
//  3) scrolling hard through the work chapter never rotates the orbit
//  4) no scroll-speed "wind" canvas exists any more
// Usage: node scripts/qa/scroll-calm.mjs [base-url]
import { chromium } from 'playwright';

const base = process.argv[2] || process.env.QA_BASE || 'http://localhost:4321';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${base}/en/`, { waitUntil: 'load' });
await p.waitForTimeout(1500);
const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);

check('no scroll-speed wind canvas', !(await p.$('[data-wind]')));
const tl = await p.evaluate(() => [...document.querySelectorAll('.build')].map((el) => el.getAnimations()[0]?.timeline?.constructor?.name ?? 'none'));
check('the painting builds on a ScrollTimeline', tl.length > 0 && tl.every((t) => t === 'ScrollTimeline'), tl.join(','));

// 1) native wheel
await p.mouse.move(700, 450);
const y0 = await p.evaluate(() => scrollY);
await p.mouse.wheel(0, 300);
await p.waitForTimeout(700);
const y1 = await p.evaluate(() => scrollY);
check('wheel moves the page by what was asked (no inertia)', Math.abs(y1 - y0 - 300) <= 2, `${y0} → ${y1}`);

// 2) same position, same picture — reached slowly vs. in one jump
const layerAt = () => p.evaluate(() => (() => { const c = getComputedStyle(document.querySelectorAll('.build')[1]); return c.translate + ' ' + c.opacity; })());
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
for (let y = 0; y <= 900; y += 150) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(80); }
await p.waitForTimeout(300);
const slow = await layerAt();
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(300);
const fast = await layerAt();
check('the painting depends on scroll position only', slow === fast && slow !== 'none', `${slow} vs ${fast}`);

// 3) the orbit ignores scrolling
await p.evaluate(() => document.querySelector('#work').scrollIntoView());
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('[data-orbit-pause]').click()); // stop the clock to isolate scroll
await p.waitForTimeout(800);
const before = await p.evaluate(() => [...document.querySelectorAll('[data-orbit-card]')].map((c) => c.style.transform).join('|'));
for (let k = 0; k < 8; k++) { await p.mouse.wheel(0, k % 2 ? -900 : 900); await p.waitForTimeout(90); }
await p.waitForTimeout(800);
const after = await p.evaluate(() => [...document.querySelectorAll('[data-orbit-card]')].map((c) => c.style.transform).join('|'));
check('hard scrolling does not move the orbit', before === after);

console.log(results.join('\n'));
await b.close();
