"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { InventoryRow } from "@/lib/admin/inventory";

type StatusFilter = "all" | "out" | "low" | "in";
type SortKey = "qty" | "title" | "sku" | "price" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [25, 50, 100];

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [threshold, setThreshold] = useState(50);
  const [sortKey, setSortKey] = useState<SortKey>("qty");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // headline counts over the FULL set (independent of search/page)
  const counts = useMemo(() => {
    let out = 0;
    let low = 0;
    for (const r of rows) {
      if (r.quantity <= 0) out++;
      else if (r.quantity <= threshold) low++;
    }
    return { out, low, total: rows.length };
  }, [rows, threshold]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (status === "out" && r.quantity > 0) return false;
      if (status === "low" && !(r.quantity > 0 && r.quantity <= threshold))
        return false;
      if (status === "in" && r.quantity <= threshold) return false;
      if (q) {
        const hay = `${r.productTitle} ${r.cbItemName ?? ""} ${r.variantSku ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "qty":
          return (a.quantity - b.quantity) * dir;
        case "price":
          return (parseFloat(a.price) - parseFloat(b.price)) * dir;
        case "title":
          return a.productTitle.localeCompare(b.productTitle) * dir;
        case "sku":
          return (a.cbItemName ?? "").localeCompare(b.cbItemName ?? "") * dir;
        case "status": {
          // OUT (0) before LOW before IN
          const rank = (n: number) => (n <= 0 ? 0 : n <= threshold ? 1 : 2);
          return (rank(a.quantity) - rank(b.quantity)) * dir;
        }
        default:
          return 0;
      }
    });
    return list;
  }, [rows, search, status, threshold, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  // any state change that shrinks the result set should snap back to page 0
  const resetPage = () => setPage(0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" || key === "sku" ? "asc" : "asc");
    }
    resetPage();
  }

  const statusOf = (n: number): "OUT" | "LOW" | "IN" =>
    n <= 0 ? "OUT" : n <= threshold ? "LOW" : "IN";

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12, marginBottom: 18 }}>
        <Stat label="Out of stock" value={String(counts.out)} tone="bad" />
        <Stat label={`Low (1–${threshold})`} value={String(counts.low)} tone="warn" />
        <Stat label="Active items" value={String(counts.total)} tone="muted" />
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          placeholder="Search product or CB item name…"
          className="input"
          style={{ flex: "1 1 280px", minWidth: 220, height: 40 }}
          aria-label="Search inventory"
        />
        <div style={{ display: "inline-flex", gap: 4 }}>
          {(
            [
              ["all", "ALL"],
              ["out", "OUT"],
              ["low", "LOW"],
              ["in", "IN STOCK"],
            ] as [StatusFilter, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setStatus(val);
                resetPage();
              }}
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.06em",
                padding: "0 12px",
                height: 40,
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background:
                  status === val ? "var(--color-primary)" : "transparent",
                color: status === val ? "#0a0a0a" : "var(--color-muted)",
                fontWeight: status === val ? 700 : 500,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "var(--color-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          LOW ≤
          <input
            type="number"
            min={1}
            max={999}
            value={threshold}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setThreshold(Number.isFinite(n) && n > 0 ? n : 1);
              resetPage();
            }}
            className="input"
            style={{ width: 72, height: 40 }}
          />
        </label>
      </div>

      {/* Result meta */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>
          {filtered.length} RESULT{filtered.length === 1 ? "" : "S"}
          {search || status !== "all" ? " (filtered)" : ""}
        </span>
        <label
          className="mono"
          style={{ fontSize: 11, color: "var(--color-muted)", display: "inline-flex", gap: 6, alignItems: "center" }}
        >
          PER PAGE
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              resetPage();
            }}
            className="input"
            style={{ height: 32, padding: "0 6px" }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
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
            <tr
              style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}
              className="mono"
            >
              <SortableTh label="STATUS" col="status" {...{ sortKey, sortDir, toggleSort }} />
              <SortableTh label="QTY" col="qty" {...{ sortKey, sortDir, toggleSort }} />
              <SortableTh label="PRODUCT" col="title" {...{ sortKey, sortDir, toggleSort }} />
              <SortableTh label="SKU (CB ITEM NAME)" col="sku" {...{ sortKey, sortDir, toggleSort }} />
              <SortableTh label="PRICE" col="price" {...{ sortKey, sortDir, toggleSort }} />
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--color-muted)" }}>
                  No items match.
                </td>
              </tr>
            ) : (
              slice.map((r) => {
                const st = statusOf(r.quantity);
                return (
                  <tr key={r.productId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <Td>
                      <StatusChip status={st} />
                    </Td>
                    <Td>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color:
                            st === "OUT"
                              ? "var(--color-destructive)"
                              : st === "LOW"
                                ? "var(--color-primary)"
                                : "var(--color-foreground)",
                        }}
                      >
                        {r.quantity}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {r.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--color-surface-2)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <Link
                          href={`/products/${r.productHandle}`}
                          target="_blank"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {r.productTitle}
                        </Link>
                      </div>
                    </Td>
                    <Td>
                      <Link
                        href={`/products/${r.productHandle}`}
                        target="_blank"
                        className="mono"
                        style={{ fontSize: 11, color: "var(--color-primary)" }}
                      >
                        {r.cbItemName ?? r.variantSku ?? "—"}
                      </Link>
                    </Td>
                    <Td>
                      <span className="mono">${parseFloat(r.price).toFixed(2)}</span>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
          }}
        >
          <button
            type="button"
            className="btn btn-sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{ opacity: safePage === 0 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span className="mono" style={{ fontSize: 12, color: "var(--color-muted)" }}>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            style={{ opacity: safePage >= pageCount - 1 ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function SortableTh({
  label,
  col,
  sortKey,
  sortDir,
  toggleSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  toggleSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => toggleSort(col)}
      style={{
        padding: "10px 14px",
        fontSize: 10,
        letterSpacing: "0.12em",
        color: active ? "var(--color-primary)" : "var(--color-muted)",
        fontWeight: 600,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label} {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>{children}</td>;
}

function StatusChip({ status }: { status: "OUT" | "LOW" | "IN" }) {
  const color =
    status === "OUT"
      ? "var(--color-destructive)"
      : status === "LOW"
        ? "var(--color-primary)"
        : "var(--color-success)";
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
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "bad" | "warn" | "muted";
}) {
  const color =
    tone === "bad"
      ? "var(--color-destructive)"
      : tone === "warn"
        ? "var(--color-primary)"
        : "var(--color-muted)";
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 14,
      }}
    >
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
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
