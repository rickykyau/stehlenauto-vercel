import { NextResponse, type NextRequest } from "next/server";
import { createRefund, getOrderDetail } from "@/lib/admin/orders";
import { createDiscount } from "@/lib/admin/discounts";
import { sendEmail } from "@/lib/admin/email";
import { requireAdmin } from "../_auth";

export const runtime = "nodejs";

type ApologyInput = {
  enabled: boolean;
  percentage?: number; // 0-1, default 0.20
  expiresInDays?: number; // default 90
  customMessage?: string;
};

type RefundBody = Parameters<typeof createRefund>[0] & {
  apology?: ApologyInput;
};

function randomSuffix(len: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  let body: RefundBody;
  try {
    body = (await req.json()) as RefundBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.orderGid) {
    return NextResponse.json({ error: "orderGid required" }, { status: 400 });
  }

  // Step 1 — refund.
  let refundResult;
  try {
    refundResult = await createRefund(body);
    if ("error" in refundResult) {
      return NextResponse.json({ error: refundResult.error }, { status: 422 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed" },
      { status: 500 },
    );
  }

  // Step 2 (optional) — apology code + email.
  let apology: {
    code: string;
    percentage: number;
    expiresAt: string;
    emailSent: boolean;
    emailError?: string;
  } | null = null;

  if (body.apology?.enabled) {
    const percentage = Math.min(0.5, Math.max(0.05, body.apology.percentage ?? 0.2));
    const expiresInDays = Math.min(365, Math.max(7, body.apology.expiresInDays ?? 90));
    const code = `SORRY-${randomSuffix(6)}`;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    let order;
    try {
      order = await getOrderDetail(body.orderGid);
    } catch {
      order = null;
    }

    const discount = await createDiscount({
      title: `Service recovery — ${code}`,
      activation: "code",
      code,
      value: "percentage",
      percentage,
      appliesOncePerCustomer: true,
      usageLimit: 1,
      endsAt: expiresAt,
    });

    if ("error" in discount) {
      return NextResponse.json({
        ...refundResult,
        apology: {
          error: `Refund succeeded but apology code failed: ${discount.error}`,
        },
      });
    }

    let emailSent = false;
    let emailError: string | undefined;
    const customerEmail = order?.customer?.email;
    if (customerEmail) {
      const customerName = order?.customer?.firstName || "there";
      const orderName = order?.name ?? body.orderGid;
      const result = await sendEmail({
        to: customerEmail,
        subject: `An apology from Stehlen — code inside`,
        html: renderApologyHtml({
          customerName,
          orderName,
          code,
          percentage,
          expiresAt,
          customMessage: body.apology.customMessage,
        }),
      });
      if (result.sent) emailSent = true;
      else emailError = result.reason;
    } else {
      emailError = "Customer has no email on file";
    }

    apology = {
      code,
      percentage,
      expiresAt,
      emailSent,
      emailError,
    };
  }

  return NextResponse.json({ ...refundResult, apology });
}

function renderApologyHtml(args: {
  customerName: string;
  orderName: string;
  code: string;
  percentage: number;
  expiresAt: string;
  customMessage?: string;
}): string {
  const pct = Math.round(args.percentage * 100);
  const expiresLabel = new Date(args.expiresAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const safeCustom = (args.customMessage ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `
<!doctype html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table style="width:100%;background:#f5f5f5;padding:24px 0;"><tr><td align="center">
    <table style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
      <tr><td style="padding:28px;border-bottom:2px solid #f5a823;">
        <div style="font-size:11px;letter-spacing:0.16em;color:#737373;">STEHLEN AUTO</div>
        <h1 style="font-size:22px;margin:6px 0 0;color:#0a0a0a;">Hey ${args.customerName} — we owe you one.</h1>
      </td></tr>
      <tr><td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#0a0a0a;">
        <p>Something didn't go right with your order ${args.orderName} and we've issued you a refund. We're sorry — that's not the experience we want you to have with Stehlen.</p>
        ${safeCustom ? `<p>${safeCustom}</p>` : ""}
        <p>To make it right, here's <strong>${pct}% off your next order</strong> on us:</p>
        <div style="background:#0a0a0a;color:#f5a823;padding:18px;text-align:center;border-radius:8px;font-family:monospace;font-size:24px;letter-spacing:0.12em;font-weight:700;margin:16px 0;">
          ${args.code}
        </div>
        <p style="font-size:13px;color:#737373;">Valid through ${expiresLabel}. One-time use, applies once per customer.</p>
        <div style="text-align:center;margin-top:24px;">
          <a href="https://stehlenauto-vercel.vercel.app" style="display:inline-block;padding:12px 24px;background:#f5a823;color:#0a0a0a;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.04em;">SHOP NOW →</a>
        </div>
        <p style="margin-top:24px;font-size:13px;color:#737373;">If you have questions, just reply to this email — we read every one.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
