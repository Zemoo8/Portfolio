// Viewport-aware playback for every [data-film]: load when near, play when visible,
// pause when not. Reduced-motion users get posters and an explicit play button.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initFilms(root: ParentNode = document) {
  const films = [...root.querySelectorAll<HTMLElement>('[data-film]')];
  if (!films.length) return;

  const setState = (el: HTMLElement, playing: boolean) => {
    el.classList.toggle('is-playing', playing);
    const btn = el.querySelector<HTMLButtonElement>('[data-film-toggle]');
    if (btn) btn.setAttribute('aria-label', playing ? btn.dataset.pause! : btn.dataset.play!);
  };

  const play = (el: HTMLElement) => {
    const v = el.querySelector('video')!;
    if (v.preload === 'none') { v.preload = 'auto'; }
    v.play().then(() => setState(el, true)).catch(() => setState(el, false));
  };
  const pause = (el: HTMLElement) => {
    el.querySelector('video')!.pause();
    setState(el, false);
  };

  // Posters are fetched only when a film approaches the viewport.
  const near = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const v = e.target.querySelector('video')!;
        if (v.dataset.poster) v.poster = v.dataset.poster;
        near.unobserve(e.target);
      }
    },
    { rootMargin: '120% 0px' },
  );
  films.forEach((el) => near.observe(el));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (el.dataset.userPaused === '1' || reduced()) continue;
        e.isIntersecting ? play(el) : pause(el);
      }
    },
    { rootMargin: '10% 0px', threshold: 0.25 },
  );

  for (const el of films) {
    io.observe(el);
    el.querySelector('[data-film-toggle]')?.addEventListener('click', () => {
      const v = el.querySelector('video')!;
      if (v.paused) { el.dataset.userPaused = '0'; play(el); }
      else { el.dataset.userPaused = '1'; pause(el); }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) films.forEach((el) => el.querySelector('video')?.pause());
  });
}
