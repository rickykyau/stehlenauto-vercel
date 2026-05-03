import { createStorefrontApiClient } from "@shopify/storefront-api-client";

const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
const publicAccessToken = process.env.SHOPIFY_STOREFRONT_TOKEN || "";

export const storefrontClient = createStorefrontApiClient({
  storeDomain: domain,
  apiVersion: "2025-01",
  publicAccessToken,
});

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const { data, errors } = await storefrontClient.request(query, {
    variables,
  });
  if (errors) {
    throw new Error(
      typeof errors === "string"
        ? errors
        : (errors.message ?? JSON.stringify(errors)),
    );
  }
  return data as T;
}
