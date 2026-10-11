// Living ink: a small fluid simulation (Stam's "stable fluids", solved on the GPU) in which the
// visitor's pointer is the brush. Ink is laid where the pointer passes, is carried by the current
// the movement stirs up, curls, thins and soaks away within a few seconds. Drawn as a wash on
// paper: opacity follows the density of ink, and ink gathers into a darker line at the edge of a
// wash, as it does when a real one dries.
// Free of the DOM: it runs inside a worker (ink.worker.ts) on a canvas handed over by the page.

const VERT = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; out vec4 o;
`;

// velocity is kept in grid cells per second; uTexel is one cell of the velocity grid
const FRAG = {
  // carry a field along the current (and along with the page, when it scrolls: uShift)
  advect: `uniform sampler2D uVel; uniform sampler2D uSrc; uniform vec2 uTexel; uniform vec2 uShift; uniform vec2 uVelShift; uniform float uDt; uniform float uKeep;
void main(){
  vec2 c = vUv + uShift - uDt * texture(uVel, vUv + uVelShift).xy * uTexel;
  vec2 inside = step(vec2(0.0), c) * step(c, vec2(1.0)); // nothing flows in from beyond the paper
  o = uKeep * texture(uSrc, c) * inside.x * inside.y;
}`,
  divergence: `uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x, R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y, T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  curl: `uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y, R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).x, T = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  // vorticity confinement: gives back the small curls the coarse grid would smooth away
  vorticity: `uniform sampler2D uVel; uniform sampler2D uCurl; uniform vec2 uTexel; uniform float uCurlK; uniform float uDt;
void main(){
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).r, R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).r;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).r, T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).r;
  float C = texture(uCurl, vUv).r;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 0.0001;
  f *= uCurlK * C;
  f.y *= -1.0;
  o = vec4(clamp(texture(uVel, vUv).xy + f * uDt, -1000.0, 1000.0), 0.0, 1.0);
}`,
  fade: `uniform sampler2D uSrc; uniform float uKeep;
void main(){ o = uKeep * texture(uSrc, vUv); }`,
  pressure: `uniform sampler2D uPre; uniform sampler2D uDiv; uniform vec2 uTexel;
