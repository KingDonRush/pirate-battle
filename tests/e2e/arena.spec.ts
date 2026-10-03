import { expect, test, type Page } from '@playwright/test';
import type { GameRuntime } from '../../src/game/runtime';
type Observation = ReturnType<GameRuntime['observe']>;
async function observe(page: Page): Promise<Observation> {
  return page.evaluate(() => {
    const state = window.pirateBattle?.observe();
    if (!state) throw new Error('No running arena');
    return state;
  });
}
async function start(page: Page, manual = false) {
  await page.clock.install({ time: new Date('2026-10-02T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-02T12:00:00.100Z'));
  await page.goto('/?seed=42' + (manual ? '&clock=manual' : ''));
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return page
        .getByRole('button', { name: 'Pause', exact: true })
        .isVisible();
    })
    .toBe(true);
  await page.clock.runFor(1000);
  await expect
    .poll(async () => (await observe(page)).hud.state)
    .toBe('running');
}
test('G01 name, guest identity, options validation and persistence', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Display name').fill('<invalid>');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('2–24');
  await expect(page.getByLabel('Display name')).toBeFocused();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByLabel('Game session time', { exact: true }).fill('59');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('60 to 180');
  await page.getByLabel('Game session time', { exact: true }).fill('180');
  await page.getByLabel('Enemy spawn time', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('0.75');
  await page.getByLabel('Enemy spawn time', { exact: true }).fill('0.75');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByLabel('Game session time', { exact: true }),
  ).toHaveValue('180');
  await expect(
    page.getByLabel('Enemy spawn time', { exact: true }),
  ).toHaveValue('0.75');
});
test('G03 actual forward motion, rotation, island and arena constraints', async ({
  page,
}) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await start(page, true);
  const first = await observe(page);
  await page.keyboard.down('w');
  await page.evaluate((ms) => window.pirateBattle?.advance(ms), 1000);
  await page.keyboard.up('w');
  const moved = await observe(page);
  expect(moved.player.y).toBeLessThan(first.player.y - 130);
  await page.keyboard.down('d');
  await page.evaluate((ms) => window.pirateBattle?.advance(ms), 500);
  await page.keyboard.up('d');
  // A key edge can straddle one fixed 1/60-second step.
  expect(
    Math.abs((await observe(page)).player.heading - Math.PI / 2),
  ).toBeLessThanOrEqual(Math.PI / 60 + 1e-6);
  await page.keyboard.down('a');
  await page.evaluate((ms) => window.pirateBattle?.advance(ms), 500);
  await page.keyboard.up('a');
  await page.keyboard.down('w');
  await page.evaluate((ms) => window.pirateBattle?.advance(ms), 4000);
  await page.keyboard.up('w');
  const north = await observe(page);
  const edge = north.arenaBounds.y + 62.4;
  expect(north.player.y).toBeGreaterThanOrEqual(edge - 1e-6);
  expect(north.player.y).toBeLessThan(edge + 2.5);
  expect(north.player.x).toBeCloseTo(first.player.x);
});
test('G07 pause and explicit resume clear held input and time debt', async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down('w');
  await page.clock.runFor(300);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Paused', exact: true }),
  ).toBeVisible();
  const paused = await observe(page);
  await page.clock.runFor(5000);
  expect((await observe(page)).elapsed).toBe(paused.elapsed);
  await page.keyboard.up('w');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(200);
  const resumed = await observe(page);
  expect(resumed.elapsed - paused.elapsed).toBeLessThan(0.25);
  expect(resumed.player.y).toBe(paused.player.y);
});
test('G09 latest reflow wins, time freezes, and exit releases the arena', async ({
  page,
}) => {
  await start(page);
  await page.keyboard.down('w');
  await page.clock.runFor(200);
  const initialRevision = (await observe(page)).hud.reflowRevision;
  await page.setViewportSize({ width: 360, height: 640 });
  // Browser viewport commands and native resize delivery have separate clocks.
  // Establish the actual freeze before comparing simulation time across targets.
  await expect
    .poll(async () => {
      const state = await observe(page);
      return (
        state.hud.state === 'reflowing' &&
        state.hud.reflowRevision > initialRevision
      );
    })
    .toBe(true);
  const frozen = await observe(page);
  await page.clock.runFor(20);
  await page.setViewportSize({ width: 667, height: 375 });
  await expect
    .poll(async () => (await observe(page)).hud.reflowRevision)
    .toBeGreaterThan(frozen.hud.reflowRevision);
  const intermediate = await observe(page);
  expect(intermediate.hud.state).toBe('reflowing');
  expect(intermediate.elapsed).toBe(frozen.elapsed);
  await page.clock.runFor(20);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => (await observe(page)).hud.reflowRevision)
    .toBeGreaterThan(intermediate.hud.reflowRevision);
  await page.clock.runFor(100);
  const changing = await observe(page);
  expect(changing.hud.state).toBe('reflowing');
  expect(changing.elapsed).toBe(frozen.elapsed);
  await page.clock.runFor(500);
  const settled = await observe(page);
  expect(settled.hud.state).toBe('running');
  expect(settled.view?.angle).toBeCloseTo(Math.PI / 2);
  expect(settled.player.x).toBe(frozen.player.x);
  expect(settled.player.y).toBe(frozen.player.y);
  expect(settled.input.forward).toBe(false);
  await page.keyboard.up('w');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Leave match', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.pirateBattle)).toBeUndefined();
});

