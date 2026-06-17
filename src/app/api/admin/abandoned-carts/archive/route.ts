import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../_auth";
import { db, dbConfigured } from "@/lib/db/client";
import { archivedCarts } from "@/lib/db/schema";

export const runtime = "nodejs";

type Body = { checkoutId?: string };

async function readId(req: NextRequest): Promise<string | null> {
  try {
    const body = (await req.json()) as Body;
    const id = body.checkoutId?.trim();
    return id || null;
  } catch {
    return null;
  }
}

// Archive ("ignore") an abandoned cart so it drops off the live list.
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!dbConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }
  const checkoutId = await readId(req);
  if (!checkoutId) {
    return NextResponse.json(
      { error: "checkoutId is required" },
      { status: 400 },
    );
  }
  try {
    await db()
      .insert(archivedCarts)
      .values({ checkoutId, archivedBy: gate.userId })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true, archived: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Archive failed" },
      { status: 500 },
    );
  }
}

// Un-archive (restore) a cart to the live list.
export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!dbConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }
  const checkoutId = await readId(req);
  if (!checkoutId) {
    return NextResponse.json(
      { error: "checkoutId is required" },
      { status: 400 },
    );
  }
  try {
    await db()
      .delete(archivedCarts)
      .where(eq(archivedCarts.checkoutId, checkoutId));
    return NextResponse.json({ ok: true, archived: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Un-archive failed" },
      { status: 500 },
    );
  }
}
