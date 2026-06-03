"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "approved" | "rejected";

// Per-row moderation controls. Shows only the actions that make sense for the
// row's current status (e.g. an approved review can be un-published back to
// pending or rejected). Calls PATCH /api/admin/review then refreshes the RSC.
export function ReviewActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function set(next: Status) {
    setErr(null);
    try {
      const res = await fetch("/api/admin/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? `HTTP ${res.status}`);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErr("network");
    }
  }

  const btn = (
    label: string,
    next: Status,
    kind: "approve" | "reject" | "neutral",
  ) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => set(next)}
      className="mono"
      style={{
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "6px 12px",
        minHeight: 32,
        borderRadius: 6,
        cursor: pending ? "wait" : "pointer",
        border: "1px solid var(--color-border-2)",
        background:
          kind === "approve"
            ? "var(--color-primary)"
            : "transparent",
        color:
          kind === "approve"
            ? "var(--color-primary-foreground)"
            : kind === "reject"
              ? "#f87171"
              : "var(--color-muted)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {status !== "approved" && btn("Approve", "approved", "approve")}
      {status !== "rejected" && btn("Reject", "rejected", "reject")}
      {status !== "pending" && btn("Re-queue", "pending", "neutral")}
      {err && (
        <span style={{ fontSize: 11, color: "#f87171" }}>error: {err}</span>
      )}
    </div>
  );
}
