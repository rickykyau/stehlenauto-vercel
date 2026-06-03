import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "images.shopifycdn.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  // DNS cutover (docs/runbooks/dns-cutover.md §3): preserve link equity from
  // the legacy Lovable URL shapes that changed in this rebuild. Everything
  // else (/, /products/*, /collections/*, /cart, /about, …) is path-identical
  // and needs no redirect. 301 (permanent) so Google transfers ranking.
  async redirects() {
    return [
      // Canonicalize www → apex so there's one indexable host (kills the
      // duplicate-content signal; apex is our canonical everywhere).
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.stehlenauto.com" }],
        destination: "https://stehlenauto.com/:path*",
        permanent: true,
      },
      { source: "/contact", destination: "/help/contact", permanent: true },
      { source: "/returns", destination: "/legal/returns", permanent: true },
      { source: "/warranty", destination: "/legal/warranty", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
    ];
  },
};

export default nextConfig;
