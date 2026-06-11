import Link from "next/link";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/admin/orders";
import { listDiscounts } from "@/lib/admin/discounts";
import {
  fetchTodaySnapshot,
  fetchFunnelTrend,
  type FunnelWeek,
  type FunnelSource,
} from "@/lib/admin/ga4";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const fmtUSD = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

export default async function AdminDashboardPage() {
  const owner = await requireOwner();
  if (!owner.allowed) {
    if (owner.reason === "unauthenticated") {
      redirect("/sign-in?redirect_url=/admin");
    }
    redirect("/");
  }
  let recentOrdersCount = 0;
  let totalRevenue = 0;
  let activeDiscounts = 0;
  let liveError: string | null = null;
  try {
    const [ordersRes, discountsRes] = await Promise.all([
      listOrders({ pageSize: 25, status: "any" }),
      listDiscounts({ pageSize: 25 }),
    ]);
    recentOrdersCount = ordersRes.orders.length;
    totalRevenue = ordersRes.orders.reduce(
      (sum, o) => sum + parseFloat(o.totalPrice),
      0,
    );
    activeDiscounts = discountsRes.discounts.filter(
      (d) => d.status === "ACTIVE",
    ).length;
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  const [ga, funnel] = await Promise.all([
    fetchTodaySnapshot(),
    fetchFunnelTrend(4),
  ]);

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

      {/* GA4 today panel */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <h2
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Today on Stehlen
          </h2>
          <span
            style={{ fontSize: 11, color: "var(--color-muted)" }}
          >
            via GA4 ·{" "}
            {"range" in ga
              ? new Date().toLocaleString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>

        {ga.configured === false ? (
          <Ga4SetupCard reason={ga.reason} />
        ) : "error" in ga ? (
          <div
            style={{
              padding: 12,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
            }}
          >
            <strong>GA4 error:</strong> {ga.error}
          </div>
        ) : (
          <Ga4Panel snapshot={ga} />
        )}
      </section>

      {/* Funnel trend panel — cross-source user funnel, 4-week trend */}
      {funnel.configured && !("error" in funnel) && funnel.weeks.length > 0 && (
        <FunnelTrendPanel weeks={funnel.weeks} bySource={funnel.bySource} />
      )}

      {/* Shopify ops tiles */}
      <h2
        className="mono"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Shopify (last 25 orders)
      </h2>
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 12, marginBottom: 32 }}
      >
        <Tile label="Recent orders" value={recentOrdersCount.toString()} />
        <Tile label="Recent revenue" value={fmtUSD(totalRevenue)} />
        <Tile label="Active promo codes" value={activeDiscounts.toString()} />
      </div>

      {/* Action cards */}
      <h2
        className="mono"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Operations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 12 }}>
        <ActionCard
          href="/admin/orders"
          title="Review orders"
          body="Search, paginate, and process refunds from a single panel."
        />
        <ActionCard
          href="/admin/customers"
          title="Customers"
          body="Look up by email, see lifetime value and orders for support calls."
        />
        <ActionCard
          href="/admin/abandoned-carts"
          title="Abandoned carts"
          body="Recover open checkouts with a one-click email link."
        />
        <ActionCard
          href="/admin/inventory"
          title="Low stock"
          value="alerts"
          body="Active variants at or below your stock threshold, sorted lowest first."
        />
        <ActionCard
          href="/admin/discounts"
          title="Promo codes"
          body="Presets, bulk single-use codes, copy/delete from the list."
        />
        <ActionCard
          href="/admin/sourcing-gaps"
          title="Sourcing gaps"
          body="Catalog fitment data that's missing — flag for the merch team."
        />
        <ActionCard
          href="/admin/notifications"
          title="Order alerts"
          body="Manage staff who get an email the moment a new order comes in."
        />
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 14,
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          fontSize: 12,
          color: "var(--color-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong>Daily summary email</strong> ships at 7am ET to{" "}
          <code>ADMIN_OWNER_EMAILS</code>. Send a test now:
        </div>
        <a
          href="/api/admin/cron/daily-summary"
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm"
        >
          SEND NOW →
        </a>
      </div>
    </div>
  );
}

