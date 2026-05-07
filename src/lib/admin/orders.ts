import "server-only";
import { shopifyAdminFetch } from "@/lib/shopify/admin";

/**
 * Cycle 14X+ post-sync (admin Option B): Shopify Admin order queries +
 * refund mutations. All routes consuming these are gated by the
 * email-allowlist middleware, so we trust the caller is the owner.
 */

export type AdminOrderListItem = {
  id: string; // gid://shopify/Order/...
  legacyId: string; // numeric order number for display
  name: string; // "#1024"
  createdAt: string;
  customerName: string;
  customerEmail: string | null;
  totalPrice: string;
  currency: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  itemCount: number;
};

export type AdminOrderListResult = {
  orders: AdminOrderListItem[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

const LIST_ORDERS_QUERY = /* GraphQL */ `
  query ListOrders(
    $first: Int
    $last: Int
    $after: String
    $before: String
    $query: String
    $sortKey: OrderSortKeys
    $reverse: Boolean
  ) {
    orders(
      first: $first
      last: $last
      after: $after
      before: $before
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        legacyResourceId
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        currentTotalPriceSet {
          presentmentMoney {
            amount
            currencyCode
          }
        }
        customer {
          firstName
          lastName
          email
        }
        lineItems(first: 1) {
          nodes {
            id
          }
        }
        currentSubtotalLineItemsQuantity
      }
    }
  }
`;

type ListOrdersResponse = {
  orders: {
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    nodes: {
      id: string;
      legacyResourceId: string;
      name: string;
      createdAt: string;
      displayFinancialStatus: string | null;
      displayFulfillmentStatus: string | null;
      currentTotalPriceSet: {
        presentmentMoney: { amount: string; currencyCode: string };
      };
      customer: {
        firstName: string | null;
        lastName: string | null;
        email: string | null;
      } | null;
      currentSubtotalLineItemsQuantity: number;
    }[];
  };
};

export async function listOrders(opts: {
  search?: string;
  status?: "any" | "open" | "closed" | "cancelled";
  cursor?: string | null;
  direction?: "next" | "prev";
  pageSize?: number;
}): Promise<AdminOrderListResult> {
  const pageSize = opts.pageSize ?? 25;
  const queryParts: string[] = [];
  if (opts.search) {
    queryParts.push(`name:*${opts.search}* OR email:*${opts.search}*`);
  }
  if (opts.status && opts.status !== "any") {
    queryParts.push(`status:${opts.status}`);
  }
  const query = queryParts.join(" AND ") || undefined;

  const variables: Record<string, unknown> = {
    sortKey: "CREATED_AT",
    reverse: true,
    query,
  };
  if (opts.direction === "prev" && opts.cursor) {
    variables.last = pageSize;
    variables.before = opts.cursor;
  } else {
    variables.first = pageSize;
    if (opts.cursor) variables.after = opts.cursor;
  }

  const data = await shopifyAdminFetch<ListOrdersResponse>(
    LIST_ORDERS_QUERY,
    variables,
  );

  const orders: AdminOrderListItem[] = data.orders.nodes.map((n) => ({
    id: n.id,
    legacyId: n.legacyResourceId,
    name: n.name,
    createdAt: n.createdAt,
    customerName:
      [n.customer?.firstName, n.customer?.lastName].filter(Boolean).join(" ") ||
      "Guest",
    customerEmail: n.customer?.email ?? null,
    totalPrice: n.currentTotalPriceSet.presentmentMoney.amount,
    currency: n.currentTotalPriceSet.presentmentMoney.currencyCode,
    financialStatus: n.displayFinancialStatus,
    fulfillmentStatus: n.displayFulfillmentStatus,
    itemCount: n.currentSubtotalLineItemsQuantity,
  }));
  return { orders, pageInfo: data.orders.pageInfo };
}

/**
 * Cycle 14X+ post-sync (admin Tier A daily summary): summarize orders
 * within an arbitrary ISO date range. Used by the cron job to produce
 * "yesterday's revenue / order count" stats; not paginated, just totals.
 */
export type OrderSummary = {
  count: number;
  revenue: number;
  refunded: number;
  newCustomers: number;
  topItems: { title: string; quantity: number }[];
};

const ORDERS_IN_RANGE_QUERY = /* GraphQL */ `
  query OrdersInRange($query: String!, $first: Int!, $after: String) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        currentTotalPriceSet { presentmentMoney { amount } }
        totalRefundedSet { presentmentMoney { amount } }
        customer { numberOfOrders }
        lineItems(first: 25) { nodes { title quantity } }
      }
    }
  }
`;

type OrdersInRangeResp = {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: {
      id: string;
      currentTotalPriceSet: { presentmentMoney: { amount: string } };
      totalRefundedSet: { presentmentMoney: { amount: string } };
      customer: { numberOfOrders: string } | null;
      lineItems: { nodes: { title: string; quantity: number }[] };
    }[];
  };
};

export async function summarizeOrdersInRange(opts: {
  startISO: string; // inclusive
  endISO: string; // exclusive
}): Promise<OrderSummary> {
  const query = `created_at:>=${opts.startISO} created_at:<${opts.endISO}`;
  let count = 0;
  let revenue = 0;
  let refunded = 0;
  let newCustomers = 0;
  const itemCounts = new Map<string, number>();
  let cursor: string | null = null;
  let pages = 0;
  const MAX_PAGES = 10;
  while (pages < MAX_PAGES) {
    const data: OrdersInRangeResp = await shopifyAdminFetch<OrdersInRangeResp>(
      ORDERS_IN_RANGE_QUERY,
      {
        query,
        first: 100,
        after: cursor,
      },
    );
    pages++;
    for (const o of data.orders.nodes) {
      count++;
      revenue += parseFloat(o.currentTotalPriceSet.presentmentMoney.amount) || 0;
      refunded += parseFloat(o.totalRefundedSet.presentmentMoney.amount) || 0;
      if (o.customer && parseInt(o.customer.numberOfOrders, 10) === 1) {
        newCustomers++;
      }
      for (const li of o.lineItems.nodes) {
        itemCounts.set(li.title, (itemCounts.get(li.title) ?? 0) + (li.quantity || 0));
      }
    }
    if (!data.orders.pageInfo.hasNextPage) break;
    cursor = data.orders.pageInfo.endCursor;
  }
  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, quantity]) => ({ title, quantity }));
  return { count, revenue, refunded, newCustomers, topItems };
}

