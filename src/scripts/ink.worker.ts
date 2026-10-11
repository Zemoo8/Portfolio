// Living ink, off the page's thread: the canvas is handed over once; after that the page only
// reports where the pointer went, and the worker does the fluid's arithmetic and the drawing.
import { createInk, type Ink, type InkEvent } from './ink-core';

type Message = { canvas: OffscreenCanvas; w: number; h: number } | InkEvent;

// (the project is typed for the page, not for workers: just the few things used here)
const scope = self as unknown as {
  requestAnimationFrame?: (f: (now: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  postMessage(message: 'ready' | 'failed' | 'rest'): void;
  onmessage: ((e: MessageEvent<Message>) => void) | null;
};
const tick = (f: (now: number) => void) => (scope.requestAnimationFrame ? scope.requestAnimationFrame(f) : (setTimeout(() => f(performance.now()), 16) as unknown as number));
const cancel = (id: number) => (scope.cancelAnimationFrame ? scope.cancelAnimationFrame(id) : clearTimeout(id));

let ink: Ink | null = null;

scope.onmessage = async ({ data }) => {
  if ('canvas' in data) {
    data.canvas.width = data.w;
    data.canvas.height = data.h;
    ink = await createInk(data.canvas, tick, cancel, () => scope.postMessage('rest')).catch(() => null);
    scope.postMessage(ink ? 'ready' : 'failed');
  } else {
    ink?.tell(data);
  }
};
