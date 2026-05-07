import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { Icons } from "@/components/ui/icons";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop All Categories",
  description:
    "Browse every Stehlen Auto category — bumpers, roof racks, tonneau covers, lighting, and more. Fitment guaranteed.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsIndexPage() {
  const categories = getCategories();
  return (
    <main className="container-x" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          fontSize: 12,
          color: "var(--color-muted)",
          marginBottom: 14,
        }}
      >
        <Link href="/">Home</Link>
        <Icons.chevRight size={10} />
        <span style={{ color: "var(--color-foreground)" }}>Shop</span>
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
          marginBottom: 24,
        }}
      >
        SHOP BY CATEGORY
      </h1>
      <div
        className="grid grid-cols-2 md:grid-cols-4"
        style={{
          gap: 1,
          background: "var(--color-border)",
          border: "1px solid var(--color-border)",
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/collections/${cat.slug}`}
            style={{
              // Cycle 14X+ (Mike-O11 F-1 NIT): wrapper padding 24 → 0,
              // matches /vehicle/[slug] hub. Image area now bleeds to the
              // tile edge; title strip carries its own padding below.
              background: "var(--color-surface)",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              aspectRatio: "1.05",
              position: "relative",
            }}
          >
            <div
              className="product-img-bg"
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
                minHeight: 100,
              }}
            >
              {cat.image ? (
                // Cycle 14X+ (owner): padding 10% → 4%, see home page
                // for the rationale (image kissing card edge feels
                // worse than a thick white frame around it).
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  style={{ objectFit: "contain", padding: "4%" }}
                />
              ) : (
                <span
                  className="mono"
                  style={{
                    color: "#999",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {cat.name.toUpperCase()}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {cat.name}
              </div>
              <Icons.arrowR size={14} />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
