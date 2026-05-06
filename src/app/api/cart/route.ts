import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addToCart,
  emptyCart,
  getCart,
  removeLine,
  updateLine,
} from "@/lib/cart/server";
import { shopifyConfigured, shopifyFetch } from "@/lib/shopify/client";
import { GET_PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify/queries";
import type { ProductNode } from "@/lib/shopify/types";

export const runtime = "nodejs";

const PostBody = z.object({
  handle: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  options: z.record(z.string(), z.string()).optional(),
});

const PatchBody = z.object({
  lineId: z.string().min(1),
  quantity: z.number().int().min(0),
});

const DeleteBody = z.object({
  // Cycle 14Z (Mike-O1 M-1): allow lineId="all" to clear the entire cart
  // (forgets the Shopify cart cookie, next add creates a fresh cart). Lets
  // a customer recover from a stale shared cart without contacting support.
  lineId: z.string().min(1),
});

async function resolveVariantId(
  handle: string,
  sku?: string,
): Promise<{ id: string | null; available: boolean; inventory: number }> {
  const data = await shopifyFetch<{ product: ProductNode | null }>(
    GET_PRODUCT_BY_HANDLE_QUERY,
    { handle },
  );
  const variants = data.product?.variants?.nodes ?? [];
  const totalInventory = data.product?.totalInventory ?? 0;
  if (variants.length === 0) return { id: null, available: false, inventory: 0 };
  let chosen = variants[0];
  if (sku) {
    const exact = variants.find((v) => v.sku === sku);
    if (exact) chosen = exact;
  }
  return {
    id: chosen?.id ?? null,
    available: !!chosen?.availableForSale,
    inventory: totalInventory,
  };
}

export async function GET() {
  const cart = await getCart();
  return NextResponse.json({ cart });
}

export async function POST(req: Request) {
  if (!shopifyConfigured) {
    return NextResponse.json(
      { error: "Shopify not configured" },
      { status: 503 },
    );
  }
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  let variant: { id: string | null; available: boolean; inventory: number };
  try {
    variant = await resolveVariantId(parsed.data.handle, parsed.data.sku);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "lookup failed" },
      { status: 502 },
    );
  }
  if (!variant.id) {
    return NextResponse.json(
      { error: `No purchasable variant found for ${parsed.data.handle}` },
      { status: 422 },
    );
  }
  // Cycle 14Z (Mike-O2 N-1 BLOCKER): server-side guard so even a manual
  // POST can't add a 0-inventory variant. The client-side button gate is
  // for UX; this is the integrity backstop.
  if (!variant.available || variant.inventory <= 0) {
    return NextResponse.json(
      { error: "This product is currently out of stock." },
      { status: 409 },
    );
  }

  try {
    const cart = await addToCart(variant.id, parsed.data.quantity);
    return NextResponse.json({ cart });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "add failed" },
      { status: 502 },
    );
  }
}

export async function PATCH(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const cart = await updateLine(parsed.data.lineId, parsed.data.quantity);
  return NextResponse.json({ cart });
}

export async function DELETE(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = DeleteBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.lineId === "all") {
    await emptyCart();
    return NextResponse.json({ cart: null });
  }
  const cart = await removeLine(parsed.data.lineId);
  return NextResponse.json({ cart });
}
