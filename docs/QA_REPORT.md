# QA report — 2026-09-26 (after the "air temple, in ink" redesign)

Environment: Windows 11, Node 24, Astro 7.3.5 static build served by `astro preview`; Chromium via Playwright 1.61 (headless; GPU via ANGLE/D3D11 for WebGL); Lighthouse 12 (mobile, simulated throttling).

## Round 7 — 2026-10-11: the road is painted by a brush as the page is scrolled (latest)

Ahmed's idea. Same laptop; it was busy with other work during the round (30–50 % CPU), so every figure is a back-to-back comparison on a second pass in a fresh browser.

| Area | Result |
|---|---|
| First version | 11–30 hairs per bend, all 96 animated at once by scroll timelines, round caps, 28 points each: 3–7 % of frames late along the road, against 0 % with the road as plain shapes |
| As shipped | Seven hairs of 14 points per bend, trimmed to the bend's outline by a `clipPath`; only the bend under the brush is animated, the others are one filled shape each. Late frames along the whole road (~255 frames): 0–5 with the painting, 3–6 with the same hairs standing still — the painting itself is not measurable; what is left falls where the brush passes from one bend to the next |
| Same shape painted or not | A bend changes from hairs to its finished shape when the brush leaves it: the two renderings differ in 890 of 3.3 million pixels (edge antialiasing), so nothing moves |
| The paint follows the brush | Lowest painted point against the brush's level at 16 scroll positions: within 27 px at 1536 and 1920 wide. The pace is taken from the road's own geometry (`slope` in `lib/road.ts`), not from the screen's |
| Thrown about | States are worked out from where the road is, once a frame: after a jump to the end of the page, back into the middle of the road, to the top, and by the #path link, the bends above the brush are painted and those below bare. (A first version listened for bends crossing the brush's level and left every bend it had skipped unpainted.) |
| Elsewhere | Arabic: brush and road mirrored together. Phones: no brush, the road keeps to the margin as before. Animations off / reduced motion: the road is simply there. The brush element is `.painter`: `.brush` is the stroke component's own class and its global rules would have applied |
| Regression checks | type check 0 errors · axe 0 violations · keyboard 21 / 21 · films 14 / 14 · scroll-calm 5 / 5 · no console errors |

## Round 6 — 2026-10-11: Path as a road on an unrolling scroll, Capabilities as hanging scrolls

Same laptop and Chrome. New tool: `scripts/qa/smooth.mjs` scrolls a page by the wheel at a reading pace and a hurried one and times every frame, per chapter; with `PROFILE=<dir>` it keeps the browser profile, so a second run is a returning visitor (graphics shaders already compiled).

| Area | Result |
|---|---|
| Unrolling, first version | Cut the silk off with `clip-path` driven by a scroll timeline: repainted on the main thread on every frame. Path: 21 of 243 frames late at a reading pace, 27 of 116 hurried. The four hanging scrolls (a registered custom property driving `clip-path`): 35 of 58 late |
| Unrolling, as shipped | `transform` only — a window slides down while the sheet slides up inside it by as much; the compositor runs it. Path: 0–6 late of 260–300 at a reading pace over nine runs, 0–2 of ~130 hurried (one run had a single 203 ms stall in Path; the two runs after it had no late frame there). Capabilities: 0–4 of ~80. The roller holds its line on the screen (727 px of 826 at three scroll positions) |
| Whole home page, late frames (> 20 ms) | Returning visitor: live site 0.7 %, this build 0.6–3.9 % over four runs (the spread is in the hero, Work and About, which this round did not touch; the machine was in use). First visit: live 3.0 %, this build 3.1–6.8 % |
| What a first visit pays for | Traced: every stall of 50–110 ms on a first visit is the GPU process compiling a shader for a kind of paint it meets for the first time (`RasterDecoder…Flush` with ANGLE compile tasks). Switching off masks, blend modes, filters, shadows, films, the backdrop or the canvases one at a time did not move them; a second pass over the page in the same browser has none (no slice over 31 ms in a warm trace of the whole page) |
| View timeline | `view-timeline-inset` defaults to the page's `scroll-padding` (1.5rem here): the roller crept 24 px down the screen over the chapter until the inset was set to 0 |
| Behaviour under the roller | The rolled-up window lies over the chapters above: it lets clicks through (`pointer-events: none`, the sheet takes them back). Keyboard: all focusable elements in the chapter come out from under the roller when focused (`scroll-margin`). Certificate lightbox opens from the road. Animations off / reduced motion: the scroll is simply open |
| Layout | No sideways scrolling and no text touching the road at 11 widths (360–1920) × 3 languages. Found on the way: the Capabilities heading's paper wash spilled 46 px past the line's end at 900 px and made the page scroll sideways — now it may only spill past the start. Arabic: the road is mirrored with the page (a scoped `[dir='rtl']` rule never matched; it needed `:global`) |
| Regression checks | type check 0 errors · axe 0 violations on 7 pages · keyboard 21 / 21 · films 14 / 14 · scroll-calm 5 / 5 · no console errors |

