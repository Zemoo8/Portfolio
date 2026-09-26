// A project takes over the screen. Stepping into a project from the orbit, its card grows until it
// fills the browser; behind it the page moves to that project's world; then the image settles
// into the world's own frame and hands over. What it gives the visitor: one continuous gesture
// from "which project?" to "inside it", instead of a jump cut. Without motion it simply goes there.
import { motionAllowed } from './scroll';

type Box = { left: number; top: number; width: number; height: number };
const EASE = 'cubic-bezier(0.7, 0, 0.2, 1)';
const box = (r: DOMRect | Box): Box => ({ left: r.left, top: r.top, width: r.width, height: r.height });
const px = (b: Box, radius: string) => ({ left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px`, borderRadius: radius });

export function initTakeover() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-takeover]');
    if (!a) return;
    const world = document.getElementById(decodeURIComponent(new URL(a.href).hash.slice(1)));
    if (!world) return;
    e.preventDefault();
    void go(a, world);
  });
}

async function go(a: HTMLAnchorElement, world: HTMLElement) {
  const land = () => {
    history.pushState(null, '', `#${world.id}`);
    world.querySelector<HTMLElement>('h1, h2, h3')?.focus({ preventScroll: true });
  };
  const card = a.matches('[data-orbit-card]') ? a : document.querySelector<HTMLElement>('[data-orbit-card][data-active]');
  const media = card?.querySelector<HTMLElement>('.orbit__media');
  const img = media?.querySelector<HTMLImageElement>('img');
  if (!motionAllowed() || !media || !img) {
    world.scrollIntoView({ behavior: 'auto' });
    return land();
  }

  const overlay = document.createElement('div');
  overlay.className = 'takeover';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  const from = box(media.getBoundingClientRect());
  Object.assign(overlay.style, px(from, '7px'));
  document.body.append(overlay);

  // 1 — the card fills the browser
  const full: Box = { left: 0, top: 0, width: innerWidth, height: innerHeight };
  await overlay.animate([px(from, '7px'), px(full, '0px')], { duration: 700, easing: EASE, fill: 'forwards' }).finished;

  // 2 — behind it, the page arrives in the project's world
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  scrollTo(0, world.getBoundingClientRect().top + scrollY);
  html.style.scrollBehavior = prev;
  land();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // 3 — the image settles into the world's own frame and hands over
  const target = world.querySelector<HTMLElement>('[data-world-media]');
  const to = target ? box(target.getBoundingClientRect()) : full;
  await overlay.animate(
    [{ ...px(full, '0px'), opacity: 1 }, { ...px(to, '0px'), opacity: 1, offset: 0.8 }, { ...px(to, '0px'), opacity: 0 }],
    { duration: 900, easing: EASE, fill: 'forwards' },
  ).finished;
  overlay.remove();
}
