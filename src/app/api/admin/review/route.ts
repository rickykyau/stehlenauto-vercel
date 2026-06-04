import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../_auth";
import {
  setReviewStatus,
  type ReviewStatus,
  REVIEW_STATUSES,
} from "@/lib/admin/reviews";
import { pingProduct } from "@/lib/seo/indexnow";

export const runtime = "nodejs";

// Owner-gated moderation of native customer reviews. PATCH { id, status }.
// Approving/rejecting changes what the PDP renders, so we revalidate the
// product page (and the admin list) on success.
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim() as ReviewStatus;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  if (!REVIEW_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const result = await setReviewStatus(id, status);
  if (!result.ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (result.handle) {
    revalidatePath(`/products/${result.handle}`);
    // Approving a review changes the PDP's visible content (and its aggregate
    // rating), so push the page to IndexNow → Bing re-crawls it fast, which
    // feeds ChatGPT Search freshness. Fire-and-forget; never blocks the response.
    if (status === "approved") {
      void pingProduct(result.handle);
    }
  }
  revalidatePath("/admin/reviews");

  return NextResponse.json({ ok: true, handle: result.handle ?? null });
}
