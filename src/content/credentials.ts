// Credentials with their actual certificate images (Ahmed's PDFs rendered to WebP, the Aspire
// document captured from LinkedIn, the IBM certificate from its Coursera verify page).
// Titles, issuers and dates were checked against the documents themselves; see
// docs/CONTENT_VERIFICATION.md. Verify links are included only where the page was confirmed.
import type { L } from '../i18n/config';

const a = (en: string, fr: string, ar: string): L => ({ en, fr, ar });

export type Credential = {
  title: string;
  issuer: string;
  date: string; // YYYY-MM (from the certificate)
  image: string; // public/media/certificates/<image>.webp
  verify?: string;
  highlight?: L;
};
export type CredentialGroup = { id: string; name: L; items: Credential[] };

export const credentialGroups: CredentialGroup[] = [
  {
    id: 'ai',
    name: a('AI & data', 'IA & données', 'الذكاء الاصطناعي والبيانات'),
    items: [
      { title: 'Fundamentals of Deep Learning', issuer: 'NVIDIA Deep Learning Institute', date: '2026-02', image: 'nvidia-deep-learning', verify: 'https://learn.nvidia.com/certificates?id=q4cjvt5HRfqvhpkuC6h6Jg' },
      { title: 'IT Specialist — Artificial Intelligence', issuer: 'Certiport · Pearson VUE', date: '2026-01', image: 'certiport-it-specialist-ai', verify: 'https://www.credly.com/badges/0fece2cc-6660-4e91-8634-0de3338fbad5' },
      { title: 'AI Engineer for Data Scientists Associate', issuer: 'DataCamp', date: '2026-07', image: 'datacamp-ai-engineer' },
      { title: 'Python Data Associate', issuer: 'DataCamp', date: '2026-02', image: 'datacamp-python-data-associate' },
      { title: 'Generative AI: Prompt Engineering Basics', issuer: 'IBM · Coursera', date: '2026-07', image: 'ibm-prompt-engineering', verify: 'https://coursera.org/verify/ADF9Q0AUA1KT' },
      { title: 'EU AI Act Literacy', issuer: 'DataCamp', date: '2026-06', image: 'datacamp-eu-ai-act' },
      { title: 'Introduction to ChatGPT', issuer: 'DataCamp', date: '2026-06', image: 'datacamp-intro-chatgpt' },
      { title: 'Data Literacy', issuer: 'DataCamp', date: '2026-06', image: 'datacamp-data-literacy' },
      { title: 'Introduction to NumPy', issuer: 'DataCamp', date: '2026-06', image: 'datacamp-numpy' },
    ],
  },
  {
    id: 'code',
    name: a('Programming & networks', 'Programmation & réseaux', 'البرمجة والشبكات'),
    items: [
      { title: 'CCNA: Introduction to Networks', issuer: 'Cisco Networking Academy', date: '2026-06', image: 'cisco-ccna-itn' },
      { title: 'Python Essentials 2', issuer: 'Cisco Networking Academy · OpenEDG', date: '2026-06', image: 'cisco-python-essentials-2', verify: 'https://www.credly.com/badges/b42b62fc-b754-4ca5-81d2-6acc16039c29' },
      { title: 'Python Essentials 1', issuer: 'Cisco Networking Academy · OpenEDG', date: '2026-06', image: 'cisco-python-essentials-1-course', verify: 'https://www.credly.com/badges/2dfa6f40-311b-4d79-9220-4fdee780ef8d' },
      { title: 'C Essentials 1', issuer: 'Cisco Networking Academy', date: '2025-06', image: 'cisco-c-essentials-1', verify: 'https://www.credly.com/badges/51617809-e02e-4ab4-bf5a-d0d538d557b6' },
      { title: 'Introduction to GitHub Concepts', issuer: 'DataCamp', date: '2026-06', image: 'datacamp-github-concepts' },
    ],
  },
  {
    id: 'people',
    name: a('Language, leadership & science', 'Langue, leadership & science', 'اللغة والقيادة والعلوم'),
    items: [
      {
        title: 'B2 First — Pass at Grade B, 176',
        issuer: 'Cambridge English',
        date: '2026-08', // LinkedIn issue date; the statement shows the exam session (25 July 2026)
        image: 'cambridge-statement-upload',
        verify: 'https://www.cambridgeenglish.org/verifiers/',
        highlight: a('Listening 190 — the top of the scale for this exam', 'Compréhension orale 190 — le maximum de l’échelle pour cet examen', 'الاستماع 190 — أعلى درجة في سلّم هذا الامتحان'),
      },
      { title: '2026 Aspire Leaders Program', issuer: 'Aspire Institute', date: '2026-09', image: 'aspire-leaders' },
      { title: 'Introduction to Online Dialogue Facilitation', issuer: 'Soliya', date: '2026-09', image: 'soliya-dialogue-facilitation' },
      { title: 'Open Science Essentials', issuer: 'NASA', date: '2026-07', image: 'nasa-open-science' },
    ],
  },
];

export const credentialCount = credentialGroups.reduce((n, g) => n + g.items.length, 0);

/** The Code It Up 5.0 certificate of competition (shown with the competitions). */
export const competitionCertificate = { title: 'Code It Up 5.0 — Certificate of competition', issuer: 'IEEE ISET Bizerte Student Branch', image: 'code-it-up-5' };
