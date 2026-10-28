import { describe, expect, it } from "vitest";
import { drillingFromDescription } from "@/lib/install";

describe("drillingFromDescription", () => {
  it("detects drilling required", () => {
    expect(drillingFromDescription("<li><strong>Drilling required:</strong> Plan on 1-2 hours with a drill</li>")).toBe(true);
  });
  it("detects no drilling", () => {
    expect(drillingFromDescription("<p>Bolt-on installation, no drilling required, typically 1-2 hours.</p>")).toBe(false);
    expect(drillingFromDescription("<p>Drill-free install.</p>")).toBe(false);
  });
  it("reads a negation a few words before drilling", () => {
    expect(drillingFromDescription("<p>Drop-in fit — no tools or drilling required.</p>")).toBe(false);
    expect(drillingFromDescription("<p>Bolt-on installation: no cutting or drilling required.</p>")).toBe(false);
    expect(drillingFromDescription("<li><strong>Drilling Required:</strong> No</li>")).toBe(false);
  });
  it("keeps a real drilling requirement even if other lines say no welding", () => {
    expect(
      drillingFromDescription(
        "<p>It adds a receiver at the factory mounting points, though installation requires drilling.</p><li>No welding.</li>",
      ),
    ).toBe(true);
  });
  it("returns null when the listing doesn't say", () => {
    expect(drillingFromDescription("<p>Rocker panel mount installation.</p>")).toBeNull();
  });
});
