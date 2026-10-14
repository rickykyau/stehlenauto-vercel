/**
 * Internal pipeline notes sometimes get written into the customer-facing
 * fitment-notes metafield, e.g.
 *   "[Fitment derived from CB item data 2026-08-25; CA Fitment attribute not
 *    yet populated — re-run CA sync when available.]"
 * Strip bracketed notes that read like system/ops text so shoppers never see
 * them. Brackets without ops keywords (rare, but possible merch copy) stay.
 */
const SYSTEM_NOTE =
  /\[[^\]]*\b(derived from|CB item|CA fitment|ChannelAdvisor|re-?run|sync|not yet populated|metafield|TODO|internal|auto-?generated)\b[^\]]*\]/gi;

export function stripSystemNotes(html: string | null | undefined): string | null {
  if (!html) return null;
  const cleaned = html
    .replace(SYSTEM_NOTE, "")
    // tidy separators / empty tags left behind
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br/>")
    .replace(/<(p|li|span|strong|em)>\s*<\/\1>/gi, "")
    .replace(/^\s*(<br\s*\/?>|;|·|-)\s*/i, "")
    .replace(/\s*(<br\s*\/?>|;)\s*$/i, "")
    .trim();
  return cleaned.replace(/<[^>]+>/g, "").trim() ? cleaned : null;
}
