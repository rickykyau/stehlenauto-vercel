"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LineItem = {
  id: string;
  title: string;
  quantity: number;
  refundableQuantity: number;
  unitPrice: string;
};

export function RefundForm({
  orderGid,
  currency,
  refundableAmount,
  lineItems,
}: {
  orderGid: string;
  currency: string;
  refundableAmount: string;
  lineItems: LineItem[];
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState<"NO_RESTOCK" | "RETURN" | "CANCEL">(
    "NO_RESTOCK",
  );
  const [refundShipping, setRefundShipping] = useState(false);
  const [notify, setNotify] = useState(true);
  const [apologyEnabled, setApologyEnabled] = useState(false);
  const [apologyPercent, setApologyPercent] = useState(20);
  const [apologyDays, setApologyDays] = useState(90);
  const [apologyMessage, setApologyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refundable = parseFloat(refundableAmount) > 0;
  const estimatedTotal = lineItems.reduce((sum, li) => {
    const qty = picked[li.id] ?? 0;
    return sum + qty * parseFloat(li.unitPrice);
  }, 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const refundLineItems = Object.entries(picked)
      .filter(([, qty]) => qty > 0)
      .map(([lineItemId, quantity]) => ({
        lineItemId,
        quantity,
        restockType: restock,
      }));
    if (refundLineItems.length === 0) {
      setError("Pick at least one line item to refund.");
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderGid,
          note: note || undefined,
          notify,
          refundLineItems,
          shipping: refundShipping ? { fullRefund: true } : undefined,
          apology: apologyEnabled
            ? {
                enabled: true,
                percentage: apologyPercent / 100,
                expiresInDays: apologyDays,
                customMessage: apologyMessage || undefined,
              }
            : undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        refundId?: string;
        totalRefunded?: string;
        apology?: {
          code?: string;
          percentage?: number;
          emailSent?: boolean;
          emailError?: string;
          error?: string;
        } | null;
      };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Refund failed (HTTP ${res.status})`);
      }
      let msg = `Refund processed: $${data.totalRefunded ?? "—"} ${currency}.`;
      if (data.apology) {
        if (data.apology.error) {
          msg += ` ${data.apology.error}`;
        } else if (data.apology.code) {
          msg += ` Apology code ${data.apology.code} created`;
          if (data.apology.emailSent) msg += " and emailed to customer.";
          else if (data.apology.emailError)
            msg += ` (email skipped: ${data.apology.emailError}).`;
          else msg += ".";
        }
      }
      setSuccess(msg);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!refundable) {
    return (
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: 18,
          color: "var(--color-muted)",
          fontSize: 13,
        }}
      >
        This order has no refundable balance.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 18,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        ISSUE REFUND
      </div>
      {lineItems.map((li) => (
        <div
          key={li.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid var(--color-border)",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}>{li.title}</div>
            <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
              ${parseFloat(li.unitPrice).toFixed(2)} × refundable {li.refundableQuantity}
            </div>
          </div>
          <input
            type="number"
            min={0}
            max={li.refundableQuantity}
            value={picked[li.id] ?? 0}
            onChange={(e) =>
              setPicked((p) => ({
                ...p,
                [li.id]: Math.max(
                  0,
                  Math.min(li.refundableQuantity, parseInt(e.target.value || "0", 10)),
                ),
              }))
            }
            disabled={li.refundableQuantity === 0}
            className="input"
            style={{ width: 80, textAlign: "right" }}
          />
        </div>
      ))}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <label style={{ fontSize: 12 }}>
          <span className="mono" style={{ marginRight: 6 }}>RESTOCK:</span>
          <select
            value={restock}
            onChange={(e) => setRestock(e.target.value as typeof restock)}
            className="select"
            style={{ width: "100%", marginTop: 4 }}
          >
            <option value="NO_RESTOCK">No restock</option>
            <option value="RETURN">Return to inventory</option>
            <option value="CANCEL">Cancel (never shipped)</option>
          </select>
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
          }}
        >
          <input
            type="checkbox"
            checked={refundShipping}
            onChange={(e) => setRefundShipping(e.target.checked)}
          />
          Refund shipping (full)
        </label>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional, visible on the refund record)"
        className="input"
        rows={2}
        style={{ width: "100%", marginTop: 12, paddingTop: 8, paddingBottom: 8, resize: "vertical" }}
      />
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          marginTop: 8,
        }}
      >
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
        />
        Email customer about the refund
      </label>

      {/* Service-recovery apology block */}
      <div
        style={{
          marginTop: 14,
          padding: 12,
          background: apologyEnabled
            ? "rgba(245,168,35,0.06)"
            : "var(--color-surface-2)",
          border: apologyEnabled
            ? "1px solid rgba(245,168,35,0.4)"
            : "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <input
            type="checkbox"
            checked={apologyEnabled}
            onChange={(e) => setApologyEnabled(e.target.checked)}
          />
          Also create a SORRY-XXXX apology code and email it to the customer
        </label>
        {apologyEnabled && (
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 8, marginTop: 10 }}
          >
            <label style={{ fontSize: 12 }}>
              <span
                className="mono"
                style={{ marginRight: 6, color: "var(--color-muted)" }}
              >
                PERCENT OFF (5-50%)
              </span>
              <input
                type="number"
                min={5}
                max={50}
                value={apologyPercent}
                onChange={(e) =>
                  setApologyPercent(parseInt(e.target.value || "20", 10))
                }
                className="input"
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              <span
                className="mono"
                style={{ marginRight: 6, color: "var(--color-muted)" }}
              >
                EXPIRES IN (DAYS)
              </span>
              <input
                type="number"
                min={7}
                max={365}
                value={apologyDays}
                onChange={(e) =>
                  setApologyDays(parseInt(e.target.value || "90", 10))
                }
                className="input"
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            <textarea
              value={apologyMessage}
              onChange={(e) => setApologyMessage(e.target.value)}
              placeholder="Optional personal note (added to the apology email)…"
              className="input"
              rows={2}
              style={{
                width: "100%",
                paddingTop: 8,
                paddingBottom: 8,
                resize: "vertical",
                gridColumn: "1 / -1",
              }}
              maxLength={500}
            />
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13 }}>
          <span className="mono" style={{ color: "var(--color-muted)" }}>
            ESTIMATED:
          </span>{" "}
          <strong>${estimatedTotal.toFixed(2)}</strong>{" "}
          <span style={{ color: "var(--color-muted)" }}>
            (excl. shipping/tax)
          </span>
        </div>
        <button
          type="submit"
          disabled={submitting || estimatedTotal === 0}
          className="btn btn-primary"
          style={{ minWidth: 160 }}
        >
          {submitting ? "PROCESSING…" : "ISSUE REFUND"}
        </button>
      </div>
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--color-destructive)",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--color-success)",
          }}
        >
          {success}
        </div>
      )}
    </form>
  );
}
