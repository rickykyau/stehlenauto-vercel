export const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    vendor
    productType
    tags
    description
    descriptionHtml
    totalInventory
    featuredImage {
      url
      altText
      width
      height
    }
    # Cycle 7 (owner): real gallery, not the featured image x4. Storefront
    # caps the first arg at 250 per connection; 50 covers every real product
    # on the site with headroom for richer galleries without a query change.
    images(first: 50) {
      nodes {
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 100) {
      nodes {
        id
        sku
        title
        availableForSale
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
      }
    }
    # Cycle 14L (owner): merch team uses a Shopify metafield called
    # "CB Item Name" for the canonical part number that customers see in
    # spec sheets and invoices. Verified live against Admin API: it lives
    # under namespace cb_integration with key item_name (e.g. value
    # "TC-FRON05-5-HSS"). Use it as the displayed SKU instead of the auto-
    # generated variant.sku.
    cbItemName: metafield(namespace: "cb_integration", key: "item_name") {
      value
    }
    # Cycle 14X (owner): structured fitment metafields the warehouse merch
    # team populates in Shopify Admin. All optional — when absent, the PDP
    # falls back to title-derived rows. All five fields live under the
    # default "custom" user namespace.
    #
    #   custom.fitment_years         list.single_line_text_field
    #   custom.fitment_makes         list.single_line_text_field
    #   custom.fitment_models        list.single_line_text_field
    #   custom.fitment_notes         multi_line_text_field (HTML allowed)
    #   custom.fitment_subattributes json
    #
    # The list types serialize as a JSON array string in metafield.value, so
    # the consumer must JSON.parse(value) to get the array. Single-line and
    # multi-line text are returned as raw strings.
    fitmentYears: metafield(namespace: "custom", key: "fitment_years") {
      type
      value
    }
    fitmentMakes: metafield(namespace: "custom", key: "fitment_makes") {
      type
      value
    }
    fitmentModels: metafield(namespace: "custom", key: "fitment_models") {
      type
      value
    }
    fitmentNotes: metafield(namespace: "custom", key: "fitment_notes") {
      type
      value
    }
    fitmentSubattributes: metafield(
      namespace: "custom"
      key: "fitment_subattributes"
    ) {
      type
      value
    }
    # Cycle 14AS: per-application records — JSON array of {year, make,
    # model, submodel?}. Source of truth for FITS YOUR VEHICLE verdict.
    # Replaces the broken flat year/make/model lists.
    fitmentApplications: metafield(
      namespace: "custom"
      key: "fitment_applications"
    ) {
      type
      value
    }
  }
`;

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetProducts(
    $first: Int!
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      nodes {
        ...ProductFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

export const SITEMAP_PRODUCTS_QUERY = /* GraphQL */ `
  query SitemapProducts($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
  }
`;

export const SITEMAP_COLLECTIONS_QUERY = /* GraphQL */ `
  query SitemapCollections($first: Int!, $cursor: String) {
    collections(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
  }
`;

export const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query PredictiveSearch($query: String!) {
    predictiveSearch(query: $query, limit: 6, types: [PRODUCT, COLLECTION, QUERY]) {
      products {
        id
        handle
        title
        featuredImage { url altText width height }
        priceRange {
          minVariantPrice { amount currencyCode }
        }
      }
      collections {
        id
        handle
        title
      }
      queries {
        text
      }
    }
  }
`;

export const GET_COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FRAGMENT}
  query GetCollectionByHandle(
    $handle: String!
    $first: Int!
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(
        first: $first
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          ...ProductFields
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        # Cycle 4 (Mike F-36): collection-wide facet counts. Shopify Storefront
        # returns these off the full collection (not the visible page) for free
        # when we ask via filters{} on the products connection.
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
      }
    }
  }
`;
