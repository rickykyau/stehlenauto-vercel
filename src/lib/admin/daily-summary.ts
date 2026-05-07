import "server-only";
import { summarizeOrdersInRange } from "@/lib/admin/orders";
import { listAbandonedCarts } from "@/lib/admin/abandoned-carts";
import { listLowStock } from "@/lib/admin/inventory";

/**
 * Cycle 14X+ post-sync (admin Tier A): compile yesterday's snapshot
 * for the daily summary email. Pulls only the highest-leverage signals
 * — what made money, what didn't ship, what's running low. Designed
 * for a 30-second skim with the morning coffee.
 */

export type DailySummary = {
  yesterday: {
    isoDate: string; // "2026-05-06"
    label: string; // "Wed, May 06"
  };
  orders: {
    count: number;
    revenue: number;
    refunded: number;
    newCustomers: number;
    topItems: { title: string; quantity: number }[];
  };
  abandoned: {
    count: number;
    value: number;
    withEmail: number;
  };
  inventory: {
    out: number;
    low: number;
    sample: { title: string; qty: number; sku: string | null }[];
  };
};

export async function buildDailySummary(): Promise<DailySummary> {
  const now = new Date();
  // Yesterday in UTC (same convention as Shopify created_at).
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const isoDate = start.toISOString().slice(0, 10);
  const label = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });

  const [orderSum, abandoned, lowStock] = await Promise.all([
    summarizeOrdersInRange({
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    }).catch(() => ({
      count: 0,
      revenue: 0,
      refunded: 0,
      newCustomers: 0,
      topItems: [] as { title: string; quantity: number }[],
    })),
    listAbandonedCarts({ pageSize: 50 }).catch(() => ({
      items: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    })),
    listLowStock({ threshold: 5, maxItems: 50 }).catch(() => ({
      items: [],
      totalScanned: 0,
      threshold: 5,
      truncated: false,
    })),
  ]);

  const recentAbandoned = abandoned.items.filter((c) => {
    const age = Date.now() - new Date(c.createdAt).getTime();
    return age <= 24 * 60 * 60 * 1000;
  });

  const out = lowStock.items.filter((i) => i.status === "OUT").length;
  const low = lowStock.items.filter((i) => i.status === "LOW").length;
  const sample = lowStock.items.slice(0, 5).map((i) => ({
    title: i.productTitle,
    qty: i.quantity,
    sku: i.sku,
  }));

  return {
    yesterday: { isoDate, label },
    orders: orderSum,
    abandoned: {
      count: recentAbandoned.length,
      value: recentAbandoned.reduce(
        (acc, c) => acc + parseFloat(c.totalPrice || "0"),
        0,
      ),
      withEmail: recentAbandoned.filter((c) => c.email).length,
    },
    inventory: { out, low, sample },
  };
}

export function renderDailySummaryHtml(s: DailySummary): string {
  const fmtUSD = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
  const tone = s.orders.count > 0 ? "#16a34a" : "#737373";

  const rows = (entries: [string, string, string?][]) =>
    entries
      .map(
        ([label, value, hint]) => `
      <tr>
        <td style="padding:8px 0;font-size:12px;color:#737373;letter-spacing:0.08em;text-transform:uppercase;">${label}</td>
        <td style="padding:8px 0;font-size:18px;font-weight:600;color:#0a0a0a;text-align:right;">${value}</td>
        ${hint ? `<td style="padding:8px 0 8px 12px;font-size:11px;color:#737373;text-align:right;">${hint}</td>` : ""}
      </tr>`,
      )
      .join("");

  const topItems = s.orders.topItems.length
    ? `
    <h3 style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#737373;margin:24px 0 8px;">Top items sold</h3>
    <ol style="font-size:13px;line-height:1.7;color:#0a0a0a;padding-left:18px;margin:0;">
      ${s.orders.topItems.map((i) => `<li>${escape(i.title)} <span style="color:#737373;">× ${i.quantity}</span></li>`).join("")}
    </ol>`
    : "";

  const lowSample = s.inventory.sample.length
    ? `
    <h3 style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#737373;margin:24px 0 8px;">Low / out of stock</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${s.inventory.sample
        .map(
          (i) => `
        <tr>
          <td style="padding:6px 0;color:#0a0a0a;">${escape(i.title)}</td>
          <td style="padding:6px 0;text-align:right;color:${i.qty <= 0 ? "#dc2626" : "#f5a823"};font-weight:600;">${i.qty}</td>
        </tr>`,
        )
        .join("")}
    </table>`
    : "";

  return `
<!doctype html>
<html><head><meta charset="utf-8"><title>Stehlen daily summary — ${escape(s.yesterday.label)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table style="width:100%;background:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="padding:24px 28px;border-bottom:2px solid ${tone};">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#737373;">STEHLEN · DAILY SUMMARY</div>
          <h1 style="font-size:22px;margin:6px 0 0;color:#0a0a0a;">${escape(s.yesterday.label)}</h1>
        </td></tr>

        <tr><td style="padding:20px 28px;">
          <h2 style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#737373;margin:0 0 8px;">Orders</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${rows([
              ["Revenue", fmtUSD(s.orders.revenue)],
              ["Orders", fmtInt(s.orders.count)],
              ["New customers", fmtInt(s.orders.newCustomers)],
              ["Refunded", fmtUSD(s.orders.refunded)],
            ])}
          </table>
          ${topItems}
        </td></tr>

        <tr><td style="padding:0 28px 20px;border-top:1px solid #e5e5e5;padding-top:20px;">
          <h2 style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#737373;margin:0 0 8px;">Open opportunities</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${rows([
              ["Abandoned carts (last 24h)", fmtInt(s.abandoned.count), `${fmtUSD(s.abandoned.value)} pending`],
              ["With email on file", fmtInt(s.abandoned.withEmail), "ready to recover"],
              ["Out of stock", fmtInt(s.inventory.out), "active SKUs"],
              ["Low stock", fmtInt(s.inventory.low), `≤ 5 units`],
            ])}
          </table>
          ${lowSample}
        </td></tr>

        <tr><td style="padding:16px 28px;border-top:1px solid #e5e5e5;background:#fafafa;text-align:center;">
          <a href="https://stehlenauto-vercel.vercel.app/admin" style="display:inline-block;padding:10px 18px;background:#f5a823;color:#0a0a0a;font-weight:700;font-size:12px;letter-spacing:0.08em;text-decoration:none;border-radius:6px;">OPEN ADMIN DASHBOARD →</a>
        </td></tr>
      </table>
      <p style="font-size:11px;color:#a3a3a3;margin:16px 0 0;">Sent automatically each morning. Reply to disable.</p>
    </td></tr>
  </table>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
