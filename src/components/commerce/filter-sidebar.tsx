"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import type { FilterGroup } from "@/lib/catalog/types";
import type { Vehicle } from "@/components/ui/vehicle-pill";
import { openYmmModal } from "@/components/fitment/ymm-events";

/**
 * Cycle 4 (Mike F-37): URL-driven filter state.
 *
 * Each Shopify FilterValueNode.input round-trips through the URL as a
 * base64-encoded `?f=...` param. The collection page parses them back into
 * Shopify ProductFilter inputs in src/lib/catalog/index.ts. Result: filter
 * picks are bookmarkable, refreshable, sharable, and SEO-crawlable.
 */
function encodeInput(input: string): string {
  return encodeURIComponent(Buffer.from(input, "utf-8").toString("base64"));
}

export function FilterSidebar({
  filters,
  vehicle,
}: {
  filters: FilterGroup[];
  vehicle?: Vehicle;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  // The set of currently-active raw filter inputs (base64-encoded in the URL).
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

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 4,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          FITMENT
        </div>
        {vehicle ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-success)",
                }}
              />
              <span
                className="mono"
                style={{ fontSize: 12, letterSpacing: "0.06em" }}
              >
                {vehicle.year} {vehicle.make.toUpperCase()}{" "}
                {vehicle.model.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={openYmmModal}
              className="btn btn-sm btn-block"
              style={{ marginTop: 12 }}
            >
              CHANGE VEHICLE
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={openYmmModal}
            className="btn btn-primary btn-block"
          >
            SELECT YOUR VEHICLE
          </button>
        )}
      </div>

      {filters.map((group) => (
        <div
          key={group.title}
          style={{
            padding: 16,
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
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
            </span>
            <Icons.minus size={12} />
          </div>
          {group.type === "check" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.items.map((item) => {
                const isActive = item.input
                  ? active.has(encodeInput(item.input))
                  : false;
                return (
                  <label
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: item.input ? "pointer" : "default",
                      opacity: item.input ? 1 : 0.55,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      disabled={!item.input || pending}
                      onChange={() => toggle(item.input)}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 2,
                        border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border-2)"}`,
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
                        <span style={{ color: "var(--color-background)", display: "flex" }}>
                          <Icons.check size={11} sw={3} />
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>
                    <span
                      className="mono"
                      style={{ fontSize: 10, color: "var(--color-muted)" }}
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
                  style={{ fontSize: 10, color: "var(--color-muted)" }}
                >
                  $0
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 10, color: "var(--color-muted)" }}
                >
                  $1,000+
                </span>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ padding: 16 }}>
        <button
          type="button"
          onClick={clearAll}
          className="btn btn-block btn-sm"
          disabled={pending || active.size === 0}
        >
          CLEAR ALL FILTERS{active.size > 0 ? ` (${active.size})` : ""}
        </button>
      </div>
    </div>
  );
}
