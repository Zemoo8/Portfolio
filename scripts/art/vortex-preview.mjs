import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const f = 'file:///C:/Users/LENOVO/AppData/Local/Temp/claude/C--Users-LENOVO-Portfolio/5377eebb-a579-4a27-b64c-7d451021a5c6/scratchpad/vortex.html';
await p.goto(f + '#' + (process.argv[2] || '12'));
await p.waitForTimeout(800);
console.log(await p.title());
await p.screenshot({ path: 'assets-generated/qc/vortex.jpg', type: 'jpeg', quality: 80 });
await b.close();
