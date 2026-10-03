import { defineConfig, devices } from '@playwright/test';

const development = process.env.E2E_SERVER === 'dev';
const port = Number(process.env.E2E_PORT ?? (development ? 5173 : 4173));
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('E2E_PORT must be an integer from 1 to 65535.');
}
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 60000,
  expect: { timeout: 10000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright/report', open: 'never' }],
  ],
  outputDir: 'artifacts/playwright/results',
  snapshotPathTemplate:
    '{testDir}/visual/{projectName}/{testFilePath}/{arg}{ext}',
  use: {
    baseURL,
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow',
    launchOptions: { args: ['--mute-audio'] },
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: '**/focus.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      testIgnore: '**/focus.spec.ts',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' },
    },
    {
      name: 'chromium-focus',
      testMatch: '**/focus.spec.ts',
      fullyParallel: false,
      dependencies: ['chromium-desktop', 'chromium-mobile'],
      use: { ...devices['Desktop Chrome'], headless: false },
    },
  ],
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: `npm run ${development ? 'dev' : 'preview'} -- --port ${port}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 30_000,
        },
      }),
});
