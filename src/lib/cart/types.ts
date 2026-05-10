import type { FitmentTable } from "@/lib/catalog/types";

export type Money = {
  amount: string;
  currencyCode: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantTitle: string;
  productHandle: string;
  productTitle: string;
  sku: string | null;
  image: { url: string; altText: string | null } | null;
  price: Money;
  /**
   * Cycle 14AR-fix3 (BUG-14AR-6 follow-up): per-line fitment data fetched
   * server-side and attached at adapt time so the cart drawer + cart
   * page checkFitment calls have what they need to return a confident
   * verdict. Without these, the drawer/page only have title text and
   * empty vehicleTags — checkFitment falls all the way to title-string
   * matching which is the worst path. Verdict came back undefined for
   * any line whose title doesn't carry obvious make/model tokens, and
   * the drawer rendered no badge for those lines.
   *
   * Both fields are optional so the type is backward-compatible with
   * any caller that creates a CartLine without enriching (e.g., mock
   * data in tests).
   */
  fitmentTable?: FitmentTable;
  vehicleTags?: string[];
  fitTitle?: string;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  total: Money;
  lines: CartLine[];
};
