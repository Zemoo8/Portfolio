// Intro films: the moon gate opens them in a gust of wind (gust.ts) onto a stage where the film
// of the chosen language plays, with sound — opening it is the visitor's own choice. Language
// tabs under the gate, optional captions, replay. Which films exist is decided at build time
// (data-files), so missing ones are never fetched; until then the stage says "coming soon".
import { initGust } from './gust';

type Lang = 'en' | 'fr' | 'ar';
type Files = Record<Lang, { mp4: boolean; webm: boolean; vtt: boolean; poster: boolean }>;

export function initIntro(root: HTMLElement) {
  const base = root.dataset.base!;
  const files: Files = JSON.parse(root.dataset.files || '{}');
  const dialog = root.querySelector<HTMLDialogElement>('[data-gust]')!;
  const video = root.querySelector<HTMLVideoElement>('[data-intro-video]')!;
  const placeholders = [...root.querySelectorAll<HTMLElement>('[data-intro-placeholder]')];
  const controls = root.querySelector<HTMLElement>('[data-intro-controls]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-intro-tab]')];
  const soundBtn = root.querySelector<HTMLButtonElement>('[data-intro-sound]')!;
  const ccBtn = root.querySelector<HTMLButtonElement>('[data-intro-cc]')!;
  const ccText = root.querySelector<HTMLElement>('[data-intro-cc-text]')!;
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-intro-pause]')!;
  let hasFilm = false;
  let captionsOn = false;

  // Captions: the track stays 'hidden' so the browser never draws it; we draw the active cue
  // ourselves, two lines at a time, advancing through longer cues in step with the speech.
  const renderCaption = () => {
    const track = video.textTracks[0];
    const cue = captionsOn && track?.activeCues?.[0] as VTTCue | undefined;
    if (!cue) { ccText.hidden = true; return; }
    const lines = cue.text.split('\n').filter(Boolean);
    const groups: string[][] = [];
    for (let i = 0; i < lines.length; i += 2) groups.push(lines.slice(i, i + 2));
    const weights = groups.map((g) => g.join(' ').length);
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const progress = (video.currentTime - cue.startTime) / Math.max(cue.endTime - cue.startTime, 0.01);
    let acc = 0, idx = 0;
    for (; idx < groups.length - 1; idx++) { acc += weights[idx] / total; if (progress < acc) break; }
    ccText.firstElementChild!.textContent = groups[idx].join('\n');
    ccText.hidden = false;
  };
  video.addEventListener('timeupdate', renderCaption);
  video.addEventListener('seeked', renderCaption);

  const syncPause = () => { pauseBtn.textContent = video.paused ? pauseBtn.dataset.resume! : pauseBtn.dataset.pause!; };
  video.addEventListener('play', syncPause);
  video.addEventListener('pause', syncPause);
  const togglePause = () => { if (video.paused) video.play().catch(() => {}); else video.pause(); };
  pauseBtn.addEventListener('click', togglePause);
  video.addEventListener('click', togglePause);

  const showSoon = () => {
    hasFilm = false;
    video.pause();
    video.hidden = true;
    controls.hidden = true;
    placeholders.forEach((el) => (el.hidden = false));
  };

  const setSound = (on: boolean) => {
    video.muted = !on;
    soundBtn.textContent = on ? soundBtn.dataset.off! : soundBtn.dataset.on!;
  };
  const play = () => {
    if (!hasFilm || !dialog.open) return;
    setSound(true);
    video.play().catch(() => { setSound(false); video.play().catch(() => {}); });
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
    if (!f?.mp4 && !f?.webm) return showSoon();

    const src = (ext: string) => `${base}/intro-${lang}.${ext}`;
    if (f.webm) video.append(Object.assign(document.createElement('source'), { src: src('webm'), type: 'video/webm' }));
    if (f.mp4) video.append(Object.assign(document.createElement('source'), { src: src('mp4'), type: 'video/mp4' }));
    if (f.vtt) {
      const track = Object.assign(document.createElement('track'), { kind: 'captions', srclang: lang, label: lang.toUpperCase(), src: src('vtt') });
      video.append(track);
      track.track.mode = 'hidden';
      track.track.addEventListener('cuechange', renderCaption);
    }
    ccBtn.hidden = !f.vtt;
    ccText.lang = lang;
    ccText.dir = lang === 'ar' ? 'rtl' : 'ltr';
    ccText.hidden = true;
    if (f.poster) video.poster = `${base}/intro-${lang}-poster.webp`;
    else video.removeAttribute('poster');
    video.preload = 'metadata';
    video.load();
    hasFilm = true;
    placeholders.forEach((el) => (el.hidden = true));
    controls.hidden = false;
    video.hidden = false;
    play();
  };

  soundBtn.addEventListener('click', () => {
    setSound(video.muted);
    if (!video.muted) { video.currentTime = 0; video.play(); }
  });
  ccBtn.addEventListener('click', () => {
    captionsOn = !captionsOn;
    ccBtn.setAttribute('aria-pressed', String(captionsOn));
    renderCaption();
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

  initGust({
    trigger: root.querySelector<HTMLElement>('[data-gust-open]')!,
    dialog,
    canvas: root.querySelector<HTMLCanvasElement>('[data-gust-air]')!,
    onOpened: () => {
      play();
      root.classList.add('is-seen');
      try { localStorage.setItem('intro-seen', '1'); } catch {}
    },
    onClosing: () => video.pause(),
  });

  try { if (localStorage.getItem('intro-seen')) root.classList.add('is-seen'); } catch {}
  load((root.dataset.lang as Lang) || 'en');
}
