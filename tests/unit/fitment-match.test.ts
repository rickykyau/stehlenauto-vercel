import { describe, expect, it } from "vitest";
import { checkFitment } from "@/lib/fitment/match";
import type { CatalogProduct, FitmentTable } from "@/lib/catalog/types";
import type { Vehicle, SubModelAnswer } from "@/lib/garage/types";

/**
 * Fitment match unit tests.
 *
 * These tests cover the verdict logic in lib/fitment/match.ts — the
 * single most trust-critical module in the storefront. Every fitment
 * ribbon, ATC gate, and recommendation rail depends on the boolean
 * (or undefined) this function returns.
 *
 * The 28-fix iteration we just completed surfaced multiple bugs in
 * this code path that a unit-test suite would have caught long
 * before customers saw them:
 *   - cycle 14AR-fix1 P0 BLOCKER: metafield should win over Shopify tags
 *   - cycle 14AR-fix13: needs_pick must be bed-length-only
 *   - cycle 14AS Step D: per-application triple match
 *   - cycle 14c (Mike-3 F-3): same-make wrong-model = confirmed misfit
 *   - cycle 14AE NF-2: hard mismatch beats needs_pick
 *
 * Each describe block below maps to one of those past bugs PLUS the
 * happy paths around it. Future regressions in any of these areas
 * fail in CI before reaching prod.
 */

// ── helpers ──────────────────────────────────────────────────────────

type TestProduct = Pick<CatalogProduct, "title" | "fitTitle" | "vehicleTags"> & {
  fitmentTable?: FitmentTable;
};

function makeProduct(overrides: Partial<TestProduct> = {}): TestProduct {
  return {
    title: overrides.title ?? "Generic Product",
    fitTitle: overrides.fitTitle ?? overrides.title ?? "Generic Product",
    vehicleTags: overrides.vehicleTags ?? [],
    fitmentTable: overrides.fitmentTable,
  };
}

function vehicle(year: string | number, make: string, model: string): Vehicle {
  return {
    id: `${year}-${make}-${model}`.toLowerCase().replace(/\s+/g, "-"),
    year: String(year),
    make,
    model,
  };
}

function emptyFitmentTable(
  overrides: Partial<FitmentTable> = {},
): FitmentTable {
  return {
    applications: overrides.applications ?? [],
    notesHtml: overrides.notesHtml ?? null,
    subattributes: overrides.subattributes ?? {},
  };
}

// ── 1. Null/undefined vehicle ────────────────────────────────────────

describe("checkFitment: no vehicle", () => {
  it("returns undefined when vehicle is null", () => {
    const product = makeProduct({ title: "Anything" });
    expect(checkFitment(product, null)).toBeUndefined();
  });

  it("returns undefined when vehicle is undefined", () => {
    const product = makeProduct({ title: "Anything" });
    expect(checkFitment(product, undefined)).toBeUndefined();
  });
});

// ── 2. Per-application metafield triple match (cycle 14AS Step D) ────

