// Writes docs/project-matrix.json and docs/content-source-of-truth.json.
import fs from 'node:fs';
const { projects } = await import('../../src/content/projects.ts');

const local = {
  'ai-eyes': { folder: 'AIEyes/ + aieyes-dashboard/', type: 'mobile application + web dashboard + API', runnable: 'dashboard live; app needs device', captured: 'dashboard sign-in stills' },
  cheezy: { folder: 'cheezy/', type: 'client website + mobile app + motion', runnable: 'live', captured: '3 films + launch film + stills + ads' },
  'radar-interceptor': { folder: 'math.project/', type: 'scientific simulation', runnable: 'yes (HTML demo)', captured: 'film + figures' },
  'books-intelligence': { folder: 'scraping book/', type: 'data pipeline + web app', runnable: 'yes (Flask)', captured: 'film + stills' },
  'sandy-ai-lab': { folder: 'sandy-ai-lab/', type: 'multi-agent API + web app', runnable: 'yes; LLM key expired', captured: 'stills' },
  'subway-runner': { folder: 'SubwayRunner/', type: '3D game (Unity)', runnable: 'yes (WebGL build of a copy)', captured: 'gameplay film + still' },
};
fs.writeFileSync('docs/project-matrix.json', JSON.stringify(projects.map((p) => ({
  slug: p.slug, title: p.title, tier: p.size, year: p.year, ...local[p.slug],
  stack: p.stack, links: p.links.map((l) => l.href), films: p.film ?? {}, stills: [p.cover.src, ...p.gallery.map((g) => g.src)],
})), null, 1));

