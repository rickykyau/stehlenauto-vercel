import "server-only";
import {
  shopifyAdminConfigured,
  shopifyAdminFetch,
} from "@/lib/shopify/admin";

export type OrderSummary = {
  id: string;
  number: string;
  date: string;
  summary: string;
  itemCount: number;
  vehicle?: string;
  status: "Processing" | "In transit" | "Delivered" | "Cancelled";
  statusSub: string;
  total: number;
};

const ORDERS_BY_EMAIL_QUERY = /* GraphQL */ `
  query OrdersByEmail($query: String!, $first: Int!) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        displayFulfillmentStatus
        displayFinancialStatus
        currentTotalPriceSet { shopMoney { amount currencyCode } }
        lineItems(first: 5) {
          nodes {
            title
            quantity
          }
        }
      }
    }
  }
`;

type ShopifyOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  currentTotalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  lineItems: {
    nodes: { title: string; quantity: number }[];
  };
};

function statusFromShopify(
  fulfillment: string,
): { status: OrderSummary["status"]; sub: string } {
  switch (fulfillment) {
    case "FULFILLED":
      return { status: "Delivered", sub: "Delivered" };
    case "IN_TRANSIT":
      return { status: "In transit", sub: "On the way" };
    case "PARTIALLY_FULFILLED":
      return { status: "In transit", sub: "Partial shipment" };
    case "UNFULFILLED":
      return { status: "Processing", sub: "Ships within 24h" };
    case "RESTOCKED":
      return { status: "Cancelled", sub: "Refunded" };
    default:
      return { status: "Processing", sub: fulfillment.toLowerCase() };
  }
}

export async function listOrdersForEmail(
  email: string | null,
): Promise<OrderSummary[]> {
  if (!email || !shopifyAdminConfigured) return [];
  try {
    const data = await shopifyAdminFetch<{
      orders: { nodes: ShopifyOrderNode[] };
    }>(ORDERS_BY_EMAIL_QUERY, {
      query: `email:${email}`,
      first: 25,
    });
    return data.orders.nodes.map((o) => {
      const { status, sub } = statusFromShopify(o.displayFulfillmentStatus);
      const items = o.lineItems.nodes;
      const summary = items
        .slice(0, 2)
        .map((i) => i.title)
        .join(" + ");
      return {
        id: o.id.replace(/^gid:\/\/shopify\/Order\//, ""),
        number: o.name,
        date: new Date(o.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        summary: summary || "—",
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        status,
        statusSub: sub,
        total: parseFloat(o.currentTotalPriceSet.shopMoney.amount),
      };
    });
  } catch (err) {
    console.error("[orders] listOrdersForEmail failed:", err);
    return [];
  }
}
