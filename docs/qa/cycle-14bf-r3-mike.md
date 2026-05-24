# Cycle 14BF R3 — Mike Re-Rate (Final)

**Verdict: 8/10/9** (was 8/9/9 in R2)

Date: 2026-05-24 · Tester: Mike Rodriguez · Environment: http://localhost:3037

---

## Fix Verifications

### Wishlist sign-in nudge — PARTIAL PASS
Toast fires on first anonymous heart click. Bottom-right. Correct message: "SAVED TO YOUR WISHLIST — Sign in to keep your saves across all your devices." "SIGN IN" and "DON'T SHOW AGAIN" both visible. 8s auto-dismiss confirmed.

**Two bugs found:**
1. "DON'T SHOW AGAIN" not in DOM / a11y tree — keyboard users + screen readers can't reach it
2. Auto-dismiss silently set suppression after 2 ignored toasts (re-engagement hook killed)

### Recently-viewed strip — PASS
With 2 PDPs in history: 4-column row shows 2 real cards + 2 dashed "+ Discover more" tiles. Looks intentional.

### Track-order — confirmed FIXED (bonus)
Form renders without redirect to sign-in. "No account needed" copy now accurate. Returning customer job clears.

---

## Final Ratings Table

| Job | R1 | R2 | R3 | Last point blocker |
|---|---|---|---|---|
| New customer | 8 | 8 | **8** | Real PDP reviews still missing |
| Returning customer | 7 | 9 | **10** | Cleared |
| Browser | 8 | 9 | **9** | "Don't show again" not a11y-accessible + auto-dismiss = suppression bug |

---

## Specific Blockers

**New customer (8):** No real customer reviews on PDP buy box for most products. Star rating + review count = the social proof gap. Comparing two covers leaves nothing but spec tables to go on.

**Browser (9):** "Don't show again" renders visually but not reachable via keyboard / screen reader. 8s auto-dismiss silently sets the suppression flag — a power browser who ignores two toasts never gets nudged again.

---

Mike's verdict: returning customer hit 10/10 with track-order finally working + recently-viewed padded — real progress; new customer stuck at 8 needs the review density problem solved, and browser stays at 9 because the toast is a ghost for keyboard users.
