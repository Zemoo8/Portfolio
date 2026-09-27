// Project case studies. Technical claims are taken from each project's source code first,
// then README / CV / LinkedIn. See docs/CONTENT_VERIFICATION.md for the evidence trail.
import type { L } from '../i18n/config';

export type Shot = {
  /** path under public/media/projects, without extension (responsive -sm variant is implied) */
  src: string;
  alt: L;
  kind: 'desktop' | 'mobile' | 'figure' | 'poster';
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  /** Native-script subtitle where the project has one (e.g. Arabic product name). */
  alias?: string;
  tagline: L;
  summary: L;
  year: string;
  role: L;
  context: L;
  category: L;
  stack: string[];
  built: L[];
  notes?: L[];
  metric?: { value: string; label: L };
  links: { label: 'live' | 'source'; href: string; text?: string }[];
  /** Accent used for the project's atmosphere (sampled from the project itself). */
  tone: string;
  /** Films are detected at build time: drop the file in and it appears.
   *  `credit`: caption for a produced film; screen recordings get the default credit line. */
  film?: { desktop?: string; mobile?: string; credit?: L };
  /** An extra wide film shown after the story, with its own caption. */
  reel?: { film: string; caption: L };
  cover: Shot;
  gallery: Shot[];
  feature?: { title: L; body: L; film?: string; poster?: string; orientation: 'landscape' | 'portrait' };
  caveat?: L;
  size: 'lead' | 'major' | 'minor';
};

const a = (en: string, fr: string, ar: string): L => ({ en, fr, ar });

