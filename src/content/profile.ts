// Identity and narrative. Every statement here is traced in docs/CONTENT_VERIFICATION.md.
// French and Arabic copy was written from the verified English source and should be
// proof-read by Ahmed before launch (see docs/README.md → "Translations").
import type { L } from '../i18n/config';

export const profile = {
  name: { en: 'Ahmed Baghouli', fr: 'Ahmed Baghouli', ar: 'أحمد بغولي' } as L,
  firstName: { en: 'Ahmed', fr: 'Ahmed', ar: 'أحمد' } as L,
  lastName: { en: 'Baghouli', fr: 'Baghouli', ar: 'بغولي' } as L,
  // LinkedIn headline (primary), shortened.
  role: { en: 'Full-stack & AI developer', fr: 'Développeur full-stack & IA', ar: 'مطوّر برمجيات شاملة وذكاء اصطناعي' } as L,
  location: { en: 'Tunis, Tunisia', fr: 'Tunis, Tunisie', ar: 'تونس العاصمة، تونس' } as L,
  email: 'ahmedbaghoulii@gmail.com',
  links: {
    github: 'https://github.com/Zemoo8',
    linkedin: 'https://www.linkedin.com/in/ahmed-baghouli-b8199b330/',
  },

  // Hero statement: what he builds, grounded in the three flagship projects.
  statement: {
    en: 'I build AI systems that have to work for real people — an Arabic-first vision assistant for blind users, a bakery’s ordering platform, a radar tracker that survives noise.',
    fr: 'Je construis des systèmes d’IA qui doivent fonctionner pour de vraies personnes — un assistant visuel pensé d’abord en arabe pour les personnes aveugles, la plateforme de commande d’une boulangerie, un pisteur radar qui résiste au bruit.',
    ar: 'أبني أنظمة ذكاء اصطناعي يجب أن تعمل لأشخاص حقيقيين — مساعدًا بصريًا بالعربية أولًا للمكفوفين، ومنصة طلبات لمخبزة، ومتعقّب رادار يصمد أمام الضجيج.',
  } as L,

  about: [
    {
      en: 'I’m a third-year Computer Science student at Université Sesame in Tunisia, finishing a Licence in Computer Science & Multimedia after two years of an integrated preparatory engineering cycle (MPI).',
      fr: 'Je suis étudiant en troisième année d’informatique à l’Université Sesame, en Tunisie, où je termine une Licence en Informatique & Multimédia après deux années de cycle préparatoire intégré (MPI).',
      ar: 'أدرس في السنة الثالثة إعلامية بجامعة سيزام في تونس، حيث أُتمّ الإجازة في الإعلامية والملتيميديا بعد سنتين من المرحلة التحضيرية المندمجة (MPI).',
    },
    {
      en: 'Most of what I know I learned by shipping: designing, building and deploying complete systems on my own — from a YOLO backend on Railway to a WhatsApp-connected ordering flow a real business uses every day.',
      fr: 'L’essentiel de ce que je sais, je l’ai appris en livrant : concevoir, construire et déployer seul des systèmes complets — d’un backend YOLO sur Railway à un parcours de commande relié à WhatsApp qu’une vraie entreprise utilise chaque jour.',
      ar: 'تعلّمت معظم ما أعرفه بالتنفيذ الفعلي: تصميم أنظمة كاملة وبناؤها ونشرها بمفردي — من خادم YOLO على Railway إلى مسار طلبات متصل بواتساب يستخدمه نشاط تجاري حقيقي كل يوم.',
    },
    {
      en: 'Next, I’m aiming for a Master’s in Artificial Intelligence focused on natural language processing and computer vision — with the intention of continuing to doctoral research.',
      fr: 'Mon objectif : un master en intelligence artificielle orienté traitement automatique du langage et vision par ordinateur, avec l’intention de poursuivre en doctorat.',
      ar: 'هدفي التالي ماجستير في الذكاء الاصطناعي يركّز على معالجة اللغات الطبيعية والرؤية الحاسوبية، مع نيّة مواصلة البحث في الدكتوراه.',
    },
  ] as L[],

  languages: [
    { name: { en: 'Arabic', fr: 'Arabe', ar: 'العربية' }, level: { en: 'Native', fr: 'Langue maternelle', ar: 'اللغة الأم' } },
    { name: { en: 'English', fr: 'Anglais', ar: 'الإنجليزية' }, level: { en: 'Cambridge B2 First · 176', fr: 'Cambridge B2 First · 176', ar: 'كامبريدج B2 First · 176' } },
    { name: { en: 'French', fr: 'Français', ar: 'الفرنسية' }, level: { en: 'B1 · language of instruction', fr: 'B1 · langue d’enseignement', ar: 'B1 · لغة التدريس' } },
  ] as { name: L; level: L }[],

  interests: [
    { en: 'Competitive chess since 2018', fr: 'Échecs en compétition depuis 2018', ar: 'الشطرنج التنافسي منذ 2018' },
    { en: 'Six years of Shotokan karate', fr: 'Six ans de karaté Shotokan', ar: 'ست سنوات من كاراتيه شوتوكان' },
  ] as L[],
};
