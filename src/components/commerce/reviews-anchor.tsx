"use client";

import { Stars } from "@/components/ui/stars";

/**
 * Cycle 14BD: clickable stars/count in the buy box that deep-link to
 * the REVIEWS tab. Scrolls to #pdp-tabs and dispatches
 * `stehlen:tabs:switch` so PdpTabs flips to the reviews pane.
 */
export function ReviewsAnchor({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("stehlen:tabs:switch", { detail: { tab: "reviews" } }),
    );
    const el = document.getElementById("pdp-tabs");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const noun = count === 1 ? "review" : "reviews";
  return (
    <a
      href="#pdp-tabs"
      onClick={onClick}
      aria-label={`Read ${count} customer ${noun}, average ${rating} stars`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: "inherit",
        textDecoration: "none",
        cursor: "pointer",
        minHeight: 44,
        padding: "0 4px",
        marginLeft: -4,
      }}
    >
      <Stars rating={rating} size={14} />
      <span
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          borderBottom: "1px dashed var(--color-muted-2)",
          paddingBottom: 1,
        }}
      >
        {rating} ({count} {noun})
      </span>
    </a>
  );
}
