// Cinematic capture engine.
// Records a scripted browser session through the Chrome DevTools screencast
// (real frames, real timing, no cursor, no browser chrome), then encodes a
// constant-frame-rate MP4 (H.264) + WebM (VP9) and a poster frame with ffmpeg.
//
// A scenario is plain data:
//   { name, url, viewport: {width,height}, mobile?, dsf?, settle?, steps: [...] }
// Steps:
//   ['wait', ms]                         hold the frame
//   ['scroll', yOrSelector, ms, offset?] eased scroll of the window (or scroller)
//   ['click', selector]                  real click
//   ['hover', selector]
//   ['type', selector, text]
//   ['eval', 'js expression']
//   ['goto', url]                        navigation (recording keeps running)
//   ['shot', filename, {fullPage?}]      still screenshot (not part of the film)
//   ['mark']                             poster frame = this moment
import { chromium, devices } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FPS = 30;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr?.slice(-1500)}`);
  return r;
}

export async function capture(scenario, outDir) {
  const { name, url, viewport = { width: 1920, height: 1080 }, mobile = false, dsf = 1, settle = 2500, steps = [], scroller = null } = scenario;
  const workDir = path.join(outDir, '_frames', name);
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  const browser = await chromium.launch({ args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', ...(scenario.gpu ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader=false'] : [])] });
  const ctxOpts = mobile
    ? { ...devices['iPhone 13'], viewport, deviceScaleFactor: dsf, defaultBrowserType: undefined }
    : { viewport, deviceScaleFactor: dsf };
  delete ctxOpts.defaultBrowserType;
  const context = await browser.newContext({ ...ctxOpts, reducedMotion: 'no-preference', colorScheme: scenario.colorScheme || 'dark', locale: scenario.locale || 'en-US' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => errors.push('goto: ' + e.message));
  if (scenario.before) await page.evaluate(scenario.before).catch((e) => errors.push('before: ' + e.message));
  await page.waitForTimeout(settle);

  // --- screencast -----------------------------------------------------------
  const cdp = await context.newCDPSession(page);
  const frames = [];
  let markTs = null;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(workDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, ts: metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  const W = viewport.width * dsf, H = viewport.height * dsf;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;

  // A tiny invisible repaint keeps the screencast emitting frames during holds.
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:2147483647';
    document.documentElement.appendChild(d);
    let on = false;
    (function tick() { on = !on; d.style.transform = on ? 'translateZ(0)' : 'none'; d.style.background = on ? '#000' : '#010101'; requestAnimationFrame(tick); })();
  });

  const smoothScroll = (target, ms, offset = 0) =>
    page.evaluate(async ({ target, ms, offset, scroller }) => {
      const el = scroller ? document.querySelector(scroller) : null;
      const get = () => (el ? el.scrollTop : window.scrollY);
      const set = (y) => (el ? (el.scrollTop = y) : window.scrollTo(0, y));
      let to = target;
      if (typeof target === 'string') {
        const node = document.querySelector(target);
        if (!node) return;
        to = node.getBoundingClientRect().top + get() + offset;
      }
      const max = (el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - innerHeight);
      to = Math.max(0, Math.min(max, to));
      const from = get();
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const start = performance.now();
      await new Promise((res) => {
        (function step(now) {
          const t = Math.min(1, (now - start) / ms);
          set(from + (to - from) * ease(t));
          t < 1 ? requestAnimationFrame(step) : res();
        })(start);
      });
    }, { target, ms, offset, scroller });

  for (const [op, a, b, c] of steps) {
    try {
      if (op === 'wait') await page.waitForTimeout(a);
      else if (op === 'scroll') await smoothScroll(a, b ?? 1500, c ?? 0);
      else if (op === 'click') await page.click(a, { timeout: 8000 });
      else if (op === 'press') await page.keyboard.press(a, { delay: 60 });
      else if (op === 'hover') await page.hover(a, { timeout: 8000 });
      else if (op === 'type') await page.type(a, b, { delay: 55 });
      else if (op === 'eval') await page.evaluate(a);
      else if (op === 'goto') await page.goto(a, { waitUntil: 'networkidle', timeout: 60000 });
      else if (op === 'mark') markTs = Date.now() / 1000;
      else if (op === 'shot') {
        const file = path.join(outDir, a);
        await page.screenshot({ path: file, fullPage: !!b?.fullPage, type: file.endsWith('.png') ? 'png' : 'jpeg', ...(file.endsWith('.png') ? {} : { quality: 92 }) });
      }
    } catch (e) {
      errors.push(`${op} ${a}: ${e.message.split('\n')[0]}`);
    }
  }
  await page.waitForTimeout(300);
  await cdp.send('Page.stopScreencast');
  await browser.close();

  if (frames.length < 5) throw new Error(`${name}: only ${frames.length} frames captured`);

  // --- encode ---------------------------------------------------------------
  // concat demuxer with the true inter-frame durations, resampled to CFR.
  const list = frames.map((f, i) => {
    const next = frames[i + 1]?.ts ?? f.ts + 1 / FPS;
    return `file '${path.resolve(f.file).replace(/\\/g, '/')}'\nduration ${Math.max(0.001, next - f.ts).toFixed(4)}`;
  });
  list.push(`file '${path.resolve(frames.at(-1).file).replace(/\\/g, '/')}'`);
  const listFile = path.join(workDir, 'list.txt');
  fs.writeFileSync(listFile, list.join('\n'));

  const outW = scenario.outWidth || W;
  const scale = `scale=${outW}:-2:flags=lanczos`;
  const trim = [...(scenario.trimStart ? ['-ss', String(scenario.trimStart)] : []), ...(scenario.duration ? ['-t', String(scenario.duration)] : [])];
  const mp4 = path.join(outDir, `${scenario.file || 'showcase'}.mp4`);
  const webm = path.join(outDir, `${scenario.file || 'showcase'}.webm`);
  const vf = `${scale},fps=${FPS},format=yuv420p`;
  run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, ...trim, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(scenario.crf || 23), '-profile:v', 'high', '-movflags', '+faststart', '-an', mp4]);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String((scenario.crf || 23) + 12), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '3', '-an', webm]);

  // Poster: the 'mark' moment if given, otherwise the first frame.
  const posterAt = scenario.posterAt ?? (markTs ? Math.max(0, markTs - t0 - (scenario.trimStart || 0)) : 0.1);
  const poster = path.join(outDir, `${scenario.file || 'showcase'}-poster.webp`);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', posterAt.toFixed(2), '-i', mp4, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '82', poster]);

  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'default=nw=1', mp4]).stdout.trim().replace(/\n/g, ' ');
  fs.rmSync(workDir, { recursive: true, force: true });
  return { name, frames: frames.length, probe, errors };
}
