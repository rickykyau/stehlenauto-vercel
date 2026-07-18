import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { productReviews } from "@/lib/db/schema";
import { getCurrentVehicle } from "@/lib/garage/server";
import { verifyReviewToken } from "@/lib/reviews/token";
import crypto from "node:crypto";

export const runtime = "nodejs";

/**
 * Cycle 14BG: native review submission. Lands in `pending` status —
 * admin must approve before it shows on the PDP (FTC compliance,
 * spam control). PDP renders ONLY `approved` reviews.
 *
 * Cycle 14BI-rev: an optional signed `token` (from the post-purchase review
 * request email) proves the submitter bought THIS product on a real order.
 * When it validates against the submitted handle, the review is stamped
 * verified-purchase and the author email is pinned to the token's email
 * (can't be spoofed). No token → an ordinary unverified submission, unchanged.
 *
 * Validation:
 * - stars ∈ [1, 5]
 * - title 4-100 chars
 * - body 20-2000 chars
 * - authorName 2-60 chars
 * - authorEmail well-formed
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const productHandle = String(body.productHandle ?? "").trim();
  const stars = Number(body.stars);
  const title = String(body.title ?? "").trim();
  const reviewBody = String(body.body ?? "").trim();
  const authorName = String(body.authorName ?? "").trim();
  let authorEmail = String(body.authorEmail ?? "").trim().toLowerCase();

  if (!productHandle) {
    return NextResponse.json({ error: "missing_handle" }, { status: 400 });
  }

  // Verified-purchase path: a valid token whose signed handle matches this
  // product grants verified status. Mismatched/expired/forged tokens are
  // simply ignored (fall through to an unverified submission) rather than
  // rejected — a stale link should still let an honest buyer leave a review.
  const grant = verifyReviewToken(
    typeof body.token === "string" ? body.token : null,
  );
  const verifiedGrant =
    grant && grant.handle === productHandle ? grant : null;
  // Pin the author email to the token so a verified badge can't be attached
  // to an arbitrary address.
  if (verifiedGrant) authorEmail = verifiedGrant.email;
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "invalid_stars" }, { status: 400 });
  }
  if (title.length < 4 || title.length > 100) {
    return NextResponse.json({ error: "invalid_title" }, { status: 400 });
  }
  if (reviewBody.length < 20 || reviewBody.length > 2000) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (authorName.length < 2 || authorName.length > 60) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const { userId } = await auth();
  const vehicle = await getCurrentVehicle().catch(() => null);

  const id = crypto.randomBytes(12).toString("base64url");

  try {
    await db().insert(productReviews).values({
      id,
      productHandle,
      userId: userId ?? null,
      authorName,
      authorEmail,
      vehicleYear: vehicle?.year ?? null,
      vehicleMake: vehicle?.make ?? null,
      vehicleModel: vehicle?.model ?? null,
      stars,
      title,
      body: reviewBody,
      status: "pending",
      verified: !!verifiedGrant,
      orderId: verifiedGrant?.orderId ?? null,
    });
  } catch (err) {
    console.error("[reviews] insert failed:", err);
    return NextResponse.json(
      { error: "persist_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id });
}
