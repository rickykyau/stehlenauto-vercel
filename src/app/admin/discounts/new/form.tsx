"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Kind = "percentage" | "fixed_amount" | "free_shipping";
type Activation = "code" | "automatic";

export function NewDiscountForm() {
  const router = useRouter();
  const [activation, setActivation] = useState<Activation>("code");
  const [kind, setKind] = useState<Kind>("percentage");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [fixedAmount, setFixedAmount] = useState(25);
  const [minimumSubtotal, setMinimumSubtotal] = useState(0);
  const [appliesOnce, setAppliesOnce] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        activation,
        code: activation === "code" ? code.trim().toUpperCase() : undefined,
        value: kind,
        percentage:
          kind === "percentage" ? Math.max(0, Math.min(100, percentage)) / 100 : undefined,
        fixedAmount: kind === "fixed_amount" ? fixedAmount : undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        appliesOncePerCustomer: appliesOnce,
        usageLimit: usageLimit === "" ? null : Number(usageLimit),
        minimumSubtotal,
      };
      const res = await fetch("/api/admin/discount", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Create failed (HTTP ${res.status})`);
      }
      router.push("/admin/discounts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
        maxWidth: 720,
      }}
    >
      <Field label="Title (internal name; not shown to customer)">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="e.g. Returning customer 10%"
          style={{ width: "100%" }}
        />
      </Field>

      <Field label="Activation">
        <div style={{ display: "flex", gap: 12 }}>
          <RadioPill
            checked={activation === "code"}
            onChange={() => setActivation("code")}
            label="CODE"
            sub="Customer types it at checkout"
          />
          <RadioPill
            checked={activation === "automatic"}
            onChange={() => setActivation("automatic")}
            label="AUTOMATIC"
            sub="Applies without a code"
          />
        </div>
      </Field>

      {activation === "code" && (
        <Field label="Code (UPPERCASE, no spaces)">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            className="input"
            placeholder="WELCOME10"
            style={{ width: "100%", textTransform: "uppercase" }}
          />
        </Field>
      )}

      <Field label="Discount kind">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <RadioPill
            checked={kind === "percentage"}
            onChange={() => setKind("percentage")}
            label="PERCENTAGE"
            sub="e.g. 10% off"
          />
          <RadioPill
            checked={kind === "fixed_amount"}
            onChange={() => setKind("fixed_amount")}
            label="FIXED AMOUNT"
            sub="e.g. $25 off"
          />
          <RadioPill
            checked={kind === "free_shipping"}
            onChange={() => setKind("free_shipping")}
            label="FREE SHIPPING"
            sub="No charge for shipping"
          />
        </div>
      </Field>

      {kind === "percentage" && (
        <Field label="Percent off">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value || "0", 10))}
              className="input"
              style={{ width: 100 }}
            />
            <span style={{ fontSize: 16 }}>%</span>
          </div>
        </Field>
      )}
      {kind === "fixed_amount" && (
        <Field label="Amount off (USD)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>$</span>
            <input
              type="number"
              min={1}
              step="0.01"
              required
              value={fixedAmount}
              onChange={(e) => setFixedAmount(parseFloat(e.target.value || "0"))}
              className="input"
              style={{ width: 120 }}
            />
          </div>
        </Field>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        <Field label="Minimum subtotal (optional)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={minimumSubtotal}
              onChange={(e) =>
                setMinimumSubtotal(parseFloat(e.target.value || "0"))
              }
              className="input"
              style={{ width: 120 }}
            />
          </div>
        </Field>
        <Field label="Usage limit (total, optional)">
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) =>
              setUsageLimit(e.target.value === "" ? "" : parseInt(e.target.value, 10))
            }
            placeholder="No limit"
            className="input"
            style={{ width: 140 }}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        <Field label="Starts at (optional, defaults to now)">
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="input"
            style={{ width: "100%" }}
          />
        </Field>
        <Field label="Ends at (optional)">
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="input"
            style={{ width: "100%" }}
          />
        </Field>
      </div>

      {activation === "code" && (
        <Field label="Per-customer">
          <label
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
          >
            <input
              type="checkbox"
              checked={appliesOnce}
              onChange={(e) => setAppliesOnce(e.target.checked)}
            />
            One use per customer
          </label>
        </Field>
      )}

      {error && (
        <div
          style={{
            padding: 10,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--color-destructive)",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim() || (activation === "code" && !code.trim())}
        className="btn btn-primary btn-lg"
      >
        {submitting ? "CREATING…" : "CREATE DISCOUNT"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--color-muted)",
          marginBottom: 6,
        }}
      >
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function RadioPill({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="mono"
      style={{
        padding: "10px 14px",
        background: checked ? "var(--color-primary)" : "transparent",
        color: checked ? "var(--color-primary-foreground, #0a0a0a)" : "var(--color-foreground)",
        borderColor: checked ? "var(--color-primary)" : "var(--color-border)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid",
        cursor: "pointer",
        textAlign: "left",
        fontSize: 11,
        letterSpacing: "0.08em",
      }}
    >
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div
        style={{
          fontSize: 10,
          opacity: 0.75,
          marginTop: 2,
          textTransform: "none",
          letterSpacing: 0,
        }}
      >
        {sub}
      </div>
    </button>
  );
}
