import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Category FAQ + FAQPage schema for collection pages (AEO: AI answers quote
 * short, sourced Q&A). Every answer is built from data/category_facts.json
 * (scripts/build-category-facts.py — live collection membership + CA
 * fitment) or from the /legal policy pages. No hand-written claims, and no
 * product/fitment counts (stakeholder rule).
 */

type Facts = {
  topVehicles: { make: string; model: string; years: string }[];
  bedLengths?: number[];
  styles?: string[];
  classes?: number[];
  receivers?: string[];
};

// Mostly steel, Stehlen-brand categories where the warranty applies.
const WARRANTY_CATEGORIES = new Set([
  "bull-guards-grille-guards", "running-boards-side-steps", "roof-racks-baskets",
  "chase-racks-sport-bars", "molle-panels", "trailer-hitches",
]);

let cache: Record<string, Facts> | null = null;
function load(): Record<string, Facts> {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "category_facts.json"), "utf8"));
  } catch {
    cache = {};
  }
  return cache!;
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function categoryFaqs(handle: string, name: string): { q: string; a: string }[] {
  const f = load()[handle];
  if (!f) return [];
  const lower = name.toLowerCase();
  const faqs: { q: string; a: string }[] = [];

  if (f.topVehicles.length) {
    const vs = f.topVehicles.slice(0, 6).map((v) => `${v.make} ${v.model} (${v.years})`);
    faqs.push({
      q: `Which vehicles do you carry ${lower} for?`,
      a: `We carry ${lower} for many vehicles, with the widest choice for the ${list(vs)}. Enter your vehicle at the top of the page to see only the ${lower} that fit it.`,
    });
  }
  if (f.bedLengths?.length) {
    const ft = f.bedLengths.map((b) => `${b} ft`);
    const styles = f.styles?.length ? ` in ${list(f.styles.map((s) => s.toLowerCase()))} styles` : "";
    faqs.push({
      q: `What bed lengths do your ${lower} come in?`,
      a: `We carry ${lower} for ${list(ft)} beds${styles}. Each listing names the exact bed length it fits. If you're unsure, measure from the inside of the bulkhead to the inside of the closed tailgate.`,
    });
  }
  if (f.classes?.length) {
    const classes = f.classes.map((c) => `Class ${c}`);
    const receivers = f.receivers?.length ? ` with ${list(f.receivers)} receivers` : "";
    faqs.push({
      q: "What hitch classes and towing ratings do you carry?",
      a: `We carry ${list(classes)} trailer hitches${receivers}. Every hitch page lists its weight-carrying and tongue-weight ratings. Never exceed the lowest-rated towing component or your vehicle manufacturer's towing capacity.`,
    });
  }
  faqs.push({
    q: `How do I know a ${lower.replace(/s$/, "")} fits my vehicle?`,
    a: "Every product page lists the exact years, makes and models it fits, plus bed length, cab type or trim where it matters. Save your vehicle and the site shows whether each part fits before you add it to the cart. If a part doesn't fit the vehicle it was bought for, the return is free.",
  });
  faqs.push({
    q: "How much is shipping, and can I return it?",
    a: "Standard ground shipping is free on every order to the lower 48 states, with no minimum, and takes 4–6 business days. Returns are accepted for 30 days with a free prepaid FedEx label, for a full refund or store credit with a 10% bonus.",
  });
  if (WARRANTY_CATEGORIES.has(handle)) {
    faqs.push({
      q: `Is there a warranty on ${lower}?`,
      a: "Stehlen Auto-brand parts carry a lifetime structural warranty, a 5-year finish warranty and a 2-year hardware warranty. Parts from other brands, such as CURT, carry their manufacturer's warranty.",
    });
  }
  return faqs;
}

export function CategoryFaq({ handle, name }: { handle: string; name: string }) {
  const faqs = categoryFaqs(handle, name);
  if (!faqs.length) return null;
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }).replace(/</g, "\\u003c");

  return (
    <section style={{ maxWidth: 960, margin: "48px auto 0", padding: "0 16px" }} aria-labelledby="category-faq">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- FAQPage schema built from static data files
        dangerouslySetInnerHTML={{ __html: schema }}
      />
      <h2
        id="category-faq"
        style={{
          fontFamily: "var(--font-display)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: 20,
          marginBottom: 16,
        }}
      >
        {name} FAQ
      </h2>
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {faqs.map((f, i) => (
          <details key={f.q} style={{ borderBottom: i < faqs.length - 1 ? "1px solid var(--color-border)" : 0 }}>
            <summary style={{ padding: 18, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>{f.q}</summary>
            <p style={{ padding: "0 18px 18px", margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--color-muted)" }}>
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
