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
  // Cycle 14AP-fix10 (owner round 3): click-to-zoom modal. Stores the
  // CHIP CONTEXT (group + value, e.g. trim + "BASE") rather than a
  // baked URL — so when the user toggles STOCK / + STEHLEN GRILLE
  // INSIDE the modal, the same chip swaps to the other view without
  // closing. The image src is recomputed from grilleView each render.
  // ESC + click-outside dismiss.
  const [zoomChip, setZoomChip] = useState<{
    group: SubModelGroup;
    value: string;
  } | null>(null);

  // Cycle 14AP-fix9: ESC closes the zoom modal.
  useEffect(() => {
    if (!zoomChip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomChip(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoomChip]);
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

  // Cycle 14AP-fix17 (owner expansion): the trim image-edit toggle now
  // applies to multiple categories. Each entry maps a category handle
  // to the image filename prefix and the "stehlen" toggle label. The
  // 3 stock photos are shared (front-grille-trim-{X}-stock.jpg) — only
  // the +stehlen image-edit pair differs per product family.
  const TOGGLE_CONFIG: Record<
    string,
    { prefix: string; stehlenLabel: string; productNoun: string }
  > = {
    "front-grilles": {
      prefix: "front-grille",
      stehlenLabel: "+ Stehlen Grille",
      productNoun: "grille",
    },
    "bull-guards-grille-guards": {
      prefix: "bull-guard",
      stehlenLabel: "+ Stehlen Bull Guard",
      productNoun: "bull guard",
    },
  };
  const toggleCfg = TOGGLE_CONFIG[categoryHandle];
  const FRONT_GRILLE_POC = Boolean(toggleCfg);

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

  // Cycle 14AP-fix11 (owner + Jordan): branched flow on the front-grilles
  // POC. Vehicle-set customers see the 3-chip trim picker (existing
  // Path A). Guests see a single before/after comparison of one F-150
  // with stock vs Stehlen grille — no chips to pick, no gate. Jordan's
  // call: a guest who hasn't picked a truck doesn't need to commit to
  // a trim, they need to UNDERSTAND the product. Side-by-side does
  // that job in one view.
  if (FRONT_GRILLE_POC && !vehicle) {
    return (
      <section
        aria-label="See what a Stehlen front grille looks like on your truck"
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 24, paddingBottom: 28 }}
        >
          <div
            className="eyebrow"
            style={{ color: "var(--color-muted)", marginBottom: 8 }}
          >
            BEFORE → AFTER
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            See what a Stehlen front grille does to a stock truck
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              marginBottom: 18,
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            Same Ford F-150, same angle, same lighting — only the grille
            changes. Browse the catalog below for grilles that fit your
            truck.
          </div>

          {/* Side-by-side desktop, stacked mobile (Jordan's spec). */}
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 12 }}
          >
            {(
              [
                {
                  label: "STOCK TRUCK",
                  src: "/images/dimensions/front-grille-trim-base-stock.jpg",
                },
                {
                  label: (toggleCfg?.stehlenLabel ?? "+ Stehlen Grille").toUpperCase(),
                  src: `/images/dimensions/${toggleCfg?.prefix ?? "front-grille"}-trim-base-stehlen.jpg`,
                },
              ] as const
            ).map((side) => (
              <div key={side.label}>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    color: "var(--color-muted)",
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  {side.label}
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "3 / 2",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={side.src}
                    alt={`Ford F-150 ${side.label}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Reuse the zoom modal — open with the BASE chip
                      // context so the modal's stock/stehlen toggle
                      // works against the base pair.
                      setGrilleView(
                        side.label === "STOCK TRUCK" ? "stock" : "stehlen",
                      );
                      setZoomChip({ group: "trim", value: "BASE" });
                    }}
                    aria-label={`Enlarge ${side.label} photo`}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      background: "rgba(10,10,10,0.85)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: 4,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "var(--font-display)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    <Icons.search size={14} />
                    <span>Enlarge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vehicle-setting nudge per Jordan's spec — not a gate, just
              a clear CTA toward the YMM modal so customers who DO
              know their truck can narrow before they hit the PDP. */}
          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={openYmmModal}
              className="chip"
              style={{ cursor: "pointer", fontSize: 12 }}
            >
              <Icons.truck size={10} /> SET YOUR VEHICLE FOR EXACT-FIT GRILLES →
            </button>
            <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
              or scroll down to browse all grilles
            </span>
          </div>
        </div>

        {/* Reuse the same zoom modal that Path A uses, so the toggle
            and ESC handling stay consistent. The trim/value passed in
            ("BASE") doesn't matter — only the FRONT_GRILLE_POC + group
            === "trim" check inside the modal. */}
        {zoomChip && (() => {
          const slug = dimensionChipSlug(zoomChip.group, zoomChip.value);
          const src = `/images/dimensions/${grilleView === "stock" ? "front-grille" : (toggleCfg?.prefix ?? "front-grille")}-${slug}-${grilleView}.jpg`;
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Front grille preview"
              onClick={() => setZoomChip(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 90,
                background: "rgba(10,10,10,0.94)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 20px 96px",
                cursor: "zoom-out",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomChip(null);
                }}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 4,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <Icons.close size={20} />
              </button>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "relative",
                  width: "min(95vw, 1400px)",
                  maxHeight: "78vh",
                  aspectRatio: "3 / 2",
                  cursor: "default",
                }}
              >
                <Image
                  key={src}
                  src={src}
                  alt="Ford F-150 grille preview"
                  fill
                  sizes="95vw"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: 0,
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 14,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>FORD F-150</span>
                  <span style={{ opacity: 0.6, marginLeft: 12 }}>
                    · {grilleView === "stock" ? "Stock truck" : toggleCfg?.stehlenLabel ?? "+ Stehlen Grille"}
                  </span>
                </div>
                <div
                  role="group"
                  aria-label={`Toggle stock vs ${toggleCfg?.productNoun ?? "grille"}`}
                  style={{
                    display: "inline-flex",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
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
                          background: active ? "#fff" : "transparent",
                          color: active ? "#0a0a0a" : "#fff",
                          border: 0,
                          padding: "10px 18px",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-display)",
                          cursor: "pointer",
                        }}
                      >
                        {view === "stock"
                          ? "Stock truck"
                          : toggleCfg?.stehlenLabel ?? "+ Stehlen Grille"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </section>
    );
  }

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
            // Cycle 14AP-fix12 (owner): keep the FULL chip grid + toggle
            // visible at all times — even after the customer has picked
            // an answer. The previous "collapse to pill" mode hid the
            // before/after toggle and the comparison strip the moment
            // the customer answered, which defeated the point of the
            // visual picker. Now: render the chip grid always; the
            // selected chip gets a yellow-border "active" treatment so
            // the customer knows which one is picked. Click any other
            // chip to change.
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
                            : toggleCfg?.stehlenLabel ?? "+ Stehlen Grille"}
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
                      toggleCfg && s.group === "trim"
                        ? `/images/dimensions/${grilleView === "stock" ? "front-grille" : toggleCfg.prefix}-${slug}-${grilleView}.jpg`
                        : `/images/dimensions/${slug}.jpg`;
                    // Cycle 14AP-fix12: active-chip treatment. The
                    // currently-picked option gets a primary-yellow
                    // border + a "✓ SELECTED" pill in the bottom-left
                    // corner so the customer can see which chip is
                    // active without losing the comparison strip.
                    const isActive = picks[s.group] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onPick(s.group, opt)}
                        disabled={pending}
                        aria-label={isActive ? `${opt} selected` : `Pick ${opt}`}
                        aria-pressed={isActive}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "var(--color-surface)",
                          border: `2px solid ${
                            isActive
                              ? "var(--color-primary)"
                              : "var(--color-border)"
                          }`,
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          padding: 0,
                          cursor: pending ? "wait" : "pointer",
                          color: "var(--color-foreground)",
                          textAlign: "left",
                          transition: "border-color .15s, transform .15s",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor =
                              "var(--color-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor =
                              "var(--color-border)";
                          }
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
                          {/* Cycle 14AP-fix9 (owner): zoom icon overlay.
                              Click chip body = pick trim. Click zoom icon
                              = open fullscreen modal so the customer can
                              see the before/after detail without
                              committing to a pick. stopPropagation keeps
                              the icon click from triggering onPick. */}
                          {/* Cycle 14AP-fix10 (owner round 3): bigger,
                              more obvious zoom button with a label so
                              customers actually see it. The previous
                              32x32 magnifier was too easy to miss. */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setZoomChip({ group: s.group, value: opt });
                            }}
                            aria-label={`Enlarge ${opt} photo`}
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "8px 12px",
                              background: "rgba(10,10,10,0.85)",
                              backdropFilter: "blur(6px)",
                              border: "1px solid rgba(255,255,255,0.25)",
                              borderRadius: 4,
                              color: "#fff",
                              cursor: "pointer",
                              fontFamily: "var(--font-display)",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            <Icons.search size={14} />
                            <span>Enlarge</span>
                          </button>
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
                            background: isActive
                              ? "var(--color-primary)"
                              : "transparent",
                            color: isActive
                              ? "var(--color-background)"
                              : "var(--color-foreground)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          {isActive && <Icons.check size={11} sw={3} />}
                          <span>{opt}</span>
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

      {/* Cycle 14AP-fix10 (owner round 3): fullscreen click-to-zoom
          modal. Image src is computed from grilleView so the user can
          toggle STOCK / + STEHLEN GRILLE INSIDE the modal — entire
          point of the enlarge feature is to compare before vs after,
          which requires the toggle. ESC + click-outside dismiss; the
          toggle and image stop click propagation so a tap inside the
          interactive area doesn't close the modal. */}
      {zoomChip && (() => {
        // Recompute the src on each render based on the live grilleView
        // state — so flipping the toggle in the modal swaps the image.
        const slug = dimensionChipSlug(zoomChip.group, zoomChip.value);
        const src =
          FRONT_GRILLE_POC && zoomChip.group === "trim"
            ? `/images/dimensions/front-grille-${slug}-${grilleView}.jpg`
            : `/images/dimensions/${slug}.jpg`;
        const showToggle =
          FRONT_GRILLE_POC && zoomChip.group === "trim";
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${zoomChip.value} preview`}
            onClick={() => setZoomChip(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              background: "rgba(10,10,10,0.94)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 20px 96px",
              cursor: "zoom-out",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomChip(null);
              }}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <Icons.close size={20} />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                width: "min(95vw, 1400px)",
                maxHeight: "78vh",
                aspectRatio: "3 / 2",
                cursor: "default",
              }}
            >
              <Image
                key={src /* force re-render when toggling */}
                src={src}
                alt={zoomChip.value}
                fill
                sizes="95vw"
                style={{ objectFit: "contain" }}
                priority
              />
            </div>

            {/* Caption + toggle row, anchored bottom of modal */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: 24,
                left: 0,
                right: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                cursor: "default",
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-display)",
                }}
              >
                <span style={{ fontWeight: 700 }}>{zoomChip.value}</span>
                {showToggle && (
                  <span style={{ opacity: 0.6, marginLeft: 12 }}>
                    · {grilleView === "stock" ? "Stock truck" : toggleCfg?.stehlenLabel ?? "+ Stehlen Grille"}
                  </span>
                )}
              </div>
              {showToggle && (
                <div
                  role="group"
                  aria-label={`Toggle stock vs ${toggleCfg?.productNoun ?? "grille"}`}
                  style={{
                    display: "inline-flex",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
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
                          background: active ? "#fff" : "transparent",
                          color: active ? "#0a0a0a" : "#fff",
                          border: 0,
                          padding: "10px 18px",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-display)",
                          cursor: "pointer",
                        }}
                      >
                        {view === "stock"
                          ? "Stock truck"
                          : toggleCfg?.stehlenLabel ?? "+ Stehlen Grille"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
