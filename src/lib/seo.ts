// Stable JSON-LD ids, so every page's graph points at the same person and the same site.
export const ids = (site: URL) => ({
  person: new URL('/#person', site).href,
  website: new URL('/#website', site).href,
});
