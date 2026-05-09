import type {
  Category,
  CatalogProduct,
  FilterGroup,
  FitmentRow,
  PopularVehicle,
  ProductReview,
} from "./types";

/**
 * CATEGORIES — reconciled to actual Shopify Storefront-API collection handles
 * after the cycle-3 catalog audit (1,322 products live across 36 collections).
 * Every slug here MUST be a real Shopify collection.handle. The audit script
 * (scripts/shopify-storefront-probe.ts) is the source of truth — re-run it any
 * time merchandising adds/renames a collection.
 *
 * Old guess-slugs that didn't exist: bed-lights, fender-flares, tail-lights,
 * recovery — all dropped until the warehouse stocks them.
 */
export const CATEGORIES: Category[] = [
  {
    slug: "tonneau-covers",
    name: "Tonneau Covers",
    count: 287,
    image: "/images/categories/TONNEAU COVER - LOCK & ROLL UP.jpg",
  },
  {
    slug: "trailer-hitches",
    name: "Trailer Hitches",
    count: 286,
    image: "/images/categories/HITCH STEPS.jpg",
  },
  {
    slug: "bull-guards-grille-guards",
    name: "Bull Guards & Grille Guards",
    count: 186,
    image: "/images/categories/BULL BAR - ADVANCE SERIES.jpg",
  },
  {
    slug: "front-grilles",
    name: "Front Grilles",
    count: 167,
    image: "/images/categories/FRONT GRILLES.jpg",
  },
  {
    slug: "headlights",
    name: "Headlights",
    count: 160,
    image: "/images/categories/FULL LED PROJECTOR HEADLIGHTS.jpg",
  },
  {
    slug: "truck-bed-mats",
    name: "Truck Bed Mats",
    count: 133,
    image: "/images/categories/TRUCK BED MOLLE PANELS.jpg",
  },
  {
    slug: "running-boards-side-steps",
    name: "Running Boards & Side Steps",
    count: 51,
    image: "/images/categories/MODULAR STYLE RUNNING BOARDS.jpg",
  },
  {
    slug: "floor-mats",
    name: "Floor Mats",
    count: 39,
    image: "/images/categories/RUBBER FLOOR MATS.jpg",
  },
  {
    slug: "roof-racks-baskets",
    name: "Roof Racks & Baskets",
    count: 7,
    image: "/images/categories/ROOF RACKS.jpg",
  },
  {
    slug: "chase-racks-sport-bars",
    name: "Chase Racks & Sport Bars",
    count: 3,
    image: "/images/categories/CHASE RACKS.jpg",
  },
  {
    slug: "molle-panels",
    name: "MOLLE Panels",
    count: 2,
    image: "/images/categories/TRUCK BED MOLLE PANELS.jpg",
  },
  {
    slug: "under-seat-storage",
    name: "Under Seat Storage",
    count: 2,
    // Cycle 8 (owner): tile was rendering as a blank grey rectangle on the
    // home category grid because no image was set. Using the closest-fit
    // existing asset (console organizer is the same product family).
    image: "/images/categories/CONSOLE ORGANIZER.jpg",
  },
];

export const POPULAR_VEHICLES: PopularVehicle[] = [
  { make: "Ford", model: "F-150", years: "2015–2026", count: 312 },
  { make: "Chevrolet", model: "Silverado", years: "2014–2026", count: 287 },
  { make: "Ram", model: "1500", years: "2009–2026", count: 241 },
  { make: "Toyota", model: "Tacoma", years: "2016–2026", count: 198 },
  { make: "Jeep", model: "Wrangler", years: "2007–2026", count: 174 },
  { make: "Toyota", model: "Tundra", years: "2007–2026", count: 156 },
  { make: "GMC", model: "Sierra", years: "2014–2026", count: 143 },
  { make: "Nissan", model: "Frontier", years: "2005–2026", count: 89 },
];

const ROOF_RACK_IMG = "/images/categories/ROOF RACKS.jpg";

