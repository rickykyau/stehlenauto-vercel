import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db/client";
import { productReviews } from "@/lib/db/schema";
import type { AmazonReview } from "./index";

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
  } catch (err) {
    console.error("[reviews/native] read failed:", err);
    return [];
  }
}
