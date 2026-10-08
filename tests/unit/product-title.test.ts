import { describe, expect, it } from "vitest";
import { productMetaTitle } from "@/lib/seo/product-title";

describe("productMetaTitle", () => {
  it("keeps short titles as-is", () => {
    expect(productMetaTitle("1999-2004 Jeep Grand Cherokee Class 3 Trailer Hitch - Black")).toBe(
      "1999-2004 Jeep Grand Cherokee Class 3 Trailer Hitch - Black",
    );
  });

  it("moves the product name in front of a long vehicle list", () => {
    expect(
      productMetaTitle("2011-2015 Chevrolet Cruze & 2012-2017 Buick Verano 1.25\" Trailer Hitch - Class 1"),
    ).toBe('1.25" Trailer Hitch for 2011-2015 Chevrolet Cruze');
  });

  it("keeps bed length and falls back to the first vehicle", () => {
    expect(
      productMetaTitle(
        "2009-2024 Dodge Ram 1500 & 2010-2018 Dodge Ram 2500/3500 6.4 ft Bed Hard Tri-Fold Tonneau Cover",
      ),
    ).toBe("6.4 ft Bed Hard Tri-Fold Tonneau Cover for 2009-2024 Dodge Ram 1500");
  });

  it("keeps variant detail when it fits", () => {
    expect(productMetaTitle("2006-2008 Dodge Ram 1500 Bull Guard w/ Chrome Skid Plate - Matte Black")).toBe(
      "2006-2008 Dodge Ram 1500 Bull Guard w/ Chrome Skid Plate - Matte Black",
    );
    expect(
      productMetaTitle("2010-2018 Dodge Ram 2500/3500 Bull Guard LED Light Bar - Matte Black and some more words"),
    ).toBe("Bull Guard LED Light Bar for 2010-2018 Dodge Ram 2500/3500");
  });

  it("treats numeric model ranges and parentheticals as vehicle text", () => {
    expect(
      productMetaTitle("2009-2024 Dodge Ram 1500 & 2010-2018 Dodge Ram 2500-5500 Crew Cab OE Running Boards - Matte Black"),
    ).toBe("Crew Cab OE Running Boards for 2009-2024 Dodge Ram 1500");
    expect(
      productMetaTitle(
        "2009-2018 Dodge Ram 1500/2500/3500 (+ 2019-2024 Ram 1500 Classic) Crystal Headlights Sequential LED - Chrome",
      ),
    ).toMatch(/^Crystal Headlights.* for 2009-2018 Dodge Ram 1500\/2500\/3500/);
  });

  it("strips a leading Stehlen and never ends on a bare 'for'", () => {
    const t = productMetaTitle(
      "Stehlen 2015-2026 Ford F-150 5.5 Ft Bed Hidden Snap Soft Roll-Up Tonneau Cover with extra words here",
    );
    expect(t.startsWith("Stehlen")).toBe(false);
    expect(t).toMatch(/Tonneau Cover for 2015-2026 Ford F-150$/);
  });
});
