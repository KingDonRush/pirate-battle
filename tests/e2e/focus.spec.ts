import { expect, test, type Page } from '@playwright/test';
test.use({ headless: false });
async function observe(page: Page) {
  return page.evaluate(() => {
    const value = window.pirateBattle?.observe();
    if (!value) throw new Error('No active arena');
    return value;
  });
}
async function start(page: Page) {
  await page.clock.install({ time: new Date('2026-10-02T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-02T12:00:00.100Z'));
  await page.goto('/?seed=42');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible();
  await page.clock.runFor(500);
}
test('G07 a real tab switch pauses and returning does not resume', async ({
  browser,
}) => {
  for (const mobile of [false, true]) {
    const context = await browser.newContext(
      mobile
        ? {
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
          }
        : {},
    );
    const page = await context.newPage();
    await start(page);
    await page.keyboard.down('w');
    await page.clock.runFor(100);
    const protocol = await context.newCDPSession(page);
    await protocol.send('Emulation.setFocusEmulationEnabled', {
      enabled: false,
    });
    await page.bringToFront();
    const info = await protocol.send('Target.getTargetInfo');
    const opened = context.waitForEvent('page');
    await protocol.send('Target.createTarget', {
      url: 'about:blank',
      newWindow: false,
      ...(info.targetInfo.browserContextId
        ? { browserContextId: info.targetInfo.browserContextId }
        : {}),
    });
    const other = await opened;
    await other.goto('/');
    await other.bringToFront();
    await expect(
      page.getByRole('dialog', { name: 'Paused', exact: true }),
    ).toBeVisible();
    const paused = await observe(page);
    await page.clock.runFor(2000);
    expect((await observe(page)).elapsed).toBe(paused.elapsed);
    await page.bringToFront();
    expect((await observe(page)).hud.state).toBe('paused');
    await other.close();
    await page.keyboard.up('w');
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(100);
    expect((await observe(page)).elapsed - paused.elapsed).toBeLessThan(0.15);
    await context.close();
  }
});
