// The orbit: project cards on a tilted 3D ring around the air element.
// Rhythm, not drift: the ring rests with one project in front, then glides on to the next, so the
// card in front, its film and the caption always agree. It never reacts to page scrolling.
// Visitors can drag it (it settles on the nearest project in one motion), use the arrows, the
// station index or the keyboard; "pause" stops the automatic turning only. The automatic turn
// also waits while the pointer rests on the ring or focus is inside it.
import { motionAllowed } from './scroll';

type Film = { mp4: string };

const DWELL = 6500; // ms a project rests in front
const GLIDE = 1500; // ms to glide to the next one
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

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
  const wrap = (i: number) => ((i % N) + N) % N;
  const norm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  let wake = 0;

  let base = 0; // ring angle; card i is in front when base + i·STEP ≡ 0
  let active = -1; // card resting in front
  let pending = 0; // card the ring is heading to
  let glide: { from: number; to: number; t0: number; dur: number; ease: (t: number) => number; swapped: boolean } | null = null;
  let restUntil = performance.now() + DWELL;
  let userPaused = reduced;
  let hover = false;
  let focusInside = false;
  let dragging = false;
  let visible = true;
  let Rx = 400, Rz = 240, Ry = 40;
  let drop = 0; // extra fall of the front of the ring, so the card in front clears the emblem
  let drawn = NaN;

  // How far a card reaches sideways from the centre, on screen: its ring position plus half its
  // (scaled) width, through the stage's perspective — at the widest point of the ring.
  const reach = (rx: number, rz: number, half: number, persp: number) => {
    let m = 0;
    for (let k = 0; k <= 48; k++) {
      const th = (k / 48) * Math.PI;
      const c = Math.cos(th);
      const x = (rx * Math.sin(th) + half * (0.7 + 0.3 * (c + 1) / 2)) * persp / (persp - rz * c);
      m = Math.max(m, x);
    }
    return m;
  };
  // Room on either side of the emblem that is clear of the chapter scroll hanging at the page
  // edge (Nav), keeping a little air before it; without the scroll the ring may reach the edges.
  const room = () => {
    const rod = document.querySelector<HTMLElement>('.rod');
    if (!rod || !rod.getClientRects().length) return Infinity;
    const r = rod.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const cx = sr.left + sr.width / 2;
    return (r.left > cx ? r.left - cx : cx - r.right) - 28;
  };

  const measure = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const depth = w < 700 ? 0.9 : 0.62;
    const half = cards[0].offsetWidth / 2;
    const persp = parseFloat(getComputedStyle(stage).perspective) || 1800;
    const free = room();
    Rx = Math.min(w * (w < 700 ? 0.3 : 0.37), 620);
    while (Rx > 120 && reach(Rx, Rx * depth, half, persp) > free) Rx -= 6;
    Rz = Rx * depth;
    Ry = Math.min(h * 0.22, 170);
    // The card in front sits low enough that the whole emblem shows above it: its top edge, seen
    // through the perspective (origin 30 % down the stage), lands just under the emblem.
    const core = root.querySelector<HTMLElement>('.orbit__core');
    const H = cards[0].offsetHeight;
    const oy = h * 0.3;
    const k = persp / (persp - Rz);
    const clearLine = h / 2 + (core ? core.offsetHeight * 0.46 : 0) + 14;
    drop = Math.max(0, (clearLine - oy) / k + oy - h / 2 - Ry + H / 2);
    // …and whatever follows the stage moves down by as much as that card now reaches past it
    const reachDown = oy + (h / 2 + Ry + drop + H / 2 - oy) * k;
    const margin = `${Math.max(0, Math.round(reachDown - h + 20))}px`;
    if (stage.style.marginBlockEnd !== margin) stage.style.marginBlockEnd = margin;
    drawn = NaN;
  };
  new ResizeObserver(measure).observe(stage);
  measure();

  /** Ring angle that brings card i to the front, by the shortest way round. */
  const angleFor = (i: number) => base + norm(-i * STEP - base);
  const autoOn = () => !userPaused && !hover && !focusInside && !dragging && motionAllowed();

  // --- what the front card owns: highlight, caption, film -----------------------------------
  const showCaption = (i: number) => {
    const c = cards[i];
    for (const key of ['index', 'category', 'year', 'title', 'tagline']) {
      root.querySelectorAll<HTMLElement>(`[data-cap="${key}"]`).forEach((el) => (el.textContent = c.dataset[key] ?? ''));
    }
    const link = caption.querySelector<HTMLAnchorElement>('[data-cap="link"]')!;
    link.href = c.href;
    link.setAttribute('aria-label', `${link.dataset.label}: ${c.dataset.title}`);
    caption.classList.add('is-shown');
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  };
  const release = () => {
    // the card leaving the front lets go of its film and highlight as the ring starts to move
    const c = cards[active];
    if (!c) return;
    c.removeAttribute('data-active');
    c.querySelector('video')?.remove();
  };
  const arrive = (i: number) => {
    active = i;
    const c = cards[i];
    cards.forEach((x, k) => x.toggleAttribute('data-active', k === i));
    showCaption(i);
    const film: Film | null = c.dataset.orbitFilm ? JSON.parse(c.dataset.orbitFilm) : null;
    if (film && !reduced && motionAllowed() && !c.querySelector('video')) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, src: film.mp4 });
      v.setAttribute('aria-hidden', 'true');
      v.addEventListener('playing', () => v.classList.add('is-playing'), { once: true });
      v.addEventListener('error', () => v.remove(), { once: true }); // the still stays underneath
      c.querySelector('.orbit__media')!.append(v);
      v.play().catch(() => {});
    }
    restUntil = performance.now() + DWELL;
  };

  /** Glide the ring so card i ends up in front. */
  const glideTo = (i: number, dur = GLIDE, ease = easeInOut, announce = false) => {
    i = wrap(i);
    if (announce) live.setAttribute('aria-live', 'polite');
    const to = angleFor(i);
    pending = i;
    if (i === active && Math.abs(to - base) < 1e-4) return;
    release();
    caption.classList.remove('is-shown');
    glide = { from: base, to, t0: performance.now(), dur: reduced ? 0 : dur, ease, swapped: false };
    schedule();
  };

  // --- pointer: drag the ring, then settle on the nearest project in one motion ---------------
  let startX = 0, startBase = 0, lastX = 0, lastT = 0, vel = 0, moved = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    vel = 0;
    startX = lastX = e.clientX;
    lastT = performance.now();
    startBase = base;
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    if (moved <= 6) return;
    if (glide) glide = null;
    if (cards[active]?.hasAttribute('data-active')) { release(); caption.classList.remove('is-shown'); }
    stage.setPointerCapture?.(e.pointerId);
    const now = performance.now();
    base = startBase + (e.clientX - startX) / (Rx * 1.1);
    const v = ((e.clientX - lastX) / (Rx * 1.1)) / Math.max(0.008, (now - lastT) / 1000);
    vel = vel * 0.6 + v * 0.4;
    lastX = e.clientX;
    lastT = now;
    schedule();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (moved <= 6) return; // a click, handled below
    // a flick carries on a little; the nearest project to where it would coast becomes the target
    const coast = base + Math.max(-1.2, Math.min(1.2, vel * 0.22));
    let best = 0, bestC = -2;
    for (let i = 0; i < N; i++) { const c = Math.cos(coast + i * STEP); if (c > bestC) { bestC = c; best = i; } }
    glideTo(best, 750, easeOut, true);
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerenter', () => { hover = true; schedule(); });
  stage.addEventListener('pointerleave', () => { hover = false; restUntil = Math.max(restUntil, performance.now() + 2500); schedule(); });

  // --- clicks, keyboard, stations, buttons ---------------------------------------------------
  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (moved > 6) { e.preventDefault(); return; } // it was a drag
      if (i !== active || glide) { e.preventDefault(); glideTo(i, GLIDE, easeInOut, true); }
    });
    card.addEventListener('focus', () => { if (i !== active && i !== pending) glideTo(i, GLIDE, easeInOut, true); });
  });
  root.addEventListener('focusin', () => { focusInside = true; schedule(); });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget as Node)) { focusInside = false; restUntil = Math.max(restUntil, performance.now() + 2500); schedule(); }
  });
  root.addEventListener('keydown', (e) => {
    if (!(e.target as HTMLElement).closest('[data-orbit-card]')) return;
    const rtl = document.dir === 'rtl';
    const step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (!step) return;
    e.preventDefault();
    const next = wrap((glide ? pending : active) + step);
    glideTo(next, GLIDE, easeInOut, true);
    cards[next].focus({ preventScroll: true });
  });
  const ref = () => (glide ? pending : active);
  dots.forEach((d, i) => d.addEventListener('click', () => glideTo(i, GLIDE, easeInOut, true)));
  root.querySelector('[data-orbit-prev]')!.addEventListener('click', () => glideTo(ref() - 1, GLIDE, easeInOut, true));
  root.querySelector('[data-orbit-next]')!.addEventListener('click', () => glideTo(ref() + 1, GLIDE, easeInOut, true));
  pauseBtn.setAttribute('aria-pressed', String(userPaused));
  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    if (!userPaused) restUntil = performance.now() + 2500;
    schedule();
  });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) restUntil = Math.max(restUntil, performance.now() + DWELL / 2);
    if (visible) schedule();
    else { cancelAnimationFrame(raf); raf = 0; clearTimeout(wake); wake = 0; }
  }).observe(stage);

  // --- drawing ---------------------------------------------------------------------------------
  const draw = () => {
    if (base === drawn) return;
    drawn = base;
    for (let i = 0; i < N; i++) {
      const th = base + i * STEP;
      const s = Math.sin(th);
      const c = Math.cos(th);
      const f = (c + 1) / 2; // 0 back → 1 front
      // the ring's centre is the emblem's centre (the stage centre), so everything turns around it
      // the front half of the ring falls a little further (smoothly, from nothing at the sides)
      const y = c * Ry + (c > 0 ? c * c * drop : 0);
      cards[i].style.transform = `translate(-50%, -50%) translate3d(${(s * Rx).toFixed(1)}px, ${y.toFixed(1)}px, ${(c * Rz).toFixed(1)}px) scale(${(0.7 + 0.3 * f).toFixed(3)})`;
      cards[i].style.setProperty('--f', f.toFixed(3));
    }
  };

  let raf = 0;
  const schedule = () => {
    if (!visible || raf || !motionAllowed()) return;
    if (glide || dragging || (autoOn() && performance.now() >= restUntil)) {
      raf = requestAnimationFrame(frame);
      return;
    }
    if (autoOn()) {
      clearTimeout(wake);
      wake = window.setTimeout(() => { wake = 0; schedule(); }, Math.max(0, restUntil - performance.now()) + 1);
    }
  };
  const frame = (now: number) => {
    raf = 0;
    if (!visible) return;
    if (glide) {
      const p = glide.dur ? Math.min(1, (now - glide.t0) / glide.dur) : 1;
      base = glide.from + (glide.to - glide.from) * glide.ease(p);
      // the new caption fades in as its card approaches the front
      if (!glide.swapped && p >= 0.6) { glide.swapped = true; showCaption(pending); }
      if (p >= 1) { base = glide.to; glide = null; arrive(pending); }
    } else if (autoOn() && now >= restUntil) {
      glideTo(active + 1);
    }
    draw();
    schedule();
  };

  draw();
  arrive(0);
  schedule();

  // announce only visitor-initiated changes
  live.addEventListener('animationend', () => live.setAttribute('aria-live', 'off'));
}