function Ga4Panel({
  snapshot,
}: {
  snapshot: Extract<
    Awaited<ReturnType<typeof fetchTodaySnapshot>>,
    { configured: true; range: { start: string } }
  >;
}) {
  const { events } = snapshot;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Top row — visitors + revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12 }}>
        <Tile
          label="Visitors today"
          value={fmtInt(snapshot.activeUsers || snapshot.users)}
          sub={`${fmtInt(snapshot.sessions)} sessions`}
          highlight
        />
        <Tile
          label="Page views"
          value={fmtInt(snapshot.pageViews || events.page_view)}
          sub={`${fmtPct(snapshot.engagementRate)} engaged`}
        />
        <Tile
          label="Revenue today"
          value={fmtUSD(snapshot.revenue)}
          sub={`${fmtInt(snapshot.transactions)} orders`}
          highlight
        />
        <Tile
          label="Conversion rate"
          value={fmtPct(snapshot.conversionRate)}
          sub={`${fmtInt(snapshot.transactions)} of ${fmtInt(snapshot.sessions)}`}
        />
      </div>

      {/* Funnel events */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: 18,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--color-muted)",
            marginBottom: 12,
          }}
        >
          INTERACTIONS TODAY
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
          style={{ gap: 12 }}
        >
          <Funnel label="Item views" count={events.view_item} />
          <Funnel label="Searches" count={events.search} />
          <Funnel label="Vehicle picks" count={events.select_vehicle} />
          <Funnel label="Add to cart" count={events.add_to_cart} />
          <Funnel label="Checkouts started" count={events.begin_checkout} />
          <Funnel label="Purchases" count={events.purchase} />
          <Funnel
            label="Sign-ups + logins"
            count={events.sign_up + events.login}
            sub={`${events.sign_up} new`}
          />
        </div>
      </div>

      {/* Top products + sources */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        <ListPanel title="Top products" empty="No purchases yet today">
          {snapshot.topProducts.map((p) => (
            <div
              key={p.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                padding: "6px 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginRight: 8,
                }}
              >
                {p.name}
              </span>
              <span className="mono" style={{ flexShrink: 0 }}>
                {fmtUSD(p.revenue)}
              </span>
            </div>
          ))}
        </ListPanel>
        <ListPanel title="Top traffic sources" empty="No traffic yet today">
          {snapshot.topSources.map((s) => (
            <div
              key={s.source}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                padding: "6px 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span>{s.source}</span>
              <span className="mono">{fmtInt(s.sessions)}</span>
            </div>
          ))}
        </ListPanel>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: highlight
          ? "1px solid rgba(245,168,35,0.5)"
          : "1px solid var(--color-border)",
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
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: highlight ? "var(--color-primary)" : "var(--color-foreground)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-muted)",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Funnel({
  label,
  count,
  sub,
}: {
  label: string;
  count: number;
  sub?: string;
}) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--color-muted)",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{fmtInt(count)}</div>
      {sub && (
        <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{sub}</div>
      )}
    </div>
  );
}

