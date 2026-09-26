// Scroll choreography — calm and predictable by design:
//  · everything that follows the scroll is a pure function of scroll POSITION, never of
//    scroll speed, so the same place on the page always looks the same
//  · depth (ink-wash layers sinking), the thickening mist veil, the turning seal and the
//    case-study phone parallax are CSS scroll-driven animations (see Backdrop.astro,
//    Nav.astro, global.css): they run on the compositor, in lock-step with native scrolling
//  · wind is ambient and time-based (slow mist drift), independent of scrolling
// Browsers without scroll-driven animations simply show a still landscape; only the mist veil
// gets a tiny position-based fallback so text lower on the page keeps a calm ground.

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const motionAllowed = () => !reducedQuery.matches && !document.documentElement.classList.contains('motion-off');

export function initScroll() {
  if (CSS.supports('animation-timeline: scroll()')) return;
  const veil = document.querySelector<HTMLElement>('[data-veil]');
  if (!veil) return;
  let queued = false;
  const update = () => {
    queued = false;
    veil.style.opacity = Math.min(0.62, scrollY / (innerHeight * 1.6)).toFixed(3);
  };
  const queue = () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  update();
}
