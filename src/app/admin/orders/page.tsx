import Link from "next/link";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/admin/orders";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["any", "open", "closed", "cancelled"] as const;
type StatusOpt = (typeof STATUS_OPTIONS)[number];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    after?: string;
    before?: string;
  }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(owner.reason === "unauthenticated" ? "/sign-in?redirect_url=/admin/orders" : "/");
  }
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;
  const status: StatusOpt = STATUS_OPTIONS.includes(sp.status as StatusOpt)
    ? (sp.status as StatusOpt)
    : "any";

  let result;
  let liveError: string | null = null;
  try {
    result = await listOrders({
      search,
      status,
      cursor: sp.after ?? sp.before ?? null,
      direction: sp.before ? "prev" : "next",
      pageSize: 25,
    });
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  return (
    <div>
      <form
        method="get"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by order # or email"
          className="input"
          style={{ flex: 1, minWidth: 220 }}
        />
        <select name="status" defaultValue={status} className="select">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          SEARCH
        </button>
      </form>
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
              {result.orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--color-muted)",
                    }}
                  >
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                result.orders.map((o) => (
                  <tr
                    key={o.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
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
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-muted)",
                          }}
                        >
                          {o.customerEmail}
                        </div>
                      )}
                    </Td>
                    <Td>{o.itemCount}</Td>
                    <Td>
                      <span className="mono">
                        ${parseFloat(o.totalPrice).toFixed(2)}
                      </span>
                    </Td>
                    <Td>
                      <StatusChip status={o.financialStatus} />
                    </Td>
                    <Td>
                      <StatusChip status={o.fulfillmentStatus} />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            gap: 8,
          }}
        >
          <Link
            href={
              result.pageInfo.hasPreviousPage
                ? `/admin/orders?before=${encodeURIComponent(result.pageInfo.startCursor ?? "")}${search ? `&q=${encodeURIComponent(search)}` : ""}${status !== "any" ? `&status=${status}` : ""}`
                : "#"
            }
            className="btn btn-sm"
            style={{
              opacity: result.pageInfo.hasPreviousPage ? 1 : 0.4,
              pointerEvents: result.pageInfo.hasPreviousPage ? "auto" : "none",
            }}
          >
            ← PREVIOUS
          </Link>
          <Link
            href={
              result.pageInfo.hasNextPage
                ? `/admin/orders?after=${encodeURIComponent(result.pageInfo.endCursor ?? "")}${search ? `&q=${encodeURIComponent(search)}` : ""}${status !== "any" ? `&status=${status}` : ""}`
                : "#"
            }
            className="btn btn-sm"
            style={{
              opacity: result.pageInfo.hasNextPage ? 1 : 0.4,
              pointerEvents: result.pageInfo.hasNextPage ? "auto" : "none",
            }}
          >
            NEXT →
          </Link>
        </div>
      )}
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
    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>{children}</td>
  );
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
