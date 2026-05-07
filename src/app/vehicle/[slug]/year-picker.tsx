"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Cycle 14AA (Mike-O14AA F-4 MAJOR): the "PICK YOUR YEAR" buttons in the
 * vehicle hub used to dispatch the global YMM modal — re-opening the
 * full Year → Make → Model picker even though make + model were already
 * known. A returning customer who lands on /vehicle/ford-f-150 and clicks
 * "2021" wants their year saved, not a 3-step modal. POST directly to the
 * garage and refresh.
 */
export function YearPicker({
  years,
  make,
  model,
  selectedYear,
}: {
  years: (string | number)[];
  make: string;
  model: string;
  selectedYear: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const onPick = async (year: string | number) => {
    const yr = String(year);
    setPending(yr);
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ year: yr, make, model }),
      });
      if (!res.ok) throw new Error(`garage save ${res.status}`);
      router.refresh();
    } catch {
      // best-effort — fall through and clear pending state
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        flex: 1,
      }}
    >
      {years.map((y) => {
        const active = selectedYear === String(y);
        const busy = pending === y;
        return (
          <button
            key={y}
            type="button"
            onClick={() => onPick(y)}
            disabled={busy}
            className="mono"
            aria-pressed={active}
            style={{
              padding: "8px 14px",
              background: active
                ? "var(--color-background)"
                : "rgba(0,0,0,0.1)",
              border: active
                ? "1px solid var(--color-background)"
                : "1px solid rgba(0,0,0,0.2)",
              color: active
                ? "var(--color-primary)"
                : "var(--color-background)",
              fontSize: 12,
              fontWeight: active ? 800 : 600,
              letterSpacing: "0.06em",
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.5 : 1,
              borderRadius: "var(--radius-sm)",
            }}
          >
            {busy ? "…" : y}
          </button>
        );
      })}
    </div>
  );
}
