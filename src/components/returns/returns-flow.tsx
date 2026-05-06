"use client";

import Link from "next/link";
import { useState } from "react";
import { Icons } from "@/components/ui/icons";

const ITEMS = [
  {
    sku: "RR-LP-UNI-STL-2",
    title: "Stehlen Door-Frame Mount Roof Rack",
    subtitle: "Black / Steel / Crew Cab",
    price: 489,
    qty: 1,
  },
  {
    sku: "GR-TOR03-H-BK",
    title: "Stehlen Horizontal Style Grille",
    subtitle: "Gloss Black / Horizontal",
    price: 219,
    qty: 1,
  },
];

const REASONS = [
  "Doesn't fit my vehicle",
  "Arrived damaged",
  "Wrong item shipped",
  "Quality not as expected",
  "Changed my mind",
  "Other",
];

const STEPS = ["ITEMS", "REASON", "RESOLUTION", "LABEL"];

export function ReturnsFlow({ orderId }: { orderId: string }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [resolution, setResolution] = useState<"refund" | "exchange" | "credit">(
    "refund",
  );

  const toggle = (sku: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const refundAmount = ITEMS.filter((i) => selected.has(i.sku)).reduce(
    (s, l) => s + l.price * l.qty,
    0,
  );

  return (
    <main
      className="container-x"
      style={{ paddingTop: 48, paddingBottom: 64 }}
    >
      <Link
        href={`/account/orders/${orderId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--color-muted)",
          marginBottom: 12,
        }}
      >
        <Icons.chevLeft size={11} /> ORDER #{orderId}
      </Link>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        RETURNS · ORDER #{orderId}
      </div>
      <h1
        className="display-h3"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 44,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 0.95,
          marginBottom: 32,
        }}
      >
        START A
        <br />
        RETURN.
      </h1>

      {/* Stepper */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 32,
          overflowX: "auto",
        }}
      >
        {STEPS.map((s, i, arr) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 120,
              }}
            >
              <button
                type="button"
                onClick={() => done && setStep(i)}
                disabled={!done && !active}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "transparent",
                  border: 0,
                  cursor: done ? "pointer" : "default",
                  color: active
                    ? "var(--color-foreground)"
                    : done
                      ? "var(--color-success)"
                      : "var(--color-muted-2)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: done
                      ? "var(--color-success)"
                      : active
                        ? "var(--color-primary)"
                        : "transparent",
                    border:
                      !done && !active
                        ? "1px solid var(--color-border-2)"
                        : "0",
                    color:
                      done || active
                        ? "var(--color-background)"
                        : "var(--color-muted-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {done ? <Icons.check size={11} sw={3} /> : i + 1}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {s}
                </span>
              </button>
              {i < arr.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: done
                      ? "var(--color-success)"
                      : "var(--color-border)",
                    minWidth: 16,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-[1fr_360px]"
        style={{ gap: 32 }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 32,
          }}
        >
          {step === 0 && (
            <>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Pick what you&apos;re returning
              </h2>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                Within 30 days of delivery. Items must be unused and in
                original packaging.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ITEMS.map((it) => (
                  <label
                    key={it.sku}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: 16,
                      background: selected.has(it.sku)
                        ? "var(--color-surface-2)"
                        : "transparent",
                      border: `1px solid ${selected.has(it.sku) ? "var(--color-primary)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(it.sku)}
                      onChange={() => toggle(it.sku)}
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {it.title}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-muted)",
                          letterSpacing: "0.08em",
                          marginTop: 4,
                        }}
                      >
                        SKU {it.sku} · {it.subtitle}
                      </div>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      ${(it.price * it.qty).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => setStep(1)}
                  className="btn btn-primary btn-lg"
                >
                  CONTINUE →
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Tell us why
              </h2>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                Helps us improve fitment data and product copy.
              </p>
              {ITEMS.filter((i) => selected.has(i.sku)).map((it) => (
                <div
                  key={it.sku}
                  style={{
                    padding: 16,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
                    {it.title}
                  </div>
                  <select
                    className="select"
                    value={reasons[it.sku] ?? ""}
                    onChange={(e) =>
                      setReasons((r) => ({ ...r, [it.sku]: e.target.value }))
                    }
                  >
                    <option value="">Select a reason…</option>
                    {REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 24,
                }}
              >
                <button type="button" onClick={() => setStep(0)} className="btn">
                  ← BACK
                </button>
                <button
                  type="button"
                  disabled={Array.from(selected).some((s) => !reasons[s])}
                  onClick={() => setStep(2)}
                  className="btn btn-primary btn-lg"
                >
                  CONTINUE →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Pick a resolution
              </h2>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                Refunds hit your original card in 5–7 business days. Store credit
                applies instantly with a 10% bonus.
              </p>
              {(
                [
                  { id: "refund", title: "Refund to original payment", sub: `$${refundAmount.toFixed(2)} to your card` },
                  { id: "credit", title: "Store credit (+10% bonus)", sub: `$${(refundAmount * 1.1).toFixed(2)} usable today` },
                  { id: "exchange", title: "Exchange for a different size/variant", sub: "We'll send a label both ways" },
                ] as const
              ).map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: 16,
                    background:
                      resolution === r.id
                        ? "var(--color-surface-2)"
                        : "transparent",
                    border: `1px solid ${resolution === r.id ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={resolution === r.id}
                    onChange={() => setResolution(r.id)}
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--color-muted)",
                        marginTop: 2,
                      }}
                    >
                      {r.sub}
                    </div>
                  </div>
                </label>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 24,
                }}
              >
                <button type="button" onClick={() => setStep(1)} className="btn">
                  ← BACK
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-primary btn-lg"
                >
                  GENERATE RETURN LABEL →
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--color-success)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Icons.check size={28} sw={3} />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  marginBottom: 8,
                }}
              >
                Return started
              </h2>
              <p
                style={{
                  color: "var(--color-muted)",
                  marginBottom: 24,
                  maxWidth: 460,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                We&apos;ve emailed your prepaid FedEx label. Drop the package
                off within 14 days. We&apos;ll process the{" "}
                {resolution === "refund"
                  ? "refund"
                  : resolution === "credit"
                    ? "store credit"
                    : "exchange"}{" "}
                as soon as we receive it.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button type="button" className="btn btn-primary">
                  <Icons.external size={12} /> DOWNLOAD LABEL
                </button>
                <Link href={`/account/orders/${orderId}`} className="btn">
                  BACK TO ORDER
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            alignSelf: "start",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              FREE RETURNS
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-muted)",
                lineHeight: 1.6,
              }}
            >
              30-day window. Prepaid FedEx label. Refunds in 5–7 business days
              after we receive your return.
            </p>
          </div>
          <div
            style={{
              height: 1,
              background: "var(--color-border)",
            }}
          />
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              NEED HELP?
            </div>
            <a
              href="tel:18883784536"
              style={{
                fontSize: 13,
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              1-888-378-4536
            </a>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-muted)",
                marginTop: 4,
              }}
            >
              Mon–Fri 9–5 PST
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
