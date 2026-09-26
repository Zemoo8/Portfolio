// Intro film controller: language tabs, runtime detection of the film files,
// silent autoplay, optional sound, captions and replay. Falls back to the iris.
type Lang = 'en' | 'fr' | 'ar';

export function initIntro(root: HTMLElement) {
  const base = root.dataset.base!;
  const files: Record<Lang, { mp4: boolean; webm: boolean; vtt: boolean; poster: boolean }> = JSON.parse(root.dataset.files || '{}');
  const video = root.querySelector<HTMLVideoElement>('[data-intro-video]')!;
  const placeholder = root.querySelector<HTMLElement>('[data-intro-placeholder]')!;
  const controls = root.querySelector<HTMLElement>('[data-intro-controls]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-intro-tab]')];
  const canvas = root.querySelector<HTMLCanvasElement>('[data-iris]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let iris: { destroy(): void } | null = null;
  const startIris = async () => {
    if (iris) return;
    const hasWebGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
    if (!hasWebGL) return;
    const { mountIris } = await import('./iris');
    iris = mountIris(canvas, { still: reduced });
    if (iris) root.classList.add('has-webgl');
  };

  const showPlaceholder = () => {
    video.hidden = true;
    controls.hidden = true;
    placeholder.hidden = false;
    canvas.hidden = false;
    startIris();
  };

  const showFilm = () => {
    placeholder.hidden = true;
    controls.hidden = false;
    video.hidden = false;
    iris?.destroy();
    iris = null;
    canvas.hidden = true;
    if (!reduced) video.play().catch(() => {});
  };

  const load = (lang: Lang) => {
    tabs.forEach((t) => { const on = t.dataset.introTab === lang; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    video.pause();
    video.innerHTML = '';
    const f = files[lang];
    if (!f?.mp4 && !f?.webm) return showPlaceholder();

    const src = (ext: string) => `${base}/intro-${lang}.${ext}`;
    if (f.webm) video.append(Object.assign(document.createElement('source'), { src: src('webm'), type: 'video/webm' }));
    if (f.mp4) video.append(Object.assign(document.createElement('source'), { src: src('mp4'), type: 'video/mp4' }));
    if (f.vtt) video.append(Object.assign(document.createElement('track'), { kind: 'captions', srclang: lang, label: lang.toUpperCase(), src: src('vtt') }));
    ccBtn.hidden = !f.vtt;
    if (f.poster) video.poster = `${base}/intro-${lang}-poster.webp`;
    else video.removeAttribute('poster');
    video.preload = 'metadata';
    video.load();
    showFilm();
  };

  // Controls
  const soundBtn = root.querySelector<HTMLButtonElement>('[data-intro-sound]')!;
  soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    soundBtn.textContent = video.muted ? soundBtn.dataset.on! : soundBtn.dataset.off!;
    if (!video.muted) { video.currentTime = 0; video.play(); }
  });
  const ccBtn = root.querySelector<HTMLButtonElement>('[data-intro-cc]')!;
  ccBtn.addEventListener('click', () => {
    const t = video.textTracks[0];
    if (!t) return;
    const on = t.mode !== 'showing';
    t.mode = on ? 'showing' : 'hidden';
    ccBtn.setAttribute('aria-pressed', String(on));
  });
  root.querySelector('[data-intro-replay]')!.addEventListener('click', () => { video.currentTime = 0; video.play(); });

  // Keyboard: arrow keys move between tabs (mirrored in RTL).
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

  showPlaceholder();
  load((root.dataset.lang as Lang) || 'en');
}
