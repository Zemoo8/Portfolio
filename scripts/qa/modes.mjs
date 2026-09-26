// Screenshots with reduced motion and with JavaScript disabled.
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [name, opts] of [['reduced', { reducedMotion: 'reduce' }], ['nojs', { javaScriptEnabled: false }]]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321/en/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `assets-generated/qc/site/mode-${name}.jpg`, fullPage: true, type: 'jpeg', quality: 50 });
  const hidden = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p')].filter((e) => getComputedStyle(e).opacity === '0').length);
  console.log(name, 'invisible text blocks:', hidden);
  await ctx.close();
}
await b.close();
