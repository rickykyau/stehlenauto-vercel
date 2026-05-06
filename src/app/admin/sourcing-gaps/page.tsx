import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/admin/guard";
import {
  getLifecycleCounters,
  getStehlenShareByCategory,
  getTopSearchMisses,
  getVehicleCategoryHeatmap,
  getVendorCoverage,
  rankVehicleGapsFromHeatmap,
  type HeatmapData,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sourcing Gaps · Admin",
  robots: { index: false, follow: false },
};

function HeatmapGrid({ data }: { data: HeatmapData }) {
  const cellSize = 36;
  const swatch = (count: number) => {
    if (count === 0) return "rgba(239,68,68,0.85)";
    if (count <= 3) return "rgba(245,168,35,0.85)";
    if (count <= 10) return "rgba(245,168,35,0.35)";
    return "rgba(34,197,94,0.85)";
  };
  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr>
            <th style={{ position: "sticky", left: 0, background: "var(--color-surface)", padding: "8px 12px", fontSize: 11, textAlign: "left", letterSpacing: "0.08em" }}>
              VEHICLE
            </th>
            {data.categories.map((c) => (
              <th key={c} style={{ padding: "8px 6px", fontSize: 10, fontWeight: 500, color: "var(--color-muted)", letterSpacing: "0.06em", writingMode: "vertical-rl", height: 110 }}>
                {c.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const key = `${row.make}-${row.model}`;
            const cells = data.cells[key] ?? {};
            const total = Object.values(cells).reduce((a, b) => a + b, 0);
            return (
              <tr key={key}>
                <td style={{ position: "sticky", left: 0, background: "var(--color-surface)", padding: "6px 12px", fontSize: 12, borderRight: "1px solid var(--color-border)" }}>
                  <strong>{row.make}</strong> {row.model}
                  <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{total} SKUs total</div>
                </td>
                {data.categories.map((c) => {
                  const v = cells[c] ?? 0;
                  return (
                    <td key={c} style={{ padding: 2, textAlign: "center" }}>
                      <div title={`${row.make} ${row.model} × ${c}: ${v} SKUs`} style={{ width: cellSize, height: cellSize, background: swatch(v), display: "flex", alignItems: "center", justifyContent: "center", color: v === 0 ? "white" : "var(--color-background)", fontSize: 11, fontWeight: 700, borderRadius: 4 }}>
                        {v}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function SourcingGapsPage() {
  const guard = await requireOwner();
  if (!guard.allowed) {
    if (guard.reason === "unauthenticated") redirect("/sign-in?redirect_url=/admin/sourcing-gaps");
    return (
      <main className="container-x" style={{ paddingTop: 96, paddingBottom: 128 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, textTransform: "uppercase" }}>403 — OWNER ONLY</h1>
        <p style={{ color: "var(--color-muted)", marginTop: 12 }}>
          This page is restricted to the owner role. If you should have access, ask the dev team to add your Clerk user ID to <code>ADMIN_OWNER_USER_IDS</code> in Vercel env vars, or set <code>publicMetadata.role = "owner"</code> on your Clerk user.
        </p>
      </main>
    );
  }

  const [misses, heatmap, vendors, lifecycle, stehlenShare] = await Promise.all([
    getTopSearchMisses(30, 50),
    getVehicleCategoryHeatmap(),
    getVendorCoverage(),
    getLifecycleCounters(),
    getStehlenShareByCategory(),
  ]);
  const ranked = heatmap ? rankVehicleGapsFromHeatmap(heatmap) : [];

  return (
    <main className="container-x" style={{ paddingTop: 32, paddingBottom: 96, maxWidth: 1400 }}>
      <header style={{ marginBottom: 32, borderBottom: "1px solid var(--color-border)", paddingBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>OWNER · ADMIN</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, letterSpacing: "-0.01em", textTransform: "uppercase" }}>SOURCING GAPS</h1>
        <p style={{ color: "var(--color-muted)", marginTop: 8, maxWidth: 720 }}>
          Live snapshot of where the catalog is empty and where customers are searching for things we don&apos;t carry. Refresh the page to re-query Shopify Admin + Neon.
        </p>
      </header>

      {/* Section 6 — lifecycle counters strip */}
      {lifecycle && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 40 }}>
          {[
            { label: "TOTAL PRODUCTS", value: lifecycle.totalProducts },
            { label: "ADDED · 30D", value: lifecycle.addedLast30Days },
            { label: "ADDED · 90D", value: lifecycle.addedLast90Days },
            { label: "OUT OF STOCK", value: lifecycle.outOfStock },
            { label: "_FITMENT-HOLD", value: lifecycle.taggedHold },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: 16 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--color-muted)" }}>{kpi.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, marginTop: 6 }}>{kpi.value.toLocaleString()}</div>
            </div>
          ))}
        </section>
      )}

      {/* Section 1 — vehicle × category heatmap */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.005em", marginBottom: 8 }}>VEHICLE × CATEGORY HEATMAP</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 16 }}>
          SKU count per vehicle generation × category. <span style={{ color: "rgba(239,68,68,0.95)" }}>Red</span> = empty, <span style={{ color: "rgba(245,168,35,0.95)" }}>amber</span> = thin (≤10), <span style={{ color: "rgba(34,197,94,0.95)" }}>green</span> = healthy (&gt;10). Counts come from <code>tag:make:&lt;Make&gt;</code> + <code>tag:model:&lt;Model&gt;</code> matches in Shopify Admin.
        </p>
        {heatmap ? <HeatmapGrid data={heatmap} /> : <p style={{ color: "var(--color-muted)" }}>Shopify Admin not configured — set <code>SHOPIFY_ADMIN_TOKEN</code> in Vercel.</p>}
      </section>

      {/* Section 2 — top vehicle gen gaps */}
      {ranked.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.005em", marginBottom: 8 }}>TOP COVERAGE GAPS</h2>
          <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 16 }}>
            Ranked by (estimated US annual unit sales in 1000s) × (empty categories + 0.5 × thin categories). Higher rank = bigger sourcing opportunity.
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {["RANK", "VEHICLE", "EST. UNITS/YR", "TOTAL SKUS", "EMPTY CATEGORIES", "THIN CATEGORIES"].map((h) => (
                    <th key={h} className="mono" style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: "var(--color-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 16).map((r, i) => (
                  <tr key={`${r.make}-${r.model}`} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="mono" style={{ padding: "10px 12px", fontWeight: 700 }}>{r.priorityRank}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <strong>{r.make}</strong> {r.model}
                    </td>
                    <td className="mono" style={{ padding: "10px 12px" }}>{(r.estAnnualUnits / 1000).toLocaleString()}K</td>
                    <td className="mono" style={{ padding: "10px 12px" }}>{r.totalSkus}</td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: r.emptyCategories.length > 0 ? "rgba(239,68,68,0.95)" : "var(--color-muted)" }}>
                      {r.emptyCategories.join(", ") || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: "var(--color-muted)" }}>
                      {r.thinCategories.map((t) => `${t.category}(${t.count})`).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 8, fontStyle: "italic" }}>
            ↑ Showing top 16 of {ranked.length} tracked vehicle gens.
          </p>
        </section>
      )}

      {/* Section 3 — Stehlen-branded share by category */}
      {stehlenShare.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.005em", marginBottom: 8 }}>STEHLEN-BRANDED SHARE</h2>
          <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 16 }}>
            % of SKUs in each category that ship under the Stehlen-branded vendor name. Lanes at 0% are private-label expansion candidates. Sorted lowest-first.
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {["CATEGORY", "TOTAL SKUS", "STEHLEN-BRANDED", "SHARE"].map((h) => (
                    <th key={h} className="mono" style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: "var(--color-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stehlenShare.map((r) => (
                  <tr key={r.category} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 12px" }}>{r.category}</td>
                    <td className="mono" style={{ padding: "10px 12px" }}>{r.totalSkus}</td>
                    <td className="mono" style={{ padding: "10px 12px" }}>{r.stehlenSkus}</td>
                    <td className="mono" style={{ padding: "10px 12px", color: r.sharePct === 0 ? "rgba(239,68,68,0.95)" : r.sharePct < 25 ? "rgba(245,168,35,0.95)" : "var(--color-success)", fontWeight: 700 }}>{r.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section 4 — zero-result search log */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.005em", marginBottom: 8 }}>ZERO-RESULT SEARCH LOG · 30D</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 16 }}>
          Empirical demand we can&apos;t meet today. Every customer who typed a query into the search bar that returned zero predictive-search results gets logged. <strong>Note:</strong> logging started when this page was deployed — week 1 will be thin, week 4+ shows real patterns.
        </p>
        {misses.length === 0 ? (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, padding: 24, color: "var(--color-muted)", fontSize: 13 }}>
            No misses logged in the last 30 days. Either the catalog covers everything customers are searching for, or logging hasn&apos;t accumulated enough data yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {["MISSES", "QUERY", "VEHICLE HINT", "LAST SEEN"].map((h) => (
                    <th key={h} className="mono" style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: "var(--color-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {misses.map((m) => (
                  <tr key={m.query} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="mono" style={{ padding: "10px 12px", fontWeight: 700, color: m.count >= 10 ? "rgba(239,68,68,0.95)" : "var(--color-foreground)" }}>{m.count}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)" }}>{m.query}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--color-muted)" }}>{m.vehicleHint || "—"}</td>
                    <td className="mono" style={{ padding: "10px 12px", fontSize: 11, color: "var(--color-muted)" }}>{new Date(m.lastSeen).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 5 — vendor coverage */}
      {vendors.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.005em", marginBottom: 8 }}>VENDOR COVERAGE</h2>
          <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 16 }}>
            Existing suppliers and the makes they already produce parts for. Use to find the cheapest path to coverage — a vendor already shipping you Make X is the fastest source for the next Make X SKU you need.
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {["VENDOR", "TOTAL SKUS", "TOP MAKES (count)", "STEHLEN?"].map((h) => (
                    <th key={h} className="mono" style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: "var(--color-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.slice(0, 25).map((v) => (
                  <tr key={v.vendor} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{v.vendor}</td>
                    <td className="mono" style={{ padding: "10px 12px" }}>{v.totalSkus}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--color-muted)" }}>
                      {v.topMakes.map((m) => `${m.make}(${m.count})`).join(", ") || "—"}
                    </td>
                    <td className="mono" style={{ padding: "10px 12px", fontSize: 11, color: v.isStehlenBranded ? "var(--color-primary)" : "var(--color-muted)" }}>
                      {v.isStehlenBranded ? "YES" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer style={{ marginTop: 64, paddingTop: 16, borderTop: "1px solid var(--color-border)", fontSize: 11, color: "var(--color-muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>Snapshot generated at {new Date().toLocaleString()}. Refresh to re-query.</div>
        <div>
          <Link href="/" style={{ color: "var(--color-muted)" }}>← Back to site</Link>
        </div>
      </footer>
    </main>
  );
}
