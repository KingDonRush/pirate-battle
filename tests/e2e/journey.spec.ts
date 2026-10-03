import { test, expect, type Page } from '@playwright/test';

async function start(page: Page, duration = 120, controlled = false) {
  if (controlled) {
    await page.clock.install({ time: new Date('2026-10-02T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-02T12:00:00.100Z'));
  }
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
    .poll(
      async () => {
        if (controlled) await page.clock.runFor(100);
        return page.evaluate(() => window.pirateBattle?.observe().hud.state);
      },
      { timeout: 15000 },
    )
    .toBe('running');
}
test('G07 reflow suspends projectiles, cooldowns and spawns; manual pause prevails', async ({
  page,
}) => {
  await start(page, 120, true);
  await page.keyboard.down(' ');
  await page.keyboard.down('q');
  await page.evaluate(() => window.pirateBattle?.advance(3500));
  await page.keyboard.up(' ');
  await page.keyboard.up('q');
  await page.setViewportSize({ width: 360, height: 640 });
  await page.clock.runFor(20);
  await page.setViewportSize({ width: 667, height: 375 });
  await page.clock.runFor(20);
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('reflowing');
  const frozen = await page.evaluate(() => window.pirateBattle?.observe());
  await page.evaluate(() => window.pirateBattle?.advance(3000));
  const still = await page.evaluate(() => window.pirateBattle?.observe());
  expect(still?.elapsed).toBe(frozen?.elapsed);
  expect(still?.projectiles).toEqual(frozen?.projectiles);
  expect(still?.cooldowns).toEqual(frozen?.cooldowns);
  expect(still?.enemies).toEqual(frozen?.enemies);
  expect(still?.nextSpawn).toBe(frozen?.nextSpawn);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(500);
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('paused');
  await page.evaluate(() => window.pirateBattle?.advance(1000));
  expect(
    await page.evaluate(() => window.pirateBattle?.observe().elapsed),
  ).toBe(frozen?.elapsed);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  const resumed = await page.evaluate(() => window.pirateBattle?.observe());
  expect(resumed?.input).toMatchObject({
    forward: false,
    front: false,
    left: false,
    right: false,
  });
});
test('G02 asynchronous renderer replacement accepts only the current mount', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.E2E_SERVER === 'dev',
    'Vite development prebundles the renderer; the actual renderer chunk gate is verified in the optimized build.',
  );
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let intercepted = false;
  await context.route('**/WebGLRenderer*.js*', async (route) => {
    intercepted = true;
    await gate;
    await route.continue();
  });
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect.poll(() => intercepted).toBe(true);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  release();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => window.pirateBattle?.observe().resources.applications,
    ),
  ).toBe(1);
});
test('G02 audio download failure permits combat, gesture retry and bounded voices', async ({
  page,
  context,
}) => {
  let fail = true;
  await context.route('**/ocean_ambience_loop*.wav*', (route) =>
    fail && route.request().resourceType() !== 'script'
      ? route.abort()
      : route.continue(),
  );
  await start(page);
  await expect(
    page.getByRole('button', { name: 'Retry sound', exact: true }),
  ).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Retry sound', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.pirateBattle?.observe().resources.audio.loops),
    )
    .toBe(2);
  await expect(
    page.getByRole('button', { name: 'Retry sound', exact: true }),
  ).toHaveCount(0);
  await page.keyboard.down(' ');
  await page.keyboard.down('q');
  await page.keyboard.down('e');
  await page.evaluate(() => window.pirateBattle?.advance(5000));
  await page.keyboard.up(' ');
  await page.keyboard.up('q');
  await page.keyboard.up('e');
  expect(
    await page.evaluate(
      () => window.pirateBattle?.observe().resources.audio.voices,
    ),
  ).toBeLessThanOrEqual(14);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => window.pirateBattle?.observe().resources.audio.state),
    )
    .toBe('suspended');
});

test('G02 renderer module failure exposes recovery without a late canvas', async ({
  page,
  context,
}) => {
  test.skip(
    process.env.E2E_SERVER === 'dev',
    'Vite development prebundles the renderer; the actual renderer chunk gate is verified in the optimized build.',
  );
  let fail = true;
  await context.route('**/WebGLRenderer*.js*', (route) =>
    fail ? route.abort() : route.continue(),
  );
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The arena could not load' }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => window.pirateBattle?.observe().resources.pendingApplications,
    ),
  ).toBe(0);
});

declare global {
  interface Window {
    restoreGraphics?: () => void;
  }
}
test('G07 native WebGL interruption freezes combat and requires explicit recovery', async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => window.pirateBattle?.advance(1000));
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext;
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension)
      throw new Error('Context interruption extension unavailable');
    window.restoreGraphics = () => extension.restoreContext();
    extension.loseContext();
  });
  await expect(
    page.getByRole('dialog', { name: 'Paused', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Resume', exact: true }),
  ).toBeDisabled();
  const frozen = await page.evaluate(() => window.pirateBattle?.observe());
  await page.evaluate(() => window.pirateBattle?.advance(5000));
  expect(
    await page.evaluate(() => window.pirateBattle?.observe().elapsed),
  ).toBe(frozen?.elapsed);
  await page.evaluate(() => {
    window.restoreGraphics?.();
    delete window.restoreGraphics;
  });
  await expect(
    page.getByRole('button', { name: 'Resume', exact: true }),
  ).toBeEnabled({ timeout: 10000 });
  expect(
    await page.evaluate(() => window.pirateBattle?.observe().hud.state),
  ).toBe('paused');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await page.evaluate(() => window.pirateBattle?.advance(100));
  expect(
    await page.evaluate(() => window.pirateBattle?.observe().elapsed),
  ).toBeGreaterThan(frozen?.elapsed ?? 0);
});

test('G02 lazy battle module failure has a recovery boundary', async ({
  page,
  context,
}) => {
  let fail = true;
  await context.route(
    (url) =>
      /\/(?:assets\/GameScreen-[^/]+\.js|src\/ui\/GameScreen\.tsx)$/.test(
        url.pathname,
      ),
    (route) => (fail ? route.abort() : route.continue()),
  );
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'The arena could not load' }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
  await expect(page.locator('canvas')).toHaveCount(1);
});
