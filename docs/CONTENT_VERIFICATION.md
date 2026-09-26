# Content verification

Every public statement on the site, where it came from, and its status.
Source hierarchy: (1) user documents (CV, certificate PDF) → (2) project source code → (3) GitHub → (4) LinkedIn (read in Chrome, 2026-09-26).

Statuses: **VERIFIED BY PRIMARY SOURCE** (code, official document) · **VERIFIED** (two independent sources agree) · **SINGLE SOURCE** (user's own CV or LinkedIn only — published because it is the owner's own statement) · **CONFLICTING** (shown conservatively) · **OMIT** (not published).

## Identity

| Claim | Source 1 | Source 2 | Status |
|---|---|---|---|
| Name Ahmed Baghouli / أحمد بغولي | CV | LinkedIn, GitHub, Cambridge PDF | VERIFIED |
| Role "Full-stack & AI developer" | LinkedIn headline | GitHub bio ("AI & ML enthusiast… full-stack") | VERIFIED |
| Location: Tunis/Tunisia | LinkedIn (Tunis) | CV (Ariana), GitHub (Tunisia) | VERIFIED — shown as "Tunisia"/"Tunis" |
| Email ahmedbaghoulii@gmail.com | CV | GitHub profile README | VERIFIED (already public) |
| Phone number | CV | — | **OMIT** (private; not needed) |
| GitHub / LinkedIn URLs | CV | browser | VERIFIED |
| Seeking a Master's in AI (NLP + CV), then doctoral research | CV | — | SINGLE SOURCE |
| Chess since 2018; six years of Shotokan karate | CV | — | SINGLE SOURCE |
| "Estimated ~1600" chess strength, "advanced belt" | CV | — | **OMIT** (unnecessary detail) |

## Education

| Claim | Source 1 | Source 2 | Status |
|---|---|---|---|
| Université Sesame, Licence Informatique & Multimédia (L3) | CV | LinkedIn ("Computer Science") | VERIFIED |
| Expected completion | CV: **June 2027** | LinkedIn: **July 2029** | **CONFLICTING** → site shows "2024 — present" only |
| Integrated preparatory cycle MPI, 2024–2026 | CV | — | SINGLE SOURCE |
| Average 11.06 → 13.19/20; ranked 22/72 | CV | — | SINGLE SOURCE |
| Web Tech 2 18.20 (2nd), Python 17.16, DSA2 15.86, Numerical Analysis 15.29 (8th) | CV | — | SINGLE SOURCE |
| Baccalauréat, Computer Science stream, 2024 | CV | — | SINGLE SOURCE |

## Experience

| Claim | Source 1 | Source 2 | Status |
|---|---|---|---|
| Freelance web developer, Cheezy | CV | LinkedIn | VERIFIED |
| Start date | CV: **Jun 2026** | LinkedIn: **Jul 2026** | **CONFLICTING** → shown as "2026 — present" |
| Bilingual storefront, WhatsApp ordering, staff admin with password reset | LinkedIn | code (`cheezy/index.html`: admin login/reset, EN/FR) | VERIFIED BY PRIMARY SOURCE |
| AI assistant: retrieval + Groq + Gemini + Supabase memory | LinkedIn post | code (`cheezy/api/_lib/providers.js`, `knowledge.js`, `memory.js`) | VERIFIED BY PRIMARY SOURCE |
| Produced video content; Remotion + custom HTML/JS motion engine | LinkedIn | files (`cheezy/remotion-ad/out/*.mp4`, `motion-film/render.js`) | VERIFIED BY PRIMARY SOURCE |
| Retained for maintenance + mobile app | CV | LinkedIn post; `cheezy-app/` (Expo 55) | VERIFIED |
| "Three locations" (LinkedIn) | LinkedIn | live site shows 2 shops + "Me Time — coming soon" | Shown as "several shops" |
| Video campaign for a beverage retailer (CV) | CV | — | **OMIT** (no asset or second source found) |
| Sotetel introductory internship, 2025 | CV (Jun 2025, one month) | LinkedIn (Jun–Jul 2025) | VERIFIED — site shows "Jun 2025 — Jul 2025" per LinkedIn |

## Projects

