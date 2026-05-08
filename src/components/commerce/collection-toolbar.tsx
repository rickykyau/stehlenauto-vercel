"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import { openYmmModal } from "@/components/fitment/ymm-events";

// Wire labels to the CollectionSort values the server expects.
// Removed "Featured" / "Highest Rated" — Shopify's sortKey enum has no
// equivalent, and the prior dropdown options were no-ops.
const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Best Selling", value: "best-selling" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
  { label: "Title: A → Z", value: "title-asc" },
];

export function CollectionToolbar({
  vehicle,
  totalProducts,
}: {
  vehicle?: Vehicle;
  totalProducts: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const currentSort = params.get("sort") ?? "best-selling";
  const onSortChange = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params.toString());
      if (next === "best-selling") sp.delete("sort");
      else sp.set("sort", next);
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [params, pathname, router],
  );
  // Cycle 14AO (owner): the legacy "SHOW ONLY FITS" toggle is gone — the
  // collection page now hides confirmed mismatches by default whenever a
  // vehicle is set, so the toggle would just expose the un-filtered grid the
  // owner wanted dead. The chip below restates the active vehicle context
  // for clarity but no longer flips a filter.
  const [view, setView] = useState<"grid" | "list">("grid");
  void totalProducts;

  // Cycle 5 follow-up (#83): smart-sticky. Cycle-4 made it non-sticky entirely
  // because a solid-bg z-20 bar slid over cards on scroll. The compromise is
  // sticky again but with: (1) backdrop-blur opaque enough to read text but
  // not opaque enough to fully hide cards beneath, (2) lower z-index than cards
  // would have if they were positioned (cards are flow, so any z works — using
  // z-10), (3) only stick on md+ where the sidebar is visible (mobile already
  // has the dedicated FILTERS drawer button so a sticky toolbar is redundant).
  return (
    <div
      className="md:sticky"
      style={{
        top: 76,
        zIndex: 10,
        background: "color-mix(in oklab, var(--color-background) 88%, transparent)",
        backdropFilter: "saturate(140%) blur(8px)",
        WebkitBackdropFilter: "saturate(140%) blur(8px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        className="container-x"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          paddingBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {vehicle ? (
            <button
              type="button"
              onClick={openYmmModal}
              className="chip"
              aria-label={`Filtering for ${vehicle.year} ${vehicle.make} ${vehicle.model} — tap to change vehicle`}
              style={{
                cursor: "pointer",
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
                minHeight: 32,
              }}
            >
              <Icons.truck size={10} /> FILTERING FOR {vehicle.year}{" "}
              {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()} · TAP
              TO CHANGE
            </button>
          ) : (
            <button
              type="button"
              onClick={openYmmModal}
              className="chip"
              style={{ cursor: "pointer" }}
            >
              <Icons.truck size={10} /> UNIVERSAL · ADD VEHICLE TO FILTER
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="select"
            style={{ width: 220, height: 36 }}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div
            className="hidden md:flex"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  view === "grid" ? "var(--color-surface-2)" : "transparent",
                border: 0,
                color:
                  view === "grid"
                    ? "var(--color-foreground)"
                    : "var(--color-muted)",
                cursor: "pointer",
              }}
            >
              <Icons.filter size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  view === "list" ? "var(--color-surface-2)" : "transparent",
                border: 0,
                color:
                  view === "list"
                    ? "var(--color-foreground)"
                    : "var(--color-muted)",
                cursor: "pointer",
              }}
            >
              <Icons.menu size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