## Round 5 — 2026-10-11: smoother page changes, no first-visit freeze

Measured in Chrome on the owner's laptop (Ryzen 7 7730U, integrated Radeon, 1920×1200 at 125 %), tracing the frames that reached the screen.

| Area | Result |
|---|---|
| Scrolling | Already ~60 fps on this machine before the round (59.6 fps, one frame over 33 ms in 468); left native, as designed |
| Moon gate hover | The gate's `pointerenter` created a WebGL context on the spot: 172 ms with the page frozen, measured in the owner's own Chrome. It now waits for an idle moment after the event |
| Page change | New transition (a brush sweep, compositor-only). Longest stretch without a new frame, warm browser profile, new vs. previous build: into a case study 25 ms vs 71 ms · between case studies 47–50 ms vs 68–106 ms · back to the home page 85–106 ms vs 118–219 ms. With prefetch-on-hover the next page's HTML is already there (15 ms) |
| First visit (cold graphics cache) | The paper grain and the gate's arrow used SVG `feTurbulence`; the driver compiled a noise shader for them while the page stood still. Landing on the home page: 590–640 ms → 350–370 ms without a frame. Grain baked to `public/ink/grain.png` (mean colour and noise of a panel unchanged: 242.2/236.4/221.8 vs 242.2/236.4/221.7), arrow drawn in its geometry |
| Smoke vortex | Runs in a worker where `transferControlToOffscreen` exists (main-thread fallback kept); same picture, same 30 fps |
| Regression checks | type check 0 errors · axe 0 violations on 7 pages · keyboard 21 / 21 · films 14 / 14 · scroll-calm 5 / 5 (its layer check now ignores the phone-only stages a wide screen never shows — it had been failing since those were added) |

## Round 4 — 2026-10-11: search, loading, phone films, CV

Nothing visual changed. Checked on the live site (`www.ahmedbaghouli.world`) after deploying.

| Area | Result |
|---|---|
| Canonical domain | Every page, the sitemap and `robots.txt` name `https://www.ahmedbaghouli.world` (a stale `SITE_URL` on Vercel had pointed them at the `vercel.app` address, which redirects back — Google indexed nothing) |
| Fonts | 5 font files / 145 KB on `/en/` (before: 7 / 185 KB). The Latin Extended faces had no `unicode-range`, so every page fetched them first and the headline's real font one round trip later; the first-screen faces are now preloaded |
| Films on phones | Screens ≤ 760 px get `<key>-phone.mp4` (960 px): 21.6 MB → 8.3 MB across the seven wide films. `/en/work/cheezy/` on a phone: 4.0 MB → 1.95 MB. Desktop unchanged. Verified in Chrome: a 390 px viewport plays the 960 px file, a 1440 px viewport the full one |
| Analytics | Vercel Web Analytics was enabled on the project but its script was not in the pages. Now loaded on Vercel builds only; `POST /_vercel/insights/view` → 200 (the script ignores headless/automated browsers, and content blockers stop it) |
| Structured data | `WebSite` + `Person` on every page, `ProfilePage` on the home pages, `CreativeWork` + `BreadcrumbList` on case studies; 404 is `noindex` with no canonical; sitemap carries `x-default` |
| Accessibility (axe-core) | 0 violations on 7 pages; the moon-gate button's name now starts with its visible label ("Play — Intro film"), the one Lighthouse flag |
| Keyboard · films · links | 21 / 21 · 14 / 14 play · 0 broken internal links |
| Lighthouse | A11y 100 · BP 100 · SEO 100. Performance on `/en/` measured 58–81 before and 61–91 after over three alternating runs each — this machine's runs vary too much to claim a change; `/en/work/cheezy/` 93 → 96 |
| CV | Contact offers `public/cv/ahmed-baghouli-cv.pdf`: Ahmed's `CV_Baghouli_Ahmed.pdf` with the phone number deleted from the page content (checked: no phone number readable in the text, the links or any object; all 41 links kept). Served `noindex` |