export type AdminOrderDetail = {
  id: string;
  legacyId: string;
  name: string;
  createdAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: string;
  totalRefunded: string;
  refundableAmount: string;
  currency: string;
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  shippingAddress: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  lineItems: {
    id: string; // gid://.../LineItem/...
    title: string;
    sku: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    refundedQuantity: number;
    image: string | null;
  }[];
  refunds: {
    id: string;
    createdAt: string;
    note: string | null;
    totalRefunded: string;
  }[];
  tags: string[];
};

const ORDER_DETAIL_QUERY = /* GraphQL */ `
  query OrderDetail($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      createdAt
      displayFinancialStatus
      displayFulfillmentStatus
      currentTotalPriceSet {
        presentmentMoney { amount currencyCode }
      }
      totalRefundedSet {
        presentmentMoney { amount currencyCode }
      }
      currentTotalPriceSet {
        presentmentMoney { amount currencyCode }
      }
      customer {
        firstName
        lastName
        email
        phone
      }
      tags
      shippingAddress {
        address1
        address2
        city
        province
        zip
        country
      }
      lineItems(first: 50) {
        nodes {
          id
          title
          sku
          quantity
          refundableQuantity
          originalUnitPriceSet {
            presentmentMoney { amount currencyCode }
          }
          originalTotalSet {
            presentmentMoney { amount currencyCode }
          }
          image {
            url
          }
        }
      }
      refunds {
        id
        createdAt
        note
        totalRefundedSet {
          presentmentMoney { amount currencyCode }
        }
      }
    }
  }
`;

type OrderDetailResponse = {
  order: {
    id: string;
    legacyResourceId: string;
    name: string;
    createdAt: string;
    displayFinancialStatus: string | null;
    displayFulfillmentStatus: string | null;
    currentTotalPriceSet: {
      presentmentMoney: { amount: string; currencyCode: string };
    };
    totalRefundedSet: {
      presentmentMoney: { amount: string; currencyCode: string };
    };
    customer: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    tags: string[];
    shippingAddress: AdminOrderDetail["shippingAddress"];
    lineItems: {
      nodes: {
        id: string;
        title: string;
        sku: string | null;
        quantity: number;
        refundableQuantity: number;
        originalUnitPriceSet: {
          presentmentMoney: { amount: string; currencyCode: string };
        };
        originalTotalSet: {
          presentmentMoney: { amount: string; currencyCode: string };
        };
        image: { url: string } | null;
      }[];
    };
    refunds: {
      id: string;
      createdAt: string;
      note: string | null;
      totalRefundedSet: {
        presentmentMoney: { amount: string; currencyCode: string };
      };
    }[];
  } | null;
};

