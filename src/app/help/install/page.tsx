import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog/mock";
import { getAllInstallGuides } from "@/lib/install";
import { howToJsonLd, jsonLdString } from "@/lib/seo/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";

export const metadata: Metadata = {
  title: "Install Guides",
  description:
    "Step-by-step install guides for tonneau covers, trailer hitches, bull guards, running boards, grilles, headlights, bed mats, roof racks and more — tools, time and what to check.",
  alternates: { canonical: "/help/install" },
};

const nameFor = (handle: string) => CATEGORIES.find((c) => c.slug === handle)?.name ?? handle;

export default function InstallGuidesPage() {
  const guides = getAllInstallGuides();
  // One HowTo per category guide — the format AI answers and Google quote
  // for "how do I install a …" questions. Built from data/install-guides.json.
  const howTo = jsonLdString(
    guides.map(({ handle, guide }) => ({
      ...howToJsonLd(
        guide.title,
        `How to install ${nameFor(handle).toLowerCase()}: ${guide.difficulty.toLowerCase()} install, about ${guide.timeMinutes} minutes.`,
        guide.steps.map((text, i) => ({ position: i + 1, text })),
        SITE_URL,
        `/help/install#${handle}`,
      ),
      totalTime: `PT${guide.timeMinutes}M`,
      tool: guide.tools.map((name) => ({ "@type": "HowToTool", name })),
    })),
  );

  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- HowTo from our own guide data; jsonLdString escapes "<"
        dangerouslySetInnerHTML={{ __html: howTo }}
      />
      <section style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="container-x" style={{ paddingTop: 64, paddingBottom: 48 }}>
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
          <p style={{ color: "var(--color-muted)", fontSize: 16, marginTop: 16, maxWidth: 640, lineHeight: 1.6 }}>
            General install steps for each type of part we sell. Your product&apos;s page and the instruction
            sheet in the box have the specifics for your exact part — time, hardware, torque values and whether
            drilling is needed — so follow those where they differ. Stuck? Call install support at{" "}
            <a href="tel:+19513327000" style={{ color: "var(--color-foreground)" }}>
              951-332-7000
            </a>{" "}
            (Mon–Fri, 9–5 PT).
          </p>
          <nav aria-label="Install guides" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
            {guides.map(({ handle }) => (
              <a
                key={handle}
                href={`#${handle}`}
                style={{
                  padding: "6px 12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                }}
              >
                {nameFor(handle)}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container-x" style={{ paddingTop: 48, paddingBottom: 80, display: "grid", gap: 40 }}>
        {guides.map(({ handle, guide }) => (
          <section
            key={handle}
            id={handle}
            aria-labelledby={`${handle}-title`}
            style={{
              scrollMarginTop: 96,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 28,
            }}
          >
            <h2
              id={`${handle}-title`}
              style={{
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              {guide.title}
            </h2>
            <p className="mono" style={{ color: "var(--color-muted)", fontSize: 12, letterSpacing: "0.08em", marginBottom: 20 }}>
              {guide.difficulty.toUpperCase()} · ABOUT {guide.timeMinutes} MIN ·{" "}
              {guide.peopleNeeded === 1 ? "SOLO INSTALL" : `${guide.peopleNeeded} PEOPLE`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]" style={{ gap: 28 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Steps</h3>
                <ol style={{ paddingLeft: 20, display: "grid", gap: 10, lineHeight: 1.6, fontSize: 14 }}>
                  {guide.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {guide.warnings.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: "20px 0 10px" }}>Before you start</h3>
                    <ul style={{ paddingLeft: 20, display: "grid", gap: 8, lineHeight: 1.6, fontSize: 14, color: "var(--color-muted)" }}>
                      {guide.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <aside>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Tools</h3>
                <ul style={{ paddingLeft: 20, display: "grid", gap: 6, fontSize: 14, color: "var(--color-muted)" }}>
                  {guide.tools.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <Link
                  href={`/collections/${handle}`}
                  style={{
                    display: "inline-block",
                    marginTop: 20,
                    padding: "10px 14px",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 13,
                  }}
                >
                  Shop {nameFor(handle).toLowerCase()} →
                </Link>
              </aside>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
