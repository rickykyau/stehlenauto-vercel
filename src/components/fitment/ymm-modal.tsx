"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";
import { onOpenYmmModal } from "./ymm-events";

type Step = "year" | "make" | "model";

export function YmmModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("year");
  const [year, setYear] = useState<string | null>(null);
  const [make, setMake] = useState<string | null>(null);

  const [years, setYears] = useState<string[] | null>(null);
  const [makes, setMakes] = useState<string[] | null>(null);
  const [models, setModels] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Cycle 4 (Mike F-33): tap-bleed lock. After a Year → Make transition the
  // touch event would fire again on the new Make list at the same Y-pixel,
  // committing a wrong vehicle. Block picks for ~280ms after each transition.
  const [pickLockUntil, setPickLockUntil] = useState(0);
  const lockNow = () => setPickLockUntil(Date.now() + 280);
  const isLocked = () => Date.now() < pickLockUntil;

  const loadYears = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ymm");
      const data = (await res.json()) as { years?: string[] };
      setYears(data.years ?? []);
    } catch {
      setError("Couldn't load year list. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for global open events. Lazy-load year list on first open.
  useEffect(() => {
    return onOpenYmmModal(() => {
      setOpen(true);
      if (!years) void loadYears();
    });
  }, [loadYears, years]);

  // Lock scroll + escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cycle 14Z (owner CRITICAL): the previous combined `reset` did two
  // things — clear modal local state AND DELETE the saved garage from the
  // server. close() called reset() via setTimeout(200ms), so EVERY time the
  // modal closed (including immediately after a successful save and a
  // window.location.href navigation), the DELETE fired ~200ms later and
  // wiped the cookie we just set. Splitting cleanly:
  //   - resetLocalState: just zero the modal's React state
  //   - wipeGarage: server DELETE, only triggered by the RESET button
  const resetLocalState = () => {
    setStep("year");
    setYear(null);
    setMake(null);
    setMakes(null);
    setModels(null);
    setError(null);
  };
  const wipeGarage = async () => {
    resetLocalState();
    // Cycle 14AR-fix7 (QA-found BUG-YMM-1 P2): RESET cleared the cookie
    // but left the modal open re-rendering the year picker. User had
    // no visual confirmation the reset took. Close the modal so the
    // header pill shows "SELECT YOUR VEHICLE" — the implicit success
    // signal.
    setOpen(false);
    try {
      await fetch("/api/garage", { method: "DELETE" });
      router.refresh();
    } catch {
      // Local state is already cleared; ignore network failures.
    }
  };

  const close = () => {
    setOpen(false);
    // Cycle 14Z: was setTimeout(reset, 200) which deleted the saved garage
    // 200ms after every close — the smoking gun for the "vehicle not
    // saving" bug. Only clear local state on close; leave the cookie alone.
    setTimeout(resetLocalState, 200);
  };

  const onPickYear = async (y: string) => {
    if (isLocked()) return;
    lockNow();
    setYear(y);
    setStep("make");
    setMakes(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ymm?year=${encodeURIComponent(y)}`);
      const data = (await res.json()) as { makes?: string[] };
      setMakes(data.makes ?? []);
    } catch {
      setError("Couldn't load makes.");
    } finally {
      setLoading(false);
    }
  };

  const onPickMake = async (m: string) => {
    if (!year) return;
    if (isLocked()) return;
    lockNow();
    setMake(m);
    setStep("model");
    setModels(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ymm?year=${encodeURIComponent(year)}&make=${encodeURIComponent(m)}`,
      );
      const data = (await res.json()) as { models?: string[] };
      setModels(data.models ?? []);
    } catch {
      setError("Couldn't load models.");
    } finally {
      setLoading(false);
    }
  };

  const onPickModel = async (m: string) => {
    if (!year || !make) {
      console.warn("[ymm] onPickModel called with no year/make", { year, make });
      return;
    }
    // Cycle 14AP-fix14 (owner-found, prod, round 3): removed the
    // isLocked() guard on this terminal step. The 280ms lockout is
    // useful for advancing between Year → Make → Model steps to
    // prevent a double-click jumping two steps, but on the FINAL save
    // step it can silently swallow the user's actual save click if
    // they tap fast. Owner reported "doesn't change" 3+ times — the
    // lockout was likely the cause.
    setSaving(true);
    setError(null);
    console.log("[ymm] saving vehicle", { year, make, model: m });
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ year, make, model: m }),
        // Explicit credentials per the spec — cookies must round-trip
        // even on cross-origin scenarios (and same-origin shouldn't
        // hurt).
        credentials: "include",
        cache: "no-store",
      });
      console.log("[ymm] /api/garage response", {
        status: res.status,
        ok: res.ok,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Couldn't save vehicle.");
      }
      const body = (await res.json().catch(() => null)) as
        | { vehicle?: { id?: string } }
        | null;
      console.log("[ymm] save OK, server returned vehicle", body?.vehicle);
      track("select_vehicle", {
        vehicle_year: year,
        vehicle_make: make,
        vehicle_model: m,
      });
      close();
      // Cycle 14AC (Mike-O14AC NW-3): updated decision. The 14N cycle
      // hard-redirected to /vehicle/<slug> from non-shopping pages so a
      // first-time customer would see what fits. But Mike (returning
      // customer who's just CHANGING garage from the header) found
      // himself yanked to a hub he didn't want — destroying his place
      // in whatever article / hub he was reading. Now: stay on the
      // current page in all cases. Hard-reload via window.location so
      // the layout re-evaluates getCurrentVehicle and the header chip
      // updates. First-time customers from the home band can use the
      // SHOP PARTS THAT FIT button (cycle 14AA F-7) to reach the hub
      // explicitly.
      // Cycle 14AR-fix11 (F-6 clean URL): replaced `_v=${Date.now()}` cache-bust
      // with a clean-pathname navigate. window.location.replace() with only the
      // pathname forces a fresh network GET (browser cannot serve cached HTML when
      // the navigation is triggered by replace() with a new Set-Cookie round-trip
      // from the just-completed /api/garage POST). No _v= param means analytics
      // path tracking is clean and ?dim= / ?f= parsers don't see collisions.
      // Existing filters (?sort=, ?f=, ?dim=) are preserved; only the stale _v=
      // and now-vestigial ?skip= are stripped so they don't reintroduce the gate.
      // vehicle/[slug] pages navigate to the new slug (unchanged behaviour).
      const slug = `${make.toLowerCase()}-${m
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
      let target: string;
      if (pathname && /^\/vehicle\//.test(pathname)) {
        target = `/vehicle/${slug}`;
      } else {
        const base = pathname ?? "/";
        const existingParams = new URLSearchParams(window.location.search);
        existingParams.delete("_v");    // strip stale cache-bust from prior cycle
        existingParams.delete("skip");  // vestigial gate skip param
        const qs = existingParams.toString();
        target = qs ? `${base}?${qs}` : base;
      }
      console.log("[ymm] navigating to", target);
      // replace() skips history stack (back button skips the pre-vehicle page)
      // and triggers a fresh network GET for the target URL.
      window.location.replace(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const list = step === "year" ? years : step === "make" ? makes : models;

  return (
    // Cycle 14AR-fix10 (F-1): ymm-backdrop + ymm-panel CSS classes drive the
    // mobile bottom-sheet layout via media queries in globals.css. On mobile
    // (≤767px): backdrop aligns flex-end, panel is full-width with top-only
    // border-radius and max-height 80vh. On desktop (≥768px): centered overlay
    // at 520px max-width. No window.innerWidth — avoids SSR hydration mismatch.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select your vehicle"
      onClick={close}
      className="anim-fade-in ymm-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ymm-panel"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drag handle — visible on mobile only (hidden via CSS ≥768px) */}
        <div className="ymm-drag-handle" aria-hidden>
          <div className="ymm-drag-handle-bar" />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div>
            <h3
              className="mono"
              style={{
                fontSize: 13,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              SELECT YOUR VEHICLE
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                marginTop: 4,
              }}
            >
              {step === "year" && "Step 1 of 3 · Year"}
              {step === "make" && `Step 2 of 3 · Make · ${year}`}
              {step === "model" && `Step 3 of 3 · Model · ${year} ${make}`}
            </p>
            {/* Cycle 14AR-fix8 (Jordan F-13): visual progress bar — 3-segment
                strip showing how close the user is to finishing the YMM
                pick. Reduces mid-flow abandonment, particularly on Step 3
                (Model) where the list is long. Active+completed segments
                are primary-yellow; remaining are border-grey. */}
            <div
              aria-hidden
              style={{
                display: "flex",
                gap: 4,
                marginTop: 8,
                width: 120,
              }}
            >
              {(["year", "make", "model"] as const).map((s, i) => {
                const stepIdx = step === "year" ? 0 : step === "make" ? 1 : 2;
                const done = i <= stepIdx;
                return (
                  <div
                    key={s}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: done
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    }}
                  />
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "var(--color-muted)",
              display: "flex",
            }}
          >
            <Icons.close size={18} />
          </button>
        </div>

        {(year || make) && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 24px",
              borderBottom: "1px solid var(--color-border)",
              flexWrap: "wrap",
            }}
          >
            {year && (
              <button
                type="button"
                onClick={() => {
                  setStep("year");
                  setMake(null);
                  setModels(null);
                }}
                className="chip"
                style={{ cursor: "pointer" }}
              >
                {year}
              </button>
            )}
            {make && (
              <button
                type="button"
                onClick={() => {
                  setStep("make");
                  setModels(null);
                }}
                className="chip"
                style={{ cursor: "pointer" }}
              >
                {make}
              </button>
            )}
          </div>
        )}

        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "8px 0",
          }}
        >
          {error && (
            <div
              style={{
                margin: "12px 24px",
                padding: 12,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-destructive)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          {loading && (
            <div
              style={{
                padding: "24px 24px",
                color: "var(--color-muted)",
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          )}
          {!loading && list && list.length === 0 && (
            <div
              style={{
                padding: "24px 24px",
                color: "var(--color-muted)",
                fontSize: 13,
              }}
            >
              No options found.
            </div>
          )}
          {/* Cycle 14AR-fix8 (Jordan F-5): popular-makes shortcut. The make
              list is alphabetical with 20+ entries — Ford, Chevrolet, GMC,
              Ram, Toyota, Jeep are buried at various positions and account
              for the majority of Stehlen's traffic. Shortcut row at the
              top of Step 2 cuts ~60% of scrolling for the demographic. */}
          {!loading && step === "make" && list && list.length > 0 && (
            (() => {
              const POPULAR = ["Ford", "Chevrolet", "Ram", "Toyota", "Jeep", "GMC"];
              const present = POPULAR.filter((p) => list!.includes(p));
              if (present.length === 0) return null;
              return (
                <div
                  style={{
                    padding: "12px 24px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "var(--color-muted)",
                      marginBottom: 8,
                    }}
                  >
                    POPULAR
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                    }}
                  >
                    {present.map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={saving}
                        onClick={() => void onPickMake(m)}
                        style={{
                          minHeight: 44,
                          padding: "0 10px",
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border-2)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--color-foreground)",
                          fontSize: 13,
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          cursor: saving ? "wait" : "pointer",
                        }}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {!loading && list && list.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {list.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (step === "year") void onPickYear(item);
                      else if (step === "make") void onPickMake(item);
                      else void onPickModel(item);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      padding: "12px 24px",
                      color: "var(--color-foreground)",
                      cursor: saving ? "wait" : "pointer",
                      fontSize: 14,
                      fontFamily:
                        step === "year"
                          ? "var(--font-display)"
                          : "var(--font-sans)",
                      letterSpacing: step === "year" ? "0.06em" : 0,
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background 120ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--color-surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <button type="button" onClick={wipeGarage} className="btn btn-sm">
            RESET
          </button>
          <p
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--color-muted)",
              alignSelf: "center",
            }}
          >
            Fitment guaranteed or your money back
          </p>
        </div>
      </div>
    </div>
  );
}
