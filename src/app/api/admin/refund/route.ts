import { NextResponse, type NextRequest } from "next/server";
import { createRefund } from "@/lib/admin/orders";
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
  const input = body as Parameters<typeof createRefund>[0];
  if (!input?.orderGid) {
    return NextResponse.json({ error: "orderGid required" }, { status: 400 });
  }
  try {
    const result = await createRefund(input);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed" },
      { status: 500 },
    );
  }
}
