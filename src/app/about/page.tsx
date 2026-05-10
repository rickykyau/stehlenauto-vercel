import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export const metadata: Metadata = {
  // Cycle 14Z (Mike-O8 F-2 NIT): was "About Stehlen Auto | Stehlen Auto"
  // because layout.tsx title.template re-appends the brand. "Our Story" is
  // honest, scannable in tabs, and avoids the double-brand awkwardness.
  title: "Our Story",
  description:
    "Bolt-on engineering since 2015. Cold-rolled steel parts for trucks, SUVs, and Jeeps — direct from the factory floor.",
  alternates: { canonical: "/about" },
};

const STORY_CARDS = [
  {
    year: "2015",
    title: "Garage origins",
    body: "Started in a single bay in Corona, CA. First product: a door-frame mount roof rack for the F-150 — drilling-free.",
  },
  {
    year: "2018",
    title: "Direct-to-rider",
    body: "Cut out the middleman. Sold direct on eBay and Amazon. Hit our 100,000th customer.",
  },
  {
    year: "2024",
    title: "Now direct",
    body: "Stehlenauto.com goes live. Same warehouse, same parts, lower prices, faster shipping.",
  },
];

const VALUES = [
  {
    Icon: Icons.shield,
    head: "FITMENT GUARANTEED",
    body: "If our part doesn't fit your vehicle, we eat the return. Every time.",
  },
  {
    Icon: Icons.truck,
    head: "BOLT-ON ONLY",
    body: "Drilling and welding void warranties. We engineer around it.",
  },
  {
    Icon: Icons.return,
    head: "30 DAYS, NO QUESTIONS",
    body: "Returns on us. Print the label, drop it off, get refunded.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <section
        style={{
          position: "relative",
          minHeight: 480,
          background: "var(--color-background)",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/hero-stehlen.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", opacity: 0.4 }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.95) 100%)",
          }}
        />
        <div
          className="container-x"
          style={{ position: "relative", paddingTop: 96, paddingBottom: 80 }}
        >
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            ABOUT STEHLEN
          </div>
          <h1
            className="display-h1"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 96,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              lineHeight: 0.85,
              fontWeight: 800,
              maxWidth: 800,
            }}
          >
            BUILT BY DRIVERS,
            <br />
            <span style={{ color: "var(--color-primary)" }}>FOR DRIVERS.</span>
          </h1>
          <p
            style={{
              marginTop: 24,
              maxWidth: 640,
              fontSize: 18,
              color: "var(--color-muted)",
              lineHeight: 1.6,
            }}
          >
            Heavy-duty truck, SUV, and Jeep accessories engineered from
            cold-rolled steel. No drilling. No guesswork. Built right next to
            the trucks we sell parts for.
          </p>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 80, paddingBottom: 64 }}
      >
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          OUR STORY
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 44,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            marginBottom: 32,
            maxWidth: 720,
          }}
        >
          From a single garage bay to the warehouses behind your truck.
        </h2>
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: 16 }}
        >
          {STORY_CARDS.map((c) => (
            <div
              key={c.year}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 24,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                }}
              >
                {c.year}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  marginTop: 8,
                  marginBottom: 10,
                }}
              >
                {c.title}
              </h3>
              <p style={{ color: "var(--color-muted)", lineHeight: 1.6 }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{ background: "var(--color-surface)" }}
      >
        <div
          className="container-x"
          style={{ paddingTop: 80, paddingBottom: 80 }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            HOW WE WORK
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}
          >
            Three rules. No exceptions.
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: 16 }}
          >
            {VALUES.map((v) => (
              <div
                key={v.head}
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 28,
                }}
              >
                <div style={{ color: "var(--color-primary)", marginBottom: 16 }}>
                  <v.Icon size={28} />
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {v.head}
                </div>
                <p
                  style={{
                    color: "var(--color-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="container-x"
        style={{ paddingTop: 80, paddingBottom: 96 }}
      >
        <div
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
            borderRadius: "var(--radius-md)",
            padding: 40,
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
              CAREERS
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Want to build with us?
            </h3>
          </div>
          <Link
            href="/careers"
            className="btn"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            OPEN ROLES
          </Link>
        </div>
      </section>
    </main>
  );
}
