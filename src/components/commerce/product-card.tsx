import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import { Stars } from "@/components/ui/stars";

export function ProductCard({
  product,
  vehicle,
}: {
  product: CatalogProduct;
  vehicle?: Vehicle;
}) {
  const { sku, handle, fitTitle, price, compareAt, image, rating, reviews, badges, chips, fits } =
    product;
  const sale = compareAt && compareAt > price;
  const off = sale ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return (
    <Link
      href={`/products/${handle}`}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "border-color 140ms ease",
      }}
    >
      {/* Top badges */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          display: "flex",
          justifyContent: "space-between",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {badges.includes("NEW") && <span className="badge badge-new">NEW</span>}
          {badges.includes("SALE") && (
            <span className="badge badge-sale">−{off}%</span>
          )}
          {badges.includes("BEST SELLER") && (
            <span className="badge badge-best">BEST SELLER</span>
          )}
        </div>
      </div>

      {/* Image */}
      <div
        className="product-img-bg"
        style={{
          aspectRatio: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={fitTitle}
            width={400}
            height={400}
            sizes="(min-width: 768px) 25vw, 50vw"
            style={{ width: "85%", height: "85%", objectFit: "contain" }}
          />
        ) : (
          <div
            className="mono"
            style={{ color: "#999", fontSize: 12, letterSpacing: "0.12em" }}
          >
            STEHLEN
          </div>
        )}
        {vehicle && fits !== undefined && (
          <div
            className="mono"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "6px 10px",
              background: fits ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
              color: fits ? "var(--color-background)" : "var(--color-foreground)",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}>
              {fits
                ? `✓ FITS YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
                : "✗ DOES NOT FIT"}
            </span>
          </div>
        )}
        {vehicle && fits === undefined && (
          // Neutral state: vehicle set but we can't verify fitment yet. Honest
          // signal beats a fake green ✓ (Mike M1, Parts P0).
          <div
            className="mono"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "6px 10px",
              background: "rgba(20,20,20,0.95)",
              color: "var(--color-foreground)",
              borderTop: "1px solid var(--color-border-2)",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em" }}>
              CHECK FITMENT FOR YOUR{" "}
              {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 9,
            color: "var(--color-muted-2)",
            letterSpacing: "0.12em",
          }}
        >
          {sku}
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.35,
            fontWeight: 500,
            minHeight: 38,
          }}
        >
          {fitTitle}
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <span
              key={c}
              className="chip"
              style={{ height: 20, padding: "0 7px", fontSize: 9 }}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Cycle 14Z (Mike-O3 NEW-3): hide the rating row entirely until
            real review data is wired (TODO phase-5: Okendo/Junip). Showing
            "0 (0)" or any star count without verified reviews is a trust
            killer and a potential FTC issue. */}
        {reviews > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Stars rating={rating} size={11} />
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--color-muted)",
                letterSpacing: "0.06em",
              }}
            >
              {rating} ({reviews})
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginTop: "auto",
          }}
        >
          <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>
            ${price.toFixed(0)}
          </span>
          {sale && (
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                textDecoration: "line-through",
              }}
            >
              ${compareAt!.toFixed(0)}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
          or 4× ${(price / 4).toFixed(0)} with Affirm
        </div>
      </div>
    </Link>
  );
}
