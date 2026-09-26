// "Iris" — the hero's WebGL layer. ~11k points laid out as iris fibres around a pupil;
// a radar-like sweep brightens fibres as it passes and the eye turns toward the pointer.
// A nod to the portfolio's subject matter (AI Eyes perceives, AEGIS tracks).
// Loaded lazily; paused off-screen; one static frame for reduced motion.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

const vertex = /* glsl */ `
  attribute float aRadius;
  attribute float aAngle;
  attribute float aSeed;
  uniform float uTime;
  uniform float uSweep;
  uniform float uPixel;
  varying float vGlow;
  varying float vEdge;
  varying float vSeed;

  void main() {
    float r = aRadius;
    // inner fibres drift slightly faster than outer ones
    float a = aAngle + uTime * (0.018 + 0.03 * (1.0 - r));
    float breathe = 1.0 + 0.012 * sin(uTime * 0.6 + aSeed * 6.28);
    vec3 p = vec3(cos(a) * r, sin(a) * r, 0.0) * breathe;
    p.z = 0.05 * sin(a * 7.0 + uTime * 0.5) * r + (aSeed - 0.5) * 0.04;

    // sweep: distance (in angle) behind the rotating beam
    float d = mod(uSweep - a, 6.28318);
    float beam = exp(-d * 2.2) * smoothstep(0.24, 0.5, r);
    vGlow = beam;
    vEdge = smoothstep(0.93, 1.0, r) + smoothstep(0.34, 0.26, r) * 0.9;
    vSeed = aSeed;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (1.6 + aSeed * 1.8 + beam * 3.4) * uPixel;
    gl_PointSize = size * (2.4 / -mv.z);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uSignal;
  uniform float uIntensity;
  varying float vGlow;
  varying float vEdge;
  varying float vSeed;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float disc = smoothstep(0.5, 0.1, length(c));
    vec3 col = mix(uPaper, uSignal, clamp(vGlow * 1.3, 0.0, 1.0));
    float alpha = (0.26 + vSeed * 0.3 + vEdge * 0.4 + vGlow * 0.95) * disc * uIntensity;
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

export function mountIris(canvas: HTMLCanvasElement, opts: { still?: boolean } = {}) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  const dpr = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0, 3.6);

  // Geometry: fibres = angular bands with jitter, denser toward the collarette.
  const RINGS = 56;
  const PER = 200;
  const n = RINGS * PER;
  const radius = new Float32Array(n);
  const angle = new Float32Array(n);
  const seed = new Float32Array(n);
  const pos = new Float32Array(n * 3);
  let rnd = 7;
  const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const ring = Math.floor(i / PER);
    const t = ring / (RINGS - 1);
    const fibre = (i % PER) / PER;
    radius[i] = 0.3 + Math.pow(t, 0.85) * 0.7 + (rand() - 0.5) * 0.012;
    angle[i] = fibre * Math.PI * 2 + Math.sin(fibre * 90 + t * 4) * 0.02 + (rand() - 0.5) * 0.01;
    seed[i] = rand();
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aRadius', new BufferAttribute(radius, 1));
  geo.setAttribute('aAngle', new BufferAttribute(angle, 1));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 1));

  const css = getComputedStyle(document.documentElement);
  const mat = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSweep: { value: 0.6 },
      uPixel: { value: dpr },
      uIntensity: { value: 0 },
      uPaper: { value: new Color(css.getPropertyValue('--paper').trim() || '#ece9e2') },
      uSignal: { value: new Color(css.getPropertyValue('--signal').trim() || '#ff5a26') },
    },
  });
  const eye = new Points(geo, mat);
  eye.frustumCulled = false;
  eye.position.y = 0.08;
  scene.add(eye);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the iris comfortably inside the frame at any aspect ratio
    camera.position.z = (w / h < 1 ? 4.5 / (w / h) : 4.2);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Pointer: the eye turns toward it (eased).
  const target = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  addEventListener('pointermove', onMove, { passive: true });

  let running = false;
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const u = mat.uniforms;
    u.uTime.value += dt;
    u.uSweep.value = (u.uSweep.value + dt * 0.55) % (Math.PI * 2);
    u.uIntensity.value = Math.min(1, u.uIntensity.value + dt * 0.6);
    look.x += (target.x - look.x) * 0.04;
    look.y += (target.y - look.y) * 0.04;
    eye.rotation.y = look.x * 0.32;
    eye.rotation.x = look.y * 0.26;
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  };

  const start = () => { if (running || opts.still) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  if (opts.still) {
    mat.uniforms.uIntensity.value = 1;
    mat.uniforms.uTime.value = 4;
    renderer.render(scene, camera);
  }

  const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
  io.observe(canvas);
  const onVis = () => (document.hidden ? stop() : canvas.getBoundingClientRect().bottom > 0 && start());
  document.addEventListener('visibilitychange', onVis);

  return {
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    },
  };
}
