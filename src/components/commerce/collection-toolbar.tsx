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
  // Cycle 14j (owner): "Show only fits for my vehicle" toggle. Adds ?fits=1
  // when on, drops it when off. Server reads this and filters the grid to
  // confirmed fits.
  //
  // Cycle 14k (owner phone test): the original implementation used
  // router.replace() so the filter swap didn't push a history entry.
  // Result: tapping a card → PDP → browser-back skipped over the filtered
  // collection and landed on the page BEFORE the user reached the
  // collection (often the home page). Switch to router.push() so each
  // filter state is its own history entry — back from PDP returns to the
  // filtered collection, back again returns to the unfiltered collection,
  // back again returns to the prior page.
  const fitsOnly = params.get("fits") === "1";
  const toggleFitsOnly = useCallback(() => {
    const sp = new URLSearchParams(params.toString());
    if (fitsOnly) sp.delete("fits");
    else sp.set("fits", "1");
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [fitsOnly, params, pathname, router]);
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
            <>
              <span
                className="chip chip-success"
                style={{ cursor: "default" }}
              >
                <Icons.check size={10} /> FITS {vehicle.year}{" "}
                {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
              </span>
              {/* Cycle 14j (owner): toggle to filter the grid down to ONLY
                  exact fits for the garage vehicle. Until this shipped the
                  green chip looked like a filter but was just a label. */}
              <button
                type="button"
                onClick={toggleFitsOnly}
                aria-pressed={fitsOnly}
                className="chip"
                style={{
                  cursor: "pointer",
                  background: fitsOnly ? "var(--color-foreground)" : "transparent",
                  color: fitsOnly ? "var(--color-background)" : "var(--color-foreground)",
                  borderColor: fitsOnly ? "var(--color-foreground)" : "var(--color-border)",
                  minHeight: 32,
                }}
              >
                {fitsOnly ? "✓ SHOWING FITS ONLY · TAP TO SHOW ALL" : "SHOW ONLY FITS"}
              </button>
            </>
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
