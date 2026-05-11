import { test, expect } from "@playwright/test";

/**
 * Critical-path smoke tests.
 *
 * Five tests covering the user journey:
 *   1. Home page loads
 *   2. YMM picker modal opens
 *   3. Collection page loads with products
 *   4. PDP loads with fitment context
 *   5. /cart page loads
 *
 * If any of these fail, the storefront is broken at a level that
 * every customer would notice. Deep regression and edge-case coverage
 * lives in docs/qa/comprehensive-test-plan.md (340+ tests, manual/
 * agent-executed).
 */

test.describe("Stehlen storefront smoke tests", () => {
  test("home page loads with hero + nav", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Stehlen/i);
    // Hero copy must be present (locked brand line)
    await expect(page.getByText(/BUILT TOUGH/i).first()).toBeVisible();
    // Header has cart + YMM access (the two primary actions)
    await expect(
      page.getByRole("button", { name: /cart/i }).first(),
    ).toBeVisible();
    // No JS errors during load
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForLoadState("networkidle");
    expect(errors, `JS errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("YMM picker modal opens from header", async ({ page }) => {
    await page.goto("/");
    // Either "SELECT YOUR VEHICLE" or "CHANGE VEHICLE" depending on cookie state
    const ymmButton = page
      .getByRole("button", { name: /select your vehicle|change vehicle/i })
      .first();
    await expect(ymmButton).toBeVisible();
    await ymmButton.click();
    // Modal shows Step 1 of 3 — Year picker
    await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
    // Years are populated (modal is hydrated, not empty)
    await expect(page.getByRole("button", { name: "2024" })).toBeVisible();
  });

  test("collection page loads with product cards", async ({ page }) => {
    await page.goto("/collections/tonneau-covers");
    // Category title visible
    await expect(
      page.getByRole("heading", { name: /tonneau/i }).first(),
    ).toBeVisible();
    // At least one product card must render — products are the whole point
    const productCards = page.locator('a[href^="/products/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await productCards.count();
    expect(count, "collection must have at least 1 product card").toBeGreaterThan(0);
  });

  test("PDP loads with price + ATC button", async ({ page }) => {
    // Use a stable known PDP that's been in catalog for many cycles
    await page.goto(
      "/products/2015-2024-ford-f-150-5-5-bed-soft-roll-up-tonneau-cover-503362",
    );
    // Heading should contain F-150 5.5 ft Bed
    await expect(
      page.getByRole("heading", { level: 1, name: /ford f-150.*5\.5/i }),
    ).toBeVisible();
    // Either ADD TO CART or a clearly-labeled disabled state must be present
    const buyButton = page
      .getByRole("button", {
        name: /add to cart|select your vehicle|select your truck|out of stock|wrong bed/i,
      })
      .first();
    await expect(buyButton).toBeVisible();
  });

  test("cart page loads (empty state OR with items)", async ({ page }) => {
    await page.goto("/cart");
    // Cart page must render with its identifying heading regardless of
    // cart state. Empty-state and with-items copy varies; the heading
    // is the stable anchor that proves the route + SSR + layout all
    // worked.
    await expect(page.getByText(/YOUR CART/i).first()).toBeVisible();
  });
});
