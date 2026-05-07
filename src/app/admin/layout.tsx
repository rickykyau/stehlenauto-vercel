import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/discounts", label: "Promo codes" },
  { href: "/admin/sourcing-gaps", label: "Sourcing gaps" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="container-x"
      style={{ paddingTop: 32, paddingBottom: 64, minHeight: "70vh" }}
    >
      <div
        className="eyebrow"
        style={{ marginBottom: 6, color: "var(--color-primary)" }}
      >
        OWNER ADMIN
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          marginBottom: 16,
        }}
      >
        Stehlen Operations
      </h1>
      <nav
        aria-label="Admin"
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--color-border)",
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mono"
            style={{
              padding: "10px 18px",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-foreground)",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
