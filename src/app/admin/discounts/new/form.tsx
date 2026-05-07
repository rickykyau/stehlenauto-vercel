"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Kind = "percentage" | "fixed_amount" | "free_shipping";
type Activation = "code" | "automatic";

type PresetClient = {
  id: string;
  label: string;
  blurb: string;
  defaults: {
    title?: string;
    activation?: Activation;
    code?: string;
    value?: Kind;
    percentage?: number;
    fixedAmount?: number;
    minimumSubtotal?: number;
    appliesOncePerCustomer?: boolean;
    prefix?: string;
  };
};

export function NewDiscountForm({ presets }: { presets: PresetClient[] }) {
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
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Bulk-generate state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkCount, setBulkCount] = useState(50);
  const [bulkSuffixLength, setBulkSuffixLength] = useState(6);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{
    codes: string[];
    failed: { code: string; error: string }[];
  } | null>(null);

  const applyPreset = (p: PresetClient) => {
    setActivePreset(p.id);
    if (p.defaults.title !== undefined) setTitle(p.defaults.title);
    if (p.defaults.activation) setActivation(p.defaults.activation);
    if (p.defaults.code !== undefined) setCode(p.defaults.code);
    if (p.defaults.value) setKind(p.defaults.value);
    if (p.defaults.percentage !== undefined)
      setPercentage(Math.round((p.defaults.percentage ?? 0) * 100));
    if (p.defaults.fixedAmount !== undefined)
      setFixedAmount(p.defaults.fixedAmount);
    if (p.defaults.minimumSubtotal !== undefined)
      setMinimumSubtotal(p.defaults.minimumSubtotal);
    if (p.defaults.appliesOncePerCustomer !== undefined)
      setAppliesOnce(p.defaults.appliesOncePerCustomer);
    if (p.defaults.prefix !== undefined) {
      setBulkPrefix(p.defaults.prefix);
      // Hint that bulk mode pairs naturally with this preset, but don't
      // auto-flip — owner should consciously opt into bulk.
    }
  };

  const baseInput = () => ({
    title: title.trim(),
    activation,
    value: kind,
    percentage:
      kind === "percentage" ? Math.max(0, Math.min(100, percentage)) / 100 : undefined,
    fixedAmount: kind === "fixed_amount" ? fixedAmount : undefined,
    startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    appliesOncePerCustomer: appliesOnce,
    usageLimit: usageLimit === "" ? null : Number(usageLimit),
    minimumSubtotal,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setBulkResult(null);
    try {
      if (bulkMode) {
        if (!bulkPrefix.trim()) {
          throw new Error("Prefix is required for bulk generation");
        }
        const res = await fetch("/api/admin/discount/bulk", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...baseInput(),
            prefix: bulkPrefix,
            count: bulkCount,
            suffixLength: bulkSuffixLength,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          codes?: string[];
          failed?: { code: string; error: string }[];
        };
        if (!res.ok || data.error) {
          throw new Error(data.error ?? `Bulk failed (HTTP ${res.status})`);
        }
        setBulkResult({
          codes: data.codes ?? [],
          failed: data.failed ?? [],
        });
        return;
      }

      const res = await fetch("/api/admin/discount", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...baseInput(),
          code: activation === "code" ? code.trim().toUpperCase() : undefined,
        }),
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

  const downloadCSV = () => {
    if (!bulkResult || bulkResult.codes.length === 0) return;
    const blob = new Blob(
      [["code", ...bulkResult.codes].join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stehlen-${bulkPrefix.toLowerCase()}codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Preset gallery */}
      <div style={{ marginBottom: 28 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--color-muted)",
            marginBottom: 10,
          }}
        >
          QUICK PRESETS — TAP TO PRE-FILL
        </div>
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 8 }}
        >
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                textAlign: "left",
                padding: 14,
                background:
                  activePreset === p.id
                    ? "rgba(245,168,35,0.08)"
                    : "var(--color-surface)",
                border:
                  activePreset === p.id
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {p.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted)",
                  lineHeight: 1.5,
                }}
              >
                {p.blurb}
              </div>
            </button>
          ))}
        </div>
      </div>

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

        {activation === "code" && !bulkMode && (
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
              disabled={bulkMode}
            />
            {bulkMode && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted)",
                  marginTop: 4,
                }}
              >
                Bulk codes are forced to single-use (1 redemption each).
              </div>
            )}
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

        {activation === "code" && !bulkMode && (
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

        {/* Bulk generation panel */}
        {activation === "code" && (
          <div
            style={{
              marginBottom: 16,
              padding: 14,
              background: bulkMode
                ? "rgba(245,168,35,0.06)"
                : "var(--color-surface-2)",
              border: bulkMode
                ? "1px solid rgba(245,168,35,0.4)"
                : "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: bulkMode ? 12 : 0,
              }}
            >
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
              />
              Generate {" "}
              <strong>bulk single-use codes</strong>{" "}
              (one code per customer, exported as CSV)
            </label>
            {bulkMode && (
              <div
                className="grid grid-cols-1 md:grid-cols-3"
                style={{ gap: 10 }}
              >
                <Field label="Code prefix">
                  <input
                    value={bulkPrefix}
                    onChange={(e) =>
                      setBulkPrefix(e.target.value.toUpperCase().replace(/\s+/g, ""))
                    }
                    placeholder="FRIEND-"
                    className="input"
                    style={{ width: "100%" }}
                  />
                </Field>
                <Field label="Suffix length (4-12)">
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={bulkSuffixLength}
                    onChange={(e) =>
                      setBulkSuffixLength(parseInt(e.target.value || "6", 10))
                    }
                    className="input"
                    style={{ width: "100%" }}
                  />
                </Field>
                <Field label="How many codes (1-1000)">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(parseInt(e.target.value || "1", 10))
                    }
                    className="input"
                    style={{ width: "100%" }}
                  />
                </Field>
              </div>
            )}
          </div>
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

        {bulkResult && (
          <div
            style={{
              padding: 14,
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.4)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <strong>{bulkResult.codes.length}</strong> codes created.{" "}
              {bulkResult.failed.length > 0 && (
                <span style={{ color: "var(--color-destructive)" }}>
                  {bulkResult.failed.length} failed.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={downloadCSV}
              className="btn btn-sm btn-primary"
              style={{ marginRight: 8 }}
            >
              DOWNLOAD CSV
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/discounts")}
              className="btn btn-sm"
            >
              VIEW LIST
            </button>
            {bulkResult.failed.length > 0 && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 12 }}>
                  Show {bulkResult.failed.length} failed
                </summary>
                <ul style={{ marginTop: 8, fontSize: 11, fontFamily: "monospace" }}>
                  {bulkResult.failed.slice(0, 50).map((f) => (
                    <li key={f.code}>
                      {f.code} — {f.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title.trim() || (activation === "code" && !bulkMode && !code.trim())}
          className="btn btn-primary btn-lg"
        >
          {submitting
            ? bulkMode
              ? `GENERATING ${bulkCount} CODES…`
              : "CREATING…"
            : bulkMode
              ? `GENERATE ${bulkCount} CODES`
              : "CREATE DISCOUNT"}
        </button>
      </form>
    </div>
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
