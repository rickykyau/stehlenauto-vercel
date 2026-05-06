import type { MetadataRoute } from "next";
import { CATEGORIES, POPULAR_VEHICLES, PRODUCTS } from "@/lib/catalog/mock";
import {
  listShopifyCollections,
  listShopifyProducts,
} from "@/lib/shopify/sitemap";

const POLICIES = [
  "warranty",
  "returns",
  "shipping",
  "fitment-guarantee",
  "privacy",
  "terms",
  "ccpa",
  "prop-65",
  "accessibility",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
  const now = new Date();

  // Pull live Shopify catalog if configured; fall back to mock.
  const [shopifyProducts, shopifyCollections] = await Promise.all([
    listShopifyProducts(),
    listShopifyCollections(),
  ]);

  const productEntries: MetadataRoute.Sitemap =
    shopifyProducts.length > 0
      ? shopifyProducts.map((p) => ({
          url: `${base}/products/${p.handle}`,
          lastModified: new Date(p.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      : PRODUCTS.map((p) => ({
          url: `${base}/products/${p.handle}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));

  const collectionEntries: MetadataRoute.Sitemap =
    shopifyCollections.length > 0
      ? shopifyCollections.map((c) => ({
          url: `${base}/collections/${c.handle}`,
          lastModified: new Date(c.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      : CATEGORIES.map((c) => ({
          url: `${base}/collections/${c.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));

  const vehicleEntries: MetadataRoute.Sitemap = POPULAR_VEHICLES.map((v) => ({
    url: `${base}/vehicle/${v.make.toLowerCase()}-${v.model.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const policyEntries: MetadataRoute.Sitemap = POLICIES.map((slug) => ({
    url: `${base}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/help/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/help/install`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/welcome-back`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...collectionEntries,
    ...productEntries,
    ...vehicleEntries,
    ...policyEntries,
  ];
}
