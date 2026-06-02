import { expect, test as setup } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const authFile = path.join("playwright", ".auth", "user.json");

function requireEnv(name: "DIDAXIS_URL" | "DIDAXIS_EMAIL" | "DIDAXIS_PASSWORD"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

setup("authenticate and save storage state", async ({ page }) => {
  const baseUrl = requireEnv("DIDAXIS_URL");
  const email = requireEnv("DIDAXIS_EMAIL");
  const password = requireEnv("DIDAXIS_PASSWORD");

  await page.goto(`${baseUrl}/login`);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await page.waitForURL(`${baseUrl}/`);
  await expect(page).toHaveURL(`${baseUrl}/`);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
