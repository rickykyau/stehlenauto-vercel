import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCustomerDetail } from "@/lib/admin/customers";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(
      owner.reason === "unauthenticated"
        ? "/sign-in?redirect_url=/admin/customers"
        : "/",
    );
  }
  const { id } = await params;
  const gid = `gid://shopify/Customer/${id}`;
  const customer = await getCustomerDetail(gid);
  if (!customer) notFound();

  const addr = customer.defaultAddress;

  return (
    <div>
      <Link
        href="/admin/customers"
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "var(--color-muted)",
          marginBottom: 12,
          display: "inline-block",
        }}
      >
        ← ALL CUSTOMERS
      </Link>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {customer.displayName || "(no name)"}
      </h2>
      <p style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 24 }}>
        Joined{" "}
        {new Date(customer.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 12, marginBottom: 24 }}
      >
        <Stat
          label="Lifetime spend"
          value={`$${parseFloat(customer.totalSpent).toFixed(2)}`}
        />
        <Stat label="Orders" value={String(customer.ordersCount)} />
        <Stat
          label="Avg order"
          value={
            customer.ordersCount > 0
              ? `$${(parseFloat(customer.totalSpent) / customer.ordersCount).toFixed(2)}`
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, marginBottom: 24 }}>
        <Panel title="Contact">
          <Row label="Email" value={customer.email ?? "—"} />
          <Row label="Phone" value={customer.phone ?? "—"} />
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="btn btn-sm"
              style={{ marginTop: 12, display: "inline-block" }}
            >
              EMAIL CUSTOMER
            </a>
          )}
        </Panel>
        <Panel title="Default address">
          {addr ? (
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              {addr.address1 && <div>{addr.address1}</div>}
              {addr.address2 && <div>{addr.address2}</div>}
              <div>
                {[addr.city, addr.province, addr.zip].filter(Boolean).join(", ")}
              </div>
              {addr.country && <div>{addr.country}</div>}
            </div>
          ) : (
            <span style={{ color: "var(--color-muted)", fontSize: 13 }}>
              No address on file
            </span>
          )}
        </Panel>
      </div>

      {customer.tags.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--color-muted)",
              marginBottom: 8,
            }}
          >
            TAGS
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {customer.tags.map((t) => (
              <span
                key={t}
                className="mono"
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {customer.note && (
        <Panel title="Internal note" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
            {customer.note}
          </div>
        </Panel>
      )}

      <h3
        className="mono"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        Recent orders ({customer.recentOrders.length})
      </h3>
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
            minWidth: 600,
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
              <Th>TOTAL</Th>
              <Th>FINANCIAL</Th>
              <Th>FULFILLMENT</Th>
            </tr>
          </thead>
          <tbody>
            {customer.recentOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "var(--color-muted)",
                  }}
                >
                  No orders yet.
                </td>
              </tr>
            ) : (
              customer.recentOrders.map((o) => (
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
                    <span className="mono">
                      ${parseFloat(o.totalPrice).toFixed(2)}
                    </span>
                  </Td>
                  <Td>
                    <Chip status={o.financialStatus} />
                  </Td>
                  <Td>
                    <Chip status={o.fulfillmentStatus} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
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
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        ...style,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--color-muted)",
          marginBottom: 10,
        }}
      >
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: "var(--color-muted)", minWidth: 60 }}>{label}</span>
      <span>{value}</span>
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
function Chip({ status }: { status: string | null }) {
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
