"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import {
  canonicalSubModelValue,
  type SubModelStripConfig,
} from "@/lib/fitment/sub-model";
import type { SubModelAnswer, SubModelGroup, Vehicle } from "@/lib/garage/types";
import { openYmmModal } from "@/components/fitment/ymm-events";

/**
 * Cycle 14AQ (owner) — DimensionPicker rewritten as a clean, data-driven
 * picker. ALL hardcoded fixtures are gone:
 *   - No FRONT_GRILLE_POC / TOGGLE_CONFIG hardcoded F-150 photos
 *   - No before/after Path B for guests
 *   - No availableStripsForCategory() reading from hardcoded vehicle tables
 *
 * Strip configs are passed in by the parent (collection page server
 * component) — built from data/ymm_dimensions.json which is built from
 * the CA fitment snapshot. Each strip carries the actual per-vehicle
 * options (e.g. 2019 GMC Sierra 1500 trim: Base / SLE / Elevation / SLT /
 * AT4 / Denali). Renders as text chips. No photos until a per-YMM photo
 * pipeline exists.
 */

type Props = {
  categoryHandle: string;
  vehicle?: Vehicle;
  initialAnswers?: SubModelAnswer[];
  /**
   * Cycle 14AP (owner): when true, the picker tells the customer this
   * answer is required to unlock the grid below. Renders a more prominent
   * "Pick to see products" callout and a SKIP link that adds ?skip=1 to
   * the URL so the server can render the grid past the gate.
   */
  gated?: boolean;
  /**
   * Cycle 14AQ (owner): per-vehicle strip configs built server-side from
   * CA fitment data. The picker renders one row per strip; each strip's
   * options array is the actual ladder for the customer's vehicle.
   * Required prop — when no strips are relevant for this category +
   * vehicle, the parent doesn't render the picker at all.
   */
  strips: SubModelStripConfig[];
};

const DIM_PARAM = "dim";

function readSubModelCookieClient(vehicleId: string): SubModelAnswer[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie.match(/(?:^|;\s*)stehlen_submodel=([^;]+)/);
  if (!match) return [];
  try {
    const all = JSON.parse(decodeURIComponent(match[1])) as Record<
      string,
      SubModelAnswer[]
    >;
    return all[vehicleId] ?? [];
  } catch {
    return [];
  }
}

const COPY: Record<SubModelGroup, { ask: string; helper: string }> = {
  bed_length: {
    ask: "Which bed length fits your truck?",
    helper:
      "Bed length is measured from the back of the cab to the tailgate. Picking yours shows only covers that bolt right on.",
  },
  cab_type: {
    ask: "Which cab type does your truck have?",
    helper:
      "Crew, Super, or Regular. Running boards and side steps are cab-specific — picking yours hides anything that won't reach your doors.",
  },
  trim: {
    ask: "Which trim level is your vehicle?",
    helper:
      "Some grilles, guards, and brackets only fit specific trim packages. Pick yours to skip the wrong-trim returns.",
  },
  doors: {
    ask: "How many doors does your vehicle have?",
    helper: "2-door and 4-door variants take different parts.",
  },
};

