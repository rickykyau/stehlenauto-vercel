// One-off: create the two abandoned-cart tables WITHOUT a full drizzle-kit
// reconcile (push wanted to truncate notification_recipients over an unrelated
// pre-existing constraint drift). IF NOT EXISTS — safe to re-run, touches
// nothing else. Run: node scripts/create-abandoned-cart-tables.mjs
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

await sql`
  CREATE TABLE IF NOT EXISTS archived_carts (
    checkout_id text PRIMARY KEY,
    archived_by text NOT NULL,
    archived_at timestamp NOT NULL DEFAULT now()
  )`;
await sql`
  CREATE TABLE IF NOT EXISTS abandoned_cart_sends (
    checkout_id text PRIMARY KEY,
    sent_by text NOT NULL,
    sent_to text NOT NULL,
    sent_at timestamp NOT NULL DEFAULT now()
  )`;

const rows = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('archived_carts','abandoned_cart_sends')
  ORDER BY table_name`;
console.log("Tables present:", rows.map((r) => r.table_name).join(", "));