| Claim | Evidence | Status |
|---|---|---|
| AI Eyes: six modes (narration, OCR ar/fr/en, description, object search, banknotes, assistant) | CV + LinkedIn project + LinkedIn post | VERIFIED |
| AI Eyes: double-shake activation, Whisper commands | code: `App.js` (Accelerometer, shake ×35, Whisper ×16) | VERIFIED BY PRIMARY SOURCE |
| AI Eyes: Telegram alert, GPS | code: `App.js` (TELEGRAM, expo-location) | VERIFIED BY PRIMARY SOURCE |
| AI Eyes: "every 30 s for five minutes" | CV | SINGLE SOURCE |
| AI Eyes: Groq Llama models | code: `meta-llama/llama-4-scout-17b-16e-instruct`, `llama-3.3-70b-versatile` | VERIFIED BY PRIMARY SOURCE |
| AI Eyes: YOLOv8n FastAPI server on Railway | code: `server/main.py`, `Dockerfile`; repo `aieyes-backend` description | VERIFIED |
| AI Eyes: >3,000 lines in main module | `App.js` = 3,095 lines | VERIFIED BY PRIMARY SOURCE |
| AI Eyes: defence 17.00/20, ranked 3rd; built solo; eight sprints | CV (+ LinkedIn "designed, built and deployed independently") | VERIFIED (solo) / SINGLE SOURCE (grade, sprints) |
| AI Eyes: project grade 14.70/20 | CV | **OMIT** (defence grade is shown; one grade is enough) |
| AI Eyes: "gap left by Seeing AI, Lookout, Envision" | CV | **OMIT** (competitor claim not independently verified) |
| AI Eyes: "under five seconds", "six tables", "seven APIs" | CV | **OMIT** (not verified in code) |
| AI Eyes: CLAUDE.md mentions Claude vision API | `AIEyes/CLAUDE.md` | **OMIT** — planning doc; code uses Groq/Gemini |
| AEGIS: Kalman filter + 3-mode IMM, NEES/NIS, sweeps | code: `src/aegis/filters.py` (`KalmanFilter`, `IMMEstimator`), `results/summary.json` | VERIFIED BY PRIMARY SOURCE — note: `src/aegis` is **local, not yet pushed**; public repo has `kalman_missile_sim.py`, CI, test, THEORY.md |
| AEGIS: IMM 43.2 m vs raw 79.4 m RMSE (−45.6 %), tuned KF 66.9 m, 100 runs | `results/summary.json` (seed 20260816) | VERIFIED BY PRIMARY SOURCE |
| AEGIS: CI + Monte Carlo regression test | GitHub tree: `.github/workflows/ci.yml`, `tests/test_monte_carlo.py` | VERIFIED BY PRIMARY SOURCE |
| Books: requests/BS4 → pandas → SQLite → Flask → React/TS/Recharts; sklearn LinearRegression | local code + `frontend/package.json` | VERIFIED BY PRIMARY SOURCE |
| Books: stack on GitHub | public repo = Streamlit + Plotly | **CONFLICTING (versions)** → disclosed on the case study |
| Books: polite delay + descriptive User-Agent | `src/scraper.py` (`time.sleep`, `User-Agent`) | VERIFIED BY PRIMARY SOURCE |
| Sandy: 3 agents + planner, Groq `llama-3.3-70b-versatile`, 3-tier fallback, Web Speech API, streaming | README + code (`agents/`, `db/connection.py`) + live `/run` output | VERIFIED BY PRIMARY SOURCE |
| Sandy: Code It Up 6.0 top 5 | CV | SINGLE SOURCE |
| SubwayRunner: Unity 6, URP, Input System, 3 lanes, speed 8→22, 40-unit segments culled behind player | code: `PlayerController.cs` (startSpeed 8, maxSpeed 22), `TrackSpawner.cs` (segmentLength 40) | VERIFIED BY PRIMARY SOURCE |
| SubwayRunner grade 13.09/20 | CV | **OMIT** (not needed) |
| Attendance platform: roles, PHP MVC, MySQL, Flask chatbot, Apache proxy, campus-IP check; 18.20/20, 2nd | CV + GitHub languages (PHP) + LinkedIn post (team, ngrok/proxy) | VERIFIED — shown as a **team** project |
| Caffeine, Bubbleberry, Brew Bliss, aieyes-backend descriptions | each repo's own GitHub description + language stats | VERIFIED |
| Université Sesame website replica "without AI" (CV) | CV | **OMIT** (no repo or asset found) |

## Credentials (18, LinkedIn "Licenses & certifications")

| Credential | Issuer | Date (LinkedIn) | CV | Status |
|---|---|---|---|---|
| Fundamentals of Deep Learning | NVIDIA DLI | Feb 2026 | Feb 2026 | VERIFIED |
| IT Specialist — AI | Pearson/Certiport | Jan 2026 (Credly verified) | Jan 2026 | VERIFIED BY PRIMARY SOURCE |
| AI Engineer for Data Scientists Associate | DataCamp | Jul 2026 | Jul 2026 | VERIFIED |
| Python Data Associate | DataCamp | **Mar 2026** | **Feb 2026** | CONFLICTING (1 month) → LinkedIn date shown |
| EU AI Act Literacy | DataCamp | Jun 2026 | Jun 2026 | VERIFIED |
| CCNA: Introduction to Networks | Cisco | Jun 2026 | Jun 2026 | VERIFIED |
| Python Essentials 1 & 2 | Cisco/OpenEDG | Jun 2026 (Credly verified) | "2025–2026" | VERIFIED BY PRIMARY SOURCE |
| C Essentials 1 | Cisco | Jun 2025 (Credly verified) | "2025–2026" | VERIFIED BY PRIMARY SOURCE |
| B2 First, 176, Grade B; Listening 190 | Cambridge English | Aug 2026 (LinkedIn) / session 25 Jul 2026 (PDF) | ✓ | VERIFIED BY PRIMARY SOURCE (PDF) |
| Aspire Leaders Program; Online Dialogue Facilitation (Soliya) | — | Sep 2026 | Sep 2026 | VERIFIED |
| IBM Prompt Engineering Basics; NASA Open Science Essentials; DataCamp Intro to ChatGPT, Data Literacy, NumPy, GitHub Concepts | — | Jun–Jul 2026 | not on CV | SINGLE SOURCE (LinkedIn) |

Verify links are shown only where the public page was confirmed (4 Credly badges, Cambridge verifier service). The NVIDIA certificate URL resolves to a generic app shell and is therefore not linked. Certificate images/PDFs attached on LinkedIn were **not downloaded** (downloads require explicit permission; see README → "Certificates").

## Translations

French and Arabic copy was written from the verified English source by the build agent (not machine-translated filler). Names of organisations, products and technologies are kept in their original form. **Ahmed should proof-read FR/AR before launch** — especially the About paragraphs and project summaries.

## Anti-hallucination sweep (final)

`grep -rniE "lorem|ipsum|example\.com|john doe|acme|10\+ years|award-winning|top 1%|millions|TODO|FIXME|placeholder" src` (run 2026-09-26) → 8 matches, all the word *placeholder* in the intro-film code (the intentional, replaceable iris placeholder). No lorem ipsum, fake names, fake metrics, invented dates, awards or clients.
