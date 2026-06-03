import type { MetadataRoute } from "next";

// Transactional / auth / private paths no bot should crawl. Shared by the
// wildcard rule and every named AI-crawler rule so an answer engine can't
// deep-link a shopper into a half-built cart or an auth wall.
//
// Cycle 14Z (Priya O-2 CRITICAL): all of these set robots:{index:false} in
// metadata, but without an explicit robots.txt Disallow, Googlebot still
// burns crawl budget discovering they're noindex. 1,300+ products need that
// budget; every wasted hit on a transactional/auth page delays product
// re-crawl.
const DISALLOW = [
  "/api/",
  "/account/",
  "/admin",
  "/cart",
  "/checkout",
  "/returns/",
  "/sign-in",
  "/sign-up",
  "/order/",
];

// GEO (Generative Engine Optimization): explicitly WELCOME the AI answer /
// search crawlers. Stehlen wants to be the cited source when a shopper asks
// ChatGPT / Perplexity / Gemini / Claude "best no-drill tonneau cover for a
// 2021 F-150." Listing them by name (rather than leaning on the "*" rule)
// removes ambiguity and is the lever these engines document. Storefront
// content is public marketing — visibility beats content-protection here, so
// we allow both the live-answer bots AND the training crawlers; every one
// still inherits the transactional DISALLOW list above.
const AI_CRAWLERS = [
  // OpenAI — ChatGPT search, citations, and training
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic — Claude search + training
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google AI (Gemini / AI Overviews opt-in) + Apple Intelligence
  "Google-Extended",
  "Applebot-Extended",
  // Common Crawl (feeds many LLMs) + Amazon + Meta + Cohere + DuckAssist
  "CCBot",
  "Amazonbot",
  "Meta-ExternalAgent",
  "cohere-ai",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://stehlenauto.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/sitemap-1.xml`],
  };
}