## Round 3 — films, calm scrolling, painted interface

| Area | Result |
|---|---|
| Films in real Chrome (`scripts/qa/films.mjs`) | **14 / 14 play** locally and on the live site (before: 2 / 12 — every VP9 WebM failed with a decode error after the first frame, and never fell back to MP4) |
| Scroll behaviour (`scripts/qa/scroll-calm.mjs`) | 5 / 5: no speed-driven effects, native wheel scrolling, depth layers on a `ScrollTimeline`, same position → same picture, hard scrolling never moves the orbit |
| Accessibility (axe-core) | 0 violations on 7 pages (EN/FR/AR home, 3 case studies, 404) |
| Keyboard | 15 / 15 |
| Links | 0 broken (24 external checked; LinkedIn 999 to bots) |
| Lighthouse (Perf · A11y · BP · SEO) | /en/ **89**·100·100·100 (TBT 0 ms, CLS 0) · /ar/ **85**·100·100·100 · /en/work/cheezy/ **95**·100·100·100 |
| Visual review | header, hero, moon gate, orbit caption, portrait, path tags, credential filters, contact, case study — EN desktop, AR desktop, 390 px phone |

Fixed in this round: films (H.264 only, re-encoded, new AI Eyes and Cheezy films); scroll-speed wind streaks / orbit push / vortex gusts / rail drift removed; Lenis removed; parallax and progress moved to scroll-driven CSS (a minifier had folded `animation-timeline` into the `animation` shorthand — kept in its own rule now); generic pills, round buttons, the recording dot, the arched portrait frame and the seal logo replaced with brushwork; SVG-filter masks (0.67 s of blocking on the Cheezy page) baked to PNG → 0 ms.

## Summary (round 2)

| Area | Result |
|---|---|
| Type check (`astro check`) | 0 errors, 0 warnings |
| Build | 3 locales × (home + 6 case studies) + root redirect + 404, robots.txt, sitemap.xml |
| Runtime errors | none (console + pageerror monitored in every screenshot run) |
| Internal links | 0 broken |
| External links | 24 checked, 0 failing (LinkedIn answers bots with 999 — expected) |
| Accessibility (axe-core, WCAG 2.2 AA + best practice) | **0 violations** on /en/, /fr/, /ar/, 3 case studies, 404 |
| Keyboard | **15 / 15** scripted checks pass (EN + AR + mobile menu) |
| Lighthouse (Perf · A11y · BP · SEO) | /en/ **90**·100·100·100 · /fr/ **90**·100·100·100 · /ar/ **86**·100·100·100 · /en/work/radar-interceptor/ **94**·100·100·100 |
| Lab vitals | LCP 2.7–3.5 s (LCP element: the 11 KB moon-gate painting, behind fonts/CSS on throttled 4G), CLS 0, TBT 0–10 ms |

## Tests performed

**Visual** — viewport screenshots while scrolling (so reveals, unrolls and brush strokes fire) at 360, 390, 768, 1024, 1440 and 1920 px wide for `/en/`, 390 + 1440 for `/ar/`, and case studies in EN/FR. Reviewed by eye: hero + moon gate, storm/orbit, credentials rail, parchment panels, contact, footer.

**Functional** — orbit (auto-rotation, drag with inertia + snap, click/focus brings a card to the front, arrow keys mirrored in RTL, pause, front card plays its film), certificate rail (filters, arrows, drag, drift) and lightbox (open, browse, verify link, Escape, focus return), language switcher (keeps page + hash, remembers choice), root language detection, motion switch (persists; stops parallax, wind, drift, orbit auto-spin and the vortex), intro-film pathway (build-time detection; missing films are never requested), copy-email, deep-route refresh, 404.

