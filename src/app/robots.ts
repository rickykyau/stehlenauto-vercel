import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Cycle 14Z (Priya O-2 CRITICAL): added /checkout, /returns/,
        // /sign-in, /sign-up, /order/ disallows. All set
        // robots:{index:false} in metadata, but without explicit
        // robots.txt Disallow, Googlebot still burns crawl budget
        // discovering they're noindex. 1,300+ products need crawl budget;
        // every wasted hit on a transactional/auth page delays product
        // re-crawl.
        disallow: [
          "/api/",
          "/account/",
          "/admin",
          "/cart",
          "/checkout",
          "/returns/",
          "/sign-in",
          "/sign-up",
          "/order/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
