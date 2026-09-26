// Link audit over the built site: every internal href/src must resolve to a file in dist/,
// every external URL must answer (LinkedIn answers bots with 999 — reported, not failed).
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') && files.push(path.join(d, e.name))));
walk(dist);

const internal = new Map();
const external = new Set();
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const [, attr, url] of html.matchAll(/\s(href|src|poster|data-poster|srcset)="([^"]+)"/g)) {
    for (const u of attr === 'srcset' ? url.split(',').map((s) => s.trim().split(' ')[0]) : [url]) {
      if (/^(mailto:|tel:|#|data:)/.test(u)) continue;
      if (/^https?:\/\//.test(u)) { if (!u.startsWith('http://localhost')) external.add(u); continue; }
      const clean = u.split('#')[0].split('?')[0];
      if (!clean) continue;
      const abs = clean.startsWith('/') ? clean : '/' + path.relative(dist, path.join(path.dirname(f), clean)).replace(/\\/g, '/');
      internal.set(abs, f);
    }
  }
}

let broken = 0;
for (const [u, from] of internal) {
  const p = path.join(dist, decodeURIComponent(u));
  const ok = fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html')));
  if (!ok) { broken++; console.log('BROKEN internal', u, 'in', from); }
}
console.log(`${files.length} pages, ${internal.size} internal targets, ${broken} broken`);

const results = await Promise.all(
  [...external].map(async (u) => {
    try {
      const r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 link-audit' }, signal: AbortSignal.timeout(20000) });
      return [u, r.status];
    } catch (e) { return [u, 'ERR ' + e.cause?.code]; }
  }),
);
for (const [u, s] of results.sort()) console.log(String(s).padEnd(5), u);
const bad = results.filter(([u, s]) => !(s === 200 || (s === 999 && u.includes('linkedin.com'))));
console.log(`${results.length} external, ${bad.length} failing`);
