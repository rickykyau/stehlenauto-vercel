import { describe, expect, it } from "vitest";
import { metaDescriptionFromHtml } from "@/lib/catalog/meta-description";

const FB = "fallback";

describe("metaDescriptionFromHtml", () => {
  it("skips a leading heading and uses the first paragraph", () => {
    const html =
      "<h2>Product Overview</h2><p>Upgrade your 2007-2021 Toyota Tundra CrewMax with modular side step bars in matte black.</p><h2>Features</h2>";
    expect(metaDescriptionFromHtml(html, FB)).toBe(
      "Upgrade your 2007-2021 Toyota Tundra CrewMax with modular side step bars in matte black.",
    );
  });

  it("ends on the last sentence boundary that fits", () => {
    const s1 =
      "Hard tri-fold tonneau cover for the 2007-2016 Toyota Tundra with a 6.5 ft bed, factory rail system, and a matte black finish.";
    const html = `<p>${s1} It installs in about 30 minutes with no drilling and folds forward for full bed access.</p>`;
    const out = metaDescriptionFromHtml(html, FB);
    expect(out).toBe(s1);
    expect(out.length).toBeLessThanOrEqual(158);
  });

  it("word-truncates instead of stopping at a short first sentence", () => {
    const s1 = "This Advanced Series bull guard is built for the 2010-2018 Jeep Wrangler JK.";
    const s2 = "It pairs a heavy-duty steel frame with a built-in LED light bar in a matte black finish.";
    const out = metaDescriptionFromHtml(`<p>${s1} ${s2}</p>`, FB);
    expect(out.startsWith(`${s1} It pairs`)).toBe(true);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(120);
    expect(out.length).toBeLessThanOrEqual(158);
  });

  it("falls back to word truncation when no sentence end fits", () => {
    const long = "word ".repeat(60).trim();
    const out = metaDescriptionFromHtml(`<p>${long}</p>`, FB);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(158);
  });

  it("decodes common entities", () => {
    const html = "<p>Bull guard &amp; skid plate for the 2008-2012 Ford Escape &mdash; bolt-on, no drilling needed at all.</p>";
    expect(metaDescriptionFromHtml(html, FB)).toContain("Bull guard & skid plate");
  });

  it("uses the fallback when there is too little text", () => {
    expect(metaDescriptionFromHtml("<p>Short.</p>", FB)).toBe(FB);
  });
});
