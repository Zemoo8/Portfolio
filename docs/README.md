# Ahmed Baghouli — portfolio

A trilingual (English · Français · العربية) portfolio built with Astro. Static output, no server, no database, no third-party requests at runtime.

- **Home** `/<lang>/` — hero with the intro-film stage, selected work, about, path, credentials, capabilities, more work, contact.
- **Case studies** `/<lang>/work/<slug>/` — six projects, each with real recorded films and screenshots.
- `/` detects the visitor's language (remembered choice → browser language → English).

## Stack

Astro 7 (static) · TypeScript · plain CSS with design tokens (`src/styles/global.css`) · Lenis (smooth scroll) · Three.js (the hero iris, lazy-loaded) · self-hosted fonts via `@fontsource` · Playwright + ffmpeg + sharp for the media pipeline and QA.

## Commands

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # → dist/
npm run preview      # serve dist/ locally
npm run check        # type-check
```

Requires Node ≥ 22.18 (the OG script imports TypeScript content directly).

## Deploying

The site is static — any static host works.

```bash
SITE_URL=https://your-domain.tld npm run build   # PowerShell: $env:SITE_URL="https://…"; npm run build
```

`SITE_URL` feeds canonical URLs, hreflang, Open Graph URLs and the sitemap. Without it they point at `http://localhost:4321`.

- **Vercel / Netlify / Cloudflare Pages:** build command `npm run build`, output `dist`, env var `SITE_URL`.
- **GitHub Pages:** same build; `dist/404.html` is served for unknown routes automatically.

Deep routes (e.g. `/fr/work/cheezy/`) are real files, so refresh works everywhere.

## Where things live

```
public/
  media/
    intros/            intro-<lang>.mp4 / .webm / .vtt / -poster.webp   ← your three films go here
    projects/<slug>/   showcase films, posters, WebP stills (generated)
    profile/           portrait.webp (mono) + portrait-color.webp
  og/                  social cards (generated)
src/
  content/             ALL personal & project content (profile, projects, path, credentials, capabilities, more-work)
  i18n/                locale config + interface strings
  sections/            one component per homepage chapter
  components/          Nav, IntroFilm, ProjectRow, Film, Shot, Portrait, Footer
  scripts/             motion, films, intro, iris (WebGL)
  pages/               [lang]/index, [lang]/work/[slug], 404, robots.txt, sitemap.xml
assets-source/         untouched copies of source images
assets-generated/      raw captures (PNG) before WebP conversion; qc/ holds review sheets (git-ignored)
scripts/media|og|qa/   capture, conversion, social cards, QA
docs/                  this file + inventory, verification, media, design system, QA report
```

Original project folders (`../AIEyes`, `../cheezy`, …) are only ever **read**.

## Intro films — how to add yours

Place files in `public/media/intros/`, then rebuild/redeploy. Detection happens at build time: a missing film keeps the iris placeholder and is never requested.

| Language | Film | Optional |
|---|---|---|
| English | `intro-en.mp4` | `intro-en.webm`, `intro-en.vtt`, `intro-en-poster.webp` |
| French | `intro-fr.mp4` | `intro-fr.webm`, `intro-fr.vtt`, `intro-fr-poster.webp` |
| Arabic | `intro-ar.mp4` | `intro-ar.webm`, `intro-ar.vtt`, `intro-ar-poster.webp` |

**Recommended:**
- **Frame:** the stage is **4:5 portrait** on desktop and 16:11 on phones, filled with `object-fit: cover`. Shoot 16:9 (1920×1080) with yourself centred and headroom, or deliver 4:5 (1080×1350) directly.
- **Length:** 20–45 s. The film loops silently until the visitor presses *Sound on*, so the first seconds must work without audio.
- **Encoding:** H.264 High, CRF 21–23, `+faststart`, AAC audio 128 kbps. Aim for ≤ 8 MB. Example:
  `ffmpeg -i master.mov -vf "scale=1920:-2" -c:v libx264 -crf 22 -preset slow -movflags +faststart -c:a aac -b:a 128k intro-en.mp4`
- **WebM (optional, smaller):** `ffmpeg -i intro-en.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -c:a libopus intro-en.webm`
- **Captions:** WebVTT (`intro-en.vtt`), same timing as the film. Arabic captions work as-is (the browser renders them RTL). The *Captions* button appears only when a `.vtt` exists.
- **Poster:** a neutral poster is already provided for each language; replace it with a frame from your film (`ffmpeg -ss 2 -i intro-en.mp4 -frames:v 1 -vf scale=1080:-2 intro-en-poster.webp`).

Behaviour once present: muted autoplay (not with reduced motion), loop, `playsinline`, *Sound on / Mute*, *Captions*, *Replay*, and the EN/FR/AR tabs switch films. The page language picks the default film.

## Adding or editing a project

1. Add an entry to `src/content/projects.ts` (all text fields are `{ en, fr, ar }`). `size` controls presentation: `lead` (full-bleed, phone overlay), `major` (side by side), `minor` (compact pair).
2. Media, with the project running:
   - add a scenario to `scripts/media/scenarios.mjs` (films) and/or `stills` entries,
   - `npm run media:films -- <slug>` → `public/media/projects/<slug>/showcase-desktop.mp4/.webm/-poster.webp`,
   - `npm run media:stills -- <slug>` then `npm run media:build` → responsive WebP + dimensions,
   - review: `bash scripts/media/contact-sheet.sh <film.mp4> assets-generated/qc/<name>.jpg`.
3. Films are optional and detected at build time — the page falls back to stills.
4. `npm run build && npm run preview`, then `npm run og` for its social cards, and `npm run media:inventory`.
5. Record the evidence for any new claim in `docs/CONTENT_VERIFICATION.md`.

Known pending media (drop in when available — no code change):
- `public/media/projects/aieyes/showcase-mobile.mp4` (+ `-poster.webp`): a screen recording of the AI Eyes Android app (720×1560 or similar). It appears in the home row and the case study automatically.
- Sandy AI Lab answering a question: renew the Groq key in `sandy-ai-lab/.env`, start both servers, then add a film scenario.

## Translations

Interface strings: `src/i18n/ui.ts`. Content: `src/content/*.ts`. Every field has `en`, `fr`, `ar`. Arabic pages set `dir="rtl"`; layout uses logical CSS properties, so no separate RTL stylesheet exists. Keep technology and organisation names in their original script. **The FR/AR copy should be proof-read by Ahmed.**

## Certificates

Credentials are data in `src/content/credentials.ts` (title, issuer, `YYYY-MM`, optional `verify` URL, optional `highlight`). Add a verify link only after opening it and confirming it shows the credential.
Certificate images/PDFs attached on LinkedIn were **not** downloaded (downloading requires your explicit go-ahead). To show a certificate image, export it yourself, place it in `public/media/certificates/`, and reference it from the credential — do not publish documents that carry personal record numbers you would not share.

## Personal data

`src/content/profile.ts`: name, role, email, links, statement, about paragraphs, languages, interests. The phone number from the CV is intentionally **not** published.

## Regenerating everything

```bash
npm run build && npm run preview       # keep running in another terminal
npm run og                             # social cards + intro posters
npm run qa:a11y && npm run qa:keys && npm run qa:links
MSYS_NO_PATHCONV=1 npm run qa:shots -- /en/ home 360x800 1440x900   # Git Bash on Windows needs MSYS_NO_PATHCONV
```
