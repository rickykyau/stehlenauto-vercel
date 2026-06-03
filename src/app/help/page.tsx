import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Fitment help, install guides, returns, shipping, and warranty info. Get straight answers, fast.",
  alternates: { canonical: "/help" },
};

// Cycle 8 (owner): /help/fitment, /help/shipping, /help/returns, /help/billing
// were all 404s — Next.js prefetched them on the help page and produced 4
// console errors per visit. Pointed each at the real existing page that
// actually answers the question (the legal/* policies double as the
// reference docs for shipping/returns/warranty; /help/contact takes anything
// that isn't covered).
const TOPICS = [
  {
    Icon: Icons.truck,
    title: "Fitment & vehicle help",
    body: "Confirm if a part fits your build, change your saved vehicle, or look up by VIN.",
    href: "/legal/fitment-guarantee",
  },
  {
    Icon: Icons.shipping,
    title: "Shipping & tracking",
    body: "ETAs, freight, P.O. boxes, and what to do if your tracking stalls.",
    href: "/legal/shipping",
  },
  {
    Icon: Icons.return,
    title: "Returns & refunds",
    body: "30-day window. Free FedEx label. Refund or exchange — your call.",
    href: "/legal/returns",
  },
  {
    Icon: Icons.shield,
    title: "Warranty",
    body: "Lifetime structural. 5-year finish. What's covered, what's not.",
    href: "/legal/warranty",
  },
  {
    Icon: Icons.bolt,
    title: "Install guides",
    body: "Torque specs, hardware diagrams, and step-by-step PDFs for every product.",
    href: "/help/install",
  },
  {
    Icon: Icons.cc,
    title: "Payment & billing",
    body: "Affirm financing, gift cards, and updating an order after checkout.",
    href: "/help/contact",
  },
];

const FAQS = [
  {
    q: "Will a Stehlen part fit my vehicle?",
    a: "Save your vehicle in the Garage and every product page will tell you. Fitment is guaranteed — if it doesn't fit, return it free.",
  },
  {
    q: "Do I need to drill or weld?",
    a: "No. Every Stehlen part is bolt-on with included hardware. If a product requires drilling, the listing says so up top.",
  },
  {
    q: "How fast does it ship?",
    a: "Stocked items ship within 24 business hours from CA, NV, or TX. Standard ground is free on every order to the lower 48 — no minimum spend.",
  },
  {
    q: "What if my install goes sideways?",
    a: "Call our techs at 1-888-378-4536 Mon–Fri 9–5 PST. We'll walk you through it on the phone.",
  },
  // Cycle 14BI (audit F-13): deeper FAQ set for AI-Overview citation + the FAQ
  // rich result. Each answer mirrors a real policy so the schema matches the
  // visible content (Google requirement).
  {
    q: "Does Stehlen Auto offer free shipping?",
    a: "Yes — free ground shipping on every order to the lower 48 states, with no minimum spend.",
  },
  {
    q: "What is the return policy?",
    a: "30-day hassle-free returns. We email a prepaid FedEx label, and you choose a full refund or store credit with a 10% bonus.",
  },
  {
    q: "How long does delivery take?",
    a: "In-stock items leave our warehouse within 24 business hours. Standard ground transit is about 3–7 business days depending on your location.",
  },
  {
    q: "Is there a warranty?",
    a: "Yes. Stehlen backs its parts with a structural warranty plus a finish warranty — see the warranty policy for the per-category terms.",
  },
  {
    q: "Can I pay over time?",
    a: "Yes — Affirm pay-over-time is available at checkout on qualifying orders, alongside all major cards and the standard Shopify-secured checkout.",
  },
  {
    q: "Where does Stehlen Auto ship from?",
    a: "Orders ship direct from our warehouses in California, Nevada, and Texas — the same warehouses that fulfilled our eBay and Amazon orders.",
  },
];

// Cycle 14Z (Priya O-15 LOW): FAQPage schema makes the FAQ block eligible
// for Google's "People also ask" rich result and steals long-tail SERP real
// estate from competitors who don't ship structured data on their help pages.
// All FAQ content is statically defined above (no user input) → no XSS risk.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};
const faqJsonLdString = JSON.stringify(faqJsonLd).replace(/</g, "\\u003c");

export default function SupportPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- FAQPage schema, static content
        dangerouslySetInnerHTML={{ __html: faqJsonLdString }}
      />
      <section
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 56 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            SUPPORT
          </div>
          <h1
            className="display-h2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 56,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
            }}
          >
            HOW CAN WE
            <br />
            HELP YOU BUILD?
          </h1>
          <form
            action="/search"
            method="get"
            style={{ position: "relative", marginTop: 32, maxWidth: 640 }}
          >
            <span
              style={{
                position: "absolute",
                left: 18,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-muted)",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              <Icons.search size={18} />
            </span>
            <input
              type="search"
              name="q"
              placeholder="Search the help center…"
              className="input"
              style={{
                height: 56,
                paddingLeft: 50,
                fontSize: 16,
                textTransform: "none",
                letterSpacing: 0,
              }}
            />
          </form>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 56, paddingBottom: 64 }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 16 }}
        >
          {TOPICS.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ color: "var(--color-primary)" }}>
                <t.Icon size={24} />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}
              >
                {t.title}
              </h3>
              <p
                style={{
                  color: "var(--color-muted)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  flex: 1,
                }}
              >
                {t.body}
              </p>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--color-primary)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                READ MORE <Icons.arrowR size={11} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        style={{ background: "var(--color-surface)" }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 64, paddingBottom: 64 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            FREQUENTLY ASKED
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: 24,
            }}
          >
            The short answers.
          </h2>
          <div
            style={{
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                style={{
                  borderBottom:
                    i < FAQS.length - 1
                      ? "1px solid var(--color-border)"
                      : 0,
                }}
              >
                <summary
                  style={{
                    padding: 18,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {f.q}
                  <Icons.plus size={14} />
                </summary>
                <p
                  style={{
                    padding: "0 18px 18px",
                    color: "var(--color-muted)",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 64, paddingBottom: 96 }}
      >
        <div
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
            borderRadius: "var(--radius-md)",
            padding: 32,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              STILL STUCK?
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Talk to a real person.
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/help/contact" className="btn">
              MESSAGE
            </Link>
            <a
              href="tel:18883784536"
              className="btn"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }}
            >
              1-888-378-4536
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
