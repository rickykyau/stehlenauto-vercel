import { describe, expect, it } from "vitest";
import { extractSpecRowsFromHtml, specValue } from "@/lib/catalog/spec-rows";

const kit = `<p>Kit.</p><h2>Specifications</h2><ul>
<li>
<strong>Part Number:</strong> TH-C1088-D081+TH-BMOUNT-L2</li>
<li>
<strong>Ball Mount Part Number:</strong> CURT 45034</li>
<li>
<strong>Brand:</strong> CURT</li>
</ul>`;

describe("spec rows", () => {
  it("reads brand and part number from the Specifications list", () => {
    const rows = extractSpecRowsFromHtml(kit);
    expect(specValue(rows, "Brand")).toBe("CURT");
    expect(specValue(rows, "Part Number", "MPN")).toBe("TH-C1088-D081+TH-BMOUNT-L2");
  });

  it("falls back to MPN label and is case-insensitive", () => {
    const rows = extractSpecRowsFromHtml("<h2>Specifications</h2><ul><li><strong>MPN:</strong> 55314</li></ul>");
    expect(specValue(rows, "part number", "mpn")).toBe("55314");
    expect(specValue(rows, "Brand")).toBeUndefined();
  });
});
