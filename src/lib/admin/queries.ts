import "server-only";
import { sql } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db/client";
import { searchMisses } from "@/lib/db/schema";
import {
  shopifyAdminConfigured,
  shopifyAdminFetch,
} from "@/lib/shopify/admin";

// ---------------------------------------------------------------------------
// Section 1 — search-miss aggregator
// ---------------------------------------------------------------------------

export type SearchMissRow = {
  query: string;
  count: number;
  vehicleHint: string | null;
  lastSeen: Date;
};

export async function getTopSearchMisses(
  days = 30,
  limit = 50,
): Promise<SearchMissRow[]> {
  if (!dbConfigured) return [];
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await db()
      .select({
        query: searchMisses.query,
        count: sql<number>`count(*)::int`.as("count"),
        vehicleHint: sql<
          string | null
        >`max(coalesce(${searchMisses.vehicleYear} || ' ' || ${searchMisses.vehicleMake} || ' ' || ${searchMisses.vehicleModel}, null))`.as(
          "vehicleHint",
        ),
        lastSeen: sql<Date>`max(${searchMisses.occurredAt})`.as("lastSeen"),
      })
      .from(searchMisses)
      .where(sql`${searchMisses.occurredAt} >= ${since}`)
      .groupBy(searchMisses.query)
      .orderBy(sql`count(*) desc`)
      .limit(limit);
    return rows;
  } catch (err) {
    console.error("[admin/queries] getTopSearchMisses failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Section 2 — vehicle × category heatmap
// ---------------------------------------------------------------------------

export type HeatmapCell = {
  make: string;
  model: string;
  category: string;
  count: number;
};

export type HeatmapData = {
  rows: { make: string; model: string }[];
  categories: string[];
  cells: Record<string, Record<string, number>>; // cells[make-model][category] = count
  generatedAt: Date;
};

const HEATMAP_QUERY = /* GraphQL */ `
  query SourcingHeatmap($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        productType
        tags
      }
    }
  }
`;

type HeatmapProduct = { productType: string; tags: string[] };
type HeatmapResponse = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: HeatmapProduct[];
  };
};

const TARGET_MAKE_MODELS: { make: string; model: string }[] = [
  { make: "Ford", model: "F-150" },
  { make: "Ford", model: "F-250" },
  { make: "Ford", model: "Ranger" },
  { make: "Chevrolet", model: "Silverado" },
  { make: "Chevrolet", model: "Colorado" },
  { make: "GMC", model: "Sierra" },
  { make: "GMC", model: "Canyon" },
  { make: "Ram", model: "1500" },
  { make: "Ram", model: "2500" },
  { make: "Toyota", model: "Tacoma" },
  { make: "Toyota", model: "Tundra" },
  { make: "Toyota", model: "4Runner" },
  { make: "Jeep", model: "Wrangler" },
  { make: "Jeep", model: "Gladiator" },
  { make: "Nissan", model: "Frontier" },
  { make: "Nissan", model: "Titan" },
];

function categoryFromProductType(pt: string): string | null {
  const p = (pt || "").toLowerCase();
  if (!p) return null;
  if (p.includes("tonneau")) return "Tonneau Covers";
  if (p.includes("trailer hitch")) return "Trailer Hitches";
  if (p.includes("bull") || p.includes("grille guard")) return "Bull Guards";
  if (p.includes("grille")) return "Front Grilles";
  if (p.includes("headlight")) return "Headlights";
  if (p.includes("running board") || p.includes("side step") || p.includes("nerf")) return "Running Boards";
  if (p.includes("bed mat")) return "Bed Mats";
  if (p.includes("floor mat")) return "Floor Mats";
  if (p.includes("roof")) return "Roof Racks";
  if (p.includes("chase rack") || p.includes("sport bar")) return "Chase Racks";
  if (p.includes("molle")) return "MOLLE";
  if (p.includes("under seat")) return "Under-Seat Storage";
  return null;
}

const HEATMAP_CATEGORIES = [
  "Headlights",
  "Bull Guards",
  "Front Grilles",
  "Running Boards",
  "Tonneau Covers",
  "Trailer Hitches",
  "Bed Mats",
  "Floor Mats",
  "Roof Racks",
  "Chase Racks",
  "MOLLE",
  "Under-Seat Storage",
];

function tagSet(tags: string[]): Set<string> {
  return new Set(tags.map((t) => t.toLowerCase().trim()));
}

