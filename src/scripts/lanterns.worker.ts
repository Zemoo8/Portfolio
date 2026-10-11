// The lanterns over the night at the road's end, off the page's thread: the canvas is handed over
// once; after that the page only says where things are and what the visitor did, and everything —
// the lanterns' drifting and the drawing — happens here.
// A lantern is two small pictures made once (its paper with the flame showing through, and the
// light it sheds, which is added to whatever is behind it); a frame is a hundred-odd of each.
type Message =
  | { canvas: OffscreenCanvas; w: number; h: number }
  | { size: { w: number; h: number } }
  | { run: boolean }
  | { place: { emit: [number, number]; quiet: [number, number, number, number] } }
  | { wind: [number, number] | null }
  | { burst: [number, number] }
  | { flight: number };

type Lantern = { x: number; y: number; z: number; push: number; phase: number; age: number; tilt: number };

// (the project is typed for the page, not for workers: just the few things used here)
const scope = self as unknown as {
  requestAnimationFrame?: (f: (now: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  onmessage: ((e: MessageEvent<Message>) => void) | null;
};
const tick = (f: (now: number) => void) => (scope.requestAnimationFrame ? scope.requestAnimationFrame(f) : (setTimeout(() => f(performance.now()), 16) as unknown as number));
const cancel = (id: number) => (scope.cancelAnimationFrame ? scope.cancelAnimationFrame(id) : clearTimeout(id));

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let W = 2, H = 2;
let frame = 0, last = 0, clock = 0, since = 0;
let emit: [number, number] = [0.78, 0.7]; // where they are lit: the pavilion (fractions of the picture)
let quiet: [number, number, number, number] = [0, 0, 0, 0]; // the words: a lantern passing behind them is dimmed
let wind: [number, number] | null = null; // the pointer
let waiting = 0; // lanterns of a flight still to be let go
const flock: Lantern[] = [];
let paper: OffscreenCanvas, light: OffscreenCanvas;

function pictures() {
  paper = new OffscreenCanvas(96, 128);
  const g = paper.getContext('2d')!;
  // the paper: wider at the top than at the mouth
  g.beginPath(); g.moveTo(14, 12); g.quadraticCurveTo(48, -6, 82, 12); g.lineTo(70, 104); g.quadraticCurveTo(48, 114, 26, 104); g.closePath();
  const skin = g.createLinearGradient(0, 0, 0, 112);
  skin.addColorStop(0, '#ffcf7a'); skin.addColorStop(0.55, '#ffab45'); skin.addColorStop(1, '#f2742b');
  g.fillStyle = skin; g.fill();
  g.save(); g.clip();
  // the flame shows through from below
  const flame = g.createRadialGradient(48, 92, 2, 48, 84, 46);
  flame.addColorStop(0, 'rgba(255,250,214,0.98)'); flame.addColorStop(0.5, 'rgba(255,226,150,0.5)'); flame.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = flame; g.fillRect(0, 0, 96, 128);
  g.strokeStyle = 'rgba(140,60,10,0.2)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(34, 4); g.lineTo(40, 108); g.moveTo(62, 4); g.lineTo(56, 108); g.stroke();
  g.restore();
  g.strokeStyle = 'rgba(96,40,8,0.75)'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(48, 105, 22, 5, 0, 0, Math.PI * 2); g.stroke();

  light = new OffscreenCanvas(160, 160);
  const h = light.getContext('2d')!;
  const halo = h.createRadialGradient(80, 80, 0, 80, 80, 80);
  halo.addColorStop(0, 'rgba(255,186,96,0.55)'); halo.addColorStop(0.35, 'rgba(255,140,50,0.2)'); halo.addColorStop(1, 'rgba(255,120,40,0)');
  h.fillStyle = halo; h.fillRect(0, 0, 160, 160);
}

/** Let one go from a place in the picture (fractions of it); the nearer it is, the larger and faster. */
function release(x: number, y: number) {
  if (flock.length > 150) return;
  flock.push({ x: x * W, y: y * H, z: 0.36 + Math.pow(Math.random(), 1.7) * 0.64, push: 0, phase: Math.random() * 6.283, age: 0, tilt: (Math.random() - 0.5) * 0.28 });
}

function step(now: number) {
  frame = tick(step);
  if (!ctx) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now; clock += dt;
  const u = H / 900; // everything is sized by the picture

  // one more from the pavilion every little while; a flight goes up a few at a time, all along the foot
  since += dt;
  if (since > 0.9 && flock.length < 44) { since = 0; release(emit[0] + (Math.random() - 0.5) * 0.08, emit[1] + Math.random() * 0.03); }
  for (let n = Math.min(waiting, Math.ceil(dt * 30)); n > 0; n--, waiting--) release(0.04 + Math.random() * 0.93, 1.02 + Math.random() * 0.07);

  for (let i = flock.length - 1; i >= 0; i--) {
    const l = flock[i];
    l.age += dt;
    if (wind) {
      // the pointer is a breath of wind: a lantern near it is eased aside
      const dx = l.x - wind[0] * W, dy = l.y - wind[1] * H, reach = 190 * u;
      const d = Math.hypot(dx, dy);
      if (d < reach) { const f = (1 - d / reach) * 170 * u * dt; l.push += (dx / (d || 1)) * f; l.y += (dy / (d || 1)) * f * 0.35; }
    }
    l.push *= 1 - Math.min(1, dt * 0.9);
    l.x += (Math.sin(l.phase + clock * 0.7) * 9 * l.z * u + l.push) * dt;
    l.y -= (26 + 54 * l.z) * u * dt;
    if (l.y < -70 * u) flock.splice(i, 1);
  }
  flock.sort((a, b) => a.z - b.z); // the far ones are drawn first

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const [qx0, qy0, qx1, qy1] = [quiet[0] * W, quiet[1] * H, quiet[2] * W, quiet[3] * H];
  const seen = (l: Lantern) => {
    const out = Math.max(qx0 - l.x, l.x - qx1, qy0 - l.y, l.y - qy1, 0); // how far outside the words
    return Math.min(1, l.age / 0.9) * Math.min(1, Math.max(0, l.y / (0.14 * H))) * (0.22 + 0.78 * Math.min(1, out / (70 * u)));
  };
  ctx.globalCompositeOperation = 'lighter';
  for (const l of flock) {
    const s = 170 * l.z * u;
    ctx.globalAlpha = seen(l) * 0.5 * (0.9 + 0.1 * Math.sin(clock * 7 + l.phase * 3));
    ctx.drawImage(light, l.x - s / 2, l.y - s * 0.44, s, s);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const l of flock) {
    const h = 44 * l.z * u, w = h * 0.75;
    const lean = l.tilt + Math.sin(l.phase + clock * 0.7) * 0.07;
    ctx.globalAlpha = seen(l);
    ctx.setTransform(Math.cos(lean), Math.sin(lean), -Math.sin(lean), Math.cos(lean), l.x, l.y);
    ctx.drawImage(paper, -w / 2, -h / 2, w, h);
  }
}

scope.onmessage = ({ data }) => {
  if ('canvas' in data) {
    canvas = data.canvas;
    canvas.width = W = data.w; canvas.height = H = data.h;
    ctx = canvas.getContext('2d');
    pictures();
  } else if ('size' in data) {
    if (!canvas || (data.size.w === W && data.size.h === H)) return;
    // lanterns already up keep their places in the picture
    for (const l of flock) { l.x *= data.size.w / W; l.y *= data.size.h / H; }
    canvas.width = W = data.size.w; canvas.height = H = data.size.h;
  } else if ('run' in data) {
    cancel(frame); frame = 0;
    if (data.run) { last = performance.now(); frame = tick(step); }
  } else if ('place' in data) {
    emit = data.place.emit; quiet = data.place.quiet;
  } else if ('wind' in data) {
    wind = data.wind;
  } else if ('burst' in data) {
    for (let n = 0; n < 5; n++) release(data.burst[0] + (Math.random() - 0.5) * 0.05, data.burst[1] + (Math.random() - 0.5) * 0.04);
  } else if ('flight' in data) {
    waiting += data.flight;
  }
};
