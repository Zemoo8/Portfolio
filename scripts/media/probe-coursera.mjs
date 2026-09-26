// Captures the IBM/Coursera course certificate from its public verify page.
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('https://coursera.org/verify/ADF9Q0AUA1KT', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2000);
const img = p.locator('img[alt^="View certificate for Ahmed Baghouli"]').first();
await img.scrollIntoViewIfNeeded();
await img.screenshot({ path: 'assets-source/certificates/ibm-prompt-engineering.png' });
await b.close();
console.log('ok');
