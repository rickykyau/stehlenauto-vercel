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

// GEO (Generative Engine Optimization): the WebSite node with a
// SearchAction is the single highest-leverage entity for AI answer engines
// (ChatGPT Search, Perplexity, Google AI Overviews, Gemini). It declares
// the canonical site name they should cite ("Stehlen Auto" — not the bare
// domain), and the `potentialAction` tells them the machine-readable
// site-search endpoint so they can deep-link a shopper straight to results
// instead of dumping them on the homepage. It also unlocks the Google
// sitelinks search box.
export function websiteJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Stehlen Auto",
    alternateName: "stehlenauto.com",
    url: baseUrl,
    publisher: { "@type": "Organization", name: "Stehlen Auto", url: baseUrl },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// GEO: AI shopping answers ("where can I buy a tonneau cover that ships
// free with easy returns?") rank Offers by trust signals. shippingDetails +
// hasMerchantReturnPolicy are exactly the two structured fields Google's
// free-listings + AI shopping surfaces read to render the "Free delivery"
// and "Free 30-day returns" badges. Values mirror the on-site policy copy
// (Cycle 14Q free shipping no-minimum; /legal/returns 30-day window).
export function freeShippingDetailsJsonLd() {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: "0",
      currency: "USD",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "US",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 5,
        unitCode: "DAY",
      },
    },
  };
}

export function merchantReturnPolicyJsonLd() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
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
      "Heavy-duty vehicle accessories. Bolt-on engineering since 2015. Fitment guaranteed.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "21912 Garcia Lane",
      addressLocality: "Walnut",
      addressRegion: "CA",
      postalCode: "91789",
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
