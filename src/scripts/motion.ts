// Motion layer. Content is fully visible without JS; this only choreographs its arrival.
//  - [data-reveal]      fades/rises once when entering the viewport (stagger via --i)
//  - [data-lines]       splits a heading's lines into masks that slide up
//  - [data-parallax=n]  drifts by n% of its height while crossing the viewport
//  - Lenis smooth scrolling on fine pointers only
import Lenis from 'lenis';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/** Wrap each rendered line of a heading so it can be revealed from a mask. */
function splitLines(el: HTMLElement) {
  if (el.dataset.split) return;
  const text = el.textContent ?? '';
  const words = text.trim().split(/\s+/);
  el.textContent = '';
  const spans = words.map((w, i) => {
    const s = document.createElement('span');
    s.textContent = w + (i < words.length - 1 ? ' ' : '');
    s.style.display = 'inline';
    el.appendChild(s);
    return s;
  });
  // group by offsetTop
  const lines: string[][] = [];
  let top = -1;
  spans.forEach((s) => {
    if (Math.abs(s.offsetTop - top) > 4) { lines.push([]); top = s.offsetTop; }
    lines.at(-1)!.push(s.textContent!);
  });
  el.textContent = '';
  lines.forEach((l, i) => {
    const mask = document.createElement('span');
    mask.className = 'line-mask';
    mask.style.setProperty('--i', String(i));
    const inner = document.createElement('span');
    inner.textContent = l.join('');
    mask.appendChild(inner);
    el.appendChild(mask);
  });
  el.setAttribute('aria-label', text.trim());
  el.dataset.split = '1';
}

export function initMotion() {
  // Elements that animate as soon as the page is ready (hero name).
  document.fonts.ready.then(() =>
    requestAnimationFrame(() => document.querySelectorAll('[data-onload]').forEach((el) => el.classList.add('is-in'))),
  );

  // Line masks. Splitting is word-level, so Arabic letter-joining is never broken.
  const lineEls = [...document.querySelectorAll<HTMLElement>('[data-lines]')];
  if (!reduced) {
    document.fonts.ready.then(() => lineEls.forEach(splitLines));
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
  );
  document.querySelectorAll('[data-reveal], [data-lines]').forEach((el) => io.observe(el));

  if (reduced) return;

  // Parallax
  const para = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  const tick = () => {
    const vh = innerHeight;
    for (const el of para) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 around centre
      el.style.transform = `translate3d(0, ${(-p * Number(el.dataset.parallax || 8)).toFixed(2)}%, 0)`;
    }
  };

  let lenis: Lenis | null = null;
  if (finePointer) {
    lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    // Anchor links go through Lenis for consistent easing.
    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a || a.origin !== location.origin || a.pathname !== location.pathname) return;
      const id = decodeURIComponent(a.hash.slice(1));
      const target = id === 'main' ? document.body : document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis!.scrollTo(target, { offset: id === 'main' ? 0 : -24 });
      history.pushState(null, '', a.hash);
      if (id !== 'main') target.setAttribute('tabindex', '-1'), target.focus({ preventScroll: true });
    });
  }
  const raf = (t: number) => {
    lenis?.raf(t);
    tick();
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
