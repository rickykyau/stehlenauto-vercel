import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "../../_auth";
import {
  buildCbImportWorkbook,
  buildCbImportWorkbookMulti,
} from "@/lib/admin/cb-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function toGid(id: string): string {
  return id.startsWith("gid://") ? id : `gid://shopify/Order/${id}`;
}

/**
 * GET /api/admin/order/cb-import?id=<order gid>
 * Returns the Connected Business order-import .xlsx for one order.
 * Owner-gated. Linked from the admin order detail page.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await buildCbImportWorkbook(toGid(id));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "content-type": XLSX_TYPE,
      "content-disposition": `attachment; filename="${result.filename}"`,
      "cache-control": "no-store",
    },
  });
}

/** Bulk export: POST { ids: string[] } → one combined .xlsx. */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: { ids?: string[] };
  try {
    body = (await req.json()) as { ids?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids[] is required" }, { status: 400 });
  }
  if (body.ids.length > 200) {
    return NextResponse.json({ error: "Max 200 orders per export" }, { status: 400 });
  }

  const result = await buildCbImportWorkbookMulti(body.ids.map(toGid));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "content-type": XLSX_TYPE,
      "content-disposition": `attachment; filename="${result.filename}"`,
      "cache-control": "no-store",
    },
  });
}
