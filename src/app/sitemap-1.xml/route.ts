import { getSitemapEntries } from "@/lib/seo/sitemap-entries";

/**
 * Fresh-path mirror of /sitemap.xml. Identical content (shared builder),
 * but a brand-new URL Google has never fetched — so it has no cached
 * "couldn't read" state from the DNS-cutover window. Submit THIS in Search
 * Console to force a clean first read. Served as a hand-built route handler
 * (not the Next metadata convention) precisely so it lives at a custom path.
 */
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET(): Promise<Response> {
  const entries = await getSitemapEntries();

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => {
        const lastmod =
          e.lastModified instanceof Date
            ? e.lastModified.toISOString()
            : e.lastModified
              ? new Date(e.lastModified).toISOString()
              : undefined;
        return (
          `  <url>\n` +
          `    <loc>${esc(String(e.url))}</loc>\n` +
          (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
          (e.changeFrequency ? `    <changefreq>${e.changeFrequency}</changefreq>\n` : "") +
          (e.priority !== undefined ? `    <priority>${e.priority}</priority>\n` : "") +
          `  </url>`
        );
      })
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