export const PRODUCTS: CatalogProduct[] = [
  {
    sku: "RR-LP-UNI-STL-2",
    handle: "stehlen-universal-door-frame-mount-roof-rack",
    title: "Stehlen Universal Door-Frame Mount Roof Rack",
    fitTitle:
      "Stehlen Door-Frame Mount Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew",
    price: 489,
    compareAt: 549,
    image: ROOF_RACK_IMG,
    rating: 4.7,
    reviews: 128,
    badges: ["BEST SELLER"],
    chips: ["BLACK", "STEEL", "CREW CAB"],
    category: "roof-racks",
    fits: true,
    inventory: 47,
  },
  {
    sku: "RR-LP-UNI-STL-3",
    handle: "stehlen-low-profile-roof-rack",
    title: "Stehlen Low-Profile Roof Rack",
    fitTitle:
      "Stehlen Low-Profile Aluminum Roof Rack | Fits 2014–2026 Ford F-150 / SuperCrew",
    price: 559,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.8,
    reviews: 92,
    badges: ["NEW"],
    chips: ["BLACK", "ALUMINUM", "5' BED"],
    category: "roof-racks",
    fits: true,
    inventory: 22,
  },
  {
    sku: "RR-HD-CRW-STL-1",
    handle: "stehlen-heavy-duty-crossbar-set",
    title: "Stehlen Heavy-Duty Crossbar Set",
    fitTitle:
      "Stehlen Heavy-Duty Steel Crossbar Set | Fits 2018–2026 Ford F-150 / Crew",
    price: 329,
    compareAt: 379,
    image: ROOF_RACK_IMG,
    rating: 4.6,
    reviews: 67,
    badges: ["SALE"],
    chips: ["BLACK", "STEEL"],
    category: "roof-racks",
    fits: true,
    inventory: 89,
  },
  {
    sku: "RR-MOD-OVR-STL-1",
    handle: "stehlen-modular-overland-rack",
    title: "Stehlen Modular Overland Rack",
    fitTitle:
      "Stehlen Modular Overland Rack | Fits 2015–2026 Ford F-150 / 6.5' Bed",
    price: 729,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.9,
    reviews: 41,
    badges: [],
    chips: ["BLACK", "STEEL", "6.5' BED"],
    category: "roof-racks",
    fits: true,
    inventory: 12,
  },
  {
    sku: "RR-CGO-LRG-STL-1",
    handle: "stehlen-cargo-roof-basket",
    title: "Stehlen Cargo Roof Basket",
    fitTitle: "Stehlen Cargo Roof Basket | Universal Fit",
    price: 219,
    compareAt: 259,
    image: ROOF_RACK_IMG,
    rating: 4.4,
    reviews: 215,
    badges: ["BEST SELLER"],
    chips: ["BLACK", "STEEL", "UNIVERSAL"],
    category: "roof-racks",
    fits: false,
    inventory: 142,
  },
  {
    sku: "RR-LP-UNI-STL-4",
    handle: "stehlen-adventure-roof-platform",
    title: "Stehlen Adventure Roof Platform",
    fitTitle:
      "Stehlen Adventure Roof Platform | Fits 2009–2018 Ford F-150",
    price: 619,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.7,
    reviews: 58,
    badges: [],
    chips: ["BLACK", "STEEL", "EXTENDED CAB"],
    category: "roof-racks",
    fits: false,
    inventory: 34,
  },
  {
    sku: "RR-RUG-XLT-STL-1",
    handle: "stehlen-rugged-cargo-roof-rack",
    title: "Stehlen Rugged Cargo Roof Rack",
    fitTitle:
      "Stehlen Rugged Cargo Roof Rack | Fits 2015–2026 Ford F-150 / SuperCab",
    price: 449,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.5,
    reviews: 73,
    badges: [],
    chips: ["BLACK", "STEEL", "SUPERCAB"],
    category: "roof-racks",
    fits: true,
    inventory: 28,
  },
  {
    sku: "RR-FLT-FLT-STL-1",
    handle: "stehlen-flat-top-roof-rack",
    title: "Stehlen Flat Top Roof Rack",
    fitTitle:
      "Stehlen Flat Top Roof Rack | Fits 2014–2026 Ford F-150 / All Cabs",
    price: 389,
    compareAt: 439,
    image: ROOF_RACK_IMG,
    rating: 4.6,
    reviews: 104,
    badges: ["SALE"],
    chips: ["BLACK", "ALUMINUM"],
    category: "roof-racks",
    fits: true,
    inventory: 56,
  },
  {
    sku: "RR-EXP-DLX-STL-1",
    handle: "stehlen-expedition-deluxe-rack",
    title: "Stehlen Expedition Deluxe Rack",
    fitTitle:
      "Stehlen Expedition Deluxe Rack System | Fits 2017–2026 Ford F-150",
    price: 899,
    compareAt: 999,
    image: ROOF_RACK_IMG,
    rating: 4.9,
    reviews: 32,
    badges: ["NEW", "SALE"],
    chips: ["BLACK", "STEEL", "5.5' BED"],
    category: "roof-racks",
    fits: true,
    inventory: 8,
  },
  {
    sku: "RR-PRO-MTL-STL-1",
    handle: "stehlen-pro-metal-roof-rack",
    title: "Stehlen Pro Metal Roof Rack",
    fitTitle:
      "Stehlen Pro Metal Roof Rack | Fits 2015–2026 Ford F-150",
    price: 519,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.5,
    reviews: 87,
    badges: [],
    chips: ["BLACK", "STEEL"],
    category: "roof-racks",
    fits: true,
    inventory: 41,
  },
  {
    sku: "RR-MIN-CMP-STL-1",
    handle: "stehlen-minimalist-roof-rack",
    title: "Stehlen Minimalist Roof Rack",
    fitTitle:
      "Stehlen Minimalist Compact Roof Rack | Fits 2009–2014 Ford F-150",
    price: 269,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.3,
    reviews: 64,
    badges: [],
    chips: ["BLACK", "ALUMINUM", "REGULAR CAB"],
    category: "roof-racks",
    fits: false,
    inventory: 73,
  },
  {
    sku: "RR-OVR-LND-STL-2",
    handle: "stehlen-overland-tactical-rack",
    title: "Stehlen Overland Tactical Rack",
    fitTitle:
      "Stehlen Overland Tactical Rack | Fits 2015–2026 Ford F-150 / Crew",
    price: 759,
    compareAt: null,
    image: ROOF_RACK_IMG,
    rating: 4.8,
    reviews: 51,
    badges: [],
    chips: ["BLACK", "STEEL", "CREW CAB"],
    category: "roof-racks",
    fits: true,
    inventory: 19,
  },
];

