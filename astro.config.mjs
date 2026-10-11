// @ts-check
import { defineConfig } from 'astro/config';

// Set SITE_URL for previews or alternate domains. Production metadata must never point at localhost.
const site = process.env.SITE_URL || 'https://www.ahmedbaghouli.world';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  // every internal link is fetched while the pointer rests on it, so the next page is already here
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 2048 } },
});
