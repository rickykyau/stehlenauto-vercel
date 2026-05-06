"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
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
    if (!year || !make) return;
    if (isLocked()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ year, make, model: m }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Couldn't save vehicle.");
      }
      close();
      // Cycle 14N (owner): "Shop by Vehicle" appeared dead because picking
      // a year/make/model just refreshed the home page — the customer was
      // left wondering "where do I shop now?". Navigate to the vehicle hub
      // (/vehicle/<make>-<model>) on the home and content pages so the
      // customer sees what fits their truck immediately. On collection /
      // search / PDP / cart pages, just refresh in place — the page is
      // already vehicle-aware and re-ranks to fits-first.
      const slug = `${make.toLowerCase()}-${m
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
      const onShoppingPage = /^\/(collections|products|search|cart|checkout|account)/.test(
        pathname ?? "",
      );
      // Cycle 14Y (owner): router.push() is a soft SPA nav that doesn't
      // re-execute the root layout (where getCurrentVehicle reads the cookie)
      // — even with a follow-up router.refresh() the header chip stayed
      // stuck on "SELECT VEHICLE" after the customer picked a vehicle.
      // Hard-navigate via window.location so the layout always re-renders
      // fresh with the just-set cookie. On shopping pages (already vehicle-
      // aware), keep the soft refresh — it's enough there because the page
      // re-evaluates getCurrentVehicle on the SSR pass.
      if (onShoppingPage) {
        router.refresh();
      } else {
        window.location.href = `/vehicle/${slug}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const list = step === "year" ? years : step === "make" ? makes : models;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select your vehicle"
      onClick={close}
      className="anim-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
