import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Cycle 14O (admin): warehouse-verified fitment notes for 103 products.
 * Pulled from the merch-team CSV catalog-fitment-verification 05-04-2026.
 *
 * Each entry contains a verdict (HARD HOLD / VERIFY HIGH / INSPECT) and a
 * free-form HTML note describing exactly which year/body/trim variants the
 * part fits — including the critical "Will Not Fit" exclusions a customer
 * needs to read before tapping Add to Cart.
 */
export type WarehouseNote = {
  verdict: string;
  notes: string;
  has_warning: boolean;
};

let cached: Record<string, WarehouseNote> | null = null;

async function load(): Promise<Record<string, WarehouseNote>> {
  if (cached) return cached;
  const file = path.join(
    process.cwd(),
    "data",
    "warehouse_fitment_notes.json",
  );
  try {
    const raw = await fs.readFile(file, "utf8");
    cached = JSON.parse(raw) as Record<string, WarehouseNote>;
  } catch {
    cached = {};
  }
  return cached;
}

/**
 * Cycle 14O follow-up: the CSV ships orphan `<li>` blocks (no wrapping
 * `<ul>`) and uses `<br>` for line breaks. Wrap consecutive `<li>` runs
 * in a `<ul>` so the whitelist HTML renderer emits proper bullets.
 *
 * Cycle 14AA (Mike-O14AA F-6 MAJOR): the merch-team CSV occasionally
 * ships duplicate sentences within a single product's note ("Will Fit
 * 5.5 Ft (67.1\") Short Bed Models Only" appearing twice). Looks sloppy
 * and erodes trust. Dedupe identical lines (after trimming + lowercase
 * comparison) while preserving order.
 */
/**
 * Cycle 14AG (Mike-O14AG NF-5): the merch team's metafield notes
 * occasionally contain 4 near-duplicate clauses separated by
 * `<br/>` and `;`. The original equality-based dedup left 3 lines
 * because "Will Fit 6.6 Ft Standard Bed" and "Will Fit New Body
 * Style 6.6 Ft Standard Bed" are not exact-equal strings.
 *
 * Cycle 14AH (Mike-O14AH NF-5 round 2): switched to a containment-
 * aware dedup. A clause whose normalized text is contained in (or
 * contains) an already-kept clause is treated as a duplicate. The
 * MORE-SPECIFIC clause wins ("New Body Style 6.6 Ft" beats "6.6 Ft").
 * Output collapses to a single line of unique clauses joined by
 * " ; " — readable, no <br/>-separated near-duplicate noise.
 */
function dedupeClauses(text: string): string {
  // Pull every clause across all lines into a flat list.
  const allClauses: string[] = [];
  for (const line of text.split(/<br\s*\/?>/gi)) {
    for (const c of line.split(/\s*;\s*/)) {
      const trimmed = c.trim();
      if (trimmed) allClauses.push(trimmed);
    }
  }
  if (allClauses.length === 0) return "";

  const tokenize = (s: string): Set<string> => {
    const cleaned = s
      .replace(/<[^>]+>/g, " ")
      .replace(/[(),"]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return new Set(cleaned.split(" ").filter((t) => t.length > 0));
  };

  const isSubset = (a: Set<string>, b: Set<string>): boolean => {
    if (a.size > b.size) return false;
    for (const t of a) if (!b.has(t)) return false;
    return true;
  };

  // Token-set containment dedup. A clause whose word-set is a subset of
  // an already-kept clause is redundant ("Will Fit 6.6 Ft" ⊂ "Will Fit
  // New Body Style 6.6 Ft" once tokenized — string containment misses
  // this because they differ as substrings, not as token sets). When
  // the new clause is a strict superset, it replaces the kept one.
  const kept: { raw: string; tokens: Set<string> }[] = [];
  for (const raw of allClauses) {
    const tokens = tokenize(raw);
    if (tokens.size === 0) continue;
    let absorbed = false;
    let replaceIdx = -1;
    for (let i = 0; i < kept.length; i++) {
      const ks = kept[i]!.tokens;
      if (isSubset(tokens, ks)) {
        // New clause's tokens are a subset of an already-kept clause —
        // the kept clause is more specific, skip the new one.
        absorbed = true;
        break;
      }
      if (isSubset(ks, tokens)) {
        // The kept clause is a subset of this new one — new is more
        // specific, replace.
        replaceIdx = i;
      }
    }
    if (absorbed) continue;
    if (replaceIdx >= 0) {
      kept[replaceIdx] = { raw, tokens };
    } else {
      kept.push({ raw, tokens });
    }
  }

  return kept.map((k) => k.raw).join(" ; ");
}

export function normalizeNoteHtml(html: string): string {
  if (!html) return html;
  let out = html.replace(/(<br\s*\/?>\s*){2,}/gi, "<br><br>");
  out = out.replace(
    /(?:\s*<li[^>]*>[\s\S]*?<\/li>\s*)+/gi,
    (match) => `<ul>${match}</ul>`,
  );
  // Dedupe <li> entries with identical inner text within the same note.
  out = out.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (full, inner: string) => {
    const seen = new Set<string>();
    const kept: string[] = [];
    const matches = inner.matchAll(/<li[^>]*>[\s\S]*?<\/li>/gi);
    for (const match of matches) {
      const liHtml = match[0];
      const text = liHtml
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      if (text && !seen.has(text)) {
        seen.add(text);
        kept.push(liHtml);
      }
    }
    if (kept.length === 0) return full;
    return `<ul>${kept.join("")}</ul>`;
  });
  // Cycle 14AG: dedupe at the semicolon-clause level. Catches the merch-
  // team metafield case where 4 lines say overlapping things separated by
  // ; and <br/>. The previous "consecutive-only" dedup missed this.
  out = dedupeClauses(out);
  return out;
}

export async function getWarehouseNote(
  handle: string,
): Promise<WarehouseNote | null> {
  const map = await load();
  const raw = map[handle];
  if (!raw) return null;
  return { ...raw, notes: normalizeNoteHtml(raw.notes) };
}
