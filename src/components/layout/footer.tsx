import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const LINK_COLS = [
  {
    h: "SHOP",
    items: [
      { label: "Tonneau Covers", href: "/collections/tonneau-covers" },
      { label: "Trailer Hitches", href: "/collections/trailer-hitches" },
      { label: "Bull Guards & Grille Guards", href: "/collections/bull-guards-grille-guards" },
      { label: "Front Grilles", href: "/collections/front-grilles" },
      { label: "Headlights", href: "/collections/headlights" },
      { label: "All Categories", href: "/collections" },
    ],
  },
  {
    h: "SUPPORT",
    items: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/help/contact" },
      { label: "Returns Policy", href: "/legal/returns" },
      { label: "Shipping", href: "/legal/shipping" },
      { label: "Fitment Guarantee", href: "/legal/fitment-guarantee" },
      { label: "Installation Guides", href: "/help/install" },
    ],
  },
  {
    h: "COMPANY",
    items: [
      { label: "About", href: "/about" },
      { label: "Account", href: "/account" },
      { label: "Sign In", href: "/sign-in" },
    ],
  },
  {
    h: "LEGAL",
    items: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Warranty", href: "/legal/warranty" },
      { label: "CCPA", href: "/legal/ccpa" },
      { label: "Prop 65", href: "/legal/prop-65" },
      { label: "Accessibility", href: "/legal/accessibility" },
      { label: "Image Credits", href: "/legal/credits" },
    ],
  },
];

// Cycle 5 (Mike): every social tile linked to /social/<network> which 404s.
// Until real social URLs are wired in env, hide the tiles instead of shipping
// dead links on every page. Re-enable per-network as accounts come online.
const SOCIALS: { name: string; href: string }[] = [];
const PAYMENTS = ["VISA", "MC", "AMEX", "DISC", "PYPL", "AFRM", "SHOP"];

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        marginTop: 80,
      }}
    >
      {/* Newsletter */}
      <div style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div
          className="container-x"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            paddingTop: 40,
            paddingBottom: 40,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ color: "var(--color-primary)", marginBottom: 8 }}
            >
              NEWSLETTER
            </div>
            <h3
              className="footer-headline"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
              }}
            >
              BUILD YOUR RIG WITH US.
            </h3>
            <p
              style={{
                color: "var(--color-muted)",
                marginTop: 8,
                maxWidth: 480,
              }}
            >
              $25 off your first order over $200. Plus new-product drops, install
              guides, and customer build features.
            </p>
          </div>
          <form style={{ display: "flex", gap: 8 }} action="/api/newsletter" method="post">
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="you@example.com"
              type="email"
              name="email"
              required
              aria-label="Email address"
            />
            <button type="submit" className="btn btn-primary">
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>

      {/* Links — Cycle 14f (Mike-6 MAJOR F-6): the 5-col grid was unconditional
          and overflowed mobile viewports (412 px), hiding Sign In, Account,
          Legal, Warranty, Privacy etc. Stack to 2 cols on phones, 5 cols on
          tablet+. */}
      <div
        className="container-x footer-grid"
        style={{
          paddingTop: 48,
          paddingBottom: 48,
        }}
      >
        <div>
          <Logo height={26} />
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: 13,
              marginTop: 16,
              lineHeight: 1.6,
            }}
          >
            Heavy-duty truck, SUV, and Jeep accessories. Fitment guaranteed.
            Bolt-on engineering since 2015.
          </p>
          {SOCIALS.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {SOCIALS.map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="mono"
                  style={{
                    width: 36,
                    height: 36,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-muted)",
                    fontSize: 11,
                  }}
                >
                  {s.name[0]}
                </Link>
              ))}
            </div>
          )}
        </div>
        {LINK_COLS.map((col) => (
          <div key={col.h}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              {col.h}
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {col.items.map((it) => (
                <li key={it.label}>
                  <Link
                    href={it.href}
                    style={{ fontSize: 13, color: "var(--color-muted)" }}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sub footer */}
      <div style={{ borderTop: "1px solid var(--color-border)" }}>
        <div
          className="container-x"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 20,
            paddingBottom: 20,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ color: "var(--color-muted)", fontSize: 12 }}>
            © {new Date().getFullYear()} Stehlen Auto. All Rights Reserved. 1160
            W. Rincon St, Corona, CA 92878.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="mono"
                style={{
                  fontSize: 9,
                  padding: "4px 8px",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
