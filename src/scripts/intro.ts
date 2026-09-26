// Moon-gate intro films: language tabs, silent autoplay, optional sound, captions, replay.
// Which films exist is decided at build time (data-files), so missing ones are never fetched;
// the painted view simply stays.
type Lang = 'en' | 'fr' | 'ar';
type Files = Record<Lang, { mp4: boolean; webm: boolean; vtt: boolean; poster: boolean }>;

export function initIntro(root: HTMLElement) {
  const base = root.dataset.base!;
  const files: Files = JSON.parse(root.dataset.files || '{}');
  const video = root.querySelector<HTMLVideoElement>('[data-intro-video]')!;
  const placeholders = [...root.querySelectorAll<HTMLElement>('[data-intro-placeholder]')];
  const controls = root.querySelector<HTMLElement>('[data-intro-controls]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-intro-tab]')];
  const soundBtn = root.querySelector<HTMLButtonElement>('[data-intro-sound]')!;
  const ccBtn = root.querySelector<HTMLButtonElement>('[data-intro-cc]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showView = () => {
    video.pause();
    video.hidden = true;
    controls.hidden = true;
    placeholders.forEach((el) => (el.hidden = false));
  };

  const load = (lang: Lang) => {
    tabs.forEach((t) => {
      const on = t.dataset.introTab === lang;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    video.pause();
    video.innerHTML = '';
    const f = files[lang];
    if (!f?.mp4 && !f?.webm) return showView();

    const src = (ext: string) => `${base}/intro-${lang}.${ext}`;
    if (f.webm) video.append(Object.assign(document.createElement('source'), { src: src('webm'), type: 'video/webm' }));
    if (f.mp4) video.append(Object.assign(document.createElement('source'), { src: src('mp4'), type: 'video/mp4' }));
    if (f.vtt) video.append(Object.assign(document.createElement('track'), { kind: 'captions', srclang: lang, label: lang.toUpperCase(), src: src('vtt') }));
    ccBtn.hidden = !f.vtt;
    if (f.poster) video.poster = `${base}/intro-${lang}-poster.webp`;
    else video.removeAttribute('poster');
    video.preload = 'metadata';
    video.load();
    placeholders.forEach((el) => (el.hidden = true));
    controls.hidden = false;
    video.hidden = false;
    if (!reduced && !document.documentElement.classList.contains('motion-off')) video.play().catch(() => {});
  };

  soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    soundBtn.textContent = video.muted ? soundBtn.dataset.on! : soundBtn.dataset.off!;
    if (!video.muted) { video.currentTime = 0; video.play(); }
  });
  ccBtn.addEventListener('click', () => {
    const t = video.textTracks[0];
    if (!t) return;
    const on = t.mode !== 'showing';
    t.mode = on ? 'showing' : 'hidden';
    ccBtn.setAttribute('aria-pressed', String(on));
  });
  root.querySelector('[data-intro-replay]')!.addEventListener('click', () => { video.currentTime = 0; video.play(); });

  // Arrow keys move between tabs, mirrored in RTL.
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => load(t.dataset.introTab as Lang));
    t.addEventListener('keydown', (e) => {
      const rtl = document.dir === 'rtl';
      const step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  load((root.dataset.lang as Lang) || 'en');
}
