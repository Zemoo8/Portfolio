// The orbit: project cards circling the air element on a tilted 3D ring.
// Slow, constant auto-rotation (pausable) — it never reacts to page scrolling, so the ring only
// moves when time passes or the visitor acts: drag with inertia, snap-to-card, keyboard, dots.
// The front card is "active": it plays its film and drives the caption.
import { motionAllowed } from './scroll';

type Film = { mp4: string };

export function initOrbit(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-orbit-stage]')!;
  const cards = [...root.querySelectorAll<HTMLAnchorElement>('[data-orbit-card]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-orbit-dot]')];
  const caption = root.querySelector<HTMLElement>('[data-orbit-caption]')!;
  const live = root.querySelector<HTMLElement>('[data-orbit-live]')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-orbit-pause]')!;
  const N = cards.length;
  const STEP = (Math.PI * 2) / N;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let base = 0;
  let vel = 0;
  let target: number | null = null;
  let hover = false;
  let userPaused = false;
  let dragging = false;
  let active = -1;
  let Rx = 400, Rz = 240, Ry = 40;
  let visible = true;
  let resized = true;

  const measure = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    Rx = Math.min(w * (w < 700 ? 0.3 : 0.37), 620);
    Rz = Rx * (w < 700 ? 0.9 : 0.62);
    Ry = Math.min(h * 0.24, 190);
    resized = true;
  };
  new ResizeObserver(measure).observe(stage);
  measure();

  const norm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  /** Rotation that brings card i to the front, nearest to the current angle. */
  const baseFor = (i: number) => base + norm(-i * STEP - base);

  const select = (i: number, announce = true) => {
    target = baseFor(((i % N) + N) % N);
    vel = 0;
    if (announce) live.setAttribute('aria-live', 'polite');
  };

  const setActive = (i: number) => {
    if (i === active) return;
    const prev = cards[active];
    active = i;
    const c = cards[i];
    // caption
    caption.classList.remove('is-shown');
    requestAnimationFrame(() => {
      for (const key of ['index', 'category', 'year', 'title', 'tagline']) {
        const el = caption.querySelector<HTMLElement>(`[data-cap="${key}"]`);
        if (el) el.textContent = c.dataset[key] ?? '';
      }
      const link = caption.querySelector<HTMLAnchorElement>('[data-cap="link"]')!;
      link.href = c.href;
      link.setAttribute('aria-label', `${link.dataset.label}: ${c.dataset.title}`);
      caption.style.setProperty('--tone', c.dataset.tone || 'var(--saffron)');
      caption.classList.add('is-shown');
    });
    cards.forEach((x, k) => x.toggleAttribute('data-active', k === i));
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    // films: only the active card plays
    if (prev) prev.querySelector('video')?.remove();
    const film: Film | null = c.dataset.orbitFilm ? JSON.parse(c.dataset.orbitFilm) : null;
    if (film && !reduced && motionAllowed()) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, src: film.mp4 });
      v.setAttribute('aria-hidden', 'true');
      v.addEventListener('playing', () => v.classList.add('is-playing'), { once: true });
      v.addEventListener('error', () => v.remove(), { once: true }); // the still stays underneath
      c.querySelector('.orbit__media')!.append(v);
      v.play().catch(() => {});
    }
  };

  // --- pointer drag -----------------------------------------------------------------------
  let startX = 0, lastX = 0, lastT = 0, moved = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = lastX = e.clientX;
    lastT = performance.now();
    target = null;
    vel = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const now = performance.now();
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    if (moved > 6) stage.setPointerCapture?.(e.pointerId);
    base += dx / (Rx * 1.1);
    vel = (dx / (Rx * 1.1)) / Math.max(0.008, (now - lastT) / 1000);
    lastX = e.clientX;
    lastT = now;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    vel = Math.max(-3, Math.min(3, vel));
    // let inertia play, then snap to the nearest card
    setTimeout(() => { if (!dragging) select(nearest(), false); }, 380);
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  const nearest = () => {
    let best = 0, bestC = -2;
    for (let i = 0; i < N; i++) { const c = Math.cos(base + i * STEP); if (c > bestC) { bestC = c; best = i; } }
    return best;
  };

  // --- clicks, keyboard, dots, buttons ---------------------------------------------------
  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (moved > 6) { e.preventDefault(); return; } // it was a drag
      if (i !== active) { e.preventDefault(); select(i); }
    });
    card.addEventListener('focus', () => { if (i !== active) select(i); });
    card.addEventListener('pointerenter', () => { hover = true; });
    card.addEventListener('pointerleave', () => { hover = false; });
  });
  root.addEventListener('keydown', (e) => {
    if (!(e.target as HTMLElement).closest('[data-orbit-card]')) return;
    const rtl = document.dir === 'rtl';
    const step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + N) % N;
    select(next);
    cards[next].focus({ preventScroll: true });
  });
  dots.forEach((d, i) => d.addEventListener('click', () => select(i)));
  root.querySelector('[data-orbit-prev]')!.addEventListener('click', () => select(active - 1));
  root.querySelector('[data-orbit-next]')!.addEventListener('click', () => select(active + 1));
  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
  });
  if (reduced) { userPaused = true; pauseBtn.setAttribute('aria-pressed', 'true'); }

  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(stage);

  // --- frame loop ------------------------------------------------------------------------
  let last = performance.now();
  let drawn = NaN;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const before = base;
    if (visible) {
      if (target !== null) {
        const k = reduced ? 1 : Math.min(1, dt * 5.5);
        base += (target - base) * k;
        if (Math.abs(target - base) < 0.0008) { base = target; target = null; }
      } else if (!dragging) {
        base += vel * dt;
        vel *= Math.pow(0.04, dt); // inertia decays within ~1 s
        const auto = !hover && !userPaused && motionAllowed();
        if (auto) base += dt * ((Math.PI * 2) / 95); // one calm revolution every 95 s
      }
      window.__orbitSpin = Math.min(1, Math.abs(base - before) / Math.max(dt, 0.001) / 3);
      // a paused ring needs no style writes
      if (base !== drawn || resized) {
        drawn = base;
        resized = false;
        for (let i = 0; i < N; i++) {
          const th = base + i * STEP;
          const s = Math.sin(th);
          const c = Math.cos(th);
          const f = (c + 1) / 2; // 0 back → 1 front
          const el = cards[i];
          el.style.transform = `translate(-50%, -50%) translate3d(${(s * Rx).toFixed(1)}px, ${(c * Ry - Ry * 0.32).toFixed(1)}px, ${(c * Rz).toFixed(1)}px) scale(${(0.7 + 0.3 * f).toFixed(3)})`;
          el.style.setProperty('--f', f.toFixed(3));
          el.style.zIndex = String(Math.round(f * 100));
        }
      }
      const n = nearest();
      if (n !== active) setActive(n);
    }
    requestAnimationFrame(frame);
  };
  setActive(0);
  requestAnimationFrame(frame);

  // announce only user-initiated changes
  live.addEventListener('animationend', () => live.setAttribute('aria-live', 'off'));
}
