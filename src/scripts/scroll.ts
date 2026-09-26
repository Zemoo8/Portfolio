// Scroll choreography, themed on air — kept restrained so it reads as craft, not gimmick.
//  · depth: ink-wash layers sink at different rates, mist thickens (the camera "climbs")
//  · reading progress turns the seal in the nav (--read)
//  · wind: a few faint ink streaks drift across open sky only while you scroll
//  · storm: the orbit chapter darkens as it arrives (--storm-in) and scroll gusts are
//    published on window.__air so the vortex and orbit can respond
//  · drift: marked tracks slide slightly sideways as they pass ([data-drift])
// Everything is skipped under prefers-reduced-motion or when the visitor turns motion off.

type AirState = { gust: number; velocity: number };
declare global { interface Window { __air?: AirState } }

export const air: AirState = (window.__air ??= { gust: 0, velocity: 0 });

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const motionAllowed = () => !reducedQuery.matches && !document.documentElement.classList.contains('motion-off');

export function initScroll(getVelocity: () => number) {
  const root = document.documentElement;
  const layers = [...document.querySelectorAll<HTMLElement>('[data-world] [data-depth]')];
  const veil = document.querySelector<HTMLElement>('[data-veil]');
  const storm = document.querySelector<HTMLElement>('[data-storm]');
  const drifts = [...document.querySelectorAll<HTMLElement>('[data-drift]')];
  const seals = [...document.querySelectorAll<HTMLElement>('[data-read]')];
  const wind = setupWind();

  // write a style only when its value changes, so idle frames touch nothing
  const written = new WeakMap<HTMLElement, Record<string, string>>();
  const put = (el: HTMLElement, prop: string, value: string) => {
    let rec = written.get(el);
    if (!rec) written.set(el, (rec = {}));
    if (rec[prop] === value) return;
    rec[prop] = value;
    if (prop === 'transform') el.style.transform = value;
    else el.style.setProperty(prop, value);
  };

  let prevY = scrollY;
  let doneY = -1, doneVh = -1, doneMotion: boolean | null = null;
  const invalidate = () => { doneY = -1; };
  addEventListener('resize', invalidate, { passive: true });
  addEventListener('load', invalidate);
  document.fonts?.ready.then(invalidate);
  document.addEventListener('motionchange', invalidate);

  const frame = () => {
    requestAnimationFrame(frame);
    const y = scrollY;
    const vh = innerHeight;
    const v = getVelocity() || (y - prevY);
    prevY = y;
    air.velocity = v;
    air.gust = Math.min(1, air.gust * 0.94 + Math.min(1, Math.abs(v) / 60) * 0.12);
    const moving = motionAllowed();
    wind?.tick(moving ? v : 0);

    // nothing moved since the last layout pass: no reads, no writes
    if (y === doneY && vh === doneVh && moving === doneMotion) return;
    doneY = y; doneVh = vh; doneMotion = moving;

    // read everything first…
    const max = Math.max(1, root.scrollHeight - vh);
    const driftRects = moving ? drifts.map((el) => el.getBoundingClientRect()) : [];
    const sr = storm?.getBoundingClientRect();
    const dir = document.dir === 'rtl' ? -1 : 1;

    // …then write, so the browser lays out once per frame
    const read = (y / max).toFixed(3);
    for (const el of seals) put(el, '--read', read);
    if (moving) {
      for (const el of layers) {
        const depth = Number(el.dataset.depth);
        put(el, 'transform', `translate3d(0, ${Math.min(y * depth, vh * depth * 2.2).toFixed(1)}px, 0)`);
      }
      drifts.forEach((el, i) => {
        const r = driftRects[i];
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh; // −1..1
        put(el, 'transform', `translate3d(${(p * Number(el.dataset.drift || 40) * dir).toFixed(1)}px, 0, 0)`);
      });
    } else {
      for (const el of [...layers, ...drifts]) put(el, 'transform', '');
    }
    if (veil) put(veil, '--veil', Math.min(0.62, y / (vh * 1.6)).toFixed(3));
    if (storm && sr) {
      // 0 when the chapter's top is at the bottom of the viewport, 1 once it fills the view
      const inAmt = Math.min(1, Math.max(0, (vh - sr.top) / (vh * 0.8)));
      const outAmt = Math.min(1, Math.max(0, sr.bottom / (vh * 0.8)));
      put(storm, '--storm-in', Math.min(inAmt, outAmt).toFixed(2));
    }
  };
  requestAnimationFrame(frame);
}

/** Faint ink streaks that only exist while the page is moving. */
function setupWind() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-wind]');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  type Streak = { x: number; y: number; len: number; amp: number; phase: number; speed: number; w: number };
  const streaks: Streak[] = Array.from({ length: 12 }, () => spawn(true));
  function spawn(initial = false): Streak {
    return {
      x: initial ? Math.random() * innerWidth : -300 - Math.random() * 300,
      y: innerHeight * (0.15 + Math.random() * 0.75),
      len: 160 + Math.random() * 260,
      amp: 6 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
      w: 0.8 + Math.random() * 0.9,
    };
  }
  let strength = 0;
  let t = 0;
  return {
    tick(v: number) {
      strength = strength * 0.92 + Math.min(1, Math.abs(v) / 40) * 0.08;
      if (strength < 0.01) {
        if (strength > 0) ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      t += 0.016;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = 'round';
      for (const s of streaks) {
        s.x += (1.5 + strength * 14) * s.speed;
        s.y -= v * 0.02 * s.speed;
        if (s.x - s.len > innerWidth || s.y < -50 || s.y > innerHeight + 50) Object.assign(s, spawn());
        const grad = ctx.createLinearGradient(s.x - s.len, 0, s.x, 0);
        grad.addColorStop(0, 'rgba(31,29,26,0)');
        grad.addColorStop(0.7, `rgba(31,29,26,${(0.16 * strength).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(31,29,26,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.w;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const k = i / 24;
          const x = s.x - s.len + k * s.len;
          const y = s.y + Math.sin(k * Math.PI * 1.6 + s.phase + t * 2) * s.amp * (0.4 + k * 0.6);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    },
  };
}
