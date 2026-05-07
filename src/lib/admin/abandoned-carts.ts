import "server-only";
import { shopifyAdminFetch } from "@/lib/shopify/admin";

/**
 * Cycle 14X+ post-sync (admin Tier 1): abandoned-checkout list.
 *
 * Shopify exposes abandonedCheckouts (a Plus-and-up surface that tracks
 * customers who reached checkout but didn't pay). We list them sorted by
 * recency with a recovery URL the owner can paste into a manual email or
 * an SMS. Klaviyo automation lives elsewhere — this is the manual lever.
 */

export type AbandonedCartItem = {
  id: string;
  legacyId: string;
  name: string; // e.g. "#A12345"
  email: string | null;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: string;
  currency: string;
  itemCount: number;
  topItemTitles: string[]; // first 2-3 line items for at-a-glance
  recoveryUrl: string | null;
};

export type AbandonedCartsResult = {
  items: AbandonedCartItem[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

const ABANDONED_CHECKOUTS_QUERY = /* GraphQL */ `
  query AbandonedCheckouts(
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) {
    abandonedCheckouts(
      first: $first
      last: $last
      after: $after
      before: $before
      sortKey: CREATED_AT
      reverse: true
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        abandonedCheckoutUrl
        completedAt
        createdAt
        updatedAt
        name
        totalPriceSet { presentmentMoney { amount currencyCode } }
        customer { displayName email }
        lineItems(first: 5) {
          nodes { title quantity }
        }
      }
    }
  }
`;

type Resp = {
  abandonedCheckouts: {
    pageInfo: AbandonedCartsResult["pageInfo"];
    nodes: {
      id: string;
      abandonedCheckoutUrl: string | null;
      completedAt: string | null;
      createdAt: string;
      updatedAt: string;
      name: string;
      totalPriceSet: {
        presentmentMoney: { amount: string; currencyCode: string };
      };
      customer: { displayName: string | null; email: string | null } | null;
      lineItems: { nodes: { title: string; quantity: number }[] };
    }[];
  };
};

function legacyIdFromGid(gid: string): string {
  const last = gid.split("/").pop() ?? gid;
  return last;
}

export async function listAbandonedCarts(opts: {
  cursor?: string | null;
  direction?: "next" | "prev";
  pageSize?: number;
}): Promise<AbandonedCartsResult> {
  const pageSize = opts.pageSize ?? 25;
  const variables: Record<string, unknown> = {};
  if (opts.direction === "prev" && opts.cursor) {
    variables.last = pageSize;
    variables.before = opts.cursor;
  } else {
    variables.first = pageSize;
    if (opts.cursor) variables.after = opts.cursor;
  }
  const data = await shopifyAdminFetch<Resp>(ABANDONED_CHECKOUTS_QUERY, variables);

  const items: AbandonedCartItem[] = data.abandonedCheckouts.nodes
    // Drop ones the customer already came back and completed.
    .filter((n) => !n.completedAt)
    .map((n) => {
      const lines = n.lineItems.nodes;
      const itemCount = lines.reduce((acc, l) => acc + (l.quantity || 0), 0);
      return {
        id: n.id,
        legacyId: legacyIdFromGid(n.id),
        name: n.name,
        email: n.customer?.email ?? null,
        customerName: n.customer?.displayName ?? "Guest",
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        totalPrice: n.totalPriceSet.presentmentMoney.amount,
        currency: n.totalPriceSet.presentmentMoney.currencyCode,
        itemCount,
        topItemTitles: lines.slice(0, 3).map((l) => l.title),
        recoveryUrl: n.abandonedCheckoutUrl,
      };
    });

  return { items, pageInfo: data.abandonedCheckouts.pageInfo };
}
