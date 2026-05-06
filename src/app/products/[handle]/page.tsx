import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProduct,
  getProductFitment,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/catalog";
import { PRODUCTS } from "@/lib/catalog/mock";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { BuyBox } from "@/components/commerce/buy-box";
import { PdpTabs } from "@/components/commerce/pdp-tabs";
import { MobileStickyAtc } from "@/components/commerce/mobile-sticky-atc";
import { ViewItemTracker } from "@/components/analytics/view-item";
import {
  breadcrumbJsonLd,
  jsonLdString as seoJsonLdString,
} from "@/lib/seo/jsonld";
import { Icons } from "@/components/ui/icons";
import { Stars } from "@/components/ui/stars";
import { YmmButton } from "@/components/fitment/ymm-button";
import { getCurrentVehicle } from "@/lib/garage/server";
import { getSubModelAnswers } from "@/lib/garage/server";
import { checkFitment, withFitment } from "@/lib/fitment/match";
import { stripsForCategory } from "@/lib/fitment/sub-model";
import { getWarehouseNote } from "@/lib/fitment/warehouse-notes";
import { renderShopifyHtml } from "@/lib/utils/render-shopify-html";

// Personalized per visitor (cookie-driven fitment + sub-model), so render on each request.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return { title: "Product" };
  return {
    title: p.title,
    description: p.fitTitle,
    alternates: { canonical: `/products/${p.handle}` },
    openGraph: {
      title: p.title,
      description: p.fitTitle,
      url: `/products/${p.handle}`,
      images: p.image ? [{ url: p.image }] : undefined,
    },
  };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

