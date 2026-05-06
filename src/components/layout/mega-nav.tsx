import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { MEGA_SECTIONS, type MegaSection } from "./mega-menu-data";

function MegaPanel({ section }: { section: MegaSection }) {
  const cols = section.columns;
  return (
    <div
      className="mega-panel"
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        zIndex: 30,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="container-x"
        style={{
          display: "grid",
          gridTemplateColumns: section.feature
            ? "repeat(3, 1fr) 320px"
            : "repeat(3, 1fr)",
          gap: 32,
          padding: "32px",
        }}
      >
        {cols.map((col) => (
          <div key={col.title}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              {col.title}
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {col.items.map((it) => (
                <li key={it.label}>
                  <Link href={it.href} style={{ fontSize: 13 }}>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {section.feature && (
          <div
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              padding: 20,
              borderRadius: "var(--radius-md)",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--color-primary)",
                letterSpacing: "0.16em",
                marginBottom: 8,
              }}
            >
              {section.feature.eyebrow}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
              {section.feature.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginBottom: 14,
              }}
            >
              {section.feature.body}
            </div>
            <Link href={section.feature.cta.href} className="btn btn-sm btn-primary">
              {section.feature.cta.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function MegaNav() {
  return (
    <div style={{ borderTop: "1px solid var(--color-border)" }}>
      <div
        className="container-x"
        style={{ display: "flex", gap: 0, height: 44, alignItems: "stretch" }}
      >
        {MEGA_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="mega-trigger"
            style={{ position: "static" }}
          >
            <Link
              href={section.href}
              className="mega-trigger-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 18px",
                height: "100%",
                borderBottom: "2px solid transparent",
                marginBottom: -1,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                {section.label}
              </span>
              <Icons.chevDown size={10} />
            </Link>
            <MegaPanel section={section} />
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {/* Cycle 6 (Mike): SALE + NEW ARRIVALS used to link to
            /collections/sale and /collections/new — neither collection exists
            in Shopify (verified via Storefront API), so customers landed on
            the friendly empty-state. Hidden until the merch team creates real
            collections. To re-enable, restore the <Link>s once
            collection.handle == "sale" / "new" exists. */}
      </div>
    </div>
  );
}
