/**
 * Spec rows ("Part Number", "Brand", "Material", …) from a product's
 * description. Shared by the PDP Specs tab and the Product JSON-LD so the
 * structured data always matches what the shopper sees.
 */
/**
 * Cycle 14Z (Mike-O1 M-4): pull spec rows out of Shopify descriptionHtml.
 * Most product descriptions include a "Specifications" or "Specs" section
 * formatted as either a list of "Label: Value" lines or `<li><strong>Label
 * </strong> Value</li>` items. Extract the (label, value) pairs so the
 * SPECS tab can render a real table instead of "see description above".
 */
export function extractSpecRowsFromHtml(html: string): [string, string][] {
  if (!html) return [];
  const decoded = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Cycle 14Z (Mike-O2 N-5): the previous extractor stripped <strong> tags
  // to newlines, which broke "<li><strong>MPN:</strong> 14017</li>" into
  // three separate lines. Now: isolate the Specifications section first,
  // then pull `<li><strong>Label:</strong> Value</li>` directly with a
  // single regex.
  const out: [string, string][] = [];

  const specSection = decoded.match(
    /<h[1-6][^>]*>\s*(?:Specifications?|Specs|Tech\s*Specs|Product\s*Specs)\s*<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>|$)/i,
  );
  const scopeHtml = specSection ? specSection[1] : decoded;

  const liRe = /<li[^>]*>\s*<strong>\s*([^<:]+?)\s*:?\s*<\/strong>\s*([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liRe.exec(scopeHtml)) !== null) {
    const label = match[1].replace(/<[^>]+>/g, "").trim();
    const value = match[2].replace(/<[^>]+>/g, "").trim();
    if (label && value && label.length < 60 && value.length < 200) {
      out.push([label, value]);
    }
  }

  if (out.length === 0) {
    const plainRe = /<li[^>]*>\s*([A-Z][A-Za-z0-9 \-/&'()."]+?)\s*[:：]\s*([\s\S]*?)<\/li>/gi;
    while ((match = plainRe.exec(scopeHtml)) !== null) {
      const label = match[1].replace(/<[^>]+>/g, "").trim();
      const value = match[2].replace(/<[^>]+>/g, "").trim();
      if (label && value && label.length < 60 && value.length < 200) {
        out.push([label, value]);
      }
    }
  }

  return out;
}

/** First spec value whose label matches (case-insensitive), or undefined. */
export function specValue(rows: [string, string][], ...labels: string[]): string | undefined {
  const want = labels.map((l) => l.toLowerCase());
  return rows.find(([label]) => want.includes(label.toLowerCase()))?.[1];
}
