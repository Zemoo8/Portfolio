# Design system — "Air temple, in ink"

**Idea:** a scroll painted with a Chinese brush (*sumi-e*). Misty daylight over karst peaks, a temple on a crest, an ink sun; the page is parchment, the headings are brushwork, and the one element everything turns around is **air**: the triple-spiral emblem, a smoke vortex at the centre of the work, and a light wind that only exists while you scroll. It should feel hand-made and calm, never like a template, and it must read as finished with every animation off.

## Colour

| Token | Value | Use |
|---|---|---|
| `--paper` / `--paper-2` / `--paper-3` | `#f5efe1` / `#ede5d2` / `#e2d8c1` | page ground, parchment panels, mats (always with `--paper-grain`) |
| `--ink` / `--ink-2` | `#1f1d1a` / `#45413a` | headings, body copy |
| `--muted` | `#66615a` | labels and meta (≥ 4.5 : 1 on paper) |
| `--mist` · `--ash` · `--wash` · `--wash-deep` | `#ebe6da` · `#b8b3a7` · `#6e6a62` · `#3a3732` | the ink-wash greys of the painting; decorative only |
| `--seal` | `#b33c1a` | the vermilion seal (name chop, favicons, numerals) — the only saturated red |
| `--saffron` / `--amber` / `--rust` | `#e0741f` / `#efab3c` / `#8e3a12` | Air-Nomad robes: the silk ribbon on scroll panels, kickers (`--rust` for text), active states |
| `--storm` / `--storm-2` / `--cloud` | `#121413` / `#1d2628` / `#eef0ec` | the dark "storm" chapter where the work orbits; `--cloud` is text on it |

Rule of thumb: ink on paper everywhere, one vermilion seal per view, saffron in thin lines. Project screenshots bring their own colour — the frame around them stays quiet.

## Typography

| Role | Face | Notes |
|---|---|---|
| Display (Latin) | **Cormorant Garamond** 500/600 + italic | name, headings, numerals; calligraphic contrast that sits well next to brushwork |
| Text / UI | **Figtree** (variable) | body, navigation, buttons; kickers uppercase with 0.16em tracking |
| Arabic display | **Noto Naskh Arabic** | headings and the name — Naskh is the natural calligraphic counterpart |
| Arabic text | **IBM Plex Sans Arabic** | body and UI; no letter-spacing, no uppercase, no italics |

All fonts are self-hosted via `@fontsource`; Arabic faces are `unicode-range` scoped. Fluid scale `--step--1 … --step-6` with `clamp()`.

## The painted world (`scripts/art/landscape.mjs`)

A seeded, procedural ink-wash landscape rendered SVG → WebP with sharp (`npm run art`): sky with a vermilion sun, far range, karst spires with mist bands, a temple seated on the central crest, foreground ridges with pines. Brush texture comes from `feTurbulence` + displacement (*cun* strokes, dry-brush edges). Outputs `public/art/{sky,peaks,near}.webp` (2000 w + 1000 w) as transparent parallax layers, plus `gate.webp` (the moon-gate view). Deterministic: same seed, same painting.

## Brushwork (`src/lib/brush.ts`, `Brush.astro`)

Strokes are bundles of bristles (not one path): each bristle wobbles, thins and dries out along the stroke, so edges break up like a real brush. `kind="circle"` paints the **ensō** (moon gate, portrait), `kind="line"` paints underlines and dividers. Paths use `pathLength="1"`, so a stroke *paints itself* when it enters the view (`data-reveal-brush`). Relative path commands keep the HTML small.

## The air emblem (`src/lib/emblem.ts`, `EmblemSymbol.astro`, `Emblem.astro`)

Three tapered Archimedean spiral ribbons with 120° symmetry — the Air Nomad insignia, **re-drawn from geometry in code** (the supplied reference image is not shipped). Defined once per page as an SVG `<symbol>` and reused with `<use>` (nav seal, orbit core, favicons, social cards). Parameters (`turns`, `flare`, `width`, `distance`) live in `defaultEmblem`.
*IP note:* the insignia belongs to the *Avatar: The Last Airbender* franchise. It is used here as a personal, non-commercial homage; if the portfolio is ever used commercially, or to be safe, swap it for an original mark by changing `emblemPath()` — every usage updates.

