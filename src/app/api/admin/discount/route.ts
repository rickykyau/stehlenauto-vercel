import { NextResponse, type NextRequest } from "next/server";
import { createDiscount, deleteDiscount } from "@/lib/admin/discounts";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = body as Parameters<typeof createDiscount>[0];
  if (!input?.title || !input?.activation || !input?.value) {
    return NextResponse.json(
      { error: "title, activation, and value are required" },
      { status: 400 },
    );
  }
  try {
    const result = await createDiscount(input);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const kind = searchParams.get("kind") as "code" | "automatic" | null;
  if (!id || (kind !== "code" && kind !== "automatic")) {
    return NextResponse.json(
      { error: "id and kind=(code|automatic) required" },
      { status: 400 },
    );
  }
  try {
    const result = await deleteDiscount(id, kind);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    );
  }
}
