import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, dbConfigured } from "@/lib/db/client";
import { wishlistItems } from "@/lib/db/schema";

export const runtime = "nodejs";

async function requireUser() {
  const { userId } = await auth();
  return userId;
}

export async function GET() {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!dbConfigured) return NextResponse.json({ items: [] });

  const items = await db()
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.addedAt));
  return NextResponse.json({ items });
}

const PostBody = z.object({
  handle: z.string().min(1),
  title: z.string().min(1),
  image: z.string().nullable().optional(),
  price: z.number().int().nonnegative(),
  sku: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { handle, title, image, price, sku } = parsed.data;
  await db()
    .insert(wishlistItems)
    .values({
      userId,
      productHandle: handle,
      productTitle: title,
      productImage: image ?? null,
      productPrice: price,
      productSku: sku ?? null,
    })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

const DeleteBody = z.object({
  handle: z.string().min(1),
});

export async function DELETE(req: Request) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!dbConfigured) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
  const json = await req.json().catch(() => null);
  const parsed = DeleteBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  await db()
    .delete(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productHandle, parsed.data.handle),
      ),
    );
  return NextResponse.json({ ok: true });
}
