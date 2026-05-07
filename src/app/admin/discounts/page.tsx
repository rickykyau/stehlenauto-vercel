import Link from "next/link";
import { redirect } from "next/navigation";
import { listDiscounts } from "@/lib/admin/discounts";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(owner.reason === "unauthenticated" ? "/sign-in?redirect_url=/admin/discounts" : "/");
  }
  const sp = await searchParams;
  let result;
  let liveError: string | null = null;
  try {
    result = await listDiscounts({
      cursor: sp.after ?? sp.before ?? null,
      direction: sp.before ? "prev" : "next",
      pageSize: 25,
    });
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <p style={{ color: "var(--color-muted)", fontSize: 13, maxWidth: 560 }}>
          Code or automatic discounts. Code-based requires the customer to
          enter a value at checkout (great for marketing campaigns and
          customer-service goodwill); automatic applies without a code (great
          for sitewide sales).
        </p>
        <Link href="/admin/discounts/new" className="btn btn-primary">
          + NEW DISCOUNT
        </Link>
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
              >
                <Th>TITLE</Th>
                <Th>CODE</Th>
                <Th>SUMMARY</Th>
                <Th>USES</Th>
                <Th>STATUS</Th>
                <Th>STARTS</Th>
                <Th>ENDS</Th>
              </tr>
            </thead>
            <tbody>
              {result.discounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--color-muted)",
                    }}
                  >
                    No discounts yet. Tap NEW DISCOUNT to create one.
                  </td>
                </tr>
              ) : (
                result.discounts.map((d) => (
                  <tr
                    key={d.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td>
                      <div style={{ fontWeight: 500 }}>{d.title}</div>
                    </Td>
                    <Td>
                      {d.code ? (
                        <span
                          className="mono"
                          style={{
                            fontSize: 12,
                            background: "var(--color-surface-2)",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {d.code}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
                          AUTO
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                        {d.summary}
                      </span>
                    </Td>
                    <Td>{d.asyncUsageCount}</Td>
                    <Td>
                      <StatusChip status={d.status} />
                    </Td>
                    <Td>
                      {new Date(d.startsAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      {d.endsAt ? new Date(d.endsAt).toLocaleDateString() : "—"}
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
                ? `/admin/discounts?before=${encodeURIComponent(result.pageInfo.startCursor ?? "")}`
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
                ? `/admin/discounts?after=${encodeURIComponent(result.pageInfo.endCursor ?? "")}`
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
      className="mono"
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
function StatusChip({ status }: { status: string }) {
  const color =
    status === "ACTIVE"
      ? "var(--color-success)"
      : status === "SCHEDULED"
        ? "var(--color-primary)"
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
      {status}
    </span>
  );
}
