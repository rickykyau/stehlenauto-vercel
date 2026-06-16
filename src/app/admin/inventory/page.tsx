import { redirect } from "next/navigation";
import { listAllInventory } from "@/lib/admin/inventory";
import { requireOwner } from "@/lib/admin/guard";
import { InventoryTable } from "./inventory-table";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const owner = await requireOwner();
  if (!owner.allowed) {
    redirect(
      owner.reason === "unauthenticated"
        ? "/sign-in?redirect_url=/admin/inventory"
        : "/",
    );
  }

  let rows;
  let liveError: string | null = null;
  let fetchedAt: Date | null = null;
  try {
    rows = await listAllInventory();
    // Page is force-dynamic — this data is pulled live from Shopify on every
    // load, so the fetch time IS the "last updated" time for what's shown.
    fetchedAt = new Date();
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  // Owner is Pacific — America/Los_Angeles resolves PST/PDT automatically and
  // emits the correct abbreviation via timeZoneName: "short".
  const lastUpdatedPT = fetchedAt
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(fetchedAt)
    : null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <p style={{ color: "var(--color-muted)", fontSize: 13, maxWidth: 640, margin: 0 }}>
          Live Shopify inventory for every active product. Search by product or CB
          item name, sort any column, filter by stock status, and page through.
          The SKU column is the <strong>CB Item Name</strong>. Click a row to open
          the product.
        </p>
        {lastUpdatedPT && (
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            LAST UPDATED
            <br />
            <span style={{ color: "var(--color-foreground)" }}>{lastUpdatedPT}</span>
          </div>
        )}
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

      {rows && <InventoryTable rows={rows} />}
    </div>
  );
}
