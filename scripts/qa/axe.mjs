// Accessibility audit (axe-core, WCAG 2.2 A/AA rules) across representative pages.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
const base = process.env.QA_BASE || 'http://localhost:4321';
const routes = ['/en/', '/fr/', '/ar/', '/en/work/cheezy/', '/ar/work/ai-eyes/', '/en/work/aegis-radar/', '/404/'];
const browser = await chromium.launch();
let total = 0;
for (const r of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + r, { waitUntil: 'networkidle' });
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  total += res.violations.length;
  console.log(r, res.violations.length ? '' : 'OK');
  for (const v of res.violations) console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  await ctx.close();
}
await browser.close();
console.log('violations:', total);
