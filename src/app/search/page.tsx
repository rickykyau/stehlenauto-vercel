import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/commerce/product-card";
import { Icons } from "@/components/ui/icons";
import { SearchInput } from "@/components/search/search-input";
import { Stars } from "@/components/ui/stars";
import { getCurrentVehicle } from "@/lib/garage/server";
import { POPULAR_VEHICLES, PRODUCTS } from "@/lib/catalog/mock";
import { searchProducts } from "@/lib/catalog";
import { withFitment } from "@/lib/fitment/match";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  // Empty /search is fine for crawl signal, but query result pages duplicate
  // catalog content and dilute domain authority — noindex them (Priya F-2).
  const hasQuery = Boolean(q?.trim());
  return {
    title: hasQuery ? `Search results — ${q}` : "Search",
    robots: hasQuery
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: { canonical: "/search" },
  };
}

const POPULAR_SEARCHES = [
  "F-150 tonneau cover",
  "Silverado trailer hitch",
  "Wrangler bull bar",
  "Tundra grille guard",
  "Tacoma headlights",
  "Ram bed mat",
  "running boards",
  "front grille mesh",
];

const RECENT_SEARCHES = [
  "F-150 SuperCrew tonneau 5.5",
  "Silverado class III hitch",
  "Wrangler grille guard",
];

const MATCHING_CATEGORIES = [
  { name: "Tonneau Covers", slug: "tonneau-covers" },
  { name: "Trailer Hitches", slug: "trailer-hitches" },
  { name: "Bull Guards & Grille Guards", slug: "bull-guards-grille-guards" },
  { name: "Bed Mats", slug: "truck-bed-mats" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const vehicle = (await getCurrentVehicle()) ?? undefined;
  const products = PRODUCTS;

  // Cycle 4 (Mike F-7): hit the real Shopify Storefront, not the mock list.
  // Vehicle pre-filter fails OPEN — if a vehicle-scoped search returns 0 we
  // fall back to no-vehicle results with a notice, instead of an empty page.
  let filtered: typeof PRODUCTS = [];
  let vehicleFilterRelaxed = false;
  if (query) {
    const scoped = vehicle
      ? `${query} ${vehicle.make} ${vehicle.model}`
      : query;
    filtered = await searchProducts(scoped, 24);
    if (filtered.length === 0 && vehicle) {
      filtered = await searchProducts(query, 24);
      vehicleFilterRelaxed = filtered.length > 0;
    }
  }
  const empty = !query;

  return (
    <main>
      {/* Search header */}
      <div
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 36, paddingBottom: 24 }}
        >
          <SearchInput defaultQuery={query} />
          {!empty && (
            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}
              >
                Results for &ldquo;
                <span style={{ color: "var(--color-primary)" }}>{query}</span>
                &rdquo;
              </h1>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "var(--color-muted)",
                }}
              >
                {filtered.length} MATCHES
                {vehicle &&
                  ` · FITTING ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {empty ? (
        <div
          className="container-x grid grid-cols-1 md:grid-cols-2"
          style={{ paddingTop: 56, paddingBottom: 96, gap: 32 }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              POPULAR SEARCHES
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {POPULAR_SEARCHES.map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="chip"
                  style={{ height: 32, padding: "0 12px", fontSize: 11 }}
                >
                  {t.toUpperCase()}
                </Link>
              ))}
            </div>

            <div
              className="eyebrow"
              style={{ marginTop: 36, marginBottom: 12 }}
            >
              SHOP BY VEHICLE
            </div>
            <div
              className="grid grid-cols-2 md:grid-cols-3"
              style={{ gap: 8 }}
            >
              {POPULAR_VEHICLES.slice(0, 6).map((v) => (
                <Link
                  key={`${v.make}-${v.model}`}
                  href={`/vehicle/${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}`}
                  className="btn btn-sm"
                  style={{
                    justifyContent: "flex-start",
                    height: 44,
                    padding: "0 14px",
                  }}
                >
                  <Icons.truck size={12} />
                  <span style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                    {v.make.toUpperCase()} {v.model.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>

            <div
              className="eyebrow"
              style={{ marginTop: 36, marginBottom: 12 }}
            >
              RECENT SEARCHES
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {RECENT_SEARCHES.map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  style={{
                    background: "transparent",
                    borderBottom: "1px solid var(--color-border)",
                    padding: "12px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Icons.search size={12} />
                    <span style={{ fontSize: 13 }}>{s}</span>
                  </span>
                  <Icons.arrowR size={12} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              TRENDING NOW
            </div>
            <div
              className="grid grid-cols-2"
              style={{ gap: 12 }}
            >
              {withFitment(products.slice(0, 4), vehicle).map((p) => (
                <ProductCard key={p.sku} product={p} vehicle={vehicle} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="container-x"
          style={{ paddingTop: 32, paddingBottom: 64 }}
        >
          {/* Did you mean */}
          {vehicleFilterRelaxed && (
            <div
              style={{
                background: "rgba(245,168,35,0.06)",
                border: "1px solid rgba(245,168,35,0.3)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--color-primary)" }}>
                NO EXACT-FIT MATCHES FOR YOUR{" "}
                {vehicle?.make.toUpperCase()} {vehicle?.model.toUpperCase()} —
              </span>{" "}
              showing all matching products. Verify fitment on each product page before ordering.
            </div>
          )}
          {filtered.length === 0 && (
            <div
              style={{
                background: "rgba(245,168,35,0.06)",
                border: "1px solid rgba(245,168,35,0.3)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-primary)",
                  letterSpacing: "0.12em",
                }}
              >
                NO RESULTS · TRY
              </span>
              {/* Cycle 6 (Mike): suggestions were stale ("roof racks" was
                  renamed to "roof-racks-baskets" in cycle 3, "rack mount" /
                  "cargo basket" returned 0 hits in live catalog). Use queries
                  that map to non-empty Shopify search results. */}
              {["tonneau cover", "trailer hitch", "bull bar"].map((s) => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  style={{
                    color: "var(--color-foreground)",
                    textDecoration: "underline",
                    fontSize: 13,
                  }}
                >
                  {s}
                </Link>
              ))}
            </div>
          )}

          {/* Cycle 5 (Mike): "MATCHES IN: …" used to render even when the
              query had 0 results, contradicting the "NO RESULTS" banner above
              it. Hide when there's nothing to match. */}
          {filtered.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-muted)",
                  letterSpacing: "0.12em",
                  alignSelf: "center",
                }}
              >
                BROWSE BY CATEGORY:
              </span>
              {MATCHING_CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="chip"
                  style={{ height: 26 }}
                >
                  {c.name.toUpperCase()}
                </Link>
              ))}
            </div>
          )}

          {filtered.length > 0 ? (
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ gap: 16 }}
            >
              {withFitment(filtered, vehicle).map((p) => (
                <ProductCard key={p.sku} product={p} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 48,
                textAlign: "center",
              }}
            >
              <Stars rating={0} size={14} />
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: "var(--color-muted)",
                }}
              >
                No matches yet — try a broader search above, or browse by
                category.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
