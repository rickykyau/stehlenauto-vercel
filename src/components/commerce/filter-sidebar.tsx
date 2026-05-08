"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import type { FilterGroup } from "@/lib/catalog/types";

/**
 * Cycle 4 (Mike F-37) → Cycle 14AO (owner): URL-driven filter state, but with
 * three new constraints from the redesign:
 *
 *   1. NO YMM block here. The header pill is the single source of truth for
 *      year/make/model. Surfacing those controls in the sidebar let the
 *      customer pick "Make: Chevy" while their saved garage was a Ford —
 *      that's the "filter competes with YMM" bug. The catalog layer drops
 *      year/make/model facet GROUPS when a vehicle is set; this component
 *      simply renders whatever it's given.
 *   2. DimensionPicker (above the grid) owns bed-length / cab-type / trim
 *      questions. The sidebar treats those as plain check facets if Shopify
 *      surfaces them.
 *   3. Default state is COLLAPSED. Each group toggles open on header click.
 *      Active filters are surfaced as a row of chips above the groups, even
 *      when the group is collapsed, so the customer always sees what's
 *      narrowing the grid.
 *
 * Each Shopify FilterValueNode.input round-trips through the URL as a
 * base64-encoded `?f=...` param. Items with no `input` (e.g. greyed-out
 * year-gap fillers) render as disabled placeholders.
 */
// Cycle 14AO-fix B-1: drop the wrapping encodeURIComponent. URLSearchParams
// toString() encodes its values; the wrapper produced `?f=eyJ...%253D` —
// the `=` base64 padding showed up double-encoded as `%253D`. Decoding still
// worked because base64 has no `%` chars (so the legacy double-decode is
// a no-op the second time) but the URL looked broken in the wild. Encoders
// now emit clean `?f=<base64>` and the parse side stays compatible with
// both shapes.
function encodeInput(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64");
}

export function FilterSidebar({
  filters,
}: {
  filters: FilterGroup[];
  /**
   * Cycle 14AO: vehicle prop kept on the public type for backward compat
   * with callers (mobile drawer, collection page) but no longer rendered;
   * sidebar shows zero YMM controls.
   */
  vehicle?: unknown;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Collapsed by default per owner spec. Tracking BY GROUP TITLE so the open
  // state survives across renders even when the filter list shape changes.
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const active = useMemo(() => {
    const out = new Set<string>();
    for (const v of params.getAll("f")) out.add(v);
    return out;
  }, [params]);

  const apply = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router],
  );

  const toggle = useCallback(
    (input: string | undefined) => {
      if (!input) return;
      const enc = encodeInput(input);
      const next = new URLSearchParams(params.toString());
      const existing = next.getAll("f");
      next.delete("f");
      let removed = false;
      for (const v of existing) {
        if (v === enc) {
          removed = true;
          continue;
        }
        next.append("f", v);
      }
      if (!removed) next.append("f", enc);
      apply(next);
    },
    [apply, params],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("f");
    apply(next);
  }, [apply, params]);

  const toggleGroup = useCallback((title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  // Per-group active count for the collapsed-state badge.
  const activeByGroup = useMemo(() => {
    const out: Record<string, number> = {};
    for (const g of filters) {
      let n = 0;
      for (const it of g.items) {
        if (it.input && active.has(encodeInput(it.input))) n += 1;
      }
      out[g.title] = n;
    }
    return out;
  }, [filters, active]);

  const totalActive = active.size;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}
        >
          FILTERS{totalActive > 0 ? ` · ${totalActive}` : ""}
        </span>
        {totalActive > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--color-primary)",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: pending ? "wait" : "pointer",
              padding: 0,
            }}
          >
            CLEAR ALL
          </button>
        )}
      </div>

      {filters.length === 0 && (
        <div
          style={{
            padding: 16,
            fontSize: 12,
            color: "var(--color-muted)",
            lineHeight: 1.5,
          }}
        >
          No additional filters available.
        </div>
      )}

      {filters.map((group) => {
        const open = openGroups.has(group.title);
        const activeInGroup = activeByGroup[group.title] ?? 0;
        return (
          <div
            key={group.title}
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              aria-expanded={open}
              style={{
                width: "100%",
                background: "transparent",
                border: 0,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                color: "var(--color-foreground)",
                textAlign: "left",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                {group.title}
                {activeInGroup > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      color: "var(--color-primary)",
                    }}
                  >
                    · {activeInGroup}
                  </span>
                )}
              </span>
              {open ? <Icons.minus size={12} /> : <Icons.plus size={12} />}
            </button>

            {open && (
              <div style={{ padding: "0 16px 16px 16px" }}>
                {group.type === "check" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      // Cap each group's open list so a 50-year facet doesn't
                      // push the whole sidebar off-screen on desktop.
                      maxHeight: 320,
                      overflowY: "auto",
                    }}
                  >
                    {group.items.map((item) => {
                      const isActive = item.input
                        ? active.has(encodeInput(item.input))
                        : false;
                      const disabled = !item.input || pending || item.count === 0;
                      return (
                        <label
                          key={item.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            cursor: disabled ? "default" : "pointer",
                            opacity: !item.input || item.count === 0 ? 0.45 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            disabled={disabled}
                            onChange={() => toggle(item.input)}
                            style={{
                              position: "absolute",
                              opacity: 0,
                              width: 0,
                              height: 0,
                            }}
                          />
                          <span
                            aria-hidden="true"
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 2,
                              border: `1px solid ${
                                isActive
                                  ? "var(--color-primary)"
                                  : "var(--color-border-2)"
                              }`,
                              background: isActive
                                ? "var(--color-primary)"
                                : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isActive && (
                              <span
                                style={{
                                  color: "var(--color-background)",
                                  display: "flex",
                                }}
                              >
                                <Icons.check size={11} sw={3} />
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: 13, flex: 1 }}>
                            {item.label}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: 10,
                              color: "var(--color-muted)",
                            }}
                          >
                            {item.count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {group.type === "price" && (
                  <div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="input"
                        placeholder="$ Min"
                        inputMode="numeric"
                        style={{ height: 36, fontSize: 12 }}
                        aria-label="Minimum price"
                      />
                      <input
                        className="input"
                        placeholder="$ Max"
                        inputMode="numeric"
                        style={{ height: 36, fontSize: 12 }}
                        aria-label="Maximum price"
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        height: 4,
                        background: "var(--color-surface-2)",
                        borderRadius: 2,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: "15%",
                          right: "40%",
                          height: "100%",
                          background: "var(--color-primary)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-muted)",
                        }}
                      >
                        $0
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-muted)",
                        }}
                      >
                        $1,000+
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
