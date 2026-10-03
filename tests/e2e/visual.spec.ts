import { test, expect } from '@playwright/test';
import { readyArtwork } from '../support/artwork';
for (const [name, width, height] of [
  ['desktop', 1280, 720],
  ['portrait', 390, 844],
  ['landscape', 844, 390],
] as const) {
  test(
    'reviewed menu, arena and real result baseline: ' + name,
    async ({ page }, info) => {
      test.skip(
        info.project.name === 'chromium-mobile' && name === 'desktop',
        'Desktop fidelity uses native DPR 1; the mobile project covers phone portrait and landscape.',
      );
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.setViewportSize({ width, height });
      await page.clock.setFixedTime(new Date('2026-10-02T12:00:00Z'));
      await page.goto('/?seed=42&clock=manual');
      await page.getByLabel('Display name').fill('Captain Jack');
      await readyArtwork(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
      await expect(page).toHaveScreenshot(name + '-menu.png');
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await expect
        .poll(() =>
          page.evaluate(() => window.pirateBattle?.observe().hud.state),
        )
        .toBe('running');
      await page.evaluate(() => window.pirateBattle?.advance(6000));
      await readyArtwork(page);
      await expect(page).toHaveScreenshot(name + '-arena.png');
      await page.evaluate(() => window.pirateBattle?.advance(120000));
      await expect(
        page.getByRole('heading', { name: 'Defeated', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('status')).toHaveText('Match saved.');
      await readyArtwork(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
      await expect(page).toHaveScreenshot(name + '-result.png');
      expect(errors).toEqual([]);
    },
  );
}
