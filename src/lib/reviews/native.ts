import "server-only";
import { desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, dbConfigured } from "@/lib/db/client";
import { productReviews } from "@/lib/db/schema";
import type { AmazonReview } from "./index";

// Every PDP render used to query Neon here, so search/AI crawlers walking the
// catalog kept the database awake around the clock and burned the free
// compute allowance (80% by Oct 15, 2026). A per-product 1h cache wasn't
// enough: crawlers visit ~1,900 different products, so the DB still woke all
// day (100% by Oct 19). Now ONE cached read loads every approved review for a
// day; approving/rejecting a review expires the tag at once (api/admin/review).
// Failures throw inside the cache so an outage is never cached as "no reviews".
export const NATIVE_REVIEWS_TAG = "native-reviews";

type ReviewsByHandle = Record<string, AmazonReview[]>;

async function readAllApprovedNativeReviews(): Promise<ReviewsByHandle> {
  const rows = await db()
    .select()
    .from(productReviews)
    .where(eq(productReviews.status, "approved"))
    .orderBy(desc(productReviews.approvedAt));
  const byHandle: ReviewsByHandle = {};
  for (const r of rows) {
    (byHandle[r.productHandle] ??= []).push({
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
    });
  }
  return byHandle;
}

const getAllApprovedNativeReviews = unstable_cache(
  readAllApprovedNativeReviews,
  ["native-reviews-all"],
  { tags: [NATIVE_REVIEWS_TAG], revalidate: 86400 },
);

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
    return (await getAllApprovedNativeReviews())[handle] ?? [];
  } catch (err) {
    console.error("[reviews/native] read failed:", err);
    return [];
  }
}
