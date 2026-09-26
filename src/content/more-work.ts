// Smaller or supporting repositories. Descriptions follow each repository's own
// GitHub description and language statistics (read 2026-09-26).
import type { L } from '../i18n/config';

const a = (en: string, fr: string, ar: string): L => ({ en, fr, ar });

export const moreWork: { title: string; body: L; tech: string[]; repo?: string; live?: string; image?: string; team?: boolean }[] = [
  {
    title: 'Attendance platform + RAG chatbot',
    body: a(
      'Role-separated attendance management for admins, teachers and students (PHP MVC, MySQL), with a Flask retrieval chatbot behind an Apache reverse proxy and campus-network-only attendance entry. Built with a teammate; graded 18.20/20, ranked 2nd.',
      'Gestion des absences avec rôles séparés pour administrateurs, enseignants et étudiants (PHP MVC, MySQL), avec un chatbot Flask à recherche documentaire derrière un reverse proxy Apache et une saisie des présences limitée au réseau du campus. Réalisé en binôme ; noté 18,20/20, classé 2e.',
      'منصة لإدارة الحضور بأدوار منفصلة للإداريين والأساتذة والطلبة (PHP MVC وMySQL)، مع روبوت محادثة بالاسترجاع بـ Flask خلف وكيل عكسي Apache، وتسجيل الحضور من شبكة الحرم فقط. أُنجزت مع زميل؛ العلامة 18.20/20، المرتبة الثانية.',
    ),
    tech: ['PHP', 'MySQL', 'Flask', 'Apache'],
    repo: 'https://github.com/Zemoo8/gestion-absences-faculte',
    team: true,
  },
  {
    title: 'Caffeine',
    body: a('A responsive single-page site for a coffee shop in Bizerte — menu, reviews, location. Vanilla HTML, CSS and JavaScript, no build step.', 'Un site one-page responsive pour un café de Bizerte — carte, avis, localisation. HTML, CSS et JavaScript natifs, sans étape de build.', 'موقع متجاوب من صفحة واحدة لمقهى في بنزرت — القائمة والتقييمات والموقع. HTML وCSS وJavaScript دون أدوات بناء.'),
    tech: ['HTML', 'CSS', 'JavaScript'],
    repo: 'https://github.com/Zemoo8/CaffeineWebsite',
    live: 'https://caffeine-lake.vercel.app',
    image: 'caffeine/hero',
  },
  {
    title: 'Bubbleberry Bliss',
    body: a('A marketing site for a bubble-tea shop: animated hero, product showcase, mobile-first layout.', 'Un site vitrine pour un bar à bubble tea : hero animé, mise en avant des produits, mise en page mobile d’abord.', 'موقع تسويقي لمحل شاي الفقاعات: واجهة متحرّكة وعرض للمنتجات وتصميم للجوّال أولًا.'),
    tech: ['React', 'TypeScript', 'TanStack Start', 'Vercel'],
    repo: 'https://github.com/Zemoo8/bubbleberry-bliss',
    live: 'https://bubbleberry-bliss.vercel.app',
    image: 'bubbleberry/hero',
  },
  {
    title: 'aieyes-backend',
    body: a('The FastAPI vision/OCR service behind AI Eyes — base64 image in, text out — Dockerised on Railway.', 'Le service FastAPI de vision/OCR d’AI Eyes — image en base64 en entrée, texte en sortie — conteneurisé sur Railway.', 'خدمة الرؤية وقراءة النصوص بـ FastAPI خلف AI Eyes — صورة بترميز base64 تدخل ونص يخرج — في حاوية على Railway.'),
    tech: ['Python', 'FastAPI', 'Docker', 'Railway'],
    repo: 'https://github.com/Zemoo8/aieyes-backend',
  },
  {
    title: 'Brew Bliss menu creator',
    body: a('A menu builder for coffee shops — create, edit and publish a digital drinks menu.', 'Un éditeur de carte pour cafés — créer, modifier et publier une carte des boissons numérique.', 'أداة لإنشاء قوائم المقاهي — إنشاء قائمة مشروبات رقمية وتحريرها ونشرها.'),
    tech: ['React', 'TypeScript', 'shadcn/ui'],
    repo: 'https://github.com/Zemoo8/brew-bliss-menu-creator',
  },
];