## Components

| Component | What it is |
|---|---|
| `Backdrop` | fixed painted world: sky · peaks · mist A · near · mist B, wind canvas, mist veil |
| `Nav` | floating parchment pill; the seal turns with reading progress; language pill; motion switch; full-screen menu ≤ 1020 px |
| `IntroFilm` | the **moon gate**: a painted ensō around a circular window onto the temple; the intro films play inside the circle |
| `Seal` | the vermilion chop with the emblem in relief |
| `Work` (storm chapter) | six projects **orbiting the air emblem** over a WebGL smoke vortex; the front card plays its film |
| `Credentials` | a drifting rail of the real certificates, tilted like sheets on a table; filters; opens in `Lightbox` |
| `Portrait` | ink duotone in an arched frame behind a brushed ensō; colour warms in on hover |
| `.scroll` panels | parchment with a saffron silk ribbon; they *unroll* (clip-path) as they arrive |
| `Lightbox` | native `<dialog>`: focus containment, Escape, RTL-aware arrows, focus return |

## Motion

| Pattern | Where | Spec |
|---|---|---|
| Rise out of mist | headings (`data-lines`) | each rendered line rises from a mask while un-blurring, 1.1 s `--ease-out`, 90 ms stagger (Arabic fades as one block — no line splitting) |
| Paint-on | `Brush` strokes | dash offset 1 → 0 per bristle, staggered by bristle |
| Unroll | `.scroll[data-unroll]` | `clip-path` opens top → bottom as the panel enters |
| Depth | painted layers | layers sink at 0.05 / 0.08 / 0.11 × scroll; mist veil thickens (≤ 0.62) as you climb |
| Wind | open sky | ≤ 12 faint ink streaks, drawn only while the page moves |
| Storm | work chapter | `--storm-in` darkens the chapter as it arrives; scroll velocity is published as a *gust* (`window.__air`) that spins the vortex and pushes the orbit |
| Orbit | projects | one revolution per 95 s; drag with inertia and snap; arrow keys; pause button |
| Drift | certificate rail | the track slides ±46 px sideways as it passes |
| Page change | cross-document | native View Transitions |

**Reduced motion** (OS setting) **or the motion switch** (nav, persisted): everything is shown immediately, no parallax/wind/drift/auto-rotation, the vortex renders a single still frame, films don't autoplay.

**Performance rules:** the scroll loop reads layout first and writes second, and does nothing on frames where nothing moved; the orbit skips style writes while paused; the vortex compiles its shader asynchronously (`KHR_parallel_shader_compile`), renders at ~0.5× resolution, and only runs while visible; the painting ships 1000 w/2000 w variants; above-the-fold content never waits for JavaScript.

## Media treatment

- **Films** (`Film.astro`): muted, looping, `playsinline`, `preload="none"`, posters fetched lazily; play/pause always available; paused off-screen. VP9 WebM first when smaller, H.264 MP4 fallback.
- **Stills** (`Shot.astro`): responsive WebP with intrinsic sizes → no layout shift. Shown in paper **mats**; mobile captures in a thin **phone** frame.
- **Certificates:** the real documents (rendered from Ahmed's PDFs or captured from the issuer's page), trimmed, never retouched except to blur the photo on the Cambridge statement.

## Accessibility

One `h1` per page, landmarks, skip link, visible `:focus-visible`; logical CSS properties throughout (RTL is layout, not alignment); keyboard paths for the orbit (focus = bring to front, arrows rotate, mirrored in RTL), the certificate rail and lightbox; line-split headings keep an `aria-label` and hide the fragments; decorative art is `aria-hidden`; text contrast ≥ AA on paper and on the storm.

## Breakpoints

Fluid first; structural switches at **1020 px** (nav → menu), **960 px** (hero → single column), **900 px** (case-study columns), **800 px** (lightbox stacks), **700 px** (orbit tightens: smaller cards, rounder ellipse).
