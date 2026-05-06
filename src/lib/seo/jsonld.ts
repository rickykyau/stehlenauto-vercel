// Escape `<` so a JSON-LD payload can't terminate its surrounding <script> tag.
export function jsonLdString(obj: object): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; href: string };

export function breadcrumbJsonLd(crumbs: Crumb[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${baseUrl}${c.href}`,
    })),
  };
}

// Cycle 14Z post-deploy (Priya F-13 MEDIUM): ItemList schema on collection
// pages makes the product grid eligible for Google's "carousel" rich result
// (the horizontal-scroll set of products under a category SERP). Each item
// is a Product with the URL Google will follow back into the catalog.
export type ItemListEntry = { handle: string; name: string };

export function itemListJsonLd(
  items: ItemListEntry[],
  baseUrl: string,
  listName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/products/${p.handle}`,
      name: p.name,
    })),
  };
}

// Cycle 14Z post-deploy (Priya F-14 LOW): HowTo schema on the install guide
// is eligible for AI Overview citation + the "How-to" rich result. The
// torque-spec sequence we already display is exactly the structured-step
// payload Google's docs ask for.
export type HowToStep = { position: number; text: string };

export function howToJsonLd(
  name: string,
  description: string,
  steps: HowToStep[],
  baseUrl: string,
  pageHref: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    url: `${baseUrl}${pageHref}`,
    step: steps.map((s) => ({
      "@type": "HowToStep",
      position: s.position,
      text: s.text,
    })),
  };
}

export function organizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Stehlen Auto",
    url: baseUrl,
    logo: `${baseUrl}/images/stehlen-logo.png`,
    description:
      "Heavy-duty truck, SUV, and Jeep accessories. Bolt-on engineering since 2015. Fitment guaranteed.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1160 W. Rincon St",
      addressLocality: "Corona",
      addressRegion: "CA",
      postalCode: "92878",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-888-378-4536",
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: ["English"],
    },
    // Cycle 14Z (Priya O-6 HIGH): the YouTube channel @stehlenauto does not
    // exist (404). Returning a dead URL in sameAs makes Google distrust the
    // entire Organization graph. Re-add when the channel ships.
    sameAs: [
      "https://www.facebook.com/stehlenauto",
      "https://www.instagram.com/stehlenauto",
    ],
  };
}
