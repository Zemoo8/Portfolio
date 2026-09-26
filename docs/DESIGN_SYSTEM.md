# Design system — "Air temple, in ink"

**Idea:** a scroll painted with a Chinese brush (*sumi-e*). Misty daylight over karst peaks, a temple on a crest, an ink sun; the page is parchment, the headings are brushwork, and the one element everything turns around is **air**: the triple-spiral emblem at the heart of the work, a smoke vortex, and mist that drifts past the peaks. **The interface itself is painted** — buttons are brush swashes, links and active states are brush strokes, arrows are drawn — so nothing looks like a template pill. It must feel calm and predictable, and read as finished with every animation off.

## Colour

| Token | Value | Use |
|---|---|---|
| `--paper` / `--paper-2` / `--paper-3` | `#f5efe1` / `#ede5d2` / `#e2d8c1` | page ground, parchment panels, mats (always with `--paper-grain`) |
| `--ink` / `--ink-2` | `#1f1d1a` / `#45413a` | headings, body copy |
| `--muted` | `#66615a` | labels and meta (≥ 4.5 : 1 on paper) |
| `--mist` · `--ash` · `--wash` · `--wash-deep` | `#ebe6da` · `#b8b3a7` · `#6e6a62` · `#3a3732` | the ink-wash greys of the painting; decorative only |
| `--seal` | `#b33c1a` | vermilion: the brush dash that leads each tag, numerals — the only saturated red (the seal *logo* was removed) |
| `--saffron` / `--amber` / `--rust` | `#e0741f` / `#efab3c` / `#8e3a12` | Air-Nomad robes: the silk ribbon on scroll panels, kickers (`--rust` for text), active states |
| `--storm` / `--storm-2` / `--cloud` | `#121413` / `#1d2628` / `#eef0ec` | the dark "storm" chapter where the work orbits; `--cloud` is text on it |

Rule of thumb: ink on paper everywhere, vermilion and saffron only in thin brush marks. Project screenshots bring their own colour — the frame around them stays quiet.

## Typography

| Role | Face | Notes |
|---|---|---|
| Display (Latin) | **Cormorant Garamond** 500/600 + italic | name, headings, numerals; calligraphic contrast that sits well next to brushwork |
| Text / UI | **Figtree** (variable) | body, navigation, buttons; kickers uppercase with 0.16em tracking |
| Arabic display | **Noto Naskh Arabic** (after Cormorant in the stack) | headings and the name — Naskh is the natural calligraphic counterpart; Latin names on Arabic pages (projects, tools) stay in Cormorant |
| Arabic text | **IBM Plex Sans Arabic** | body and UI; no letter-spacing, no uppercase, no italics |

All fonts are self-hosted via `@fontsource`; Arabic faces are `unicode-range` scoped. Fluid scale `--step--1 … --step-6` with `clamp()`.

## The painted world (`scripts/art/landscape.mjs`)

A seeded, procedural ink-wash landscape rendered SVG → WebP with sharp (`npm run art`): sky with a vermilion sun, far range, karst spires with mist bands, a temple seated on the central crest, foreground ridges with pines. Brush texture comes from `feTurbulence` + displacement (*cun* strokes, dry-brush edges). Outputs `public/art/{sky,peaks,near}.webp` (2000 w + 1000 w) as transparent parallax layers, plus `gate.webp` (the moon-gate view). Deterministic: same seed, same painting.

## Brushwork (`src/lib/brush.ts`, `Brush.astro`)

Strokes are bundles of bristles (not one path): each bristle wobbles, thins and dries out along the stroke, so edges break up like a real brush. `kind="circle"` paints the **ensō** (moon gate, portrait), `kind="line"` paints underlines and dividers. Paths use `pathLength="1"`, so a stroke *paints itself* when it enters the view (`data-reveal-brush`). Relative path commands keep the HTML small.

## Ink marks (`scripts/art/ink-marks.mjs` → `public/ink/`)

Seven brush marks drawn with the same bristle engine, given a directional "fibre" displacement so their edges break up like a dry brush, then **baked to small PNG alpha masks** (1–18 KB; an SVG with `feTurbulence` used as a mask is re-rasterised at every size and cost ~0.7 s of main thread on a busy page). CSS paints any colour through them with `mask`:

| Mark | Used for |
|---|---|
| `swash` | primary button (`.btn`): the label sits on a loaded brush swash with a solid core (AA contrast); hover re-inks it in rust. `.btn--cloud` is the same stroke in cloud-white on the storm |
| `under` | brush underline: secondary button (`.btn--ghost`), text links (`.link-u`), active nav chapter, active filter / film language / orbit station, reading progress |
| `ring` | a small ensō around the active language, the film play/pause toggle, the case-study note |
| `arrow`, `cross` | `.ibtn` prev / next / close (mirrored in CSS for "previous" and RTL) |
| `dash` | leads every kicker and every tag (`.pill` is now small caps + a vermilion dash — no chips) |
| `edge` | the torn bottom edge of the header's paper band |

## The air emblem (`src/lib/emblem.ts`, `EmblemSymbol.astro`, `Emblem.astro`)

