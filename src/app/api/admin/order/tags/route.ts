import { NextResponse, type NextRequest } from "next/server";
import { addOrderTags, removeOrderTags } from "@/lib/admin/orders";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";

type Body = {
  orderGid?: string;
  add?: string[];
  remove?: string[];
};

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { orderGid, add, remove } = body;
  if (!orderGid) {
    return NextResponse.json({ error: "orderGid required" }, { status: 400 });
  }
  const cleanAdd = (add ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 40);
  const cleanRemove = (remove ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 40);
  if (cleanAdd.length === 0 && cleanRemove.length === 0) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }
  try {
    if (cleanAdd.length > 0) {
      const r = await addOrderTags(orderGid, cleanAdd);
      if ("error" in r) {
        return NextResponse.json({ error: r.error }, { status: 422 });
      }
    }
    if (cleanRemove.length > 0) {
      const r = await removeOrderTags(orderGid, cleanRemove);
      if ("error" in r) {
        return NextResponse.json({ error: r.error }, { status: 422 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tag update failed" },
      { status: 500 },
    );
  }
}
