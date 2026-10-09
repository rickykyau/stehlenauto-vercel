import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { getVehicleHubs } from "@/lib/fitment/vehicle-hubs";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo/jsonld";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Shop by Vehicle — Truck & SUV Accessories by Make and Model",
  description:
    "Find accessories that fit your truck or SUV: tonneau covers, bull guards, running boards, trailer hitches, bed mats and more for Ford, Chevrolet, GMC, Ram, Toyota, Nissan and others.",
  alternates: { canonical: "/vehicles" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

export default function VehiclesIndexPage() {
  const hubs = getVehicleHubs();
  const byMake = new Map<string, typeof hubs>();
  for (const h of hubs) byMake.set(h.make, [...(byMake.get(h.make) ?? []), h]);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Shop by vehicle",
    itemListElement: hubs.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${h.make} ${h.model} accessories`,
      url: `${SITE_URL}/vehicle/${h.slug}`,
    })),
  };

  return (
    <main className="container-x" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd(
              [
                { name: "Home", href: "/" },
                { name: "Shop by vehicle", href: "/vehicles" },
              ],
              SITE_URL,
            ),
          ),
        }}
      />
      {/* JSON-LD from our own fitment index; jsonLdString escapes "<". */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(itemList) }} />
      <nav
        aria-label="Breadcrumb"
        style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--color-muted)", marginBottom: 14 }}
      >
        <Link href="/">Home</Link>
        <Icons.chevRight size={10} />
        <span style={{ color: "var(--color-foreground)" }}>Shop by vehicle</span>
      </nav>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        SHOP
      </div>
      <h1
        className="display-h3"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 44,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          marginBottom: 12,
        }}
      >
        SHOP BY VEHICLE
      </h1>
      <p style={{ color: "var(--color-muted)", maxWidth: 720, marginBottom: 32, lineHeight: 1.6 }}>
        Pick your truck or SUV to see the accessories that fit it. Every product page also checks the exact year,
        bed length and cab before you add it to the cart.
      </p>
      <div style={{ display: "grid", gap: 32 }}>
        {[...byMake.entries()].map(([make, list]) => (
          <section key={make} aria-labelledby={`make-${make}`}>
            <h2
              id={`make-${make}`}
              style={{
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              {make}
            </h2>
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              style={{ gap: 8, listStyle: "none", padding: 0, margin: 0 }}
            >
              {list.map((h) => (
                <li key={h.slug}>
                  <Link
                    href={`/vehicle/${h.slug}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <span>
                      {h.make} {h.model}
                    </span>
                    <span style={{ color: "var(--color-muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                      {h.from === h.to ? h.from : `${h.from}–${h.to}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
