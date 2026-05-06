import { createStorefrontApiClient } from "@shopify/storefront-api-client";

function normalizeDomain(input: string | undefined): string {
  if (!input) return "";
  return input
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();
}

const STOREFRONT_API_VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-01";

const domain = normalizeDomain(
  process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
);

const publicAccessToken =
  process.env.SHOPIFY_STOREFRONT_TOKEN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
  "";

export const shopifyConfigured = Boolean(domain && publicAccessToken);

const _client = shopifyConfigured
  ? createStorefrontApiClient({
      storeDomain: domain,
      apiVersion: STOREFRONT_API_VERSION,
      publicAccessToken,
    })
  : null;

export class ShopifyNotConfiguredError extends Error {
  constructor() {
    super(
      "Shopify Storefront API is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN.",
    );
    this.name = "ShopifyNotConfiguredError";
  }
}

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  if (!_client) throw new ShopifyNotConfiguredError();
  const { data, errors } = await _client.request(query, { variables });
  if (errors) {
    const message =
      typeof errors === "string"
        ? errors
        : (errors.message ?? JSON.stringify(errors));
    throw new Error(`Shopify Storefront error: ${message}`);
  }
  if (!data) throw new Error("Shopify Storefront returned no data");
  return data as T;
}

export const shopifyDomain = domain;
