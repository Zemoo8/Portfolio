export const locales = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

/** A string in every supported language. */
export type L = Record<Locale, string>;

export const localeMeta: Record<Locale, { label: string; name: string; dir: 'ltr' | 'rtl'; ogLocale: string }> = {
  en: { label: 'EN', name: 'English', dir: 'ltr', ogLocale: 'en_US' },
  fr: { label: 'FR', name: 'Français', dir: 'ltr', ogLocale: 'fr_FR' },
  ar: { label: 'ع', name: 'العربية', dir: 'rtl', ogLocale: 'ar_TN' },
};

export const isLocale = (v: string | undefined): v is Locale => !!v && (locales as readonly string[]).includes(v);

/** Resolve a localized value. Plain strings are language-neutral (names, URLs, tech). */
export const tr = (value: L | string, lang: Locale): string => (typeof value === 'string' ? value : value[lang] ?? value.en);

/** Localized, base-aware path, e.g. path('fr', 'work/cheezy') -> /fr/work/cheezy/ */
export const path = (lang: Locale, sub = ''): string => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = sub.replace(/^\/|\/$/g, '');
  return `${base}/${lang}/${clean ? clean + '/' : ''}`;
};

/** Base-aware path to a file in /public. */
export const asset = (p: string): string => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;

/** Western digits everywhere (Tunisian usage), locale-appropriate month names. */
export const formatMonth = (iso: string, lang: Locale): string => {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
  const loc = lang === 'ar' ? 'ar-TN-u-nu-latn' : lang === 'fr' ? 'fr-FR' : 'en-GB';
  return m ? new Intl.DateTimeFormat(loc, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d) : String(y);
};