test.describe('routed asset failure', () => {
  test.use({ serviceWorkers: 'block' });
  test('G02 failed asset can be retried', async ({ page, context }) => {
    let fail = true;
    await context.route('**/ships_miscellaneous_sheet*.png*', (route) =>
      fail &&
      route.request().resourceType() !== 'script' &&
      !/[?&](?:url|import)(?:[=&]|$)/.test(route.request().url())
        ? route.abort()
        : route.continue(),
    );
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Play as guest', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'The arena could not load' }),
    ).toBeVisible();
    fail = false;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toBeVisible();
  });
});
test('G03 hull stops at the visible island coast', async ({ page }) => {
  await start(page, true);
  for (const [key, ms] of [
    ['d', 1000],
    ['w', 200],
    ['d', 500],
    ['w', 2267],
    ['d', 500],
    ['w', 2000],
  ] as const) {
    await page.keyboard.down(key);
    await page.evaluate((value) => window.pirateBattle?.advance(value), ms);
    await page.keyboard.up(key);
  }
  const atCoast = await observe(page);
  // Main island's south coast y=312 plus the actual 62.4-unit capsule support.
  expect(atCoast.player.y).toBeGreaterThanOrEqual(374.4);
  expect(atCoast.player.y).toBeLessThan(377);
});
test('review first arena at portrait and landscape sizes', async ({
  page,
}, testInfo) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await page.goto('/');
  await page.screenshot({
    path: testInfo.outputPath('menu.png'),
    fullPage: true,
  });
  await start(page);
  for (const [width, height] of [
    [320, 568],
    [568, 320],
    [768, 1024],
    [1280, 720],
  ]) {
    if (width === undefined || height === undefined) continue;
    await page.setViewportSize({ width, height });
    await page.clock.runFor(500);
    await page.screenshot({
      path: testInfo.outputPath('arena-' + width + '.png'),
    });
    const layout = await page.evaluate(() => {
      const host = document
        .querySelector('.arena-viewport')
        ?.getBoundingClientRect();
      const targets = [
        ...document.querySelectorAll('.controls button,.battle-hud'),
      ]
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0);
      return {
        overflow:
          document.documentElement.scrollWidth > innerWidth ||
          document.documentElement.scrollHeight > innerHeight,
        allVisible: targets.every(
          (r) =>
            r.left >= 0 &&
            r.top >= 0 &&
            r.right <= innerWidth &&
            r.bottom <= innerHeight,
        ),
        host: { width: host?.width ?? 0, height: host?.height ?? 0 },
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.allVisible).toBe(true);
    expect(layout.host.width).toBeGreaterThan(250);
  }
});

test('G09 independent simultaneous touch contributions and native cancellation', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Native simultaneous contacts use Chromium CDP; the Firefox project covers keyboard input.',
  );
  await start(page);
  const viewport = page.viewportSize()!;
  const move = { x: viewport.width * 0.65, y: viewport.height * 0.55 };
  const fire = await page
    .getByRole('button', { name: 'Fire forward', exact: true })
    .boundingBox();
  if (!fire) throw new Error('Missing touch control bounds');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x: move.x, y: move.y },
      { id: 2, x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { id: 1, x: move.x - 40, y: move.y - 40 },
      { id: 2, x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 },
    ],
  });
  await page.clock.runFor(300);
  const held = await observe(page);
  expect(held.input).toMatchObject({ forward: true, turn: 0, front: true });
  expect(held.input.heading).toBeCloseTo(
    -Math.PI / 4 - (held.view?.angle ?? 0),
  );
  expect(held.player.heading).toBeLessThan(-0.7);
  await page.keyboard.down('w');
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  expect((await observe(page)).input).toMatchObject({
    forward: true,
    turn: 0,
    front: false,
  });
  await page.keyboard.up('w');
  await cdp.detach();
  expect((await observe(page)).input.forward).toBe(false);
});

test.describe('routed pending asset', () => {
  test.use({ serviceWorkers: 'block' });
  test('G02 leaving a pending asset load cannot attach its late canvas', async ({
    page,
    context,
  }) => {
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let intercepted = false;
    await context.route('**/ships_miscellaneous_sheet*.png*', async (route) => {
      if (
        route.request().resourceType() === 'script' ||
        /[?&](?:url|import)(?:[=&]|$)/.test(route.request().url())
      ) {
        await route.continue();
        return;
      }
      intercepted = true;
      await pending;
      await route.continue();
    });
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Play as guest', exact: true })
      .click();
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect.poll(() => intercepted).toBe(true);
    await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
    release();
    await expect(
      page.getByRole('button', { name: 'Play', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Play as guest', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect((await observe(page)).resources.applications).toBe(1);
  });
});