void main(){
  float L = texture(uPre, vUv - vec2(uTexel.x, 0.0)).r, R = texture(uPre, vUv + vec2(uTexel.x, 0.0)).r;
  float B = texture(uPre, vUv - vec2(0.0, uTexel.y)).r, T = texture(uPre, vUv + vec2(0.0, uTexel.y)).r;
  o = vec4((L + R + B + T - texture(uDiv, vUv).r) * 0.25, 0.0, 0.0, 1.0);
}`,
  project: `uniform sampler2D uPre; uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uPre, vUv - vec2(uTexel.x, 0.0)).r, R = texture(uPre, vUv + vec2(uTexel.x, 0.0)).r;
  float B = texture(uPre, vUv - vec2(0.0, uTexel.y)).r, T = texture(uPre, vUv + vec2(0.0, uTexel.y)).r;
  o = vec4(texture(uVel, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`,
  // a soft round touch of the brush: adds uValue around uPoint
  splat: `uniform sampler2D uSrc; uniform vec2 uPoint; uniform vec3 uValue; uniform float uRadius; uniform float uAspect;
void main(){
  vec2 d = vUv - uPoint; d.x *= uAspect;
  o = vec4(texture(uSrc, vUv).xyz + uValue * exp(-dot(d, d) / uRadius), 1.0);
}`,
  // ink in the shape of a picture the page sends (lettering): added wherever the picture is opaque
  stamp: `uniform sampler2D uSrc; uniform sampler2D uStamp; uniform vec3 uValue;
void main(){ o = vec4(texture(uSrc, vUv).xyz + uValue * texture(uStamp, vec2(vUv.x, 1.0 - vUv.y)).a, 1.0); }`,
  // ink on paper, for a layer that is multiplied onto the page: transparent where there is none
  show: `uniform sampler2D uDye; uniform vec2 uTexel;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  float d = max(texture(uDye, vUv).r - 0.012, 0.0);
  float gx = texture(uDye, vUv + vec2(uTexel.x, 0.0)).r - texture(uDye, vUv - vec2(uTexel.x, 0.0)).r;
  float gy = texture(uDye, vUv + vec2(0.0, uTexel.y)).r - texture(uDye, vUv - vec2(0.0, uTexel.y)).r;
  float a = 1.0 - exp(-d * 2.6);
  a += a * min(length(vec2(gx, gy)) * 3.2, 0.5);           // the tide line of a wash
  a *= 0.93 + 0.14 * hash(floor(gl_FragCoord.xy * 0.75)); // the tooth of the paper
  a = clamp(a, 0.0, 0.9);
  o = vec4(vec3(0.105, 0.098, 0.090) * a, a);
}`,
};

type Tick = (f: (now: number) => void) => number;
type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type Pair = { read: Target; write: Target; swap(): void };
type Program = { use(): void; u: Record<string, WebGLUniformLocation | null> };

/** What the page tells the ink. Positions are 0…1 across the view, y measured from the bottom. */
export type InkEvent =
  | { move: { x: number; y: number; dx: number; dy: number; dt: number } }
  | { splash: { x: number; y: number } }
  | { stroke: { x0: number; y0: number; x1: number; y1: number; ms: number } }
  // lettering, as a picture the size of the view: it turns to ink and lifts off the page
  | { stamp: { picture: ImageBitmap; ink: number; lift: number; x0: number; y0: number; x1: number; y1: number } }
  | { scroll: number } // how far the page moved up, as a fraction of the view's height
  | { size: { w: number; h: number } }
  | { run: boolean };

export type Ink = { tell(e: InkEvent): void };

const SIM = 128; // cells across the shorter side of the view
const PRESSURE_STEPS = 14;
const CURL = 16;
const VELOCITY_FADE = 1.7; // per second: the current settles quickly, the ink lingers a little longer
const INK_FADE = 0.62; // per second: a stroke is gone in about four
const REST_AFTER = 5200; // ms without a touch before the simulation sleeps

export async function createInk(canvas: OffscreenCanvas, tick: Tick, cancel: (id: number) => void, onRest: () => void): Promise<Ink | null> {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }) as WebGL2RenderingContext | null;
  // half-float targets that can be drawn to: without them there is no simulation, and no ink
  if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return null;
  const parallel = gl.getExtension('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null;

  const shader = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const vert = shader(gl.VERTEX_SHADER, VERT);
  const programs = {} as Record<keyof typeof FRAG, Program>;
  for (const name of Object.keys(FRAG) as (keyof typeof FRAG)[]) {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, HEAD + FRAG[name]));
    gl.bindAttribLocation(prog, 0, 'p');
    gl.linkProgram(prog);
    // one at a time, a moment apart: the graphics process is never held for long
    // (timers, not animation frames: a canvas that is not shown yet gets none)
    if (parallel) while (!gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) await new Promise((r) => setTimeout(r, 12));
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    const u: Program['u'] = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(prog, i)!.name; u[name] = gl.getUniformLocation(prog, name); }
    programs[name] = { use: () => gl.useProgram(prog), u };
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);

  const target = (w: number, h: number, internal: number, format: number, filter: number): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h };
  };
  const pair = (w: number, h: number, internal: number, format: number, filter: number): Pair => {
    const p = { read: target(w, h, internal, format, filter), write: target(w, h, internal, format, filter), swap() { const t = p.read; p.read = p.write; p.write = t; } };
    return p;
  };
  // two-channel and one-channel half floats where the driver draws to them, four-channel otherwise
  const drawable = (internal: number, format: number) => {
    const t = target(4, 4, internal, format, gl.NEAREST);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo);
    return ok;
  };
  const two: [number, number] = drawable(gl.RG16F, gl.RG) ? [gl.RG16F, gl.RG] : [gl.RGBA16F, gl.RGBA];
  const one: [number, number] = drawable(gl.R16F, gl.RED) ? [gl.R16F, gl.RED] : [gl.RGBA16F, gl.RGBA];
  if (!drawable(gl.RGBA16F, gl.RGBA)) return null;

  let velocity!: Pair, dye!: Pair, pressure!: Pair, divergence!: Target, curl!: Target;
  let aspect = 1;
  const drop = (t?: Target) => { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); } };
  const allocate = (w: number, h: number) => {
    for (const p of [velocity, dye, pressure]) { drop(p?.read); drop(p?.write); }
    drop(divergence); drop(curl);
    canvas.width = w; canvas.height = h;
    aspect = w / h;
    const k = SIM / Math.min(w, h);
    const sw = Math.max(16, Math.round(w * k)), sh = Math.max(16, Math.round(h * k));
    velocity = pair(sw, sh, two[0], two[1], gl.LINEAR);
    pressure = pair(sw, sh, one[0], one[1], gl.NEAREST);
    divergence = target(sw, sh, one[0], one[1], gl.NEAREST);
    curl = target(sw, sh, one[0], one[1], gl.NEAREST);
    dye = pair(w, h, one[0], one[1], gl.LINEAR); // the ink itself is as fine as the picture
  };

  const bind = (unit: number, t: Target) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t.tex); return unit; };
  const into = (t: Target | null) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
    gl.viewport(0, 0, t ? t.w : canvas.width, t ? t.h : canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const splat = (field: Pair, x: number, y: number, value: [number, number, number], radius: number) => {
    const { use, u } = programs.splat;
    use();
    gl.uniform1i(u.uSrc, bind(0, field.read));
    gl.uniform2f(u.uPoint, x, y);
    gl.uniform3f(u.uValue, value[0], value[1], value[2]);
    gl.uniform1f(u.uRadius, radius);
    gl.uniform1f(u.uAspect, aspect);
    into(field.write);
    field.swap();
  };

  let shift = 0; // scrolling still to be applied, as a fraction of the height
  const step = (dt: number) => {
    const texel: [number, number] = [1 / velocity.read.w, 1 / velocity.read.h];
    let p = programs.curl; p.use();
    gl.uniform2f(p.u.uTexel, ...texel); gl.uniform1i(p.u.uVel, bind(0, velocity.read)); into(curl);

    p = programs.vorticity; p.use();
    gl.uniform2f(p.u.uTexel, ...texel); gl.uniform1i(p.u.uVel, bind(0, velocity.read)); gl.uniform1i(p.u.uCurl, bind(1, curl));
    gl.uniform1f(p.u.uCurlK, CURL); gl.uniform1f(p.u.uDt, dt); into(velocity.write); velocity.swap();

    p = programs.divergence; p.use();
    gl.uniform2f(p.u.uTexel, ...texel); gl.uniform1i(p.u.uVel, bind(0, velocity.read)); into(divergence);

    p = programs.fade; p.use();
    gl.uniform1i(p.u.uSrc, bind(0, pressure.read)); gl.uniform1f(p.u.uKeep, 0.8); into(pressure.write); pressure.swap();

    p = programs.pressure; p.use();
    gl.uniform2f(p.u.uTexel, ...texel); gl.uniform1i(p.u.uDiv, bind(1, divergence));
    for (let i = 0; i < PRESSURE_STEPS; i++) { gl.uniform1i(p.u.uPre, bind(0, pressure.read)); into(pressure.write); pressure.swap(); }

    p = programs.project; p.use();
    gl.uniform2f(p.u.uTexel, ...texel); gl.uniform1i(p.u.uPre, bind(0, pressure.read)); gl.uniform1i(p.u.uVel, bind(1, velocity.read));
    into(velocity.write); velocity.swap();

    p = programs.advect; p.use();
    gl.uniform2f(p.u.uTexel, ...texel); gl.uniform2f(p.u.uShift, 0, -shift); gl.uniform1f(p.u.uDt, dt);
    // the current carries itself (read where it was before the page moved)…
    gl.uniform2f(p.u.uVelShift, 0, -shift);
    gl.uniform1i(p.u.uVel, bind(0, velocity.read)); gl.uniform1i(p.u.uSrc, bind(0, velocity.read));
    gl.uniform1f(p.u.uKeep, 1 / (1 + VELOCITY_FADE * dt)); into(velocity.write); velocity.swap();
    // …then the ink
    gl.uniform2f(p.u.uVelShift, 0, 0);
    gl.uniform1i(p.u.uVel, bind(0, velocity.read)); gl.uniform1i(p.u.uSrc, bind(1, dye.read));
    gl.uniform1f(p.u.uKeep, 1 / (1 + INK_FADE * dt)); into(dye.write); dye.swap();
    shift = 0;
  };
  const show = () => {
    const { use, u } = programs.show;
    use();
    gl.uniform1i(u.uDye, bind(0, dye.read));
    gl.uniform2f(u.uTexel, 1 / dye.read.w, 1 / dye.read.h);
    into(null);
  };
  const wipe = () => {
    for (const t of [velocity.read, velocity.write, dye.read, dye.write, pressure.read, pressure.write]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.viewport(0, 0, t.w, t.h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT);
  };

  // --- the brush ---------------------------------------------------------------------------------
  /** One touch of the brush moving by (dx, dy) of the view in dt seconds, ending at (x, y). */
  const touch = (x: number, y: number, dx: number, dy: number, dt: number, weight = 1) => {
    const far = Math.hypot(dx * aspect, dy); // in view heights
    const speed = far / Math.max(dt, 0.004); // view heights per second
    // a slow brush is wet and wide, a fast one dry and thin
    const dry = Math.min(1, speed / 2.6);
    const radius = 0.00052 - 0.00034 * dry;
    const spacing = Math.sqrt(radius) * 0.55;
    const steps = Math.min(10, Math.max(1, Math.ceil(far / spacing)));
    // ink and push in proportion to the ground covered, so a slow hand neither floods the paper
    // nor whips the current up; the current follows the hand (cells per second)
    const share = Math.min(1, far / steps / spacing);
    const push = Math.min(1, far / steps / (Math.sqrt(radius * 2.2) * 0.9)) * 0.3;
    const vx = Math.max(-900, Math.min(900, (dx / Math.max(dt, 0.004)) * velocity.read.w * push));
    const vy = Math.max(-900, Math.min(900, (dy / Math.max(dt, 0.004)) * velocity.read.h * push));
    const ink = (0.075 + 0.07 * (1 - dry)) * share * weight;
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      const px = x - dx * (1 - f), py = y - dy * (1 - f);
      splat(velocity, px, py, [vx, vy, 0], radius * 2.2);
      splat(dye, px, py, [ink, 0, 0], radius);
    }
  };
  /** A drop falling on the paper: ink, and a ring of current running outward from it. */
  const splash = (x: number, y: number) => {
    splat(dye, x, y, [0.8, 0, 0], 0.0015);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const r = 0.026;
      splat(velocity, x + (Math.cos(a) * r) / aspect, y + Math.sin(a) * r, [Math.cos(a) * 300, Math.sin(a) * 300, 0], 0.0008);
      if (i % 2 === 0) splat(dye, x + (Math.cos(a) * r * 1.5) / aspect, y + Math.sin(a) * r * 1.5, [0.2, 0, 0], 0.0002);
    }
  };

  /** Lettering turns to ink where it stands, rises a little, and a few stray airs pull it into wisps. */
  const stamp = (e: Extract<InkEvent, { stamp: unknown }>['stamp']) => {
    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, e.picture);
    e.picture.close();
    const { use, u } = programs.stamp;
    for (const [field, value] of [[dye, [e.ink, 0, 0]], [velocity, [0, e.lift, 0]]] as [Pair, [number, number, number]][]) {
      use();
      gl.uniform1i(u.uSrc, bind(0, field.read));
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.uStamp, 1);
      gl.uniform3f(u.uValue, value[0], value[1], value[2]);
      into(field.write);
      field.swap();
    }
    gl.deleteTexture(tex);
    const w = e.x1 - e.x0, h = e.y1 - e.y0;
    // stray airs across the words pull the cloud apart into wisps
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, force = 45 + Math.random() * 70;
      splat(velocity, e.x0 + Math.random() * w, e.y0 + Math.random() * h, [Math.cos(a) * force, Math.abs(Math.sin(a)) * force * 0.8, 0], 0.0011);
    }
  };

  let stroke: { x0: number; y0: number; x1: number; y1: number; ms: number; t0: number; at: number } | null = null;
  let last = 0;
  let touched = 0;
  let running = false;
  let allowed = true;
  let raf = 0;
  const frame = (now: number) => {
    if (!running) return;
    raf = tick(frame);
    const dt = Math.min(Math.max((now - last) / 1000, 0.001), 1 / 30);
    last = now;
    if (stroke) {
      // a stroke painted by no one: ink that lifts off the line as it is laid, like breath in cold air
      const f = Math.min(1, (now - stroke.t0) / stroke.ms);
      const e = f * f * (3 - 2 * f);
      if (e > stroke.at) {
        const xa = stroke.x0 + (stroke.x1 - stroke.x0) * stroke.at, xb = stroke.x0 + (stroke.x1 - stroke.x0) * e;
        const ya = stroke.y0 + (stroke.y1 - stroke.y0) * stroke.at, yb = stroke.y0 + (stroke.y1 - stroke.y0) * e;
        touch(xb, yb, xb - xa, yb - ya, dt * 3, 0.6);
        splat(velocity, xb, yb, [0, 7, 0], 0.0012);
        stroke.at = e;
      }
      touched = now;
      if (f >= 1) stroke = null;
    }
    step(dt);
    show();
    if (now - touched > REST_AFTER) { running = false; cancel(raf); wipe(); onRest(); }
  };
  const wake = () => {
    if (running || !allowed) return;
    running = true;
    last = performance.now();
    touched = last;
    raf = tick(frame);
  };

  allocate(canvas.width || 2, canvas.height || 2);
  // a program is only really compiled when it first draws: let that happen now, on empty paper,
  // rather than under the visitor's first stroke
  splat(velocity, 0.5, 0.5, [0, 0, 0], 0.001);
  step(1 / 60);
  show();
  wipe();
  return {
    tell(e) {
      if ('size' in e) { allocate(e.size.w, e.size.h); stroke = null; return; }
      if ('run' in e) { allowed = e.run; if (!allowed) { running = false; cancel(raf); stroke = null; wipe(); } return; }
      if (!allowed) { if ('stamp' in e) e.stamp.picture.close(); return; }
      if ('scroll' in e) { if (running) shift += e.scroll; return; }
      if ('move' in e) touch(e.move.x, e.move.y, e.move.dx, e.move.dy, e.move.dt);
      else if ('splash' in e) splash(e.splash.x, e.splash.y);
      else if ('stroke' in e) stroke = { ...e.stroke, t0: performance.now(), at: 0 };
      else if ('stamp' in e) stamp(e.stamp);
      touched = performance.now();
      wake();
    },
  };
}
