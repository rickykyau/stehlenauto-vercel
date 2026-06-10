import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "../../_auth";
import { buildCbImportWorkbook } from "@/lib/admin/cb-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const gid = id.startsWith("gid://") ? id : `gid://shopify/Order/${id}`;

  const result = await buildCbImportWorkbook(gid);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${result.filename}"`,
      "cache-control": "no-store",
    },
  });
}
