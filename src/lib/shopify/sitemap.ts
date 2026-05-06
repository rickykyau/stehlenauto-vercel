import "server-only";
import { shopifyConfigured, shopifyFetch } from "./client";
import {
  SITEMAP_COLLECTIONS_QUERY,
  SITEMAP_PRODUCTS_QUERY,
} from "./queries";

type SitemapNode = { handle: string; updatedAt: string };

type PaginatedResponse<K extends "products" | "collections"> = {
  [k in K]: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: SitemapNode[];
  };
};

async function paginate<K extends "products" | "collections">(
  key: K,
  query: string,
  pageSize = 100,
  hardLimit = 5000,
): Promise<SitemapNode[]> {
  if (!shopifyConfigured) return [];
  const out: SitemapNode[] = [];
  let cursor: string | null = null;
  while (out.length < hardLimit) {
    const data = (await shopifyFetch<PaginatedResponse<K>>(query, {
      first: pageSize,
      cursor,
    })) as PaginatedResponse<K>;
    const page = data[key];
    if (!page) break;
    out.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) break;
    cursor = page.pageInfo.endCursor;
  }
  return out;
}

export async function listShopifyProducts(): Promise<SitemapNode[]> {
  try {
    return await paginate("products", SITEMAP_PRODUCTS_QUERY);
  } catch (err) {
    console.error("[sitemap] product fetch failed:", err);
    return [];
  }
}

export async function listShopifyCollections(): Promise<SitemapNode[]> {
  try {
    return await paginate("collections", SITEMAP_COLLECTIONS_QUERY);
  } catch (err) {
    console.error("[sitemap] collection fetch failed:", err);
    return [];
  }
}