export function DimensionPicker({
  categoryHandle: _categoryHandle,
  vehicle,
  initialAnswers,
  gated,
  strips,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Build a per-group options index from the strips prop so the URL parser
  // and canonicalize step can validate values without re-walking strips.
  const optionsByGroup: Record<string, string[]> = {};
  for (const s of strips) optionsByGroup[s.group] = s.options;
  const canonicalize = useCallback(
    (g: string, raw: string): string | null =>
      canonicalSubModelValue(optionsByGroup[g] ?? [], raw),
    // optionsByGroup is rebuilt from props each render; safe to depend on
    // strips as the stable identity. eslint-disable-next-line
    [strips], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // When a customer arrives at a URL with ?dim= AND has a vehicle set,
  // persist those URL answers into the cookie/DB so future navigations
  // honor the same answer.
  useEffect(() => {
    if (!vehicle?.id) return;
    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);
    const rawDims = currentUrl.searchParams.getAll(DIM_PARAM);
    if (rawDims.length === 0) return;

    type Entry = { group: SubModelGroup; value: string };
    const entries: Entry[] = [];
    const seen = new Set<string>();
    for (const v of rawDims) {
      if (v.length > 64) continue;
      const idx = v.indexOf(":");
      if (idx < 1) continue;
      const g = v.slice(0, idx);
      const val = v.slice(idx + 1);
      if (!g || !val) continue;
      if (seen.has(g)) continue;
      const canonical = canonicalize(g, val);
      if (!canonical) continue;
      seen.add(g);
      entries.push({ group: g as SubModelGroup, value: canonical });
    }
    if (entries.length === 0) return;

    for (const { group, value } of entries) {
      void fetch("/api/sub-model", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          answers: [{ group, value }],
        }),
      }).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  // Track groups the customer just cleared via "Change". Until the server
  // confirms the clear, the useEffect below skips re-applying the stale prop.
  const clearedGroupsRef = useRef<Set<string>>(new Set());
  const lastVehicleIdRef = useRef<string | undefined>(vehicle?.id);

  const readUrlDims = useCallback(
    (sp: URLSearchParams) => {
      const out: Record<string, string> = {};
      for (const v of sp.getAll(DIM_PARAM)) {
        if (v.length > 64) continue;
        const idx = v.indexOf(":");
        if (idx < 1) continue;
        const g = v.slice(0, idx);
        const val = v.slice(idx + 1);
        if (!g || !val) continue;
        if (g in out) continue;
        const canonical = canonicalize(g, val);
        if (!canonical) continue;
        out[g] = canonical;
      }
      return out;
    },
    [canonicalize],
  );

  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const a of initialAnswers ?? []) out[a.group] = a.value;
    Object.assign(out, readUrlDims(params));
    if (vehicle?.id) {
      for (const a of readSubModelCookieClient(vehicle.id)) {
        if (!(a.group in out)) out[a.group] = a.value;
      }
    }
    return out;
  });

  useEffect(() => {
    if (vehicle?.id !== lastVehicleIdRef.current) {
      lastVehicleIdRef.current = vehicle?.id;
      clearedGroupsRef.current.clear();
      const fresh: Record<string, string> = {};
      for (const a of initialAnswers ?? []) fresh[a.group] = a.value;
      Object.assign(fresh, readUrlDims(params));
      setPicks(fresh);
      return;
    }

    for (const g of Array.from(clearedGroupsRef.current)) {
      const stillSet =
        (initialAnswers ?? []).some((a) => a.group === g) ||
        params.getAll(DIM_PARAM).some((v) => v.startsWith(`${g}:`));
      if (!stillSet) clearedGroupsRef.current.delete(g);
    }

    setPicks((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const a of initialAnswers ?? []) {
        if (clearedGroupsRef.current.has(a.group)) continue;
        next[a.group] = a.value;
      }
      const urlDims = readUrlDims(params);
      for (const [g, val] of Object.entries(urlDims)) {
        if (clearedGroupsRef.current.has(g)) continue;
        next[g] = val;
      }
      if (vehicle?.id) {
        for (const a of readSubModelCookieClient(vehicle.id)) {
          if (clearedGroupsRef.current.has(a.group)) continue;
          if (!(a.group in next)) next[a.group] = a.value;
        }
      }
      for (const g of Array.from(clearedGroupsRef.current)) {
        if (
          !(initialAnswers ?? []).some((a) => a.group === g) &&
          !urlDims[g]
        ) {
          delete next[g];
        }
      }
      return next;
    });
  }, [vehicle?.id, initialAnswers, params, readUrlDims]);

  const writeUrlDim = useCallback(
    (group: SubModelGroup, value: string) => {
      const next = new URLSearchParams(params.toString());
      const keep = next.getAll(DIM_PARAM).filter((v) => !v.startsWith(`${group}:`));
      next.delete(DIM_PARAM);
      for (const v of keep) next.append(DIM_PARAM, v);
      next.append(DIM_PARAM, `${group}:${value}`);
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, params, router],
  );

  const clearUrlDim = useCallback(
    (group: SubModelGroup) => {
      const next = new URLSearchParams(params.toString());
      const keep = next.getAll(DIM_PARAM).filter((v) => !v.startsWith(`${group}:`));
      next.delete(DIM_PARAM);
      for (const v of keep) next.append(DIM_PARAM, v);
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, params, router],
  );

  const persistToDb = useCallback(
    async (group: SubModelGroup, value: string) => {
      if (!vehicle?.id) return;
      try {
        await fetch("/api/sub-model", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            answers: [{ group, value }],
          }),
        });
        const sp = new URLSearchParams(params.toString());
        const dims = sp.getAll(DIM_PARAM);
        const stripped = dims.filter((v) => !v.startsWith(`${group}:`));
        if (stripped.length !== dims.length) {
          sp.delete(DIM_PARAM);
          for (const d of stripped) sp.append(DIM_PARAM, d);
          const qs = sp.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "save failed");
      }
    },
    [vehicle, params, pathname, router],
  );

  const onPick = useCallback(
    (group: SubModelGroup, value: string) => {
      setError(null);
      setPicks((p) => ({ ...p, [group]: value }));
      if (vehicle?.id) {
        void persistToDb(group, value);
      } else {
        writeUrlDim(group, value);
      }
    },
    [persistToDb, vehicle?.id, writeUrlDim],
  );

  const clearDb = useCallback(
    async (group: SubModelGroup) => {
      if (!vehicle?.id) return;
      try {
        await fetch("/api/sub-model", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ vehicleId: vehicle.id, clear: group }),
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "clear failed");
      }
    },
    [vehicle, router],
  );

  const onChange = useCallback(
    (group: SubModelGroup) => {
      clearedGroupsRef.current.add(group);
      setPicks((p) => {
        const next = { ...p };
        delete next[group];
        return next;
      });
      if (vehicle?.id) {
        void clearDb(group);
      } else {
        clearUrlDim(group);
      }
    },
    [vehicle, clearDb, clearUrlDim],
  );

  if (strips.length === 0) return null;

  return (
    <section
      aria-label="Refine for your vehicle"
      style={{
        background: "var(--color-background)",
        padding: "16px 0 24px",
      }}
    >
      <div className="container-x">
        <div className={`dim-card${gated ? " dim-card-gated" : ""}`}>
          <div
            className="eyebrow"
            style={{
              color: gated ? "var(--color-primary)" : "var(--color-muted)",
              marginBottom: 12,
            }}
          >
            {gated ? "SELECTION REQUIRED" : "REFINE FOR YOUR VEHICLE"}
          </div>
          {!vehicle && (
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={openYmmModal}
                className="chip"
                style={{ cursor: "pointer", fontSize: 12 }}
              >
                <Icons.truck size={10} /> SET YOUR VEHICLE FOR EXACT-FIT OPTIONS →
              </button>
            </div>
          )}

          {strips.map((s, idx) => {
            const picked = picks[s.group];
            const copy = COPY[s.group];
            const isLast = idx === strips.length - 1;
            return (
              <div
                key={s.group}
                style={{
                  marginBottom: isLast ? 0 : 24,
                  paddingBottom: isLast ? 0 : 20,
                  borderBottom: isLast
                    ? "none"
                    : "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {copy.ask}
                  </div>
                  {picked && (
                    <button
                      type="button"
                      onClick={() => onChange(s.group)}
                      style={{
                        background: "none",
                        border: 0,
                        color: "var(--color-primary)",
                        cursor: "pointer",
                        fontSize: 13,
                        textDecoration: "underline",
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      Change
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--color-muted)",
                    marginBottom: 16,
                    maxWidth: 680,
                    lineHeight: 1.5,
                  }}
                >
                  {copy.helper}
                </div>
                <div className="dim-chip-grid">
                  {s.options.map((opt) => {
                    const isPicked = picked === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onPick(s.group, opt)}
                        disabled={pending}
                        aria-pressed={isPicked}
                        className="dim-chip-btn"
                      >
                        {isPicked && <Icons.check size={12} />} {opt.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "var(--color-destructive)",
              }}
            >
              {error}
            </div>
          )}
          {gated && (
            <div style={{ marginTop: 16, fontSize: 13 }}>
              <a
                href={(() => {
                  const sp = new URLSearchParams(params.toString());
                  sp.set("skip", "1");
                  return `${pathname}?${sp.toString()}`;
                })()}
                style={{
                  color: "var(--color-muted-2)",
                  textDecoration: "underline",
                }}
              >
                Skip and browse all options
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
