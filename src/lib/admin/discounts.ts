import "server-only";
import { shopifyAdminFetch } from "@/lib/shopify/admin";

/**
 * Cycle 14X+ post-sync (admin Option B): Shopify discount management.
 *
 * Shopify offers two discount kinds:
 *   - Code-based (customer enters at checkout)  — discountCodeBasicCreate
 *   - Automatic (applied without a code)        — discountAutomaticBasicCreate
 *
 * Within each, the value can be:
 *   - Percentage off
 *   - Fixed amount off
 *   - Free shipping (separate mutation: discountCodeFreeShippingCreate /
 *     discountAutomaticFreeShippingCreate)
 *
 * Volume / BOGO / app-driven discounts are scoped out of the MVP — they
 * use different mutations and the merch team can create those in the
 * native Shopify Admin if needed.
 */

export type AdminDiscountListItem = {
  id: string;
  title: string;
  code: string | null; // null for automatic discounts
  status: "ACTIVE" | "EXPIRED" | "SCHEDULED";
  startsAt: string;
  endsAt: string | null;
  summary: string;
  asyncUsageCount: number;
};

export type AdminDiscountListResult = {
  discounts: AdminDiscountListItem[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

const LIST_DISCOUNTS_QUERY = /* GraphQL */ `
  query ListDiscounts(
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) {
    discountNodes(
      first: $first
      last: $last
      after: $after
      before: $before
      reverse: true
      sortKey: CREATED_AT
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        discount {
          __typename
          ... on DiscountCodeBasic {
            title
            status
            startsAt
            endsAt
            summary
            asyncUsageCount
            codes(first: 1) {
              nodes { code }
            }
          }
          ... on DiscountCodeFreeShipping {
            title
            status
            startsAt
            endsAt
            summary
            asyncUsageCount
            codes(first: 1) {
              nodes { code }
            }
          }
          ... on DiscountAutomaticBasic {
            title
            status
            startsAt
            endsAt
            summary
            asyncUsageCount
          }
          ... on DiscountAutomaticFreeShipping {
            title
            status
            startsAt
            endsAt
            summary
            asyncUsageCount
          }
        }
      }
    }
  }
`;

type ListDiscountsResponse = {
  discountNodes: {
    pageInfo: AdminDiscountListResult["pageInfo"];
    nodes: {
      id: string;
      discount:
        | {
            __typename: "DiscountCodeBasic" | "DiscountCodeFreeShipping";
            title: string;
            status: "ACTIVE" | "EXPIRED" | "SCHEDULED";
            startsAt: string;
            endsAt: string | null;
            summary: string;
            asyncUsageCount: number;
            codes: { nodes: { code: string }[] };
          }
        | {
            __typename:
              | "DiscountAutomaticBasic"
              | "DiscountAutomaticFreeShipping";
            title: string;
            status: "ACTIVE" | "EXPIRED" | "SCHEDULED";
            startsAt: string;
            endsAt: string | null;
            summary: string;
            asyncUsageCount: number;
          }
        | { __typename: string };
    }[];
  };
};

export async function listDiscounts(opts: {
  cursor?: string | null;
  direction?: "next" | "prev";
  pageSize?: number;
}): Promise<AdminDiscountListResult> {
  const pageSize = opts.pageSize ?? 25;
  const variables: Record<string, unknown> = {};
  if (opts.direction === "prev" && opts.cursor) {
    variables.last = pageSize;
    variables.before = opts.cursor;
  } else {
    variables.first = pageSize;
    if (opts.cursor) variables.after = opts.cursor;
  }

  const data = await shopifyAdminFetch<ListDiscountsResponse>(
    LIST_DISCOUNTS_QUERY,
    variables,
  );

  const discounts: AdminDiscountListItem[] = data.discountNodes.nodes
    .filter(
      (n): n is typeof n & {
        discount: { title: string; status: string; startsAt: string };
      } => "title" in n.discount,
    )
    .map((n) => {
      const d = n.discount as {
        __typename: string;
        title: string;
        status: AdminDiscountListItem["status"];
        startsAt: string;
        endsAt: string | null;
        summary: string;
        asyncUsageCount: number;
        codes?: { nodes: { code: string }[] };
      };
      return {
        id: n.id,
        title: d.title,
        code: d.codes?.nodes[0]?.code ?? null,
        status: d.status,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        summary: d.summary,
        asyncUsageCount: d.asyncUsageCount,
      };
    });

  return { discounts, pageInfo: data.discountNodes.pageInfo };
}

export type DiscountValueKind = "percentage" | "fixed_amount" | "free_shipping";
export type DiscountActivation = "code" | "automatic";

export type CreateDiscountInput = {
  title: string;
  activation: DiscountActivation;
  code?: string; // required when activation==="code"
  value: DiscountValueKind;
  percentage?: number; // 0-1 (e.g. 0.1 for 10%)
  fixedAmount?: number; // dollars (e.g. 25 for $25)
  startsAt?: string; // ISO; defaults to now
  endsAt?: string | null; // ISO or null for no expiry
  appliesOncePerCustomer?: boolean;
  usageLimit?: number | null;
  minimumSubtotal?: number; // dollars; 0 = no minimum
};

const DISCOUNT_CODE_BASIC_CREATE = /* GraphQL */ `
  mutation DiscountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const DISCOUNT_AUTOMATIC_BASIC_CREATE = /* GraphQL */ `
  mutation DiscountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
    discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
      automaticDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const DISCOUNT_CODE_FREE_SHIPPING_CREATE = /* GraphQL */ `
  mutation DiscountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
    discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const DISCOUNT_AUTOMATIC_FREE_SHIPPING_CREATE = /* GraphQL */ `
  mutation DiscountAutomaticFreeShippingCreate($freeShippingAutomaticDiscount: DiscountAutomaticFreeShippingInput!) {
    discountAutomaticFreeShippingCreate(freeShippingAutomaticDiscount: $freeShippingAutomaticDiscount) {
      automaticDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

export async function createDiscount(input: CreateDiscountInput): Promise<
  | { id: string }
  | { error: string }
> {
  const startsAt = input.startsAt ?? new Date().toISOString();
  const endsAt = input.endsAt ?? null;

  const customerSelection = { all: true };
  const minimumRequirement =
    input.minimumSubtotal && input.minimumSubtotal > 0
      ? {
          subtotal: {
            greaterThanOrEqualToSubtotal: input.minimumSubtotal.toFixed(2),
          },
        }
      : undefined;
  const customerGets =
    input.value === "percentage"
      ? {
          value: { percentage: input.percentage ?? 0 },
          items: { all: true },
        }
      : input.value === "fixed_amount"
        ? {
            value: {
              discountAmount: {
                amount: (input.fixedAmount ?? 0).toFixed(2),
                appliesOnEachItem: false,
              },
            },
            items: { all: true },
          }
        : undefined;

  if (input.value === "free_shipping") {
    if (input.activation === "code") {
      if (!input.code) return { error: "Code required for code-activated discount" };
      const data = await shopifyAdminFetch<{
        discountCodeFreeShippingCreate: {
          codeDiscountNode: { id: string } | null;
          userErrors: { message: string }[];
        };
      }>(DISCOUNT_CODE_FREE_SHIPPING_CREATE, {
        freeShippingCodeDiscount: {
          title: input.title,
          code: input.code,
          startsAt,
          endsAt,
          customerSelection,
          minimumRequirement,
          appliesOnOneTimePurchase: true,
          appliesOnSubscription: false,
          recurringCycleLimit: 0,
          appliesOncePerCustomer: input.appliesOncePerCustomer ?? false,
          usageLimit: input.usageLimit ?? null,
          destination: { all: true },
        },
      });
      const errs = data.discountCodeFreeShippingCreate.userErrors;
      if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
      const node = data.discountCodeFreeShippingCreate.codeDiscountNode;
      if (!node) return { error: "Shopify returned no discount node" };
      return { id: node.id };
    } else {
      const data = await shopifyAdminFetch<{
        discountAutomaticFreeShippingCreate: {
          automaticDiscountNode: { id: string } | null;
          userErrors: { message: string }[];
        };
      }>(DISCOUNT_AUTOMATIC_FREE_SHIPPING_CREATE, {
        freeShippingAutomaticDiscount: {
          title: input.title,
          startsAt,
          endsAt,
          minimumRequirement,
          appliesOnOneTimePurchase: true,
          appliesOnSubscription: false,
          destination: { all: true },
        },
      });
      const errs = data.discountAutomaticFreeShippingCreate.userErrors;
      if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
      const node = data.discountAutomaticFreeShippingCreate.automaticDiscountNode;
      if (!node) return { error: "Shopify returned no discount node" };
      return { id: node.id };
    }
  }

  if (input.activation === "code") {
    if (!input.code) return { error: "Code required for code-activated discount" };
    const data = await shopifyAdminFetch<{
      discountCodeBasicCreate: {
        codeDiscountNode: { id: string } | null;
        userErrors: { message: string }[];
      };
    }>(DISCOUNT_CODE_BASIC_CREATE, {
      basicCodeDiscount: {
        title: input.title,
        code: input.code,
        startsAt,
        endsAt,
        customerSelection,
        customerGets,
        minimumRequirement,
        appliesOncePerCustomer: input.appliesOncePerCustomer ?? false,
        usageLimit: input.usageLimit ?? null,
      },
    });
    const errs = data.discountCodeBasicCreate.userErrors;
    if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
    const node = data.discountCodeBasicCreate.codeDiscountNode;
    if (!node) return { error: "Shopify returned no discount node" };
    return { id: node.id };
  } else {
    const data = await shopifyAdminFetch<{
      discountAutomaticBasicCreate: {
        automaticDiscountNode: { id: string } | null;
        userErrors: { message: string }[];
      };
    }>(DISCOUNT_AUTOMATIC_BASIC_CREATE, {
      automaticBasicDiscount: {
        title: input.title,
        startsAt,
        endsAt,
        customerGets,
        minimumRequirement,
      },
    });
    const errs = data.discountAutomaticBasicCreate.userErrors;
    if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
    const node = data.discountAutomaticBasicCreate.automaticDiscountNode;
    if (!node) return { error: "Shopify returned no discount node" };
    return { id: node.id };
  }
}

const DISCOUNT_CODE_DELETE = /* GraphQL */ `
  mutation DiscountCodeDelete($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors { message }
    }
  }
`;

const DISCOUNT_AUTOMATIC_DELETE = /* GraphQL */ `
  mutation DiscountAutomaticDelete($id: ID!) {
    discountAutomaticDelete(id: $id) {
      deletedAutomaticDiscountId
      userErrors { message }
    }
  }
`;

export async function deleteDiscount(
  id: string,
  kind: "code" | "automatic",
): Promise<{ ok: true } | { error: string }> {
  if (kind === "code") {
    const data = await shopifyAdminFetch<{
      discountCodeDelete: {
        deletedCodeDiscountId: string | null;
        userErrors: { message: string }[];
      };
    }>(DISCOUNT_CODE_DELETE, { id });
    const errs = data.discountCodeDelete.userErrors;
    if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
    return { ok: true };
  } else {
    const data = await shopifyAdminFetch<{
      discountAutomaticDelete: {
        deletedAutomaticDiscountId: string | null;
        userErrors: { message: string }[];
      };
    }>(DISCOUNT_AUTOMATIC_DELETE, { id });
    const errs = data.discountAutomaticDelete.userErrors;
    if (errs.length > 0) return { error: errs.map((e) => e.message).join("; ") };
    return { ok: true };
  }
}
