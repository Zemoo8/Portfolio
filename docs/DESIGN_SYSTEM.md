# Design system

**Idea:** *perception.* The portfolio's strongest work is about seeing and tracking — AI Eyes narrates the world for blind users, AEGIS follows a target through noise. The visual language borrows from optics and instruments: an iris, apertures, scan lines, reticle ticks — used sparingly, on a quiet, editorial ground. Quiet confidence, cinematic media, engineering precision.

It must still look finished with every animation disabled; motion only choreographs arrival.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0c0c0b` | page ground (warm near-black, not pure black) |
| `--ink-2` / `--ink-3` | `#131312` / `#1b1b19` | raised surfaces, media wells |
| `--paper` | `#ece9e2` | primary text (warm off-white) |
| `--paper-2` | `#c9c5bc` | body copy, secondary text |
| `--muted` | `#8d8980` | labels, meta (≥ 4.5:1 on ink) |
| `--faint` | `#5c5953` | decorative strokes only — never text |
| `--line` / `--line-strong` | paper @ 11 % / 22 % | hairlines, borders |
| `--signal` | `#ff5a26` | the single accent: focus rings, status dots, iris sweep, orbit dot |
| `--tone` | per project | atmosphere only (glows, index numerals) — sampled from each project's own UI |
| `--tone-text` | tone mixed 62 % with paper | tone when used as text, lifted to AA contrast |

The site reads as monochrome; `--signal` appears in small doses; project tones never compete with the project's own media.

## Typography

| Role | Face | Notes |
|---|---|---|
| Display (Latin) | **Instrument Serif** 400 + italic | names, headings, big numbers. Tight tracking (−0.02 to −0.035em), line-height 0.84–0.92 |
| Text / UI | **Geist** (variable) | body, navigation, buttons |
| Labels | **Geist Mono** 400 | kickers, meta, dates; uppercase + 0.08em tracking for kickers |
| Arabic (everything) | **IBM Plex Sans Arabic** 300/400/500 | display at 500 with 300 for the contrast word; line-height 1.1 (display) / 1.8–1.9 (text); no letter-spacing, no uppercase, no italics |

All fonts are self-hosted via `@fontsource` (no third-party requests). Arabic faces are `unicode-range`-scoped, so Latin pages only fetch them for the few Arabic glyphs they contain.

Fluid scale (`--step--1` … `--step-6`) with `clamp()`; the hero name uses its own clamp to fill the left column from 360 px to 2560 px.

## Space & layout

- `--gutter`: 1.1 → 3 rem fluid; `--section`: 6 → 12 rem vertical rhythm; max content width 1680 px.
- Asymmetric compositions: hero 7/4 split, lead projects full-bleed with an overlapping phone, major projects 7/5 alternating, minor projects as a quieter two-column pair. Hierarchy follows substance: flagship work gets space, smaller builds do not pretend otherwise.
- Radii: `4px` media, `14px` stages/cards, `999px` pills; the portrait and social-card portrait use an **arched aperture** (`999px 999px 18px 18px`).

## Motion

| Pattern | Where | Spec |
|---|---|---|
| Line-mask rise | headings (`data-lines`), hero name (`data-onload`) | words grouped into rendered lines, each slides up 105 % → 0, 1.1 s `--ease-out`, 90 ms stagger |
| Reveal | `data-reveal` blocks | opacity 0→1, 24 px rise, 0.9 s, 70 ms stagger via `--i` |
| Aperture | portrait | `clip-path: circle(0 → 80%)`, 1.8 s, then one orange scan pass |
| Parallax | overlapping phones | ±6–10 % of height, rAF-driven |
| Smooth scroll | fine pointers | Lenis, 1.05 s, quartic ease; anchor links routed through it |
| Page change | cross-document | native View Transitions (420 ms), no JS |
| Iris | hero placeholder | 11 k points, sweep 0.55 rad/s, eased pointer look |

`prefers-reduced-motion`: reveals and masks are shown immediately, Lenis/parallax/cursor/depth are off, films never autoplay (poster + play button), the iris renders a single still frame, rings stop.

Above-the-fold content never waits for JavaScript (keeps LCP ≈ 2 s on throttled mobile).

## Media treatment

- **Films** (`Film.astro`): muted, looping, `playsinline`, `preload="none"`; posters and video are fetched only when near the viewport; play/pause button always available (WCAG 2.2.2); pause when off-screen or tab hidden. WebM (VP9) first when smaller, MP4 (H.264, faststart) fallback.
- **Stills** (`Shot.astro`): WebP at full (≤ 1920 w) and half size via `srcset`, intrinsic width/height from `src/data/media-dimensions.json` → no layout shift.
- **Phones**: a thin warm-grey bezel, 2.4 rem radius, deep shadow. Mobile captures always live inside it.
- **Figures** (matplotlib): shown on their original light ground (`--figure`) with `contain`, never cropped.
- **Portrait**: monochrome by default, colour warms in on hover; small (≤ 30 rem) because the source is 432 × 577.
- Hover on project media: inner zoom 1.025 over 1.4 s + tone glow; the cursor becomes a paper disc reading "Open case study".

## Components

`Nav` (fixed, hides on scroll-down, full-screen menu < 960 px) · `IntroFilm` (stage + language tabs + controls) · `ProjectRow` (lead/major/minor) · `Film` · `Shot` · `Portrait` · `Footer`. Sections live in `src/sections/`, one per homepage chapter.

## Interaction principles

1. Every hover effect has a visible, keyboard-reachable equivalent (e.g. the "Open case study" button next to cursor-labelled media).
2. Custom cursor and depth effects exist only for fine pointers.
3. Nothing important is revealed on hover alone.

## Accessibility principles

Semantic landmarks and one `h1` per page; skip link; `:focus-visible` ring in `--signal`; logical CSS properties throughout (RTL is layout, not alignment); arrows mirror in RTL; intro tabs use the ARIA tabs pattern with roving `tabindex` and direction-aware arrow keys; `lang` set per element for mixed-script content; decorative layers `aria-hidden`.

## Breakpoints

Fluid first; structural switches at **960 px** (nav → menu, hero → single column, about → stacked), **900 px** (project rows, case-study columns), **760–800 px** (minor projects, more-work list), **700 px** (credentials single column).
