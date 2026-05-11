import { expect, test } from "@playwright/test";

test.describe("Playwright smoke", () => {
  test("loads Playwright homepage and title contains Playwright", async ({
    page,
  }) => {
    await page.goto("https://playwright.dev/");
    await expect(page).toHaveTitle(/Playwright/);
  });
});
