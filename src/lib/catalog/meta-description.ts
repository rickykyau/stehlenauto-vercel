/**
 * Build the PDP meta / schema description from Shopify descriptionHtml.
 *
 * Listing copy opens with a paragraph whose first sentence is written to be
 * the SERP snippet. Older copy opens with an "<h2>Product Overview</h2>"
 * heading, so stripping the whole body produced snippets starting with the
 * words "Product Overview". Use the first <p> instead and end on a sentence
 * boundary when one fits, word boundary + ellipsis otherwise.
 */
const MAX = 158;
const MIN = 60;

function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function metaDescriptionFromHtml(html: string, fallback: string): string {
  const firstPara = toText(html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const source = firstPara.length >= MIN ? firstPara : toText(html);
  if (source.length < MIN) return fallback;
  if (source.length <= MAX) return source;

  const head = source.slice(0, MAX + 1);
  let cut = -1;
  for (const m of head.matchAll(/[.!?](?=\s)/g)) cut = m.index;
  if (cut + 1 >= MIN) return source.slice(0, cut + 1);
  return source.slice(0, MAX - 1).replace(/[\s,;.]+\S*$/, "") + "…";
}