describe("checkFitment: metafield applications (authoritative)", () => {
  it("returns true on exact year/make/model triple match", () => {
    const product = makeProduct({
      title: "2018-2024 Ford F-150 Bull Guard",
      fitmentTable: emptyFitmentTable({
        applications: [
          { year: "2018", make: "Ford", model: "F-150" },
          { year: "2019", make: "Ford", model: "F-150" },
          { year: "2020", make: "Ford", model: "F-150" },
        ],
      }),
    });
    expect(checkFitment(product, vehicle("2019", "Ford", "F-150"))).toBe(true);
  });

  it("returns false when year is outside the applications list", () => {
    const product = makeProduct({
      title: "2018-2020 Ford F-150 Bull Guard",
      fitmentTable: emptyFitmentTable({
        applications: [
          { year: "2018", make: "Ford", model: "F-150" },
          { year: "2019", make: "Ford", model: "F-150" },
          { year: "2020", make: "Ford", model: "F-150" },
        ],
      }),
    });
    expect(checkFitment(product, vehicle("2017", "Ford", "F-150"))).toBe(false);
    expect(checkFitment(product, vehicle("2021", "Ford", "F-150"))).toBe(false);
  });

  it("returns false when make/model doesn't match any application", () => {
    const product = makeProduct({
      title: "2019 Ford F-150 Bull Guard",
      fitmentTable: emptyFitmentTable({
        applications: [{ year: "2019", make: "Ford", model: "F-150" }],
      }),
    });
    expect(checkFitment(product, vehicle("2019", "Toyota", "Tacoma"))).toBe(
      false,
    );
    expect(checkFitment(product, vehicle("2019", "Ford", "F-250"))).toBe(false);
  });

  it("metafield WINS over Shopify tags (cycle 14AR-fix1 P0 BLOCKER)", () => {
    // Tags say only 2018-2020 (slug-derived, narrow). Metafield extends
    // to 2026 (CA-data accurate, authoritative). Before fix1, narrow tags
    // would return false. After fix1, metafield wins → true.
    const product = makeProduct({
      title: "2018-2020 Ford F-150",
      vehicleTags: [
        "make:Ford",
        "model:F-150",
        "year:2018",
        "year:2019",
        "year:2020",
      ],
      fitmentTable: emptyFitmentTable({
        applications: Array.from({ length: 9 }, (_, i) => ({
          year: String(2018 + i),
          make: "Ford",
          model: "F-150",
        })),
      }),
    });
    expect(checkFitment(product, vehicle("2025", "Ford", "F-150"))).toBe(true);
  });

  it("model substring match works (F-150 ↔ F-150 SuperCrew)", () => {
    const product = makeProduct({
      fitmentTable: emptyFitmentTable({
        applications: [{ year: "2020", make: "Ford", model: "F-150" }],
      }),
    });
    // Customer's model contains application's model
    expect(
      checkFitment(product, vehicle("2020", "Ford", "F-150 SuperCrew")),
    ).toBe(true);
  });
});

// ── 3. Make aliases (Chevy ↔ Chevrolet) ──────────────────────────────

describe("checkFitment: make aliases", () => {
  it("Chevy in metafield matches Chevrolet in vehicle", () => {
    const product = makeProduct({
      fitmentTable: emptyFitmentTable({
        applications: [{ year: "2019", make: "Chevy", model: "Silverado" }],
      }),
    });
    expect(
      checkFitment(product, vehicle("2019", "Chevrolet", "Silverado")),
    ).toBe(true);
  });

  it("Chevrolet vehicle does NOT match GMC Sierra metafield (no cross-brand)", () => {
    const product = makeProduct({
      fitmentTable: emptyFitmentTable({
        applications: [{ year: "2019", make: "GMC", model: "Sierra 1500" }],
      }),
    });
    expect(
      checkFitment(product, vehicle("2019", "Chevrolet", "Silverado 1500")),
    ).toBe(false);
  });
});

// ── 4. Sub-model gate: bed_length (cycle 12 Mike F-5 BLOCKER) ────────

