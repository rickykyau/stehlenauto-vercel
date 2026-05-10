import "server-only";
import { cookies } from "next/headers";
import { shopifyConfigured, shopifyFetch } from "@/lib/shopify/client";
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
} from "@/lib/shopify/cart-queries";
import { getProduct } from "@/lib/catalog";
import type { Cart, CartLine, Money } from "./types";

const CART_COOKIE = "stehlen_cart_id";
const ONE_MONTH = 60 * 60 * 24 * 30;

type ShopifyCartLineNode = {
  id: string;
  quantity: number;
  merchandise?: {
    id: string;
    title: string;
    sku: string | null;
    image: {
      url: string;
      altText: string | null;
    } | null;
    price: Money;
    product: {
      handle: string;
      title: string;
      // Cycle 14Z (Mike-O1 M-2): merch-curated CB Item Name metafield.
      cbItemName?: { value: string | null } | null;
    };
  };
};

type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  lines: { nodes: ShopifyCartLineNode[] };
};

function adapt(cart: ShopifyCart): Cart {
  const lines: CartLine[] = cart.lines.nodes
    .filter((n): n is ShopifyCartLineNode & { merchandise: NonNullable<ShopifyCartLineNode["merchandise"]> } =>
      Boolean(n.merchandise),
    )
    .map((n) => ({
      id: n.id,
      quantity: n.quantity,
      variantId: n.merchandise.id,
      // Cycle 14Z (Mike-O4 F-2): Shopify uses "Default Title" as the
      // variant title for any product with only one variant. Leaks into
      // /cart and /checkout as "SKU XYZ · Default Title". Strip it.
      variantTitle:
        n.merchandise.title === "Default Title" ? "" : n.merchandise.title,
      productHandle: n.merchandise.product.handle,
      productTitle: n.merchandise.product.title,
      sku: n.merchandise.product.cbItemName?.value?.trim() || n.merchandise.sku,
      image: n.merchandise.image,
      price: n.merchandise.price,
    }));
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
    lines,
  };
}

/**
 * Cycle 14AR-fix3 (BUG-14AR-6 follow-up): enrich each cart line with
 * the per-product fitment data so the drawer + cart page checkFitment
 * calls can return a confident verdict (FITS / DOES NOT FIT) instead
 * of falling back to the title-string path which often returned
 * undefined → no badge → cart line looked broken to the customer.
 *
 * Strategy: dedupe by handle (a customer with two of the same product
 * counts as 1 fetch), Promise.all the getProduct calls, attach
 * fitmentTable + vehicleTags + fitTitle to each line. Failures are
 * non-fatal — the line just keeps its existing minimal data.
 *
 * Cost: 1-3 extra Shopify GET-product calls per cart action, all
 * concurrent. Typical add-to-cart now adds ~150-300ms; acceptable.
 */
async function enrichLinesWithFitment(cart: Cart): Promise<Cart> {
  const uniqueHandles = Array.from(
    new Set(cart.lines.map((l) => l.productHandle).filter(Boolean)),
  );
  if (uniqueHandles.length === 0) return cart;
  try {
    const products = await Promise.all(
      uniqueHandles.map((h) => getProduct(h).catch(() => null)),
    );
    const byHandle = new Map<
      string,
      { fitmentTable?: import("@/lib/catalog/types").FitmentTable; vehicleTags?: string[]; fitTitle?: string }
    >();
    products.forEach((p, i) => {
      if (!p) return;
      byHandle.set(uniqueHandles[i], {
        fitmentTable: p.fitmentTable,
        vehicleTags: p.vehicleTags,
        fitTitle: p.fitTitle ?? undefined,
      });
    });
    const enrichedLines = cart.lines.map((l) => {
      const meta = byHandle.get(l.productHandle);
      if (!meta) return l;
      return { ...l, ...meta };
    });
    return { ...cart, lines: enrichedLines };
  } catch (err) {
    console.error("[cart] enrichLinesWithFitment failed:", err);
    return cart;
  }
}

async function readCartId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string) {
  const store = await cookies();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_MONTH,
    path: "/",
  });
}

async function clearCartId() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

/**
 * Cycle 14Z (Mike-O1 M-1): full cart clear. Forgets the Shopify cart cookie
 * so the customer's next add creates a brand-new cart. Used to recover from
 * a stale shared cart that survived a cookie wipe (the Shopify cart token
 * lives server-side and outlives client-side `document.cookie =` clears).
 */
export async function emptyCart(): Promise<void> {
  await clearCartId();
}

export async function getCart(): Promise<Cart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;
  try {
    const data = await shopifyFetch<{ cart: ShopifyCart | null }>(CART_QUERY, {
      id,
    });
    if (!data.cart) {
      await clearCartId();
      return null;
    }
    return enrichLinesWithFitment(adapt(data.cart));
  } catch (err) {
    console.error("[cart] getCart fell back:", err);
    return null;
  }
}

export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<Cart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();

  if (!id) {
    const created = await shopifyFetch<{
      cartCreate: {
        cart: ShopifyCart | null;
        userErrors: { message: string }[];
      };
    }>(CART_CREATE, {
      input: { lines: [{ merchandiseId: variantId, quantity }] },
    });
    if (created.cartCreate.userErrors.length) {
      throw new Error(
        created.cartCreate.userErrors.map((e) => e.message).join("; "),
      );
    }
    if (!created.cartCreate.cart) return null;
    await writeCartId(created.cartCreate.cart.id);
    return enrichLinesWithFitment(adapt(created.cartCreate.cart));
  }

  const updated = await shopifyFetch<{
    cartLinesAdd: {
      cart: ShopifyCart | null;
      userErrors: { message: string }[];
    };
  }>(CART_LINES_ADD, {
    cartId: id,
    lines: [{ merchandiseId: variantId, quantity }],
  });
  if (updated.cartLinesAdd.userErrors.length) {
    throw new Error(
      updated.cartLinesAdd.userErrors.map((e) => e.message).join("; "),
    );
  }
  return updated.cartLinesAdd.cart
    ? enrichLinesWithFitment(adapt(updated.cartLinesAdd.cart))
    : null;
}

export async function updateLine(
  lineId: string,
  quantity: number,
): Promise<Cart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCart | null;
      userErrors: { message: string }[];
    };
  }>(CART_LINES_UPDATE, {
    cartId: id,
    lines: [{ id: lineId, quantity }],
  });
  return data.cartLinesUpdate.cart
    ? enrichLinesWithFitment(adapt(data.cartLinesUpdate.cart))
    : null;
}

export async function removeLine(lineId: string): Promise<Cart | null> {
  if (!shopifyConfigured) return null;
  const id = await readCartId();
  if (!id) return null;
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: ShopifyCart | null;
      userErrors: { message: string }[];
    };
  }>(CART_LINES_REMOVE, {
    cartId: id,
    lineIds: [lineId],
  });
  return data.cartLinesRemove.cart
    ? enrichLinesWithFitment(adapt(data.cartLinesRemove.cart))
    : null;
}
