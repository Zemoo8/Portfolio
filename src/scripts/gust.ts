// The gust: opening the intro film. The air emblem in the moon gate spins up, then a storm of
// wind tears out of the gate — a smoke vortex whose ragged, spiralling edge sweeps outward until
// it fills the screen — and the film's screen is blown in at its centre. Closing runs it back:
// the storm collapses into the gate. WebGL, drawn at reduced resolution; without WebGL, with
// reduced motion or with motion switched off, the stage simply fades in.
import { motionAllowed } from './scroll';

const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const frag = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;
uniform float uR0;
uniform float uFar;
uniform float uOpen;
uniform float uPhase;
uniform float uFade;
uniform float uK;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

void main(){
  vec2 d = gl_FragCoord.xy - uCenter;
  float r = length(d);
  float a = atan(d.y, d.x);
  float t = uTime;
  float rn = r / min(uRes.x, uRes.y) * 2.1;

  // the reach of the storm: from the rim of the gate to beyond the corners of the screen, with an
  // edge torn by the wind into spiral streaks
  // (the far end is well past the corners, so even the deepest tear in the edge clears them)
  float R = mix(uR0, uFar * 1.8, uOpen);
  float sp = a * 1.0 - log(r + 1.0) * 1.6 + t * 1.2;
  float tear = fbm(vec2(cos(sp), sin(sp)) * 1.7 + vec2(t * 0.35, r * 0.004 / uK));
  float edge = R * (1.0 + (tear - 0.5) * (0.45 + 0.35 * uOpen));
  float inside = 1.0 - smoothstep(edge - 34.0 * uK, edge + 6.0 * uK, r);

  // the smoke itself: three arms turning around the eye. The turn so far (uPhase) is summed on
  // the CPU frame by frame, so a change of speed only ever speeds it up or slows it down —
  // multiplying the clock by a changing speed would make the angle leap.
  float spin = uPhase + 1.9 / (rn + 0.38);
  float aa = a + spin;
  vec2 p = vec2(cos(aa), sin(aa)) * rn;
  vec2 q = vec2(fbm(p * 2.1 + t * 0.05), fbm(p * 2.1 - t * 0.04 + 5.2));
  float n = fbm(p * 3.2 + q * 1.9 + vec2(0.0, t * 0.03));
  float arms = pow(0.5 + 0.5 * sin(3.0 * aa + rn * 5.5 - t * 0.55 + n * 4.2), 2.3);
  float body = smoothstep(1.3, 0.2, rn) * smoothstep(0.02, 0.28, rn);
  float smoke = arms * body * (0.3 + 0.95 * n);
  smoke += pow(fbm(p * 7.0 + q * 3.0 - t * 0.08), 3.0) * 1.6 * smoothstep(1.45, 0.3, rn) * (0.4 + arms);
  smoke += 0.14 * n * smoothstep(1.5, 0.0, rn);

  vec3 ink = vec3(0.066, 0.075, 0.074);
  vec3 teal = vec3(0.105, 0.155, 0.163);
  vec3 col = mix(ink, teal, smoothstep(1.7, 0.1, rn));
  col += (noise(gl_FragCoord.xy * 0.9) - 0.5) * 0.03;
  vec3 cloud = vec3(0.92, 0.945, 0.935);
  col = mix(col, cloud, clamp(smoke * 0.9, 0.0, 1.0) * 0.85);

  // wind: bright streaks racing round the front of the storm while it is still growing
  float lines = pow(0.5 + 0.5 * sin(a * 9.0 - log(r + 1.0) * 11.0 + t * 7.0 + tear * 5.0), 14.0);
  float front = smoothstep(edge - 260.0 * uK, edge - 20.0 * uK, r) * (1.0 - uOpen * uOpen);
  col = mix(col, cloud, lines * front * 0.75);
  // and the torn rim itself catches the light
  float rim = smoothstep(edge - 34.0 * uK, edge - 8.0 * uK, r) * inside;
  col = mix(col, cloud, rim * 0.55 * (1.0 - uOpen * 0.7));

  col *= 1.0 - 0.35 * smoothstep(1.0, 2.2, rn);
  float alpha = inside * uFade;
  gl_FragColor = vec4(col * alpha, alpha);
}`;

type GL = WebGLRenderingContext;

async function build(gl: GL): Promise<WebGLProgram | null> {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  const ext = gl.getExtension('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null;
  if (ext) while (!gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) await new Promise((r) => requestAnimationFrame(r));
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

interface Options {
  trigger: HTMLElement; // the gate: where the storm comes from and goes back to
  dialog: HTMLDialogElement;
  canvas: HTMLCanvasElement;
  onOpened?: () => void;
  onClosing?: () => void;
}

export function initGust({ trigger, dialog, canvas, onOpened, onClosing }: Options) {
  let gl: GL | null = null;
  let ready: Promise<boolean> | null = null;
  let u: Record<string, WebGLUniformLocation | null> = {};
  let k = 0.5;

  // compile ahead, as soon as the visitor shows interest in the gate
  const prepare = () =>
    (ready ??= (async () => {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) return false;
      const prog = await build(gl);
      if (!prog) return false;
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uRes', 'uTime', 'uCenter', 'uR0', 'uFar', 'uOpen', 'uPhase', 'uFade', 'uK']) u[n] = gl.getUniformLocation(prog, n);
      return true;
    })());
  trigger.addEventListener('pointerenter', prepare, { once: true });
  trigger.addEventListener('focus', prepare, { once: true });

  // geometry: the gate's centre and radius, in canvas pixels (GL: y up)
  const measure = () => {
    if (!gl) return;
    k = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 800 ? 0.45 : 0.5);
    const w = Math.max(2, Math.round(innerWidth * k));
    const h = Math.max(2, Math.round(innerHeight * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    const g = trigger.getBoundingClientRect();
    const cx = (g.left + g.width / 2) * k;
    const cy = (innerHeight - (g.top + g.height / 2)) * k;
    const far = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
    gl.uniform2f(u.uRes, w, h);
    gl.uniform2f(u.uCenter, cx, cy);
    gl.uniform1f(u.uR0, (g.width / 2) * k);
    gl.uniform1f(u.uFar, far);
    gl.uniform1f(u.uK, k);
  };

  let raf = 0;
  let time = 20;
  let last = 0;
  let open = 0, spin = 0.1, phase = 0, fade = 0;
  let tween: { from: number; to: number; t0: number; dur: number; done?: () => void } | null = null;
  const draw = () => {
    if (!gl) return;
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uOpen, open);
    gl.uniform1f(u.uPhase, phase);
    gl.uniform1f(u.uFade, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    // once open, the storm settles to the storm chapter's calm pace (~30 fps)
    if (!tween && now - last < 32) return;
    last = now;
    time += dt;
    if (tween) {
      const x = clamp01((now - tween.t0) / tween.dur);
      open = tween.from + (tween.to - tween.from) * easeInOut(x);
      if (x >= 1) { const done = tween.done; tween = null; done?.(); }
    }
    // the swirl turns a little faster while the storm is moving and eases back to the storm
    // chapter's calm pace once it has filled the screen — always smoothly
    spin += ((tween ? 0.55 : 0.1) - spin) * Math.min(1, dt * 2.5);
    phase += dt * spin;
    fade += ((dialog.open ? 1 : 0) - fade) * Math.min(1, dt * 10);
    draw();
  };
  const run = (to: number, dur: number, done?: () => void) => {
    tween = { from: open, to, t0: performance.now(), dur, done };
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; };

  let closing = false;
  const animated = () => motionAllowed() && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  const openIt = async () => {
    if (dialog.open) return;
    closing = false;
    trigger.classList.add('is-stirring');
    const ok = animated() && (await prepare());
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    if (!ok) {
      dialog.classList.add('is-still', 'is-in');
      onOpened?.();
      return;
    }
    dialog.classList.remove('is-still');
    measure();
    open = 0; fade = 0; spin = 0.1;
    // a breath of spin in the gate, then the storm tears out and fills the screen
    setTimeout(() => run(1, 1350, () => onOpened?.()), 180);
    setTimeout(() => dialog.classList.add('is-in'), 900);
  };

  const closeIt = () => {
    if (!dialog.open || closing) return;
    closing = true;
    onClosing?.();
    dialog.classList.add('is-out');
    const finish = () => {
      halt();
      dialog.close();
      dialog.classList.remove('is-in', 'is-out', 'is-still');
      trigger.classList.remove('is-stirring');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus({ preventScroll: true });
      closing = false;
    };
    if (dialog.classList.contains('is-still') || !gl) return setTimeout(finish, 200);
    measure();
    // the screen is blown away first, then the storm draws back into the gate
    setTimeout(() => run(0, 800, () => { fade = 0; draw(); finish(); }), 260);
  };

  trigger.addEventListener('click', openIt);
  dialog.querySelectorAll('[data-gust-close]').forEach((b) => b.addEventListener('click', closeIt));
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeIt(); });
  // a click on the storm itself (outside the screen and its controls) also closes
  dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target === canvas) closeIt(); });
  addEventListener('resize', () => { if (dialog.open) { measure(); if (!raf) draw(); } });
  // no drawing in a hidden tab
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) halt();
    else if (dialog.open && gl && !dialog.classList.contains('is-still') && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
}
