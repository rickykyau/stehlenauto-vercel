import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog/mock";
import { Icons } from "@/components/ui/icons";

/**
 * Cycle 14Z (Mike-O7 NF-NEW-1): replace the bare Next.js 404 with a
 * branded recovery surface. A customer who hits a dead product URL gets
 * a search box, a Continue Shopping CTA, top categories, and a phone link
 * — instead of white-on-white "Page not found" with nowhere to go.
 */
// Cycle 14Z (Mike-O8 F-1 NIT): browser tab read "Stehlen Auto — Heavy-Duty
// Vehicle Accessories" on every 404 because not-found.tsx didn't export
// metadata. Page is noindex so Google doesn't see this, but customers do.
export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const topCategories = CATEGORIES.slice(0, 6);
  return (
    <main
      className="container-x"
      style={{
        paddingTop: 64,
        paddingBottom: 96,
        minHeight: "60vh",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            letterSpacing: "0.16em",
            color: "var(--color-primary)",
            marginBottom: 16,
          }}
        >
          404 · NOT FOUND
        </div>
        <h1
          className="display-h2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 56,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            lineHeight: 0.95,
            marginBottom: 16,
          }}
        >
          THIS PART
          <br />
          ROLLED OFF.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--color-muted)",
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 560,
          }}
        >
          The page you&apos;re looking for moved or was discontinued. Use the
          search above, browse a category below, or call our techs at{" "}
          <a
            href="tel:+18883784536"
            style={{ color: "var(--color-primary)" }}
          >
            1-888-378-4536
          </a>{" "}
          and we&apos;ll find it.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
          <Link href="/collections" className="btn btn-primary btn-lg">
            <Icons.truck size={14} />
            BROWSE ALL PARTS
          </Link>
          <Link href="/" className="btn btn-lg">
            BACK TO HOME
          </Link>
        </div>

        <div className="eyebrow" style={{ marginBottom: 16 }}>
          POPULAR CATEGORIES
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-3"
          style={{ gap: 8, marginBottom: 48 }}
        >
          {topCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="btn"
              style={{
                justifyContent: "space-between",
                paddingLeft: 14,
                paddingRight: 14,
              }}
            >
              {c.name.toUpperCase()}
              <Icons.arrowR size={12} />
            </Link>
          ))}
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            fontSize: 13,
            color: "var(--color-muted)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--color-foreground)" }}>
            Looking for a part by SKU or part number?
          </strong>{" "}
          Type it in the search bar at the top of the page or call our techs
          at{" "}
          <a
            href="tel:+18883784536"
            style={{ color: "var(--color-primary)" }}
          >
            1-888-378-4536
          </a>{" "}
          Mon–Fri 9–5 PST.
        </div>
      </div>
    </main>
  );
}
