// Keyboard-only checks: tab order, skip link, focus visibility, mobile menu, intro tabs.
import { chromium } from 'playwright';
const base = process.env.QA_BASE || 'http://localhost:4321';
const b = await chromium.launch();
const desc = (p) => p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32)}" outline=${cs.outlineStyle !== 'none'}`; });

for (const lang of ['en', 'ar']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
  const order = [];
  for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); order.push(await desc(p)); }
  console.log(`[${lang}] tab order:\n  ` + order.join('\n  '));
  // intro tabs via arrows
  await p.focus('[data-intro-tab][aria-selected="true"]');
  await p.keyboard.press('ArrowRight');
  console.log(`[${lang}] after ArrowRight on intro tabs →`, await p.evaluate(() => document.activeElement.textContent.trim()));
  await p.close();
}
// mobile menu
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${base}/en/`, { waitUntil: 'networkidle' });
await m.focus('[data-menu-toggle]');
await m.keyboard.press('Enter');
await m.waitForTimeout(300);
const open = await m.evaluate(() => ({ expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'), hidden: document.querySelector('[data-menu]').hidden, focus: document.activeElement.textContent.trim().replace(/\s+/g, ' ') }));
await m.keyboard.press('Escape');
const closed = await m.evaluate(() => ({ expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'), focusIsToggle: document.activeElement.matches('[data-menu-toggle]') }));
console.log('mobile menu', JSON.stringify({ open, closed }));
await b.close();