export async function getVehicleCategoryHeatmap(): Promise<HeatmapData | null> {
  if (!shopifyAdminConfigured) return null;
  try {
    const products: HeatmapProduct[] = [];
    let cursor: string | undefined | null = null;
    let pages = 0;
    while (pages < 12) {
      const data: HeatmapResponse = await shopifyAdminFetch<HeatmapResponse>(
        HEATMAP_QUERY,
        { cursor },
      );
      products.push(...data.products.nodes);
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
      pages++;
    }

    const cells: Record<string, Record<string, number>> = {};
    for (const target of TARGET_MAKE_MODELS) {
      const key = `${target.make}-${target.model}`;
      cells[key] = Object.fromEntries(HEATMAP_CATEGORIES.map((c) => [c, 0]));
    }

    for (const p of products) {
      const cat = categoryFromProductType(p.productType);
      if (!cat) continue;
      const tags = tagSet(p.tags);
      for (const target of TARGET_MAKE_MODELS) {
        const wantMake = `make:${target.make}`.toLowerCase();
        const wantModel = `model:${target.model}`.toLowerCase();
        if (tags.has(wantMake) && tags.has(wantModel)) {
          cells[`${target.make}-${target.model}`][cat] += 1;
        }
      }
    }

    return {
      rows: TARGET_MAKE_MODELS,
      categories: HEATMAP_CATEGORIES,
      cells,
      generatedAt: new Date(),
    };
  } catch (err) {
    console.error("[admin/queries] heatmap failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Section 3 — supplier (vendor) coverage matrix
// ---------------------------------------------------------------------------

export type VendorCoverageRow = {
  vendor: string;
  totalSkus: number;
  topMakes: { make: string; count: number }[];
  isStehlenBranded: boolean;
};

const VENDOR_QUERY = /* GraphQL */ `
  query VendorCoverage($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        vendor
        tags
      }
    }
  }
`;

type VendorProduct = { vendor: string; tags: string[] };
type VendorResponse = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: VendorProduct[];
  };
};

export async function getVendorCoverage(): Promise<VendorCoverageRow[]> {
  if (!shopifyAdminConfigured) return [];
  try {
    const products: VendorProduct[] = [];
    let cursor: string | undefined | null = null;
    let pages = 0;
    while (pages < 12) {
      const data: VendorResponse = await shopifyAdminFetch<VendorResponse>(
        VENDOR_QUERY,
        { cursor },
      );
      products.push(...data.products.nodes);
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
      pages++;
    }

    const byVendor = new Map<
      string,
      { totalSkus: number; makeCounts: Map<string, number> }
    >();
    for (const p of products) {
      const v = (p.vendor || "Unknown").trim();
      let bucket = byVendor.get(v);
      if (!bucket) {
        bucket = { totalSkus: 0, makeCounts: new Map() };
        byVendor.set(v, bucket);
      }
      bucket.totalSkus += 1;
      for (const t of p.tags) {
        if (t.toLowerCase().startsWith("make:")) {
          const make = t.slice(5).trim();
          if (!make) continue;
          bucket.makeCounts.set(make, (bucket.makeCounts.get(make) ?? 0) + 1);
        }
      }
    }

    const rows: VendorCoverageRow[] = Array.from(byVendor.entries()).map(
      ([vendor, b]) => ({
        vendor,
        totalSkus: b.totalSkus,
        topMakes: Array.from(b.makeCounts.entries())
          .sort((a, c) => c[1] - a[1])
          .slice(0, 5)
          .map(([make, count]) => ({ make, count })),
        isStehlenBranded: vendor.toLowerCase().includes("stehlen"),
      }),
    );
    rows.sort((a, b) => b.totalSkus - a.totalSkus);
    return rows;
  } catch (err) {
    console.error("[admin/queries] vendor coverage failed:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Section 4 — catalog lifecycle counters
// ---------------------------------------------------------------------------

export type LifecycleCounters = {
  totalProducts: number;
  addedLast30Days: number;
  addedLast90Days: number;
  outOfStock: number;
  taggedHold: number;
  generatedAt: Date;
};

const LIFECYCLE_QUERY = /* GraphQL */ `
  query Lifecycle($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        createdAt
        totalInventory
        tags
      }
    }
  }
`;

type LifecycleProduct = {
  createdAt: string;
  totalInventory: number | null;
  tags: string[];
};
type LifecycleResponse = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: LifecycleProduct[];
  };
};

export async function getLifecycleCounters(): Promise<LifecycleCounters | null> {
  if (!shopifyAdminConfigured) return null;
  try {
    const all: LifecycleProduct[] = [];
    let cursor: string | undefined | null = null;
    let pages = 0;
    while (pages < 12) {
      const data: LifecycleResponse = await shopifyAdminFetch<LifecycleResponse>(
        LIFECYCLE_QUERY,
        { cursor },
      );
      all.push(...data.products.nodes);
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
      pages++;
    }
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const counts = {
      totalProducts: all.length,
      addedLast30Days: 0,
      addedLast90Days: 0,
      outOfStock: 0,
      taggedHold: 0,
    };
    for (const p of all) {
      const created = new Date(p.createdAt).getTime();
      if (now - created <= 30 * day) counts.addedLast30Days += 1;
      if (now - created <= 90 * day) counts.addedLast90Days += 1;
      if ((p.totalInventory ?? 0) <= 0) counts.outOfStock += 1;
      if (p.tags.some((t) => t.toLowerCase() === "_fitment-hold"))
        counts.taggedHold += 1;
    }
    return { ...counts, generatedAt: new Date() };
  } catch (err) {
    console.error("[admin/queries] lifecycle failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Section 5 — top vehicle gen gaps (synthesizes heatmap into ranked list)
// ---------------------------------------------------------------------------

export type VehicleGenGap = {
  make: string;
  model: string;
  totalSkus: number;
  emptyCategories: string[];
  thinCategories: { category: string; count: number }[];
  estAnnualUnits: number;
  priorityRank: number;
};

const ANNUAL_UNITS_K: Record<string, number> = {
  "Ford-F-150": 750,
  "Chevrolet-Silverado": 530,
  "Ram-1500": 460,
  "GMC-Sierra": 290,
  "Toyota-Tacoma": 240,
  "Ford-Ranger": 80,
  "Toyota-Tundra": 120,
  "Jeep-Wrangler": 175,
  "Jeep-Gladiator": 50,
  "Chevrolet-Colorado": 100,
  "GMC-Canyon": 30,
  "Nissan-Frontier": 75,
  "Nissan-Titan": 22,
  "Ford-F-250": 290,
  "Ram-2500": 130,
  "Toyota-4Runner": 100,
};

export function rankVehicleGapsFromHeatmap(
  heatmap: HeatmapData,
): VehicleGenGap[] {
  const out: VehicleGenGap[] = [];
  for (const row of heatmap.rows) {
    const key = `${row.make}-${row.model}`;
    const cells = heatmap.cells[key] ?? {};
    const total = Object.values(cells).reduce((a, b) => a + b, 0);
    const empty = heatmap.categories.filter((c) => (cells[c] ?? 0) === 0);
    const thin = heatmap.categories
      .filter((c) => (cells[c] ?? 0) > 0 && (cells[c] ?? 0) <= 5)
      .map((c) => ({ category: c, count: cells[c] ?? 0 }));
    const units = ANNUAL_UNITS_K[key] ?? 20;
    // Priority = (units in 1000s) * (empty cats + thin cats * 0.5)
    const priorityRank = Math.round(units * (empty.length + thin.length * 0.5));
    out.push({
      make: row.make,
      model: row.model,
      totalSkus: total,
      emptyCategories: empty,
      thinCategories: thin,
      estAnnualUnits: units * 1000,
      priorityRank,
    });
  }
  out.sort((a, b) => b.priorityRank - a.priorityRank);
  return out;
}

// ---------------------------------------------------------------------------
// Section 6 — Stehlen-branded share by category
// ---------------------------------------------------------------------------

export type StehlenShareRow = {
  category: string;
  totalSkus: number;
  stehlenSkus: number;
  sharePct: number;
};

export async function getStehlenShareByCategory(): Promise<StehlenShareRow[]> {
  if (!shopifyAdminConfigured) return [];
  try {
    const all: VendorProduct[] = [];
    let cursor: string | undefined | null = null;
    let pages = 0;
    while (pages < 12) {
      type StehlenResp = {
        products: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          nodes: (VendorProduct & { productType: string })[];
        };
      };
      const data: StehlenResp = await shopifyAdminFetch<StehlenResp>(
        /* GraphQL */ `
          query StehlenShare($cursor: String) {
            products(first: 250, after: $cursor) {
              pageInfo { hasNextPage endCursor }
              nodes { vendor productType tags }
            }
          }
        `,
        { cursor },
      );
      all.push(...data.products.nodes);
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
      pages++;
    }

    const byCat = new Map<string, { total: number; stehlen: number }>();
    for (const p of all) {
      const cat = categoryFromProductType((p as VendorProduct & { productType: string }).productType);
      if (!cat) continue;
      const bucket = byCat.get(cat) ?? { total: 0, stehlen: 0 };
      bucket.total += 1;
      if ((p.vendor || "").toLowerCase().includes("stehlen")) bucket.stehlen += 1;
      byCat.set(cat, bucket);
    }

    return Array.from(byCat.entries())
      .map(([category, b]) => ({
        category,
        totalSkus: b.total,
        stehlenSkus: b.stehlen,
        sharePct: b.total > 0 ? Math.round((b.stehlen / b.total) * 100) : 0,
      }))
      .sort((a, b) => a.sharePct - b.sharePct);
  } catch (err) {
    console.error("[admin/queries] stehlen share failed:", err);
    return [];
  }
}
