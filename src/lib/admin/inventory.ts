import "server-only";
import { shopifyAdminFetch } from "@/lib/shopify/admin";

/**
 * Cycle 14X+ post-sync (admin Tier 1): low-stock alerts.
 *
 * Pulls product variants with their current inventoryQuantity and surfaces
 * the ones at/below the threshold. We page through up to 250 variants per
 * request (Shopify max) sorted by inventoryQuantity asc — for ~1300 SKUs
 * that's ~5-6 round trips worst case, only fired when the owner opens the
 * page. Untracked variants (inventoryItem.tracked=false) are filtered out
 * because their inventoryQuantity is meaningless.
 */

export type InventoryAlertItem = {
  variantId: string;
  productId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  quantity: number;
  price: string;
  imageUrl: string | null;
  status: "OUT" | "LOW";
};

export type InventoryAlertsResult = {
  items: InventoryAlertItem[];
  totalScanned: number;
  threshold: number;
  truncated: boolean;
};

const PRODUCT_VARIANTS_QUERY = /* GraphQL */ `
  query LowStockVariants($first: Int!, $after: String, $query: String) {
    productVariants(first: $first, after: $after, query: $query, sortKey: INVENTORY_QUANTITY) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        sku
        price
        inventoryQuantity
        inventoryItem { tracked }
        image { url(transform: { maxWidth: 80, maxHeight: 80 }) }
        product {
          id
          handle
          title
          status
          featuredImage { url(transform: { maxWidth: 80, maxHeight: 80 }) }
        }
      }
    }
  }
`;

type Resp = {
  productVariants: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: {
      id: string;
      title: string;
      sku: string | null;
      price: string;
      inventoryQuantity: number | null;
      inventoryItem: { tracked: boolean };
      image: { url: string } | null;
      product: {
        id: string;
        handle: string;
        title: string;
        status: string; // ACTIVE | DRAFT | ARCHIVED
        featuredImage: { url: string } | null;
      };
    }[];
  };
};

export async function listLowStock(opts: {
  threshold?: number;
  maxItems?: number;
}): Promise<InventoryAlertsResult> {
  const threshold = opts.threshold ?? 5;
  const maxItems = opts.maxItems ?? 200;

  const items: InventoryAlertItem[] = [];
  let cursor: string | null = null;
  let totalScanned = 0;
  let pages = 0;
  const MAX_PAGES = 6;

  while (pages < MAX_PAGES && items.length < maxItems) {
    const data: Resp = await shopifyAdminFetch<Resp>(PRODUCT_VARIANTS_QUERY, {
      first: 250,
      after: cursor,
      query: "status:active",
    });
    pages++;
    totalScanned += data.productVariants.nodes.length;
    for (const v of data.productVariants.nodes) {
      if (!v.inventoryItem.tracked) continue;
      if (v.product.status !== "ACTIVE") continue;
      const qty = v.inventoryQuantity ?? 0;
      if (qty > threshold) {
        // Sorted ascending by inventory — once we cross the threshold we
        // can stop scanning entirely.
        return {
          items,
          totalScanned,
          threshold,
          truncated: false,
        };
      }
      items.push({
        variantId: v.id,
        productId: v.product.id,
        productHandle: v.product.handle,
        productTitle: v.product.title,
        variantTitle: v.title,
        sku: v.sku,
        quantity: qty,
        price: v.price,
        imageUrl: v.image?.url ?? v.product.featuredImage?.url ?? null,
        status: qty <= 0 ? "OUT" : "LOW",
      });
      if (items.length >= maxItems) break;
    }
    if (!data.productVariants.pageInfo.hasNextPage) break;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  return {
    items,
    totalScanned,
    threshold,
    truncated: items.length >= maxItems || pages >= MAX_PAGES,
  };
}
