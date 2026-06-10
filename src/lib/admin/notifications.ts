import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db/client";
import { notificationRecipients } from "@/lib/db/schema";

export type Recipient = {
  id: string;
  email: string;
  label: string | null;
  active: boolean;
  createdAt: Date;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(e: string): boolean {
  return EMAIL_RE.test(e.trim());
}

export async function listRecipients(): Promise<Recipient[]> {
  if (!dbConfigured) return [];
  return db()
    .select()
    .from(notificationRecipients)
    .orderBy(notificationRecipients.createdAt);
}

export async function listActiveEmails(): Promise<string[]> {
  if (!dbConfigured) return [];
  const rows = await db()
    .select({ email: notificationRecipients.email })
    .from(notificationRecipients)
    .where(eq(notificationRecipients.active, true));
  return rows.map((r) => r.email);
}

export async function addRecipient(
  email: string,
  label?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) return { ok: false, error: "Invalid email" };
  try {
    await db()
      .insert(notificationRecipients)
      .values({
        id: randomUUID(),
        email: clean,
        label: label?.trim() || null,
        active: true,
      })
      .onConflictDoUpdate({
        target: notificationRecipients.email,
        set: { active: true, label: label?.trim() || null },
      });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Insert failed" };
  }
}

export async function setRecipientActive(id: string, active: boolean): Promise<void> {
  await db()
    .update(notificationRecipients)
    .set({ active })
    .where(eq(notificationRecipients.id, id));
}

export async function removeRecipient(id: string): Promise<void> {
  await db().delete(notificationRecipients).where(eq(notificationRecipients.id, id));
}

// ── Order-alert email ──────────────────────────────────────────────────────

type ShopifyLineItem = { title?: string; quantity?: number; price?: string; variant_title?: string };
type ShopifyOrder = {
  name?: string;
  order_number?: number;
  total_price?: string;
  subtotal_price?: string;
  currency?: string;
  financial_status?: string;
  created_at?: string;
  customer?: { first_name?: string; last_name?: string; email?: string };
  email?: string;
  shipping_address?: { city?: string; province_code?: string; province?: string; country_code?: string };
  line_items?: ShopifyLineItem[];
  order_status_url?: string;
};

const ADMIN_BASE = "https://admin.shopify.com";

export function buildOrderAlertEmail(order: ShopifyOrder): { subject: string; html: string } {
  const num = order.name || (order.order_number ? `#${order.order_number}` : "(new order)");
  const cur = order.currency || "USD";
  const total = order.total_price ?? "0.00";
  const cust = order.customer;
  const name = [cust?.first_name, cust?.last_name].filter(Boolean).join(" ") || "Guest";
  const email = cust?.email || order.email || "";
  const addr = order.shipping_address;
  const loc = addr
    ? [addr.city, addr.province_code || addr.province, addr.country_code].filter(Boolean).join(", ")
    : "";
  const items = order.line_items ?? [];
  const itemCount = items.reduce((n, li) => n + (li.quantity ?? 1), 0);

  const rows = items
    .map(
      (li) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${
          li.quantity ?? 1
        }×</td><td style="padding:6px 10px;border-bottom:1px solid #eee;">${escapeHtml(
          li.title ?? "Item",
        )}${li.variant_title ? ` <span style="color:#888;">(${escapeHtml(li.variant_title)})</span>` : ""}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">${
          li.price ? `$${li.price}` : ""
        }</td></tr>`,
    )
    .join("");

  const subject = `🛒 New order ${num} — $${total} ${cur} — ${name}`;
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222;">
<div style="background:#0a0a0a;color:#f5a823;padding:16px 20px;font-weight:bold;font-size:18px;">STEHLEN AUTO · New Order Alert</div>
<div style="padding:20px;">
<h2 style="margin:0 0 4px;">${escapeHtml(num)} &middot; $${total} ${cur}</h2>
<p style="color:#666;margin:0 0 16px;">${itemCount} item${itemCount === 1 ? "" : "s"}${
    order.financial_status ? ` &middot; ${escapeHtml(order.financial_status)}` : ""
  }</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">${rows}</table>
<p style="margin:4px 0;"><strong>Customer:</strong> ${escapeHtml(name)}${email ? ` &lt;${escapeHtml(email)}&gt;` : ""}</p>
${loc ? `<p style="margin:4px 0;"><strong>Ship to:</strong> ${escapeHtml(loc)}</p>` : ""}
<p style="margin:18px 0 0;"><a href="${ADMIN_BASE}" style="display:inline-block;padding:10px 22px;background:#f5a823;color:#000;text-decoration:none;font-weight:bold;border-radius:4px;">Open in Shopify Admin</a></p>
</div>
<div style="padding:12px 20px;color:#999;font-size:12px;border-top:1px solid #eee;">Internal staff alert · manage recipients in /admin/notifications</div>
</body></html>`;
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
