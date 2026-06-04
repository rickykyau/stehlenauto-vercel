// IndexNow (https://www.indexnow.org) — instant URL-change notification to
// Bing, Yandex, and the shared IndexNow network. Unlike a sitemap (which is a
// passive map a crawler reads on its own schedule), IndexNow is a PUSH: the
// moment a page is added or changed we tell the engines to re-fetch it.
//
// GEO relevance: Bing's index is the corpus ChatGPT Search reads from, so
// faster Bing freshness means new products + buyer-guide content surface in
// AI answers sooner. This is freshness plumbing, not a ranking booster.
//
// The key is PUBLIC by design — it's hosted at /<key>.txt on this same host,
// which is exactly how the IndexNow endpoint verifies we own the domain.
// There is no secret here; do not treat it like an API token.

export const INDEXNOW_KEY = "f83623ebfce67dfba6eb27134002925a";

const ENDPOINT = "https://api.indexnow.org/indexnow";

// IndexNow protocol cap: at most 10,000 URLs per request.
const MAX_URLS_PER_REQUEST = 10000;

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
}

/**
 * Notify IndexNow of one or more changed/added absolute URLs.
 *
 * Fire-and-forget by contract: indexing hints must NEVER break a request
 * path, so all failures are swallowed and reported via the boolean only.
 * Returns true if the network accepted the batch (200/202).
 */
export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  if (!urls.length) return false;
  const base = siteBase();
  const host = new URL(base).host;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, MAX_URLS_PER_REQUEST),
      }),
    });
    return res.ok || res.status === 202;
  } catch {
    return false;
  }
}

/**
 * Convenience: notify IndexNow that a single product PDP changed.
 * Call after a catalog/content mutation (e.g. a review is approved and the
 * PDP's aggregate rating shifts) so Bing re-crawls just that page.
 */
export async function pingProduct(handle: string): Promise<boolean> {
  return submitToIndexNow([`${siteBase()}/products/${handle}`]);
}
