import Link from "next/link";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/admin/orders";
import { requireOwner } from "@/lib/admin/guard";
import { OrdersTable } from "./orders-table";

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
        style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}
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
      {result && <OrdersTable orders={result.orders} />}
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
