import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.E2E_PORT ?? 4175);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/profiling',
  testMatch:
    process.env.PROFILE_AUDIO_LEVELS === '1'
      ? '**/audio-levels.spec.ts'
      : process.env.PROFILE_RENDER_COST === '1'
        ? '**/render-cost.spec.ts'
        : '**/performance.spec.ts',
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
    headless: process.env.PROFILE_SOFTWARE === '1',
    launchOptions: {
      // Silence only this test browser; Web Audio still exercises its real nodes.
      args: [
        '--mute-audio',
        ...(process.env.PROFILE_VULKAN === '1'
          ? [
              '--use-angle=vulkan',
              '--enable-features=Vulkan',
              '--disable-vulkan-surface',
            ]
          : []),
      ],
    },
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
