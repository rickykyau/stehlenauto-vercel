import { describe, expect, it } from "vitest";
import { checkFitment, fitCaveat, fitsOnceBedPicked } from "@/lib/fitment/match";
import { stripSystemNotes } from "@/lib/fitment/note-cleanup";
import type { FitmentTable } from "@/lib/catalog/types";

const table = (notesHtml: string | null, engineExclusions?: string[]): FitmentTable => ({
  applications: [],
  notesHtml,
  subattributes: engineExclusions ? { engineExclusions } : {},
});

describe("fitCaveat — sub-variant exceptions on a YMM fit", () => {
  it("names EcoBoost / Lightning / Heritage from a will-not-fit note", () => {
    const t = table(
      "<p>Will not fit: 2004 F-150 Heritage models, 2011-2023 F-150s with the EcoBoost engine, and the 2022-2023 F-150 Lightning electric model.</p>",
    );
    expect(fitCaveat(t)).toBe("EcoBoost / Lightning / Heritage");
  });

  it("uses structured engineExclusions first", () => {
    expect(fitCaveat(table(null, ["EcoBoost"]))).toBe("EcoBoost");
  });

  it("returns null for year/bed-only exclusions and positive notes", () => {
    expect(fitCaveat(table("Will not fit beds other than 6.5 ft."))).toBeNull();
    expect(fitCaveat(table("Fits models without a factory-installed receiver"))).toBeNull();
    expect(fitCaveat(null)).toBeNull();
  });
});

describe("stripSystemNotes — ops text never reaches shoppers", () => {
  it("removes the CB/CA pipeline note and keeps real copy", () => {
    expect(
      stripSystemNotes(
        "Will Not Fit Carbon Bed [Fitment derived from CB item data 2026-08-25; CA Fitment attribute not yet populated — re-run CA sync when available.]",
      ),
    ).toBe("Will Not Fit Carbon Bed");
  });

  it("returns null when only the system note was present", () => {
    expect(
      stripSystemNotes("[Fitment derived from CB item data 2026-08-25; CA Fitment attribute not yet populated — re-run CA sync when available.]"),
    ).toBeNull();
  });

  it("keeps brackets that are not ops text", () => {
    expect(stripSystemNotes("Fits 6.5 ft bed [78 in]")).toBe("Fits 6.5 ft bed [78 in]");
  });
});

describe("fitsOnceBedPicked — vehicle matches, only bed length outstanding", () => {
  const title = "2016-2023 Toyota Tacoma 5 Ft Bed Hidden Snap Soft Roll-Up Tonneau Cover";
  const product = {
    title,
    fitTitle: title,
    vehicleTags: [],
    fitmentTable: {
      applications: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"].map((year) => ({
        year,
        make: "Toyota",
        model: "Tacoma",
      })),
      notesHtml: "2016-2023 Toyota Tacoma — Fits 5 Ft short bed models",
      subattributes: {},
    } as FitmentTable,
  };
  const tacoma = { id: "2021-toyota-tacoma", year: "2021", make: "Toyota", model: "Tacoma" };

  it("is true for a listed vehicle with no bed answer", () => {
    expect(checkFitment(product, tacoma)).toBeUndefined();
    expect(fitsOnceBedPicked(product, tacoma)).toBe(true);
  });

  it("is false for a year outside the listing", () => {
    expect(fitsOnceBedPicked(product, { ...tacoma, year: "2010" })).toBe(false);
  });

  it("is false once a bed length is answered", () => {
    expect(fitsOnceBedPicked(product, tacoma, [{ group: "bed_length", value: "6 ft" }])).toBe(false);
  });
});
