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
