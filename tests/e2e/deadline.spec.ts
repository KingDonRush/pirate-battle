import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_SETTINGS, createConfig } from '../../src/game/config';
import { pilotInput } from '../support/pilot';
import { KeyboardPilot } from '../support/browser-pilot';
test.use({
  trace: {
    mode: 'retain-on-failure',
    screenshots: false,
    snapshots: false,
    sources: true,
  },
});
async function start(page: Page, duration = 120) {
  await page.goto('/?seed=42&clock=manual');
  if (duration !== 120) {
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await page
      .getByLabel('Game session time', { exact: true })
      .fill(String(duration));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
  }
  await page.getByLabel('Display name').fill('Captain Coral-Wind 12345');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
}
test('G06 real keyboard battle reaches Time up and restarts with new identity', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await start(page, 60);
  const initial = await page.evaluate(() => window.pirateBattle?.observe());
  if (!initial) throw new Error('Missing initial world');
  const pilot = new KeyboardPilot(page);
  const config = createConfig({ ...DEFAULT_SETTINGS, duration: 60 });
  for (let i = 0; i < 1500; i++) {
    const observed = await page.evaluate(() => window.pirateBattle?.observe());
    if (!observed) break;
    const input = pilotInput(observed, config);
    await pilot.apply(input);
    const interval =
      observed.enemies.length === 0 ? 500 : input.turn === 0 ? 150 : 50;
    await page.evaluate((ms) => window.pirateBattle?.advance(ms), interval);
  }
  await pilot.release();
  await expect(
    page.getByRole('heading', { name: 'Battle complete', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.result-summary')).toContainText('1:00');
  await expect(page.locator('.result-summary')).toContainText('Time up');
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const next = await page.evaluate(() => window.pirateBattle?.observe());
  expect(next?.matchId).not.toBe(initial.matchId);
  expect(next?.elapsed).toBe(0);
  expect(next?.player.health).toBe(100);
  expect(next?.score).toBe(0);
  expect(next?.enemies).toEqual([]);
  expect(errors).toEqual([]);
});
