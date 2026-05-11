import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { VehiclePill, type Vehicle } from "@/components/ui/vehicle-pill";
import { Icons } from "@/components/ui/icons";
import { AnnouncementBar } from "./announcement-bar";
import { MegaNav } from "./mega-nav";
import { MobileMenu } from "./mobile-menu";
import { CartTrigger } from "@/components/cart/cart-trigger";
import { CartBadgeLive } from "./cart-badge-live";
import { HeaderSearch } from "@/components/search/header-search";
import { YmmButton } from "@/components/fitment/ymm-button";

export function Header({
  vehicle,
  cartCount = 0,
  signedInLabel = null,
}: {
  vehicle?: Vehicle;
  cartCount?: number;
  /**
   * Cycle 14AP-fix16 (owner): when truthy, the customer is signed in
   * via Clerk and we render an explicit "SIGNED IN AS X" badge in the
   * header so the auth state is visible. When null, render a "SIGN IN"
   * button instead. Owner had no idea they were signed in because the
   * header showed nothing — only a plain GARAGE icon link.
   */
  signedInLabel?: string | null;
}) {
  return (
    <header>
      <AnnouncementBar />

      {/* Mobile chrome */}
      <div className="block md:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            gap: 12,
          }}
        >
          <MobileMenu />
          {/* Cycle 14Z (Mike-O5 NF-3): logo link was 20px tall — far below
              44px tap target. Wrap with min-height + flex centering. */}
          <Link
            href="/"
            aria-label="Stehlen Auto home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 4px",
            }}
          >
            <Logo height={20} priority />
          </Link>
          {/* Cycle 14b (Mike F-4): mobile header icon buttons used to be
              padding:0 → 20px tap targets. Apple HIG / WCAG floor is 44px.
              Centered the icons inside 44×44 touch zones so they can be
              accurately tapped on a phone in a parking lot with gloves. */}
          <div style={{ display: "flex", gap: 4 }}>
            <Link
              href="/search"
              aria-label="Search"
              style={{
                color: "var(--color-foreground)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                margin: -8,
              }}
            >
              <Icons.search size={20} />
            </Link>
            <CartTrigger
              ariaLabel="Cart"
              style={{
                background: "transparent",
                border: 0,
                color: "var(--color-foreground)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                margin: -8,
                position: "relative",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Icons.cart size={20} />
              {cartCount > 0 && <CartBadge count={cartCount} top={2} right={4} />}
            </CartTrigger>
          </div>
        </div>
        <div
          style={{
            padding: "8px 16px 12px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {/* Cycle 14AW-fix2 (Jordan NIT-1): mobile vehicle pill measured
              40px height — 4px below the 44px WCAG/HIG floor. This is the
              primary vehicle-set CTA on mobile; missing it by 4px is
              wrong for the most-tapped control on the page. Bumping to
              44 doesn't break the mobile header layout (full-width pill,
              padding stays unchanged). */}
          <YmmButton
            ariaLabel={vehicle ? "Change vehicle" : "Select your vehicle"}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 44,
              padding: "0 12px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-foreground)",
              cursor: "pointer",
            }}
          >
            {vehicle ? (
              <>
                {/* Cycle 14AE (Mike-O14AE NW-2 FAIL): the 14AD/AE fix
                    only changed components/ui/vehicle-pill.tsx — but
                    the desktop header has its OWN inline vehicle pill
                    that was still rendering green. Fix the source of
                    the green dot here too. Match sidebar + VehiclePill:
                    neutral muted-grey, no fit claim. */}
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-muted)",
                  }}
                />
                <span
                  className="mono"
                  style={{ fontSize: 11, letterSpacing: "0.08em" }}
                >
                  {vehicle.year} {vehicle.make.toUpperCase()}{" "}
                  {vehicle.model.toUpperCase()}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    color: "var(--color-muted)",
                    fontSize: 11,
                  }}
                >
                  CHANGE
                </span>
              </>
            ) : (
              <>
                <Icons.truck size={14} />
                <span
                  className="mono"
                  style={{ fontSize: 11, letterSpacing: "0.08em" }}
                >
                  SELECT YOUR VEHICLE
                </span>
              </>
            )}
          </YmmButton>
        </div>
      </div>

      {/* Desktop chrome */}
      <div className="hidden md:block">
        {/* Utility strip */}
        <div
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            className="container-x"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 36,
            }}
          >
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              {/* Cycle 14AW-fix1 (Ren BUG-14AV-001 P3): left-side utility
                  links measured 19px tall — below the 44px WCAG floor.
                  14AV fixed the right-side links; mirror the same
                  inline-flex + minHeight: 44 + horizontal padding here
                  so the tap area meets the standard. The visual 36px
                  strip stays the same; the tap target is just taller. */}
              <a
                href="tel:18883784536"
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  color: "var(--color-muted)",
                  fontSize: 12,
                  minHeight: 44,
                  padding: "0 4px",
                }}
              >
                <Icons.phone size={12} />
                <span className="mono" style={{ letterSpacing: "0.08em" }}>
                  1-888-378-4536
                </span>
              </a>
              <Link
                href="/help"
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  color: "var(--color-muted)",
                  fontSize: 12,
                  minHeight: 44,
                  padding: "0 4px",
                }}
              >
                <Icons.chat size={12} />
                {/* Cycle 5 (Mike): label said "Live Chat" but routed to /help.
                    Real chat lives in the floating RIG widget bottom-right.
                    Honest label until that widget gets a header trigger. */}
                <span>Help Center</span>
              </Link>
              <span style={{ color: "var(--color-muted)", fontSize: 12 }}>
                Mon–Fri 9–5 PST
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--color-muted)",
                  letterSpacing: "0.12em",
                }}
              >
                PREVIOUSLY ON EBAY · NOW DIRECT
              </span>
              {/* Cycle 14AV (Ren BUG-14AU-001 P3): utility links rendered
                  as bare 12px text — measured 19×26px tap target,
                  below the 44px WCAG 2.5.5 / Apple HIG minimum. Add
                  inline-flex + min-height/padding so the hit area
                  meets the standard without growing the visual size
                  of the text. */}
              <Link
                href="/account/orders"
                prefetch={false}
                style={{
                  color: "var(--color-muted)",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 44,
                  padding: "0 4px",
                }}
              >
                Order Status
              </Link>
              <Link
                href="/help"
                style={{
                  color: "var(--color-muted)",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 44,
                  padding: "0 4px",
                }}
              >
                Help
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky main */}
        <div
          className="sticky top-0 z-40"
          style={{
            background: "var(--color-background)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            className="container-x"
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr auto",
              alignItems: "center",
              gap: 32,
              height: 72,
            }}
          >
            {/* Cycle 14Z (Mike-O6 NF-3 follow-up): the prior fix landed on
                the mobile-nav logo only. This is the desktop-nav logo —
                also needs the 44px min-height tap target. */}
            <Link
              href="/"
              aria-label="Stehlen Auto home"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
              }}
            >
              <Logo height={28} priority />
            </Link>

            <HeaderSearch />

            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <VehiclePill vehicle={vehicle} />
              {/* Cycle 14AP-fix16 (owner): explicit auth-state indicator.
                  Signed-in: show a small primary-yellow dot on the
                  GARAGE icon + replace the "GARAGE" label with the
                  user's email/handle so it's unmistakably clear they
                  are signed in (and as whom). Signed-out: a SIGN IN
                  pill takes the same slot. Owner reported having no
                  idea they were signed in because the header had zero
                  visible auth cue. */}
              {signedInLabel ? (
                <Link
                  href="/account"
                  prefetch={false}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    minWidth: 44,
                    minHeight: 44,
                    color: "var(--color-foreground)",
                    position: "relative",
                  }}
                  aria-label={`Account — signed in as ${signedInLabel}`}
                  title={`Signed in as ${signedInLabel}`}
                >
                  <div style={{ position: "relative" }}>
                    <Icons.garage size={20} />
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        background: "var(--color-primary)",
                        borderRadius: "50%",
                        border: "2px solid var(--color-background)",
                      }}
                    />
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      color: "var(--color-primary)",
                      maxWidth: 110,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                    }}
                  >
                    {signedInLabel.toUpperCase()}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  prefetch={false}
                  className="chip"
                  style={{
                    fontSize: 11,
                    cursor: "pointer",
                    minHeight: 32,
                    fontWeight: 700,
                  }}
                  aria-label="Sign in"
                >
                  SIGN IN
                </Link>
              )}
              <CartTrigger
                ariaLabel="Cart"
                style={{
                  background: "transparent",
                  border: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  minWidth: 44,
                  minHeight: 44,
                  color: "var(--color-foreground)",
                  position: "relative",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <Icons.cart size={20} />
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "var(--color-muted)",
                  }}
                >
                  CART
                </span>
                {cartCount > 0 && (
                  <CartBadge count={cartCount} top={-2} right={-6} />
                )}
              </CartTrigger>
            </div>
          </div>

          <MegaNav />
        </div>
      </div>
    </header>
  );
}

function CartBadge({
  count,
  top,
  right,
}: {
  count: number;
  top: number;
  right: number;
}) {
  // Cycle 14Z (Mike-O3 N-7): badge was stuck on /cart after EMPTY CART
  // because the SSR layout didn't refresh on the same route. The live
  // client variant listens for `stehlen:cart:updated` so any mutation
  // (add, remove, empty) patches the badge instantly without a nav.
  return <CartBadgeLive initial={count} top={top} right={right} />;
}
