import { defineConfig, devices } from '@playwright/test';

const development = process.env.E2E_SERVER === 'dev';
const port = Number(process.env.E2E_PORT ?? (development ? 5173 : 4173));
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('E2E_PORT must be an integer from 1 to 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  ...(process.env.CI ? { workers: 2 } : {}),
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
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command: `npm run ${development ? 'dev' : 'preview'} -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
