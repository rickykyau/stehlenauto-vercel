import { NextResponse, type NextRequest } from "next/server";
import { runReviewRequests } from "@/lib/reviews/send-requests";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Post-purchase review-request sender. Two ways to invoke:
 *   - GET from Vercel Cron (daily), header `Authorization: Bearer <CRON_SECRET>`
 *     → mode "daily": orders fulfilled ~10 days ago, not yet asked.
 *   - GET from owner browser, gated by requireAdmin (Clerk owner):
 *       ?mode=backfill&days=90&dryRun=1   → preflight the one-time backfill
 *       ?mode=backfill&days=90            → actually send the backfill
 *
 * Idempotent: review_request_sends dedupes, so re-running never double-emails.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") === "backfill" ? "backfill" : "daily";
  const dryRun = url.searchParams.get("dryRun") === "1";
  const days = Number(url.searchParams.get("days")) || undefined;

  // Cron may only run the daily mode. Backfill / dryRun are owner-only.
  if (isCron) {
    if (mode !== "daily") {
      return NextResponse.json(
        { error: "cron may only run daily mode" },
        { status: 403 },
      );
    }
  } else {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
  }

  try {
    const result = await runReviewRequests({ mode, days, dryRun });
    console.log(
      `[review-requests] ${mode}${dryRun ? " (dry-run)" : ""} — scanned ${result.scanned}, eligible ${result.eligible}, alreadySent ${result.alreadySent}, sent ${result.sent}, failed ${result.failed}`,
    );
    return NextResponse.json({ ...result, triggered: isCron ? "cron" : "manual" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "run failed" },
      { status: 500 },
    );
  }
}
