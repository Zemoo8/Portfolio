// Source: LinkedIn "Licenses & certifications" (18 entries, read 2026-09-26),
// cross-checked with the CV and, for Cambridge, the Statement of Results PDF.
// Verify links are included only where the public page was confirmed to resolve.
import type { L } from '../i18n/config';

const a = (en: string, fr: string, ar: string): L => ({ en, fr, ar });

export type Credential = { title: string; issuer: string; date: string; verify?: string; highlight?: L };
export type CredentialGroup = { name: L; items: Credential[] };

export const credentialGroups: CredentialGroup[] = [
  {
    name: a('AI & data', 'IA & données', 'الذكاء الاصطناعي والبيانات'),
    items: [
      { title: 'Fundamentals of Deep Learning', issuer: 'NVIDIA Deep Learning Institute', date: '2026-02' },
      { title: 'IT Specialist — Artificial Intelligence', issuer: 'Pearson / Certiport', date: '2026-01', verify: 'https://www.credly.com/badges/0fece2cc-6660-4e91-8634-0de3338fbad5' },
      { title: 'AI Engineer for Data Scientists Associate', issuer: 'DataCamp', date: '2026-07' },
      { title: 'Python Data Associate', issuer: 'DataCamp', date: '2026-03' },
      { title: 'EU AI Act Literacy', issuer: 'DataCamp', date: '2026-06' },
      { title: 'Generative AI: Prompt Engineering Basics', issuer: 'IBM', date: '2026-07' },
      { title: 'Introduction to ChatGPT', issuer: 'DataCamp', date: '2026-06' },
      { title: 'Data Literacy', issuer: 'DataCamp', date: '2026-06' },
      { title: 'Introduction to NumPy', issuer: 'DataCamp', date: '2026-06' },
    ],
  },
  {
    name: a('Programming & networks', 'Programmation & réseaux', 'البرمجة والشبكات'),
    items: [
      { title: 'CCNA: Introduction to Networks', issuer: 'Cisco Networking Academy', date: '2026-06' },
      { title: 'Python Essentials 2', issuer: 'Cisco / OpenEDG Python Institute', date: '2026-06', verify: 'https://www.credly.com/badges/b42b62fc-b754-4ca5-81d2-6acc16039c29' },
      { title: 'Python Essentials 1', issuer: 'Cisco / OpenEDG Python Institute', date: '2026-06', verify: 'https://www.credly.com/badges/2dfa6f40-311b-4d79-9220-4fdee780ef8d' },
      { title: 'C Essentials 1', issuer: 'Cisco Networking Academy', date: '2025-06', verify: 'https://www.credly.com/badges/51617809-e02e-4ab4-bf5a-d0d538d557b6' },
      { title: 'Introduction to GitHub Concepts', issuer: 'DataCamp', date: '2026-06' },
    ],
  },
  {
    name: a('Language, leadership & science', 'Langue, leadership & science', 'اللغة والقيادة والعلوم'),
    items: [
      {
        title: 'B2 First — Pass at Grade B, 176',
        issuer: 'Cambridge English',
        date: '2026-08',
        verify: 'https://www.cambridgeenglish.org/verifiers/',
        highlight: a('Listening 190 — the top of the Cambridge English Scale for this exam', 'Compréhension orale 190 — le maximum de l’échelle Cambridge pour cet examen', 'الاستماع 190 — أعلى درجة في سلّم كامبريدج لهذا الامتحان'),
      },
      { title: '2026 Aspire Leaders Program', issuer: 'Aspire Institute', date: '2026-09' },
      { title: 'Introduction to Online Dialogue Facilitation', issuer: 'Soliya', date: '2026-09' },
      { title: 'Open Science Essentials', issuer: 'NASA', date: '2026-07' },
    ],
  },
];

export const credentialCount = credentialGroups.reduce((n, g) => n + g.items.length, 0);
