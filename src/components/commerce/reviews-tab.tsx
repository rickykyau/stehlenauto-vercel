"use client";

import { useMemo, useState } from "react";
import { Stars } from "@/components/ui/stars";
import { ReviewLightbox, type LightboxPhoto } from "./review-lightbox";
import type { AmazonReviewBundle, AmazonReview } from "@/lib/reviews";

type SortKey = "helpful" | "recent" | "highest";

/**
 * Cycle 14BD (Jordan UX spec): Amazon-style PDP review surface.
 *
 * Section order — non-negotiable for older male DIY shoppers who scan:
 *   [A] Aggregate summary block (with FTC source disclosure inside the
 *       same trust card — not a footnote)
 *   [B] Customer photo strip
 *   [C] Filter chips + sort
 *   [D] Review cards
 *   [E] Footer CTA
 *
 * No fake reviews. All shown reviews are 4-5★ verified-purchase imports
 * from Amazon. The disclosure makes that explicit per FTC guidance.
 */
export function ReviewsTab({ bundle }: { bundle: AmazonReviewBundle }) {
  const { reviews, avg_rating, review_count } = bundle;

  // Cycle 14BI: provenance for an accurate FTC disclosure. The set can now
  // mix imported Amazon reviews with admin-approved customer submissions.
  const hasCustomer = reviews.some((r) => r.source === "customer");
  const hasAmazon = reviews.some((r) => r.source !== "customer");
  const disclosureLabel = hasCustomer
    ? hasAmazon
      ? "Verified reviews · Amazon + customers"
      : "Verified customer reviews"
    : "Sourced from Amazon";
  const disclosureBody = hasCustomer
    ? hasAmazon
      ? "Includes verified-purchase reviews imported from Amazon and reviews submitted by Stehlen customers and approved by our team."
      : "Reviews submitted by Stehlen customers and approved by our team before publishing."
    : "Every review is verified purchase, 4 stars or higher, and includes a customer-uploaded photo.";

  // Distribution: only 4 & 5 star exist in curated set; compute defensively
  const dist = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map(
      (s) => reviews.filter((r) => r.stars === s).length,
    );
    return counts;
  }, [reviews]);

  // All photos flattened across all reviews — for the gallery strip + lightbox
  const allPhotos = useMemo<LightboxPhoto[]>(() => {
    const out: LightboxPhoto[] = [];
    for (const r of reviews) {
      for (const src of r.images) {
        out.push({
          src,
          reviewerName: r.reviewer,
          stars: r.stars,
          title: r.title || "Verified review",
        });
      }
    }
    return out;
  }, [reviews]);

  const [starFilter, setStarFilter] = useState<5 | 4 | null>(null);
  const [photoFilter, setPhotoFilter] = useState(false);
  const [sort, setSort] = useState<SortKey>("helpful");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredReviews = useMemo(() => {
    let out = [...reviews];
    if (starFilter !== null) out = out.filter((r) => r.stars === starFilter);
    if (photoFilter) out = out.filter((r) => r.images.length > 0);
    out.sort((a, b) => {
      if (sort === "recent") return b.date.localeCompare(a.date);
      if (sort === "highest") return b.stars - a.stars;
      return b.helpful_votes - a.helpful_votes;
    });
    return out;
  }, [reviews, starFilter, photoFilter, sort]);

  return (
    <div className="md:col-span-2">
      <h2
        className="mono"
        style={{
          fontSize: 20,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        Customer Reviews
      </h2>

      <div
        className="grid grid-cols-1 md:grid-cols-[300px_1fr]"
        style={{ gap: 32 }}
      >
        {/* [A] Aggregate summary block */}
        <AggregateBlock
          avgRating={avg_rating}
          reviewCount={review_count}
          dist={dist}
          disclosureLabel={disclosureLabel}
          disclosureBody={disclosureBody}
        />

        <div>
          {/* [B] Customer photo strip */}
          {allPhotos.length > 0 && (
            <PhotoStrip
              photos={allPhotos}
              onOpen={(i) => setLightboxIndex(i)}
            />
          )}

          {/* [C] Filter chips + sort — hidden on 1-review products
              (Jordan F-10): no filter or sort has any utility there. */}
          {bundle.reviews.length >= 2 && (
            <FilterBar
              starFilter={starFilter}
              setStarFilter={setStarFilter}
              photoFilter={photoFilter}
              setPhotoFilter={setPhotoFilter}
              sort={sort}
              setSort={setSort}
              dist={dist}
            />
          )}

          {/* [D] Review cards */}
          <div style={{ marginTop: 20 }}>
            {filteredReviews.length === 0 ? (
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-muted)",
                  padding: "24px 0",
                  textAlign: "center",
                }}
              >
                No reviews match these filters.
              </p>
            ) : (
              filteredReviews.map((r, i) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  isLast={i === filteredReviews.length - 1}
                  onPhotoClick={(imgSrc) => {
                    const flatIdx = allPhotos.findIndex((p) => p.src === imgSrc);
                    if (flatIdx >= 0) setLightboxIndex(flatIdx);
                  }}
                />
              ))
            )}
          </div>

          {/* [E] Footer CTA */}
          <div
            style={{
              marginTop: 32,
              padding: "20px 24px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.5 }}>
              Bought this and want to share your install? Email us a photo + your story.
            </span>
            <a
              href="mailto:reviews@stehlenauto.com?subject=My%20Stehlen%20Review"
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
                minHeight: 44,
                minWidth: 44,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                color: "var(--color-foreground)",
                whiteSpace: "nowrap",
              }}
            >
              Email Your Review
            </a>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <ReviewLightbox
          photos={allPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(next) => setLightboxIndex(next)}
        />
      )}
    </div>
  );
}

