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
  it("returns null when the listing doesn't say", () => {
    expect(drillingFromDescription("<p>Rocker panel mount installation.</p>")).toBeNull();
  });
});
