export type Category = {
  slug: string;
  name: string;
  count: number;
  image: string | null;
};

export type PopularVehicle = {
  make: string;
  model: string;
  years: string;
  count: number;
};

export type ProductBadge = "NEW" | "SALE" | "BEST SELLER";

export type CatalogProduct = {
  sku: string;
  handle: string;
  title: string;
  fitTitle: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  rating: number;
  reviews: number;
  badges: ProductBadge[];
  chips: string[];
  category: string;
  /** Plain-text product description from Shopify (Cycle 14c). Used as the
   *  honest fallback content in PDP FEATURES / SPECS tabs that previously
   *  rendered hardcoded roof-rack template copy. Empty string when blank. */
  description?: string;
  descriptionHtml?: string;
  /**
   * Real Shopify collection handle this product lives in (the URL-safe slug,
   * NOT the free-text productType). Used by the PDP breadcrumb and any
   * "shop the category" link so they don't construct invalid /collections/
   * URLs from the product type. Falls back to product.category when the
   * adapter can't resolve a handle.
   */
  categoryHandle?: string;
  categoryTitle?: string;
  /**
   * Full image gallery from Shopify (up to 8 in the GraphQL fragment).
   * The PDP gallery used to render `[image, image, image, image]` (the same
   * featured image 4 times) — owner-flagged. Surface the real array.
   */
  images?: { url: string; altText: string | null }[];
  /**
   * Fitment vs the saved vehicle:
   *  - true  = positively confirmed fit
   *  - false = positively confirmed mismatch
   *  - undefined = unknown / unverified (default for live Shopify products
   *    until ACES/PIES tagging is wired). UI must NOT paint a green "✓ FITS"
   *    badge for unknown — only for true.
   */
  fits: boolean | undefined;
  /** Raw Shopify tags or mock-data tokens we can match for fitment checks. */
  vehicleTags?: string[];
  inventory: number;
  /** Cycle 14X (owner): when warehouse merch has populated the structured
   *  custom.fitment_* metafields, this is the parsed table. Absent until a
   *  product gets metafield values in Shopify Admin. */
  fitmentTable?: FitmentTable;
};

export type ProductReview = {
  name: string;
  date: string;
  rating: number;
  vehicle: string;
  title: string;
  body: string;
};

export type FitmentRow = {
  years: string;
  cab: string;
  fits: boolean;
  /** Cycle 14X (owner): optional structured columns, populated when the row
   *  came from real Shopify metafields (custom.fitment_*) instead of being
   *  derived from the title. Renderer shows columns conditionally. */
  make?: string;
  model?: string;
  bedLength?: string;
  cabType?: string;
  trim?: string;
};

/**
 * Cycle 14X (owner): structured fitment data sourced from Shopify metafields
 * under the `custom` namespace. All fields optional — when absent, the PDP
 * falls back to title-derived rows + descriptive notes.
 *
 *   custom.fitment_years         list.single_line_text_field
 *   custom.fitment_makes         list.single_line_text_field
 *   custom.fitment_models        list.single_line_text_field
 *   custom.fitment_notes         multi_line_text_field (HTML allowed)
 *   custom.fitment_subattributes json
 */
export type FitmentTable = {
  years: string[];
  makes: string[];
  models: string[];
  /** Free-form HTML from the merch team. Pre-sanitized server-side. */
  notesHtml: string | null;
  subattributes: FitmentSubattributes;
};

export type FitmentSubattributes = {
  bedLengths?: string[];
  cabTypes?: string[];
  trims?: string[];
  doors?: string[];
  drives?: string[];
  /** Verbatim 4th-field SUBMODEL strings (audit / fallback display). */
  submodels?: string[];
  /** Cycle 14X+ post-sync: Engines this product won't fit. Renders as a
   *  warning callout on PDP. e.g. ["EcoBoost", "Diesel"]. */
  engineExclusions?: string[];
  /** Cycle 14X+ post-sync: Ram bed-cargo-system options. ["RamBox"] means
   *  fits ONLY trucks with the RamBox option; ["Standard"] means fits
   *  ONLY trucks WITHOUT it. Drives PDP variant gating on Ram bed mats. */
  boxOptions?: string[];
  /** Cycle 14X+ post-sync: Sub-models that are explicitly excluded
   *  even though the YMM matches (e.g. F-150 Lightning EV). */
  excludedSubmodels?: string[];
  /** Allow merch to add ad-hoc keys without a code change. */
  [key: string]: string[] | undefined;
};

export type SubModelOption = {
  label: string;
  group: "BED LENGTH" | "CAB TYPE" | "TRIM" | "DOORS";
};

export type FilterFacet = {
  label: string;
  count: number;
  /**
   * JSON-stringified Shopify Storefront ProductFilter value; round-tripped
   * verbatim into the URL so the next request can pass it back to Shopify
   * without our code having to understand the filter taxonomy.
   * Optional only because mock fallback rows have no input.
   */
  input?: string;
};

export type FilterGroup = {
  title: string;
  type: "check" | "price";
  items: FilterFacet[];
};