function AggregateBlock({
  avgRating,
  reviewCount,
  dist,
  disclosureLabel,
  disclosureBody,
}: {
  avgRating: number;
  reviewCount: number;
  dist: number[];
  disclosureLabel: string;
  disclosureBody: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
        height: "fit-content",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--color-foreground)",
        }}
        aria-label={`${avgRating.toFixed(1)} out of 5 stars`}
      >
        {avgRating.toFixed(1)}
      </div>
      <div style={{ marginTop: 6 }}>
        <Stars rating={avgRating} size={20} />
      </div>
      <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 8 }}>
        {reviewCount} verified review{reviewCount === 1 ? "" : "s"}
      </div>

      <div style={{ marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
        {[5, 4, 3, 2, 1].map((s, i) => {
          const count = dist[i] ?? 0;
          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
          return (
            <div
              key={s}
              role="img"
              aria-label={`${s} stars: ${count} review${count === 1 ? "" : "s"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  width: 24,
                  color: "var(--color-muted)",
                }}
              >
                {s}★
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: "var(--color-background)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  width: 32,
                  textAlign: "right",
                  color: "var(--color-muted)",
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cycle 14BD-fix1 (Jordan F-3): FTC disclosure must sit at the same
          visual hierarchy as the rating, not as a footnote. Bumped label to
          foreground color + added yellow accent dot so the eye reads this
          as structural trust info, not fine print. Body copy stays muted. */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-foreground)",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: "var(--color-primary)",
            }}
          />
          {disclosureLabel}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--color-muted)",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          {disclosureBody}
        </div>
      </div>
    </div>
  );
}

function PhotoStrip({
  photos,
  onOpen,
}: {
  photos: LightboxPhoto[];
  onOpen: (index: number) => void;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-muted)",
          marginBottom: 10,
        }}
      >
        {(() => {
          const customerCount = new Set(photos.map((p) => p.reviewerName)).size;
          const photoNoun = photos.length === 1 ? "photo" : "photos";
          const customerNoun = customerCount === 1 ? "customer" : "customers";
          return `Customer ${photoNoun} · ${photos.length} from ${customerCount} ${customerNoun}`;
        })()}
      </div>
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          scrollSnapType: "x mandatory",
        }}
      >
        {photos.map((p, i) => (
          <button
            key={`${p.src}-${i}`}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`View install photo ${i + 1} by ${p.reviewerName}, ${p.stars} out of 5 stars`}
            style={{
              flex: "0 0 auto",
              width: 96,
              height: 96,
              padding: 0,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              cursor: "pointer",
              background: "var(--color-surface-2)",
              scrollSnapAlign: "start",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- customer photo, no known dims */}
            <img
              src={p.src}
              alt=""
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterBar({
  starFilter,
  setStarFilter,
  photoFilter,
  setPhotoFilter,
  sort,
  setSort,
  dist,
}: {
  starFilter: 5 | 4 | null;
  setStarFilter: (n: 5 | 4 | null) => void;
  photoFilter: boolean;
  setPhotoFilter: (b: boolean) => void;
  sort: SortKey;
  setSort: (k: SortKey) => void;
  dist: number[];
}) {
  const chipBase: React.CSSProperties = {
    height: 44,
    padding: "0 14px",
    fontFamily: "var(--font-display)",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderRadius: "var(--radius-sm)",
    background: "transparent",
    cursor: "pointer",
    minWidth: 44,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const inactive: React.CSSProperties = {
    border: "1px solid var(--color-border)",
    color: "var(--color-muted)",
  };
  const active: React.CSSProperties = {
    border: "1px solid var(--color-primary)",
    color: "var(--color-primary)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Cycle 14BD-fix1 (Mike F-4): on mobile (375px) the chip group
          was getting squeezed by `space-between` and clipping the WITH
          PHOTOS chip. flex:1 + minWidth:0 lets the group reflow inside
          available width and naturally wrap onto a second line. */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          flex: "1 1 auto",
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setStarFilter(null)}
          style={{ ...chipBase, ...(starFilter === null ? active : inactive) }}
        >
          All
        </button>
        {dist[0] > 0 && (
          <button
            type="button"
            onClick={() => setStarFilter(starFilter === 5 ? null : 5)}
            style={{ ...chipBase, ...(starFilter === 5 ? active : inactive) }}
          >
            ★ 5 ({dist[0]})
          </button>
        )}
        {/* Cycle 14BD-fix1 (Mike F-5): hide ★4 chip entirely when there
            are no 4-star reviews — disabled chips signal "no 4-star
            reviews here" which is unnecessary negative info on perfect-
            rating products. */}
        {dist[1] > 0 && (
          <button
            type="button"
            onClick={() => setStarFilter(starFilter === 4 ? null : 4)}
            style={{ ...chipBase, ...(starFilter === 4 ? active : inactive) }}
          >
            ★ 4 ({dist[1]})
          </button>
        )}
        <button
          type="button"
          onClick={() => setPhotoFilter(!photoFilter)}
          style={{ ...chipBase, ...(photoFilter ? active : inactive) }}
        >
          With photos
        </button>
      </div>
      <label
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <span
          className="sr-only"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}
        >
          Sort reviews by
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.06em",
            background: "var(--color-surface)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            height: 44,
            padding: "0 10px",
            cursor: "pointer",
          }}
        >
          <option value="helpful">MOST HELPFUL</option>
          <option value="recent">MOST RECENT</option>
          <option value="highest">HIGHEST RATED</option>
        </select>
      </label>
    </div>
  );
}

function ReviewCard({
  review: r,
  isLast,
  onPhotoClick,
}: {
  review: AmazonReview;
  isLast: boolean;
  onPhotoClick: (src: string) => void;
}) {
  const formattedDate = new Date(r.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <article
      style={{
        paddingBottom: 20,
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <Stars rating={r.stars} size={14} />
          {r.title && (
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {r.title}
            </h3>
          )}
        </div>
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--color-muted)",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {formattedDate}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 10,
          fontFamily: "var(--font-display)",
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--color-muted)",
          textTransform: "uppercase",
        }}
      >
        <span>{r.reviewer}</span>
        <span style={{ color: "var(--color-border-2)" }}>·</span>
        {r.verified && (
          <>
            <span style={{ color: "var(--color-success)" }}>✓ Verified Purchase</span>
            <span style={{ color: "var(--color-border-2)" }}>·</span>
          </>
        )}
        <span>Amazon</span>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>{r.body}</p>

      {r.images.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px dashed var(--color-border)",
          }}
        >
          {r.images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => onPhotoClick(src)}
              aria-label={`View install photo ${i + 1} by ${r.reviewer}`}
              style={{
                width: 72,
                height: 72,
                padding: 0,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                cursor: "pointer",
                background: "var(--color-surface-2)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- customer photo */}
              <img
                src={src}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}

      {r.helpful_votes > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "var(--color-muted)",
          }}
        >
          {r.helpful_votes} {r.helpful_votes === 1 ? "person" : "people"} found this helpful
        </div>
      )}
    </article>
  );
}