Three tapered Archimedean spiral ribbons with 120° symmetry — the Air Nomad insignia, **re-drawn from geometry in code** (the supplied reference image is not shipped). It now appears only where it means something: the spinning core of the work orbit. The red seal (square chop + emblem) was removed everywhere as a logo; favicons are a brushed ensō (`scripts/art/favicon.mjs`). Parameters (`turns`, `flare`, `width`, `distance`) live in `defaultEmblem`.
*IP note:* the insignia belongs to the *Avatar: The Last Airbender* franchise. It is used here as a personal, non-commercial homage; if the portfolio is ever used commercially, or to be safe, swap it for an original mark by changing `emblemPath()` — every usage updates.

## Components

| Component | What it is |
|---|---|
| `Backdrop` | fixed painted world: sky · peaks · breeze · mist A · near · mist B, mist veil — each layer in a depth wrapper |
| `Nav` | a masthead, not a pill: typographic wordmark (no logo), chapters numbered like a table of contents with a brush stroke under the one you are reading (scroll-spy), languages with a brushed ensō around the current one; after scrolling, a paper band with a torn edge slides in and a rust stroke along it paints the reading progress |
| `IntroFilm` | the **moon gate**: a painted ensō around a circular window onto the temple; the intro films play inside the circle. Until they exist, the label hangs vertically beside the gate like a scroll's title slip (in Arabic and on phones it is the caption's first line) |
| `Work` (storm chapter) | six projects **orbiting the air emblem** over a WebGL smoke vortex; the front card plays its film. Below: a chapter plate (outlined italic numeral behind the title, italic tagline, cloud-white swash), brush arrows around an `01 / 06` counter, and the six projects as a station index |
| `Credentials` | a rail of the real certificates, tilted like sheets on a table; word filters with an italic count; opens in `Lightbox` |
| `Portrait` | the photo inside the moon gate itself: a round window framed by the painted ensō, the ink landscape behind the shoulders; opens like an iris; colour warms in on hover |
| `.scroll` panels | parchment with a saffron silk ribbon; they *unroll* (clip-path) as they arrive |
| `Lightbox` | native `<dialog>`: focus containment, Escape, RTL-aware arrows, focus return |

## Motion

| Pattern | Where | Spec |
|---|---|---|
| Rise out of mist | headings (`data-lines`) | each rendered line rises from a mask while un-blurring, 1.1 s `--ease-out`, 90 ms stagger (Arabic fades as one block — no line splitting) |
| Paint-on | `Brush` strokes | dash offset 1 → 0 per bristle, staggered by bristle |
| Unroll | `.scroll[data-unroll]` | `clip-path` opens top → bottom as the panel enters |
| Depth | painted layers | CSS scroll-driven animation: layers sink at 0.05 / 0.065 / 0.08 / 0.11 of the first 220vh; mist veil thickens (≤ 0.62) over the first 100vh |
| Wind | open sky | ambient and time-based: three soft mist wisps cross the sky at a constant pace (95–150 s), mist banks breathe sideways — the same whether or not you scroll |
| Reading | header | the seal is gone; a rust brush stroke paints across the header's torn edge with scroll position |
| Orbit | projects | one calm revolution per 95 s; it never reacts to page scrolling; drag with inertia and snap; arrow keys; pause |
| Page change | cross-document | the next page is painted in: a brush swash grows from the centre until it covers the view (View Transitions + mask) |

**Scrolling is the browser's own** (no smooth-scroll library, no inertia). Nothing responds to scroll *speed*; everything that follows the scroll is a function of scroll *position*, run by the compositor, so the same place on the page always looks the same.

**Reduced motion** (OS setting) **or the motion switch** (nav, persisted): everything is shown immediately, no parallax/wind/drift/auto-rotation, the vortex renders a single still frame, films don't autoplay.

**Performance rules:** no per-frame scroll JavaScript (scroll-driven CSS; timelines kept out of the `animation` shorthand so minifiers can't fold them into a form browsers reject); the orbit skips style writes while paused; the vortex compiles its shader asynchronously (`KHR_parallel_shader_compile`), renders at ~0.5× resolution, and only runs while visible; ink marks are baked PNG masks; the painting ships 1000 w/2000 w variants; above-the-fold content never waits for JavaScript.

## Media treatment

- **Films** (`Film.astro`): muted, looping, `playsinline`, `preload="none"`, posters fetched lazily; play/pause (inside a small brushed ensō) always available; paused off-screen. **H.264 MP4 only** (`scripts/media/encode-films.mjs`): the VP9 WebMs made from screen captures failed to decode in Chrome after the first frame, and a failure at that point never falls back to MP4. Produced films carry their own credit line (e.g. "Film made for the client").
- **Stills** (`Shot.astro`): responsive WebP with intrinsic sizes → no layout shift. Shown in paper **mats**; mobile captures in a thin **phone** frame.
- **Certificates:** the real documents (rendered from Ahmed's PDFs or captured from the issuer's page), trimmed, never retouched except to blur the photo on the Cambridge statement.

## Accessibility

One `h1` per page, landmarks, skip link, visible `:focus-visible`; logical CSS properties throughout (RTL is layout, not alignment); keyboard paths for the orbit (focus = bring to front, arrows rotate, mirrored in RTL), the certificate rail and lightbox; line-split headings keep an `aria-label` and hide the fragments; decorative art is `aria-hidden`; text contrast ≥ AA on paper and on the storm.

## Breakpoints

Fluid first; structural switches at **1020 px** (nav → menu), **960 px** (hero → single column), **900 px** (case-study columns), **800 px** (lightbox stacks), **700 px** (orbit tightens: smaller cards, rounder ellipse).
