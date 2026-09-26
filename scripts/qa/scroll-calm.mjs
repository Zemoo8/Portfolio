// Scroll must be predictable: native scrolling, position-driven effects only.
//  1) wheel input moves the page by exactly what was asked (no smoothing/inertia library)
//  2) the o of the name travels by scroll position: the same place, however fast you got there
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
// 1) native wheel
await p.mouse.move(700, 450);
const y0 = await p.evaluate(() => scrollY);
await p.mouse.wheel(0, 300);
await p.waitForTimeout(700);
const y1 = await p.evaluate(() => scrollY);
check('wheel moves the page by what was asked (no inertia)', Math.abs(y1 - y0 - 300) <= 2, `${y0} → ${y1}`);

// 2) the o of the name travels by position: reached slowly or in one jump, it is in the same place
const at = () => p.evaluate(() => document.querySelector('.traveller')?.style.transform || 'none');
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
for (let y = 0; y <= 450; y += 75) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(80); }
await p.waitForTimeout(300);
const slow = await at();
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
await p.evaluate(() => scrollTo(0, 450)); await p.waitForTimeout(300);
const fast = await at();
check('the o travels by scroll position only', slow === fast && slow !== 'none', `${slow} vs ${fast}`);

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
