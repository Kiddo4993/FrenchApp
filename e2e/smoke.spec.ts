import { expect, test } from "@playwright/test";

// Placeholder until the lesson runner exists (Phase 5); will be replaced with the real
// happy path: placement test -> first lesson -> complete a lesson -> see XP awarded.
test("home page loads and shows the app name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Maîtrise" })).toBeVisible();
});
