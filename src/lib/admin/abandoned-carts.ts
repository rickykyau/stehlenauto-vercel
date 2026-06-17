import "server-only";
import { inArray } from "drizzle-orm";
import { shopifyAdminFetch } from "@/lib/shopify/admin";
import { db, dbConfigured } from "@/lib/db/client";
import { archivedCarts, abandonedCartSends } from "@/lib/db/schema";

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
  // Did this customer place an order at/after abandoning? If so, don't pester
  // them with a recovery email. Only resolvable when the cart carries an email.
  alreadyPurchased: boolean;
  purchasedOrderName: string | null; // e.g. "#1042", for the flag tooltip
  // Has the owner already sent a recovery follow-up for this cart?
  alreadySentAt: string | null;
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
        customer { id displayName email }
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
      customer: {
        id: string;
        displayName: string | null;
        email: string | null;
      } | null;
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

  // Base list: drop ones Shopify already marked completed (the customer came
  // back and finished THIS checkout). Note: this misses the case where the
  // customer bought via a DIFFERENT checkout — that's what the per-cart
  // purchase-check below catches.
  const base = data.abandonedCheckouts.nodes
    .filter((n) => !n.completedAt)
    .map((n) => {
      const lines = n.lineItems.nodes;
      const itemCount = lines.reduce((acc, l) => acc + (l.quantity || 0), 0);
      return {
        id: n.id,
        legacyId: legacyIdFromGid(n.id),
        name: n.name,
        email: n.customer?.email ?? null,
        customerId: n.customer?.id ?? null,
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

  // Drop carts the owner has archived ("ignore"), and look up which carts we've
  // already sent a follow-up for. Both keyed by legacy checkout id.
  const legacyIds = base.map((b) => b.legacyId);
  const [archivedSet, sentMap] = await Promise.all([
    archivedCheckoutIds(legacyIds),
    sentCheckoutMap(legacyIds),
  ]);
  const visible = base.filter((b) => !archivedSet.has(b.legacyId));

  // Purchase-check: for every visible cart that has an email, ask Shopify
  // whether that customer placed an order at/after they abandoned. Run in
  // parallel — at most one orders query per cart on this page.
  const purchaseChecks = await Promise.all(
    visible.map((b) =>
      b.customerId || b.email
        ? customerPurchasedSince({
            customerId: b.customerId,
            email: b.email,
            sinceIso: b.createdAt,
          })
        : Promise.resolve(null),
    ),
  );

  const items: AbandonedCartItem[] = visible.map((b, i) => {
    const purchase = purchaseChecks[i];
    return {
      ...b,
      alreadyPurchased: Boolean(purchase),
      purchasedOrderName: purchase?.orderName ?? null,
      alreadySentAt: sentMap.get(b.legacyId) ?? null,
    };
  });

  return { items, pageInfo: data.abandonedCheckouts.pageInfo };
}

// ---------------------------------------------------------------------------
// Recovery email template
// ---------------------------------------------------------------------------

const EMAIL_LOGO =
  "https://cdn.shopify.com/s/files/1/0724/2638/9551/files/stehlen-logo-email-dark.png?v=1774929918";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Build the abandoned-cart recovery email. UTM-tagged so a resulting purchase
 * attributes to this manual recovery, not Direct.
 */
export function buildRecoveryEmail(item: AbandonedCartItem): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = item.customerName.split(" ")[0];
  const greeting =
    firstName && firstName !== "Guest" ? `Hi ${esc(firstName)},` : "Hi there,";
  const itemsList = item.topItemTitles.length
    ? `<ul style="margin:8px 0 0; padding-left:18px; color:#333;">${item.topItemTitles
        .map((t) => `<li style="margin:4px 0;">${esc(t)}</li>`)
        .join("")}</ul>`
    : "";
  const base = item.recoveryUrl ?? "https://stehlenauto.com/cart";
  const cta = base.includes("?")
    ? `${base}&utm_source=brevo&utm_medium=email&utm_campaign=abandoned-cart-recovery&utm_content=manual`
    : `${base}?utm_source=brevo&utm_medium=email&utm_campaign=abandoned-cart-recovery&utm_content=manual`;

  const subject = "Your Stehlen cart is still saved";
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:0; background:#ffffff; color:#333;">
<div style="background:#0a0a0a; text-align:center;"><img src="${EMAIL_LOGO}" alt="Stehlen Auto" style="max-width:100%; height:auto; display:block; margin:0 auto;"/></div>
<div style="padding:24px 20px;">
<p>${greeting}</p>
<p>You started checkout at <strong>stehlenauto.com</strong> but didn't get to finish &mdash; your cart is still saved:</p>
${itemsList}
<p>Every part we ship is <strong>fitment-guaranteed</strong> for your vehicle, with free shipping and 30-day returns. Pick up right where you left off:</p>
<p style="text-align:center; margin:26px 0;"><a href="${cta}" style="display:inline-block; padding:15px 34px; background:#f5a823; color:#000; text-decoration:none; font-weight:bold; font-size:16px; border-radius:4px;">RESUME MY CHECKOUT &rarr;</a></p>
<p style="color:#888; font-size:13px;">Ran into a fitment question or anything else? Just reply to this email and a human will help.</p>
<p>&mdash; The Stehlen Auto Team<br/><a href="https://stehlenauto.com?utm_source=brevo&utm_medium=email&utm_campaign=abandoned-cart-recovery&utm_content=footer">stehlenauto.com</a></p>
</div></body></html>`;

  // Hand-written plain-text alternative — intentional breaks only between
  // paragraphs. Prevents the mangled auto-generated text part.
  const textGreeting =
    firstName && firstName !== "Guest" ? `Hi ${firstName},` : "Hi there,";
  const textItems = item.topItemTitles.length
    ? "\n" + item.topItemTitles.map((t) => `  - ${t}`).join("\n") + "\n"
    : "";
  const text = [
    textGreeting,
    "",
    "You started checkout at stehlenauto.com but didn't get to finish - your cart is still saved:",
    textItems || "",
    "Every part we ship is fitment-guaranteed for your vehicle, with free shipping and 30-day returns. Pick up right where you left off:",
    "",
    cta,
    "",
    "Ran into a fitment question or anything else? Just reply to this email and a human will help.",
    "",
    "- The Stehlen Auto Team",
    "stehlenauto.com",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Single-cart fetch (server-side re-verification for the SEND route)
// ---------------------------------------------------------------------------

const ABANDONED_CHECKOUT_NODE_QUERY = /* GraphQL */ `
  query AbandonedCheckoutNode($id: ID!) {
    node(id: $id) {
      ... on AbandonedCheckout {
        id
        abandonedCheckoutUrl
        completedAt
        createdAt
        updatedAt
        name
        totalPriceSet { presentmentMoney { amount currencyCode } }
        customer { id displayName email }
        lineItems(first: 5) { nodes { title quantity } }
      }
    }
  }
`;

/**
 * Fetch a single abandoned checkout by its legacy id, fully enriched with the
 * purchase-check + send-status — the authoritative state the SEND route gates
 * on. Returns null if it no longer exists or was already completed.
 */
export async function getAbandonedCart(
  legacyId: string,
): Promise<AbandonedCartItem | null> {
  const gid = `gid://shopify/AbandonedCheckout/${legacyId}`;
  const data = await shopifyAdminFetch<{ node: Resp["abandonedCheckouts"]["nodes"][number] | null }>(
    ABANDONED_CHECKOUT_NODE_QUERY,
    { id: gid },
  );
  const n = data.node;
  if (!n || n.completedAt) return null;

  const lines = n.lineItems.nodes;
  const email = n.customer?.email ?? null;
  const customerId = n.customer?.id ?? null;
  const [purchase, sentMap] = await Promise.all([
    customerId || email
      ? customerPurchasedSince({ customerId, email, sinceIso: n.createdAt })
      : Promise.resolve(null),
    sentCheckoutMap([legacyId]),
  ]);

  return {
    id: n.id,
    legacyId,
    name: n.name,
    email,
    customerName: n.customer?.displayName ?? "Guest",
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    totalPrice: n.totalPriceSet.presentmentMoney.amount,
    currency: n.totalPriceSet.presentmentMoney.currencyCode,
    itemCount: lines.reduce((acc, l) => acc + (l.quantity || 0), 0),
    topItemTitles: lines.slice(0, 3).map((l) => l.title),
    recoveryUrl: n.abandonedCheckoutUrl,
    alreadyPurchased: Boolean(purchase),
    purchasedOrderName: purchase?.orderName ?? null,
    alreadySentAt: sentMap.get(legacyId) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Purchase-check — "did they already buy?"
// ---------------------------------------------------------------------------

type OrderNode = {
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
};

// Look up a customer's recent orders by customer id — the most reliable signal
// (works even when the abandoned checkout exposes no email, like guest-linked
// customer records).
const ORDERS_BY_CUSTOMER_QUERY = /* GraphQL */ `
  query OrdersByCustomer($id: ID!) {
    customer(id: $id) {
      orders(first: 5, sortKey: CREATED_AT, reverse: true) {
        nodes { name createdAt displayFinancialStatus }
      }
    }
  }
`;

// Fallback: search orders by email string (for carts with an email but no
// customer record).
const ORDERS_BY_EMAIL_QUERY = /* GraphQL */ `
  query OrdersByEmail($q: String!) {
    orders(first: 5, query: $q, sortKey: CREATED_AT, reverse: true) {
      nodes { name createdAt displayFinancialStatus }
    }
  }
`;

// Financial statuses that mean money actually moved (a real purchase).
const PAID_STATUSES = new Set([
  "PAID",
  "PARTIALLY_PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "AUTHORIZED",
]);

function matchOrderSince(
  nodes: OrderNode[],
  sinceIso: string,
): { orderName: string } | null {
  const since = new Date(sinceIso).getTime();
  const match = nodes.find((o) => {
    const placed = new Date(o.createdAt).getTime();
    const status = (o.displayFinancialStatus ?? "").toUpperCase();
    return placed >= since && PAID_STATUSES.has(status);
  });
  return match ? { orderName: match.name } : null;
}

/**
 * Returns the matching order (name) if this customer placed a paid order
 * at/after `sinceIso`, else null. Used to suppress recovery emails to buyers
 * who already converted (possibly via a different checkout). Prefers the
 * customer-id lookup (reliable even with no email); falls back to email search.
 * Never throws — a lookup failure degrades to "can't confirm" (null) so the
 * list still loads.
 */
export async function customerPurchasedSince(opts: {
  customerId: string | null;
  email: string | null;
  sinceIso: string;
}): Promise<{ orderName: string } | null> {
  // 1) By customer id (most reliable).
  if (opts.customerId) {
    try {
      const data = await shopifyAdminFetch<{
        customer: { orders: { nodes: OrderNode[] } } | null;
      }>(ORDERS_BY_CUSTOMER_QUERY, { id: opts.customerId });
      const nodes = data.customer?.orders.nodes ?? [];
      const m = matchOrderSince(nodes, opts.sinceIso);
      if (m) return m;
    } catch {
      /* fall through to email */
    }
  }
  // 2) By email string.
  const clean = opts.email?.trim();
  if (clean) {
    try {
      const data = await shopifyAdminFetch<{ orders: { nodes: OrderNode[] } }>(
        ORDERS_BY_EMAIL_QUERY,
        { q: `email:"${clean.replace(/"/g, '\\"')}"` },
      );
      return matchOrderSince(data.orders.nodes, opts.sinceIso);
    } catch {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Archive + send-log (Neon). All degrade gracefully when the DB is unconfigured.
// ---------------------------------------------------------------------------

async function archivedCheckoutIds(legacyIds: string[]): Promise<Set<string>> {
  if (!dbConfigured || legacyIds.length === 0) return new Set();
  try {
    const rows = await db()
      .select({ id: archivedCarts.checkoutId })
      .from(archivedCarts)
      .where(inArray(archivedCarts.checkoutId, legacyIds));
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

async function sentCheckoutMap(
  legacyIds: string[],
): Promise<Map<string, string>> {
  if (!dbConfigured || legacyIds.length === 0) return new Map();
  try {
    const rows = await db()
      .select({
        id: abandonedCartSends.checkoutId,
        sentAt: abandonedCartSends.sentAt,
      })
      .from(abandonedCartSends)
      .where(inArray(abandonedCartSends.checkoutId, legacyIds));
    return new Map(rows.map((r) => [r.id, r.sentAt.toISOString()]));
  } catch {
    return new Map();
  }
}
