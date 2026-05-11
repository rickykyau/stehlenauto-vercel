export type Money = {
  amount: string;
  currencyCode: string;
};

export type ImageNode = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ProductVariantNode = {
  id: string;
  sku: string | null;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
};

export type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  description: string;
  descriptionHtml: string;
  featuredImage: ImageNode | null;
  images: { nodes: ImageNode[] };
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  variants: { nodes: ProductVariantNode[] };
  totalInventory: number | null;
  // Cycle 14L (owner): canonical part number from cb_integration.item_name
  // (e.g. "TC-FRON05-5-HSS"). Verified live in Shopify Admin metafields.
  cbItemName?: { value: string | null } | null;
  // Cycle 14X (owner): per-product fitment metafields under the "custom"
  // namespace, populated by the merch team via Shopify Admin. All optional.
  // Cycle 14AS Step E: fitment_years/makes/models removed — fitment_applications
  // is sole source. fitmentNotes + fitmentSubattributes remain for warehouse
  // exclusion notes + sub-attribute chips (bed length, cab type, trim, etc.).
  fitmentNotes?: ShopifyMetafieldNode | null;
  fitmentSubattributes?: ShopifyMetafieldNode | null;
  /** Cycle 14AS: per-application JSON ({year, make, model, submodel?}[]). */
  fitmentApplications?: ShopifyMetafieldNode | null;
};

export type ShopifyMetafieldNode = {
  type: string | null;
  value: string | null;
};

export type FilterValueNode = {
  id: string;
  label: string;
  count: number;
  input: string;
};

export type FilterNode = {
  id: string;
  label: string;
  type: "LIST" | "PRICE_RANGE" | "BOOLEAN" | string;
  values: FilterValueNode[];
};

export type CollectionNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ImageNode | null;
  products: {
    nodes: ProductNode[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    filters?: FilterNode[];
  };
};

export type Connection<T> = {
  nodes: T[];
  pageInfo?: { hasNextPage: boolean; endCursor: string | null };
};
