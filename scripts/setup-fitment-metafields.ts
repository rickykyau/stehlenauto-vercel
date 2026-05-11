/**
 * Cycle 14X (owner): one-shot script that registers the structured
 * fitment metafield definitions on the Stehlen Shopify store via the Admin
 * API. Run this ONCE per environment so the merch team can populate the
 * fields from Shopify Admin → Products → Metafields.
 *
 * Without registered metafield definitions, two things go wrong:
 *   1. The merch team has no UI to fill them in.
 *   2. The Storefront API will not surface them to anonymous customers
 *      until each definition is granted PUBLIC_READ access.
 *
 * Idempotent: existing definitions are skipped, not duplicated.
 *
 * Usage:
 *   pnpm tsx scripts/setup-fitment-metafields.ts
 *
 * Required env vars (already set in .env.local for the project):
 *   SHOPIFY_STORE_DOMAIN          (e.g. stehlenauto.myshopify.com)
 *   SHOPIFY_ADMIN_TOKEN           (Admin API access token, write_products scope)
 *   NEXT_PUBLIC_SHOPIFY_API_VERSION (defaults to 2026-01)
 */
import { createAdminApiClient } from "@shopify/admin-api-client";

// Cycle 14X (owner): inline the Admin client locally — importing
// @/lib/shopify/admin pulls in `server-only`, which throws when this
// script is run via tsx (it's only valid inside a Next.js server bundle).
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

const shopifyAdminConfigured = Boolean(domain && accessToken);
const adminClient = shopifyAdminConfigured
  ? createAdminApiClient({
      storeDomain: domain,
      apiVersion: ADMIN_API_VERSION,
      accessToken,
    })
  : null;

async function shopifyAdminFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  if (!adminClient) throw new Error("Shopify Admin API is not configured");
  const { data, errors } = await adminClient.request(query, { variables });
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

type Definition = {
  name: string;
  key: string;
  description: string;
  type: string;
  validations?: { name: string; value: string }[];
};

const NAMESPACE = "custom";

const DEFINITIONS: Definition[] = [
  {
    // Cycle 14AS Step A: deprecated. Use fitment_applications instead.
    name: "Fitment — Years",
    key: "fitment_years",
    description:
      "DEPRECATED — use fitment_applications. Storefront reads applications first; this field is fallback only and will be removed.",
    type: "list.single_line_text_field",
  },
  {
    // Cycle 14AS Step A: deprecated. Use fitment_applications instead.
    name: "Fitment — Makes",
    key: "fitment_makes",
    description:
      "DEPRECATED — use fitment_applications. Storefront reads applications first; this field is fallback only and will be removed.",
    type: "list.single_line_text_field",
  },
  {
    // Cycle 14AS Step A: deprecated. Use fitment_applications instead.
    name: "Fitment — Models",
    key: "fitment_models",
    description:
      "DEPRECATED — use fitment_applications. Storefront reads applications first; this field is fallback only and will be removed.",
    type: "list.single_line_text_field",
  },
  {
    name: "Fitment — Notes",
    key: "fitment_notes",
    description:
      "Free-form HTML caveats — Will-Not-Fit exclusions, install gotchas, sub-model qualifiers. Surfaces above the buy-box. Replaces the CSV-backed warehouse note when populated.",
    type: "multi_line_text_field",
  },
  {
    name: "Fitment — Sub-attributes",
    key: "fitment_subattributes",
    description:
      "Structured sub-model facets as JSON. Recognized keys: bed_length, cab_type, trim, doors, drive (each maps to a list of strings). Example: {\"bed_length\":[\"5.5'\",\"6.5'\"],\"cab_type\":[\"SuperCrew\",\"SuperCab\"]}",
    type: "json",
  },
  {
    name: "Fitment — Raw (CA source)",
    key: "fitment_raw",
    description:
      "Verbatim Fitment string from ChannelAdvisor (YEAR|MAKE|MODEL|SUBMODEL::NOTE per line). Audit trail — do not hand-edit; re-run sync to refresh.",
    type: "multi_line_text_field",
  },
  {
    // Cycle 14AS (owner): per-application schema. Replaces the broken
    // flat-list trio (years/makes/models) for fitment verdicts. Each entry
    // is one (year, make, model[, submodel]) triple — no cross-product
    // false positives. This is what storefront checkFitment + Google
    // Shopping feed + eBay Motors Marketplace Connect mapping all read.
    name: "Fitment — Applications (per-application JSON)",
    key: "fitment_applications",
    description:
      "JSON array of per-application records: {year, make, model, submodel?}. Storefront reads for fitment verdict. Source for Google/eBay/Amazon channel feeds. Replaces flat year/make/model lists.",
    type: "json",
  },
];

const CREATE_DEFINITION_MUTATION = /* GraphQL */ `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
        name
        type {
          name
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const LIST_DEFINITIONS_QUERY = /* GraphQL */ `
  query ListMetafieldDefinitions($namespace: String!, $key: String) {
    metafieldDefinitions(
      first: 50
      ownerType: PRODUCT
      namespace: $namespace
      key: $key
    ) {
      nodes {
        id
        namespace
        key
        name
      }
    }
  }
