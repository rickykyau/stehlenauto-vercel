import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Owner-role guard for /admin/* routes.
 *
 * Resolution order (first match wins):
 *   1. ADMIN_OWNER_USER_IDS env var (comma-separated Clerk user IDs)
 *   2. publicMetadata.role === "owner" on the Clerk user
 *   3. ADMIN_OWNER_EMAILS env var (comma-separated emails)
 *
 * Set up: in the Clerk dashboard, edit your user, set Public Metadata:
 *   { "role": "owner" }
 * OR add your Clerk user ID to ADMIN_OWNER_USER_IDS in Vercel env vars.
 */
function envList(name: string): Set<string> {
  const raw = process.env[name];
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type OwnerCheckResult =
  | { allowed: true; userId: string }
  | { allowed: false; reason: "unauthenticated" | "forbidden" };

export async function requireOwner(): Promise<OwnerCheckResult> {
  const { userId } = await auth();
  if (!userId) return { allowed: false, reason: "unauthenticated" };

  const allowedIds = envList("ADMIN_OWNER_USER_IDS");
  if (allowedIds.has(userId.toLowerCase())) {
    return { allowed: true, userId };
  }

  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: unknown } | undefined)?.role;
  if (typeof role === "string" && role.toLowerCase() === "owner") {
    return { allowed: true, userId };
  }

  const allowedEmails = envList("ADMIN_OWNER_EMAILS");
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (email && allowedEmails.has(email)) {
    return { allowed: true, userId };
  }

  return { allowed: false, reason: "forbidden" };
}
