// One-off, idempotent: add verified-purchase columns to product_reviews and
// create review_request_sends — WITHOUT a full drizzle-kit reconcile (db:push
// wants to truncate notification_recipients over unrelated pre-existing drift).
// All guards are IF NOT EXISTS — safe to re-run, touches nothing else.
// Run: node scripts/add-review-collection-columns.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.split("=")
  .slice(1)
  .join("=")
  .trim()
  .replace(/^["']|["']$/g, "");
if (!url) throw new Error("DATABASE_URL not found in .env.local");

const sql = neon(url);

// Verified-purchase provenance on existing native reviews table.
await sql`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false`;
await sql`ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id text`;

// One review-request email per order.
await sql`
  CREATE TABLE IF NOT EXISTS review_request_sends (
    order_id text PRIMARY KEY,
    order_name text NOT NULL,
    sent_to text NOT NULL,
    sent_at timestamp NOT NULL DEFAULT now()
  )`;

const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'product_reviews' AND column_name IN ('verified','order_id')
  ORDER BY column_name`;
const tbl = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_name = 'review_request_sends'`;
console.log("product_reviews new columns:", cols.map((r) => r.column_name).join(", ") || "(none)");
console.log("review_request_sends table:", tbl.length ? "present" : "MISSING");
