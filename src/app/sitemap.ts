import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
  const now = new Date();
  // Phase 0: static routes only. Phase 1 will add product + collection routes
  // sourced from Shopify Storefront API.
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/welcome-back`, lastModified: now, priority: 0.7 },
  ];
}
