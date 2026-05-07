import { NextResponse, type NextRequest } from "next/server";
import { bulkGenerateCodes } from "@/lib/admin/discounts";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  const input = body as Parameters<typeof bulkGenerateCodes>[0];
  if (!input?.title || !input?.value || !input?.prefix || !input?.count) {
    return NextResponse.json(
      { error: "title, value, prefix, and count are required" },
      { status: 400 },
    );
  }
  if (input.count < 1 || input.count > 1000) {
    return NextResponse.json(
      { error: "count must be between 1 and 1000" },
      { status: 400 },
    );
  }
  try {
    const result = await bulkGenerateCodes(input);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk generation failed" },
      { status: 500 },
    );
  }
}
