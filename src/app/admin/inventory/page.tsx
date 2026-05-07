import Link from "next/link";
import { redirect } from "next/navigation";
import { listLowStock } from "@/lib/admin/inventory";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ threshold?: string }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(
      owner.reason === "unauthenticated"
        ? "/sign-in?redirect_url=/admin/inventory"
        : "/",
    );
  }
  const sp = await searchParams;
  const threshold = (() => {
    const n = parseInt(sp.threshold ?? "5", 10);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 5;
  })();

  let result;
  let liveError: string | null = null;
  try {
    result = await listLowStock({ threshold, maxItems: 200 });
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  const outCount = result?.items.filter((i) => i.status === "OUT").length ?? 0;
  const lowCount = result?.items.filter((i) => i.status === "LOW").length ?? 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{ color: "var(--color-muted)", fontSize: 13, maxWidth: 580 }}>
          Active variants at or below the threshold, sorted lowest first.
          Untracked inventory is excluded. Click a SKU to open the product.
        </p>
        <form method="get" style={{ display: "flex", gap: 8 }}>
          <label
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--color-muted)",
              alignSelf: "center",
            }}
          >
            THRESHOLD
          </label>
          <input
            name="threshold"
            type="number"
            min={0}
            max={100}
            defaultValue={threshold}
            className="input"
            style={{ width: 80 }}
          />
          <button type="submit" className="btn btn-sm">
            APPLY
          </button>
        </form>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 12, marginBottom: 18 }}
      >
        <Stat
          label="Out of stock"
          value={String(outCount)}
          tone="bad"
        />
        <Stat
          label={`Low (≤ ${threshold})`}
          value={String(lowCount)}
          tone="warn"
        />
        <Stat
          label="Total scanned"
          value={result ? String(result.totalScanned) : "—"}
          tone="muted"
        />
      </div>

      {liveError && (
        <div
          style={{
            padding: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <strong>Shopify Admin error:</strong> {liveError}
        </div>
      )}

      {result?.truncated && (
        <div
          style={{
            padding: 10,
            background: "rgba(245,168,35,0.08)",
            border: "1px solid rgba(245,168,35,0.4)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 14,
            fontSize: 12,
          }}
        >
          Showing the first 200 hits. Bring the threshold lower to refine.
        </div>
      )}

      {result && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 720,
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid var(--color-border)",
                }}
                className="mono"
              >
                <Th>STATUS</Th>
                <Th>QTY</Th>
                <Th>PRODUCT</Th>
                <Th>VARIANT</Th>
                <Th>SKU</Th>
                <Th>PRICE</Th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--color-success)",
                    }}
                  >
                    Nothing below threshold {threshold}. Inventory is healthy.
                  </td>
                </tr>
              ) : (
                result.items.map((i) => (
                  <tr
                    key={i.variantId}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td>
                      <StatusChip status={i.status} />
                    </Td>
                    <Td>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color:
                            i.status === "OUT"
                              ? "var(--color-destructive)"
                              : "var(--color-primary)",
                        }}
                      >
                        {i.quantity}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {i.imageUrl && (
                          <img
                            src={i.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--color-surface-2)",
                            }}
                          />
                        )}
                        <Link
                          href={`/products/${i.productHandle}`}
                          target="_blank"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {i.productTitle}
                        </Link>
                      </div>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                        {i.variantTitle === "Default Title" ? "—" : i.variantTitle}
                      </span>
                    </Td>
                    <Td>
                      <span className="mono" style={{ fontSize: 11 }}>
                        {i.sku ?? "—"}
                      </span>
                    </Td>
                    <Td>
                      <span className="mono">${parseFloat(i.price).toFixed(2)}</span>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
  return (
    <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>{children}</td>
  );
}
function StatusChip({ status }: { status: "OUT" | "LOW" }) {
  const color =
    status === "OUT" ? "var(--color-destructive)" : "var(--color-primary)";
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
