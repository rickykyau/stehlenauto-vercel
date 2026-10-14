import { describe, expect, it } from "vitest";
import { normalizeSearchQuery } from "@/lib/search/normalize";

describe("normalizeSearchQuery", () => {
  it("converts roman hitch classes", () => {
    expect(normalizeSearchQuery("silverado class iii hitch")).toEqual({ query: "silverado class 3 hitch", year: null });
    expect(normalizeSearchQuery("Class IV receiver").query).toBe("class 4 receiver");
  });

  it("splits slash alternatives into OR", () => {
    expect(normalizeSearchQuery("chase rack/bull bar").query).toBe("(chase rack) OR bull");
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

describe("normalizeSearchQuery — shopper spellings", () => {
  it("maps bull bar spellings to the title word", () => {
    expect(normalizeSearchQuery("f150 bullbar").query).toBe("f-150 bull");
    expect(normalizeSearchQuery("silverado bull-bar").query).toBe("silverado bull");
    expect(normalizeSearchQuery("ram push bar").query).toBe("ram bull");
  });
  it("fixes grill and tonneau typos without touching real words", () => {
    expect(normalizeSearchQuery("tacoma grill").query).toBe("tacoma grille");
    expect(normalizeSearchQuery("f150 tonneu cover").query).toBe("f-150 tonneau cover");
    expect(normalizeSearchQuery("two tone grille").query).toBe("two tone grille");
  });
});

describe("normalizeSearchQuery — model numbers", () => {
  it("hyphenates Ford F-/E-series like the titles", () => {
    expect(normalizeSearchQuery("f150 bull bar").query).toBe("f-150 bull");
    expect(normalizeSearchQuery("F 150 grille guard").query).toBe("F-150 grille guard");
    expect(normalizeSearchQuery("2019 f250 tonneau")).toEqual({ query: "f-250 tonneau", year: 2019 });
    expect(normalizeSearchQuery("e350 hitch").query).toBe("e-350 hitch");
  });
  it("leaves already-hyphenated and unrelated numbers alone", () => {
    expect(normalizeSearchQuery("f-150 bull guard").query).toBe("f-150 bull guard");
    expect(normalizeSearchQuery("curt 13150").query).toBe("curt 13150");
    expect(normalizeSearchQuery("ram 1500 grille").query).toBe("ram 1500 grille");
  });
  it("splits ram1500", () => {
    expect(normalizeSearchQuery("ram1500 running boards").query).toBe("ram 1500 running boards");
  });
});