const C = (field, value, source, file, evidence, status, confidence, notes = '') => ({ field, value, source, source_url_or_file: file, evidence, verification_status: status, confidence, notes });
const CV = 'CV - English.pdf', LI = 'https://www.linkedin.com/in/ahmed-baghouli-b8199b330/', GH = 'https://github.com/Zemoo8';
const rows = [
  C('name', 'Ahmed Baghouli', 'CV + LinkedIn + GitHub + Cambridge PDF', CV, 'identical in all four', 'VERIFIED', 'high'),
  C('headline', 'Full-stack & AI developer', 'LinkedIn', LI, 'headline "Full-Stack & AI Developer | Creator of AI-Eyes & Cheezy.store"', 'VERIFIED', 'high'),
  C('location', 'Tunisia (Tunis)', 'LinkedIn + CV + GitHub', LI, 'Tunis (LinkedIn), Ariana (CV), Tunisia (GitHub)', 'VERIFIED', 'high'),
  C('email', 'ahmedbaghoulii@gmail.com', 'CV + GitHub README', CV, 'published on both', 'VERIFIED', 'high'),
  C('phone', '(withheld)', 'CV', CV, '', 'OMIT', 'high', 'private'),
  C('education.institution', 'Université Sesame', 'CV + LinkedIn', CV, '', 'VERIFIED', 'high'),
  C('education.programme', 'Licence Informatique & Multimédia (L3)', 'CV', CV, '', 'VERIFIED', 'high', 'LinkedIn says "Computer Science"'),
  C('education.end', '2027-06 (CV) vs 2029-07 (LinkedIn)', 'CV / LinkedIn', CV, 'sources disagree', 'CONFLICTING', 'medium', 'site shows "2024 — present"'),
  C('education.mpi', 'Integrated preparatory cycle MPI 2024–2026; 22/72', 'CV', CV, '', 'SINGLE SOURCE', 'medium'),
  C('experience.cheezy.start', '2026-06 (CV) vs 2026-07 (LinkedIn)', 'CV / LinkedIn', LI, '', 'CONFLICTING', 'medium', 'site shows "2026 — present"'),
  C('experience.cheezy.scope', 'storefront, WhatsApp ordering, admin, RAG chatbot, video', 'LinkedIn + code', 'cheezy/index.html; cheezy/api/_lib/*', 'admin login/reset in index.html; Groq/Gemini/Supabase in api/_lib', 'VERIFIED BY PRIMARY SOURCE', 'high'),
  C('experience.sotetel', 'Introductory internship, Jun–Jul 2025', 'LinkedIn + CV', LI, 'CV: Jun 2025 one month', 'VERIFIED', 'high'),
  C('project.aieyes.stack', 'React Native, Expo, FastAPI, YOLOv8n, Groq Llama, Whisper, Supabase, Next.js', 'code', 'AIEyes/package.json; App.js; server/main.py', 'imports and model ids in source', 'VERIFIED BY PRIMARY SOURCE', 'high'),
  C('project.aieyes.defence', '17.00/20, ranked 3rd', 'CV', CV, '', 'SINGLE SOURCE', 'medium'),
  C('project.aieyes.loc', '>3,000 lines in main module', 'code', 'AIEyes/App.js', 'wc -l = 3095', 'VERIFIED BY PRIMARY SOURCE', 'high'),
  C('project.radar.imm_rmse', 'IMM 43.22 m vs raw 79.44 m (−45.6 %), 100 runs', 'code output', 'math.project/results/summary.json', 'results[] rows', 'VERIFIED BY PRIMARY SOURCE', 'high', 'src/aegis not yet pushed to GitHub'),
  C('project.radar.ci', 'GitHub Actions + Monte Carlo test', 'GitHub', 'https://github.com/Zemoo8/radar-target-tracking-and-missile-interception', '.github/workflows/ci.yml, tests/test_monte_carlo.py', 'VERIFIED BY PRIMARY SOURCE', 'high'),
  C('project.books.stack', 'Flask + React/TS/Recharts (local) / Streamlit (public repo)', 'code + GitHub', 'scraping book/; github.com/Zemoo8/scraping-book', 'app.py differs between versions', 'CONFLICTING', 'high', 'disclosed on case study'),
  C('project.sandy.result', 'Code It Up 6.0 top 5', 'CV', CV, '', 'SINGLE SOURCE', 'medium'),
  C('project.sandy.stack', 'FastAPI, Groq llama-3.3-70b-versatile, React 19, TanStack Start', 'code + README', 'sandy-ai-lab/README.md; main.py', '', 'VERIFIED BY PRIMARY SOURCE', 'high'),
  C('project.subway.speeds', 'startSpeed 8, maxSpeed 22, segment 40', 'code', 'SubwayRunner/Assets/Scripts/PlayerController.cs; TrackSpawner.cs', '', 'VERIFIED BY PRIMARY SOURCE', 'high'),
  C('project.attendance', 'team project, 18.20/20 (2nd)', 'CV + LinkedIn post + GitHub', 'https://github.com/Zemoo8/gestion-absences-faculte', 'LinkedIn post names teammate', 'VERIFIED', 'high'),
  C('cert.cambridge', 'B2 First, 176, Grade B, Listening 190', 'PDF', 'English B2 First (Cambridge) Certificate.pdf', 'Statement of Results', 'VERIFIED BY PRIMARY SOURCE', 'high', 'PDF not published'),
  C('cert.count', '18', 'LinkedIn', `${LI}details/certifications/`, 'list read in Chrome', 'VERIFIED', 'high'),
  C('cert.python_data_associate.date', '2026-03 (LinkedIn) vs 2026-02 (CV)', 'LinkedIn / CV', LI, '', 'CONFLICTING', 'medium', 'LinkedIn date shown'),
  C('claim.beverage_campaign', 'video campaign for a beverage retailer', 'CV', CV, 'no asset found', 'OMIT', 'low'),
  C('claim.competitor_gap', 'Seeing AI / Lookout / Envision lack Arabic', 'CV', CV, 'not independently verified', 'OMIT', 'low'),
  C('claim.sesame_replica', 'Université Sesame website replica', 'CV', CV, 'no repo or asset found', 'OMIT', 'low'),
  C('languages', 'Arabic native; English B2 (176); French B1', 'CV + Cambridge PDF', CV, '', 'VERIFIED', 'high'),
  C('github.profile', 'Zemoo8', 'GitHub', GH, 'profile README featured projects match site', 'VERIFIED', 'high'),
];
fs.writeFileSync('docs/content-source-of-truth.json', JSON.stringify(rows, null, 1));
console.log(rows.length, 'claims;', projects.length, 'projects');
