"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Lovable-style dedicated admin shell: vertical left rail, brand lockup at
// the top, active item flagged with a yellow left accent, "Back to Store" at
// the foot. Routes are limited to pages that actually exist in this app.
type NavItem = { href: string; label: string; icon: React.ReactNode };

function I({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <I d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" /> },
  { href: "/admin/orders", label: "Orders", icon: <I d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /> },
  { href: "/admin/customers", label: "Customers", icon: <I d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
  { href: "/admin/abandoned-carts", label: "Abandoned", icon: <I d="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /> },
  { href: "/admin/inventory", label: "Inventory", icon: <I d="M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
  { href: "/admin/reviews", label: "Reviews", icon: <I d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM9 10h.01M13 10h.01" /> },
  { href: "/admin/discounts", label: "Promo Codes", icon: <I d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82M7 7h.01" /> },
  { href: "/admin/sourcing-gaps", label: "Sourcing Gaps", icon: <I d="M3 3v18h18M7 16l4-4 4 4 5-6" /> },
];

export function AdminSidebar({
  badges = {},
}: {
  badges?: Record<string, number>;
}) {
  const pathname = usePathname() || "";
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100dvh",
      }}
    >
      {/* Brand lockup */}
      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          className="mono"
          style={{
            fontWeight: 700,
            letterSpacing: "0.18em",
            fontSize: 14,
            color: "var(--color-foreground)",
          }}
        >
          STEHLEN
        </span>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--color-primary)",
          }}
        >
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Admin" style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                marginBottom: 2,
                borderRadius: 8,
                borderLeft: active
                  ? "3px solid var(--color-primary)"
                  : "3px solid transparent",
                background: active ? "var(--color-surface-3)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-muted)",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                transition: "background 120ms, color 120ms",
              }}
            >
              <span style={{ display: "inline-flex", width: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badges[item.href] ? (
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 9,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--color-primary)",
                    color: "var(--color-primary-foreground)",
                  }}
                >
                  {badges[item.href]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div style={{ padding: 12, borderTop: "1px solid var(--color-border)" }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 8,
            color: "var(--color-muted)",
            fontSize: 13,
          }}
        >
          <I d="M19 12H5M12 19l-7-7 7-7" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
}
