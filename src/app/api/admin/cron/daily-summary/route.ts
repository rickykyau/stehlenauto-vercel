import { NextResponse, type NextRequest } from "next/server";
import {
  buildDailySummary,
  renderDailySummaryHtml,
} from "@/lib/admin/daily-summary";
import { ownerEmails, sendEmail } from "@/lib/admin/email";
import { requireAdmin } from "../../_auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Two ways to invoke:
 *   - GET from Vercel Cron, with `Authorization: Bearer <CRON_SECRET>` header
 *   - GET from owner browser (?manual=1) for ad-hoc test sends; gated by
 *     requireAdmin (Clerk owner role / email allowlist)
 */

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCron = Boolean(
    cronSecret && authHeader === `Bearer ${cronSecret}`,
  );

  if (!isCron) {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
  }

  const recipients = ownerEmails();
  if (recipients.length === 0) {
    return NextResponse.json(
      {
        error:
          "No recipients. Set ADMIN_OWNER_EMAILS env var (comma-separated).",
      },
      { status: 400 },
    );
  }

  let summary;
  try {
    summary = await buildDailySummary();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build failed" },
      { status: 500 },
    );
  }

  const html = renderDailySummaryHtml(summary);
  const subject = `Stehlen daily — ${summary.yesterday.label} · $${summary.orders.revenue.toFixed(2)} (${summary.orders.count})`;

  const result = await sendEmail({ to: recipients, subject, html });
  if (!result.sent) {
    return NextResponse.json(
      { error: result.reason, summary },
      { status: 502 },
    );
  }

  return NextResponse.json({
    sent: true,
    id: result.id,
    recipients,
    summary,
    triggered: isCron ? "cron" : "manual",
  });
}
