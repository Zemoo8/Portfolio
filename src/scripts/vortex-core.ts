// The smoke vortex itself: shader, program and the 30 fps loop — free of the DOM, so the very
// same code draws on the page's own thread or, where the browser allows, inside a worker
// (vortex.worker.ts) on a canvas handed over to it. See vortex.ts for what it looks like and why.

const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const frag = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;

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
  vec2 uv = (gl_FragCoord.xy - uCenter) / min(uRes.x, uRes.y) * 2.1;
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float t = uTime;

  // differential rotation: the core turns faster; gusts add spin
  float spin = t * 0.10 + 1.9 / (r + 0.38);
  float aa = a + spin;

  vec2 p = vec2(cos(aa), sin(aa)) * r;
  vec2 q = vec2(fbm(p * 2.1 + t * 0.05), fbm(p * 2.1 - t * 0.04 + 5.2));
  float n = fbm(p * 3.2 + q * 1.9 + vec2(0.0, t * 0.03));

  // three arms, echoing the triple air spiral
  float arms = 0.5 + 0.5 * sin(3.0 * aa + r * 5.5 - t * 0.55 + n * 4.2);
  arms = pow(arms, 2.3);
  float body = smoothstep(1.2, 0.25, r) * smoothstep(0.03, 0.3, r);
  float smoke = arms * body * (0.3 + 0.95 * n);
  float wisps = pow(fbm(p * 7.0 + q * 3.0 - t * 0.08), 3.0) * 1.6 * smoothstep(1.35, 0.3, r);
  smoke += wisps * (0.4 + arms);
  smoke += 0.14 * n * smoothstep(1.4, 0.0, r);

  vec3 ink = vec3(0.071, 0.067, 0.063);
  vec3 teal = vec3(0.17, 0.145, 0.105);
  vec3 bg = mix(ink, teal, smoothstep(1.6, 0.1, r));
  // canvas-like texture on the dark ground
  float weave = noise(gl_FragCoord.xy * 0.9) * 0.5 + noise(gl_FragCoord.xy * 0.35) * 0.5;
  bg += (weave - 0.5) * 0.035;

  vec3 cloud = vec3(0.95, 0.915, 0.83);
  vec3 col = mix(bg, cloud, clamp(smoke * 0.9, 0.0, 1.0) * 0.88);
  col *= 1.0 - 0.4 * smoothstep(0.9, 1.9, r);
  gl_FragColor = vec4(col, 1.0);
}`;

type Tick = (f: (now: number) => void) => number;

/** Compiles and links without blocking the thread where the browser allows it. */
async function buildProgram(gl: WebGLRenderingContext, tick: Tick): Promise<WebGLProgram | null> {
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
  // KHR_parallel_shader_compile: poll instead of forcing a synchronous compile
  const ext = gl.getExtension('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null;
  if (ext) {
    while (!gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) {
      await new Promise((r) => tick(r));
    }
  }
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
}

/** Where the picture is drawn: its size in pixels and the eye of the vortex (GL pixels, y up). */
export type Frame = { w: number; h: number; cx: number; cy: number };
export type Vortex = { size(f: Frame): void; start(): void; stop(): void; still(): void };

/** The vortex on any WebGL canvas. `tick`/`cancel` are the thread's animation-frame functions. */
export async function createVortex(canvas: HTMLCanvasElement | OffscreenCanvas, tick: Tick, cancel: (id: number) => void): Promise<Vortex | null> {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' }) as WebGLRenderingContext | null;
  if (!gl) return null;
  const prog = await buildProgram(gl, tick);
  if (!prog) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uCenter = gl.getUniformLocation(prog, 'uCenter');

  let t = 12;
  let last = 0;
  let running = false;
  let raf = 0;
  const draw = () => {
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now: number) => {
    if (running) raf = tick(frame);
    if (now - last < 32) return; // ~30 fps
    t += Math.min(0.1, (now - last) / 1000);
    last = now;
    draw();
  };
  const stop = () => { running = false; cancel(raf); };
  return {
    size({ w, h, cx, cy }) {
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uCenter, cx, cy);
      if (!running) draw();
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = tick(frame);
    },
    stop,
    still() { stop(); draw(); },
  };
}
