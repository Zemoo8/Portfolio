// Motion layer. Content is fully visible without JS; this only choreographs its arrival.
//  - [data-reveal]        rises once when entering the viewport (stagger via --i)
//  - [data-lines]         heading lines rise out of the mist (word-level, so Arabic never breaks)
//  - [data-reveal-brush]  ink brush strokes paint themselves
//  - .scroll[data-unroll] parchment panels unroll from the top
//  - [data-parallax=n]    drifts by n% of its height while crossing the viewport
//  - Lenis smooth scrolling on fine pointers; its velocity feeds the air (scripts/scroll.ts)
import Lenis from 'lenis';
import { initScroll, motionAllowed } from './scroll';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/**
 * Wrap each rendered line of the given headings in a mask so it can rise into place.
 * Batched: one write pass, one layout read, one write pass — no per-heading reflows.
 */
function splitLines(els: HTMLElement[]) {
  const todo = els.filter((el) => !el.dataset.split);
  // 1) write: every word becomes an inline span
  const words = todo.map((el) => {
    const text = (el.textContent ?? '').trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    return text.split(/\s+/).map((w, i, all) => {
      const s = document.createElement('span');
      s.textContent = w + (i < all.length - 1 ? ' ' : '');
      el.appendChild(s);
      return s;
    });
  });
  // 2) read: a single layout for all headings
  const tops = words.map((spans) => spans.map((s) => s.offsetTop));
  // 3) write: group words into line masks
  todo.forEach((el, k) => {
    const lines: string[][] = [];
    let top = -1;
    words[k].forEach((s, i) => {
      if (Math.abs(tops[k][i] - top) > 4) { lines.push([]); top = tops[k][i]; }
      lines.at(-1)!.push(s.textContent!);
    });
    el.textContent = '';
    lines.forEach((l, i) => {
      const mask = document.createElement('span');
      mask.className = 'line-mask';
      mask.setAttribute('aria-hidden', 'true');
      mask.style.setProperty('--i', String(i));
      const inner = document.createElement('span');
      inner.textContent = l.join('');
      mask.appendChild(inner);
      el.appendChild(mask);
    });
    el.dataset.split = '1';
  });
}

/** Motion switch in the nav: persists, pauses CSS animations and JS loops. */
function initMotionSwitch() {
  const root = document.documentElement;
  const sync = () =>
    document.querySelectorAll('[data-motion-toggle]').forEach((x) => x.setAttribute('aria-pressed', String(!root.classList.contains('motion-off'))));
  sync();
  document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      root.classList.toggle('motion-off');
      try { localStorage.setItem('motion', root.classList.contains('motion-off') ? 'off' : 'on'); } catch {}
      document.dispatchEvent(new CustomEvent('motionchange'));
      sync();
    }),
  );
}

export function initMotion() {
  initMotionSwitch();

  document.fonts.ready.then(() =>
    requestAnimationFrame(() => document.querySelectorAll('[data-onload]').forEach((el) => el.classList.add('is-in'))),
  );

  // Latin headings rise line by line; Arabic headings fade in whole (no re-measuring of
  // connected script, and no forced reflows on long RTL lines).
  if (!reduced && document.documentElement.lang !== 'ar') {
    document.fonts.ready.then(() => requestAnimationFrame(() => splitLines([...document.querySelectorAll<HTMLElement>('[data-lines]')])));
  }

  // Clipped elements (unrolling scrolls) have no visible area, so Chrome never reports them as
  // intersecting — observe their unclipped parent and reveal the child instead.
  const proxy = new Map<Element, Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (proxy.get(e.target) ?? e.target).classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
  );
  document.querySelectorAll('[data-reveal], [data-lines], [data-reveal-brush]').forEach((el) => io.observe(el));
  document.querySelectorAll('[data-unroll]').forEach((el) => {
    const parent = el.parentElement ?? el;
    proxy.set(parent, el);
    io.observe(parent);
  });

  // Parallax (small, rAF-driven)
  const para = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  const tick = () => {
    if (!motionAllowed()) return;
    const vh = innerHeight;
    for (const el of para) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(-p * Number(el.dataset.parallax || 8)).toFixed(2)}%, 0)`;
    }
  };

  let lenis: Lenis | null = null;
  if (finePointer && !reduced) {
    lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
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

  initScroll(() => lenis?.velocity ?? 0);

  const raf = (t: number) => {
    lenis?.raf(t);
    tick();
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
