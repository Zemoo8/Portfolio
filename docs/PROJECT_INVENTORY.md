# Project inventory

Discovery pass over `C:\Users\LENOVO\Portfolio` (read-only; no original file was modified), plus GitHub (`gh` CLI and the public profile in Chrome) and LinkedIn (read in Chrome while signed in as the owner). Date: 2026-09-26.

## Root-level assets

| File | What it is | Used on the site |
|---|---|---|
| `CV - English.pdf` | CV, primary source for profile, education, projects, skills | Yes — as a **source**; the PDF itself is not published (it contains a phone number) |
| `English B2 First (Cambridge) Certificate.pdf` | Cambridge Statement of Results (176, Grade B, B2) | Facts only (title, score, date). The PDF is **not** published: it carries a verification number and personal record data |
| `Face Picture.png` / `.jpeg` | The only portrait supplied (432×577, white background) | Yes — cut out, monochrome + colour versions in `public/media/profile/` |
| `Cheezy_TV_16x9.mp4` | 20 s TV spot for Cheezy (storefronts, website walkthrough) | Not used — Cheezy is already represented by recorded films; kept as original |

## Project folders

| Folder | Type | Git remote | Runs locally? | What was captured |
|---|---|---|---|---|
| `AIEyes/` | Android app (React Native 0.81 + Expo 54) + FastAPI/YOLOv8 server | `Zemoo8/AIEyes` | **No** — needs a physical Android device/camera; no emulator image or device available here; an APK exists (`android/app/build/outputs/apk/debug`) but needs Metro + device | Nothing faked. Case study built from verified content; slot `public/media/projects/aieyes/showcase-mobile.mp4` appears automatically when a real recording is dropped in |
| `aieyes-dashboard/` | Next.js 16 family dashboard (Supabase Auth, Leaflet, Tailwind 4) | `Zemoo8/AI-Eyes-dashboard` | Live at `aieyes-dashboard.vercel.app` | Sign-in screen (desktop + mobile). Signed-in views need the owner's credentials and show private family data — deliberately not captured |
| `cheezy/` | Client website (static `index.html` + `menu-data.js` + Vercel functions for chat/menu), Expo app `cheezy-app/`, motion engine `motion-film/`, Remotion project `remotion-ad/`, approved ads `ads/approved/` | `Zemoo8/CheezyWebsite` | Live at `www.cheezy.store`; app demo at `cheezy-app-demo.vercel.app` | Desktop film, mobile film, app film, 6 stills, 3 approved ads, the launch film *Cheezy — What's In It* (`LIVRAISON/Cheezy-Film-II.mp4`) |
| `math.project/` | Python simulation (Kalman + IMM), matplotlib figures, Three.js demo `radar_3d_demo_equations_v2.html` | `Zemoo8/radar-target-tracking-and-missile-interception` | Yes (HTML demo opened directly) | Desktop film of the 3D demo (GPU-rendered), 5 figures from `results/` |
| `scraping book/` | Flask API + React/TS/Recharts frontend over a scraping pipeline | `Zemoo8/scraping-book` | Yes (`backend/app.py`, serves `frontend/dist`) | Desktop film, 5 stills. **Note:** the public repo holds the earlier Streamlit version (disclosed on the site) |
| `sandy-ai-lab/` | FastAPI multi-agent backend + React 19/TanStack Start frontend | `Zemoo8/CodeItUp0.6` | Yes, but the Groq key in `.env` is expired (`AuthenticationError`) | Two desktop stills of the real UI. No chat reply filmed (would require a working key). Mobile layout overflows in this hackathon build — not shown |
| `SubwayRunner/` | Unity 6 (6000.2.7f2) URP game, C# | none | Yes — built to WebGL **from a temporary copy** (original project untouched) | Gameplay film (two real takes edited with a crossfade), 1 still |

## GitHub-only repositories (not in the folder)

| Repo | Used as |
|---|---|
| `gestion-absences-faculte` (+ team copy `Web-Project-FZ`) | "More work": attendance platform, team project (LinkedIn names the teammate) |
| `CaffeineWebsite` (live `caffeine-lake.vercel.app`) | "More work" with live screenshot |
| `bubbleberry-bliss` (live `bubbleberry-bliss.vercel.app`) | "More work" with live screenshot |
| `aieyes-backend` | "More work" and AI Eyes links |
| `brew-bliss-menu-creator` | "More work" |
| `HunterXHunter`, `for-today`, `bobaTEA`, `badge*`, `helooo`, `testing-VIKU-adition`, `skills-introduction-to-github`, `Zemoo8` | Not featured (practice / empty / profile README) |

## Tooling found

Node 24.13, npm 11.8, Python 3.14, ffmpeg 8.1, Playwright 1.61 (Chromium 1228), Unity 6000.2.7f2 with WebGL + Windows build support, Android SDK (no system images/AVDs), `gh` authenticated as `Zemoo8`, `pdftotext`.

## Secrets observed (not copied, not published)

`.env` files exist in `AIEyes/`, `cheezy/`, `sandy-ai-lab/`, `aieyes-dashboard/.env.local`. None were read beyond key *names* (to diagnose Sandy's backend), none were copied into this repository, and none of their values appear in any output.

Machine-readable versions: [`project-matrix.json`](project-matrix.json), [`media-inventory.json`](media-inventory.json), [`content-source-of-truth.json`](content-source-of-truth.json).

## Supplied during the redesign (2026-09-26)

Ahmed uploaded the certificate documents (19 PDFs/images: NVIDIA, Certiport, IBM/Coursera, DataCamp ×8, Cisco ×5, Cambridge statement, Soliya, NASA, Code It Up 5.0) and an Air Nomad emblem reference. The documents were rendered to `assets-source/certificates/` (private, git-ignored) and published only as trimmed WebP images (`public/media/certificates/`). The emblem reference was used as a visual guide; the emblem on the site is re-drawn from geometry (`src/lib/emblem.ts`). No originals were modified or moved.
