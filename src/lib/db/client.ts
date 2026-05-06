import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
export const dbConfigured = Boolean(url);

let _db: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (!_db) {
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Database operations are unavailable.",
      );
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
