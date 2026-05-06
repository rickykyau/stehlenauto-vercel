/**
 * Mega-nav data — every link target MUST resolve to a real route or a real
 * Shopify collection handle. After cycle 3 reconciliation we point at:
 *  - Vehicle hubs `/vehicle/{make-model}` for the popular-vehicle list
 *  - Real Shopify collections `/collections/{handle}` for category links
 *  - Make-scoped Shopify collections `/collections/{make}-parts` (Storefront
 *    probe confirmed these exist for the major makes).
 *
 * Anything else gets dropped from the menu rather than 404 the customer.
 */

export type MegaColumn = {
  title: string;
  items: { label: string; href: string }[];
};

export type MegaFeature = {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
};

export type MegaSection = {
  label: string;
  href: string;
  columns: MegaColumn[];
  feature?: MegaFeature;
};

export const MEGA_SECTIONS: MegaSection[] = [
  {
    label: "Shop by Vehicle",
    href: "/collections",
    columns: [
      {
        title: "BY MAKE",
        items: [
          { label: "Ford", href: "/collections/ford-parts" },
          { label: "Chevrolet", href: "/collections/chevy-parts" },
          { label: "Ram", href: "/collections/dodge-parts" },
          { label: "Toyota", href: "/collections/toyota-parts" },
          { label: "Jeep", href: "/collections/jeep-parts" },
          { label: "GMC", href: "/collections/gmc-parts" },
          { label: "Nissan", href: "/collections/nissan-parts" },
          { label: "Dodge", href: "/collections/dodge-parts" },
          { label: "Honda", href: "/collections/honda-parts" },
          { label: "Hyundai", href: "/collections/hyundai-parts" },
        ],
      },
      {
        title: "POPULAR",
        items: [
          { label: "Ford F-150", href: "/vehicle/ford-f-150" },
          { label: "Chevy Silverado", href: "/vehicle/chevrolet-silverado" },
          { label: "Ram 1500", href: "/vehicle/ram-1500" },
          { label: "Toyota Tacoma", href: "/vehicle/toyota-tacoma" },
          { label: "Jeep Wrangler", href: "/vehicle/jeep-wrangler" },
          { label: "Toyota Tundra", href: "/vehicle/toyota-tundra" },
          { label: "GMC Sierra", href: "/vehicle/gmc-sierra" },
          { label: "Nissan Frontier", href: "/vehicle/nissan-frontier" },
        ],
      },
      {
        title: "BY BODY",
        items: [
          { label: "Pickup Trucks", href: "/collections" },
          { label: "SUVs", href: "/collections" },
          { label: "Jeeps", href: "/collections/jeep-parts" },
        ],
      },
    ],
    feature: {
      eyebrow: "GARAGE",
      title: "Save up to 5 vehicles",
      body: "Sign in to keep your fitment ready across every visit.",
      cta: { label: "Sign In", href: "/account" },
    },
  },
  {
    label: "Exterior",
    href: "/collections",
    columns: [
      {
        title: "PROTECTION",
        items: [
          {
            label: "Bull Guards & Grille Guards",
            href: "/collections/bull-guards-grille-guards",
          },
          {
            label: "MOLLE Panels",
            href: "/collections/molle-panels",
          },
        ],
      },
      {
        title: "STYLE",
        items: [
          { label: "Front Grilles", href: "/collections/front-grilles" },
          { label: "Headlights", href: "/collections/headlights" },
        ],
      },
      {
        title: "FUNCTION",
        items: [
          {
            label: "Running Boards & Side Steps",
            href: "/collections/running-boards-side-steps",
          },
          {
            label: "Roof Racks & Baskets",
            href: "/collections/roof-racks-baskets",
          },
          {
            label: "Chase Racks & Sport Bars",
            href: "/collections/chase-racks-sport-bars",
          },
          { label: "Tonneau Covers", href: "/collections/tonneau-covers" },
        ],
      },
    ],
  },
  {
    label: "Cargo & Bed",
    href: "/collections/tonneau-covers",
    columns: [
      {
        title: "TONNEAU COVERS",
        items: [
          { label: "All Tonneau Covers", href: "/collections/tonneau-covers" },
        ],
      },
      {
        title: "BED PROTECTION",
        items: [
          { label: "Truck Bed Mats", href: "/collections/truck-bed-mats" },
          { label: "MOLLE Panels", href: "/collections/molle-panels" },
        ],
      },
      {
        title: "BED ACCESSORIES",
        items: [
          {
            label: "Chase Racks & Sport Bars",
            href: "/collections/chase-racks-sport-bars",
          },
          {
            label: "Under Seat Storage",
            href: "/collections/under-seat-storage",
          },
        ],
      },
    ],
  },
  {
    label: "Lighting",
    href: "/collections/headlights",
    columns: [
      {
        title: "HEADLIGHTS",
        items: [
          {
            label: "All Headlights",
            href: "/collections/headlights",
          },
        ],
      },
    ],
  },
  {
    label: "Towing",
    href: "/collections/trailer-hitches",
    columns: [
      {
        title: "HITCHES",
        items: [
          { label: "All Trailer Hitches", href: "/collections/trailer-hitches" },
        ],
      },
    ],
  },
];
