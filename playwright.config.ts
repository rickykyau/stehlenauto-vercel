import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e smoke tests for Stehlen Auto storefront.
 *
 * These tests run against the live Vercel deployment (default
 * https://stehlenauto-vercel.vercel.app). Override via PLAYWRIGHT_BASE_URL
 * to point at a preview deploy, localhost, or production after cutover.
 *
 * Scope: smoke-level only. Five critical paths, each must load and
 * render the right primitives. Deep regression coverage lives in the
 * manual/agent-executed test plan at docs/qa/comprehensive-test-plan.md.
 *
 * Run:
 *   pnpm test:e2e
 *   pnpm test:e2e -- --ui  (interactive mode)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      "https://stehlenauto-vercel.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Use Pixel 7 (Chromium engine) rather than iPhone 15 (WebKit)
      // so a single browser install covers both projects. Sufficient
      // for smoke-level mobile viewport coverage; deep iOS Safari
      // testing remains in the manual/agent test plan.
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
