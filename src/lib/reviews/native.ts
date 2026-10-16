import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, dbConfigured } from "@/lib/db/client";
import { productReviews } from "@/lib/db/schema";
import type { AmazonReview } from "./index";

// Every PDP render used to query Neon here, so search/AI crawlers walking the
// catalog kept the database awake around the clock and burned the free
// compute allowance (80% by Oct 15, 2026). Cache per product for an hour;
// approving/rejecting a review clears its tag at once (api/admin/review).
// Failures throw inside the cache so an outage is never cached as "no reviews".
export const nativeReviewsTag = (handle: string) => `native-reviews:${handle}`;

async function readApprovedNativeReviews(handle: string): Promise<AmazonReview[]> {
  const rows = await db()
    .select()
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productHandle, handle),
        eq(productReviews.status, "approved"),
      ),
    )
    .orderBy(desc(productReviews.approvedAt));
  return rows.map((r) => ({
    id: r.id,
    stars: r.stars,
    title: r.title,
    body: r.body,
    reviewer: r.authorName,
    date: (r.approvedAt ?? r.createdAt).toISOString().slice(0, 10),
    verified: r.verified,
    helpful_votes: 0,
    images: [],
    source: "customer" as const,
  }));
}

/**
 * Cycle 14BI: approved native (customer-submitted) reviews for a handle,
 * mapped into the shared AmazonReview shape so the PDP review surface can
 * render them alongside imported Amazon reviews. Only `approved` rows are
 * returned — pending/rejected never reach the storefront (FTC + spam).
 * Cycle 14BI-rev: reviews submitted via a post-purchase request email carry a
 * validated order token, so `verified` reflects the real column now (not a
 * hardcoded false). source:"customer" either way for accurate disclosure.
 */
export async function getApprovedNativeReviews(
  handle: string | null | undefined,
): Promise<AmazonReview[]> {
  if (!handle || !dbConfigured) return [];
  try {
    return await unstable_cache(readApprovedNativeReviews, ["native-reviews"], {
      tags: [nativeReviewsTag(handle)],
      revalidate: 3600,
    })(handle);
  } catch (err) {
    console.error("[reviews/native] read failed:", err);
    return [];
  }
}
