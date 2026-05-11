/**
 * Cycle 14AS Step E (owner): destructive one-shot. Deletes the deprecated
 * flat-list fitment metafield DEFINITIONS in Shopify AND cascade-deletes
 * every product's stored values for those keys.
 *
 * Source of truth is now custom.fitment_applications (per-application JSON
 * triples). The flat-list trio (years/makes/models) is gone entirely after
 * this script runs.
 *
 * Irreversible. Only run when:
 *   1. fitment_applications is populated for ALL products (or you accept
 *      the few not-found products will fall through to title-derived rows).
 *   2. checkFitment + PDP display read applications first (cycle 14AS-step2,
 *      step3, step4 deployed).
 *   3. Sync no longer writes the flat lists (cycle 14AS-step4 deployed).
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local pnpm tsx -r dotenv/config \
 *     scripts/delete-deprecated-flat-fitment.ts
 */
import { createAdminApiClient } from "@shopify/admin-api-client";

const ADMIN_API_VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-01";

const domain = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "")
  .trim();
const accessToken = process.env.SHOPIFY_ADMIN_TOKEN ?? "";

const adminClient = domain && accessToken
  ? createAdminApiClient({ storeDomain: domain, apiVersion: ADMIN_API_VERSION, accessToken })
  : null;

if (!adminClient) {
  console.error("Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN + SHOPIFY_ADMIN_TOKEN.");
  process.exit(1);
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { data, errors } = await adminClient!.request(query, { variables });
  if (errors) {
    const message = typeof errors === "string" ? errors : errors.message ?? JSON.stringify(errors);
    throw new Error(`Shopify Admin error: ${message}`);
  }
  if (!data) throw new Error("Shopify Admin returned no data");
  return data as T;
}

const NAMESPACE = "custom";
const KEYS_TO_DELETE = ["fitment_years", "fitment_makes", "fitment_models"];

const LIST_DEFINITIONS_QUERY = /* GraphQL */ `
  query ListDefinition($namespace: String!, $key: String!) {
    metafieldDefinitions(first: 5, ownerType: PRODUCT, namespace: $namespace, key: $key) {
      nodes { id namespace key name }
    }
  }
`;

const DELETE_DEFINITION_MUTATION = /* GraphQL */ `
  mutation DeleteDefinition($id: ID!, $deleteAllAssociatedMetafields: Boolean!) {
    metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields) {
      deletedDefinitionId
      userErrors { field message code }
    }
  }
`;

async function findId(key: string): Promise<string | null> {
  const data = await gql<{ metafieldDefinitions: { nodes: { id: string; key: string }[] } }>(
    LIST_DEFINITIONS_QUERY,
    { namespace: NAMESPACE, key },
  );
  const match = data.metafieldDefinitions.nodes.find((n) => n.key === key);
  return match?.id ?? null;
}

async function deleteOne(key: string): Promise<void> {
  const id = await findId(key);
  if (!id) {
    console.log(`· ${NAMESPACE}.${key} — definition not found (already deleted?)`);
    return;
  }
  const data = await gql<{
    metafieldDefinitionDelete: {
      deletedDefinitionId: string | null;
      userErrors: { field: string[] | null; message: string; code: string | null }[];
    };
  }>(DELETE_DEFINITION_MUTATION, {
    id,
    deleteAllAssociatedMetafields: true,
  });
  const errs = data.metafieldDefinitionDelete.userErrors;
  if (errs.length > 0) {
    console.log(
      `✗ ${NAMESPACE}.${key} — ${errs.map((e) => `${e.code ?? "ERR"}: ${e.message}`).join("; ")}`,
    );
    return;
  }
  console.log(`✓ ${NAMESPACE}.${key} — deleted (id ${data.metafieldDefinitionDelete.deletedDefinitionId}); all product values wiped`);
}

async function main() {
  console.log(`Deleting ${KEYS_TO_DELETE.length} deprecated flat-list metafield definitions in namespace "${NAMESPACE}"…`);
  console.log("This is IRREVERSIBLE. Definitions and ALL product values for these keys will be removed.\n");
  for (const key of KEYS_TO_DELETE) {
    await deleteOne(key);
  }
  console.log("\nDone. fitment_applications is the sole source of truth.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
