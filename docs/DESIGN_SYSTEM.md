# Design system — version 3: "a person, a photograph, and the work"

**Idea.** The identity is Ahmed Baghouli + his photograph + typography + his work. Everything else was removed if it was decoration: no logo, no fixed painted wallpaper, no sun, no parchment panels, no numbered chapters. The ink-and-air origins remain where they mean something — the painting inside the intro circle and the hero horizon, the air emblem at the centre of the orbit, brush marks on a few interactive details.

Each scene has **one idea and its own rhythm**, and scenes change colour on purpose (paper → storm → indigo → pink → graph-paper black → white → saffron → night blue → warm paper → paper → archive black → white → paper → ink). Critique that led here: [`SECOND_PASS_CRITIQUE.md`](SECOND_PASS_CRITIQUE.md); before/after: [`second-pass/before-after.jpg`](second-pass/before-after.jpg).

## Scenes (home page, in order)

| Scene | Idea | Built from |
|---|---|---|
| Hero | The name is the hero. The photograph is the **o** in *Baghouli* (in Arabic it stands before the surname); the head rises out of the circle. One sentence, one way in, a lot of paper. | `sections/Hero.astro` |
| Introduction | One large circle of painting where the three intro films will play; a sentence and the language choice around it. The hero's *o* **travels here as you scroll** (`scripts/travel.ts`). | `sections/Intro.astro`, `components/IntroFilm.astro` |
| Work | The storm and the orbit as the **index**: six cards around the air emblem, resting then gliding. "Step into …" makes the card **take over the screen** and land in its world (`scripts/takeover.ts`). | `sections/Work.astro`, `scripts/orbit.ts`, `scripts/vortex.ts` |
| Six worlds | One scene per project, in its own palette and from its own material — see below. | `components/World.astro`, `sections/Worlds.astro` |
| About | A photograph: the portrait large in a warm circle, the head above the rim; the sentence crosses into the picture. | `sections/About.astro`, `components/Portrait.astro` |
| Path | A chronology: the years are the architecture (huge, pinned while their entries pass); the two hackathons close it. | `sections/Path.astro` |
| Credentials | An archive: the real documents on a dark desk under a giant **18**. | `sections/Credentials.astro` |
| Capabilities | Information design: every tool from the six stacks, sized by how many projects it built; point at a project and only its tools stay lit. | `sections/Capabilities.astro` |
| GitHub | A typographic index; pointing at a name shows its picture beside the pointer. | `sections/MoreWork.astro` |
| Contact | The last scene, dark and nearly empty: the address as large as the screen allows. | `sections/Contact.astro`, `components/Footer.astro` |

### The worlds

| Project | World | Composition |
|---|---|---|
| AI Eyes | vision — indigo night | the ad fills a full-height column; title with the Arabic name, the "6 modes" metric, the defence result |
| Cheezy | campaign — pink | title across the top, the Remotion film large, the real printed ads overlapping it like a spread |
| AEGIS | science — graph paper | the Kalman gain `K = P Hᵀ S⁻¹` from the code as the headline, the radar film framed on the grid, −45.6 % large, the Joseph-form update as a footnote |
| Books | data — white | a ledger of the actual scraped titles and prices scrolling beside the title (`src/data/books-sample.json`) |
| Sandy AI Lab | energy — saffron | the agents' relay (question → planner → inventory · research → answer) as typography, the interface tilted |
| SubwayRunner | space — night blue | the gameplay on a floor receding in perspective, 8 → 22 units/s |

Case studies open with the same world (`mode="case"`, `h1`), then the story, films, evidence and the next project on a dark band.

## Navigation

No bar. Two corners: the **name** (home) and the **chapter you are in**, which is itself the button that opens a full-screen **index** (native `<dialog>`: focus inside, Escape closes and returns focus) with a preview for each chapter. Languages sit beside it. The corners take the tone of the scene beneath them (`data-tone="light|dark"` on every scene; scroll-spy on a thin line at the top).

## Colour & type

Paper `#f5efe1`, ink `#1f1d1a`, rust `#8e3a12`, saffron `#e0741f`, amber `#efab3c`; each world adds its own palette (indigo, plum/pink, phosphor green, white, saffron, night blue). Type: **Cormorant Garamond** (display; italic used as a voice), **Figtree** (text and small caps), **Noto Naskh Arabic** / **IBM Plex Sans Arabic** (Cormorant stays first in the Arabic display stack so Latin names keep their face).

## Interaction principles

1. Every motion must answer "what does the visitor get?" — the *o* travelling tells you the introduction lives there; the takeover carries you into a project; the capability field answers "what built what".
2. Scrolling is the browser's own; anything tied to scroll is tied to its **position**, never its speed.
3. The orbit rests, then glides; it never reacts to scrolling; the vortex keeps one pace, centred on the emblem.
4. Links are words: `.arrow-link` (a sentence and a line that reaches further), `.link-u` (brush underline). No pill buttons.
5. Reduced motion or the motion switch: nothing travels, nothing takes over, films don't autoplay.

## Media

Films are H.264 MP4 only (`scripts/media/encode-films.mjs`); the orbit plays 960 px cuts. The portrait has 2× versions made locally (Lanczos + a softened cut-out edge, `public/media/profile/*@2x.webp`) — a larger original photograph would still be better.

## Accessibility

One `h1` per page (the name; the project on case pages); scenes are labelled sections; the *o* keeps the heading's text ("Ahmed Baghouli") through a screen-reader-only letter; the ledger and decorative copies are `aria-hidden`; keyboard paths for the index, orbit, rail and lightbox; contrast checked on every scene palette.
