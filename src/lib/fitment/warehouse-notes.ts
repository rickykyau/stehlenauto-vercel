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
 */
function normalizeNoteHtml(html: string): string {
  // Collapse <br><br> into paragraph breaks for cleaner spacing.
  let out = html.replace(/(<br\s*\/?>\s*){2,}/gi, "<br><br>");
  // Wrap any consecutive <li>...</li> sequence in a <ul>.
  out = out.replace(
    /(?:\s*<li[^>]*>[\s\S]*?<\/li>\s*)+/gi,
    (match) => `<ul>${match}</ul>`,
  );
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
