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
 * `<br/>` and `;` — e.g.
 *   "Will Fit 6.6 Ft Standard Bed ; Will Not Fit Carbon Bed"
 *   "Will Fit New Body Style 6.6 Ft Standard Bed ; Will Not Fit Carbon Bed ; Will Not Fit 2019 LD"
 *   "Will Fit New Body Style 6.6 Ft Standard Bed ; Will Not Fit Carbon Bed"
 * After splitting on ; and <br/>, the same atomic clause appears
 * many times. Dedupe at the clause level — case + whitespace
 * normalized — then rejoin. Preserves the first occurrence's order.
 */
function dedupeClauses(text: string): string {
  // Split on <br/> first to keep the visual line structure, then
  // collapse semicolon-clauses inside each line.
  const lines = text.split(/<br\s*\/?>/gi);
  const seen = new Set<string>();
  const keptLines: string[] = [];
  for (const line of lines) {
    const clauses = line.split(/\s*;\s*/);
    const lineKept: string[] = [];
    for (const c of clauses) {
      const norm = c
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .replace(/[(),]/g, "")
        .trim()
        .toLowerCase();
      if (!norm) continue;
      if (seen.has(norm)) continue;
      seen.add(norm);
      lineKept.push(c.trim());
    }
    if (lineKept.length > 0) {
      keptLines.push(lineKept.join(" ; "));
    }
  }
  return keptLines.join("<br/>");
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
