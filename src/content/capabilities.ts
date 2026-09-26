// Capabilities are grouped by what they were used for, and each group points to the
// project(s) that prove it — no percentages, no logo wall.
import type { L } from '../i18n/config';

const a = (en: string, fr: string, ar: string): L => ({ en, fr, ar });

export const capabilities: { name: L; body: L; tools: string[]; proof: string[] }[] = [
  {
    name: a('Perception & language AI', 'IA de perception & de langage', 'ذكاء اصطناعي للإدراك واللغة'),
    body: a('Object detection, OCR, speech and LLMs wired into products people use.', 'Détection d’objets, OCR, parole et LLM intégrés à des produits réellement utilisés.', 'كشف الأشياء وقراءة النصوص والكلام والنماذج اللغوية مدمجة في منتجات يستخدمها الناس.'),
    tools: ['YOLOv8', 'Whisper', 'Groq', 'Gemini', 'RAG', 'Multi-agent orchestration'],
    proof: ['ai-eyes', 'cheezy', 'sandy-ai-lab'],
  },
  {
    name: a('Product engineering', 'Ingénierie produit', 'هندسة المنتجات'),
    body: a('Mobile, web and API work taken all the way to deployment.', 'Du mobile, du web et des API menés jusqu’au déploiement.', 'تطبيقات جوّال وويب وواجهات برمجية حتى مرحلة النشر.'),
    tools: ['React Native', 'Expo', 'React', 'Next.js', 'TypeScript', 'FastAPI', 'Flask', 'Supabase', 'PostgreSQL', 'Vercel', 'Railway'],
    proof: ['ai-eyes', 'cheezy', 'books-intelligence'],
  },
  {
    name: a('Scientific computing', 'Calcul scientifique', 'الحوسبة العلمية'),
    body: a('Estimation, simulation and honest evaluation.', 'Estimation, simulation et évaluation honnête.', 'التقدير والمحاكاة والتقييم الصادق.'),
    tools: ['Python', 'NumPy', 'SciPy', 'pandas', 'scikit-learn', 'MATLAB'],
    proof: ['aegis-radar', 'books-intelligence'],
  },
  {
    name: a('3D, motion & video', '3D, motion & vidéo', 'الأبعاد الثلاثية والحركة والفيديو'),
    body: a('Real-time scenes and films rendered from code.', 'Des scènes temps réel et des films rendus à partir du code.', 'مشاهد آنية وأفلام مولَّدة بالشيفرة.'),
    tools: ['Unity', 'C#', 'Three.js', 'Remotion', 'Playwright'],
    proof: ['subway-runner', 'aegis-radar', 'cheezy'],
  },
];

export const languagesSpoken = ['Python', 'JavaScript', 'TypeScript', 'C++', 'C', 'C#', 'PHP', 'SQL'];
