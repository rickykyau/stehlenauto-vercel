#!/usr/bin/env node
// Bulk-submit every URL in the live sitemap(s) to IndexNow (Bing + the shared
// IndexNow network). Run this once after deploying the key file to kick Bing
// into re-crawling the whole site, and any time after a large catalog change.
//
//   node scripts/indexnow-submit-sitemap.mjs          # submit
//   node scripts/indexnow-submit-sitemap.mjs --dry     # parse only, no submit
//
// The key here MUST match public/<key>.txt and src/lib/seo/indexnow.ts.

const KEY = "f83623ebfce67dfba6eb27134002925a";
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
const HOST = new URL(BASE).host;
const SITEMAPS = [`${BASE}/sitemap.xml`, `${BASE}/sitemap-1.xml`];
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10000; // IndexNow protocol cap per request
const DRY = process.argv.includes("--dry");

async function locsFrom(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  skip ${url} → HTTP ${res.status}`);
    return [];
  }
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const all = new Set();
for (const sm of SITEMAPS) {
  const locs = await locsFrom(sm);
  locs.forEach((u) => all.add(u));
  console.log(`  ${sm} → ${locs.length} URLs`);
}

const urls = [...all];
console.log(`\nTotal unique URLs: ${urls.length}`);

if (DRY) {
  console.log("(dry run — nothing submitted)");
  process.exit(0);
}

let ok = 0;
for (let i = 0; i < urls.length; i += BATCH) {
  const batch = urls.slice(i, i + BATCH);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${BASE}/${KEY}.txt`,
      urlList: batch,
    }),
  });
  const tag = res.ok || res.status === 202 ? "OK" : "FAIL";
  console.log(`  batch ${i / BATCH + 1}: ${batch.length} URLs → HTTP ${res.status} ${tag}`);
  if (res.ok || res.status === 202) ok += batch.length;
}

console.log(`\nSubmitted ${ok}/${urls.length} URLs to IndexNow.`);
process.exit(ok === urls.length ? 0 : 1);