describe("checkFitment: sub-model bed_length gate", () => {
  it("returns false when product title has 5.5' bed and customer picked 6.5' bed", () => {
    const product = makeProduct({
      title: "2015-2024 Ford F-150 5.5 ft Bed Soft Roll-Up Tonneau Cover",
      fitmentTable: emptyFitmentTable({
        applications: Array.from({ length: 10 }, (_, i) => ({
          year: String(2015 + i),
          make: "Ford",
          model: "F-150",
        })),
      }),
    });
    const answers: SubModelAnswer[] = [
      { group: "bed_length", value: "6.5' BED" },
    ];
    expect(
      checkFitment(product, vehicle("2018", "Ford", "F-150"), answers),
    ).toBe(false);
  });

  it("returns true when product title bed matches customer's pick", () => {
    const product = makeProduct({
      title: "2015-2024 Ford F-150 5.5 ft Bed Soft Roll-Up Tonneau Cover",
      fitmentTable: emptyFitmentTable({
        applications: Array.from({ length: 10 }, (_, i) => ({
          year: String(2015 + i),
          make: "Ford",
          model: "F-150",
        })),
      }),
    });
    const answers: SubModelAnswer[] = [
      { group: "bed_length", value: "5.5' BED" },
    ];
    expect(
      checkFitment(product, vehicle("2018", "Ford", "F-150"), answers),
    ).toBe(true);
  });

  it("needs_pick: bed in title + no answer → undefined (cycle 14AR-fix13)", () => {
    const product = makeProduct({
      title: "2015-2024 Ford F-150 5.5 ft Bed Tonneau Cover",
      fitmentTable: emptyFitmentTable({
        applications: Array.from({ length: 10 }, (_, i) => ({
          year: String(2015 + i),
          make: "Ford",
          model: "F-150",
        })),
      }),
    });
    expect(checkFitment(product, vehicle("2018", "Ford", "F-150"))).toBe(
      undefined,
    );
  });

  it("no bed in title + no answer → true (don't ask for picks on products that don't gate on bed)", () => {
    // Bull guard: product fits all F-150 cab/bed variants, no bed-length
    // selectivity. Customer with no bed answer should still see green FITS.
    const product = makeProduct({
      title: "2015-2024 Ford F-150 Advance Series Bull Guard",
      fitmentTable: emptyFitmentTable({
        applications: Array.from({ length: 10 }, (_, i) => ({
          year: String(2015 + i),
          make: "Ford",
          model: "F-150",
        })),
      }),
    });
    expect(checkFitment(product, vehicle("2018", "Ford", "F-150"))).toBe(true);
  });

  it("Lincoln Mark LT trim-token false-positive does not fire (cycle 14AR-fix13)", () => {
    // Owner-caught regression: "Mark LT" in product title tripped the
    // trim regex (LT trim). fix13 tightened needs_pick to bed-length only.
    // A 2003-2014 Lincoln Navigator/Mark LT bull guard for a 2018 F-150
    // (with metafield applications covering F-150 2003-2026) should
    // return true, not undefined.
    const product = makeProduct({
      title: "2003-2014 Lincoln Navigator/Mark LT Bull Guard Matte Black",
      fitmentTable: emptyFitmentTable({
        applications: Array.from({ length: 24 }, (_, i) => ({
          year: String(2003 + i),
          make: "Ford",
          model: "F-150",
        })),
      }),
    });
    expect(checkFitment(product, vehicle("2018", "Ford", "F-150"))).toBe(true);
  });
});

// ── 5. Same-make wrong-model = false (cycle 14c Mike-3 F-3) ──────────