// Escape `<` so the JSON-LD payload can't terminate the surrounding <script> tag.
function jsonLdString(obj: object): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default async function PdpPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const vehicle = (await getCurrentVehicle()) ?? undefined;
  const subModelAnswers = vehicle
    ? await getSubModelAnswers(vehicle.id ?? "")
    : [];

  const [relatedResult, fitment, reviews] = await Promise.all([
    // Cycle 8b (owner): pass the vehicle so the related-products rail
    // narrows by year+make+model tags. Without this we were showing F-150
    // owners 3 Toyota Tundra tonneau covers under a "fits your vehicle"
    // heading.
    getRelatedProducts(handle, 4, vehicle ?? null),
    Promise.resolve(getProductFitment(handle)),
    Promise.resolve(getProductReviews(handle)),
  ]);
  const relatedRaw = relatedResult.products;
  // Heading on the rail switches based on whether every card actually fits.
  const relatedAllFit = relatedResult.allFitVehicle;

  // Cycle 4 P0 (Mike F-3): the SIMILAR PRODUCTS rail used mock `fits: true`
  // values that painted "✓ FITS YOUR WRANGLER" over F-150 cards. Recompute
  // honestly against the actual garage vehicle.
  const related = withFitment(relatedRaw, vehicle);

  // Cycle 4 P0 (Mike F-19, F-18): the main product's `fits` is undefined out
  // of the Shopify adapter. Title-string match against the garage paints the
  // PDP fitment hero correctly and unlocks the buy-block "CONFIGURED FOR" line.
  // Cycle 12 (Mike F-5 BLOCKER): pass sub-model answers so a 5.5ft-bed F-150
  // garage gets DOES NOT FIT on a 6.5ft tonneau (bed-length gate).
  const productFits = checkFitment(product, vehicle ?? null, subModelAnswers);
  const productWithFit = { ...product, fits: productFits };

  // Cycle 14O (admin): warehouse-verified fitment note for this product.
  // 103 products covered by the merch-team CSV. When present, shown
  // prominently in the buy-box and inside the FITMENT tab so customers
  // see exclusions like "Will Not Fit 2007 Classic Models" before paying.
  // Cycle 14X (owner): the merch team is migrating these notes off the
  // CSV and into the Shopify Admin metafield custom.fitment_notes. When
  // the metafield is populated, prefer it as the canonical source — the
  // CSV is a one-time backfill, the metafield is the live source of truth.
  const csvWarehouseNote = await getWarehouseNote(handle);
  const metafieldNotes = product.fitmentTable?.notesHtml ?? null;
  const warehouseNote = metafieldNotes
    ? {
        verdict: "METAFIELD",
        notes: metafieldNotes,
        // The metafield doesn't carry a structured "has_warning" flag, so
        // we infer one from common exclusion phrasing the merch team uses
        // in their notes. Better than always-yellow or always-neutral.
        has_warning: /will\s*not\s*fit|does\s*not\s*fit|exclud(es|ed)|except\b/i.test(
          metafieldNotes,
        ),
      }
    : csvWarehouseNote;

  // Cycle 14f (Mike-6 MAJOR F-8/F-12): a 6.5 ft tonneau on a 2018 F-150 garage
  // (no bed-length saved) was painting GREEN "CONFIRMED FITMENT" — wrong, the
  // customer might have a 5.5 ft bed. Only paint green when (a) the title
  // matches the vehicle AND (b) every required sub-model strip has been
  // answered. Otherwise drop to the neutral "verify fitment" card so the
  // customer is forced to pick bed length / cab type before claiming a fit.
  // Cycle 14R (owner): page-level requiredStrips used to use the raw
  // category map, while BuyBox (cycle 14M) hides strips whose dimension
  // isn't mentioned in the product title. That mismatch made the yellow
  // "ONE STEP TO CONFIRM" callout fire on bull guards (no trim in title)
  // even though no chip strip rendered. Apply the same product-mention
  // filter here so the page banner agrees with the chip strip below.
  const productMentionsStripGroup = (group: string): boolean => {
    const text = (product.title || "").toLowerCase();
    if (group === "bed_length")
      return /\d+(?:\.\d+)?\s*(?:ft|'|foot|feet)\s*bed/i.test(text);
    if (group === "cab_type")
      return /(super\s?crew|super\s?cab|crew\s?cab|quad\s?cab|extended\s?cab|double\s?cab|regular\s?cab|mega\s?cab|access\s?cab)/i.test(
        text,
      );
    if (group === "trim")
      return /\b(base|mid|heavy[-\s]?duty|sport|limited|lariat|raptor|trd|sr5|tradesman|bighorn|laramie|denali|platinum|king\s?ranch|rebel|trailhawk|rubicon|sahara)\b/i.test(
        text,
      );
    if (group === "doors")
      return /(2[-\s]?door|4[-\s]?door|two[-\s]?door|four[-\s]?door)/i.test(
        text,
      );
    return true;
  };
  const requiredStrips = stripsForCategory(
    product.categoryHandle ?? product.category,
  ).filter((s) => productMentionsStripGroup(s.group));
  const allStripsAnswered = requiredStrips.every((s) =>
    subModelAnswers.some((a) => a.group === s.group && a.value),
  );
  const fullyConfirmed = productFits === true && allStripsAnswered;

  // Cycle 7 (owner): real image gallery from Shopify, not the featured image
  // duplicated 4 times. The adapter dedupes by URL and falls back to
  // featuredImage when images[] is empty.
  const images: string[] =
    product.images && product.images.length > 0
      ? product.images.map((i) => i.url)
      : product.image
        ? [product.image]
        : [];

  // Encode image paths so JSON-LD URLs are valid (Priya F-4: spaces in
  // "ROOF RACKS.jpg" disqualify Product schema).
  // Cycle 14Z (Mike-O3 NEW-2): the previous version blindly prepended
  // SITE_URL to every image, producing
  // "https://stehlenauto-vercel.vercel.apphttps%3A//cdn.shopify.com/..."
  // for Shopify CDN URLs (already absolute). Detect absolute URLs and
  // pass them through unmodified — only encode + prefix for relative paths.
  const toAbsolute = (src: string): string => {
    if (/^https?:\/\//i.test(src)) return src;
    const encoded = src.split("/").map(encodeURIComponent).join("/");
    return `${SITE_URL}${encoded.startsWith("/") ? "" : "/"}${encoded}`;
  };
  const absoluteImage = product.image ? toAbsolute(product.image) : null;
  // Cycle 14X+ (Priya F-7 MEDIUM): Google recommends Product.image be 3+
  // representative images. Build the array from the full product.images
  // gallery (Shopify Storefront returns up to 50), deduped + capped at 8
  // so the JSON-LD payload stays lean.
  const allAbsoluteImages: string[] = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    if (absoluteImage) {
      seen.add(absoluteImage);
      out.push(absoluteImage);
    }
    for (const img of product.images ?? []) {
      if (!img?.url || out.length >= 8) continue;
      const abs = toAbsolute(img.url);
      if (seen.has(abs)) continue;
      seen.add(abs);
      out.push(abs);
    }
    return out;
  })();

  // Cycle 14Z (Priya O-5 HIGH): merchant-listing PDPs without
  // priceValidUntil + seller fail Google's product-rich-result eligibility.
  // priceValidUntil = end of next calendar year (rolling), so it never
  // looks "stale" to Google. seller is the Organization itself.
  const priceValidUntil = (() => {
    const d = new Date();
    return `${d.getUTCFullYear() + 1}-12-31`;
  })();
  // Cycle 14X+ (Priya F-9 MEDIUM): when warehouse merch has populated the
  // structured fitment metafields, also surface them as schema.org
  // additionalProperty[]. Entity grounding for AI Overviews — the same
  // approach paid out at Wayfair within ~6 weeks for compatibility data.
  const fitmentAdditionalProperties: Record<string, string>[] = [];
  if (product.fitmentTable) {
    const ft = product.fitmentTable;
    if (ft.years.length > 0) {
      fitmentAdditionalProperties.push({
        "@type": "PropertyValue",
        name: "Fitment Years",
        value: ft.years.join(", "),
      });
    }
    if (ft.makes.length > 0) {
      fitmentAdditionalProperties.push({
        "@type": "PropertyValue",
        name: "Fitment Make",
        value: ft.makes.join(", "),
      });
    }
    if (ft.models.length > 0) {
      fitmentAdditionalProperties.push({
        "@type": "PropertyValue",
        name: "Fitment Model",
        value: ft.models.join(", "),
      });
    }
    for (const [k, v] of Object.entries(ft.subattributes)) {
      if (!v || v.length === 0) continue;
      fitmentAdditionalProperties.push({
        "@type": "PropertyValue",
        name: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim(),
        value: v.join(", "),
      });
    }
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.fitTitle,
    sku: product.sku,
    mpn: product.sku,
    image: allAbsoluteImages.length > 0 ? allAbsoluteImages : undefined,
    brand: { "@type": "Brand", name: "Stehlen Auto" },
    ...(fitmentAdditionalProperties.length > 0
      ? { additionalProperty: fitmentAdditionalProperties }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.handle}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Stehlen Auto",
        url: SITE_URL,
      },
    },
  };

  // Only attach AggregateRating once we have real review data (Marcus #5,
  // Priya). Mock data here would be a Google manual-action risk.
  // TODO(phase-5): reinstate when Okendo/Junip is wired and reviews.count > 0.

  return (
    <main>
      {/* Server-built JSON-LD; `<` escaped to neutralize script-breakout. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: seoJsonLdString(
            breadcrumbJsonLd(
              [
                { name: "Home", href: "/" },
                { name: "Shop", href: "/collections" },
                // Cycle 7 (owner): only emit the category crumb when we have
                // a real Shopify collection handle, so the JSON-LD doesn't
                // teach Google a 404 path either.
                ...(product.categoryHandle
                  ? [
                      {
                        name: product.categoryTitle ?? product.categoryHandle,
                        href: `/collections/${product.categoryHandle}`,
                      },
                    ]
                  : []),
                { name: product.title, href: `/products/${product.handle}` },
              ],
              SITE_URL,
            ),
          ),
        }}
      />
      <ViewItemTracker product={product} />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="container-x"
        style={{
          paddingTop: 16,
          paddingBottom: 16,
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--color-muted)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Link href="/">Home</Link>
        <Icons.chevRight size={10} />
        <Link href="/collections">Shop</Link>
        <Icons.chevRight size={10} />
        {/* Cycle 7 (owner): used to be `/collections/${product.category}`
            where category is the free-text Shopify productType — produced
            URLs like /collections/tonneau cover - lock & roll up that 404
            into the friendly empty-state. Use the resolved categoryHandle
            (cycle-3 chrome-reconciled slug) and skip the link entirely if
            it didn't resolve, so we never ship a dead breadcrumb. */}
        {product.categoryHandle ? (
          <Link href={`/collections/${product.categoryHandle}`}>
            {product.categoryTitle ?? product.categoryHandle}
          </Link>
        ) : (
          <Link href="/collections">Shop</Link>
        )}
        <Icons.chevRight size={10} />
        <span style={{ color: "var(--color-foreground)" }}>
          {product.title}
        </span>
      </nav>

      {/* Top split: gallery / buy box */}
      <div
        className="container-x grid grid-cols-1 md:grid-cols-[1.3fr_1fr]"
        style={{ gap: 48, paddingBottom: 48 }}
      >
        <ProductGallery images={images} alt={product.title} />

        {/* BUY BOX (sticky on desktop) */}
        <div
          className="md:sticky md:self-start"
          style={{ top: 160 }}
          data-buy-box-anchor
        >
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {product.badges.includes("BEST SELLER") && (
              <span className="badge badge-best">BEST SELLER</span>
            )}
            <span className="chip">SKU: {product.sku}</span>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            {product.fitTitle}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {/* Cycle 14Z (Mike-O3 NEW-3): hide the rating row when there
                are no real reviews yet — "4.7 (0 reviews)" is impossible
                and a trust killer. Stock indicator stays so customers see
                inventory state. */}
            {product.reviews > 0 && (
              <>
                <Stars rating={product.rating} size={14} />
                <span
                  className="mono"
                  style={{ fontSize: 11, letterSpacing: "0.06em" }}
                >
                  {product.rating} ({product.reviews} reviews)
                </span>
                <span style={{ color: "var(--color-muted-2)" }}>·</span>
              </>
            )}
            <span style={{ fontSize: 12, color: product.inventory > 0 ? "var(--color-success)" : "var(--color-destructive)" }}>
              {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Fitment hero — only paint green CONFIRMED when product.fits === true.
              When vehicle is set but fitment is unknown (live Shopify products
              before ACES tagging), surface a neutral check-fitment card instead
              of lying with a green ✓ (Mike M1, Parts P0). */}
          <div style={{ marginBottom: 20 }}>
            {vehicle && fullyConfirmed ? (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)",
                  border: "1px solid rgba(34,197,94,0.5)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: 4,
                    background: "var(--color-success)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--color-success)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "var(--color-background)" }}>
                      <Icons.check size={14} sw={3} />
                    </span>
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      color: "var(--color-success)",
                      fontWeight: 700,
                    }}
                  >
                    CONFIRMED FITMENT
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  Fits your {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted)",
                    marginTop: 4,
                  }}
                >
                  Engineered for direct bolt-on installation
                </div>
                <YmmButton
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "var(--color-muted)",
                    fontSize: 11,
                    marginTop: 8,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Change vehicle
                </YmmButton>
              </div>
            ) : vehicle && productWithFit.fits === false ? (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    fontWeight: 700,
                    color: "var(--color-destructive)",
                    marginBottom: 6,
                  }}
                >
                  ✗ DOES NOT FIT YOUR {vehicle.year}{" "}
                  {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-muted)",
                    marginBottom: 10,
                  }}
                >
                  Browse parts that fit your truck instead.
                </div>
                <Link
                  href={`/vehicle/${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase().replace(/\s+/g, "-")}`}
                  className="btn btn-primary btn-sm"
                >
                  SHOP PARTS FOR YOUR {vehicle.make.toUpperCase()} →
                </Link>
              </div>
            ) : vehicle && productWithFit.fits === true && !allStripsAnswered ? (
              // Cycle 14g (Mike-7 MAJOR F-10): when title-match is positive
              // but a required sub-model strip (bed length, cab type) is
              // unanswered, the previous neutral "we haven't verified, call
              // us" copy directly contradicted the green ✓ collection card
              // Mike just clicked through from. Paint a yellow "Pick your bed
              // length to verify" prompt that points at the strip below
              // instead of scaring him to RealTruck.
              <div
                style={{
                  background: "rgba(245,168,35,0.08)",
                  border: "1px solid rgba(245,168,35,0.45)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <Icons.shield size={18} />
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}
                  >
                    ONE STEP TO CONFIRM
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  Fits your {vehicle.year} {vehicle.make} {vehicle.model} —
                  pick your{" "}
                  {requiredStrips
                    .map((s) => s.label.toLowerCase().replace(/^your truck's\s*/, ""))
                    .join(" + ")}{" "}
                  to confirm.
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted)",
                    marginTop: 4,
                  }}
                >
                  Pick below — we&apos;ll lock the green ✓ once it&apos;s set.
                </div>
              </div>
            ) : vehicle ? (
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <Icons.shield size={18} />
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                    }}
                  >
                    CHECK FITMENT
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  We haven&apos;t verified this part for your{" "}
                  {vehicle.year} {vehicle.make} {vehicle.model} yet.
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted)",
                    marginTop: 4,
                  }}
                >
                  Use the compatibility table below or{" "}
                  <a
                    href="tel:+18883784536"
                    style={{ color: "var(--color-primary)" }}
                  >
                    call 1-888-378-4536
                  </a>{" "}
                  before ordering.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <Icons.shield size={18} />
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                    }}
                  >
                    VERIFY FITMENT
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  Will this fit your vehicle?
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted)",
                    marginTop: 4,
                  }}
                >
                  Tell us your year, make, and model — we&apos;ll confirm in
                  seconds.
                </div>
                <YmmButton
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                >
                  SELECT YOUR VEHICLE →
                </YmmButton>
              </div>
            )}
          </div>

          {/* Price */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 36, fontWeight: 700 }}
            >
              ${product.price.toFixed(2)}
            </span>
            {product.compareAt && (
              <>
                <span
                  className="mono"
                  style={{
                    fontSize: 16,
                    color: "var(--color-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  ${product.compareAt.toFixed(2)}
                </span>
                <span className="badge badge-sale">
                  SAVE ${(product.compareAt - product.price).toFixed(0)}
                </span>
              </>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-muted)",
              marginBottom: 20,
            }}
          >
            or 4 interest-free payments of ${(product.price / 4).toFixed(2)}{" "}
            with{" "}
            <span style={{ color: "var(--color-foreground)", fontWeight: 600 }}>
              Affirm
            </span>
          </div>

          {/* Cycle 14O (admin): warehouse-verified fitment note. Render
              ABOVE the buy-box so customers read body-style/trim caveats
              like "Will Not Fit 2007 Classic Models" before tapping Add to
              Cart. Yellow surround when the note contains a Will-Not-Fit
              exclusion, neutral surround for plain coverage notes. */}
          {warehouseNote && (
            <div
              style={{
                marginBottom: 20,
                padding: 14,
                background: warehouseNote.has_warning
                  ? "rgba(245,168,35,0.07)"
                  : "var(--color-surface)",
                border: warehouseNote.has_warning
                  ? "1px solid rgba(245,168,35,0.45)"
                  : "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  color: warehouseNote.has_warning
                    ? "var(--color-primary)"
                    : "var(--color-muted)",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icons.shield size={12} />
                {warehouseNote.has_warning
                  ? "WAREHOUSE NOTE — READ BEFORE ORDERING"
                  : "WAREHOUSE FITMENT NOTE"}
              </div>
              <div
                className="warehouse-note"
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--color-foreground)",
                }}
              >
                {renderShopifyHtml(warehouseNote.notes)}
              </div>
            </div>
          )}

          <BuyBox
            product={productWithFit}
            vehicle={vehicle}
            initialAnswers={subModelAnswers}
          />

          {/* Trust micro list */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              {
                // Cycle 5 (Mike): used to be a hardcoded "Wed Apr 22 — Fri Apr
                // 24" date that went stale immediately. Real ship-date math
                // depends on warehouse cutoff + carrier transit + customer ZIP,
                // none of which we have at PDP render. Show an honest band
                // until the real ZIP/carrier integration lands.
                Icon: Icons.shipping,
                text: (
                  <>
                    Free shipping, no minimum · <strong>Ships in 1-2 business days</strong>
                  </>
                ),
              },
              {
                Icon: Icons.return,
                text: "30-day hassle-free returns",
              },
              {
                Icon: Icons.shield,
                text: "Lifetime structural warranty · 5-year finish",
              },
              {
                Icon: Icons.truck,
                text: "Drilling-free install · 60–90 minutes with 2 people",
              },
            ].map(({ Icon, text }, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--color-muted)" }}>
                  <Icon size={16} />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PdpTabs
        product={product}
        fitment={fitment}
        reviews={reviews}
        vehicle={vehicle}
        productFits={productFits}
      />

      {/* Cross-sell */}
      {related.length > 0 && (
        <section className="container-x" style={{ paddingBottom: 64 }}>
          <h2
            className="mono"
            style={{
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {/* Cycle 8b (owner): the heading promised "FIT YOUR VEHICLE"
                even when the rail was full of mismatched products under red
                "DOES NOT FIT" ribbons. Now driven by allFitVehicle from
                getRelatedProducts — only claim fitment when every card
                actually fits. */}
            {vehicle && relatedAllFit
              ? `SIMILAR PRODUCTS THAT FIT YOUR ${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()}`
              : "SIMILAR PRODUCTS"}
          </h2>
          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ gap: 16 }}
          >
            {related.map((p) => (
              <ProductCard key={p.sku} product={p} vehicle={vehicle} />
            ))}
          </div>
        </section>
      )}

      {/* Back-in-stock + Prop 65 */}
      <section
        className="container-x grid grid-cols-1 md:grid-cols-2"
        style={{ paddingBottom: 64, gap: 16 }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            padding: 24,
            borderRadius: "var(--radius-md)",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            STAY IN THE LOOP
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Back in stock alerts
          </h3>
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            Get notified the moment we restock or release a new variant for
            your vehicle.
          </p>
          <form
            action="/api/back-in-stock"
            method="post"
            style={{ display: "flex", gap: 8 }}
          >
            <input
              type="email"
              name="email"
              required
              className="input"
              placeholder="you@example.com"
              style={{ flex: 1 }}
              aria-label="Email address"
            />
            <input type="hidden" name="sku" value={product.sku} />
            <button type="submit" className="btn btn-primary">
              NOTIFY ME
            </button>
          </form>
        </div>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            padding: 24,
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--color-muted)",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Icons.shield size={14} />
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                fontWeight: 600,
                color: "var(--color-foreground)",
              }}
            >
              CALIFORNIA PROP 65 NOTICE
            </span>
          </div>
          <p style={{ margin: 0 }}>
            This product can expose you to chemicals including chromium, which
            is known to the State of California to cause cancer. For more
            information, go to{" "}
            <Link
              href="https://www.p65warnings.ca.gov"
              style={{
                color: "var(--color-foreground)",
                textDecoration: "underline",
              }}
            >
              p65warnings.ca.gov
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Cycle 14d (Mike-4 MAJOR): used to pass raw `product` (fits undefined),
          so the sticky bottom bar stayed bright yellow + enabled even on a
          confirmed misfit PDP while the main buy-box correctly went red. Pass
          productWithFit so the sticky mirrors the misfit state. */}
      <MobileStickyAtc product={productWithFit} />
    </main>
  );
}
