import { test, expect, type Page } from '@playwright/test';
async function start(page: Page, manual = true) {
  await page.goto('/?seed=42' + (manual ? '&clock=manual' : ''));
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
}
test('G03 different frame partitions preserve fixed-step movement and fractional debt', async ({
  browser,
}) => {
  const results: unknown[] = [];
  for (const frames of [[1000], [137, 163, 43, 157, 211, 289]]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await start(page);
      await page.keyboard.down('w');
      await page.keyboard.down('d');
      for (const ms of frames)
        await page.evaluate((value) => window.pirateBattle?.advance(value), ms);
      await page.keyboard.up('w');
      await page.keyboard.up('d');
      results.push(
        await page.evaluate(() => {
          const state = window.pirateBattle!.observe();
          return {
            player: state.player,
            elapsed: state.elapsed,
            score: state.score,
            shots: state.shots,
          };
        }),
      );
    } finally {
      await context.close();
    }
  }
  expect(results[1]).toEqual(results[0]);
});
test('G03 a stalled animation frame caps active catchup but records the raw interval', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-02T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-02T12:00:00.100Z'));
  await page.goto('/?seed=42');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(
      async () => {
        await page.clock.runFor(100);
        return page.evaluate(() => window.pirateBattle?.observe().hud.state);
      },
      { timeout: 15000 },
    )
    .toBe('running');
  await page.clock.runFor(500);
  const before = await page.evaluate(
    () => window.pirateBattle!.observe().elapsed,
  );
  await page.keyboard.down('w');
  await page.clock.fastForward(10000);
  await page.keyboard.up('w');
  const after = await page.evaluate(() => window.pirateBattle!.observe(true));
  expect(after.elapsed - before).toBeLessThanOrEqual(0.251);
  expect(after.elapsed - before).toBeGreaterThan(0.23);
  expect(Math.max(...after.frames)).toBeGreaterThan(9990);
});
