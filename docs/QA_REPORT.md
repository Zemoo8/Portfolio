# QA report — 2026-09-26 (after the "air temple, in ink" redesign)

Environment: Windows 11, Node 24, Astro 7.3.5 static build served by `astro preview`; Chromium via Playwright 1.61 (headless; GPU via ANGLE/D3D11 for WebGL); Lighthouse 12 (mobile, simulated throttling).

## Round 4 — second creative pass (latest)

| Area | Result |
|---|---|
| Accessibility (axe-core) | 0 violations on 7 pages |
| Keyboard | 15 / 15 (index dialog, orbit focus/arrows/pause, lightbox) |
| Films in Chrome | 19 / 19 play — case studies, orbit cards, the six home worlds |
| Scroll behaviour | 4 / 4 — native wheel, the *o* travels by position only, the orbit ignores scrolling, no speed-driven effects |
| Links | 0 broken |
| Lighthouse (Perf · A11y · BP · SEO) | /en/ **94**·100·100·100 · /ar/ **84**·100·100·100 · /en/work/cheezy/ **94**·100·100·100 (after the ad images got intrinsic sizes) |
| Visual review | every scene at 1440 × 900 (EN, AR) and 390 × 844 (EN); before/after in `docs/second-pass/` |

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
| Lighthouse (Perf · A11y · BP · SEO) | /en/ **90**·100·100·100 · /fr/ **90**·100·100·100 · /ar/ **86**·100·100·100 · /en/work/aegis-radar/ **94**·100·100·100 |
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
- **Books Price Intelligence** and **AEGIS**: the filmed versions aren't fully pushed to GitHub (Flask + React Books; IMM code in AEGIS). The case studies say so.
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
