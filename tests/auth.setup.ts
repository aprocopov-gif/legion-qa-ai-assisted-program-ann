import { expect, test as setup } from '@playwright/test';
import * as fs from 'node:fs';
import { LoginPage } from '../pages/login.page';

const authFile = 'playwright/.auth/user.json';

function requireEnv(
  name: 'DIDAXIS_URL' | 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD',
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

setup('authenticate and save storage state', async ({ page }) => {
  const baseUrl = requireEnv('DIDAXIS_URL');
  const email = requireEnv('DIDAXIS_EMAIL');
  const password = requireEnv('DIDAXIS_PASSWORD');
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);

  await page.waitForURL(`${baseUrl}/`);
  await expect(page).toHaveURL(`${baseUrl}/`);

  fs.mkdirSync('playwright/.auth', { recursive: true });
  await page.context().storageState({ path: authFile });
});
