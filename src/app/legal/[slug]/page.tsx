import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PolicyContent = {
  title: string;
  description: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

const POLICIES: Record<string, PolicyContent> = {
  warranty: {
    title: "Warranty",
    description:
      "Lifetime structural. 5-year finish. 2-year hardware. Off-road and commercial use included.",
    updated: "March 2026",
    sections: [
      {
        heading: "Lifetime Structural Warranty",
        body: [
          "If a Stehlen part's frame, crossbars, mounting brackets, or load-bearing welds fail under normal use, we'll replace the failed component free of charge. Forever. Original purchaser, transferable on a per-vehicle basis.",
          "Damage from accident, off-road impact above the rated load, modification (cutting, drilling, welding), or improper torque-to-spec installation is not covered.",
        ],
      },
      {
        heading: "5-Year Finish Warranty",
        body: [
          "Our triple-stage powder coat over zinc-rich primer is rated to 1,000+ hours of salt-spray. If it rusts through, peels, or fades to grey within 5 years of purchase, we'll replace or refinish at our discretion.",
        ],
      },
      {
        heading: "2-Year Hardware Warranty",
        body: [
          "Grade-8 stainless hardware shipped with every product. Threads strip or seize within 2 years of install? Free replacement hardware kit, shipped same day.",
        ],
      },
      {
        heading: "How to claim",
        body: [
          "Email warranty@stehlenauto.com with your order number, photos, and a brief description. We'll review within 1 business day and ship a replacement at no cost. No paperwork, no hoops.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns",
    description:
      "30-day window. Free FedEx label. Full refund or store credit with a 10% bonus.",
    updated: "March 2026",
    sections: [
      {
        heading: "30-Day Window",
        body: [
          "Items must be unused, in original packaging, and in resalable condition. Window starts the day FedEx delivers, not the day you order.",
        ],
      },
      {
        heading: "Refund Method",
        body: [
          "Refunds hit your original card in 5–7 business days after we receive the return. Choose store credit instead and we'll add a 10% bonus, usable instantly.",
        ],
      },
      {
        heading: "Return Shipping",
        body: [
          "We pay return shipping for any reason — fitment, defect, or change of mind. Print the prepaid FedEx label from your order page.",
        ],
      },
      {
        heading: "Exclusions",
        body: [
          "Custom-painted parts, gift cards, and items damaged after install are non-returnable.",
        ],
      },
    ],
  },
  "fitment-guarantee": {
    title: "Fitment Guarantee",
    description:
      "If our part doesn't fit your truck, we eat the return. Every time, no exceptions.",
    updated: "March 2026",
    sections: [
      {
        heading: "What's covered",
        body: [
          "Every product page lists exactly which years, makes, models, and sub-models a part fits. Save your vehicle in the Garage and we filter the catalog automatically.",
          "If a Stehlen part listed as fitting your verified Year/Make/Model/sub-model doesn't bolt up to your truck — for any reason — we cover return shipping and refund 100%.",
        ],
      },
      {
        heading: "What we need from you",
        body: [
          "Confirm your YMM matches the listing. Snap a photo of the misfit. Email fitment@stehlenauto.com or use the chat. We'll handle the rest.",
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping",
    description:
      "Free ground shipping on every order to the lower 48 — no minimum. Same-day handling Mon–Fri.",
    updated: "March 2026",
    sections: [
      {
        heading: "Standard Ground (always FREE)",
        body: [
          "4–6 business days to the lower 48 from CA, NV, or TX warehouses. Free on every order — no minimum spend, no fine print.",
        ],
      },
      {
        heading: "Expedited",
        body: [
          "FedEx 2-Day: $24.95. Overnight: $49.95. Order by 1pm PST Mon–Fri to ship same day.",
        ],
      },
      {
        heading: "Hawaii / Alaska / PR",
        body: [
          "7–10 business days. +$89 freight surcharge. Rates calculated at checkout.",
        ],
      },
      {
        heading: "Freight items",
        body: [
          "Bumpers, full bed racks, and other oversized items ship via LTL freight. Curbside delivery only — be ready to unload.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "What we collect, what we don't, and how to opt out — written like a human.",
    updated: "March 2026",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account info you provide (email, name, addresses), your saved vehicles, your order history, and standard analytics (page views, device type, IP). We don't sell this data.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "We use functional cookies (cart, garage, auth), analytics cookies (Google, Klaviyo, Microsoft Clarity), and conversion-attribution cookies. You can opt out via your browser or our cookie banner.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Email privacy@stehlenauto.com to request a data export, correction, or deletion. We respond within 30 days.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description:
      "The legal stuff in plain English. Buy a part, install it right, and we've got your back.",
    updated: "March 2026",
    sections: [
      {
        heading: "Use of the site",
        body: [
          "By using stehlenauto.com you agree not to scrape, copy, or resell our content without permission. Reviews you submit are public and you grant us license to display them.",
        ],
      },
      {
        heading: "Pricing & errors",
        body: [
          "We price-match honest typos by canceling affected orders pre-shipment with a full refund. Sale prices honored only while stock lasts.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Stehlen is not liable for damages caused by improper installation. Use a torque wrench. Follow the spec card. If unsure, call us.",
        ],
      },
    ],
  },
  ccpa: {
    title: "CCPA Notice",
    description:
      "California residents: here's how to exercise your rights under the CCPA.",
    updated: "March 2026",
    sections: [
      {
        heading: "Right to know",
        body: [
          "You can request a record of every category of personal information we've collected about you in the past 12 months by emailing privacy@stehlenauto.com.",
        ],
      },
      {
        heading: "Right to delete",
        body: [
          "You can ask us to delete your personal information at any time. We may retain transactional records required by law.",
        ],
      },
      {
        heading: "Right to opt out",
        body: [
          "We don't sell your personal information. If our practices change, we'll publish a 'Do Not Sell My Personal Information' link here.",
        ],
      },
    ],
  },
  "prop-65": {
    title: "California Prop 65 Notice",
    description:
      "Required disclosure for products that may expose California residents to listed chemicals.",
    updated: "March 2026",
    sections: [
      {
        heading: "Notice",
        body: [
          "WARNING: Some Stehlen products can expose you to chemicals including chromium, which is known to the State of California to cause cancer.",
          "For more information, go to https://www.p65warnings.ca.gov.",
        ],
      },
    ],
  },
  accessibility: {
    title: "Accessibility",
    description:
      "We're targeting WCAG 2.2 AA across the entire storefront. If something blocks you, tell us.",
    updated: "March 2026",
    sections: [
      {
        heading: "Our commitment",
        body: [
          "Stehlen is committed to building a storefront usable by everyone — keyboard, screen reader, low vision, motor impairment. We test against WCAG 2.2 AA and ship fixes continuously.",
        ],
      },
      {
        heading: "Found a problem?",
        body: [
          "Email accessibility@stehlenauto.com with the page URL and what didn't work. We aim to fix or work-around within 5 business days.",
        ],
      },
    ],
  },
  credits: {
    title: "Image Credits",
    description:
      "Attribution for third-party photography used on the Stehlen storefront.",
    updated: "May 2026",
    sections: [
      {
        heading: "Vehicle reference photography",
        body: [
          "Some vehicle thumbnails on our SHOP BY POPULAR VEHICLE grid use public-domain or Creative Commons photography from Wikimedia Commons. We are grateful to the photographers who released their work for reuse, and we link them here per the terms of their licenses.",
          "2022 Toyota Tundra Limited CrewMax — photographer Mr.choppers, CC BY-SA 4.0. Source: commons.wikimedia.org/wiki/File:2022_Toyota_Tundra_Limited_CrewMax_Short_Bed_4x4_with_TRD_Off-Road_Package,_front_left,_11-01-2022.jpg",
          "2020 Ram 1500 Bighorn — photographer Kevauto, CC BY-SA 4.0. Source: commons.wikimedia.org/wiki/File:2020_Ram_1500_Bighorn,_front_7.8.20.jpg",
          "Nissan Frontier (D41) Pro-4X — photographer Alexander-93, CC BY-SA 4.0. Source: commons.wikimedia.org/wiki/File:Nissan_Frontier_(D41)_Pro-4X_Automesse_Ludwigsburg_2022_1X7A5885.jpg",
          "2019 GMC Sierra 1500 Denali (SIAM 2019) — photographer SsmIntrigue, CC BY-SA 4.0. Source: commons.wikimedia.org/wiki/File:2019_GMC_Sierra_1500_Denali_au_SIAM_2019.jpg",
          "All other vehicle photography on the storefront is owned by Stehlen Auto or shot by our team. CC BY-SA 4.0 license terms: creativecommons.org/licenses/by-sa/4.0/",
        ],
      },
      {
        heading: "Product photography",
        body: [
          "All product photography on /products and /collections pages is the property of Stehlen Auto and our manufacturing partners. Reuse without permission is prohibited.",
        ],
      },
      {
        heading: "Reporting an issue",
        body: [
          "If you believe we've used your image without proper attribution, please email credits@stehlenauto.com and we will resolve it within 1 business day.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = POLICIES[slug];
  if (!p) return { title: "Policy" };
  return {
    title: p.title,
    description: p.description,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = POLICIES[slug];
  if (!p) notFound();

  return (
    <main
      className="container-x"
      style={{ paddingTop: 64, paddingBottom: 96, maxWidth: 800 }}
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        LEGAL · LAST UPDATED {p.updated.toUpperCase()}
      </div>
      <h1
        className="display-h2"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 56,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 0.95,
          marginBottom: 16,
        }}
      >
        {p.title}
      </h1>
      <p
        style={{
          color: "var(--color-muted)",
          fontSize: 18,
          lineHeight: 1.6,
          marginBottom: 48,
          maxWidth: 600,
        }}
      >
        {p.description}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        {p.sections.map((s) => (
          <section key={s.heading}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 24,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                marginBottom: 12,
              }}
            >
              {s.heading}
            </h2>
            {s.body.map((para, i) => (
              <p
                key={i}
                style={{
                  color: "var(--color-muted)",
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
