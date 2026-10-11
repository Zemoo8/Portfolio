// The finale: sky lanterns over the night at the road's end. While that picture is on the screen
// one lantern after another is lit at the pavilion and climbs past the moon; once the night fills
// the screen a whole flight goes up at once, from all along its foot. The
// pointer is a breath of wind among them, and a click or a tap anywhere in the night lets a few
// more go from that spot.
// Drawn in a worker (lanterns.worker.ts) on a canvas laid over the picture, under the words.
// Never with reduced motion or the motion switch off; browsers that cannot draw in a worker keep
// the still night.
import { motionAllowed } from './scroll';

export function initLanterns(night: HTMLElement) {
  const canvas = night.querySelector<HTMLCanvasElement>('[data-lanterns]');
  const hall = night.querySelector('.dusk__hall');
  const words = night.querySelector('.dusk__words');
  const end = night.querySelector('[data-lanterns-end]');
  if (!canvas || !hall || !words || !end || !('transferControlToOffscreen' in canvas) || !('Worker' in window)) return;
  // motion switched off: nothing is set up until it is switched on again
  if (!motionAllowed()) { document.addEventListener('motionchange', () => initLanterns(night), { once: true }); return; }

  let worker: Worker;
  try {
    worker = new Worker(new URL('./lanterns.worker.ts', import.meta.url), { type: 'module' });
  } catch { return; }
  // (soft lights: nothing is gained by drawing them finer than this)
  const scale = () => Math.min(1.5, devicePixelRatio || 1);
  const size = () => ({ w: Math.max(2, Math.round(night.offsetWidth * scale())), h: Math.max(2, Math.round(night.offsetHeight * scale())) });
  const off = canvas.transferControlToOffscreen();
  worker.postMessage({ canvas: off, ...size() }, [off]);

  /** Where things are in the picture, as fractions of it: the pavilion, and the words to be kept readable. */
  const place = () => {
    const box = night.getBoundingClientRect(), h = hall.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of words.querySelectorAll('h2, p, a, button')) for (const r of el.getClientRects()) { x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    worker.postMessage({ size: size() });
    worker.postMessage({ place: {
      emit: [(h.left + h.width / 2 - box.left) / box.width, (h.top + h.height * 0.25 - box.top) / box.height],
      quiet: [(x0 - box.left) / box.width, (y0 - box.top) / box.height, (x1 - box.left) / box.width, (y1 - box.top) / box.height],
    } });
  };
  place();
  canvas.hidden = false;
  night.classList.add('has-lanterns');

  // lit only while the night is on the screen; the flight goes up once each time the night comes to fill it
  let seen = false, flown = false;
  const sync = () => worker.postMessage({ run: seen && motionAllowed() && !document.hidden });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (!seen) flown = false; sync(); }).observe(night);
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || flown || !motionAllowed()) return;
    flown = true;
    worker.postMessage({ flight: matchMedia('(max-width: 760px)').matches ? 36 : 72 });
  }).observe(end);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('motionchange', () => { canvas.hidden = !motionAllowed(); sync(); });
  let resizing = 0;
  addEventListener('resize', () => { clearTimeout(resizing); resizing = window.setTimeout(place, 200); });
  document.fonts?.ready.then(place);

  // the pointer: one report per frame, however many events arrive
  let queued = false, px = 0, py = 0;
  night.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; const b = night.getBoundingClientRect(); worker.postMessage({ wind: [(px - b.left) / b.width, (py - b.top) / b.height] }); });
  }, { passive: true });
  night.addEventListener('pointerleave', () => worker.postMessage({ wind: null }), { passive: true });
  night.addEventListener('click', (e) => {
    if (!motionAllowed() || (e.target as Element).closest('a, button')) return;
    const b = night.getBoundingClientRect();
    worker.postMessage({ burst: [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height] });
  });
}
