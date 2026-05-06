import "server-only";
import { createAdminApiClient } from "@shopify/admin-api-client";

const ADMIN_API_VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-01";

function normalizeDomain(input: string | undefined): string {
  if (!input) return "";
  return input
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .trim();
}

const domain = normalizeDomain(
  process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
);
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN ?? "";

export const shopifyAdminConfigured = Boolean(domain && accessToken);

const _client = shopifyAdminConfigured
  ? createAdminApiClient({
      storeDomain: domain,
      apiVersion: ADMIN_API_VERSION,
      accessToken,
    })
  : null;

export async function shopifyAdminFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  if (!_client) throw new Error("Shopify Admin API is not configured");
  const { data, errors } = await _client.request(query, { variables });
  if (errors) {
    const message =
      typeof errors === "string"
        ? errors
        : (errors.message ?? JSON.stringify(errors));
    throw new Error(`Shopify Admin error: ${message}`);
  }
  if (!data) throw new Error("Shopify Admin returned no data");
  return data as T;
}
