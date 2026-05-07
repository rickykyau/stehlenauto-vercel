import "server-only";
import { shopifyAdminFetch } from "@/lib/shopify/admin";

/**
 * Cycle 14X+ post-sync (admin Option B follow-up): customer list +
 * detail via the Shopify Admin API. Owner-only — guarded by the page
 * route's requireOwner() before this is called.
 */

export type AdminCustomerListItem = {
  id: string; // gid://shopify/Customer/...
  legacyId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  ordersCount: number;
  totalSpent: string;
  currency: string;
  createdAt: string;
  tags: string[];
};

export type AdminCustomerListResult = {
  customers: AdminCustomerListItem[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

const LIST_CUSTOMERS_QUERY = /* GraphQL */ `
  query ListCustomers(
    $first: Int
    $last: Int
    $after: String
    $before: String
    $query: String
  ) {
    customers(
      first: $first
      last: $last
      after: $after
      before: $before
      query: $query
      sortKey: UPDATED_AT
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
        legacyResourceId
        displayName
        email
        phone
        numberOfOrders
        amountSpent { amount currencyCode }
        createdAt
        tags
      }
    }
  }
`;

type ListCustomersResponse = {
  customers: {
    pageInfo: AdminCustomerListResult["pageInfo"];
    nodes: {
      id: string;
      legacyResourceId: string;
      displayName: string;
      email: string | null;
      phone: string | null;
      numberOfOrders: string;
      amountSpent: { amount: string; currencyCode: string };
      createdAt: string;
      tags: string[];
    }[];
  };
};

export async function listCustomers(opts: {
  search?: string;
  cursor?: string | null;
  direction?: "next" | "prev";
  pageSize?: number;
}): Promise<AdminCustomerListResult> {
  const pageSize = opts.pageSize ?? 25;
  const variables: Record<string, unknown> = {};
  if (opts.search) {
    variables.query = `email:*${opts.search}* OR last_name:*${opts.search}* OR first_name:*${opts.search}*`;
  }
  if (opts.direction === "prev" && opts.cursor) {
    variables.last = pageSize;
    variables.before = opts.cursor;
  } else {
    variables.first = pageSize;
    if (opts.cursor) variables.after = opts.cursor;
  }
  const data = await shopifyAdminFetch<ListCustomersResponse>(
    LIST_CUSTOMERS_QUERY,
    variables,
  );
  return {
    customers: data.customers.nodes.map((n) => ({
      id: n.id,
      legacyId: n.legacyResourceId,
      displayName: n.displayName,
      email: n.email,
      phone: n.phone,
      ordersCount: parseInt(n.numberOfOrders, 10) || 0,
      totalSpent: n.amountSpent.amount,
      currency: n.amountSpent.currencyCode,
      createdAt: n.createdAt,
      tags: n.tags,
    })),
    pageInfo: data.customers.pageInfo,
  };
}

export type AdminCustomerDetail = {
  id: string;
  legacyId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  ordersCount: number;
  totalSpent: string;
  currency: string;
  createdAt: string;
  note: string | null;
  tags: string[];
  defaultAddress: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  recentOrders: {
    id: string;
    legacyId: string;
    name: string;
    createdAt: string;
    totalPrice: string;
    currency: string;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
  }[];
};

const CUSTOMER_DETAIL_QUERY = /* GraphQL */ `
  query CustomerDetail($id: ID!) {
    customer(id: $id) {
      id
      legacyResourceId
      displayName
      email
      phone
      numberOfOrders
      amountSpent { amount currencyCode }
      createdAt
      note
      tags
      defaultAddress {
        address1
        address2
        city
        province
        zip
        country
      }
      orders(first: 25, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          legacyResourceId
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          currentTotalPriceSet {
            presentmentMoney { amount currencyCode }
          }
        }
      }
    }
  }
`;

type CustomerDetailResponse = {
  customer: {
    id: string;
    legacyResourceId: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    numberOfOrders: string;
    amountSpent: { amount: string; currencyCode: string };
    createdAt: string;
    note: string | null;
    tags: string[];
    defaultAddress: AdminCustomerDetail["defaultAddress"];
    orders: {
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
      }[];
    };
  } | null;
};

export async function getCustomerDetail(
  customerGid: string,
): Promise<AdminCustomerDetail | null> {
  const data = await shopifyAdminFetch<CustomerDetailResponse>(
    CUSTOMER_DETAIL_QUERY,
    { id: customerGid },
  );
  const c = data.customer;
  if (!c) return null;
  return {
    id: c.id,
    legacyId: c.legacyResourceId,
    displayName: c.displayName,
    email: c.email,
    phone: c.phone,
    ordersCount: parseInt(c.numberOfOrders, 10) || 0,
    totalSpent: c.amountSpent.amount,
    currency: c.amountSpent.currencyCode,
    createdAt: c.createdAt,
    note: c.note,
    tags: c.tags,
    defaultAddress: c.defaultAddress,
    recentOrders: c.orders.nodes.map((o) => ({
      id: o.id,
      legacyId: o.legacyResourceId,
      name: o.name,
      createdAt: o.createdAt,
      totalPrice: o.currentTotalPriceSet.presentmentMoney.amount,
      currency: o.currentTotalPriceSet.presentmentMoney.currencyCode,
      financialStatus: o.displayFinancialStatus,
      fulfillmentStatus: o.displayFulfillmentStatus,
    })),
  };
}
