import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrderDetail, ORDER_TAG_PRESETS } from "@/lib/admin/orders";
import { requireOwner } from "@/lib/admin/guard";
import { RefundForm } from "./refund-form";
import { TagEditor } from "./tag-editor";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(owner.reason === "unauthenticated" ? "/sign-in?redirect_url=/admin/orders" : "/");
  }
  const { id } = await params;
  const orderGid = `gid://shopify/Order/${id}`;
  const order = await getOrderDetail(orderGid);
  if (!order) notFound();

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "var(--color-muted)",
          marginBottom: 12,
          display: "inline-block",
        }}
      >
        ← ALL ORDERS
      </Link>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            textTransform: "uppercase",
          }}
        >
          {order.name}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href={`/api/admin/order/cb-import?id=${id}`}
            className="btn btn-primary"
            style={{ fontSize: 13 }}
          >
            ↓ CB import (.xlsx)
          </a>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-muted)" }}>
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 16, marginBottom: 24 }}
      >
        <Card label="Total">
          <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
            ${parseFloat(order.totalPrice).toFixed(2)}
          </span>
          <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
            {order.currency}
          </div>
        </Card>
        <Card label="Refunded">
          <span
            className="mono"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: parseFloat(order.totalRefunded) > 0 ? "var(--color-destructive)" : undefined,
            }}
          >
            ${parseFloat(order.totalRefunded).toFixed(2)}
          </span>
          <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
            Available to refund: ${order.refundableAmount}
          </div>
        </Card>
        <Card label="Status">
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div>
              <strong>Financial:</strong> {order.financialStatus ?? "—"}
            </div>
            <div>
              <strong>Fulfillment:</strong> {order.fulfillmentStatus ?? "—"}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px]" style={{ gap: 16, marginBottom: 24 }}>
        <Card label="Customer">
          {order.customer ? (
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              <strong>
                {[order.customer.firstName, order.customer.lastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </strong>
              <div>{order.customer.email ?? "no email"}</div>
              {order.customer.phone && <div>{order.customer.phone}</div>}
            </div>
          ) : (
            <div style={{ color: "var(--color-muted)" }}>Guest checkout</div>
          )}
        </Card>
        <Card label="Ship to">
          {order.shippingAddress ? (
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              {order.shippingAddress.address1}
              {order.shippingAddress.address2 && (
                <>
                  <br />
                  {order.shippingAddress.address2}
                </>
              )}
              <br />
              {[
                order.shippingAddress.city,
                order.shippingAddress.province,
                order.shippingAddress.zip,
              ]
                .filter(Boolean)
                .join(", ")}
              <br />
              {order.shippingAddress.country}
            </div>
          ) : (
            <div style={{ color: "var(--color-muted)" }}>No address</div>
          )}
        </Card>
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 24,
          padding: 16,
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
          TAGS
        </div>
        <TagEditor
          orderGid={order.id}
          initial={order.tags}
          presets={ORDER_TAG_PRESETS}
        />
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 24,
        }}
      >
        <div
          className="mono"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            fontSize: 11,
            letterSpacing: "0.12em",
            fontWeight: 600,
          }}
        >
          LINE ITEMS
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <Th>Item</Th>
              <Th>SKU</Th>
              <Th>Qty</Th>
              <Th>Refunded</Th>
              <Th>Total</Th>
            </tr>
          </thead>
          <tbody>
            {order.lineItems.map((li) => (
              <tr
                key={li.id}
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <Td>{li.title}</Td>
                <Td>
                  <span className="mono">{li.sku ?? "—"}</span>
                </Td>
                <Td>{li.quantity}</Td>
                <Td>{li.refundedQuantity}</Td>
                <Td>
                  <span className="mono">
                    ${parseFloat(li.totalPrice).toFixed(2)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RefundForm
        orderGid={order.id}
        currency={order.currency}
        refundableAmount={order.refundableAmount}
        lineItems={order.lineItems.map((li) => ({
          id: li.id,
          title: li.title,
          quantity: li.quantity,
          refundableQuantity: li.quantity - li.refundedQuantity,
          unitPrice: li.unitPrice,
        }))}
      />

      {order.refunds.length > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            marginTop: 24,
          }}
        >
          <div
            className="mono"
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
              fontSize: 11,
              letterSpacing: "0.12em",
              fontWeight: 600,
            }}
          >
            REFUND HISTORY
          </div>
          {order.refunds.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 13,
              }}
            >
              <div>
                <span className="mono">
                  ${parseFloat(r.totalRefunded).toFixed(2)}
                </span>
                {r.note && (
                  <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>
                    — {r.note}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        padding: 16,
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
      {children}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="mono"
      style={{
        padding: "10px 14px",
        fontSize: 10,
        letterSpacing: "0.12em",
        color: "var(--color-muted)",
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 14px" }}>{children}</td>;
}
