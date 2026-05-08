"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { stripsForCategory, type SubModelStripConfig } from "@/lib/fitment/sub-model";
import type { SubModelAnswer, SubModelGroup, Vehicle } from "@/lib/garage/types";
import { openYmmModal } from "@/components/fitment/ymm-events";

/**
 * Cycle 14AO (owner): "Show options before items." Sits ABOVE the product
 * grid as the first prominent panel of the collection page when the category
 * is dimension-applicable (tonneau covers → bed length, running boards →
 * cab type, etc.). The customer answers once or skips; the grid below
 * narrows accordingly. No gate — the grid is always visible if they scroll
 * past.
 *
 * Two persistence paths:
 *   - With YMM: write to /api/sub-model (cookie + DB) and refresh.
 *   - Without YMM: write to URL ?dim=bed_length:5.5%27 BED for SSR-readable
 *     state (and to keep the URL bookmarkable). When the customer later sets
 *     a vehicle, the cookie/DB answer for that vehicle takes precedence.
 *
 * Owner spec: each unanswered dimension renders a horizontal chip row.
 * Once answered, that row collapses to a compact "BED LENGTH: 5.5'  [change]"
 * pill so the picker doesn't keep nagging — but stays visible so the customer
 * sees what's filtering the grid below.
 */

type Props = {
  categoryHandle: string;
  vehicle?: Vehicle;
  initialAnswers?: SubModelAnswer[];
};

const DIM_PARAM = "dim";

export function DimensionPicker({
  categoryHandle,
  vehicle,
  initialAnswers,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Optimistic local state so the UI reacts instantly while the server round-
  // trip is in flight. Initial pull from props (cookie/DB or URL).
  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const a of initialAnswers ?? []) out[a.group] = a.value;
    // Layer URL ?dim= over the initial answers (URL wins for guest path).
    for (const v of params.getAll(DIM_PARAM)) {
      const [g, ...rest] = v.split(":");
      const val = rest.join(":");
      if (g && val) out[g] = val;
    }
    return out;
  });

  // Cycle 14AO-fix B-3: re-sync local picks with the latest server-rendered
  // answers + URL after every router.refresh() / router.replace(). Without
  // this, clicking a sidebar filter (router.replace) re-rendered the page
  // tree but the picker's useState initializer didn't re-run, so when the
  // server's freshly-read cookie answers DID arrive the picker stayed in
  // its prior local-only state — and worse, after a sidebar-only refresh
  // the picker visibly reverted to "Which bed length fits?" because nothing
  // was syncing the cookie answer back into local state.
  // Race-safe merge: server-confirmed groups overwrite local; groups that
  // the customer just optimistically picked but the server hasn't yet
  // reported back (cookie-write in flight) are preserved.
  useEffect(() => {
    setPicks((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const a of initialAnswers ?? []) next[a.group] = a.value;
      for (const v of params.getAll(DIM_PARAM)) {
        const [g, ...rest] = v.split(":");
        const val = rest.join(":");
        if (g && val) next[g] = val;
      }
      return next;
    });
    // We intentionally depend on the params object identity; useSearchParams
    // gives a stable ref per URL so this fires once per URL change.
  }, [initialAnswers, params]);

  const writeUrlDim = useCallback(
    (group: SubModelGroup, value: string) => {
      const next = new URLSearchParams(params.toString());
      // Strip any existing ?dim= entry for this group, then re-add.
      const keep = next.getAll(DIM_PARAM).filter((v) => !v.startsWith(`${group}:`));
      next.delete(DIM_PARAM);
      for (const v of keep) next.append(DIM_PARAM, v);
      // Cycle 14AO-fix B-1: do NOT pre-encode the value here. URLSearchParams
      // toString() already URL-encodes; manual encodeURIComponent on top
      // produced double-encoded URLs (`5.5%27%2520BED`) that worked but
      // broke shared/bookmarked links and looked broken to anyone copying
      // the URL.
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
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "save failed");
      }
    },
    [vehicle, router],
  );

  const onPick = useCallback(
    (group: SubModelGroup, value: string) => {
      setError(null);
      setPicks((p) => ({ ...p, [group]: value }));
      if (vehicle?.id) {
        // Authed/cookie path: persist to /api/sub-model and refresh server state.
        // No URL change so the user's URL stays clean.
        void persistToDb(group, value);
      } else {
        // Guest path: encode in URL so SSR can read it back next render.
        writeUrlDim(group, value);
      }
    },
    [persistToDb, vehicle?.id, writeUrlDim],
  );

  const onChange = useCallback(
    (group: SubModelGroup) => {
      setPicks((p) => {
        const next = { ...p };
        delete next[group];
        return next;
      });
      if (!vehicle?.id) {
        clearUrlDim(group);
      }
      // With a vehicle: /api/sub-model has no DELETE shape today, and the
      // schema rejects empty values. Local state revert is enough — the
      // chip row re-appears and the next pick overwrites the cookie/DB row.
    },
    [vehicle, clearUrlDim],
  );

  const strips: SubModelStripConfig[] = stripsForCategory(categoryHandle);
  if (strips.length === 0) return null;

  // Cycle 14AO: copy decisions per dimension. Uppercase action verb +
  // sentence-case helper text, mirroring Tire-Rack-style configurators.
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

  return (
    <section
      aria-label="Refine by your vehicle dimensions"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        className="container-x"
        style={{ paddingTop: 20, paddingBottom: 20 }}
      >
        {/* Header row: small eyebrow + the truck context if known */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div className="eyebrow" style={{ color: "var(--color-muted)" }}>
            REFINE FOR YOUR VEHICLE
          </div>
          {!vehicle && (
            <button
              type="button"
              onClick={openYmmModal}
              className="chip"
              style={{ cursor: "pointer", fontSize: 11 }}
            >
              <Icons.truck size={10} /> SET YOUR VEHICLE FOR EXACT FITMENT →
            </button>
          )}
        </div>

        {/* One row per required dimension */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {strips.map((s) => {
            const value = picks[s.group];
            if (value) {
              return (
                <div
                  key={s.group}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      color: "var(--color-muted)",
                    }}
                  >
                    {s.label}:
                  </span>
                  <span
                    className="chip"
                    style={{
                      background: "var(--color-foreground)",
                      color: "var(--color-background)",
                      borderColor: "var(--color-foreground)",
                    }}
                  >
                    {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(s.group)}
                    disabled={pending}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "var(--color-primary)",
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: pending ? "wait" : "pointer",
                      padding: "4px 6px",
                    }}
                  >
                    Change
                  </button>
                </div>
              );
            }
            return (
              <div key={s.group}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {COPY[s.group].ask}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-muted)",
                    marginBottom: 12,
                    maxWidth: 720,
                    lineHeight: 1.5,
                  }}
                >
                  {COPY[s.group].helper}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {s.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onPick(s.group, opt)}
                      disabled={pending}
                      className="chip"
                      style={{
                        cursor: pending ? "wait" : "pointer",
                        minHeight: 40,
                        paddingLeft: 14,
                        paddingRight: 14,
                        fontSize: 13,
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "var(--color-destructive)",
            }}
          >
            Couldn&apos;t save your pick — {error}
          </div>
        )}

        {strips.some((s) => !picks[s.group]) && (
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                // Anchor-jump to the grid below; no value cleared.
                if (typeof document !== "undefined") {
                  const grid = document.getElementById("collection-grid");
                  grid?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--color-muted)",
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Skip — show all options →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
