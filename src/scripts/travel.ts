// The "o" of the name is a photograph; as the page scrolls it lifts out of the word, grows, and
// lands exactly on the introduction circle, where the films play. It is driven by scroll
// POSITION (scroll back up and it returns to the word), not by time or speed. The portrait
// fades as it arrives, so what lands is the painting the intro circle shows.
// Without motion (reduced motion or the motion switch), nothing travels: the o stays a letter.
import { motionAllowed } from './scroll';

type Box = { x: number; y: number; w: number; h: number };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function initTravel() {
  const o = document.querySelector<HTMLElement>('[data-o]');
  const gate = document.querySelector<HTMLElement>('[data-intro-window]');
  const intro = document.getElementById('intro');
  if (!o || !gate || !intro) return;
  const root = document.documentElement;

  o.addEventListener('click', () => intro.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'center' }));

  // the traveller: a copy of the o (painting disc + portrait standing in it)
  const t = document.createElement('div');
  t.className = 'traveller';
  t.setAttribute('aria-hidden', 'true');
  for (const part of o.querySelectorAll<HTMLElement>('.hero__disc, .hero__pop')) t.append(part.cloneNode(true));
  document.body.append(t);
  const portrait = t.querySelector<HTMLElement>('.hero__pop');

  let from: Box = { x: 0, y: 0, w: 0, h: 0 };
  let to: Box = { x: 0, y: 0, w: 0, h: 0 };
  let end = 1;
  const measure = () => {
    const a = o.getBoundingClientRect();
    const b = gate.getBoundingClientRect();
    // document coordinates, with the o measured at rest (not mid-hover)
    from = { x: a.left, y: a.top + scrollY, w: a.width, h: a.height };
    to = { x: b.left, y: b.top + scrollY, w: b.width, h: b.height };
    end = Math.max(1, to.y + to.h / 2 - innerHeight / 2); // the scroll at which the circle is centred
    update();
  };

  let state = '';
  const set = (s: string) => {
    if (s === state) return;
    state = s;
    root.classList.toggle('o-travelling', s === 'moving');
    t.style.visibility = s === 'moving' ? 'visible' : 'hidden';
  };
  const update = () => {
    if (!motionAllowed()) return set('off');
    const p = Math.min(1, Math.max(0, scrollY / end));
    if (p <= 0.002 || p >= 0.998) return set('rest');
    set('moving');
    const k = ease(p);
    const x = from.x + (to.x - from.x) * k;
    const y = from.y + (to.y - from.y) * k - scrollY;
    const w = from.w + (to.w - from.w) * k;
    t.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    t.style.width = t.style.height = `${w.toFixed(1)}px`;
    // the portrait stays while it flies and gives way to the painting only as it lands
    const fade = Math.min(1, Math.max(0, (k - 0.55) / 0.4));
    if (portrait) portrait.style.opacity = (1 - fade * fade * (3 - 2 * fade)).toFixed(3);
  };

  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  document.addEventListener('motionchange', measure);
  measure();
  setTimeout(measure, 1600); // after the name has risen into place
}