export const projects: Project[] = [
  {
    slug: 'ai-eyes',
    index: '01',
    title: 'AI Eyes',
    alias: 'عيون الذكاء',
    size: 'lead',
    tone: '#7c6cf2',
    category: a('Assistive AI · Mobile', 'IA d’assistance · Mobile', 'ذكاء اصطناعي مساعد · تطبيق جوّال'),
    tagline: a(
      'An Android assistant that sees for blind and low-vision Arabic speakers.',
      'Un assistant Android qui voit pour les personnes aveugles et malvoyantes arabophones.',
      'مساعد أندرويد يرى بدلًا عن المكفوفين وضعاف البصر الناطقين بالعربية.',
    ),
    summary: a(
      'Built solo over eight sprints and defended before a jury, AI Eyes turns a phone camera into a spoken guide: it narrates scenes, reads mixed Arabic, French and English text, finds objects and recognises Tunisian banknotes — all without needing to see the screen.',
      'Conçu seul en huit sprints et soutenu devant un jury, AI Eyes transforme la caméra du téléphone en guide parlé : il décrit les scènes, lit des textes mêlant arabe, français et anglais, retrouve des objets et reconnaît les billets tunisiens — sans jamais avoir besoin de voir l’écran.',
      'بُني بمفردي عبر ثماني دورات تطوير ونوقش أمام لجنة تحكيم؛ يحوّل AI Eyes كاميرا الهاتف إلى دليل ناطق: يصف المشاهد، ويقرأ النصوص المختلطة بالعربية والفرنسية والإنجليزية، ويبحث عن الأشياء، ويتعرّف على الأوراق النقدية التونسية — دون الحاجة إلى رؤية الشاشة.',
    ),
    year: '2026',
    role: a('Solo — design, engineering, deployment', 'Seul — conception, développement, déploiement', 'بمفردي — التصميم والتطوير والنشر'),
    context: a(
      'End-of-year project (PFA), Université Sesame · defence graded 17.00/20, ranked 3rd',
      'Projet de fin d’année (PFA), Université Sesame · soutenance notée 17,00/20, classée 3e',
      'مشروع نهاية السنة، جامعة سيزام · المناقشة 17.00/20، المرتبة الثالثة',
    ),
    stack: ['React Native', 'Expo', 'FastAPI', 'YOLOv8n', 'Groq (Llama)', 'Whisper', 'Supabase', 'Next.js', 'Leaflet', 'Railway', 'Vercel'],
    built: [
      a('Six operating modes: continuous scene narration, OCR of mixed Arabic/French/English text, scene description, object search, banknote recognition and a conversational assistant.',
        'Six modes : narration continue de la scène, OCR de textes mêlant arabe, français et anglais, description de scène, recherche d’objets, reconnaissance des billets et assistant conversationnel.',
        'ستة أوضاع تشغيل: سرد مستمر للمشهد، وقراءة النصوص المختلطة بالعربية والفرنسية والإنجليزية، ووصف المشهد، والبحث عن الأشياء، والتعرّف على الأوراق النقدية، ومساعد محادثة.'),
      a('A hands-free layer: a double shake of the phone activates it, Whisper handles voice commands — no touchscreen navigation required.',
        'Une couche mains libres : une double secousse du téléphone l’active, Whisper gère les commandes vocales — aucune navigation tactile nécessaire.',
        'طبقة تعمل دون استخدام اليدين: هزّتان للهاتف تفعّلانه، وWhisper يتولّى الأوامر الصوتية — دون الحاجة إلى اللمس.'),
      a('An emergency sequence that captures GPS, sends a Telegram alert with a live map link, then logs position every 30 seconds for five minutes.',
        'Une séquence d’urgence qui capture la position GPS, envoie une alerte Telegram avec un lien de carte en direct, puis enregistre la position toutes les 30 secondes pendant cinq minutes.',
        'تسلسل طوارئ يلتقط الموقع عبر GPS، ويرسل تنبيهًا على تيليغرام مع رابط خريطة مباشر، ثم يسجّل الموقع كل 30 ثانية لمدة خمس دقائق.'),
      a('A companion Next.js dashboard (Supabase Auth, Leaflet) where family members follow location, session history and alerts.',
        'Un tableau de bord Next.js associé (Supabase Auth, Leaflet) où la famille suit la position, l’historique des sessions et les alertes.',
        'لوحة متابعة مرافقة بـ Next.js (مصادقة Supabase وخرائط Leaflet) تتيح للعائلة متابعة الموقع وسجلّ الجلسات والتنبيهات.'),
    ],
    notes: [
      a('Object detection runs on a YOLOv8n service (FastAPI, Dockerised on Railway); vision and language go through Groq-hosted Llama models.',
        'La détection d’objets tourne sur un service YOLOv8n (FastAPI, conteneurisé sur Railway) ; la vision et le langage passent par des modèles Llama hébergés chez Groq.',
        'يعمل كشف الأشياء عبر خدمة YOLOv8n (FastAPI في حاوية على Railway)، بينما تمرّ الرؤية واللغة عبر نماذج Llama على منصة Groq.'),
      a('The main application module alone is over 3,000 lines of React Native.',
        'Le module principal de l’application dépasse à lui seul 3 000 lignes de React Native.',
        'تتجاوز الوحدة الرئيسية للتطبيق وحدها 3000 سطر من React Native.'),
    ],
    metric: { value: '6', label: a('assistive modes, one gesture to start', 'modes d’assistance, un seul geste pour démarrer', 'أوضاع مساعدة، وإيماءة واحدة للبدء') },
    links: [
      { label: 'live', href: 'https://aieyes-dashboard.vercel.app', text: 'aieyes-dashboard.vercel.app' },
      { label: 'source', href: 'https://github.com/Zemoo8/AIEyes', text: 'Zemoo8/AIEyes' },
      { label: 'source', href: 'https://github.com/Zemoo8/AI-Eyes-dashboard', text: 'Zemoo8/AI-Eyes-dashboard' },
      { label: 'source', href: 'https://github.com/Zemoo8/aieyes-backend', text: 'Zemoo8/aieyes-backend' },
    ],
    film: {
      desktop: 'aieyes/ad-film',
      mobile: 'aieyes/showcase-mobile',
      credit: a('Promotional film for the app', 'Film promotionnel de l’application', 'الفيلم الترويجي للتطبيق'),
    },
    cover: { src: 'aieyes/dashboard-auth', kind: 'desktop', alt: a('AI Eyes family dashboard sign-in screen', 'Écran de connexion du tableau de bord familial AI Eyes', 'شاشة تسجيل الدخول إلى لوحة متابعة العائلة في AI Eyes') },
    gallery: [
      { src: 'aieyes/dashboard-auth-mobile', kind: 'mobile', alt: a('The family dashboard on a phone', 'Le tableau de bord familial sur téléphone', 'لوحة متابعة العائلة على الهاتف') },
    ],
    caveat: a(
      'The film above is the app’s promotional film. The Android app itself needs a physical device and camera, so it is not screen-recorded here; the dashboard’s signed-in views are private family data.',
      'Le film ci-dessus est le film promotionnel de l’application. L’application Android elle-même nécessite un appareil physique et sa caméra : elle n’est donc pas enregistrée ici ; les vues connectées du tableau de bord contiennent des données familiales privées.',
      'الفيلم أعلاه هو الفيلم الترويجي للتطبيق. أما تطبيق أندرويد نفسه فيحتاج إلى جهاز حقيقي وكاميرا، لذلك لم يُسجَّل هنا؛ وواجهات اللوحة بعد تسجيل الدخول تحتوي بيانات عائلية خاصة.',
    ),
  },
  {
    slug: 'cheezy',
    index: '02',
    title: 'Cheezy',
    size: 'lead',
    tone: '#b279a7',
    category: a('Client work · Web, AI & motion', 'Mission client · Web, IA & motion', 'عمل لعميل · ويب وذكاء اصطناعي وموشن'),
    tagline: a(
      'The ordering platform, AI assistant and films for a bakery & juice bar in Bizerte.',
      'La plateforme de commande, l’assistant IA et les films d’une boulangerie-bar à jus de Bizerte.',
      'منصة الطلبات والمساعد الذكي والأفلام لمخبزة ومحل عصائر في بنزرت.',
    ),
    summary: a(
      'My first freelance client came from walking into shops and asking. Cheezy said yes: I built cheezy.store — a bilingual storefront with a full ordering flow that hands off to WhatsApp, a staff admin, and a retrieval-grounded chatbot — produced their videos, and I’m still retained for maintenance and a mobile app.',
      'Mon premier client freelance est venu en poussant la porte des commerces. Cheezy a dit oui : j’ai construit cheezy.store — une vitrine bilingue avec un parcours de commande complet relié à WhatsApp, un espace d’administration et un chatbot fondé sur la recherche documentaire — réalisé leurs vidéos, et je reste chargé de la maintenance et d’une application mobile.',
      'جاء أول عميل لي في العمل الحر بعد أن طرقت أبواب المحلات بنفسي. قال Cheezy نعم: فبنيت cheezy.store — واجهة ثنائية اللغة بمسار طلب كامل يُحال إلى واتساب، ولوحة إدارة للفريق، وروبوت محادثة يستند إلى الاسترجاع — وأنتجت فيديوهاتهم، وما زلت مكلّفًا بالصيانة وبتطبيق جوّال.',
    ),
    year: '2026 —',
    role: a('Freelance — product, engineering, video', 'Freelance — produit, développement, vidéo', 'عمل حر — المنتج والتطوير والفيديو'),
    context: a('Paid engagement, sourced through direct outreach', 'Mission rémunérée, obtenue par prospection directe', 'عمل مدفوع الأجر، حصلت عليه بالتواصل المباشر'),
    stack: ['JavaScript', 'Vercel Functions', 'Supabase', 'Groq', 'Gemini', 'RAG', 'Expo', 'Playwright', 'Remotion'],
    built: [
      a('A bilingual English/French storefront serving several shops, each with its own hours, menu and per-item visibility rules.',
        'Une vitrine bilingue anglais/français pour plusieurs boutiques, chacune avec ses horaires, sa carte et ses règles de visibilité par produit.',
        'واجهة ثنائية اللغة (إنجليزية/فرنسية) تخدم عدة فروع، لكلٍّ منها ساعاته وقائمته وقواعد ظهور المنتجات.'),
      a('A complete ordering flow — option groups, priced add-ons, removable ingredients, pickup or delivery — that hands off to WhatsApp, where customers already order.',
        'Un parcours de commande complet — groupes d’options, suppléments payants, ingrédients retirables, retrait ou livraison — transmis à WhatsApp, là où les clients commandent déjà.',
        'مسار طلب كامل — مجموعات خيارات وإضافات مسعّرة ومكوّنات قابلة للإزالة واستلام أو توصيل — يُحال إلى واتساب حيث يطلب الزبائن أصلًا.'),
      a('A staff admin with login and password reset, so the team manages menu, photos, looping videos, availability, allergens and nutrition themselves.',
        'Un espace d’administration avec connexion et réinitialisation du mot de passe, pour que l’équipe gère elle-même carte, photos, vidéos en boucle, disponibilités, allergènes et nutrition.',
        'لوحة إدارة بتسجيل دخول واستعادة كلمة المرور، ليدير الفريق بنفسه القائمة والصور والفيديوهات والتوفّر والمواد المسبّبة للحساسية والقيم الغذائية.'),
      a('An AI assistant grounded in the shop’s own menu through retrieval, running on Groq and Gemini with Supabase-backed memory.',
        'Un assistant IA ancré dans la carte de la boutique grâce à la recherche documentaire, s’appuyant sur Groq et Gemini avec une mémoire sur Supabase.',
        'مساعد ذكي يستند إلى قائمة المحل عبر الاسترجاع، يعمل بـ Groq وGemini مع ذاكرة على Supabase.'),
      a('The video content for the site and social channels, plus a follow-on Expo mobile app for ordering and loyalty, now in development.',
        'Les vidéos du site et des réseaux sociaux, ainsi qu’une application mobile Expo pour la commande et la fidélité, actuellement en développement.',
        'محتوى الفيديو للموقع وقنوات التواصل، إضافةً إلى تطبيق جوّال بـ Expo للطلب وبرنامج الولاء، قيد التطوير حاليًا.'),
    ],
    notes: [
      a('The opening film was built with Remotion (React video); the launch film further down was rendered from a small HTML/JavaScript motion engine I wrote for the project.',
        'Le film d’ouverture a été réalisé avec Remotion (vidéo en React) ; le film de lancement plus bas a été rendu par un petit moteur d’animation HTML/JavaScript écrit pour le projet.',
        'الفيلم الافتتاحي مصنوع بـ Remotion (فيديو بـ React)؛ أما فيلم الإطلاق في الأسفل فمولَّد بمحرّك حركة صغير بـ HTML وJavaScript كتبته خصيصًا للمشروع.'),
    ],
    links: [
      { label: 'live', href: 'https://www.cheezy.store', text: 'cheezy.store' },
      { label: 'live', href: 'https://cheezy-app-demo.vercel.app', text: 'cheezy-app-demo.vercel.app' },
    ],
    film: {
      desktop: 'cheezy/brand-film',
      mobile: 'cheezy/showcase-mobile',
      credit: a('Film made for the client', 'Film réalisé pour le client', 'فيلم أُنجز للعميل'),
    },
    reel: {
      film: 'cheezy/showcase-desktop',
      caption: a('cheezy.store, recorded as it runs — choosing a shop, browsing the menu, building an order',
        'cheezy.store, enregistré en fonctionnement — choix de la boutique, parcours de la carte, composition d’une commande',
        'cheezy.store مسجَّلًا أثناء تشغيله — اختيار الفرع وتصفّح القائمة وتكوين طلب'),
    },
    cover: { src: 'cheezy/hero', kind: 'desktop', alt: a('Cheezy home page: “Baked, served bright”', 'Page d’accueil Cheezy : « Baked, served bright »', 'الصفحة الرئيسية لـ Cheezy') },
    gallery: [
      { src: 'cheezy/shop-picker', kind: 'desktop', alt: a('Choosing a shop before ordering', 'Choix de la boutique avant la commande', 'اختيار الفرع قبل الطلب') },
      { src: 'cheezy/menu', kind: 'desktop', alt: a('The full menu with category filters', 'La carte complète avec filtres par catégorie', 'القائمة الكاملة مع مرشّحات الأصناف') },
      { src: 'cheezy/item', kind: 'desktop', alt: a('An item sheet with price, calories and allergens link', 'Fiche produit avec prix, calories et lien vers les allergènes', 'بطاقة منتج بالسعر والسعرات ورابط المواد المسبّبة للحساسية') },
      { src: 'cheezy/ordering', kind: 'desktop', alt: a('How ordering works, in three steps', 'Le fonctionnement de la commande, en trois étapes', 'طريقة الطلب في ثلاث خطوات') },
      { src: 'cheezy/ad-cheesecake', kind: 'poster', alt: a('Instagram ad for Cheezy', 'Publicité Instagram pour Cheezy', 'إعلان إنستغرام لـ Cheezy') },
      { src: 'cheezy/ad-matcha', kind: 'poster', alt: a('Story ad: “Le matcha est arrivé”', 'Story : « Le matcha est arrivé »', 'إعلان قصة: وصل الماتشا') },
      { src: 'cheezy/ad-menu', kind: 'poster', alt: a('Menu poster: “Les favoris Cheezy”', 'Affiche : « Les favoris Cheezy »', 'ملصق القائمة: المفضّلات') },
    ],
    feature: {
      title: a('The mobile app, in motion', 'L’application mobile, en mouvement', 'التطبيق الجوّال في حركة'),
      body: a(
        'A web demo of the Expo app — onboarding, shop choice, loyalty points — recorded as it runs, next to the launch film made for the client.',
        'Une démo web de l’application Expo — accueil, choix de la boutique, points de fidélité — enregistrée en fonctionnement, à côté du film de lancement réalisé pour le client.',
        'عرض ويب لتطبيق Expo — التهيئة واختيار الفرع ونقاط الولاء — مسجَّل أثناء التشغيل، إلى جانب فيلم الإطلاق المُعدّ للعميل.',
      ),
      film: 'cheezy/app-mobile',
      poster: 'cheezy/film-app',
      orientation: 'portrait',
    },
  },
  {
    slug: 'radar-interceptor',
    index: '03',
    title: 'Radar Interceptor',
    size: 'major',
    tone: '#2fd58a',
    category: a('Estimation · Simulation', 'Estimation · Simulation', 'التقدير · المحاكاة'),
    tagline: a(
      'Radar target tracking and missile interception under uncertainty.',
      'Poursuite radar de cibles et interception de missiles dans l’incertitude.',
      'تعقّب الأهداف بالرادار واعتراض الصواريخ في ظل عدم اليقين.',
    ),
    summary: a(
      'Differential-equations coursework taken further: noisy radar returns are filtered with a Kalman filter and a three-mode IMM estimator, tested across Monte Carlo runs, and shown in an interactive 3D demo that walks through the equations as they are used.',
      'Un devoir d’équations différentielles poussé plus loin : des mesures radar bruitées sont filtrées par un filtre de Kalman et un estimateur IMM à trois modes, testées sur des campagnes Monte-Carlo, puis montrées dans une démo 3D interactive qui déroule les équations au moment où elles servent.',
      'واجب في المعادلات التفاضلية ذهبتُ به أبعد: تُرشَّح قياسات الرادار المشوَّشة بمرشّح كالمان ومقدّر IMM ثلاثي الأنماط، وتُختبر عبر محاكاة مونت كارلو، وتُعرض في نموذج ثلاثي الأبعاد تفاعلي يشرح المعادلات لحظة استخدامها.',
    ),
    year: '2026',
    role: a('Solo — modelling, simulation, visualisation', 'Seul — modélisation, simulation, visualisation', 'بمفردي — النمذجة والمحاكاة والتصوير البياني'),
    context: a('Differential Equations coursework, Université Sesame', 'Cours d’équations différentielles, Université Sesame', 'مقرر المعادلات التفاضلية، جامعة سيزام'),
    stack: ['Python', 'NumPy', 'SciPy', 'Matplotlib', 'Three.js', 'pytest', 'GitHub Actions'],
    built: [
      a('A constant-velocity Kalman filter and a three-mode Interacting Multiple Model estimator that re-weights itself during manoeuvres.',
        'Un filtre de Kalman à vitesse constante et un estimateur IMM à trois modes qui se repondère pendant les manœuvres.',
        'مرشّح كالمان بسرعة ثابتة ومقدّر IMM ثلاثي الأنماط يعيد توزيع أوزانه أثناء المناورات.'),
      a('Monte Carlo experiments with filter-consistency checks (NEES/NIS), sensor-noise and tuning sweeps.',
        'Des expériences Monte-Carlo avec contrôles de cohérence du filtre (NEES/NIS) et balayages du bruit capteur et du réglage.',
        'تجارب مونت كارلو مع اختبارات اتساق المرشّح (NEES/NIS) ومسوح لضجيج المستشعر والمعايرة.'),
      a('An interactive Three.js radar scene with live metrics and the equation behind each step.',
        'Une scène radar interactive en Three.js avec métriques en direct et l’équation derrière chaque étape.',
        'مشهد رادار تفاعلي بـ Three.js مع مؤشرات حيّة والمعادلة الكامنة وراء كل خطوة.'),
      a('A regression test over Monte Carlo runs, wired into continuous integration, plus written theory documentation.',
        'Un test de non-régression sur des exécutions Monte-Carlo, branché sur l’intégration continue, et une documentation théorique rédigée.',
        'اختبار انحدار على تشغيلات مونت كارلو مربوط بالتكامل المستمر، مع توثيق نظري مكتوب.'),
    ],
    metric: {
      value: '−45.6%',
      label: a('position error vs. raw radar, IMM over 100 Monte Carlo runs', 'd’erreur de position vs radar brut, IMM sur 100 tirages Monte-Carlo', 'في خطأ الموقع مقارنةً بالرادار الخام، IMM عبر 100 تجربة مونت كارلو'),
    },
    notes: [
      a('Position RMSE: 79.4 m for raw measurements, 66.9 m for a tuned Kalman filter, 43.2 m for the IMM (seeded run, results/summary.json).',
        'RMSE de position : 79,4 m pour les mesures brutes, 66,9 m pour un filtre de Kalman réglé, 43,2 m pour l’IMM (exécution à graine fixe, results/summary.json).',
        'جذر متوسط مربع خطأ الموقع: 79.4 م للقياسات الخام، و66.9 م لمرشّح كالمان معايَر، و43.2 م لـ IMM (تشغيل ببذرة ثابتة، results/summary.json).'),
    ],
    links: [{ label: 'source', href: 'https://github.com/Zemoo8/radar-target-tracking-and-missile-interception', text: 'Zemoo8/radar-target-tracking…' }],
    film: { desktop: 'radar/showcase-desktop' },
    cover: { src: 'radar/fig-engagement', kind: 'figure', alt: a('Engagement geometry and terminal phase of an intercept', 'Géométrie d’engagement et phase terminale d’une interception', 'هندسة الاشتباك والمرحلة النهائية للاعتراض') },
    gallery: [
      { src: 'radar/fig-accuracy', kind: 'figure', alt: a('Position and velocity accuracy over 100 runs', 'Précision en position et vitesse sur 100 exécutions', 'دقة الموقع والسرعة عبر 100 تشغيل') },
      { src: 'radar/fig-imm-modes', kind: 'figure', alt: a('IMM mode probabilities during manoeuvres', 'Probabilités des modes IMM pendant les manœuvres', 'احتمالات أنماط IMM أثناء المناورات') },
      { src: 'radar/fig-sweeps', kind: 'figure', alt: a('Sensitivity to sensor accuracy and tuning', 'Sensibilité à la précision du capteur et au réglage', 'الحساسية لدقة المستشعر والمعايرة') },
    ],
  },
  {
    slug: 'books-intelligence',
    index: '04',
    title: 'Books Price Intelligence',
    size: 'major',
    tone: '#9a6a3c',
    category: a('Data pipeline · Web', 'Pipeline de données · Web', 'خط معالجة بيانات · ويب'),
    tagline: a(
      'From scraped pages to a dataset you can trust — and an honest model on top.',
      'De pages extraites à un jeu de données fiable — et un modèle honnête par-dessus.',
      'من صفحات مستخرَجة إلى بيانات موثوقة — ونموذج صادق فوقها.',
    ),
    summary: a(
      'An end-to-end Python pipeline: scrape a public practice catalogue politely, clean it with pandas, store it in SQLite, serve it through Flask, and explore it in a React dashboard — with a linear-regression page that says plainly what it can’t predict.',
      'Un pipeline Python de bout en bout : extraire poliment un catalogue d’entraînement public, le nettoyer avec pandas, le stocker dans SQLite, le servir via Flask et l’explorer dans un tableau de bord React — avec une page de régression linéaire qui dit clairement ce qu’elle ne peut pas prédire.',
      'خط معالجة كامل بلغة بايثون: استخراج كتالوج تدريبي عام بأسلوب مهذّب، وتنظيفه بـ pandas، وتخزينه في SQLite، وتقديمه عبر Flask، واستكشافه في لوحة React — مع صفحة انحدار خطي تقول بوضوح ما لا تستطيع التنبؤ به.',
    ),
    year: '2026',
    role: a('Solo — pipeline, API, interface', 'Seul — pipeline, API, interface', 'بمفردي — خط المعالجة والواجهة البرمجية والواجهة'),
    context: a('Python programming course project', 'Projet du cours de programmation Python', 'مشروع مقرر البرمجة بلغة بايثون'),
    stack: ['Python', 'requests', 'BeautifulSoup', 'pandas', 'SQLite', 'Flask', 'scikit-learn', 'React', 'TypeScript', 'Recharts'],
    built: [
      a('A scraper for books.toscrape.com — a sandbox made for scraping practice — with a polite delay between requests and a descriptive User-Agent.',
        'Un scraper pour books.toscrape.com — un bac à sable conçu pour s’entraîner — avec un délai de politesse entre les requêtes et un User-Agent explicite.',
        'أداة استخراج لموقع books.toscrape.com — بيئة مخصّصة للتدريب — مع مهلة مهذّبة بين الطلبات ووكيل مستخدم واضح.'),
      a('A cleaning stage (prices, word ratings, duplicates, nulls), SQLite storage and CSV export.',
        'Une étape de nettoyage (prix, notes en toutes lettres, doublons, valeurs nulles), un stockage SQLite et un export CSV.',
        'مرحلة تنظيف (الأسعار والتقييمات النصية والتكرار والقيم الفارغة) وتخزين في SQLite وتصدير CSV.'),
      a('A Flask REST API with a live scrape trigger and progress polling, feeding a React + TypeScript dashboard with filters and charts.',
        'Une API REST Flask avec déclenchement du scraping et suivi de progression, alimentant un tableau de bord React + TypeScript avec filtres et graphiques.',
        'واجهة REST بـ Flask مع تشغيل الاستخراج ومتابعة تقدّمه، تغذّي لوحة React وTypeScript بالمرشّحات والرسوم البيانية.'),
      a('A scikit-learn regression framed honestly: page order as a pseudo-time variable, “pedagogical, not prophecy”.',
        'Une régression scikit-learn présentée honnêtement : l’ordre des pages comme variable pseudo-temporelle, « pédagogique, pas prophétique ».',
        'انحدار بـ scikit-learn مقدَّم بصدق: ترتيب الصفحات متغيّرًا شبه زمني، «للتعليم لا للتنبؤ».'),
    ],
    links: [{ label: 'source', href: 'https://github.com/Zemoo8/scraping-book', text: 'Zemoo8/scraping-book' }],
    caveat: a(
      'The public repository holds the first version (Streamlit + Plotly). The Flask + React interface shown here is the later rewrite, recorded from the local project and not yet pushed.',
      'Le dépôt public contient la première version (Streamlit + Plotly). L’interface Flask + React présentée ici est la réécriture ultérieure, enregistrée depuis le projet local et pas encore publiée.',
      'يحتوي المستودع العام على النسخة الأولى (Streamlit وPlotly). أما واجهة Flask وReact المعروضة هنا فهي إعادة الكتابة اللاحقة، مسجَّلة من المشروع المحلي ولم تُنشر بعد.',
    ),
    film: { desktop: 'scraping/showcase-desktop' },
    cover: { src: 'scraping/hero', kind: 'desktop', alt: a('“From scraped pages, a market made legible.”', '« From scraped pages, a market made legible. »', 'الصفحة الرئيسية لمشروع تحليل أسعار الكتب') },
    gallery: [
      { src: 'scraping/charts', kind: 'desktop', alt: a('Dashboard charts: categories, prices, ratings', 'Graphiques : catégories, prix, notes', 'رسوم اللوحة: الأصناف والأسعار والتقييمات') },
      { src: 'scraping/prediction', kind: 'desktop', alt: a('The prediction page and its academic note', 'La page de prédiction et sa note académique', 'صفحة التنبؤ وملاحظتها الأكاديمية') },
      { src: 'scraping/kpis', kind: 'desktop', alt: a('Six market numbers at a glance', 'Six indicateurs en un coup d’œil', 'ستة مؤشرات بلمحة واحدة') },
    ],
  },
  {
    slug: 'sandy-ai-lab',
    index: '05',
    title: 'Sandy AI Lab',
    size: 'minor',
    tone: '#e98a4b',
    category: a('Multi-agent · Hackathon', 'Multi-agents · Hackathon', 'وكلاء متعدّدون · هاكاثون'),
    tagline: a(
      'An overnight multi-agent lab assistant — top 5 at Code It Up 6.0.',
      'Un assistant de laboratoire multi-agents construit en une nuit — top 5 à Code It Up 6.0.',
      'مساعد مختبر متعدد الوكلاء بُني في ليلة واحدة — ضمن أفضل خمسة في Code It Up 6.0.',
    ),
    summary: a(
      'Ask the lab a question in plain language, typed or spoken. A planner coordinates an inventory agent and a research agent over live data, and a Groq-hosted LLM answers — constrained to the context it is given.',
      'Posez une question au laboratoire en langage courant, à l’écrit ou à l’oral. Un planificateur coordonne un agent d’inventaire et un agent de recherche sur des données en direct, puis un LLM hébergé chez Groq répond — limité au contexte fourni.',
      'اسأل المختبر بلغة عادية، كتابةً أو صوتًا. يُنسّق وكيلُ تخطيطٍ بين وكيل للمخزون وآخر للبحث على بيانات حيّة، ثم يجيب نموذج لغوي على Groq — مقيّدًا بالسياق المقدَّم له.',
    ),
    year: '2026',
    role: a('Full-stack — agents, API, interface', 'Full-stack — agents, API, interface', 'تطوير شامل — الوكلاء والواجهة البرمجية والواجهة'),
    context: a('Code It Up 6.0 overnight hackathon · top 5', 'Hackathon nocturne Code It Up 6.0 · top 5', 'هاكاثون Code It Up 6.0 الليلي · ضمن أفضل خمسة'),
    stack: ['Python', 'FastAPI', 'Groq (Llama 3.3 70B)', 'React 19', 'TanStack Start', 'Tailwind CSS', 'Web Speech API'],
    built: [
      a('Three agents — inventory (minimum stock), research (blocked or delayed projects) and a planner that turns anomalies into a prioritised action list.',
        'Trois agents — inventaire (stocks minimaux), recherche (projets bloqués ou en retard) et un planificateur qui transforme les anomalies en liste d’actions priorisées.',
        'ثلاثة وكلاء — للمخزون (الحد الأدنى) وللبحث (المشاريع المتعثّرة أو المتأخرة) ووكيل تخطيط يحوّل الحالات الشاذة إلى قائمة إجراءات مرتّبة حسب الأولوية.'),
      a('A three-tier data fallback — external REST API, then local PostgreSQL, then a static structure — so the demo kept answering when upstream services failed.',
        'Un repli de données à trois niveaux — API REST externe, puis PostgreSQL local, puis une structure statique — pour que la démo continue de répondre malgré les pannes en amont.',
        'آلية احتياط للبيانات من ثلاثة مستويات — واجهة REST خارجية ثم PostgreSQL محلية ثم بنية ثابتة — ليستمر العرض في الإجابة عند تعطّل الخدمات.'),
      a('A streaming chat interface with voice input and spoken replies through the Web Speech API.',
        'Une interface de discussion en flux continu, avec saisie vocale et réponses parlées via la Web Speech API.',
        'واجهة محادثة متدفّقة مع إدخال صوتي وردود منطوقة عبر Web Speech API.'),
    ],
    links: [{ label: 'source', href: 'https://github.com/Zemoo8/CodeItUp0.6', text: 'Zemoo8/CodeItUp0.6' }],
    cover: { src: 'sandy/chat', kind: 'desktop', alt: a('The Acorn AI chat interface', 'L’interface de discussion Acorn AI', 'واجهة محادثة Acorn AI') },
    gallery: [{ src: 'sandy/sidebar', kind: 'desktop', alt: a('Chat with the side panel open', 'La discussion avec le panneau latéral ouvert', 'المحادثة مع اللوحة الجانبية مفتوحة') }],
  },
  {
    slug: 'subway-runner',
    index: '06',
    title: 'SubwayRunner',
    size: 'minor',
    tone: '#3aa0ff',
    category: a('Game · 3D', 'Jeu · 3D', 'لعبة · ثلاثية الأبعاد'),
    tagline: a('A procedural 3D endless runner in Unity 6.', 'Un runner infini procédural en 3D sous Unity 6.', 'لعبة جري لا نهائية ثلاثية الأبعاد مولَّدة إجرائيًا بمحرّك Unity 6.'),
    summary: a(
      'A three-lane runner whose track is generated ahead of the player and culled behind, so memory stays bounded however long the run lasts; speed ramps progressively from 8 to 22 units per second.',
      'Un runner à trois voies dont la piste est générée devant le joueur et supprimée derrière lui, pour une mémoire bornée quelle que soit la durée de la partie ; la vitesse monte progressivement de 8 à 22 unités par seconde.',
      'لعبة جري بثلاثة مسارات يُولَّد طريقها أمام اللاعب ويُحذف خلفه، فتبقى الذاكرة محدودة مهما طالت الجولة؛ وتتصاعد السرعة تدريجيًا من 8 إلى 22 وحدة في الثانية.',
    ),
    year: '2026',
    role: a('Solo — gameplay programming', 'Seul — programmation du gameplay', 'بمفردي — برمجة اللعب'),
    context: a('3D Animation coursework', 'Cours d’animation 3D', 'مقرر التحريك ثلاثي الأبعاد'),
    stack: ['Unity 6', 'C#', 'URP', 'Input System'],
    built: [
      a('A procedural track spawner that instantiates, populates and culls 40-unit segments along the Z axis relative to the player.',
        'Un générateur de piste procédural qui instancie, peuple et supprime des segments de 40 unités sur l’axe Z selon la position du joueur.',
        'مولّد مسار إجرائي يُنشئ مقاطع بطول 40 وحدة على المحور Z ويملؤها ويحذفها بحسب موقع اللاعب.'),
      a('A three-lane kinematic controller driven by keyboard and swipe input through Unity’s Input System.',
        'Un contrôleur cinématique à trois voies piloté au clavier et par balayage via l’Input System de Unity.',
        'متحكّم حركي بثلاثة مسارات يُدار بلوحة المفاتيح والسحب عبر نظام الإدخال في Unity.'),
    ],
    links: [],
    film: { desktop: 'subway-runner/showcase-desktop' },
    cover: { src: 'subway-runner/gameplay', kind: 'desktop', alt: a('SubwayRunner gameplay', 'Gameplay de SubwayRunner', 'لقطة من لعب SubwayRunner') },
    gallery: [],
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
