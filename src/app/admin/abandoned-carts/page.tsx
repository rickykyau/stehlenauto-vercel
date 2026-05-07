import Link from "next/link";
import { redirect } from "next/navigation";
import { listAbandonedCarts } from "@/lib/admin/abandoned-carts";
import { requireOwner } from "@/lib/admin/guard";
import { CopyRecoveryButton } from "./recover-button";

export const dynamic = "force-dynamic";

function ageHours(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.round(ms / 60_000)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default async function AdminAbandonedCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(
      owner.reason === "unauthenticated"
        ? "/sign-in?redirect_url=/admin/abandoned-carts"
        : "/",
    );
  }
  const sp = await searchParams;

  let result;
  let liveError: string | null = null;
  try {
    result = await listAbandonedCarts({
      cursor: sp.after ?? sp.before ?? null,
      direction: sp.before ? "prev" : "next",
      pageSize: 25,
    });
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  const totalValue =
    result?.items.reduce((acc, i) => acc + parseFloat(i.totalPrice || "0"), 0) ?? 0;

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
          Customers who reached checkout but didn&apos;t pay. Tap RECOVER to
          copy the resume-checkout link, then paste it into a personal email
          or SMS. Klaviyo automation runs separately.
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 12, marginBottom: 18 }}
      >
        <Stat label="Open carts" value={String(result?.items.length ?? 0)} />
        <Stat
          label="Recoverable value"
          value={`$${totalValue.toFixed(2)}`}
        />
        <Stat
          label="With email"
          value={String(result?.items.filter((i) => i.email).length ?? 0)}
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
                <Th>CART</Th>
                <Th>CUSTOMER</Th>
                <Th>ITEMS</Th>
                <Th>TOTAL</Th>
                <Th>AGE</Th>
                <Th>ACTION</Th>
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
                    No abandoned carts. Either every visitor is converting, or
                    nobody&apos;s on the site right now.
                  </td>
                </tr>
              ) : (
                result.items.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td>
                      <span
                        className="mono"
                        style={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {c.name}
                      </span>
                    </Td>
                    <Td>
                      <div>{c.customerName}</div>
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          style={{
                            fontSize: 11,
                            color: "var(--color-muted)",
                          }}
                        >
                          {c.email}
                        </a>
                      )}
                    </Td>
                    <Td>
                      <div>{c.itemCount}</div>
                      {c.topItemTitles.length > 0 && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-muted)",
                            marginTop: 2,
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.topItemTitles.join(", ")}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span className="mono">
                        ${parseFloat(c.totalPrice).toFixed(2)}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--color-muted)" }}
                      >
                        {ageHours(c.createdAt)}
                      </span>
                    </Td>
                    <Td>
                      {c.recoveryUrl ? (
                        <CopyRecoveryButton
                          url={c.recoveryUrl}
                          email={c.email}
                        />
                      ) : (
                        <span
                          style={{ fontSize: 11, color: "var(--color-muted)" }}
                        >
                          No recovery URL
                        </span>
                      )}
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
                ? `/admin/abandoned-carts?before=${encodeURIComponent(result.pageInfo.startCursor ?? "")}`
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
                ? `/admin/abandoned-carts?after=${encodeURIComponent(result.pageInfo.endCursor ?? "")}`
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

function Stat({ label, value }: { label: string; value: string }) {
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
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
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
