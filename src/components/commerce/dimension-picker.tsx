"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import {
  availableStripsForCategory,
  canonicalSubModelValue,
  dimensionChipSlug,
  type SubModelStripConfig,
} from "@/lib/fitment/sub-model";
import type { SubModelAnswer, SubModelGroup, Vehicle } from "@/lib/garage/types";

/**
 * Cycle 14AO-fix6 (Mike NB-O14AO-1): client-side fallback to read the
 * sub-model cookie directly. Used when Next.js App Router serves a cached
 * RSC payload after a browser back-nav, leaving the picker's
 * initialAnswers prop stale relative to what the cookie now holds.
 * Cookie shape (from garage/cookies.ts writeSubModelCookie):
 *   { "<vehicle-id>": [{group, value}, ...], ... }
 */
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
  /**
   * Cycle 14AP (owner): when true, the picker tells the customer this
   * answer is required to unlock the grid below. Renders a more prominent
   * "Pick to see products" callout and a SKIP link that adds ?skip=1 to
   * the URL so the server can render the grid past the gate.
   */
  gated?: boolean;
};

const DIM_PARAM = "dim";

export function DimensionPicker({
  categoryHandle,
  vehicle,
  initialAnswers,
  gated,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Cycle 14AP-fix4 (owner POC): "stock" vs "with Stehlen grille" toggle.
  // Only used on /collections/front-grilles. Hook lives at top-level so
  // it's never conditionally invoked.
  const [grilleView, setGrilleView] = useState<"stock" | "stehlen">("stock");
  // Optimistic local state so the UI reacts instantly while the server round-
  // trip is in flight. Initial pull from props (cookie/DB or URL).
  // Cycle 14AO-fix4 (Mike NF-1): when the browser restores this page from
  // BFCache (back/forward navigation), client component state is restored
  // from the snapshot — including stale `picks` that predate any cookie
  // writes the user did before navigating away. Refetch server state so
  // initialAnswers comes back fresh and the useEffect below re-syncs.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // Cycle 14AO-fix7 (Mike NB-O14AO-2): when a customer arrives at a URL
  // with `?dim=...` AND has a vehicle set (e.g., a friend shared a
  // filtered link), persist those URL answers into the cookie/DB so
  // future navigations honor the same answer. We do NOT attempt to strip
  // the `?dim=` from the URL — three approaches (router.replace,
  // history.replaceState, router.refresh) all fought a Next.js App
  // Router internal-URL state that re-applied the param mid-hydration.
  // The functional behavior is unaffected: server merge already prefers
  // cookie over URL, the picker pill is correct, the grid is correct;
  // only the address bar carries an extra param. Filed as follow-up #N
  // for a cleaner shallow-routing approach.
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
      const canonical = canonicalSubModelValue(g, val);
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
    // Mount-only on vehicle.id. Picks made after mount go through onPick
    // which already routes cookie/URL correctly per persistence path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  // Cycle 14AO-fix3 (Mike NB-1): track groups the customer just cleared via
  // "Change". Until the server confirms the clear by no longer reporting
  // that group in initialAnswers, the useEffect below skips re-applying
  // the stale prop value. Without this, clicking Change instantly snapped
  // the picker back to its answered state because the next render still
  // had the pre-clear initialAnswers prop attached.
  const clearedGroupsRef = useRef<Set<string>>(new Set());

  // Cycle 14AO-fix3 (Mike NB-2): track the active vehicleId. When it changes
  // (customer switched vehicle via YMM modal), wipe local picks so the
  // picker shows fresh question rows for the new vehicle instead of
  // leaking the previous vehicle's answer into the new context.
  const lastVehicleIdRef = useRef<string | undefined>(vehicle?.id);

  // Cycle 14AO-fix3 (Mike NB-6): URL parsing matches server-side first-wins
  // semantics. Earlier the client picker did `out[g] = val` (last wins)
  // while the server's parseFilterParams used "if seen, continue" (first
  // wins). UI/server divergence: a crafted ?dim=bed_length:5.5'+BED&dim=bed_length:8'+BED
  // showed 8' BED in the picker but filtered the grid by 5.5'.
  const readUrlDims = useCallback((sp: URLSearchParams) => {
    const out: Record<string, string> = {};
    for (const v of sp.getAll(DIM_PARAM)) {
      if (v.length > 64) continue; // Cycle 14AO-fix5: cap raw param length
      const idx = v.indexOf(":");
      if (idx < 1) continue;
      const g = v.slice(0, idx);
      const val = v.slice(idx + 1);
      if (!g || !val) continue;
      if (g in out) continue; // first wins
      // Cycle 14AO-fix5 (Mike R6 NB-NEW-3): allowlist URL value against the
      // canonical option vocabulary. Earlier the server's parseFilterParams
      // already did this for the actual product query; the picker did not,
      // so a crafted URL `?dim=bed_length:NOT_A_REAL_VALUE` rendered the
      // garbage value as a pill while the grid showed unfiltered results.
      // Server + client now both reject unknown values.
      const canonical = canonicalSubModelValue(g, val);
      if (!canonical) continue;
      out[g] = canonical;
    }
    return out;
  }, []);

  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const a of initialAnswers ?? []) out[a.group] = a.value;
    // Layer URL ?dim= over the initial answers (URL wins for guest path).
    Object.assign(out, readUrlDims(params));
    // Cycle 14AO-fix6 (Mike NB-O14AO-1): when vehicle is set, also read the
    // cookie directly. App Router caches RSC payloads on client-side
    // back-nav, so initialAnswers prop can be stale relative to what the
    // cookie holds. Cookie wins over a stale prop that's missing groups
    // the cookie reports. Cookie does NOT override a prop that already
    // has a value (server is fresher than cookie in the normal forward path).
    if (vehicle?.id) {
      for (const a of readSubModelCookieClient(vehicle.id)) {
        if (!(a.group in out)) out[a.group] = a.value;
      }
    }
    return out;
  });

  // Cycle 14AO-fix B-3 (round 2): re-sync local picks with the latest
  // server-rendered answers + URL after every router.refresh() / replace.
  // Cycle 14AO-fix3 (round 3) refines the merge to:
  //   1) WIPE local state if vehicle.id changed — different vehicle, fresh
  //      question state, no leaks across YMM switches.
  //   2) SKIP re-applying initialAnswers values for groups in
  //      clearedGroupsRef so the user's "Change" click isn't undone by
  //      stale-prop timing.
  //   3) Once the server stops reporting a cleared group (initialAnswers
  //      no longer has it), drop it from the cleared set so future picks
  //      sync normally.
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

    // Drop confirmed-cleared groups from the tracking set.
    for (const g of Array.from(clearedGroupsRef.current)) {
      const stillSet =
        (initialAnswers ?? []).some((a) => a.group === g) ||
        params.getAll(DIM_PARAM).some((v) => v.startsWith(`${g}:`));
      if (!stillSet) clearedGroupsRef.current.delete(g);
    }

    setPicks((prev) => {
      const next: Record<string, string> = { ...prev };
      // Drop locally any group that the user cleared AND the server has
      // confirmed is gone (no longer in initialAnswers + URL).
      for (const g of Object.keys(prev)) {
        if (clearedGroupsRef.current.has(g)) {
          // Still in flight — keep prev as-is (already deleted in onChange).
          continue;
        }
      }
      for (const a of initialAnswers ?? []) {
        if (clearedGroupsRef.current.has(a.group)) continue;
        next[a.group] = a.value;
      }
      const urlDims = readUrlDims(params);
      for (const [g, val] of Object.entries(urlDims)) {
        if (clearedGroupsRef.current.has(g)) continue;
        next[g] = val;
      }
      // Cycle 14AO-fix6 (Mike NB-O14AO-1): cookie fallback for vehicle-set
      // users when initialAnswers comes back stale (App Router cache
      // serving an old RSC payload on browser back-nav). Cookie reading
      // happens here too — not just useState init — so a stale-prop
      // re-render still picks up the customer's saved answer.
      if (vehicle?.id) {
        for (const a of readSubModelCookieClient(vehicle.id)) {
          if (clearedGroupsRef.current.has(a.group)) continue;
          if (!(a.group in next)) next[a.group] = a.value;
        }
      }
      // If a group is in clearedGroupsRef AND no longer in initialAnswers
      // or URL, ensure it's removed from picks too.
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
        // Cycle 14AO-fix5 (Mike R6 NB-NEW-4): if the URL still has a ?dim=
        // entry for this group (left over from a prior guest session that
        // later set a vehicle), strip it. Cookie/DB is now the source of
        // truth; URL ?dim= would otherwise re-apply on every navigation.
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
      // Cycle 14AO-fix3 (Mike NB-1): mark this group as "user-cleared" so
      // the useEffect re-sync that runs on the next URL/params change
      // doesn't immediately reapply the stale initialAnswers value before
      // the server has had a chance to confirm the clear. Removed from
      // the set automatically once the server-rendered initialAnswers no
      // longer carries the group.
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

  // Cycle 14AP-fix7 (owner): narrow the chip options to what the vehicle
  // is actually sold with. 2021 Ford F-150 only has 5.5'/6.5'/8' beds,
  // so showing 4.6'/5'/6' is noise that implies "maybe my truck has one
  // of these and I just don't know" — wrong, and trust-eroding. Falls
  // back to the full option set when vehicle is null or unknown.
  const strips: SubModelStripConfig[] = availableStripsForCategory(
    categoryHandle,
    vehicle ?? null,
  );
  if (strips.length === 0) return null;

  // Cycle 14AP-fix4 (owner POC): on /collections/front-grilles ONLY,
  // each chip card has TWO photos — the same vehicle silhouette in stock
  // form AND with the Stehlen aftermarket grille installed. Customer
  // toggles between "STOCK" and "WITH STEHLEN GRILLE" to see what their
  // truck would look like with the part bolted on. POC ships for front-
  // grilles only; if it lands well we expand to other categories.
  const FRONT_GRILLE_POC = categoryHandle === "front-grilles";

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
                    fontSize: 18,
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
                    marginBottom: 14,
                    maxWidth: 720,
                    lineHeight: 1.5,
                  }}
                >
                  {COPY[s.group].helper}
                </div>
                {/* Cycle 14AP-fix4 (owner POC): on /collections/front-grilles
                    only, render a STOCK / WITH STEHLEN GRILLE toggle above
                    the chip grid so the customer can see a before/after
                    preview of the same F-150 silhouette. Toggle is local
                    state — purely visual, no server roundtrip. */}
                {FRONT_GRILLE_POC && s.group === "trim" && (
                  <div
                    role="group"
                    aria-label="Toggle stock vs Stehlen grille preview"
                    style={{
                      display: "inline-flex",
                      gap: 0,
                      marginBottom: 12,
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                    }}
                  >
                    {(["stock", "stehlen"] as const).map((view) => {
                      const active = grilleView === view;
                      return (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setGrilleView(view)}
                          aria-pressed={active}
                          style={{
                            background: active
                              ? "var(--color-foreground)"
                              : "transparent",
                            color: active
                              ? "var(--color-background)"
                              : "var(--color-foreground)",
                            border: 0,
                            padding: "8px 14px",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {view === "stock"
                            ? "Stock truck"
                            : "+ Stehlen grille"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cycle 14AP (owner): visual chip cards with photo + label.
                    3:2 aspect, label below image (per Diana's spec). Image
                    src points at /images/dimensions/<group>-<slug>.jpg —
                    when the file is missing the next/image onError handler
                    falls back to a plain text-only chip so the picker
                    keeps working before the Gemini batch fully populates
                    the directory. Desktop: 3 per row at md+; mobile: 2
                    per row. */}
                <div
                  className="grid grid-cols-2 md:grid-cols-3"
                  style={{ gap: 12 }}
                >
                  {s.options.map((opt) => {
                    const slug = dimensionChipSlug(s.group, opt);
                    // Cycle 14AP-fix4 (owner POC): per-category override
                    // for /collections/front-grilles trim picker. Each
                    // chip has stock + stehlen variants of the same
                    // F-150 silhouette; toggle swaps between them.
                    const imgSrc =
                      FRONT_GRILLE_POC && s.group === "trim"
                        ? `/images/dimensions/front-grille-${slug}-${grilleView}.jpg`
                        : `/images/dimensions/${slug}.jpg`;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onPick(s.group, opt)}
                        disabled={pending}
                        aria-label={`Pick ${opt}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          padding: 0,
                          cursor: pending ? "wait" : "pointer",
                          color: "var(--color-foreground)",
                          textAlign: "left",
                          transition: "border-color .15s, transform .15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--color-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "var(--color-border)";
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "3 / 2",
                            background: "var(--color-surface-2)",
                          }}
                        >
                          <Image
                            src={imgSrc}
                            alt={opt}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                            // Cycle 14AP: silently swap to the placeholder
                            // bg when the image hasn't been generated yet.
                            // Browser hides the broken-image icon by setting
                            // src to a transparent 1x1 via CSS fallback.
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div
                          style={{
                            padding: "10px 12px",
                            fontFamily: "var(--font-display)",
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            textAlign: "center",
                          }}
                        >
                          {opt}
                        </div>
                      </button>
                    );
                  })}
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
          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={() => {
                // Cycle 14AP (owner): when gated, "Skip" must add ?skip=1
                // to the URL so the server-side gate opens. When not gated,
                // it's just an anchor scroll.
                if (gated) {
                  const sp = new URLSearchParams(params.toString());
                  sp.set("skip", "1");
                  startTransition(() => {
                    router.push(`${pathname}?${sp.toString()}`);
                  });
                  return;
                }
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
            {gated && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--color-muted)",
                  fontStyle: "italic",
                }}
              >
                Pick to see only the parts that fit, or skip to browse all.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
