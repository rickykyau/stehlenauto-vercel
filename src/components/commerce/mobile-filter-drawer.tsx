"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import type { FilterGroup } from "@/lib/catalog/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import { FilterSidebar } from "./filter-sidebar";

/**
 * Mobile filter drawer (Mike F-35).
 *
 * The desktop sidebar is `hidden md:block`, which left mobile customers with
 * no way to filter at all. This wraps FilterSidebar in a bottom-sheet that
 * opens from a sticky FILTERS button on screens < 768px.
 */
export function MobileFilterDrawer({
  filters,
  vehicle,
  totalProducts,
}: {
  filters: FilterGroup[];
  vehicle?: Vehicle;
  totalProducts: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden btn btn-block"
        style={{
          marginBottom: 16,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
        aria-label="Open filters"
      >
        <Icons.filter size={14} />
        <span className="mono" style={{ fontSize: 12, letterSpacing: "0.12em" }}>
          FILTERS · {totalProducts} PRODUCTS
        </span>
      </button>

      {open && (
        <div
          className="md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              border: 0,
              cursor: "pointer",
            }}
          />
          <div
            style={{
              position: "relative",
              marginTop: "auto",
              background: "var(--color-background)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 12, letterSpacing: "0.14em", fontWeight: 700 }}
              >
                FILTERS
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--color-foreground)",
                  padding: 6,
                }}
              >
                <Icons.close size={16} />
              </button>
            </div>
            <div style={{ overflow: "auto", padding: 16 }}>
              <FilterSidebar filters={filters} vehicle={vehicle} />
            </div>
            <div
              style={{
                padding: 16,
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-primary btn-block"
              >
                SHOW {totalProducts} PRODUCTS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
