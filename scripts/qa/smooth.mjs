// How smooth is the page under the wheel? Scrolls a page from top to bottom at a reading pace and
// at a hurried one, timing every frame, and reports per chapter: frames, the share that came late
// (> 20 ms and > 34 ms at 60 Hz), the worst frame, and the long animation frames with the script
// that caused them. Needs `astro preview` on :4321 (or pass a base URL).
//   node scripts/qa/smooth.mjs [path=/en/] [base=http://localhost:4321]
import { chromium } from 'playwright';

const route = process.argv[2] || '/en/';
const base = process.argv[3] || 'http://localhost:4321';
// A fresh browser has compiled no GPU shaders yet, so the first pass over a page pays for every
// new kind of paint as it scrolls into view (a first visit). With PROFILE=<dir> the browser keeps
// its profile, shader cache included: run twice and the second run is a returning visitor.
const launch = { channel: 'chrome', headless: !process.env.HEADED, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--window-position=0,0'] };
// Ahmed's laptop: 1920×1200 at 125 %
const screen = { viewport: { width: 1536, height: 826 }, deviceScaleFactor: 1.25 };
const browser = process.env.PROFILE ? null : await chromium.launch(launch);
const ctx = browser ? await browser.newContext(screen) : await chromium.launchPersistentContext(process.env.PROFILE, { ...launch, ...screen });
const page = await ctx.newPage();
await page.goto(base + route, { waitUntil: 'load' });
await page.waitForTimeout(3500);
await page.mouse.move(760, 420);

const record = () => page.evaluate(() => {
  const w = window;
  w.__frames = []; w.__loaf = [];
  let last = performance.now();
  const tick = (now) => { w.__frames.push([scrollY, now - last]); last = now; w.__raf = requestAnimationFrame(tick); };
  w.__raf = requestAnimationFrame(tick);
  try {
    w.__po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__loaf.push({ y: scrollY, ms: Math.round(e.duration), block: Math.round(e.blockingDuration), render: Math.round(e.startTime + e.duration - e.renderStart), scripts: e.scripts.map((s) => `${Math.round(s.duration)}ms ${s.invoker || s.name} ${(s.sourceURL || '').split('/').pop()}`) });
    });
    w.__po.observe({ type: 'long-animation-frame', buffered: false });
  } catch {}
});
const collect = () => page.evaluate(() => {
  cancelAnimationFrame(window.__raf); window.__po?.disconnect();
  const chapters = [...document.querySelectorAll('main section[id], main article, footer')].map((el) => ({ name: el.id || el.className.split(' ')[0] || el.tagName.toLowerCase(), top: el.getBoundingClientRect().top + scrollY }));
  return { frames: window.__frames, loaf: window.__loaf, chapters, height: document.documentElement.scrollHeight };
});

async function run(label, step, pause) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  await record();
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < height + 400; y += step) { await page.mouse.wheel(0, step); await page.waitForTimeout(pause); }
  await page.waitForTimeout(600);
  const { frames, loaf, chapters } = await collect();
  const where = (y) => { let n = 'top'; for (const c of chapters) if (y + 413 >= c.top) n = c.name; return n; };
  const by = new Map();
  for (const [y, dt] of frames.slice(2)) {
    const k = where(y);
    const s = by.get(k) ?? { n: 0, late: 0, missed: 0, worst: 0 };
    s.n++; if (dt > 20) s.late++; if (dt > 34) s.missed++; s.worst = Math.max(s.worst, dt);
    by.set(k, s);
  }
  console.log(`\n== ${label}: ${frames.length} frames`);
  console.log('chapter'.padEnd(16), 'frames'.padStart(7), '>20ms'.padStart(7), '>34ms'.padStart(7), 'worst'.padStart(7));
  let all = { n: 0, late: 0, missed: 0, worst: 0 };
  for (const [k, s] of by) {
    console.log(k.padEnd(16), String(s.n).padStart(7), String(s.late).padStart(7), String(s.missed).padStart(7), `${s.worst.toFixed(0)}ms`.padStart(7));
    all = { n: all.n + s.n, late: all.late + s.late, missed: all.missed + s.missed, worst: Math.max(all.worst, s.worst) };
  }
  console.log('ALL'.padEnd(16), String(all.n).padStart(7), `${((all.late / all.n) * 100).toFixed(1)}%`.padStart(7), `${((all.missed / all.n) * 100).toFixed(1)}%`.padStart(7), `${all.worst.toFixed(0)}ms`.padStart(7));
  for (const l of loaf) console.log(`  long frame ${l.ms}ms (blocking ${l.block}, render ${l.render}) in ${where(l.y)}: ${l.scripts.join(' | ') || 'no script'}`);
}

await run('reading pace (wheel 100 px / 90 ms)', 100, 90);
await run('hurried (wheel 100 px / 22 ms)', 100, 22);
await ctx.close();
await browser?.close();
