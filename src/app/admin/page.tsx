import Link from "next/link";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/admin/orders";
import { listDiscounts } from "@/lib/admin/discounts";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const owner = await requireOwner();
  if (!owner.allowed) {
    if (owner.reason === "unauthenticated") {
      redirect("/sign-in?redirect_url=/admin");
    }
    redirect("/");
  }
  let recentOrdersCount = 0;
  let totalRefundable = 0;
  let activeDiscounts = 0;
  let liveError: string | null = null;
  try {
    const [ordersRes, discountsRes] = await Promise.all([
      listOrders({ pageSize: 25, status: "any" }),
      listDiscounts({ pageSize: 25 }),
    ]);
    recentOrdersCount = ordersRes.orders.length;
    totalRefundable = ordersRes.orders.reduce(
      (sum, o) => sum + parseFloat(o.totalPrice),
      0,
    );
    activeDiscounts = discountsRes.discounts.filter(
      (d) => d.status === "ACTIVE",
    ).length;
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  return (
    <div>
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
          <strong>Shopify Admin connection issue:</strong> {liveError}
        </div>
      )}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 12, marginBottom: 32 }}
      >
        <Tile label="Recent orders (last 25)" value={recentOrdersCount.toString()} />
        <Tile
          label="Recent revenue (last 25)"
          value={`$${totalRefundable.toFixed(2)}`}
        />
        <Tile label="Active promo codes" value={activeDiscounts.toString()} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
        <ActionCard
          href="/admin/orders"
          title="Review orders"
          body="Search, paginate, and process refunds from a single panel."
        />
        <ActionCard
          href="/admin/discounts"
          title="Promo codes"
          body="Create code or automatic discounts — percentage off, fixed amount, or free shipping."
        />
        <ActionCard
          href="/admin/sourcing-gaps"
          title="Sourcing gaps"
          body="Catalog fitment data that's missing — flag for the merch team."
        />
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        padding: 18,
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--color-muted)",
          marginBottom: 8,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        padding: 18,
        borderRadius: "var(--radius-md)",
        display: "block",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.5 }}>
        {body}
      </div>
    </Link>
  );
}
