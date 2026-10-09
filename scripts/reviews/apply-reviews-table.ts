/**
 * Cycle 14BG: apply product_reviews CREATE TABLE directly to Neon.
 * drizzle-kit push requires a TTY for confirmation; this script is
 * non-interactive. Idempotent via `IF NOT EXISTS`.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS "product_reviews" (
      "id" text PRIMARY KEY NOT NULL,
      "product_handle" text NOT NULL,
      "user_id" text,
      "author_name" text NOT NULL,
      "author_email" text NOT NULL,
      "vehicle_year" text,
      "vehicle_make" text,
      "vehicle_model" text,
      "stars" integer NOT NULL,
      "title" text NOT NULL,
      "body" text NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "approved_at" timestamp
    )
  `;

  const rows = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'product_reviews'
    ORDER BY ordinal_position
  `;

  console.log("product_reviews columns:");
  for (const r of rows) console.log("  ", r.column_name, "·", r.data_type);

  const count = await sql`SELECT COUNT(*)::int AS n FROM product_reviews`;
  console.log("existing rows:", count[0].n);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
