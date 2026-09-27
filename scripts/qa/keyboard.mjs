// Keyboard-only checks: skip link, chapter rod, focus visibility, orbit, certificate lightbox, mobile menu.
import { chromium } from 'playwright';
const base = process.env.QA_BASE || 'http://localhost:4321';
const b = await chromium.launch();
const focused = (p) => p.evaluate(() => {
  const e = document.activeElement;
  const cs = getComputedStyle(e);
  return `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)}" outline=${cs.outlineStyle !== 'none' || e.matches(':focus-visible')}`;
});
const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);

for (const lang of ['en', 'ar']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
  await p.keyboard.press('Tab');
  check(`[${lang}] first Tab = skip link`, /skip|انتقل/i.test(await focused(p)), await focused(p));

  // chapter rod: after the name, Tab reaches the chapters; Enter goes there and inks it as current
  await p.keyboard.press('Tab');
  await p.keyboard.press('Tab');
  const firstCh = await p.evaluate(() => document.activeElement.dataset.rodLink ?? null);
  check(`[${lang}] Tab after the name reaches the first chapter on the rod`, firstCh === 'work', `focus=${firstCh}`);
  await p.focus('[data-rod-link="about"]');
  await p.keyboard.press('Enter');
  try { await p.waitForFunction(() => document.querySelector('[data-rod-link="about"]').getAttribute('aria-current') === 'true', null, { timeout: 5000 }); } catch {}
  const inked = await p.evaluate(() => document.querySelector('[data-rod-link="about"]').getAttribute('aria-current'));
  check(`[${lang}] Enter on a chapter goes there and marks it current`, inked === 'true', `aria-current=${inked}`);
  // back to the top at once (the page scrolls smoothly; a jump still under way must not carry on)
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo({ top: 0, behavior: 'instant' }); });
  await p.waitForFunction(() => scrollY === 0);
  await p.waitForTimeout(300);

  // the moon gate opens the intro film in a gust; Escape blows it away and focus returns to the gate
  await p.focus('[data-gust-open]');
  await p.keyboard.press('Enter');
  try { await p.waitForFunction(() => document.querySelector('[data-gust]').classList.contains('is-in'), null, { timeout: 5000 }); } catch {}
  const gust = await p.evaluate(() => ({ open: document.querySelector('[data-gust]').open, focusIn: !!document.activeElement.closest('[data-gust]') }));
  await p.keyboard.press('Escape');
  try { await p.waitForFunction(() => !document.querySelector('[data-gust]').open, null, { timeout: 5000 }); } catch {}
  const gustClosed = await p.evaluate(() => ({ open: document.querySelector('[data-gust]').open, back: document.activeElement.hasAttribute('data-gust-open') }));
  check(`[${lang}] the gate opens the intro film with focus inside; Escape closes and returns focus`, gust.open && gust.focusIn && !gustClosed.open && gustClosed.back, JSON.stringify({ gust, gustClosed }));

  // orbit: focus the 3rd card, it should become active; ArrowRight moves on
  // (the orbit starts only as it nears the view, then glides 1.5 s: wait for the card to arrive)
  const third = await p.evaluate(() => document.querySelectorAll('[data-orbit-card]')[2].dataset.title);
  const arrives = async (title) => {
    const t0 = Date.now();
    try { await p.waitForFunction((t) => document.querySelector('[data-orbit-card][data-active]')?.dataset.title === t, title, { timeout: 5000 }); } catch {}
    return Date.now() - t0;
  };
  await p.focus('[data-orbit-card]:nth-of-type(3)');
  const ms1 = await arrives(third);
  const act1 = await p.evaluate(() => document.querySelector('[data-orbit-card][data-active]')?.dataset.title);
  check(`[${lang}] focusing an orbit card brings it to the front`, act1 === third, `active=${act1} after ${ms1} ms`);
  await p.keyboard.press('ArrowRight');
  const nextTitle = await p.evaluate(() => document.activeElement.dataset.title);
  const ms2 = await arrives(nextTitle);
  const act2 = await p.evaluate(() => [document.querySelector('[data-orbit-card][data-active]')?.dataset.title, document.activeElement.dataset.title]);
  check(`[${lang}] ArrowRight rotates the orbit and moves focus`, !!act2[0] && act2[0] === act2[1] && act2[0] !== third, `active=${act2[0]} focus=${act2[1]} after ${ms2} ms`);
  const pressed = await p.evaluate(() => { const bt = document.querySelector('[data-orbit-pause]'); bt.click(); return bt.getAttribute('aria-pressed'); });
  check(`[${lang}] orbit pause button toggles`, pressed === 'true');

  // lightbox: open a certificate with the keyboard
  await p.focus('.sheet__paper');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
  const open = await p.evaluate(() => ({ open: document.querySelector('[data-lightbox-dialog]').open, title: document.querySelector('[data-lightbox-title]').textContent, inDialog: !!document.activeElement.closest('dialog') }));
  check(`[${lang}] Enter opens the certificate lightbox with focus inside`, open.open && open.inDialog, open.title);
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(200);
  const t2 = await p.evaluate(() => document.querySelector('[data-lightbox-title]').textContent);
  check(`[${lang}] arrows browse certificates in the lightbox`, t2 !== open.title, t2);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const closed = await p.evaluate(() => ({ open: document.querySelector('[data-lightbox-dialog]').open, back: document.activeElement.classList.contains('sheet__paper') }));
  check(`[${lang}] Escape closes and returns focus to the certificate`, !closed.open && closed.back);
  await p.close();
}

const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${base}/en/`, { waitUntil: 'load' });
await m.waitForTimeout(800);
await m.focus('[data-index-open]');
await m.keyboard.press('Enter');
await m.waitForTimeout(400);
const open = await m.evaluate(() => ({ open: document.querySelector('[data-index]').open, focusIn: !!document.activeElement.closest('[data-index]') }));
await m.keyboard.press('Escape');
await m.waitForTimeout(300);
const closed = await m.evaluate(() => ({ open: document.querySelector('[data-index]').open, focusIsOpener: document.activeElement.matches('[data-index-open]') }));
check('index opens with focus inside, Escape closes and returns focus', open.open && open.focusIn && !closed.open && closed.focusIsOpener, JSON.stringify({ open, closed }));
await b.close();
console.log(results.join('\n'));
