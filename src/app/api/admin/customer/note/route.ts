import { NextResponse, type NextRequest } from "next/server";
import { updateCustomerNote } from "@/lib/admin/customers";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  let body: { customerGid?: string; note?: string };
  try {
    body = (await req.json()) as { customerGid?: string; note?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { customerGid, note } = body;
  if (!customerGid) {
    return NextResponse.json(
      { error: "customerGid is required" },
      { status: 400 },
    );
  }
  if (typeof note !== "string") {
    return NextResponse.json({ error: "note must be a string" }, { status: 400 });
  }
  if (note.length > 5000) {
    return NextResponse.json(
      { error: "Note too long (max 5000 chars)" },
      { status: 400 },
    );
  }
  try {
    const result = await updateCustomerNote(customerGid, note);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
