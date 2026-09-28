import { capture } from './capture.mjs';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const WORK = path.join(ROOT, 'assets-generated/showcase');
const OUTPUT = path.join(ROOT, 'public/media/portfolio-showcase.mp4');
const URL = process.env.SHOWCASE_URL || 'http://127.0.0.1:4321/en/';
const WIDTH = 1600;
const HEIGHT = 900;

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (result.status !== 0) throw new Error(`${cmd} failed: ${result.stderr?.slice(-2000)}`);
  return result.stdout.trim();
};

const setChapter = (title, detail) => `(() => {
  const panel = document.querySelector('[data-showcase-panel]');
  if (!panel) return;
  panel.querySelector('[data-showcase-title]').textContent = ${JSON.stringify(title)};
  panel.querySelector('[data-showcase-detail]').textContent = ${JSON.stringify(detail)};
})()`;

const before = `(() => {
  const style = document.createElement('style');
  style.textContent = [
    '[data-showcase-panel]{position:fixed;left:48px;bottom:42px;z-index:2147483646;max-width:590px;padding:16px 22px 18px;border-left:3px solid #e0741f;background:rgba(31,29,26,.88);color:#eef0ec;box-shadow:0 16px 45px rgba(0,0,0,.18);font-family:system-ui,sans-serif;pointer-events:none}',
    '[data-showcase-title]{margin:0 0 4px;font:600 26px Georgia,serif;letter-spacing:.01em}',
    '[data-showcase-detail]{margin:0;color:#d8dedb;font-size:15px;line-height:1.4}',
    '[data-showcase-kicker]{display:block;margin-bottom:7px;color:#efab3c;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}',
    '@media(max-width:700px){[data-showcase-panel]{left:20px;right:20px;bottom:20px;padding:12px 16px}[data-showcase-title]{font-size:20px}[data-showcase-detail]{font-size:12px}}',
  ].join('');
  document.head.append(style);
  const panel = document.createElement('aside');
  panel.dataset.showcasePanel = '';
  panel.innerHTML = '<span data-showcase-kicker>Portfolio walkthrough</span><p data-showcase-title>Ahmed Baghouli</p><p data-showcase-detail>AI, creative code and digital products</p>';
  document.body.append(panel);
})()`;

const scenario = {
  name: 'portfolio-showcase',
  file: 'portfolio-showcase-silent',
  url: URL,
  viewport: { width: WIDTH, height: HEIGHT },
  outWidth: WIDTH,
  colorScheme: 'light',
  settle: 2600,
  crf: 20,
  before,
  steps: [
    ['mark'], ['wait', 3200],
    ['click', '[data-gust-open]'], ['wait', 4200],
    ['click', '[data-gust-close]'], ['wait', 1200],
    ['eval', setChapter('Selected work', 'A focused orbit of shipped projects, with a live film on the front card.')],
    ['scroll', '#work', 1800, -70], ['wait', 3300],
    ['click', '[data-orbit-next]'], ['wait', 2200],
    ['eval', setChapter('About the maker', 'A human point of view behind the systems, interfaces and experiments.')],
    ['scroll', '#about', 1600, -40], ['wait', 2600],
    ['eval', setChapter('Path and practice', 'Experience, education and the habits that make ambitious work dependable.')],
    ['scroll', '#path', 1500, -40], ['wait', 2300],
    ['eval', setChapter('Credentials', 'Evidence of continued learning across AI, software and product craft.')],
    ['scroll', '#credentials', 1500, -40], ['wait', 2600],
    ['eval', setChapter('Capabilities', 'Tools are grouped by the outcomes they were used to build.')],
    ['scroll', '#capabilities', 1500, -40], ['wait', 2300],
    ['eval', setChapter('More on GitHub', 'Smaller builds and supporting repositories, all close to the work.')],
    ['scroll', '#more', 1500, -40], ['wait', 2200],
    ['eval', setChapter('Let’s build something that matters', 'Open to AI master’s programmes, internships and freelance work.')],
    ['scroll', '#contact', 1500, -40], ['wait', 3000],
  ],
};

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
const result = await capture(scenario, WORK);
if (result.errors.length) console.warn('Capture warnings:', result.errors);

const silent = path.join(WORK, 'portfolio-showcase-silent.mp4');
const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', silent]));
const audio = path.join(WORK, 'portfolio-showcase-bed.wav');
const fadeOutStart = Math.max(2, duration - 3);
run('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'lavfi', '-i', `sine=frequency=196:sample_rate=48000:duration=${duration}`,
  '-f', 'lavfi', '-i', `sine=frequency=293.66:sample_rate=48000:duration=${duration}`,
  '-f', 'lavfi', '-i', `sine=frequency=392:sample_rate=48000:duration=${duration}`,
  '-filter_complex', `[0:a]volume=0.22[a0];[1:a]volume=0.11[a1];[2:a]volume=0.055[a2];[a0][a1][a2]amix=inputs=3:duration=longest,lowpass=f=900,volume=0.22,afade=t=in:st=0:d=2,afade=t=out:st=${fadeOutStart}:d=3[a]`,
  '-map', '[a]', '-c:a', 'pcm_s16le', audio,
]);

run('ffmpeg', [
  '-y', '-loglevel', 'error', '-i', silent, '-i', audio,
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
  '-shortest', '-movflags', '+faststart', OUTPUT,
]);

fs.rmSync(WORK, { recursive: true, force: true });
console.log(`Showcase ready: ${OUTPUT}`);
console.log(`Duration: ${duration.toFixed(1)}s`);