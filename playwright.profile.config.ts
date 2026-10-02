import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.E2E_PORT ?? 4175);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/profiling',
  workers: 1,
  timeout: 300000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/profiling/report', open: 'never' }],
  ],
  outputDir: 'artifacts/profiling/results',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    headless: false,
    baseURL,
    trace: 'off',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  webServer: {
    command: `npm run preview -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