export async function getOrderDetail(
  orderGid: string,
): Promise<AdminOrderDetail | null> {
  const data = await shopifyAdminFetch<OrderDetailResponse>(
    ORDER_DETAIL_QUERY,
    { id: orderGid },
  );
  const o = data.order;
  if (!o) return null;
  const total = parseFloat(o.currentTotalPriceSet.presentmentMoney.amount);
  const refunded = parseFloat(o.totalRefundedSet.presentmentMoney.amount);
  return {
    id: o.id,
    legacyId: o.legacyResourceId,
    name: o.name,
    createdAt: o.createdAt,
    financialStatus: o.displayFinancialStatus,
    fulfillmentStatus: o.displayFulfillmentStatus,
    totalPrice: o.currentTotalPriceSet.presentmentMoney.amount,
    totalRefunded: o.totalRefundedSet.presentmentMoney.amount,
    refundableAmount: Math.max(0, total - refunded).toFixed(2),
    currency: o.currentTotalPriceSet.presentmentMoney.currencyCode,
    customer: o.customer,
    shippingAddress: o.shippingAddress,
    lineItems: o.lineItems.nodes.map((n) => ({
      id: n.id,
      title: n.title,
      sku: n.sku,
      quantity: n.quantity,
      unitPrice: n.originalUnitPriceSet.presentmentMoney.amount,
      totalPrice: n.originalTotalSet.presentmentMoney.amount,
      refundedQuantity: n.quantity - n.refundableQuantity,
      image: n.image?.url ?? null,
    })),
    refunds: o.refunds.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      note: r.note,
      totalRefunded: r.totalRefundedSet.presentmentMoney.amount,
    })),
    tags: o.tags ?? [],
  };
}

const ORDER_TAGS_ADD = /* GraphQL */ `
  mutation OrderTagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node { id }
      userErrors { message }
    }
  }
`;
const ORDER_TAGS_REMOVE = /* GraphQL */ `
  mutation OrderTagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      node { id }
      userErrors { message }
    }
  }
`;

export async function addOrderTags(
  orderGid: string,
  tags: string[],
): Promise<{ ok: true } | { error: string }> {
  if (tags.length === 0) return { ok: true };
  const data = await shopifyAdminFetch<{
    tagsAdd: { node: { id: string } | null; userErrors: { message: string }[] };
  }>(ORDER_TAGS_ADD, { id: orderGid, tags });
  const errs = data.tagsAdd.userErrors;
  if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
  return { ok: true };
}

export async function removeOrderTags(
  orderGid: string,
  tags: string[],
): Promise<{ ok: true } | { error: string }> {
  if (tags.length === 0) return { ok: true };
  const data = await shopifyAdminFetch<{
    tagsRemove: { node: { id: string } | null; userErrors: { message: string }[] };
  }>(ORDER_TAGS_REMOVE, { id: orderGid, tags });
  const errs = data.tagsRemove.userErrors;
  if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
  return { ok: true };
}

/**
 * Cycle 14X+ post-sync (admin Tier A): preset tags surfaced in the order
 * detail UI as one-tap chips. Owner can also type custom tags freely.
 */
export const ORDER_TAG_PRESETS: string[] = [
  "VIP",
  "First-time",
  "Repeat customer",
  "Affirm payment",
  "Wrong fitment",
  "Service recovery",
  "eBay sourced",
  "Amazon sourced",
  "Phone order",
  "Rural shipping",
  "Hold for fitment confirm",
];

const REFUND_CREATE_MUTATION = /* GraphQL */ `
  mutation RefundCreate($input: RefundInput!) {
    refundCreate(input: $input) {
      refund {
        id
        totalRefundedSet {
          presentmentMoney { amount currencyCode }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type RefundCreateInput = {
  orderGid: string;
  note?: string;
  notify?: boolean;
  shipping?: { fullRefund?: boolean; amount?: string };
  // refundLineItems shape: [{ lineItemId, quantity, restockType }]
  refundLineItems?: {
    lineItemId: string;
    quantity: number;
    restockType?: "NO_RESTOCK" | "RETURN" | "CANCEL";
  }[];
  // For full custom-amount refunds without per-line specifics:
  amount?: string;
  currency?: string;
};

export async function createRefund(input: RefundCreateInput): Promise<{
  refundId: string;
  totalRefunded: string;
} | { error: string }> {
  const refundInput: Record<string, unknown> = {
    orderId: input.orderGid,
    note: input.note,
    notify: input.notify ?? true,
  };
  if (input.shipping?.fullRefund) {
    refundInput.shipping = { fullRefund: true };
  } else if (input.shipping?.amount) {
    refundInput.shipping = { amount: input.shipping.amount };
  }
  if (input.refundLineItems && input.refundLineItems.length > 0) {
    refundInput.refundLineItems = input.refundLineItems.map((li) => ({
      lineItemId: li.lineItemId,
      quantity: li.quantity,
      restockType: li.restockType ?? "NO_RESTOCK",
    }));
  }

  const data = await shopifyAdminFetch<{
    refundCreate: {
      refund: {
        id: string;
        totalRefundedSet: {
          presentmentMoney: { amount: string; currencyCode: string };
        };
      } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(REFUND_CREATE_MUTATION, { input: refundInput });

  const errs = data.refundCreate.userErrors;
  if (errs && errs.length > 0) {
    return { error: errs.map((e) => e.message).join("; ") };
  }
  if (!data.refundCreate.refund) {
    return { error: "Shopify returned no refund object" };
  }
  return {
    refundId: data.refundCreate.refund.id,
    totalRefunded:
      data.refundCreate.refund.totalRefundedSet.presentmentMoney.amount,
  };
}