function ListPanel({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty: string;
}) {
  const empty_ = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 18,
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
      {empty_ ? (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-muted)",
            padding: "8px 0",
          }}
        >
          {empty}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function FunnelTrendPanel({
  weeks,
  bySource,
}: {
  weeks: FunnelWeek[];
  bySource: FunnelSource[];
}) {
  const steps: { label: string; key: keyof FunnelWeek }[] = [
    { label: "Visited", key: "visited" },
    { label: "Viewed product", key: "viewed" },
    { label: "Added to cart", key: "cart" },
    { label: "Began checkout", key: "checkout" },
    { label: "Purchased", key: "purchase" },
  ];
  const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");
  const cell: React.CSSProperties = {
    padding: "6px 10px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };
  const head: React.CSSProperties = {
    ...cell,
    fontSize: 11,
    color: "var(--color-muted)",
    fontWeight: 600,
  };
  const arrow = (cur: number, prev: number | null) => {
    if (prev === null) return null;
    if (cur > prev) return <span style={{ color: "#22c55e" }}> ▲</span>;
    if (cur < prev) return <span style={{ color: "#ef4444" }}> ▼</span>;
    return <span style={{ color: "var(--color-muted)" }}> ▬</span>;
  };

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12 }}>
        <h2
          className="mono"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          Funnel trend · last 4 weeks
        </h2>
        <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
          Distinct users per step (deduped, not event firings). Newest week on
          the right · ▲▼ vs prior week.
        </p>
      </div>

      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
          overflowX: "auto",
          marginBottom: 16,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ ...head, textAlign: "left" }}>Step</th>
              {weeks.map((w) => (
                <th key={w.label} style={head}>{w.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.key} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "6px 10px", fontWeight: 600 }}>{s.label}</td>
                {weeks.map((w, i) => {
                  const cur = w[s.key] as number;
                  const prev = i > 0 ? (weeks[i - 1][s.key] as number) : null;
                  return (
                    <td key={w.label} style={cell}>
                      {fmtInt(cur)}
                      {arrow(cur, prev)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* conversion + engagement rows */}
            <tr style={{ background: "var(--color-surface-2)" }}>
              <td style={{ padding: "6px 10px", fontSize: 12, color: "var(--color-muted)" }}>
                view→cart
              </td>
              {weeks.map((w) => (
                <td key={w.label} style={{ ...cell, fontSize: 12, color: "var(--color-muted)" }}>
                  {pct(w.cart, w.viewed)}
                </td>
              ))}
            </tr>
            <tr style={{ background: "var(--color-surface-2)" }}>
              <td style={{ padding: "6px 10px", fontSize: 12, color: "var(--color-muted)" }}>
                engagement
              </td>
              {weeks.map((w) => (
                <td key={w.label} style={{ ...cell, fontSize: 12, color: "var(--color-muted)" }}>
                  {pct(w.engaged, w.sessions)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {bySource.length > 0 && (
        <>
          <h3
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-muted)",
              marginBottom: 8,
            }}
          >
            This week by source ({weeks[weeks.length - 1].label})
          </h3>
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ ...head, textAlign: "left" }}>Channel</th>
                  <th style={head}>Users</th>
                  <th style={head}>Eng%</th>
                  <th style={head}>Viewed</th>
                  <th style={head}>Cart</th>
                  <th style={head}>Checkout</th>
                  <th style={head}>Buy</th>
                </tr>
              </thead>
              <tbody>
                {bySource.map((s) => (
                  <tr key={s.channel} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "6px 10px", fontWeight: 600 }}>{s.channel}</td>
                    <td style={cell}>{fmtInt(s.users)}</td>
                    <td style={cell}>{(s.engRate * 100).toFixed(0)}%</td>
                    <td style={cell}>{fmtInt(s.viewed)}</td>
                    <td style={cell}>{fmtInt(s.cart)}</td>
                    <td style={cell}>{fmtInt(s.checkout)}</td>
                    <td style={cell}>{fmtInt(s.buy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Ga4SetupCard({ reason }: { reason: string }) {
  return (
    <div
      style={{
        padding: 18,
        background: "var(--color-surface)",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            padding: "2px 8px",
            border: "1px solid var(--color-primary)",
            color: "var(--color-primary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          NOT CONFIGURED
        </span>
        <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
          {reason}
        </span>
      </div>
      <p style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
        Show today&apos;s visitors, sessions, conversions, and revenue here. Add
        these Vercel env vars to unlock it (reuses the existing GA4 OAuth creds —
        no Google Cloud service account needed):
      </p>
      <ol style={{ fontSize: 13, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>
          <code>GA4_PROPERTY_ID</code> — numeric property id (Admin → Property
          Settings). Currently <code>529120634</code>.
        </li>
        <li>
          <code>GA4_OAUTH_CLIENT_ID</code>,{" "}
          <code>GA4_OAUTH_CLIENT_SECRET</code>,{" "}
          <code>GA4_OAUTH_REFRESH_TOKEN</code> — from the project&apos;s{" "}
          <code>token.json</code> (the same creds the marketing analytics
          scripts use).
        </li>
      </ol>
      <p
        style={{
          fontSize: 12,
          color: "var(--color-muted)",
          marginTop: 8,
        }}
      >
        Add at vercel.com → Project → Settings → Environment Variables, then
        redeploy. (Alternatively, set <code>GA4_SERVICE_ACCOUNT_JSON</code> with
        a Viewer-role service account.)
      </p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  body,
  value,
}: {
  href: string;
  title: string;
  body: string;
  value?: string;
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
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
        {title}
        {value && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 11,
              color: "var(--color-muted)",
              fontWeight: 400,
            }}
          >
            {value}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.5 }}>
        {body}
      </div>
    </Link>
  );
}
