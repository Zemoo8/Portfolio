import type { APIRoute } from 'astro';
import { locales, path } from '../i18n/config';
import { projects } from '../content/projects';

// Every page in every language, with hreflang alternates.
export const GET: APIRoute = ({ site }) => {
  const routes = ['', ...projects.map((p) => `work/${p.slug}`)];
  const url = (l: string, r: string) => new URL(path(l as never, r), site).href;
  const body = routes
    .flatMap((r) =>
      locales.map(
        (l) => `  <url>
    <loc>${url(l, r)}</loc>
${locales.map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${url(a, r)}"/>`).join('\n')}
  </url>`,
      ),
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
