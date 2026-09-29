// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

// Set SITE_URL for previews or alternate domains. Production metadata must never point at localhost.
const site = process.env.SITE_URL || 'https://www.ahmedbaghouli.world';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 2048 } },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});