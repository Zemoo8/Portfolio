// Film playback check in real Google Chrome (H.264 + VP9): every case-study film and every
// orbit card must actually play (time advances). Usage: node scripts/qa/films.mjs [base-url]
import { chromium } from 'playwright';

const base = process.argv[2] || process.env.QA_BASE || 'http://localhost:4321';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(e.message));
const results = [];
const check = (name, s) => {
  const ok = !!s && s.t > 0.2 && !s.err;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(46)} ${JSON.stringify(s)}`);
};
const info = (v) => v && ({ src: v.currentSrc.split('/').slice(-2).join('/'), ready: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2), err: v.error?.code ?? null });

const { projects } = await import('../../src/content/projects.ts');
for (const pr of projects) {
  await p.goto(`${base}/en/work/${pr.slug}/`, { waitUntil: 'load', timeout: 45000 });
  const n = await p.evaluate(() => document.querySelectorAll('[data-film] video').length);
  for (let i = 0; i < n; i++) {
    await p.evaluate((k) => document.querySelectorAll('[data-film] video')[k].scrollIntoView({ block: 'center' }), i);
    await p.waitForTimeout(3200);
    const s = await p.evaluate((k) => { const v = document.querySelectorAll('[data-film] video')[k]; return { src: v.currentSrc.split('/').slice(-2).join('/'), ready: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2), err: v.error?.code ?? null }; }, i);
    check(`case ${pr.slug} #${i + 1}`, s);
  }
}

await p.goto(`${base}/en/`, { waitUntil: 'load', timeout: 45000 });
await p.evaluate(() => document.querySelector('#work').scrollIntoView());
await p.waitForTimeout(1500);
const cards = await p.evaluate(() => document.querySelectorAll('[data-orbit-card]').length);
for (let k = 0; k < cards; k++) {
  if (k > 0) await p.evaluate(() => document.querySelector('[data-orbit-next]').click());
  await p.waitForTimeout(3600);
  const s = await p.evaluate(() => {
    const c = document.querySelector('[data-orbit-card][data-active]');
    const v = c?.querySelector('video');
    return { card: c?.dataset.title, hasFilm: !!c?.dataset.orbitFilm, v: v ? { src: v.currentSrc.split('/').slice(-2).join('/'), ready: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2), err: v.error?.code ?? null } : null };
  });
  if (s.hasFilm) check(`orbit ${s.card}`, s.v);
  else results.push(`----  orbit ${s.card} (no film — poster only)`);
}
// the six worlds on the home page
const worlds = await p.evaluate(() => [...document.querySelectorAll('[data-world]')].map((w) => w.id));
for (const id of worlds) {
  const has = await p.evaluate((i) => !!document.querySelector(`#${i} [data-film] video`), id);
  if (!has) { results.push(`----  ${id} (still image)`); continue; }
  await p.evaluate((i) => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector(`#${i} [data-film]`).scrollIntoView({ block: 'center' }); }, id);
  await p.waitForTimeout(3200);
  const s = await p.evaluate((i) => { const v = document.querySelector(`#${i} [data-film] video`); return { src: v.currentSrc.split('/').slice(-2).join('/'), ready: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2), err: v.error?.code ?? null }; }, id);
  check(`home ${id}`, s);
}
void info;
console.log(results.join('\n'));
console.log('console errors:', errs.length ? errs : 'none');
await b.close();
