import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { howToJsonLd, jsonLdString } from "@/lib/seo/jsonld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

export const metadata: Metadata = {
  title: "Install Guides",
  description:
    "Step-by-step PDFs, torque specs, and hardware diagrams for every Stehlen product.",
  alternates: { canonical: "/help/install" },
};

// Cycle 14c (Mike-3 BLOCKER): the 4 cards used to link to /help/install/<slug>
// routes that don't exist (404). Cycle 14b "fixed" the PDP→hub link but left
// these dead. Until per-product PDFs are wired (warehouse to provide), point
// every card at the contact page so customers reach a real human / phone
// number instead of a 404.
const GUIDES = [
  {
    title: "Door-Frame Mount Roof Rack",
    sub: "Talk to install support · 1-888-378-4536",
    href: "/help/contact",
  },
  {
    title: "Modular Steel Bumper",
    sub: "Talk to install support · 1-888-378-4536",
    href: "/help/contact",
  },
  {
    title: "Lock & Roll-Up Tonneau",
    sub: "Talk to install support · 1-888-378-4536",
    href: "/help/contact",
  },
  {
    title: "LED Bed Light Kit",
    sub: "Talk to install support · 1-888-378-4536",
    href: "/help/contact",
  },
];

const STEPS = [
  ["1", "Unbox and inventory hardware against the included packing list."],
  ["2", "Mount door-frame brackets at marked positions; hand-tighten only."],
  ["3", "Lift assembled rack onto truck (2 people) and seat onto brackets."],
  ["4", "Torque all bolts to 18 ft-lb in the sequence shown on the spec card."],
  ["5", "Verify torque after 100 miles, then again at 500 miles."],
];

// Cycle 14Z post-deploy (Priya F-14 LOW): HowTo schema on the example install
// (door-frame roof rack) makes the page eligible for Google's "How-to" rich
// result and AI Overview citations. All step content is statically defined
// in this file (no user input) → safe to inline.
const howToHtml = jsonLdString(
  howToJsonLd(
    "Install a Door-Frame Mount Roof Rack",
    "Five-step bolt-on install for a Stehlen door-frame mount roof rack — no drilling required.",
    STEPS.map(([n, t]) => ({ position: Number(n), text: String(t) })),
    SITE_URL,
    "/help/install",
  ),
);

export default function InstallGuidePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- HowTo, server-built static
        dangerouslySetInnerHTML={{ __html: howToHtml }}
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
            INSTALL GUIDES
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
            BOLT IT ON
            <br />
            RIGHT THE FIRST TIME.
          </h1>
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: 16,
              marginTop: 16,
              maxWidth: 580,
            }}
          >
            Every Stehlen part ships with a printed guide. Download the PDF
            ahead of time, queue up the install video, and you&apos;ll have it
            on in an afternoon.
          </p>
        </div>
      </section>

      <section
        className="container-x grid grid-cols-1 md:grid-cols-[1fr_320px]"
        style={{ paddingTop: 56, paddingBottom: 80, gap: 48 }}
      >
        <div>
          <h2
            className="mono"
            style={{
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            EXAMPLE · DOOR-FRAME ROOF RACK
          </h2>
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {STEPS.map(([n, t]) => (
              <div
                key={n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  gap: 12,
                  alignItems: "baseline",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 18,
                    color: "var(--color-primary)",
                    fontWeight: 700,
                  }}
                >
                  0{n}
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
            }}
          >
            <Icons.alert size={16} />
            <span>
              <strong>Need a hand?</strong> Call our techs at{" "}
              <a
                href="tel:18883784536"
                style={{ color: "var(--color-primary)" }}
              >
                1-888-378-4536
              </a>{" "}
              Mon–Fri 9–5 PST.
            </span>
          </div>
        </div>

        <aside style={{ alignSelf: "start" }}>
          <h2
            className="mono"
            style={{
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            ALL GUIDES
          </h2>
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {GUIDES.map((g, i) => (
              <Link
                key={g.title}
                href={g.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                  borderBottom:
                    i < GUIDES.length - 1
                      ? "1px solid var(--color-border)"
                      : 0,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {g.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-muted)",
                      marginTop: 2,
                    }}
                  >
                    {g.sub}
                  </div>
                </div>
                <Icons.external size={14} />
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