describe("checkFitment: same-make sibling model = confirmed misfit", () => {
  it("Toyota Tundra tonneau on Toyota Tacoma garage → false (NOT undefined)", () => {
    const product = makeProduct({
      title: "2014-2021 Toyota Tundra 5.5 ft Bed Roll-Up Tonneau Cover",
      vehicleTags: [],
      // No metafield — falls through to title-based check
    });
    expect(checkFitment(product, vehicle("2019", "Toyota", "Tacoma"))).toBe(
      false,
    );
  });

  it("Ford F-250 product on Ford F-150 garage → false", () => {
    const product = makeProduct({
      title: "2017-2022 Ford F-250 Super Duty Bull Guard",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2020", "Ford", "F-150"))).toBe(false);
  });

  it("Chevy Silverado on GMC Sierra → false (cross-brand sibling)", () => {
    const product = makeProduct({
      title: "2019-2024 Chevrolet Silverado 1500 5.8 ft Bed Mat",
      vehicleTags: [],
    });
    expect(
      checkFitment(product, vehicle("2021", "GMC", "Sierra 1500")),
    ).toBe(false);
  });
});

// ── 6. Universal-fit products (cycle 14c Mike-3 F-7) ─────────────────

describe("checkFitment: universal-fit listings", () => {
  it("'Universal fit' in title returns true regardless of model", () => {
    const product = makeProduct({
      title: "Razor 1000 Universal Fit Chase Rack",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2020", "Toyota", "Tacoma"))).toBe(
      true,
    );
    expect(checkFitment(product, vehicle("2020", "Ford", "F-150"))).toBe(true);
    expect(checkFitment(product, vehicle("2020", "Jeep", "Wrangler"))).toBe(
      true,
    );
  });

  it("'Fits all' in title returns true regardless of model", () => {
    const product = makeProduct({
      title: "Heavy-Duty Tie-Down Anchor — Fits All Trucks",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2018", "Ford", "F-150"))).toBe(true);
  });
});

// ── 7. Competing-make in title = false ───────────────────────────────

describe("checkFitment: competing-make detection", () => {
  it("Jeep product on Ford garage → false", () => {
    const product = makeProduct({
      title: "Jeep Grand Cherokee Trailer Hitch",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2019", "Ford", "F-150"))).toBe(false);
  });

  it("Tesla product on Ram garage → false", () => {
    const product = makeProduct({
      title: "Tesla Model Y All-Weather Floor Mats",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2020", "Ram", "1500"))).toBe(false);
  });
});

// ── 8. Structured Shopify tags (legacy fallback) ─────────────────────

describe("checkFitment: structured vehicleTags", () => {
  it("returns true when make+model+year tags all match", () => {
    const product = makeProduct({
      title: "Bull Guard",
      vehicleTags: ["make:Ford", "model:F-150", "year:2019", "year:2020"],
    });
    expect(checkFitment(product, vehicle("2019", "Ford", "F-150"))).toBe(true);
    expect(checkFitment(product, vehicle("2020", "Ford", "F-150"))).toBe(true);
  });

  it("returns false when structured tags exist but disagree", () => {
    const product = makeProduct({
      title: "Bull Guard",
      vehicleTags: ["make:Ford", "model:F-150", "year:2019"],
    });
    expect(checkFitment(product, vehicle("2021", "Ford", "F-150"))).toBe(false);
  });
});

// ── 9. Title-only fitment (when metafield + tags absent) ─────────────

describe("checkFitment: title-only fallback", () => {
  it("returns true when title contains year+make+model", () => {
    const product = makeProduct({
      title: "2019 Ford F-150 Bull Guard",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2019", "Ford", "F-150"))).toBe(true);
  });

  it("returns true when title has year range that includes vehicle year", () => {
    const product = makeProduct({
      title: "2015-2024 Ford F-150 Tonneau Cover",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2019", "Ford", "F-150"))).toBe(true);
  });

  it("returns undefined (CHECK FITMENT) when title year range excludes vehicle year and only title-string is available", () => {
    // Title-only path is intentionally conservative: same make+model but
    // out-of-range year is "we don't know," not "we know it doesn't fit."
    // The customer sees CHECK FITMENT (yellow) and the metafield/tag path
    // is where we earn the confidence to flip false. This guards against
    // a too-narrow title year range producing false-negative misfits on
    // older listings where CA data covers more years than the title.
    const product = makeProduct({
      title: "2003-2014 Ford F-150 Bull Guard",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2020", "Ford", "F-150"))).toBe(
      undefined,
    );
  });

  it("returns undefined for empty title (no signal)", () => {
    const product = makeProduct({
      title: "",
      fitTitle: "",
      vehicleTags: [],
    });
    expect(checkFitment(product, vehicle("2019", "Ford", "F-150"))).toBe(
      undefined,
    );
  });
});

// ── 10. Hard mismatch beats needs_pick (cycle 14AE NF-2) ─────────────

describe("checkFitment: hard mismatch overrides needs_pick", () => {
  it("Tundra tonneau on Silverado garage with no bed answer → false, not undefined", () => {
    // Pre-fix: needs_pick made this undefined (yellow CHECK FITMENT).
    // Post-fix: make/model mismatch is a hard NO regardless of bed state.
    const product = makeProduct({
      title: "2014-2021 Toyota Tundra 5.5 ft Bed Tonneau Cover",
      vehicleTags: [],
    });
    expect(
      checkFitment(product, vehicle("2018", "Chevrolet", "Silverado")),
    ).toBe(false);
  });
});
