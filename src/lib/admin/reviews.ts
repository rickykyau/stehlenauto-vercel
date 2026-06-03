import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db/client";
import { productReviews, type ProductReview } from "@/lib/db/schema";
import reviewData from "@/../data/amazon-reviews.json";

export type ReviewStatus = "pending" | "approved" | "rejected";
export const REVIEW_STATUSES: ReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
];

export type StatusCounts = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

/** Counts by moderation status — drives the sidebar badge + page tabs. */
export async function countNativeReviewsByStatus(): Promise<StatusCounts> {
  const empty = { pending: 0, approved: 0, rejected: 0, total: 0 };
  if (!dbConfigured) return empty;
  try {
    const rows = await db()
      .select({
        status: productReviews.status,
        n: sql<number>`count(*)::int`,
      })
      .from(productReviews)
      .groupBy(productReviews.status);
    const out = { ...empty };
    for (const r of rows) {
      const n = Number(r.n) || 0;
      if (r.status === "pending") out.pending = n;
      else if (r.status === "approved") out.approved = n;
      else if (r.status === "rejected") out.rejected = n;
      out.total += n;
    }
    return out;
  } catch (err) {
    console.error("[admin/reviews] count failed:", err);
    return empty;
  }
}

/** Native submissions for the moderation table, newest first. */
export async function listNativeReviews(opts: {
  status?: ReviewStatus | "all";
  handle?: string | null;
  limit?: number;
}): Promise<ProductReview[]> {
  if (!dbConfigured) return [];
  const { status = "pending", handle, limit = 100 } = opts;
  try {
    const conds = [];
    if (status !== "all") conds.push(eq(productReviews.status, status));
    if (handle) conds.push(eq(productReviews.productHandle, handle));
    return await db()
      .select()
      .from(productReviews)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(productReviews.createdAt))
      .limit(limit);
  } catch (err) {
    console.error("[admin/reviews] list failed:", err);
    return [];
  }
}

/** Approve / reject / re-pend a single review. */
export async function setReviewStatus(
  id: string,
  status: ReviewStatus,
): Promise<{ ok: boolean; handle?: string }> {
  if (!dbConfigured) return { ok: false };
  try {
    const rows = await db()
      .update(productReviews)
      .set({
        status,
        approvedAt: status === "approved" ? new Date() : null,
      })
      .where(eq(productReviews.id, id))
      .returning({ handle: productReviews.productHandle });
    return { ok: rows.length > 0, handle: rows[0]?.handle };
  } catch (err) {
    console.error("[admin/reviews] update failed:", err);
    return { ok: false };
  }
}

// ── Imported (Amazon) bundles — read-only at runtime ─────────────────────
// Managed by the ingest pipeline (scripts/ingest-amazon-reviews*, regenerates
// data/amazon-reviews.json at build time). Surfaced here so the owner can see
// what's live without leaving the admin.
export type ImportedBundleRow = {
  handle: string;
  asin: string;
  amazonTitle: string;
  avg: number;
  count: number;
};

type Manifest = {
  generated_at: string;
  source: string;
  by_handle: Record<
    string,
    {
      handle: string;
      asin: string;
      amazon_title: string;
      avg_rating: number;
      review_count: number;
    }
  >;
};

export function listImportedBundles(): {
  generatedAt: string;
  source: string;
  rows: ImportedBundleRow[];
  totalReviews: number;
} {
  const m = reviewData as Manifest;
  const rows = Object.values(m.by_handle)
    .map((b) => ({
      handle: b.handle,
      asin: b.asin,
      amazonTitle: b.amazon_title,
      avg: b.avg_rating,
      count: b.review_count,
    }))
    .sort((a, b) => b.count - a.count);
  return {
    generatedAt: m.generated_at,
    source: m.source,
    rows,
    totalReviews: rows.reduce((s, r) => s + r.count, 0),
  };
}
