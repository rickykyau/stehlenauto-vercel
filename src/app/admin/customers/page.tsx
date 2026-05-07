import Link from "next/link";
import { redirect } from "next/navigation";
import { listCustomers } from "@/lib/admin/customers";
import { requireOwner } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    after?: string;
    before?: string;
  }>;
}) {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(
      owner.reason === "unauthenticated"
        ? "/sign-in?redirect_url=/admin/customers"
        : "/",
    );
  }
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;

  let result;
  let liveError: string | null = null;
  try {
    result = await listCustomers({
      search,
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
          placeholder="Search by email or name"
          className="input"
          style={{ flex: 1, minWidth: 220 }}
        />
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
                <Th>NAME</Th>
                <Th>EMAIL</Th>
                <Th>ORDERS</Th>
                <Th>SPEND</Th>
                <Th>JOINED</Th>
                <Th>TAGS</Th>
              </tr>
            </thead>
            <tbody>
              {result.customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--color-muted)",
                    }}
                  >
                    {search
                      ? `No customers match "${search}".`
                      : "No customers yet."}
                  </td>
                </tr>
              ) : (
                result.customers.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <Td>
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.legacyId)}`}
                        style={{ color: "var(--color-primary)", fontWeight: 600 }}
                      >
                        {c.displayName || "(no name)"}
                      </Link>
                    </Td>
                    <Td>
                      <span style={{ fontSize: 12 }}>
                        {c.email ?? (
                          <span style={{ color: "var(--color-muted)" }}>—</span>
                        )}
                      </span>
                    </Td>
                    <Td>{c.ordersCount}</Td>
                    <Td>
                      <span className="mono">
                        ${parseFloat(c.totalSpent).toFixed(2)}
                      </span>
                    </Td>
                    <Td>
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Td>
                    <Td>
                      {c.tags.length === 0 ? (
                        <span style={{ color: "var(--color-muted)" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {c.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="mono"
                              style={{
                                fontSize: 10,
                                padding: "1px 6px",
                                background: "var(--color-surface-2)",
                                borderRadius: "var(--radius-sm)",
                              }}
                            >
                              {t}
                            </span>
                          ))}
                          {c.tags.length > 3 && (
                            <span
                              style={{ fontSize: 10, color: "var(--color-muted)" }}
                            >
                              +{c.tags.length - 3}
                            </span>
                          )}
                        </div>
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
                ? `/admin/customers?before=${encodeURIComponent(result.pageInfo.startCursor ?? "")}${search ? `&q=${encodeURIComponent(search)}` : ""}`
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
                ? `/admin/customers?after=${encodeURIComponent(result.pageInfo.endCursor ?? "")}${search ? `&q=${encodeURIComponent(search)}` : ""}`
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
