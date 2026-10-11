// The air element: a WebGL smoke vortex (three wispy arms, differential rotation, domain-warped
// fbm) on deep ink. Rendered at reduced resolution — smoke is soft, so it upscales cleanly.
// Its eye sits exactly on the air emblem (the orbit's centre) and it turns at one constant,
// slow pace — it does not follow the pointer or react to scrolling or to the orbit. Drawn at
// 30 fps (smoke is slow) and paused when off-screen, in a hidden tab, with reduced motion
// (single frame) or with motion switched off.
// Where the browser can, all of it runs in a worker (vortex.worker.ts): creating a WebGL context
// alone held the page's thread for 40–170 ms. The page keeps only the measuring.
import { motionAllowed } from './scroll';
import { createVortex, type Frame, type Vortex } from './vortex-core';

/** The same four calls, whether the vortex lives here or in the worker. */
async function connect(canvas: HTMLCanvasElement): Promise<Vortex | null> {
  if ('transferControlToOffscreen' in canvas && 'Worker' in window) {
    try {
      const worker = new Worker(new URL('./vortex.worker.ts', import.meta.url), { type: 'module' });
      const off = canvas.transferControlToOffscreen();
      const ok = await new Promise<boolean>((done) => {
        worker.onmessage = (e) => done(e.data === 'ready');
        worker.onerror = () => done(false);
        worker.postMessage({ canvas: off }, [off]);
      });
      if (!ok) { worker.terminate(); return null; } // the canvas is spent: the CSS ink ground remains
      const say = (run: 'start' | 'stop' | 'still') => worker.postMessage({ run });
      return { size: (size: Frame) => worker.postMessage({ size }), start: () => say('start'), stop: () => say('stop'), still: () => say('still') };
    } catch { /* no module workers: draw here instead, if the canvas is still ours */ }
  }
  try {
    return await createVortex(canvas, (f) => requestAnimationFrame(f), (id) => cancelAnimationFrame(id));
  } catch { return null; }
}

export async function mountVortex(canvas: HTMLCanvasElement, anchor?: HTMLElement | null) {
  // measured before the canvas is handed over, and again whenever the layout changes
  // render scale: soft smoke tolerates half resolution; smaller on small screens
  const scale = () => Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 800 ? 0.45 : 0.55);
  const measure = (): Frame => {
    const k = scale();
    const w = Math.max(2, Math.round(canvas.clientWidth * k));
    const h = Math.max(2, Math.round(canvas.clientHeight * k));
    // the eye of the vortex = the centre of the anchor (the emblem), in GL pixels (y up)
    const cr = canvas.getBoundingClientRect();
    const ar = anchor?.getBoundingClientRect();
    const cx = ar ? ar.left + ar.width / 2 - cr.left : cr.width / 2;
    const cy = ar ? ar.top + ar.height / 2 - cr.top : cr.height / 2;
    return { w, h, cx: cx * (w / Math.max(1, cr.width)), cy: (cr.height - cy) * (h / Math.max(1, cr.height)) };
  };

  const vortex = await connect(canvas);
  if (!vortex) return null;
  const resize = () => vortex.size(measure());
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  if (anchor) ro.observe(anchor);
  resize();

  let visible = false;
  const sync = () => {
    if (!visible || document.hidden) vortex.stop();
    else if (motionAllowed()) vortex.start();
    else vortex.still();
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('motionchange', sync);
  canvas.classList.add('is-ready');
  return { stop: () => vortex.stop() };
}
