/**
 * Cycle 14BE-fix9 (Mike Mission 1 + Marcus #2/#3): per-category install
 * guides. AI-authored v1, owner-overridable per-product via Shopify
 * metafield `custom.install_guide_url` later. The data shape supports a
 * `videoUrl` slot when the warehouse delivers real install footage.
 *
 * etrailer-style "talk to a tech" install confidence is the #1 missing
 * trust signal at this price point (Marcus 2024 benchmark) and removes
 * the most common pre-purchase hesitation Mike flagged on cold buys.
 */

import guides from "@/../data/install-guides.json";

export type InstallGuide = {
  title: string;
  difficulty: "Very Easy" | "Easy" | "Moderate" | "Advanced";
  timeMinutes: number;
  peopleNeeded: number;
  drillRequired: boolean;
  tools: string[];
  steps: string[];
  warnings: string[];
  videoUrl: string | null;
};

type Manifest = {
  by_category: Record<string, InstallGuide>;
};

const manifest = guides as Manifest;

export function getInstallGuide(
  categoryHandle: string | null | undefined,
): InstallGuide | null {
  if (!categoryHandle) return null;
  return manifest.by_category[categoryHandle] ?? null;
}

export function difficultyColor(
  difficulty: InstallGuide["difficulty"],
): string {
  switch (difficulty) {
    case "Very Easy":
    case "Easy":
      return "var(--color-success)";
    case "Moderate":
      // Cycle 14BE-fix1 (Jordan N-1 HIGH): was var(--color-primary)
      // which is the brand yellow. Two yellow elements in viewport
      // (chip + sticky ATC) violates the one-yellow-per-viewport rule
      // and dilutes the ATC affordance. Amber is the semantic
      // "proceed with awareness" color in traffic-light vocabulary
      // without competing with the CTA.
      return "#d97706";
    case "Advanced":
      return "var(--color-destructive)";
  }
}
