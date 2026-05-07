import "server-only";
import { requireOwner } from "@/lib/admin/guard";

/**
 * Cycle 14X+ post-sync (admin Option B): API-route auth for /api/admin/*.
 * Mirrors the page-level guard (`requireOwner`) so role / email-allowlist
 * resolution stays in one place.
 */
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const result = await requireOwner();
  if (!result.allowed) {
    if (result.reason === "unauthenticated") {
      return { ok: false, status: 401, error: "Sign in required" };
    }
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, userId: result.userId };
}
