/**
 * Client-side hint for "is a Clerk session present?" so signed-out shoppers
 * don't fire calls that can only 401. Clerk keeps `__client_uat=0` (or no
 * cookie) for signed-out browsers and a non-zero timestamp plus `__session`
 * once signed in. A hint only: the API still enforces auth.
 */
export function hasSignedInCookie(): boolean {
  if (typeof document === "undefined") return false;
  const c = document.cookie;
  if (!/(?:^|;\s*)__session=/.test(c)) return false;
  const uat = c.match(/(?:^|;\s*)__client_uat(?:_[^=]+)?=(\d+)/);
  return !uat || uat[1] !== "0";
}
