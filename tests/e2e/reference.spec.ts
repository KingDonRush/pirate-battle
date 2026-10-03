import { test, expect } from '@playwright/test';
import { readyArtwork } from '../support/artwork';
test('review reference-size menu, options, log, arena, pause and result', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'chromium-desktop',
    'Native reference comparison uses desktop DPR 1.',
  );
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.goto('/?seed=42&clock=manual');
  await page.getByLabel('Display name').fill('Captain Jack');
  await readyArtwork(page);
  await page.screenshot({ path: info.outputPath('menu.png') });
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await readyArtwork(page);
  await page.screenshot({ path: info.outputPath('options.png') });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('tab', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Captain Flint');
  await readyArtwork(page);
  await page.screenshot({ path: info.outputPath('ranking.png') });
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await readyArtwork(page);
  await page.screenshot({ path: info.outputPath('arena.png') });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await readyArtwork(page);
  await page.screenshot({ path: info.outputPath('pause.png') });
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await page.evaluate(() => window.pirateBattle?.advance(120000));
  await expect(
    page.getByRole('button', { name: 'Play Again', exact: true }),
  ).toBeVisible();
  await readyArtwork(page);
  await expect(page.getByRole('status')).toHaveText('Match saved.');
  await page.screenshot({ path: info.outputPath('result.png') });
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByText('Network conditions', { exact: true }).click();
  await page
    .getByLabel('Scenario', { exact: true })
    .selectOption('multiple-pages');
  await page.getByRole('tab', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Page 1 of 4');
  await readyArtwork(page);
  await page.screenshot({ path: info.outputPath('history.png') });
});
