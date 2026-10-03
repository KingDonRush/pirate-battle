import { expect, test, type Page } from '@playwright/test';
import { angleDifference, canOccupy } from '../../src/game/geometry';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { ReflowCoordinator } from '../../src/game/reflow';

test('G09 a layout generation snapshots measurements without following mutable coordinates', () => {
  const measured = { x: 540, y: 370 };
  const reflow = new ReflowCoordinator(
    true,
    () => {},
    () => {},
  );
  reflow.request(1440, 900, 0, 0, [measured]);
  const initial = reflow.update(100);
  measured.y = -500;
  expect(reflow.update(200)).toEqual(initial);
  reflow.request(1366, 768, 0, 300, [measured]);
  const resized = reflow.update(400);
  expect(resized.scale).toBeLessThan(initial.scale);
  measured.y = 370;
  expect(reflow.update(500)).toEqual(resized);
});

test('G05 standard enemies keep attacking a player parked at the actual north boundary', async ({
  page,
}, info) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await start(page, info.project.name === 'chromium-mobile');
  const initial = await page.evaluate(() => window.pirateBattle!.observe());
  await hold(page, 'w', 1000);
  await hold(page, 'w', 4000);
  const edge = await page.evaluate(() => window.pirateBattle!.observe());
  expect(edge.player.y - edge.arenaBounds.y).toBeLessThan(65);
  let attacked = edge;
  for (
    let step = 0;
    step < 100 && attacked.shots.enemy === 0 && !attacked.endReason;
    step++
  ) {
    await page.evaluate(() => window.pirateBattle!.advance(200));
    attacked = await page.evaluate(() => window.pirateBattle!.observe());
  }
  await info.attach('actual-boundary-enemy-attack', {
    body: JSON.stringify({ initial, edge, attacked }),
    contentType: 'application/json',
  });
  expect(attacked.view).toEqual(initial.view);
  expect(attacked.arenaBounds).toEqual(initial.arenaBounds);
  expect(attacked.shots.enemy).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('boundary-enemy-attack.png') });
});

async function start(page: Page, mobile: boolean) {
  await page.setViewportSize(
    mobile ? { width: 844, height: 390 } : { width: 1440, height: 900 },
  );
  await page.goto('/?seed=42&clock=manual');
  await page
    .getByRole('button', { name: 'Play as guest', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.pirateBattle?.observe().hud.state))
    .toBe('running');
}

async function hold(page: Page, key: string, milliseconds: number) {
  await page.keyboard.down(key);
  await page.evaluate((ms) => window.pirateBattle!.advance(ms), milliseconds);
  await page.keyboard.up(key);
}

test('G03 approaching the visible edge keeps the camera fixed and allows turning into water', async ({
  page,
}, info) => {
  await start(page, info.project.name === 'chromium-mobile');
  const initial = await page.evaluate(() => window.pirateBattle!.observe());
  // Stay in the centre channel; finish with a diagonal heading at the boundary.
  await hold(page, 'w', 3000);
  await hold(page, 'd', 250);
  await hold(page, 'w', 500);
  const edge = await page.evaluate(() => window.pirateBattle!.observe());
  await hold(page, 'a', 500);
  const turned = await page.evaluate(() => window.pirateBattle!.observe());
  await info.attach('edge-observations', {
    body: JSON.stringify({ initial, edge, turned }),
    contentType: 'application/json',
  });
  expect(edge.endReason).toBeNull();
  expect(edge.player.y - edge.arenaBounds.y).toBeLessThan(65);
  expect(edge.view).toEqual(initial.view);
  expect(edge.arenaBounds).toEqual(initial.arenaBounds);
  expect(turned.view).toEqual(initial.view);
  expect(
    Math.abs(angleDifference(turned.player.heading, -Math.PI / 4)),
  ).toBeLessThanOrEqual(Math.PI / 60 + 1e-6);
  expect(
    canOccupy(
      turned.player,
      turned.player.heading,
      createConfig(DEFAULT_SETTINGS),
      turned.arenaBounds,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('north-edge.png') });
});

for (const [name, commands] of [
  [
    'east',
    [
      ['w', 334],
      ['d', 500],
    ],
  ],
  ['south', [['d', 1000]]],
  [
    'west',
    [
      ['d', 1000],
      ['w', 200],
      ['d', 500],
    ],
  ],
] as const) {
  test(
    'G03 turn away from the visible ' +
      name +
      ' edge without an expanding camera',
    async ({ page }, info) => {
      await start(page, info.project.name === 'chromium-mobile');
      const initial = await page.evaluate(() => window.pirateBattle!.observe());
      // Use open-water corridors with full turning clearance from the islands.
      for (const [key, milliseconds] of commands)
        await hold(page, key, milliseconds);
      await hold(page, 'w', 7500);
      const edge = await page.evaluate(() => window.pirateBattle!.observe());
      await hold(page, 'd', 1000);
      const turned = await page.evaluate(() => window.pirateBattle!.observe());
      await info.attach('edge-turn-observations', {
        body: JSON.stringify({ initial, edge, turned }),
        contentType: 'application/json',
      });
      expect(edge.endReason).toBeNull();
      expect(edge.view).toEqual(initial.view);
      expect(turned.view).toEqual(initial.view);
      expect(
        Math.abs(
          angleDifference(turned.player.heading, edge.player.heading + Math.PI),
        ),
      ).toBeLessThanOrEqual(Math.PI / 60 + 1e-6);
      expect(
        canOccupy(
          turned.player,
          turned.player.heading,
          createConfig(DEFAULT_SETTINGS),
          turned.arenaBounds,
        ),
      ).toBe(true);
      await hold(page, 'w', 500);
      const escaped = await page.evaluate(() => window.pirateBattle!.observe());
      expect(
        Math.hypot(
          escaped.player.x - turned.player.x,
          escaped.player.y - turned.player.y,
        ),
      ).toBeGreaterThan(60);
    },
  );
}

test('G05 standard Shooters keep aiming and firing at a player beside the edge and coast', async ({
  page,
}, info) => {
  test.setTimeout(process.env.CI ? 180000 : 60000);
  await start(page, info.project.name === 'chromium-mobile');
  await hold(page, 'd', 250);
  await hold(page, 'w', 4000);
  const samples = [];
  let shots = 0;
  for (let step = 0; step < 80 && shots === 0; step++) {
    const state = await page.evaluate(() => window.pirateBattle!.observe());
    samples.push(state);
    shots = state.shots.enemy;
    if (state.endReason) break;
    if (shots === 0)
      await page.evaluate(() => window.pirateBattle!.advance(200));
  }
  await info.attach('edge-enemy-observations', {
    body: JSON.stringify(samples),
    contentType: 'application/json',
  });
  expect(
    samples.some((state) =>
      state.enemies.some((ship) => ship.kind === 'shooter'),
    ),
  ).toBe(true);
  expect(shots).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('edge-shooter.png') });
});
