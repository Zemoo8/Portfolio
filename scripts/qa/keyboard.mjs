// Keyboard-only checks: skip link, focus visibility, orbit, certificate lightbox, mobile menu.
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

  // orbit: focus the 3rd card, it should become active; ArrowRight moves on
  await p.focus('[data-orbit-card]:nth-of-type(3)');
  await p.waitForTimeout(1600);
  const act1 = await p.evaluate(() => document.querySelector('[data-orbit-card][data-active]')?.dataset.index);
  check(`[${lang}] focusing an orbit card brings it to the front`, act1 === '03', `active=${act1}`);
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(1600);
  const act2 = await p.evaluate(() => [document.querySelector('[data-orbit-card][data-active]')?.dataset.index, document.activeElement.dataset.index]);
  check(`[${lang}] ArrowRight rotates the orbit and moves focus`, act2[0] === act2[1] && act2[0] !== '03', `active=${act2[0]} focus=${act2[1]}`);
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
await m.goto(`${base}/en/`, { waitUntil: 'networkidle' });
await m.focus('[data-menu-toggle]');
await m.keyboard.press('Enter');
await m.waitForTimeout(300);
const open = await m.evaluate(() => ({ expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'), focusInMenu: !!document.activeElement.closest('[data-menu]') }));
await m.keyboard.press('Escape');
const closed = await m.evaluate(() => ({ expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'), focusIsToggle: document.activeElement.matches('[data-menu-toggle]') }));
check('mobile menu opens with focus inside, Escape closes and returns focus', open.expanded === 'true' && open.focusInMenu && closed.expanded === 'false' && closed.focusIsToggle);
await b.close();
console.log(results.join('\n'));