export const RECENTLY_VIEWED: CatalogProduct[] = PRODUCTS.slice(2, 6);

export const BEST_SELLERS: CatalogProduct[] = PRODUCTS.slice(0, 4);

export const REVIEWS: ProductReview[] = [
  {
    name: "Mike R.",
    date: "Apr 14, 2026",
    rating: 5,
    vehicle: "2019 Ford F-150 SuperCrew",
    title: "Bombproof construction",
    body: "Installed in about 90 minutes with a buddy. Powder coat is thick, mounting hardware is grade-8. Hauled two kayaks across Nevada at 80mph and the rack didn't shift a millimeter. Worth every penny.",
  },
  {
    name: "Dale W.",
    date: "Mar 28, 2026",
    rating: 5,
    vehicle: "2021 Ford F-150",
    title: "Fitment exact",
    body: "Door-frame mount lined up perfectly. Drilling-free is the truth. Shipped in two boxes, no damage.",
  },
  {
    name: "Carlos T.",
    date: "Mar 02, 2026",
    rating: 4,
    vehicle: "2017 Ford F-150 Crew",
    title: "Heavy but solid",
    body: "Took two of us to lift it up there but once it's mounted, this thing is a tank. Slats are thick gauge, no flex. Shaved a star because instructions could be clearer on torque specs.",
  },
  {
    name: "Jess H.",
    date: "Feb 19, 2026",
    rating: 5,
    vehicle: "2022 Ford F-150 SuperCrew",
    title: "Clean look, no rattles",
    body: "Was nervous about wind noise — none. Looks factory.",
  },
];

export const FITMENT_ROWS: FitmentRow[] = [
  { years: "2021–2026", cab: "SuperCrew · 5.5' Bed", fits: true },
  { years: "2015–2020", cab: "SuperCrew · 5.5' Bed", fits: true },
  { years: "2014", cab: "Crew Cab · 5.5' Bed", fits: true },
  { years: "2009–2013", cab: "All bed lengths", fits: false },
];

export const ROOF_RACK_FILTERS: FilterGroup[] = [
  {
    title: "BED LENGTH",
    type: "check",
    items: [
      { label: "5' Bed", count: 12 },
      { label: "5.5' Bed", count: 24 },
      { label: "6.5' Bed", count: 38 },
      { label: "8' Bed", count: 8 },
    ],
  },
  {
    title: "CAB TYPE",
    type: "check",
    items: [
      { label: "Crew Cab", count: 54 },
      { label: "SuperCab", count: 32 },
      { label: "Regular Cab", count: 12 },
    ],
  },
  {
    title: "COLOR",
    type: "check",
    items: [
      { label: "Black", count: 86 },
      { label: "Matte Black", count: 24 },
      { label: "Aluminum", count: 8 },
    ],
  },
  {
    title: "MATERIAL",
    type: "check",
    items: [
      { label: "Steel", count: 72 },
      { label: "Aluminum", count: 38 },
      { label: "ABS", count: 6 },
    ],
  },
  { title: "PRICE", type: "price", items: [] },
  {
    title: "BRAND",
    type: "check",
    items: [
      { label: "Stehlen Pro", count: 54 },
      { label: "Stehlen Heavy-Duty", count: 32 },
      { label: "Stehlen Universal", count: 56 },
    ],
  },
];
