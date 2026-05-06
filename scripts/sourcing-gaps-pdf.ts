/**
 * One-off PDF snapshot of /admin/sourcing-gaps.
 *
 * Runs the same query helpers the live page uses, renders a standalone HTML
 * page, then shells out to Chrome headless to print to PDF. Output:
 *   tmp/sourcing-gaps-<timestamp>.pdf
 *
 * Run with:
 *   pnpm exec tsx scripts/sourcing-gaps-pdf.ts
 */
import { config as dotenvConfig } from "dotenv";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local FIRST (matches Next.js's loading order); fall back to .env.
dotenvConfig({ path: resolve(__dirname, "..", ".env.local") });
dotenvConfig({ path: resolve(__dirname, "..", ".env") });
import {
  getLifecycleCounters,
  getStehlenShareByCategory,
  getTopSearchMisses,
  getVehicleCategoryHeatmap,
  getVendorCoverage,
  rankVehicleGapsFromHeatmap,
  type HeatmapData,
} from "../src/lib/admin/queries";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function escapeHtml(s: string | number | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function heatmapHtml(data: HeatmapData): string {
  const swatch = (n: number): string => {
    if (n === 0) return "background:#ef4444;color:#fff;";
    if (n <= 3) return "background:#f5a823;color:#0a0a0a;";
    if (n <= 10) return "background:#fde29a;color:#0a0a0a;";
    return "background:#22c55e;color:#0a0a0a;";
  };
  const rows = data.rows.map((row) => {
    const key = `${row.make}-${row.model}`;
    const cells = data.cells[key] ?? {};
    const total = Object.values(cells).reduce((a, b) => a + b, 0);
    const tds = data.categories
      .map((c) => {
        const v = cells[c] ?? 0;
        return `<td style="text-align:center;padding:4px"><div style="${swatch(v)}width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-weight:700;font-size:11px;font-family:monospace">${v}</div></td>`;
      })
      .join("");
    return `<tr><td style="white-space:nowrap;padding:6px 12px;border-right:1px solid #2a2a2a;font-size:12px"><strong>${escapeHtml(row.make)}</strong> ${escapeHtml(row.model)}<div style="font-size:10px;color:#888">${total} SKUs</div></td>${tds}</tr>`;
  });
  const headerCells = data.categories
    .map(
      (c) =>
        `<th style="padding:6px 4px;font-size:9px;font-weight:500;color:#888;letter-spacing:0.06em;writing-mode:vertical-rl;height:90px">${escapeHtml(c.toUpperCase())}</th>`,
    )
    .join("");
  return `<table style="border-collapse:collapse;font-family:monospace"><thead><tr><th style="padding:8px 12px;font-size:11px;text-align:left;letter-spacing:0.08em">VEHICLE</th>${headerCells}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

async function main(): Promise<void> {
  console.log("[1/3] Querying Shopify Admin + Neon …");
  const [misses, heatmap, vendors, lifecycle, stehlenShare] = await Promise.all([
    getTopSearchMisses(30, 50),
    getVehicleCategoryHeatmap(),
    getVendorCoverage(),
    getLifecycleCounters(),
    getStehlenShareByCategory(),
  ]);
  const ranked = heatmap ? rankVehicleGapsFromHeatmap(heatmap) : [];
  console.log(
    `   misses=${misses.length}, heatmap=${heatmap ? "ok" : "null"}, vendors=${vendors.length}, lifecycle=${lifecycle ? "ok" : "null"}, stehlen=${stehlenShare.length}, ranked=${ranked.length}`,
  );

  const generatedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "long",
    timeStyle: "short",
  });

  const kpis = lifecycle
    ? [
        { label: "TOTAL PRODUCTS", value: lifecycle.totalProducts },
        { label: "ADDED 30D", value: lifecycle.addedLast30Days },
        { label: "ADDED 90D", value: lifecycle.addedLast90Days },
        { label: "OUT OF STOCK", value: lifecycle.outOfStock },
        { label: "_FITMENT-HOLD", value: lifecycle.taggedHold },
      ]
    : [];

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Stehlen Auto · Sourcing Gaps · ${generatedAt}</title>
<style>
  @page { size: 11in 17in; margin: 0.4in; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Inter", system-ui, sans-serif; color: #ffffff; background: #0a0a0a; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; }
  h1 { font-family: "Geist Mono", monospace; font-size: 28px; letter-spacing: -0.01em; text-transform: uppercase; margin: 0 0 4px; }
  h2 { font-family: "Geist Mono", monospace; font-size: 18px; text-transform: uppercase; margin: 32px 0 8px; border-top: 1px solid #2a2a2a; padding-top: 16px; }
  .eyebrow { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: #f5a823; text-transform: uppercase; }
  .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 16px 0 24px; }
  .kpi { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; padding: 12px; }
  .kpi-label { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; color: #888; }
  .kpi-value { font-family: monospace; font-size: 24px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
  th { font-family: monospace; font-size: 9px; letter-spacing: 0.1em; color: #888; font-weight: 500; }
  .empty { color: #ef4444; font-size: 11px; }
  .muted { color: #888; font-size: 11px; }
  .ok { color: #22c55e; }
  .warn { color: #f5a823; }
  .err { color: #ef4444; }
  .pageb { page-break-before: always; }
  .legend { font-size: 11px; color: #888; margin: 4px 0 12px; }
  .legend span { display: inline-block; padding: 1px 8px; border-radius: 3px; margin-right: 8px; font-family: monospace; font-size: 10px; font-weight: 700; }
</style>
</head><body>

<header>
  <div class="eyebrow">OWNER · ADMIN · SOURCING GAPS</div>
  <h1>Stehlen Auto · Sourcing Gaps</h1>
  <p class="muted">Snapshot generated ${escapeHtml(generatedAt)} · live data via Shopify Admin + Neon</p>
</header>

${
  kpis.length
    ? `<div class="kpi-grid">${kpis
        .map(
          (k) =>
            `<div class="kpi"><div class="kpi-label">${escapeHtml(k.label)}</div><div class="kpi-value">${escapeHtml(k.value.toLocaleString())}</div></div>`,
        )
        .join("")}</div>`
    : ""
}

${
  heatmap
    ? `<h2>Vehicle × Category Heatmap</h2>
<div class="legend">
  <span style="background:#ef4444;color:#fff">empty</span>
  <span style="background:#f5a823;color:#0a0a0a">≤3</span>
  <span style="background:#fde29a;color:#0a0a0a">≤10</span>
  <span style="background:#22c55e;color:#0a0a0a">healthy</span>
  Each cell = SKUs tagged make:&lt;Make&gt; AND model:&lt;Model&gt; in Shopify Admin.
</div>
${heatmapHtml(heatmap)}`
    : "<p>Shopify Admin not configured — heatmap unavailable.</p>"
}

${
  ranked.length
    ? `<h2>Top Coverage Gaps</h2>
<p class="muted">Ranked by (US annual unit sales in 1000s) × (empty categories + 0.5 × thin categories).</p>
<table>
<thead><tr><th>RANK</th><th>VEHICLE</th><th>EST UNITS/YR</th><th>SKUS</th><th>EMPTY CATEGORIES</th><th>THIN CATEGORIES</th></tr></thead>
<tbody>
${ranked
  .slice(0, 16)
  .map(
    (r) => `<tr>
  <td><strong>${r.priorityRank}</strong></td>
  <td><strong>${escapeHtml(r.make)}</strong> ${escapeHtml(r.model)}</td>
  <td class="muted">${(r.estAnnualUnits / 1000).toLocaleString()}K</td>
  <td>${r.totalSkus}</td>
  <td class="empty">${escapeHtml(r.emptyCategories.join(", ") || "—")}</td>
  <td class="muted">${escapeHtml(
    r.thinCategories.map((t) => `${t.category}(${t.count})`).join(", ") || "—",
  )}</td>
</tr>`,
  )
  .join("")}
</tbody></table>`
    : ""
}

${
  stehlenShare.length
    ? `<h2 class="pageb">Stehlen-Branded Share by Category</h2>
<p class="muted">Lanes at 0% are private-label expansion candidates.</p>
<table>
<thead><tr><th>CATEGORY</th><th>TOTAL SKUS</th><th>STEHLEN-BRANDED</th><th>SHARE</th></tr></thead>
<tbody>
${stehlenShare
  .map(
    (r) => `<tr>
  <td>${escapeHtml(r.category)}</td>
  <td>${r.totalSkus}</td>
  <td>${r.stehlenSkus}</td>
  <td class="${r.sharePct === 0 ? "err" : r.sharePct < 25 ? "warn" : "ok"}"><strong>${r.sharePct}%</strong></td>
</tr>`,
  )
  .join("")}
</tbody></table>`
    : ""
}

<h2>Zero-Result Search Log · last 30 days</h2>
<p class="muted">Empirical demand we couldn't meet. ${
    misses.length === 0
      ? "Logging started recently — table fills with real signal over the coming weeks."
      : `${misses.length} unique queries logged.`
  }</p>
${
  misses.length
    ? `<table>
<thead><tr><th>MISSES</th><th>QUERY</th><th>VEHICLE HINT</th><th>LAST SEEN</th></tr></thead>
<tbody>
${misses
  .map(
    (m) => `<tr>
  <td><strong class="${m.count >= 10 ? "err" : ""}">${m.count}</strong></td>
  <td style="font-family:monospace">${escapeHtml(m.query)}</td>
  <td class="muted">${escapeHtml(m.vehicleHint || "—")}</td>
  <td class="muted" style="font-family:monospace">${new Date(m.lastSeen).toLocaleDateString()}</td>
</tr>`,
  )
  .join("")}
</tbody></table>`
    : ""
}

${
  vendors.length
    ? `<h2 class="pageb">Vendor Coverage</h2>
<p class="muted">Existing suppliers and the makes they already cover. Use to find the cheapest path to filling a coverage gap.</p>
<table>
<thead><tr><th>VENDOR</th><th>SKUS</th><th>TOP MAKES</th><th>STEHLEN?</th></tr></thead>
<tbody>
${vendors
  .slice(0, 30)
  .map(
    (v) => `<tr>
  <td><strong>${escapeHtml(v.vendor)}</strong></td>
  <td>${v.totalSkus}</td>
  <td class="muted">${escapeHtml(
    v.topMakes.map((m) => `${m.make}(${m.count})`).join(", ") || "—",
  )}</td>
  <td>${v.isStehlenBranded ? '<span class="warn"><strong>YES</strong></span>' : "—"}</td>
</tr>`,
  )
  .join("")}
</tbody></table>`
    : ""
}

<footer style="margin-top:40px;padding-top:16px;border-top:1px solid #2a2a2a;font-size:10px;color:#888;font-family:monospace">
  Stehlen Auto · ${escapeHtml(generatedAt)} · Live URL: stehlenauto-vercel.vercel.app/admin/sourcing-gaps
</footer>

</body></html>`;

  const tmpDir = resolve(__dirname, "..", "tmp");
  mkdirSync(tmpDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const htmlPath = resolve(tmpDir, `sourcing-gaps-${ts}.html`);
  const pdfPath = resolve(tmpDir, `sourcing-gaps-${ts}.pdf`);

  console.log(`[2/3] Writing HTML to ${htmlPath}`);
  writeFileSync(htmlPath, html, "utf-8");

  console.log(`[3/3] Printing to PDF via Chrome headless …`);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`,
      `--virtual-time-budget=2000`,
      `file://${htmlPath}`,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );

  console.log(`\nPDF ready: ${pdfPath}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
