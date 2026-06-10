import "server-only";
import ExcelJS from "exceljs";
import { shopifyAdminFetch } from "@/lib/shopify/admin";
import shippingMap from "@/../data/cb-shipping-methods.json";

/**
 * Connected Business order-import file generator.
 *
 * Maps a Shopify order → the CB import .xlsx (one row per line item, header
 * row repeated columns) per data/stehlen website order template.xlsx.
 *
 * - SalesRepOrderCode  = "stehlen-" + order number (e.g. #1007 → stehlen-1007)
 * - item name          = product metafield cb_integration.item_name (lowercased)
 * - shipping method    = cached CB tbl_ShippingMethodUpdate lookup by item name
 *                        (data/cb-shipping-methods.json), default "UPS ground"
 *   (web app has no live CB connection — refresh via
 *    scripts/refresh-cb-shipping-methods.py)
 */

const SHIP_MAP = shippingMap as Record<string, string>;
const DEFAULT_SHIPPING = "UPS ground";

// Exact header order from the CB template (row 1).
const HEADERS = [
  "SalesRepOrderCode",
  "StoreMerchantID_DEV000221",
  "po code",
  "bill to code",
  "ship to",
  "ship to address",
  "ship to city",
  "ship to state",
  "ship to postal",
  "customer Phone number",
  "ship to country",
  "order date",
  "payment term",
  "shipping method",
  "source",
  "ship date",
  "item name",
  "quantity",
  "price",
  "Freight",
  "tax",
  "discount",
  "RCV",
  "PaymentType",
  "CheckNumber",
  "FreightAccountOverride_DEV000081",
] as const;

type Money = { shopMoney: { amount: string } };
type OrderResp = {
  order: {
    name: string;
    createdAt: string;
    customer: { firstName: string | null; lastName: string | null; phone: string | null } | null;
    shippingAddress: {
      name: string | null;
      address1: string | null;
      address2: string | null;
      city: string | null;
      provinceCode: string | null;
      zip: string | null;
      phone: string | null;
      country: string | null;
    } | null;
    lineItems: {
      nodes: {
        title: string;
        sku: string | null;
        quantity: number;
        originalUnitPriceSet: Money;
        variant: { product: { metafield: { value: string } | null } | null } | null;
      }[];
    };
  } | null;
};

const ORDER_QUERY = /* GraphQL */ `
  query CbImportOrder($id: ID!) {
    order(id: $id) {
      name
      createdAt
      customer { firstName lastName phone }
      shippingAddress {
        name address1 address2 city provinceCode zip phone country
      }
      lineItems(first: 100) {
        nodes {
          title
          sku
          quantity
          originalUnitPriceSet { shopMoney { amount } }
          variant {
            product {
              metafield(namespace: "cb_integration", key: "item_name") { value }
            }
          }
        }
      }
    }
  }
`;

function fmtDate(iso: string): string {
  // CB template format: "YYYY-MM-DD 00:00:00"
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} 00:00:00`;
}

type Row = Record<(typeof HEADERS)[number], string | number>;

// Fetch one order and map it to CB import rows (one per line item).
async function fetchOrderRows(
  orderGid: string,
): Promise<{ rows: Row[]; missing: string[]; orderNumber: string } | { error: string }> {
  let data: OrderResp;
  try {
    data = await shopifyAdminFetch<OrderResp>(ORDER_QUERY, { id: orderGid });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Shopify fetch failed" };
  }
  const o = data.order;
  if (!o) return { error: `Order not found: ${orderGid}` };

  const orderNumber = o.name.replace(/^#/, "").trim();
  const salesRepOrderCode = `stehlen-${orderNumber}`;
  const orderDate = fmtDate(o.createdAt);
  const addr = o.shippingAddress;
  const shipToName =
    addr?.name ||
    [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(" ") ||
    "";
  const phone = addr?.phone || o.customer?.phone || "";

  const missing: string[] = [];
  const rows = o.lineItems.nodes.map((li) => {
    const cbName = (li.variant?.product?.metafield?.value || li.sku || "").trim().toLowerCase();
    if (!cbName) missing.push(`${salesRepOrderCode}: ${li.title}`);
    const shipping = (cbName && SHIP_MAP[cbName]) || DEFAULT_SHIPPING;
    return {
      SalesRepOrderCode: salesRepOrderCode,
      StoreMerchantID_DEV000221: "GT-website",
      "po code": "",
      "bill to code": "",
      "ship to": shipToName,
      "ship to address": [addr?.address1, addr?.address2].filter(Boolean).join(" "),
      "ship to city": addr?.city || "",
      "ship to state": addr?.provinceCode || "",
      "ship to postal": addr?.zip || "",
      "customer Phone number": phone,
      "ship to country": "united states",
      "order date": orderDate,
      "payment term": "stehlen shopify",
      "shipping method": shipping,
      source: "website",
      "ship date": orderDate,
      "item name": cbName,
      quantity: li.quantity,
      price: Math.round(Number(li.originalUnitPriceSet?.shopMoney?.amount ?? 0) * 100) / 100,
      Freight: 0,
      tax: "",
      discount: "",
      RCV: 1,
      PaymentType: "stehlen shopify",
      CheckNumber: "",
      FreightAccountOverride_DEV000081: "",
    } as Row;
  });
  return { rows, missing, orderNumber };
}

async function workbookBuffer(rows: Row[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orders");
  ws.addRow([...HEADERS]);
  for (const r of rows) ws.addRow(HEADERS.map((h) => r[h]));
  // Force the price column to always show 2 decimals (e.g. 132.00).
  ws.getColumn(HEADERS.indexOf("price") + 1).numFmt = "0.00";
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export type CbImportResult =
  | { ok: true; filename: string; buffer: Buffer; rowCount: number; orderCount: number; missingItemName: string[] }
  | { ok: false; error: string };

/** Single order → .xlsx (used by the order detail page). */
export async function buildCbImportWorkbook(orderGid: string): Promise<CbImportResult> {
  const res = await fetchOrderRows(orderGid);
  if ("error" in res) return { ok: false, error: res.error };
  return {
    ok: true,
    filename: `stehlen-${res.orderNumber}.xlsx`,
    buffer: await workbookBuffer(res.rows),
    rowCount: res.rows.length,
    orderCount: 1,
    missingItemName: res.missing,
  };
}

/** Multiple orders → one combined .xlsx (used by the orders-list bulk export). */
export async function buildCbImportWorkbookMulti(orderGids: string[]): Promise<CbImportResult> {
  if (orderGids.length === 0) return { ok: false, error: "No orders selected" };
  const all: Row[] = [];
  const missing: string[] = [];
  for (const gid of orderGids) {
    const res = await fetchOrderRows(gid);
    if ("error" in res) return { ok: false, error: res.error };
    all.push(...res.rows);
    missing.push(...res.missing);
  }
  const stamp = fmtDate(new Date().toISOString()).slice(0, 10);
  return {
    ok: true,
    filename: `stehlen-cb-import-${orderGids.length}orders-${stamp}.xlsx`,
    buffer: await workbookBuffer(all),
    rowCount: all.length,
    orderCount: orderGids.length,
    missingItemName: missing,
  };
}
