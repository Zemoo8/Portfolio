// Living ink — the visitor's pointer is the brush. Wherever it moves, ink is laid on the page and
// carried off by the current the movement stirs up; a press lets a drop fall; and when a page
// opens, a little ink lifts off the stroke under its title while that stroke is still wet.
// The fluid itself is simulated and drawn in a worker (ink.worker.ts, ink-core.ts) on a canvas
// that is multiplied onto the page, so the ink darkens whatever lies under it, as ink does. It
// belongs to the paper: it scrolls away with the page and soaks out of sight within seconds.
// Only for a mouse or a pen, and never with reduced motion or the motion switch off. Phones are
// left alone (their graphics have enough to do), as are browsers that cannot draw in a worker.
import { motionAllowed } from './scroll';

const SCALE = 0.6; // the ink is soft: it is drawn at a little over half the page's size

let started = false;

export function initInk() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-ink]');
  if (started || !canvas || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (!('transferControlToOffscreen' in canvas) || !('Worker' in window)) return;
  // motion switched off: nothing is set up until it is switched on again
  if (!motionAllowed()) { document.addEventListener('motionchange', () => initInk(), { once: true }); return; }
  started = true;

  let worker: Worker;
  try {
    worker = new Worker(new URL('./ink.worker.ts', import.meta.url), { type: 'module' });
  } catch { return; }
  const size = () => ({ w: Math.max(2, Math.round(innerWidth * SCALE)), h: Math.max(2, Math.round(innerHeight * SCALE)) });
  const off = canvas.transferControlToOffscreen();
  worker.postMessage({ canvas: off, ...size() }, [off]);

  let ready = false;
  let allowed = motionAllowed();
  const show = () => { if (canvas.hidden) canvas.hidden = false; };
  const active = () => ready && allowed && !document.hidden;

  worker.onerror = () => { ready = false; canvas.hidden = true; };
  worker.onmessage = ({ data }: MessageEvent<'ready' | 'failed' | 'rest'>) => {
    if (data === 'rest') canvas.hidden = true; // nothing left on the paper: no layer to blend
    if (data === 'failed') worker.terminate();
    if (data !== 'ready') return;
    ready = true;
    firstStroke();
  };

  // ---- the pointer: one report per frame, however many events arrive ---------------------------
  let x = 0, y = 0, lastX = 0, lastY = 0, lastT = 0, seen = false, queued = false;
  let scrolled = 0, lastScroll = scrollY;
  const flush = () => {
    queued = false;
    if (!active()) return;
    const now = performance.now();
    if (scrolled) { worker.postMessage({ scroll: scrolled / innerHeight }); scrolled = 0; }
    if (x === lastX && y === lastY) return;
    const dt = Math.min(0.1, (now - lastT) / 1000);
    show();
    worker.postMessage({ move: { x: x / innerWidth, y: 1 - y / innerHeight, dx: (x - lastX) / innerWidth, dy: -(y - lastY) / innerHeight, dt } });
    lastX = x; lastY = y; lastT = now;
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(flush); } };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    x = e.clientX; y = e.clientY;
    // the brush is lowered where the pointer first appears: no stroke flies in from the corner
    if (!seen || performance.now() - lastT > 400) { seen = true; lastX = x; lastY = y; lastT = performance.now(); return; }
    queue();
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0 || !active()) return;
    show();
    worker.postMessage({ splash: { x: e.clientX / innerWidth, y: 1 - e.clientY / innerHeight } });
  }, { passive: true });
  // the ink is on the paper: when the page moves, so does it
  addEventListener('scroll', () => { scrolled += scrollY - lastScroll; lastScroll = scrollY; queue(); }, { passive: true });

  let resizing = 0;
  addEventListener('resize', () => { clearTimeout(resizing); resizing = window.setTimeout(() => worker.postMessage({ size: size() }), 180); });
  const sync = () => {
    allowed = motionAllowed();
    worker.postMessage({ run: allowed && !document.hidden });
    if (!allowed || document.hidden) canvas.hidden = true;
  };
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('motionchange', sync);

  // ---- a page opens: ink lifts off the stroke under its title ----------------------------------
  function firstStroke() {
    const line = document.querySelector<SVGElement>('.hero__stroke, .case__stroke');
    if (!line || scrollY > 40 || !active()) return;
    const r = line.getBoundingClientRect();
    if (r.width < 40 || r.bottom < 0 || r.top > innerHeight) return;
    const rtl = document.dir === 'rtl';
    const from = (rtl ? r.right : r.left) / innerWidth, to = (rtl ? r.left + r.width * 0.2 : r.right - r.width * 0.2) / innerWidth;
    const level = 1 - (r.top + r.height * 0.5) / innerHeight;
    show();
    worker.postMessage({ stroke: { x0: from, y0: level, x1: to, y1: level + 0.004, ms: 1100 } });
  }
}
