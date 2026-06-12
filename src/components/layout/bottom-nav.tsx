"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { CartBadgeLive } from "./cart-badge-live";
import { openYmmModal } from "@/components/fitment/ymm-events";
import { openCartDrawer } from "@/components/cart/cart-events";

/**
 * Cycle 14BG (Jordan F-1 CRITICAL): persistent mobile bottom navigation.
 *
 * Before this, mobile navigation was hamburger-only — the Garage entry
 * point (the single most powerful conversion lever in fitment-first
 * commerce) was buried two taps deep. Bottom tab bars are the universal
 * post-2020 mobile-commerce affordance; their absence read as a quality
 * gap. Tabs: Home / Search / Garage / Cart / Account.
 *
 * Layout contract (see globals.css "Mobile bottom nav" block):
 *  - --stehlen-bottom-nav-height is defined <768px so every other
 *    fixed-bottom element (PDP sticky ATC, cart CHECKOUT bar, chat FAB,
 *    wishlist nudge) offsets itself above this bar instead of underneath.
 *  - body.has-bottom-nav gets matching padding-bottom so the footer is
 *    never occluded.
 *  - zIndex 40 keeps the bar below every overlay (mobile menu 60, cart
 *    drawer 70, dialogs 90+) and below the PDP sticky ATC (50), which
 *    stacks ABOVE this bar via the height var rather than covering it.
 */
export function BottomNav({
  signedIn = false,
  hasVehicle = false,
  cartCount = 0,
}: {
  signedIn?: boolean;
  hasVehicle?: boolean;
  cartCount?: number;
}) {
  const pathname = usePathname() ?? "/";

  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search");
  const isAccount =
    pathname.startsWith("/account") || pathname.startsWith("/sign-in");

  return (
    <nav
      aria-label="Primary"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "var(--color-background)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div style={{ display: "flex", height: 56 }}>
        <TabLink href="/" label="HOME" active={isHome}>
          <Icons.garage size={20} />
        </TabLink>
        <TabLink href="/search" label="SEARCH" active={isSearch}>
          <Icons.search size={20} />
        </TabLink>
        <TabButton
          label="GARAGE"
          onClick={openYmmModal}
          ariaLabel={hasVehicle ? "Change vehicle" : "Select your vehicle"}
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Icons.truck size={20} />
            {/* Vehicle-saved cue — same yellow-dot language as the desktop
                header's signed-in garage icon. */}
            {hasVehicle && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  width: 7,
                  height: 7,
                  background: "var(--color-primary)",
                  borderRadius: "50%",
                  border: "2px solid var(--color-background)",
                }}
              />
            )}
          </span>
        </TabButton>
        <TabButton label="CART" onClick={openCartDrawer} ariaLabel="Cart">
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Icons.cart size={20} />
            <CartBadgeLive initial={cartCount} top={-6} right={-10} />
          </span>
        </TabButton>
        <TabLink
          href={signedIn ? "/account" : "/sign-in"}
          label="ACCOUNT"
          active={isAccount}
          prefetchOff
        >
          <Icons.user size={20} />
        </TabLink>
      </div>
    </nav>
  );
}

const tabStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  minHeight: 44,
  background: "transparent",
  border: 0,
  cursor: "pointer",
  textDecoration: "none",
};

function TabLabel({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        color: active ? "var(--color-primary)" : "var(--color-muted)",
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </span>
  );
}

function TabLink({
  href,
  label,
  active,
  prefetchOff,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  prefetchOff?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetchOff ? false : undefined}
      aria-current={active ? "page" : undefined}
      style={{
        ...tabStyle,
        color: active ? "var(--color-primary)" : "var(--color-foreground)",
      }}
    >
      {children}
      <TabLabel label={label} active={active} />
    </Link>
  );
}

function TabButton({
  label,
  onClick,
  ariaLabel,
  children,
}: {
  label: string;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ ...tabStyle, color: "var(--color-foreground)", padding: 0 }}
    >
      {children}
      <TabLabel label={label} />
    </button>
  );
}
