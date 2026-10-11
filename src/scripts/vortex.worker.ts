// The smoke vortex, drawn off the page's thread: the canvas is handed over once, then the page
// only says how big the picture is and whether it should be turning. Creating the WebGL context,
// compiling the shader and every frame after that cost the page nothing.
import { createVortex, type Frame, type Vortex } from './vortex-core';

type Message = { canvas: OffscreenCanvas } | { size: Frame } | { run: 'start' | 'stop' | 'still' };

// (the project is typed for the page, not for workers: just the few things used here)
const scope = self as unknown as {
  requestAnimationFrame?: (f: (now: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  postMessage(message: 'ready' | 'failed'): void;
  onmessage: ((e: MessageEvent<Message>) => void) | null;
};
const tick = (f: (now: number) => void) => (scope.requestAnimationFrame ? scope.requestAnimationFrame(f) : (setTimeout(() => f(performance.now()), 33) as unknown as number));
const cancel = (id: number) => (scope.cancelAnimationFrame ? scope.cancelAnimationFrame(id) : clearTimeout(id));

let vortex: Vortex | null = null;
// what the page asked for while the shader was still compiling
let size: Frame | null = null;
let run: 'start' | 'stop' | 'still' = 'stop';

scope.onmessage = async ({ data }) => {
  if ('canvas' in data) {
    vortex = await createVortex(data.canvas, tick, cancel).catch(() => null);
    if (!vortex) return scope.postMessage('failed');
    if (size) vortex.size(size);
    vortex[run]();
    scope.postMessage('ready');
  } else if ('size' in data) {
    size = data.size;
    vortex?.size(size);
  } else {
    run = data.run;
    vortex?.[run]();
  }
};
