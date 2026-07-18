import "server-only";
import { inArray } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db/client";
import { reviewRequestSends } from "@/lib/db/schema";
import { shopifyAdminFetch, shopifyAdminConfigured } from "@/lib/shopify/admin";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { buildReviewRequestEmail, type ReviewRequestItem } from "./request-email";

/**
 * Cycle 14BI-rev: post-purchase review-request sender.
 *
 * Finds fulfilled orders that are ready for a review ask, skips any already
 * emailed (review_request_sends), and sends one tokenized email per order.
 *
 *  - mode "daily":   orders fulfilled ~DELAY_DAYS ago (after the part has been
 *                    received + installed). A generous lower bound catches days
 *                    the cron missed; the sends table prevents double-asking.
 *  - mode "backfill": every fulfilled order in the last `days`, ignoring the
 *                    delay floor (past buyers installed long ago). Owner-run,
 *                    supports dryRun for a preflight.
 *
 * PAID, non-test orders with a customer email only. Fire-and-record is
 * sequential so a mid-run failure never marks an order sent that wasn't.
 */

const DELAY_DAYS = 10;
const DAILY_LOOKBACK_DAYS = 60; // don't cold-email ancient orders in daily mode
const MAX_PAGES = 20;

type OrderNode = {
  id: string;
  name: string;
  email: string | null;
  test: boolean;
  displayFinancialStatus: string;
  customer: { firstName: string | null; lastName: string | null; displayName: string | null } | null;
  fulfillments: { createdAt: string }[];
  lineItems: { nodes: { product: { handle: string; title: string; featuredImage: { url: string } | null } | null }[] };
};

const PAID = new Set(["PAID", "PARTIALLY_REFUNDED", "REFUNDED"]);

const ORDERS_QUERY = `
query($cursor: String, $q: String) {
  orders(first: 50, after: $cursor, query: $q, sortKey: CREATED_AT, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id name email test displayFinancialStatus
      customer { firstName lastName displayName }
      fulfillments(first: 10) { createdAt }
      lineItems(first: 50) {
        nodes { product { handle title featuredImage { url } } }
      }
    }
  }
}`;

function numericId(gid: string): string {
  // "gid://shopify/Order/5551212" → "5551212"
  return gid.split("/").pop() || gid;
}

function fulfilledAt(o: OrderNode): number | null {
  const times = o.fulfillments
    .map((f) => Date.parse(f.createdAt))
    .filter((t) => !Number.isNaN(t));
  return times.length ? Math.min(...times) : null;
}

export type SendPlan = {
  orderId: string;
  orderName: string;
  email: string;
  items: ReviewRequestItem[];
};

export type SendResult = {
  mode: "daily" | "backfill";
  dryRun: boolean;
  scanned: number;
  eligible: number;
  alreadySent: number;
  sent: number;
  failed: number;
  plans: SendPlan[];
  errors: { orderName: string; error: string }[];
};

export async function runReviewRequests(opts: {
  mode: "daily" | "backfill";
  days?: number;
  dryRun?: boolean;
  nowMs?: number;
}): Promise<SendResult> {
  const now = opts.nowMs ?? Date.now();
  const dryRun = !!opts.dryRun;
  if (!shopifyAdminConfigured) throw new Error("Shopify Admin not configured");
  if (!dbConfigured) throw new Error("Database not configured");

  const lookbackDays =
    opts.mode === "backfill" ? (opts.days ?? 90) : DAILY_LOOKBACK_DAYS;
  const createdFloor = new Date(now - lookbackDays * 86400_000)
    .toISOString()
    .slice(0, 10);
  const q = `fulfillment_status:fulfilled AND created_at:>=${createdFloor}`;

  // --- gather candidate orders ---
  const candidates: OrderNode[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: OrderNode[] } } =
      await shopifyAdminFetch(ORDERS_QUERY, { cursor, q });
    candidates.push(...data.orders.nodes);
    if (!data.orders.pageInfo.hasNextPage) break;
    cursor = data.orders.pageInfo.endCursor;
  }

  const delayCutoff = now - DELAY_DAYS * 86400_000;
  const result: SendResult = {
    mode: opts.mode,
    dryRun,
    scanned: candidates.length,
    eligible: 0,
    alreadySent: 0,
    sent: 0,
    failed: 0,
    plans: [],
    errors: [],
  };

  // --- filter to eligible plans ---
  const plans: SendPlan[] = [];
  for (const o of candidates) {
    if (o.test) continue;
    if (!o.email) continue;
    if (!PAID.has(o.displayFinancialStatus)) continue;
    const fa = fulfilledAt(o);
    if (fa == null) continue;
    // Daily mode enforces the "installed it" delay; backfill ignores it.
    if (opts.mode === "daily" && fa > delayCutoff) continue;

    const items: ReviewRequestItem[] = [];
    const seen = new Set<string>();
    for (const li of o.lineItems.nodes) {
      const p = li.product;
      if (!p || seen.has(p.handle)) continue;
      seen.add(p.handle);
      items.push({ handle: p.handle, title: p.title, imageUrl: p.featuredImage?.url ?? null });
    }
    if (items.length === 0) continue;

    plans.push({
      orderId: numericId(o.id),
      orderName: o.name,
      email: o.email,
      items,
    });
  }
  result.eligible = plans.length;

  // --- dedupe against already-sent ---
  const ids = plans.map((p) => p.orderId);
  const already = ids.length
    ? new Set(
        (
          await db()
            .select({ orderId: reviewRequestSends.orderId })
            .from(reviewRequestSends)
            .where(inArray(reviewRequestSends.orderId, ids))
        ).map((r) => r.orderId),
      )
    : new Set<string>();
  const toSend = plans.filter((p) => !already.has(p.orderId));
  result.alreadySent = plans.length - toSend.length;
  result.plans = toSend;

  if (dryRun) return result;

  // --- send + record, sequentially ---
  for (const plan of toSend) {
    try {
      const customerName =
        plan.items.length && candidatesName(candidates, plan.orderId);
      const email = buildReviewRequestEmail({
        orderId: plan.orderId,
        orderName: plan.orderName,
        customerEmail: plan.email,
        customerName: customerName || null,
        items: plan.items,
      });
      const send = await sendTransactionalEmail({
        to: plan.email,
        toName: customerName || undefined,
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: ["review-request", opts.mode],
      });
      if (!send.ok) {
        result.failed++;
        result.errors.push({ orderName: plan.orderName, error: send.error });
        continue;
      }
      await db()
        .insert(reviewRequestSends)
        .values({
          orderId: plan.orderId,
          orderName: plan.orderName,
          sentTo: plan.email,
        })
        .onConflictDoNothing();
      result.sent++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        orderName: plan.orderName,
        error: err instanceof Error ? err.message : "send failed",
      });
    }
  }

  return result;
}

function candidatesName(candidates: OrderNode[], orderId: string): string {
  const o = candidates.find((c) => numericId(c.id) === orderId);
  const c = o?.customer;
  return (
    c?.displayName ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    ""
  ).trim();
}
