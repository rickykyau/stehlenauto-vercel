import "server-only";
import { db, dbConfigured } from "@/lib/db/client";
import { searchMisses } from "@/lib/db/schema";

export type LogSearchMissInput = {
  query: string;
  source?: "suggest" | "search-page";
  vehicle?: {
    id?: string | null;
    make?: string | null;
    model?: string | null;
    year?: string | number | null;
  } | null;
};

/**
 * Best-effort, never-throws insert so a logging failure can't take down the
 * customer's search request. Owner reads aggregates from /admin/sourcing-gaps.
 */
export async function logSearchMiss(input: LogSearchMissInput): Promise<void> {
  if (!dbConfigured) return;
  const q = input.query.trim();
  if (q.length < 2 || q.length > 200) return;
  try {
    await db()
      .insert(searchMisses)
      .values({
        id: crypto.randomUUID(),
        query: q.toLowerCase(),
        source: input.source ?? "suggest",
        vehicleId: input.vehicle?.id ?? null,
        vehicleMake: input.vehicle?.make ?? null,
        vehicleModel: input.vehicle?.model ?? null,
        vehicleYear:
          input.vehicle?.year != null ? String(input.vehicle.year) : null,
      });
  } catch (err) {
    console.error("[admin/search-misses] log failed (non-fatal):", err);
  }
}
