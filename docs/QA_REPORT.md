# QA report — 2026-09-26

Environment: Windows 11, Node 24.13, Astro 7.3.5 static build served by `astro preview`; Chromium 1228 via Playwright 1.61 (headless, GPU via ANGLE/D3D11 where WebGL was involved); Lighthouse 12.

## Summary

| Area | Result |
|---|---|
| Type check (`astro check`) | 0 errors, 0 warnings (49 files) |
| Build | 23 pages (3 locales × home + 6 case studies, root redirect, 404), robots.txt, sitemap.xml |
| Runtime errors | none on any page (console/pageerror monitored in every screenshot run) |
| Internal links | 91 targets, 0 broken |
| External links | 22 checked, 0 failing (LinkedIn returns 999 to bots — expected) |
| Accessibility (axe-core, WCAG 2.2 AA + best practice) | 0 violations on /en/, /fr/, /ar/, 3 case studies, 404 |
| Lighthouse (mobile, simulated throttling) | /en/ **96**·100·100·100 · /ar/ **97**·100·100·100 · /en/work/cheezy/ 99·100·100·100 · /fr/work/aegis-radar/ 99·100·100·100 (Perf·A11y·BP·SEO) |
| Core vitals (Lighthouse lab) | LCP 1.7–2.3 s, CLS 0–0.017, TBT 0–60 ms |

## Tests performed

**Visual** — full-page screenshots after scrolling (so reveals fire) at 360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 for `/en/`; 1440×900 + 390×844 for `/ar/`; case studies at 1440×900 and 390×844 (EN, FR). Reviewed by eye.

**Functional** — language switcher (keeps page and hash, persists choice), root language detection, mobile menu (open/close, Escape, focus return), intro tabs (click + arrow keys, mirrored in RTL), intro film pathway tested end-to-end with a temporary stand-in film + VTT (video replaced the iris, autoplayed muted, caption track loaded, controls shown; the other languages kept the placeholder; files removed afterwards), film play/pause buttons, copy-email button, deep-route refresh (every route is a real file), 404.

**Keyboard** — skip link is the first stop; every stop shows a visible focus ring; order follows the visual order in LTR and RTL; intro tabs use a roving tabindex.

**Modes** — reduced motion: no hidden content, films don't autoplay, iris renders one still frame. JavaScript disabled: all text visible, layout intact, films available through native controls.

## Issues found and fixed

| Issue | Fix |
|---|---|
| Hero name "g" descender clipped by the reveal mask | extra mask padding on the hero name |
| Hero composition left the top-right empty and pushed film/statement below the fold | re-gridded: name + statement left, 4:5 film stage right |
| Intro stage collapsed to 0 width | explicit width tied to viewport height |
| Iris too faint / too large | brighter fibres, larger points, camera distance per aspect |
| Duplicate "Intro film" label | bottom bar now reads "Film language" |
| Phone overlay on lead rows covered the next row's meta/title | reduced overhang, text offset on desktop only |
| Cheezy case study: 3 media in a 2-column grid made one phone huge | fixed-width phones + fluid wide film |
| Focusable play button inside an `aria-hidden` link | media is a div with a separate click layer; button stays reachable |
| Hover zoom created a stacking context that trapped the play button | zoom moved to the inner img/video |
| Contrast: brown project tone on dark (Books) and placeholder labels | `--tone-text` (tone mixed with paper), muted labels |
| `--tone-text` resolved at `:root` (all projects got the same tone) | re-declared wherever a tone is set inline |
| LCP 5.3 s: hero statement waited for JS reveal | above-the-fold content renders without JS → LCP 2.2 s |
| ~310 KB of film posters loaded at start | posters fetched when films approach the viewport |
| Intro film probe caused a console 404 | detection moved to build time; missing films are never requested |
| 404 page language links pointed at non-existent `/xx/404/` | point to locale homes; 404 is `noindex` |
| Radar/SubwayRunner films 5 MB+ | re-encoded at 1440 px; oversized SubwayRunner WebM dropped (MP4 smaller) |

## Remaining limitations

- **AI Eyes app footage** is not included: the Android app needs a physical device; no emulator system image or device was available. The slot `public/media/projects/aieyes/showcase-mobile.mp4` is wired and appears automatically.
- **Sandy AI Lab** is shown without an AI answer: the project's Groq key is expired.
- **Books Price Intelligence**: the filmed Flask + React version isn't pushed to GitHub yet (the site says so). Same for the IMM code in AEGIS (`src/aegis`).
- **Cross-browser**: automated runs used Chromium only. Firefox and Safari were not run here. The code avoids engine-specific APIs (except the optional View Transitions and `:has()`, both progressive), but a manual pass on Safari iOS and Firefox is recommended before launch.
- **Real devices**: no physical-phone test; mobile checks are emulated (touch + mobile viewport).
- **Translations**: FR/AR copy should be proof-read by Ahmed.
- **Canonical domain**: set `SITE_URL` at build time; until then canonical/OG URLs point to localhost.
- **Portrait resolution**: the only supplied photo is 432×577; it's displayed at ≤ 30 rem to stay sharp. A higher-resolution portrait would allow a larger treatment.
- The iris fibres read faintly on small 1× screens (the sweep carries the effect) — acceptable, noted.

## Reproduce

```bash
npm run build && npm run preview          # terminal 1
npm run qa:a11y; npm run qa:keys; npm run qa:links
MSYS_NO_PATHCONV=1 npm run qa:shots -- /en/ home 360x800 390x844 768x1024 1024x768 1440x900 1920x1080
npx lighthouse http://localhost:4321/en/ --only-categories=performance,accessibility,best-practices,seo
```
