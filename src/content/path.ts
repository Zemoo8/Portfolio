// Experience, education and competitions. Dates follow LinkedIn where CV and LinkedIn
// disagree only by granularity; genuine conflicts are shown conservatively (year only)
// and logged in docs/CONTENT_VERIFICATION.md.
import type { L } from '../i18n/config';

const a = (en: string, fr: string, ar: string): L => ({ en, fr, ar });

export type Entry = {
  org: string;
  role: L;
  start: string; // YYYY or YYYY-MM
  end?: string | 'present';
  place: L;
  body: L[];
  tags?: string[];
  link?: { href: string; text: string };
};

export const experience: Entry[] = [
  {
    org: 'Cheezy',
    role: a('Freelance web developer', 'Développeur web freelance', 'مطوّر ويب مستقل'),
    start: '2026',
    end: 'present',
    place: a('Bizerte, Tunisia · hybrid', 'Bizerte, Tunisie · hybride', 'بنزرت، تونس · عمل هجين'),
    body: [
      a('Sourced the client through direct outreach to local businesses and delivered cheezy.store as a paid engagement: bilingual storefront, WhatsApp ordering flow, staff admin and AI assistant.',
        'Client obtenu par prospection directe auprès des commerces locaux ; livraison de cheezy.store dans le cadre d’une mission rémunérée : vitrine bilingue, commande via WhatsApp, espace d’administration et assistant IA.',
        'حصلت على العميل بالتواصل المباشر مع المحلات المحلية، وسلّمت cheezy.store في إطار عمل مدفوع: واجهة ثنائية اللغة، ومسار طلب عبر واتساب، ولوحة إدارة، ومساعد ذكي.'),
      a('Produced the video content used on the site and social channels; retained for ongoing maintenance and a follow-on mobile app.',
        'Réalisation des vidéos utilisées sur le site et les réseaux sociaux ; toujours en charge de la maintenance et d’une application mobile.',
        'أنتجت محتوى الفيديو المستخدم في الموقع وقنوات التواصل، وما زلت مكلّفًا بالصيانة وبتطبيق جوّال لاحق.'),
    ],
    tags: ['Web', 'AI', 'Video'],
    link: { href: 'https://www.cheezy.store', text: 'cheezy.store' },
  },
  {
    org: 'Sotetel',
    role: a('Introductory internship', 'Stage d’initiation', 'تربّص تمهيدي'),
    start: '2025-06',
    end: '2025-07',
    place: a('Tunis, Tunisia', 'Tunis, Tunisie', 'تونس العاصمة، تونس'),
    body: [
      a('Placement at a Tunisian telecommunications operator.',
        'Stage au sein d’un opérateur tunisien de télécommunications.',
        'تربّص لدى مشغّل اتصالات تونسي.'),
    ],
    tags: ['Flask', 'Packet Tracer'],
  },
];

export const education: Entry[] = [
  {
    org: 'Université Sesame',
    role: a('Licence in Computer Science & Multimedia (L3)', 'Licence en Informatique & Multimédia (L3)', 'الإجازة في الإعلامية والملتيميديا (السنة الثالثة)'),
    start: '2024',
    end: 'present',
    place: a('Ariana, Tunisia', 'Ariana, Tunisie', 'أريانة، تونس'),
    body: [
      a('Preceded by two years of the integrated preparatory cycle MPI (Mathematics, Physics, Computer Science), 2024–2026: annual average rising from 11.06 to 13.19/20, ranked 22nd of 72.',
        'Précédée de deux années de cycle préparatoire intégré MPI (mathématiques, physique, informatique), 2024–2026 : moyenne annuelle passée de 11,06 à 13,19/20, classé 22e sur 72.',
        'سبقتها سنتان في المرحلة التحضيرية المندمجة MPI (رياضيات، فيزياء، إعلامية) 2024–2026: ارتفع المعدّل السنوي من 11.06 إلى 13.19/20، والترتيب 22 من 72.'),
      a('Selected results: Web Technologies 2 — 18.20/20 (2nd) · Python Programming — 17.16/20 · Data Structures & Algorithms 2 — 15.86/20 · Numerical Analysis — 15.29/20 (8th).',
        'Résultats choisis : Technologies Web 2 — 18,20/20 (2e) · Programmation Python — 17,16/20 · Structures de données & algorithmes 2 — 15,86/20 · Analyse numérique — 15,29/20 (8e).',
        'نتائج مختارة: تقنيات الويب 2 — 18.20/20 (الثاني) · البرمجة بلغة بايثون — 17.16/20 · هياكل البيانات والخوارزميات 2 — 15.86/20 · التحليل العددي — 15.29/20 (الثامن).'),
    ],
  },
  {
    org: 'Baccalauréat',
    role: a('Computer Science stream', 'Section Sciences de l’informatique', 'شعبة علوم الإعلامية'),
    start: '2024',
    place: a('Tunisia', 'Tunisie', 'تونس'),
    body: [],
  },
];

export const competitions: { name: string; result: L; detail: L }[] = [
  {
    name: 'Code It Up 6.0',
    result: a('Top 5', 'Top 5', 'ضمن أفضل خمسة'),
    detail: a('Overnight hackathon — Sandy AI Lab, a multi-agent lab assistant.', 'Hackathon nocturne — Sandy AI Lab, un assistant de laboratoire multi-agents.', 'هاكاثون ليلي — Sandy AI Lab، مساعد مختبر متعدد الوكلاء.'),
  },
  {
    name: 'Code It Up 5.0',
    result: a('Participant', 'Participant', 'مشارك'),
    detail: a('Overnight hackathon, IEEE ISET Bizerte.', 'Hackathon nocturne, IEEE ISET Bizerte.', 'هاكاثون ليلي، IEEE ISET بنزرت.'),
  },
];
