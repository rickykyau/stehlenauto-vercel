"use client";

import { useState } from "react";
import Link from "next/link";

export type OrderRow = {
  id: string; // gid
  legacyId: string;
  name: string;
  createdAt: string;
  customerName: string;
  customerEmail: string | null;
  itemCount: number;
  totalPrice: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
};

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));

  async function exportSelected() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/order/cb-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error || `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const fname = /filename="([^"]+)"/.exec(cd)?.[1] || "cb-import.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Selection toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
          marginBottom: 10,
        }}
      >
        <button
          className="btn btn-primary"
          disabled={selected.size === 0 || busy}
          onClick={exportSelected}
          style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
        >
          {busy ? "Generating…" : `↓ Export CB import (${selected.size})`}
        </button>
        {selected.size > 0 && (
          <button className="btn btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        )}
        {err && <span style={{ color: "var(--color-destructive)", fontSize: 13 }}>{err}</span>}
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }} className="mono">
              <Th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </Th>
              <Th>ORDER</Th>
              <Th>DATE</Th>
              <Th>CUSTOMER</Th>
              <Th>ITEMS</Th>
              <Th>TOTAL</Th>
              <Th>FINANCIAL</Th>
              <Th>FULFILLMENT</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--color-muted)" }}>
                  No orders match your filters.
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const checked = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: checked ? "rgba(245,168,35,0.06)" : undefined,
                    }}
                  >
                    <Td>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(o.id)}
                        aria-label={`Select ${o.name}`}
                      />
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/orders/${encodeURIComponent(o.legacyId)}`}
                        style={{ color: "var(--color-primary)", fontWeight: 600 }}
                      >
                        {o.name}
                      </Link>
                    </Td>
                    <Td>
                      {new Date(o.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Td>
                    <Td>
                      <div>{o.customerName}</div>
                      {o.customerEmail && (
                        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{o.customerEmail}</div>
                      )}
                    </Td>
                    <Td>{o.itemCount}</Td>
                    <Td>
                      <span className="mono">${parseFloat(o.totalPrice).toFixed(2)}</span>
                    </Td>
                    <Td>
                      <StatusChip status={o.financialStatus} />
                    </Td>
                    <Td>
                      <StatusChip status={o.fulfillmentStatus} />
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "10px 14px",
        fontSize: 10,
        letterSpacing: "0.12em",
        color: "var(--color-muted)",
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 14px", verticalAlign: "top" }}>{children}</td>;
}
function StatusChip({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: "var(--color-muted)" }}>—</span>;
  const lc = status.toLowerCase();
  const ok = /paid|fulfilled/.test(lc);
  const warn = /pending|partially/.test(lc);
  const bad = /refunded|voided|cancel|unfulfilled/.test(lc);
  const color = ok
    ? "var(--color-success)"
    : warn
      ? "var(--color-primary)"
      : bad
        ? "var(--color-destructive)"
        : "var(--color-muted)";
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.06em",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${color}`,
        color,
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}
