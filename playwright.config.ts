import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as os from 'node:os';
import * as path from 'node:path';
import { AUTH_FILE } from './support/auth.constants';

dotenv.config();

// On macOS, Cursor's sandbox can redirect PLAYWRIGHT_BROWSERS_PATH to an x64-only
// cache, which breaks arm64 hosts. Force the standard user cache in that case.
if (
  process.platform === 'darwin' &&
  (!process.env.PLAYWRIGHT_BROWSERS_PATH ||
    process.env.PLAYWRIGHT_BROWSERS_PATH.includes('cursor-sandbox-cache'))
) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
    os.homedir(),
    'Library/Caches/ms-playwright',
  );
}

export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio',
    trace: 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],
});
