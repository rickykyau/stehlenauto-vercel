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
  try {
    rows = await listAllInventory();
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Shopify Admin error";
  }

  return (
    <div>
      <p style={{ color: "var(--color-muted)", fontSize: 13, maxWidth: 640, marginBottom: 18 }}>
        Live Shopify inventory for every active product. Search by product or CB
        item name, sort any column, filter by stock status, and page through.
        The SKU column is the <strong>CB Item Name</strong>. Click a row to open
        the product.
      </p>

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