`;

const PIN_DEFINITION_MUTATION = /* GraphQL */ `
  mutation PinDefinition($definitionId: ID!) {
    metafieldDefinitionPin(definitionId: $definitionId) {
      pinnedDefinition {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Cycle 14AS Step A: refresh existing-definition descriptions so the
// flat-list metafields can be re-labeled DEPRECATED in Shopify admin.
const UPDATE_DEFINITION_MUTATION = /* GraphQL */ `
  mutation UpdateDefinition($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
        description
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

type CreateResponse = {
  metafieldDefinitionCreate: {
    createdDefinition: { id: string; namespace: string; key: string } | null;
    userErrors: { field: string[] | null; message: string; code: string | null }[];
  };
};

type ListResponse = {
  metafieldDefinitions: {
    nodes: { id: string; namespace: string; key: string; name: string }[];
  };
};

async function existingDefinitionId(
  namespace: string,
  key: string,
): Promise<string | null> {
  const data = await shopifyAdminFetch<ListResponse>(LIST_DEFINITIONS_QUERY, {
    namespace,
    key,
  });
  const match = data.metafieldDefinitions.nodes.find(
    (n) => n.namespace === namespace && n.key === key,
  );
  return match?.id ?? null;
}

async function createOrSkip(def: Definition): Promise<{
  status: "created" | "exists" | "updated" | "error";
  id: string | null;
  message: string;
}> {
  const existing = await existingDefinitionId(NAMESPACE, def.key);
  if (existing) {
    // Cycle 14AS Step A: refresh description on existing definitions so
    // deprecation labels appear in Shopify admin without a manual edit.
    try {
      const data = await shopifyAdminFetch<{
        metafieldDefinitionUpdate: {
          updatedDefinition: { id: string; description: string | null } | null;
          userErrors: { field: string[] | null; message: string; code: string | null }[];
        };
      }>(UPDATE_DEFINITION_MUTATION, {
        definition: {
          namespace: NAMESPACE,
          key: def.key,
          ownerType: "PRODUCT",
          name: def.name,
          description: def.description,
        },
      });
      const errs = data.metafieldDefinitionUpdate.userErrors;
      if (errs.length > 0) {
        return {
          status: "exists",
          id: existing,
          message: `${NAMESPACE}.${def.key} exists; description update failed: ${errs.map((e) => `${e.code ?? "ERR"}: ${e.message}`).join("; ")}`,
        };
      }
      return {
        status: "updated",
        id: existing,
        message: `${NAMESPACE}.${def.key} description refreshed`,
      };
    } catch (err) {
      return {
        status: "exists",
        id: existing,
        message: `${NAMESPACE}.${def.key} exists; description refresh threw: ${(err as Error).message}`,
      };
    }
  }
  const data = await shopifyAdminFetch<CreateResponse>(
    CREATE_DEFINITION_MUTATION,
    {
      definition: {
        name: def.name,
        namespace: NAMESPACE,
        key: def.key,
        description: def.description,
        type: def.type,
        ownerType: "PRODUCT",
        // Critical: PUBLIC_READ exposes the metafield to the Storefront
        // API. Without this the storefront query returns null even when
        // the definition exists and has values.
        access: { storefront: "PUBLIC_READ" },
        ...(def.validations ? { validations: def.validations } : {}),
      },
    },
  );
  const errs = data.metafieldDefinitionCreate.userErrors;
  if (errs.length > 0) {
    return {
      status: "error",
      id: null,
      message: errs.map((e) => `${e.code ?? "ERR"}: ${e.message}`).join("; "),
    };
  }
  const created = data.metafieldDefinitionCreate.createdDefinition;
  return {
    status: "created",
    id: created?.id ?? null,
    message: `created ${created?.namespace}.${created?.key}`,
  };
}

async function pinIfPossible(definitionId: string, name: string) {
  try {
    await shopifyAdminFetch(PIN_DEFINITION_MUTATION, { definitionId });
    console.log(`  ↳ pinned "${name}" for quick-edit on PDP admin`);
  } catch (err) {
    console.log(
      `  ↳ skipped pin for "${name}" (not fatal): ${(err as Error).message}`,
    );
  }
}

async function main() {
  if (!shopifyAdminConfigured) {
    console.error(
      "Shopify Admin API is not configured. Set SHOPIFY_STORE_DOMAIN + SHOPIFY_ADMIN_TOKEN in .env.local.",
    );
    process.exit(1);
  }

  console.log(`Setting up ${DEFINITIONS.length} fitment metafield definitions in namespace "${NAMESPACE}"…`);

  for (const def of DEFINITIONS) {
    const res = await createOrSkip(def);
    const tag =
      res.status === "created"
        ? "✓"
        : res.status === "updated"
          ? "↻"
          : res.status === "exists"
            ? "·"
            : "✗";
    console.log(`${tag} ${NAMESPACE}.${def.key} — ${res.message}`);
    if (res.status === "created" && res.id) {
      await pinIfPossible(res.id, def.name);
    }
  }

  console.log("\nDone. Visit Shopify Admin → Settings → Custom data →");
  console.log('Products to verify the definitions appear under "custom".');
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