**Keyboard** — skip link first; visible focus everywhere; orbit cards, rail and lightbox fully operable without a pointer (`npm run qa:keys`).

**Modes** — `prefers-reduced-motion`: all content visible, no autoplay, vortex renders one still frame. JavaScript disabled: text, painting and certificates visible; films available via native controls.

**Content** — anti-hallucination sweep (`grep -rniE "lorem|ipsum|example\.com|john doe|acme|10\+ years|award-winning|top 1%|millions|TODO|FIXME|placeholder" src`): only the intentional intro-film fallback (`data-intro-placeholder`) and a local variable named `todo`. No invented names, metrics, dates or awards. Every certificate image was checked against its PDF.

## Issues found and fixed in this round

| Issue | Fix |
|---|---|
| English home blocked the main thread ~1.1 s (Perf 67): the storm chapter compiled the WebGL shader synchronously at load, and the scroll loop forced layout every frame | vortex compiles asynchronously (`KHR_parallel_shader_compile`), starts on real intersection during idle time and fades in when ready; scroll loop reads first / writes second, writes only changed values and skips idle frames; `--read` scoped to the nav seal instead of `:root`; paused orbit does no style writes → **TBT 0 ms, Perf 90** |
| Scroll panels never revealed (IntersectionObserver ignores fully clipped targets) | observe the parent as a proxy |
| Page 1531 px wide on desktop (decorative washes overflowed) | constrained pseudo-elements; `overflow-x: clip` on hero, storm and contact |
| 717 KB home HTML (brush paths) | relative path commands, fewer points/bristles, emblem as one `<symbol>` → 180 KB (35 KB gzipped) |
| Contrast failures inside the storm chapter | solid ink ground with gradient bands instead of a mask |
| Orbit cards: accessible name didn't match visible label | visible text + screen-reader-only tagline |
| Emblem `<use>` rendered one quadrant | explicit `x/y/width/height` on `<use>` |
| Moon-gate tag off-centre in Arabic; hero arrow mirrored in RTL | centred with auto margins; neutral ↓ |
| Orbit cards overlapped on phones | smaller cards, tighter/rounder ellipse under 700 px |
| Console error from a `data-film` name collision | renamed to `data-orbit-film` |
| Unused `three` / `@types/three` dependencies | removed |
| Certificate sources could be committed | `assets-source/certificates/` git-ignored and excluded from deploys |

## Remaining limitations

- **AI Eyes app footage** isn't included — the Android app needs a physical device. The slot `public/media/projects/aieyes/showcase-mobile.mp4` is wired and appears automatically.
- **Sandy AI Lab** is shown without a live AI answer: the project's Groq key is expired.
- **Books Price Intelligence** and **Radar Interceptor**: the filmed versions aren't fully pushed to GitHub (Flask + React Books; IMM code in its `aegis` package). The case studies say so.
- **Intro films**: not yet recorded — the painted moon gate stands in until `intro-<lang>.mp4` files are added.
- **Cross-browser**: automated runs used Chromium. The code relies only on progressive extras (View Transitions, `:has()`, WebGL with a CSS fallback), but a manual pass on Safari iOS and Firefox is recommended.
- **Real devices**: mobile checks were emulated (touch + mobile viewport).
- **Firefox**: CSS scroll-driven animations are not enabled there yet, so the landscape depth and the header's reading stroke stay still (the mist veil has a small position-based fallback). Everything else works.
- **Translations**: FR/AR copy should be proof-read by Ahmed.
- **Air Nomad emblem**: fan homage to franchise IP (see DESIGN_SYSTEM → "The air emblem"); swap for an original mark before any commercial use.

## Reproduce

```bash
npm run build && npm run preview          # terminal 1
npm run check
npm run qa:a11y; npm run qa:keys; npm run qa:links
MSYS_NO_PATHCONV=1 npm run qa:shots -- /en/ home 360x800 390x844 768x1024 1024x768 1440x900 1920x1080
npx lighthouse http://localhost:4321/en/ --only-categories=performance,accessibility,best-practices,seo
```
