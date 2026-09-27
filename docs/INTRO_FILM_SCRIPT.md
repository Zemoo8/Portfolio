# Intro film — script (EN · FR · AR)

The film opens when a visitor clicks the air emblem in the moon gate: the gust fills the screen
and the film plays **with sound** on a **16:9** screen. Every fact below is already on the site
(see `CONTENT_VERIFICATION.md`), so nothing said in the film can contradict it.

## Length

**Aim for 50 seconds; keep it between 45 and 60.** That is about 120–130 spoken words in English
and French at a calm pace (~140 words a minute), a little fewer in Arabic. Under 45 s there is no
room for the projects; past 60 s recruiters stop watching. Record each language separately —
don't dub.

## Shots (same for the three languages)

| Time | Picture | Beat |
|---|---|---|
| 0:00–0:06 | You, medium shot, looking into the lens; calm, plain background, soft window light | who you are |
| 0:06–0:15 | You | study + "I learn by shipping" |
| 0:15–0:33 | Cut-aways over your voice: AI Eyes on the phone, Cheezy ordering flow, the radar demo (the site's own project films in `public/media/projects/` work) | three projects |
| 0:33–0:43 | Back to you | what's next |
| 0:43–0:53 | You, a little closer | the motto |
| 0:53–0:58 | You, a small smile | invitation |

---

## English (~125 words · ~52 s)

> **[0:00]** Hi, I'm Ahmed Baghouli — a full-stack and AI developer from Tunisia.
>
> **[0:06]** I'm in my third year of Computer Science and Multimedia at Université Sesame, and I learn the way I like to work: by shipping real things.
>
> **[0:15]** I built AI Eyes, an Arabic-first vision assistant for blind and low-vision people; Cheezy, the ordering platform a real bakery uses every day; and a radar tracker that holds on to its target through the noise.
>
> **[0:33]** Next, I'm heading for a Master's in Artificial Intelligence — natural language processing and computer vision — and then research.
>
> **[0:43]** My motto: nothing is gained without giving something of equal worth. So I work hard — and earn the right to play hard.
>
> **[0:53]** If you're building something that matters, let's talk. My work and my email are right here on this page.

## Français (~130 mots · ~55 s)

> **[0:00]** Bonjour, je suis Ahmed Baghouli, développeur full-stack et IA, en Tunisie.
>
> **[0:06]** Je suis en troisième année d'Informatique et Multimédia à l'Université Sesame, et j'apprends comme j'aime travailler : en livrant de vrais projets.
>
> **[0:16]** J'ai créé AI Eyes, un assistant visuel pensé d'abord en arabe pour les personnes aveugles et malvoyantes ; Cheezy, la plateforme de commande qu'une vraie boulangerie utilise chaque jour ; et un pisteur radar qui garde sa cible malgré le bruit.
>
> **[0:34]** Prochaine étape : un master en intelligence artificielle — traitement du langage et vision par ordinateur — puis la recherche.
>
> **[0:44]** Ma devise : rien ne s'obtient sans donner quelque chose d'égale valeur. Alors je travaille dur, pour mériter de profiter pleinement.
>
> **[0:54]** Si vous construisez quelque chose qui compte, parlons-en. Mon travail et mon e-mail sont sur cette page.

## العربية (~95 كلمة · ~55 ثانية)

<div dir="rtl" lang="ar">

> **[0:00]** مرحبًا، أنا أحمد بغولي، مطوّر برمجيات شاملة وذكاء اصطناعي من تونس.
>
> **[0:06]** أدرس في السنة الثالثة إعلامية وملتيميديا بجامعة سيزام، وأتعلّم بالطريقة التي أحبّ أن أعمل بها: بإنجاز مشاريع حقيقية.
>
> **[0:16]** طوّرتُ «عيون الذكاء»، مساعدًا بصريًّا بالعربية أولًا للمكفوفين وضعاف البصر؛ و«تشيزي»، منصّة الطلبات التي يستخدمها مخبز حقيقي كل يوم؛ ومتعقِّب رادار يحافظ على هدفه رغم الضجيج.
>
> **[0:34]** خطوتي التالية: ماجستير في الذكاء الاصطناعي — معالجة اللغات الطبيعية والرؤية الحاسوبية — ثم البحث العلمي.
>
> **[0:44]** شعاري: لا شيء يُنال دون أن تُقدِّم ما يعادله قيمةً — لذلك أعمل بجدّ، لأستحقّ أن أستمتع بجدّ.
>
> **[0:54]** إن كنتم تبنون شيئًا ذا قيمة، فلنتحدّث. أعمالي وبريدي الإلكتروني في هذه الصفحة.

</div>

---

## Delivery

- **Frame:** 16:9, 1920×1080, you in the centre third with some headroom. Nothing is cropped.
- **Sound:** a clip-on or phone-as-recorder mic close to you; a quiet room matters more than the camera.
- **Captions:** a WebVTT file per language (`intro-en.vtt` …) with the lines above — many people watch on mute.
- **Files:** `public/media/intros/intro-en.mp4`, `intro-fr.mp4`, `intro-ar.mp4` (+ optional
  `.vtt` and `-poster.webp`), then rebuild and redeploy. Encoding: see `README.md` → "Intro films".
