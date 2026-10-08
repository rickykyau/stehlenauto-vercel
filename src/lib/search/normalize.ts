/**
 * Turn what shoppers type into a query Shopify's search can match.
 *
 *  - "class iii hitch"        → "class 3 hitch"  (titles say "Class 3")
 *  - "chase rack/bull bar"    → "(chase rack) OR (bull bar)"
 *  - "2020 silverado hitch"   → query "silverado hitch" + year 2020.
 *    Titles carry ranges ("2019-2024 …"), so a bare year never matches in
 *    Shopify; callers filter the results by fitment year instead.
 */

const ROMAN: Record<string, string> = { i: "1", ii: "2", iii: "3", iv: "4", v: "5" };

export type NormalizedSearch = {
  /** Query string for the Shopify Storefront search. */
  query: string;
  /** Model year the shopper typed, if any. */
  year: number | null;
};

export function normalizeSearchQuery(raw: string): NormalizedSearch {
  let q = raw.trim().replace(/\s+/g, " ");

  q = q.replace(/\bclass\s+(i{1,3}|iv|v)\b/gi, (_, r: string) => `class ${ROMAN[r.toLowerCase()]}`);

  let year: number | null = null;
  const thisYear = new Date().getFullYear();
  q = q.replace(/(^|\s)'?((?:19|20)\d{2})(?=\s|$)/g, (m, lead: string, y: string) => {
    const n = Number(y);
    if (year === null && n >= 1950 && n <= thisYear + 2) {
      year = n;
      return lead;
    }
    return m;
  });
  q = q.replace(/\s+/g, " ").trim();

  // "a/b" between words (not "1500/2500" or "F-150/F-250", which Shopify
  // already tokenizes fine) → OR.
  if (/[a-z]\s*\/\s*[a-z]/i.test(q) && !/\d\s*\/\s*\d/.test(q)) {
    const parts = q.split(/\s*\/\s*/).filter(Boolean);
    if (parts.length > 1) q = parts.map((p) => (p.includes(" ") ? `(${p})` : p)).join(" OR ");
  }

  // A year on its own ("2020") — keep it as the query rather than send "".
  if (!q && year !== null) return { query: String(year), year: null };
  return { query: q, year };
}
