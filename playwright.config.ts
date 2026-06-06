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
  testMatch: '**/*.spec.ts',
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['./support/program-cleanup-reporter.ts'],
    ['html', { open: 'never' }],
  ],
  use: {
    headless: true,
    baseURL: process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio',
    screenshot: 'only-on-failure',
    trace: 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'didaxis',
      testMatch: '**/ds*.spec.ts',
      use: {
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'todomvc',
      testMatch: '**/*.spec.ts',
      testIgnore: [/auth\.setup\.ts/, '**/ds*.spec.ts'],
    }
  ],
});
