// @ts-check
import { defineConfig } from 'astro/config';

// Set SITE_URL when deploying (e.g. SITE_URL=https://your-domain.com npm run build).
// It drives canonical URLs, hreflang alternates, Open Graph URLs and the sitemap.
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 2048 } },
});
