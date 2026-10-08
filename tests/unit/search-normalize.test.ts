import { describe, expect, it } from "vitest";
import { normalizeSearchQuery } from "@/lib/search/normalize";

describe("normalizeSearchQuery", () => {
  it("converts roman hitch classes", () => {
    expect(normalizeSearchQuery("silverado class iii hitch")).toEqual({ query: "silverado class 3 hitch", year: null });
    expect(normalizeSearchQuery("Class IV receiver").query).toBe("class 4 receiver");
  });

  it("splits slash alternatives into OR", () => {
    expect(normalizeSearchQuery("chase rack/bull bar").query).toBe("(chase rack) OR (bull bar)");
  });

  it("leaves model and number slashes alone", () => {
    expect(normalizeSearchQuery("ram 2500/3500 bull guard").query).toBe("ram 2500/3500 bull guard");
    expect(normalizeSearchQuery("F-150/F-250 hitch").query).toBe("F-150/F-250 hitch");
  });

  it("pulls out a model year", () => {
    expect(normalizeSearchQuery("2020 silverado hitch")).toEqual({ query: "silverado hitch", year: 2020 });
    expect(normalizeSearchQuery("hitch silverado 2020")).toEqual({ query: "hitch silverado", year: 2020 });
  });

  it("keeps a bare year as the query", () => {
    expect(normalizeSearchQuery("2020")).toEqual({ query: "2020", year: null });
  });

  it("does not treat part numbers as years", () => {
    expect(normalizeSearchQuery("curt 13364").year).toBeNull();
  });
});
