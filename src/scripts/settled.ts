// "The page has arrived": at once on a plain load; when the brush has swept the previous page
// away on a page change (a cross-document view transition — see global.css). Start-up work that
// leans on the graphics process — films, the smoke shader, the later stages of the painting —
// waits for it, so nothing competes with the sweep. The promise is made by a tiny inline script
// in the <head> (Base.astro), early enough to hear `pagereveal`.
type Arrival = { __settled?: Promise<void>; __swept?: boolean };

export const settled: Promise<void> = (window as Arrival).__settled ?? Promise.resolve();
/** True when this page came in under the brush (its content is uncovered half-way through). */
export const swept = () => !!(window as Arrival).__swept;
